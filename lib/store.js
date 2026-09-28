import fs from "fs";
import path from "path";
import { seed, SIBLING_DISCOUNT_RATE, TERM, defaultStaffAccounts } from "./seed.js";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

let cache = null;
let dirty = false;
let persisted = true;
let persistWarned = false;

// Serverless hosts (Vercel, Netlify) have read-only filesystems outside /tmp,
// so file writes fail there. Degrade to in-memory mode instead of 500ing -
// the app keeps working, data just resets on restart. Real production
// needs Postgres (see README) or a host with a persistent disk.
function persistNote(e, what) {
  persisted = false;
  if (persistWarned) return;
  persistWarned = true;
  console.warn(`[store] ${what}: ${e?.code || e?.message} - running in-memory only; data resets on restart.`);
}

export function persistenceMode() {
  return persisted ? "file" : "memory";
}

// reconcile() is not purely derived: auto-onboarding creates family accounts,
// student-portal credentials, invite SMSes and audit entries as a side effect of
// a *read*. Mark those so getDB() can flush them straight to disk.
function touch() {
  dirty = true;
}

// First-boot database: school configuration + the staff roster as invite-
// style accounts. The one-time setup links are printed to the server console
// — see docs/first-sign-in.md.
function freshDB() {
  const db = seed();
  const base = String(db.meta?.inviteLink || "https://portal.gill.ac.ug").replace(/\/$/, "");
  console.log("[gill-os] database seeded — staff one-time setup links (also in Admin → Staff Accounts):");
  for (const a of db.staffAccounts) {
    const u = db.users.find((x) => x.id === a.userId);
    console.log(`[gill-os]   ${(u?.name || a.email).padEnd(22)} ${a.email} → ${base}/staff/setup?invite=${a.inviteToken}`);
  }
  return db;
}

export function getDB() {
  if (!cache) {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      if (!fs.existsSync(DB_FILE)) {
        cache = freshDB();
        saveDB();
      } else {
        try {
          cache = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
        } catch (parseErr) {
          try {
            const bak = DB_FILE + ".corrupt-" + Date.now() + ".json";
            fs.copyFileSync(DB_FILE, bak);
            console.warn(`[store] db.json was corrupt; backed up to ${bak} and reseeded.`);
          } catch { persistNote(parseErr, "db.json unreadable"); }
          cache = freshDB();
        }
      }
    } catch (e) {
      persistNote(e, "storage unavailable");
      if (!cache) cache = freshDB();
    }
  }
  // Re-derive totals, discounts, indices & stats on every read so the
  // response always reflects the latest mutations (idempotent).
  dirty = false;
  cache = reconcile(cache);
  // Anything reconcile() created during this read MUST be persisted before we
  // return it. Otherwise it lives only in this process's memory: a dev-server
  // recompile, a deploy or a crash resets the cache, reconcile() runs again and
  // generates a *fresh* invite token — silently killing every invite link that
  // was already SMS'd to a parent ("that invite link isn't recognised").
  if (dirty) saveDB();
  return cache;
}

// Public snapshot for clients: identical to getDB() minus secrets.
// Passwords, verification codes and reset codes must never leave the server
// — every auth check happens in API routes, never in the UI. (Family invite
// *tokens* stay: the Admissions console links them for support, and a token
// alone can't sign in — the code still goes to the parent's phone/email.)
export function getPublicDB() {
  const db = structuredClone(getDB());
  for (const a of db.staffAccounts || []) {
    delete a.password; delete a.reset; delete a.verification;
  }
  for (const a of db.familyAccounts || []) {
    delete a.password; delete a.reset; delete a.verification;
  }
  for (const a of db.studentAccounts || []) {
    delete a.password; delete a.reset;
  }
  db.meta = { ...db.meta, storage: persistenceMode() };
  return db;
}

export function saveDB() {
  if (!cache) return;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(cache, null, 2));
  } catch (e) {
    persistNote(e, "cannot write db.json");
  } finally {
    dirty = false;
  }
}

