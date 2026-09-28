// Gill School OS — end-to-end business-rule smoke test (self-seeding).
//
// The product ships WITHOUT a demo dataset, and so does this test: it builds
// its own families, applications, invoices and accounts through the same
// public flows real users use (register → apply → verify docs → clear tuition
// → accounts → tenure → deletion). Verification codes are captured from a
// local SMTP sink — the exact production delivery path; codes never appear on
// screen anywhere.
//
// Requires the app to be running (`npm run dev` or `node server.js`).
// Idempotent: every run creates uniquely-named records, so re-runs are safe on
// a working database. The test briefly saves SMTP settings pointing at its
// sink and clears them before finishing (DATA_DIR/mail.json).
//
// Usage: node scripts/smoke-test.mjs
import net from "net";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const RUN = Date.now().toString(36).toUpperCase();
const run = RUN.toLowerCase();
const ok = (name, cond, extra = "") => console.log(`${cond ? "PASS" : "FAIL"}  ${name} ${extra}`);
let failures = 0;
const check = (name, cond, extra) => { if (!cond) failures++; ok(name, cond, extra); };

const state = async () => (await fetch(`${BASE}/api/state`)).json();
const action = async (type, payload) =>
  (await fetch(`${BASE}/api/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, payload }),
  })).json();
const post = async (url, body) =>
  (await fetch(`${BASE}${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })).json();

// Unique phone numbers per run (valid-looking UG mobiles).
let seq = 0;
const uphone = () => `+2567${String((Date.now() % 90000000) + seq++).padStart(8, "0").slice(-8)}`;

// ---- Local SMTP sink (captures what the app really sends) --------------------
const inbox = [];
function startSink() {
  return new Promise((resolve) => {
    const server = net.createServer((sock) => {
      sock.setEncoding("utf8");
      let buf = "", inData = false, msg = "", authStage = 0;
      sock.write("220 sink ESMTP\r\n");
      const handle = (line) => {
        if (authStage === 1) { authStage = 2; sock.write("334 UGFzc3dvcmQ6\r\n"); return; } // LOGIN → username
        if (authStage === 2) { authStage = 0; sock.write("235 2.7.0 ok\r\n"); return; }       // LOGIN → password
        const u = line.toUpperCase();
        if (inData) {
          if (line === ".") { inData = false; inbox.push(msg); msg = ""; sock.write("250 OK\r\n"); }
          else msg += (line.startsWith("..") ? line.slice(1) : line) + "\r\n";
          return;
        }
        if (u.startsWith("EHLO") || u.startsWith("HELO")) sock.write("250-sink\r\n250-AUTH PLAIN LOGIN\r\n250 OK\r\n");
        else if (u.startsWith("AUTH") && u.includes("LOGIN")) { authStage = 1; sock.write("334 VXNlcm5hbWU6\r\n"); }
        else if (u.startsWith("AUTH")) sock.write("235 2.7.0 ok\r\n"); // PLAIN (single line)
        else if (u.startsWith("DATA")) { inData = true; msg = ""; sock.write("354 end with .\r\n"); }
        else if (u.startsWith("QUIT")) { sock.write("221 bye\r\n"); sock.end(); }
        else sock.write("250 OK\r\n");
      };
      sock.on("data", (d) => {
        buf += d;
        let i;
        while ((i = buf.indexOf("\r\n")) >= 0) {
          const line = buf.slice(0, i);
          buf = buf.slice(i + 2);
          handle(line);
        }
      });
      sock.on("error", () => {});
    });
    server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port }));
  });
}
const lastMail = () => inbox[inbox.length - 1] || "";
const codeFrom = (mail) =>
  (mail.match(/(?:verification code is:|reset code is:|verification code:|reset code:)\s*(\d{6})/) || mail.match(/(\d{6})/) || [])[1];

