import fs from "fs";
import path from "path";
import { seed, SIBLING_DISCOUNT_RATE, TERM } from "./seed.js";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

let cache = null;

export function getDB() {
  if (!cache) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DB_FILE)) {
      cache = seed();
      saveDB();
    } else {
      cache = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    }
  }
  // Re-derive totals, discounts, indices & stats on every read so the
  // response always reflects the latest mutations (idempotent).
  cache = reconcile(cache);
  return cache;
}

export function saveDB() {
  if (!cache) return;
  fs.writeFileSync(DB_FILE, JSON.stringify(cache, null, 2));
}

export function resetDB() {
  cache = seed();
  saveDB();
  return cache;
}

// Recompute business rules every time state is read (idempotent).
function reconcile(db) {
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

  // 2b) AUTO ONBOARDING: a parent is uploaded onto the OS automatically once
  //     the admission requirements (form + verified documents) are complete
  //     and full tuition is cleared. An SMS with the OS link is sent to EVERY
  //     surviving parent on the admission form, and they all share ONE login.
  db.activatedNow = [];
  db.chats = db.chats || [];
  for (const app of db.applications || []) {
    const student = db.studentIndex[app.studentId];
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
      if (existing && existing.status === "pending") {
        existing.status = "active";
        existing.activatedAt = now;
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
          action: `Verified & activated ${fam.name} family (registered account): admission complete + tuition cleared → child portal link sent to ${parents.length} parent number(s)`,
          amount: 0,
        });
        db.activatedNow.push({ familyId: fam.id, familyName: fam.name, username: existing.username, parents: parents.map((p) => ({ name: p.name, phone: p.phone })) });
      } else if (!existing) {
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