// Recompute business rules every time state is read (idempotent).
function reconcile(db) {
  db.meta = db.meta || {};

  // 1) Sibling discounts: any family with children on BOTH campuses
  //    gets 10% off the Pre-School tuition line on every open invoice.
  for (const inv of db.invoices) {
    const fam = db.families.find((f) => f.id === inv.familyId);
    if (!fam) continue;
    const hasMain = fam.children.some((c) => c.campus === "main" && c.enrolled);
    const hasPre = fam.children.some((c) => c.campus === "preschool" && c.enrolled);
    const discount = hasMain && hasPre ? Math.round(450000 * SIBLING_DISCOUNT_RATE) : 0;
    inv.siblingDiscount = discount;
    let total = 0;
    for (const line of inv.lines) {
      line.discount = line.kind === "tuition" && line.studentId && fam.children.find((c) => c.id === line.studentId)?.campus === "preschool" && hasMain && hasPre ? discount : 0;
      total += line.amount - line.discount;
    }
    inv.total = total;
    inv.balance = Math.max(0, inv.total - inv.paid);
  }

  // 2) Derived family/student lookup helpers available in state
  db.byFamily = {};
  for (const fam of db.families) db.byFamily[fam.id] = fam;
  db.studentIndex = {};
  for (const fam of db.families)
    for (const c of fam.children) db.studentIndex[c.id] = { ...c, familyId: fam.id, familyName: fam.name };
  db.accountByStudent = {};
  for (const a of db.studentAccounts || []) db.accountByStudent[a.studentId] = a;
  db.familyAccountByFamily = {};
  for (const fa of db.familyAccounts || []) db.familyAccountByFamily[fa.familyId] = fa;

  // 2a) STAFF ROSTER BACKFILL (idempotent — safe on every read):
  //     any roster member missing from the database is created INVITE-STYLE
  //     (no password; one-time setup link). Also migrates legacy @gill.sch
  //     addresses and old portal.gillschool.ac.ug links to the real domain.
  db.staffAccounts = db.staffAccounts || [];
  for (const a of defaultStaffAccounts()) {
    if (!db.staffAccounts.some((x) => x.userId === a.userId || x.email === a.email)) {
      touch();
      db.staffAccounts.push({ ...a });
    }
  }
  for (const u of db.users || []) {
    if (typeof u.email === "string" && u.email.endsWith("@gill.sch")) {
      touch();
      u.email = u.email.replace("@gill.sch", "@gill.ac.ug");
    }
  }
  for (const a of db.staffAccounts) {
    if (typeof a.email === "string" && a.email.endsWith("@gill.sch")) {
      touch();
      a.email = a.email.replace("@gill.sch", "@gill.ac.ug");
    }
    if (a.verified == null) { touch(); a.verified = true; }
    if (!a.status) { touch(); a.status = "active"; }
  }
  // Derived password-strength flags (idempotent): lets the Security console
  // count legacy passwords without ever receiving the passwords themselves.
  for (const a of db.staffAccounts) {
    a.authStrength = !a.password ? "unset" : String(a.password).startsWith("scrypt$") ? "hashed" : "legacy";
  }
  for (const fa of db.familyAccounts || []) {
    fa.authStrength = !fa.password ? "unset" : String(fa.password).startsWith("scrypt$") ? "hashed" : "legacy";
  }
  if (typeof db.meta?.inviteLink === "string" && db.meta.inviteLink.includes("gillschool.ac.ug")) {
    touch();
    db.meta.inviteLink = db.meta.inviteLink.replace("gillschool.ac.ug", "gill.ac.ug");
  }
  for (const fa of db.familyAccounts || []) {
    if (typeof fa.inviteLink === "string" && fa.inviteLink.includes("gillschool.ac.ug")) {
      touch();
      fa.inviteLink = fa.inviteLink.replace("gillschool.ac.ug", "gill.ac.ug");
    }
  }
  db.staffAccountByEmail = {};
  for (const a of db.staffAccounts) db.staffAccountByEmail[String(a.email || "").toLowerCase()] = a;

  // 2b) AUTO ONBOARDING: a parent is uploaded onto the OS automatically once
  //     the admission requirements (form + verified documents) are complete
  //     and full tuition is cleared. An SMS with the OS link is sent to EVERY
  //     surviving parent on the admission form, and they all share ONE login.
  db.activatedNow = [];
  db.chats = db.chats || [];
  for (const app of db.applications || []) {
    const student = db.studentIndex[app.studentId];
    // Tenure over (left / completed): never auto-onboard or re-provision a
    // leaver — their accounts close with them and only the admin deletes
    // them. Registration itself is the one-time account creation event.
    if (student?.retirement) continue;
    const fam = db.families.find((f) => f.id === student?.familyId);
    const inv = fam ? db.invoices.find((i) => i.familyId === fam.id && i.term === TERM) : null;
    const docs = db.documents.filter((d) => d.studentId === app.studentId);
    const docsOK = docs.length > 0 && docs.every((d) => d.status === "verified");
    const tuitionOK = !!(inv && inv.total > 0 && inv.paid >= inv.total && inv.balance === 0);
    app.derived = { docsOK, tuitionOK, balance: inv?.balance ?? 0 };

    if (app.status !== "activated" && docsOK && tuitionOK) {
      const existing = db.familyAccountByFamily[fam.id];
      const now = new Date().toISOString();
      const parents = app.parentContacts.filter((p) => p.alive !== false);

      // A family that self-registered on /register holds an account in
      // "pending" state. Once docs + tuition are verified by the registrar we
      // activate the same login and SMS every parent the child-portal link.
      // A later child of an ALREADY-ACTIVE family follows the same path — each
      // admission provisions its own supervised child account.
      if (existing && existing.status !== "closed") {
        touch();
        if (existing.status === "pending") {
          existing.status = "active";
          existing.activatedAt = now;
        }
        app.status = "activated";
        app.activatedAt = now;

        const kidLink = ensureChildPortalLink(db, student, fam, existing);
        for (const p of parents) {
          db.deliveries.unshift({
            id: uid("d"),
            channel: "SMS",
            to: p.phone,
            ref: app.id,
            subject: `Admission verified — ${student.name} (${student.schoolId}). Family login: ${existing.username} · child's portal: ${kidLink}`,
            status: "delivered",
            provider: "MTN/Airtel SMS Gateway (simulated)",
            date: now,
          });
        }
        db.messages.push({
          id: uid("m"),
          from: "u-admin",
          to: fam.parentUserId,
          subject: `Admission verified — ${student.name}'s portal is ready`,
          body: `Good news, ${fam.name} family — ${student.name}'s admission is verified and tuition is cleared. Sign in with the family login "${existing.username}" (the password you chose at registration) and open ${student.name}'s supervised portal.`,
          date: now.slice(0, 10),
          read: false,
          channel: "email",
        });
        db.feesAudit.unshift({
          id: uid("fa"),
          date: now,
          actor: "System",
          action: `Verified admission — ${student.name} (${fam.name} family): admission complete + tuition cleared → child portal link sent to ${parents.length} parent number(s)`,
          amount: 0,
        });
        db.activatedNow.push({ familyId: fam.id, familyName: fam.name, username: existing.username, parents: parents.map((p) => ({ name: p.name, phone: p.phone })) });
      } else if (!existing) {
        touch();
        const username = `${fam.name.toLowerCase().replace(/\s+/g, ".")}.family`;
        const inviteToken = `INV-${fam.name.toUpperCase().slice(0, 4)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        const account = {
          id: uid("fa"),
          familyId: fam.id,
          username,
          password: "", // set by the family when they open the invite link
          status: "active",
          activatedAt: now,
          inviteLink: db.meta.inviteLink,
          inviteToken,
          passwordSet: false,
          verified: false,
          verification: null,
          members: parents.map((p) => p.userId),
        };
        db.familyAccounts.push(account);
        db.familyAccountByFamily[fam.id] = account;
        app.status = "activated";
        app.activatedAt = now;

        // Every verified admission also provisions the child's supervised
        // student-portal access, so the SMS includes the child-portal link.
        const kidLink = ensureChildPortalLink(db, student, fam, account);

        // SMS + in-app notice to EVERY surviving parent (they share one login).
        // The link opens the portal landing page, where they create a password
        // and verify with a code sent to their phone/email.
        const setupLink = `${db.meta.inviteLink}/setup?invite=${inviteToken}`;
        for (const p of parents) {
          db.deliveries.unshift({
            id: uid("d"),
            channel: "SMS",
            to: p.phone,
            ref: app.id,
            subject: `Welcome to Gill School OS — ${setupLink} · shared login: ${username} · ${student.name}'s portal: ${kidLink}`,
            status: "delivered",
            provider: "MTN/Airtel SMS Gateway (simulated)",
            date: now,
          });
        }
        db.messages.push({
          id: uid("m"),
          from: "u-admin",
          to: fam.parentUserId,
          subject: `Your Gill School OS account is ready — ${username}`,
          body: `Welcome, ${fam.name} family. Your admission is complete and tuition is cleared. Sign in at ${db.meta.inviteLink} with the shared family username "${username}". Every parent on the admission form (${parents.map((p) => p.name).join(", ")}) received the same login by SMS.`,
          date: new Date().toISOString().slice(0, 10),
          read: false,
          channel: "email",
        });
        db.feesAudit.unshift({
          id: uid("fa"),
          date: now,
          actor: "System",
          action: `Auto-onboarded ${fam.name} family: admission requirements complete + tuition cleared → OS account ${username} created, invite SMS sent to ${parents.length} parent number(s)`,
          amount: 0,
        });
        db.activatedNow.push({ familyId: fam.id, familyName: fam.name, username, parents: parents.map((p) => ({ name: p.name, phone: p.phone })) });
      }
    }
  }

  // 3) Per-term totals for the bursar dashboard
  db.stats = {
    currentTerm: TERM,
    invoices: db.invoices.filter((i) => i.term === TERM),
    families: db.families.length,
    students: Object.keys(db.studentIndex).length,
    lateFees: db.pickups.filter((p) => p.late).reduce((s, p) => s + p.fee, 0),
    pendingLeaves: db.leaves.filter((l) => l.status === "pending").length,
    pendingDocs: db.documents.filter((d) => d.status === "pending review").length,
    openTransitions: db.transitions.filter((t) => t.status === "initiated").length,
    ordersValue: db.orders.reduce((s, o) => s + o.total, 0),
    studentAccounts: (db.studentAccounts || []).filter((a) => a.status === "active").length,
    familyAccounts: (db.familyAccounts || []).filter((a) => a.status === "active").length,
    staffAccounts: (db.staffAccounts || []).filter((a) => a.status === "active").length,
    onboardingPending: (db.applications || []).filter((a) => a.status !== "activated").length,
    familyChats: db.chats.filter((c) => c.status === "active").length,
    verifiedFamilies: db.familyAccounts.filter((a) => a.verified).length,
  };
  return db;
}