// A complete application journey through the 6-step wizard → submitted.
async function fullApplication(familyId, { first, last, campus, class: klass, pay, parents }) {
  let rr = await action("saveApplication", {
    familyId, step: "basic",
    data: { firstName: first, lastName: last, dob: "2022-06-15", gender: "F", campus, class: klass, intake: "Term 3 2026" },
  });
  const app = rr.result.application;
  rr = await action("saveApplication", { familyId, step: "parent", data: { contacts: parents } });
  const membersAfterParents = rr.result?.application?.parentContacts?.length;
  await action("saveApplication", { familyId, step: "emergency", data: { contacts: [{ name: "Grace Atim", relation: "Aunt", phone: uphone() }] } });
  await action("saveApplication", {
    familyId, step: "documents", data: { files: [
      { type: "Birth certificate", name: `${first.toLowerCase()}_birth.pdf`, size: "1.1 MB" },
      { type: "Immunisation record", name: `${first.toLowerCase()}_imm.jpg`, size: "760 KB" },
      { type: "Passport photographs", name: `${first.toLowerCase()}_photos.jpg`, size: "420 KB" },
    ] },
  });
  await action("saveApplication", {
    familyId, step: "payment",
    data: pay === "now" ? { method: "payNow", channel: "MTN Mobile Money", phone: uphone() } : { method: "payLater" },
  });
  rr = await action("submitApplication", { applicationId: app.id });
  return { app: rr.result?.application || app, submit: rr, membersAfterParents };
}

async function verifyAllDocs(studentId) {
  let st = await state();
  let docs = st.documents.filter((d) => d.studentId === studentId && d.status !== "verified");
  let guard = 0;
  while (docs.length && guard++ < 6) {
    for (const d of docs) await action("verifyDocument", { docId: d.id, status: "verified" });
    st = await state();
    docs = st.documents.filter((d) => d.studentId === studentId && d.status !== "verified");
  }
}

// =============================================================================
const { server: sinkServer, port: sinkPort } = await startSink();
console.log(`[smoke] run ${RUN} · SMTP sink on 127.0.0.1:${sinkPort}`);

// ---- 0) Live seed + staff bootstrap (the production first-sign-in path) ------
let s = await state();
check("live seed loads", !!s.meta && Array.isArray(s.families) && Array.isArray(s.staffAccounts));
const mailBaseline = await (await fetch(`${BASE}/api/mail-status?verify=0`)).json();

const roster = ["f.ssekandi@gill.ac.ug", "i.twesigye@gill.ac.ug", "m.kyomukama@gill.ac.ug", "a.hassan@gill.ac.ug", "b.mugisha@gill.ac.ug", "s.namukasa@gill.ac.ug", "p.othieno@gill.ac.ug"];
check("staff roster present as accounts", roster.every((e) => (s.staffAccounts || []).some((a) => a.email === e)));
const adminAcc = (s.staffAccounts || []).find((a) => a.email === "f.ssekandi@gill.ac.ug");
let bossPw = null;
if (adminAcc?.inviteToken && !adminAcc.passwordSet) {
  const look = await action("staffInviteLookup", { token: adminAcc.inviteToken });
  check("staff invite link resolves (no SMTP needed)", look.ok && look.result.email === "f.ssekandi@gill.ac.ug");
  const setup = await action("staffInviteSetup", { token: adminAcc.inviteToken, password: `Boss${RUN}!` });
  bossPw = `Boss${RUN}!`;
  check("Head of School sets a password via the one-time link", setup.ok && !!setup.result.session);
  const staffLogin = await post("/api/staff-login", { email: "f.ssekandi@gill.ac.ug", password: bossPw });
  check("staff sign-in with the new password", staffLogin.ok);
} else {
  console.log("SKIP  staff bootstrap (already set up on this database)");
}
const noStaffShortcut = await post("/api/staff-login", { email: "f.ssekandi@gill.ac.ug", password: "gill2026" });
check("no shared password shortcut on staff login", noStaffShortcut.ok === false);

// ---- 1) Point the app's SMTP at the local sink (test harness only) -----------
const savedMail = await action("saveMailConfig", {
  host: "127.0.0.1", port: String(sinkPort), user: "noreply@smoke.test",
  pass: "smoke-sink-pass", from: "Smoke Sink <noreply@smoke.test>",
});
check("SMTP settings activate the mailer", savedMail.ok && savedMail.result?.status?.configured === true, savedMail.error || "");
const mailNow = await (await fetch(`${BASE}/api/mail-status?verify=0`)).json();
check("saved settings apply (host/port from the console)", mailNow.configured === true && mailNow.host === "127.0.0.1" && mailNow.port === sinkPort);
check("password is write-only (never returned to a client)", !JSON.stringify(mailNow).includes("smoke-sink-pass"));

// ---- 2) FAMILY A — children in BOTH campuses, real registration journey ------
const famAName = `Wasswa${RUN}`;
const aParents = [
  { name: "Nancy Wasswa", relation: "Mother / Guardian", phone: uphone(), email: `nancy+${run}@example.com`, alive: true },
  { name: "Peter Wasswa", relation: "Father", phone: uphone(), email: `peter+${run}@example.com`, alive: true },
];
let r = await action("registerFamily", {
  familyName: famAName, parentName: "Nancy Wasswa", relation: "Mother / Guardian",
  phone: aParents[0].phone, email: aParents[0].email, password: `pass${RUN}a!`, terms: true,
});
check("register creates the one-time pending account", r.ok && r.result.account.status === "pending" && r.result.account.username.endsWith(".family"), r.error || "");
const famA = r.result.familyId;
const parentA = r.result.userId;
const userA = r.result.account.username;
const aLogin = await post("/api/parent-login", { username: userA, password: `pass${RUN}a!` });
check("pending family can sign in to track the application", aLogin.ok && aLogin.session.status === "pending" && aLogin.session.familyId === famA);
check("register rejects short password", (await action("registerFamily", { familyName: `Bad${RUN}`, parentName: "X", phone: uphone(), email: `bad+${run}@example.com`, password: "short", terms: true })).ok === false);
check("register requires terms", (await action("registerFamily", { familyName: `Bad2${RUN}`, parentName: "X", phone: uphone(), email: `bad2+${run}@example.com`, password: "longenough123", terms: false })).ok === false);

const kid1 = await fullApplication(famA, { first: "Amina", last: famAName, campus: "preschool", class: "Nursery (3–4 yrs)", pay: "now", parents: aParents });
check("wizard → application submitted + fee invoice opened", kid1.submit.ok && kid1.submit.result.application.status === "applied" && kid1.submit.result.invoice.status === "paid", kid1.submit.error || "");
check("parent step puts BOTH parents on ONE account", kid1.membersAfterParents === 2, `(contacts ${kid1.membersAfterParents})`);
s = await state();
check("not on-boarded before docs are verified", s.familyAccountByFamily?.[famA]?.status === "pending" && s.applications.find((a) => a.id === kid1.app.id)?.status === "applied");
check("both parents SMS'd on submission", s.deliveries.filter((d) => d.ref === kid1.app.id && d.channel === "SMS").length === 2);
check("docs land in vault as pending review", s.documents.filter((d) => d.studentId === kid1.app.studentId).length === 3 && s.documents.filter((d) => d.studentId === kid1.app.studentId).every((d) => d.status === "pending review"));
check("admissions notified of new application", s.messages.some((m) => m.to === "u-admissions" && m.subject.includes("New application received")));
check("register page serves, old-school style", ((await (await fetch(`${BASE}/register`)).text()).includes("Join Our Community")));