// When an admission is verified, the child gets supervised student-portal
// access automatically (username + one-tap link). The parent's family login
// stays the single point of control; credentials can be reset in
// Parent Portal → Student Accounts.
function ensureChildPortalLink(db, student, fam, familyAccount) {
  if (!student || !fam) return `${db.meta.inviteLink}/student/login`;
  let sa = db.accountByStudent?.[student.id];
  if (!sa) {
    sa = {
      id: uid("sa"),
      studentId: student.id,
      username: student.name.toLowerCase().replace(/\s+/g, "."),
      password: "gill" + Math.floor(1000 + Math.random() * 9000),
      supervisedBy: fam.parentUserId,
      createdAt: new Date().toISOString().slice(0, 10),
      status: "active",
      perms: { progress: true, remarks: true, homework: true, library: true, calendar: true, messages: false, fees: false },
    };
    touch();
    db.studentAccounts = db.studentAccounts || [];
    db.studentAccounts.unshift(sa);
    if (!db.accountByStudent) db.accountByStudent = {};
    db.accountByStudent[student.id] = sa;
    db.feesAudit.unshift({
      id: uid("fa"), date: new Date().toISOString(), actor: "System",
      action: `Student portal provisioned for ${student.name} (${sa.username}) — supervised by ${fam.name} family`,
      amount: 0,
    });
  }
  return `${db.meta.inviteLink}/student/login?u=${encodeURIComponent(sa.username)}`;
}

export const fmtUGX = (n) =>
  "UGX " + (n || 0).toLocaleString("en-UG", { maximumFractionDigits: 0 });

export const fmtDate = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" });

export const uid = (prefix) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