// ---- 2b) SHARED EMAIL SIGN-IN (from main): /login + /api/login ---------------
// Routes staff/admin and parents by email using REAL credentials from this run
// — there is never a magic/demo password in the live product.
const loginPost = async (body) => {
  const res = await fetch(`${BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
};
const sharedAdminLogin = bossPw ? await loginPost({ email: "f.ssekandi@gill.ac.ug", password: bossPw }) : null;
if (sharedAdminLogin) {
  check("shared login routes admin email to /admin", sharedAdminLogin.body.ok === true && sharedAdminLogin.body.destination === "/admin");
} else {
  console.log("SKIP  shared admin login (staff password set in an earlier run)");
}
const sharedParentLogin = await loginPost({ email: aParents[0].email, password: `pass${RUN}a!` });
check("shared login routes parent email to the family portal", sharedParentLogin.body.ok === true && sharedParentLogin.body.kind === "parent" && !!sharedParentLogin.body.session?.familyId);
const sharedWrongPw = await loginPost({ email: aParents[0].email, password: "gill2026" });
check("shared login rejects the old magic password with 401", sharedWrongPw.status === 401 && sharedWrongPw.body.ok === false);
const sharedNoEmail = await loginPost({ email: "not-an-email", password: "whatever" });
check("shared login requires an email-format identifier", sharedNoEmail.status === 400);
const parentLoginShortcut = await post("/api/parent-login", { username: userA, password: "gill2026" });
check("no magic password on the family login route", parentLoginShortcut.ok === false);
check("/login serves the shared sign-in page", (await fetch(`${BASE}/login`)).status === 200);

// ---- 3) Verification → activation → supervised student accounts --------------
await verifyAllDocs(kid1.app.studentId);
s = await state();
check("registered family auto-activates after verification + payment",
  s.familyAccountByFamily?.[famA]?.status === "active" && s.applications.find((a) => a.id === kid1.app.id)?.status === "activated");
const childSms = s.deliveries.filter((d) => d.ref === kid1.app.id && d.channel === "SMS" && d.subject.includes("Admission verified"));
check("verification SMS carries the child's portal link", childSms.length === 2 && childSms.every((d) => d.subject.includes("/student/login?u=") && d.subject.includes(userA)), `(sample: ${childSms[0]?.subject?.slice(0, 80) || "none"})`);
const sa1 = s.accountByStudent?.[kid1.app.studentId];
check("child's supervised account auto-provisioned", !!sa1 && sa1.supervisedBy === parentA && sa1.status === "active");
check("student account is one-time (no duplicates)", (await action("createStudentAccount", { studentId: kid1.app.studentId, username: `dup.${run}`, password: "whatever123" })).ok === false);

const pw1 = await action("resetStudentAccount", { accountId: sa1.id });
const kidLogin = await post("/api/student-login", { username: sa1.username, password: pw1.result?.password || "missing" });
check("child can sign in with the provisioned credentials", kidLogin.ok && kidLogin.session.studentId === kid1.app.studentId);
const badKidLogin = await post("/api/student-login", { username: sa1.username, password: "nope" });
check("wrong student password rejected", badKidLogin.ok === false);

r = await action("updateStudentAccount", { accountId: sa1.id, status: "paused" });
check("parent can pause the account", r.ok && r.result?.status === "paused", r.error || "");
r = await action("updateStudentAccount", { accountId: sa1.id, status: "active" });
check("parent can resume the account", r.ok && r.result?.status === "active");

// ---- 4) Second child — a NEW application (one at a time per family) ----------
const kid2 = await fullApplication(famA, { first: "Brian", last: famAName, campus: "main", class: "Year 5 — Cambridge Primary", pay: "now", parents: aParents });
check("second child gets their own application", kid2.submit.ok && kid2.app.studentId !== kid1.app.studentId, kid2.submit.error || "");
s = await state();
const preInv = s.invoices.find((i) => i.familyId === famA && i.lines.some((l) => l.kind === "tuition" && l.studentId === kid1.app.studentId));
check("sibling discount auto-applied (children in both campuses)",
  preInv && preInv.siblingDiscount === 45000 && preInv.lines.find((l) => l.kind === "tuition")?.discount === 45000,
  `(discount ${preInv?.siblingDiscount})`);
await verifyAllDocs(kid2.app.studentId);
s = await state();
const sa2 = s.accountByStudent?.[kid2.app.studentId] || { id: "missing", username: "missing" };
check("second child activated with their own supervised account", s.applications.find((a) => a.id === kid2.app.id)?.status === "activated" && sa2.id !== "missing" && sa2.id !== sa1.id);

// ---- 5) Family group chats ---------------------------------------------------
await action("updateStudentAccount", { accountId: sa2.id, perms: { messages: false } });
r = await action("updateStudentAccount", { accountId: sa2.id, perms: { messages: true } });
s = await state();
const chat2 = s.chats.find((c) => c.studentId === kid2.app.studentId) || { id: null };
check("chat auto-created when messages are on", r.ok && !!chat2.id && chat2.status === "active" && chat2.members.some((m) => m.role === "teacher") && chat2.members.filter((m) => m.role === "parent").length === 2, `(members: ${chat2.members ? chat2.members.map((m) => m.role).join(",") : "none"}${r.error ? ` · error: ${r.error}` : ""})`);
r = await action("sendChatMessage", { chatId: chat2.id, from: "t-aisha", text: "Lovely work in class today.", tag: "general" });
check("teacher can post freely", r.ok);
r = await action("sendChatMessage", { chatId: chat2.id, from: parentA, text: "What are we covering next week?", tag: "general" });
check("parent general reply blocked", r.ok === false);
r = await action("sendChatMessage", { chatId: chat2.id, from: parentA, text: "Brian will be absent tomorrow — clinic visit.", tag: "attendance" });
check("parent attendance reply allowed", r.ok && r.result.tag === "attendance" && r.result.role === "parent");
await action("updateStudentAccount", { accountId: sa2.id, perms: { messages: false } });
check("turning messages off pauses the chat", (await state()).chats.find((c) => c.studentId === kid2.app.studentId)?.status === "paused");
await action("updateStudentAccount", { accountId: sa2.id, perms: { messages: true } });
check("turning messages back on resumes it", (await state()).chats.find((c) => c.studentId === kid2.app.studentId)?.status === "active");

const pw2 = await action("resetStudentAccount", { accountId: sa2.id });
let sLogin = await post("/api/student-login", { username: sa2.username, password: pw2.result?.password || "missing" });
check("student session carries the remarks perm", sLogin.ok && sLogin.session.perms.remarks === true);
await action("updateStudentAccount", { accountId: sa2.id, perms: { remarks: false } });
sLogin = await post("/api/student-login", { username: sa2.username, password: pw2.result?.password || "missing" });
check("parent can hide remarks from the child", sLogin.ok && sLogin.session.perms.remarks === false);

// ---- 6) Academics, gate, leave, transition, orders, noticeboard --------------
r = await action("addAssessment", {
  studentId: kid2.app.studentId, subject: "English", type: "Continuous assessment",
  title: "Persuasive writing", score: 18, max: 20, teacher: "t-aisha",
  remarkStudent: "Great argument — add facts to make it stronger.",
  remarkParent: "Discuss one news story weekly at home so he adds real facts.",
});
const as = r.db.assessments.find((a) => a.studentId === kid2.app.studentId);
check("two separate remarks stored (student vs parent)", r.ok && as.remarkStudent.includes("facts") && as.remarkParent.includes("news story") && as.feedback === as.remarkStudent);
check("assessment graded", Boolean(r.result?.grade), `(grade ${r.result?.grade})`);

r = await action("checkout", { studentId: kid1.app.studentId, collector: "David Okello", timeOut: "17:07" });
check("late checkout flagged", r.ok && r.result?.late === true, `(fee ${r.result?.fee})`);
const billedInv = r.db.invoices.find((i) => i.id === r.result.billedTo);
check("late fee billed to the family invoice", billedInv && billedInv.lines.some((l) => l.kind === "latefee" && l.amount === 20000));
check("SMS + audit logged", r.db.messages.some((m) => m.subject.includes("Late collection")) && r.db.feesAudit[0]?.amount === 20000);
r = await action("checkout", { studentId: kid1.app.studentId, collector: "Grace Achieng", timeOut: "16:05" });
check("on-time checkout — no fee", r.ok && r.result.late === false && r.result.fee === 0);

r = await action("requestLeave", { studentId: kid2.app.studentId, from: "2026-10-05", to: "2026-10-06", reason: "Family wedding." });
check("leave pending + all teachers notified", r.ok && r.result.status === "pending" && r.result.teacherNotified.length === 3, `(${r.result?.teacherNotified?.length})`);

r = await action("initiateTransition", { studentId: kid1.app.studentId, by: "t-sharon", notes: "Ready for Primary 1." });
check("pre-school → main transition initiated", r.ok && r.result.status === "initiated");
r = await action("enrollTransition", { transitionId: r.result.id, targetClass: "Primary 1 (Cambridge)" });
const trInv = r.db.invoices.find((i) => i.familyId === famA && i.lines.some((l) => l.label.includes("Main School Tuition") && l.studentId === kid1.app.studentId));
check("student migrated + first-term invoice auto-created", r.ok && r.db.studentIndex[kid1.app.studentId].campus === "main" && trInv && trInv.total === 900000, `(${trInv?.total})`);
check("bursar notified of the enrolment", r.db.messages.some((m) => m.to === "u-bursar" && m.subject.toLowerCase().includes("enrolment")));

r = await action("placeOrder", { studentId: kid2.app.studentId, items: [{ sku: "U-PE", name: "PE uniform set", type: "uniform", size: "M", price: 55000, qty: 2 }] });
check("uniform pre-order placed", r.ok && r.result.total === 110000);

r = await action("publishNotice", { title: `Term closing day ${RUN}`, body: "All classes end at noon.", audience: "all", author: "Head of School" });
check("notice published", r.ok && r.db.notices[0]?.title === `Term closing day ${RUN}`);
r = await action("addEvent", { title: `Parent–Teacher Conferences ${RUN}`, date: "2026-11-21", time: "09:00–14:00", location: "Classrooms", category: "Community" });
check("event published", r.ok && r.db.events.some((e) => e.title.includes(RUN)));
const ics = await (await fetch(`${BASE}/api/ics?campus=all`)).text();
check("ICS feed contains the new event", ics.includes("Parent–Teacher Conferences") && ics.includes("BEGIN:VCALENDAR"));
check("cannot submit before completing steps", (await action("submitApplication", { applicationId: (await action("saveApplication", { familyId: famA, step: "basic", data: { firstName: "Test", lastName: "Kid", campus: "preschool", class: "Nursery (3–4 yrs)", dob: "2022-06-15", intake: "Term 3 2026" } })).result.application.id })).ok === false);

// ---- 7) FAMILY B — tuition-gated auto-onboarding ----------------------------
const famBName = `Nakato${RUN}`;
const bParents = [
  { name: "Sarah Nakato", relation: "Mother / Guardian", phone: uphone(), email: `sarah+${run}@example.com`, alive: true },
  { name: "John Nakato", relation: "Father", phone: uphone(), email: `john+${run}@example.com`, alive: true },
];
r = await action("registerFamily", {
  familyName: famBName, parentName: "Sarah Nakato", relation: "Mother / Guardian",
  phone: bParents[0].phone, email: bParents[0].email, password: `pass${RUN}b!`, terms: true,
});
const famB = r.result.familyId;
const userB = r.result.account.username;
const kidB = await fullApplication(famB, { first: "Kato", last: famBName, campus: "preschool", class: "Toddlers (2–3 yrs)", pay: "later", parents: bParents });
s = await state();
const invB = s.invoices.find((i) => i.familyId === famB && i.term === "Term 3 2026");
check("tuition invoice opened unpaid (pay at the office)", kidB.submit.ok && invB && invB.status === "unpaid" && invB.balance > 0);
check("unpaid tuition + pending docs → not on-boarded", s.familyAccountByFamily?.[famB]?.status === "pending" && s.applications.find((a) => a.id === kidB.app.id)?.status === "applied");
await verifyAllDocs(kidB.app.studentId);
s = await state();
check("docs verified but tuition outstanding → still pending", s.familyAccountByFamily?.[famB]?.status === "pending");
r = await action("payInvoice", { invoiceId: invB.id, amount: invB.balance, channel: "MTN Mobile Money" });
check("mobile-money payment settles + reconciles", r.ok && r.result?.receipt && r.db.invoices.find((i) => i.id === invB.id).status === "paid", `(${r.result?.receipt})`);
s = await state();
const accB = s.familyAccountByFamily?.[famB];
check("family account auto-activates on reconcile", accB?.status === "active" && accB.username.endsWith(".family"));
check("one shared login for BOTH parents", s.applications.find((a) => a.id === kidB.app.id)?.status === "activated" && accB.members.length === 2, `(members: ${accB?.members?.length})`);
const welcomeSms = s.deliveries.filter((d) => d.ref === kidB.app.id && d.channel === "SMS" && d.subject.includes("Admission verified"));
check("SMS sent to every parent number", welcomeSms.length === 2 && new Set(welcomeSms.map((d) => d.to)).size === 2, `(to: ${welcomeSms.map((d) => d.to).join(", ")})`);
check("invite SMS carries the OS link + shared login", welcomeSms.every((d) => d.subject.includes(s.meta.inviteLink) && d.subject.includes(accB.username)));
check("audit trail records the activation", s.feesAudit.some((a) => a.action.includes(famBName)));
r = await action("resendFamilyInvite", { applicationId: kidB.app.id });
check("admissions can re-send the invite to both parents", r.ok && r.result.parents === 2);

// ---- 8) Forgot-password codes travel by REAL email (the SMTP sink) -----------
check("no sign-in shortcut — wrong password is wrong", (await post("/api/parent-login", { username: userB, password: "gill2026" })).ok === false);
check("no shared password shortcut on student login", (await post("/api/student-login", { username: sa1.username, password: "gill2026" })).ok === false);

inbox.length = 0;
r = await action("requestPasswordReset", { portal: "parent", identifier: userB });
check("reset code requested (delivered by email only)", r.ok && !("demoCode" in (r.result || {})), r.error || "");
const resetMail = lastMail();
const resetCode = codeFrom(resetMail);
check("reset code arrives in the parent's mailbox", Boolean(resetCode), `(inbox ${inbox.length} msg${inbox.length === 1 ? "" : "s"})`);
check("wrong reset code rejected", (await action("verifyResetCode", { portal: "parent", identifier: userB, code: "000000" })).ok === false);
check("correct reset code verifies", (await action("verifyResetCode", { portal: "parent", identifier: userB, code: resetCode })).ok === true);
check("new password set with the code", (await action("resetPasswordWithCode", { portal: "parent", identifier: userB, code: resetCode, newPassword: `pass${RUN}c!` })).ok === true);
check("family signs in with the new password", (await post("/api/parent-login", { username: userB, password: `pass${RUN}c!` })).ok === true);
check("old password no longer works", (await post("/api/parent-login", { username: userB, password: `pass${RUN}b!` })).ok === false);

// Staff forgot-password uses the same live email path.
inbox.length = 0;
r = await action("requestPasswordReset", { portal: "staff", identifier: "f.ssekandi@gill.ac.ug" });
const staffCode = codeFrom(lastMail());
check("staff reset code arrives by email", r.ok && Boolean(staffCode));
if (staffCode) {
  check("staff password reset with the emailed code", (await action("resetPasswordWithCode", { portal: "staff", identifier: "f.ssekandi@gill.ac.ug", code: staffCode, newPassword: `Boss${RUN}#` })).ok === true);
  check("staff signs in with the reset password", (await post("/api/staff-login", { email: "f.ssekandi@gill.ac.ug", password: `Boss${RUN}#` })).ok === true);
}

// ---- 9) ACCOUNT LIFECYCLE (family C) ----------------------------------------
const famCName = `Opio${RUN}`;
const cParents = [
  { name: "Joy Opio", relation: "Mother", phone: uphone(), email: `joy+${run}@example.com`, alive: true },
];
r = await action("registerFamily", {
  familyName: famCName, parentName: "Joy Opio", relation: "Mother",
  phone: cParents[0].phone, email: cParents[0].email, password: `pass${RUN}d!`, terms: true,
});
const famC = r.result.familyId;
const userC = r.result.account.username;
const kidC = await fullApplication(famC, { first: "Amani", last: famCName, campus: "preschool", class: "Nursery (3–4 yrs)", pay: "now", parents: cParents });

// Apply-again while the admission awaits review (dedupe rules).
r = await action("reopenApplication", { applicationId: kidC.app.id });
check("apply-again reopens an application awaiting review", r.ok && r.result.application.status === "in_progress" && !!r.result.application.previousSubmit);
const invCountBefore = (await state()).invoices.filter((i) => i.familyId === famC).length;
const docCountBefore = (await state()).documents.filter((d) => d.studentId === kidC.app.studentId).length;
await action("saveApplication", {
  familyId: famC, step: "documents", data: { files: [
    { type: "Birth certificate", name: "amani_birth_v2.pdf", size: "1.0 MB" },
    { type: "Immunisation record", name: "amani_imm.jpg", size: "760 KB" },
    { type: "Passport photographs", name: "amani_photos.jpg", size: "420 KB" },
  ] },
});
r = await action("submitApplication", { applicationId: kidC.app.id });
s = await state();
check("resubmit keeps ONE invoice + vault docs (no duplicates)",
  r.ok && s.invoices.filter((i) => i.familyId === famC).length === invCountBefore && s.documents.filter((d) => d.studentId === kidC.app.studentId).length === docCountBefore);
check("resubmit SMS says 'updated', not new", s.deliveries.some((d) => d.ref === kidC.app.id && d.subject.includes("Application updated")));
check("submit after resubmit still guarded", (await action("submitApplication", { applicationId: kidC.app.id })).ok === false);
r = await action("updateApplicationSettings", { applicationId: kidC.app.id, settings: { updatesChannel: "sms", intake: "January 2027" } });
check("application settings saved on the application", r.ok && r.result.application.settings?.updatesChannel === "sms" && r.result.application.settings?.intake === "January 2027");

// One-time account rules.
check("register rejects duplicate email (one-time account)", (await action("registerFamily", {
  familyName: famCName, parentName: "Joy", relation: "Mother", phone: uphone(), email: cParents[0].email, password: `pass${RUN}e!`, terms: true,
})).ok === false);
check("register rejects duplicate phone (one-time account)", (await action("registerFamily", {
  familyName: `Other${RUN}`, parentName: "X", relation: "Parent", phone: cParents[0].phone, email: `other+${run}@example.com`, password: "longenough123", terms: true,
})).ok === false);

// Activate family C, then run the tenure rules.
await verifyAllDocs(kidC.app.studentId);
s = await state();
const saC = s.accountByStudent?.[kidC.app.studentId] || { id: "missing", username: "missing" };
check("family C activated with a provisioned child account", s.familyAccountByFamily?.[famC]?.status === "active" && saC.id !== "missing");
r = await action("initiateTransition", { studentId: kidC.app.studentId, by: "u-admissions", notes: "Ready for Year 1." });
r = await action("enrollTransition", { transitionId: r.result.id, targetClass: "Primary 1 (Cambridge)" });
check("new term invoice opens with a balance", r.ok && r.db.invoices.some((i) => i.familyId === famC && i.balance > 0));
const balLogin = await post("/api/parent-login", { username: userC, password: `pass${RUN}d!` });
check("balance for another term never locks the OS", balLogin.ok === true && balLogin.session.familyId === famC, balLogin.error || "");
check("accounts can't be deleted mid-tenure", (await action("deleteFamilyAccounts", { familyId: famC, confirm: famCName })).ok === false);

const pwC = await action("resetStudentAccount", { accountId: saC.id });
r = await action("retireStudent", { studentId: kidC.app.studentId, outcome: "completed", note: "Graduated Nursery.", actor: "Admissions" });
check("retiring the last student closes student + family accounts", r.ok && r.result.studentAccountClosed === true && r.result.familyClosed === true);
const kidClosed = await post("/api/student-login", { username: saC.username, password: pwC.result?.password || "missing" });
check("student login refused after the tenure ends", kidClosed.ok === false && /closed/i.test(kidClosed.error || ""), kidClosed.error || "");
const famClosed = await post("/api/parent-login", { username: userC, password: `pass${RUN}d!` });
check("family login closed once every student is done", famClosed.ok === false && /closed/i.test(famClosed.error || ""), famClosed.error || "");
check("retiring twice is blocked", (await action("retireStudent", { studentId: kidC.app.studentId, outcome: "left" })).ok === false);
check("delete requires the typed family name", (await action("deleteFamilyAccounts", { familyId: famC, confirm: famCName.toLowerCase() })).ok === false);
r = await action("deleteFamilyAccounts", { familyId: famC, confirm: famCName, actor: "Admin" });
check("admin deletes accounts after tenure — records retained",
  r.ok && r.result.familyUsername === userC &&
  !r.db.familyAccountByFamily?.[famC] && !r.db.accountByStudent?.[kidC.app.studentId] &&
  r.db.invoices.some((i) => i.familyId === famC) && r.db.applications.some((a) => a.studentId === kidC.app.studentId),
  r.error || "");
check("a new pupil may register after the old accounts are deleted", (await action("registerFamily", {
  familyName: famCName, parentName: "Joy", relation: "Mother", phone: cParents[0].phone, email: cParents[0].email, password: `pass${RUN}d!`, terms: true,
})).ok === true);

// ---- 10) Mail plumbing — failure modes + clean revert ------------------------
r = await action("saveMailConfig", { host: "127.0.0.1", port: "1", user: "noreply@smoke.test", pass: "dead-port-pass", from: "Smoke <noreply@smoke.test>" });
check("SMTP settings save from the admin console", r.ok === true && r.result?.status?.configured === true, r.error || "");
r = await action("verifyMailConfig", {});
check("connection check reports failure gracefully", r.ok === true && r.result?.ok === false && Boolean(r.result?.error), r.result?.error || "");
check("failed connection never leaks the password", !JSON.stringify(r).includes("dead-port-pass"));
r = await action("clearMailConfig", {});
check("forgetting saved settings reverts the mailer", r.result?.status?.configured === mailBaseline.configured && r.result?.status?.source === mailBaseline.source);

sinkServer.close();
console.log(failures ? `\n${failures} check(s) failed.` : "\nAll business rules verified ✔");
process.exit(failures ? 1 : 0);
