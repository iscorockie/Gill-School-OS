// Gill School OS — end-to-end business-rule smoke test.
// Requires the app to be running on localhost:3000 (`npm run dev` or `npm run start`).
// Usage: node scripts/smoke-test.mjs
const BASE = process.env.BASE_URL || "http://localhost:3000";
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

// Start from a clean seed so the test is idempotent
await fetch(`${BASE}/api/reset`, { method: "POST" });

let s = await state();
check("seed loads", !!s.meta && s.families.length === 4);

// 1) Automated sibling discount (family with children in BOTH campuses)
let inv = s.invoices.find((i) => i.id === "inv-fam1-t3");
check("sibling discount auto-applied", inv.siblingDiscount === 45000 && inv.lines.find((l) => l.studentId === "s-pres-1")?.discount === 45000, `(${inv.siblingDiscount})`);

// 2) Late checkout at 17:07 → UGX 20,000 auto-billed + SMS
let r = await action("checkout", { studentId: "s-pres-3", collector: "David Okello", timeOut: "17:07" });
check("late checkout flagged", r.ok && r.result.late === true, `(fee ${r.result.fee})`);
inv = r.db.invoices.find((i) => i.id === r.result.billedTo);
check("late fee billed to invoice", inv.total === 620000, `(total ${inv.total})`);
check("SMS + audit logged", r.db.messages.some((m) => m.subject.includes("Late collection")) && r.db.feesAudit[0]?.amount === 20000);

// 3) On-time checkout → no fee
r = await action("checkout", { studentId: "s-pres-2", collector: "Grace Achieng", timeOut: "16:05" });
check("on-time checkout no fee", r.ok && r.result.late === false && r.result.fee === 0);

// 4) Mobile money payment → instant reconciliation, invoice cleared
r = await action("payInvoice", { invoiceId: "inv-fam2-t3", amount: 450000, channel: "Airtel Money" });
inv = r.db.invoices.find((i) => i.id === "inv-fam2-t3");
check("payment settled + reconciled", r.ok && r.result.receipt && inv.status === "paid" && inv.balance === 0, `(${r.result.receipt})`);

// 5) Leave request auto-notifies teachers
r = await action("requestLeave", { studentId: "s-main-1", from: "2026-09-14", to: "2026-09-15", reason: "Family wedding." });
check("leave pending + teachers notified", r.ok && r.result.status === "pending" && r.result.teacherNotified.length === 3);

// 6) Pre-School → Main School one-click transition
r = await action("initiateTransition", { studentId: "s-pres-1", by: "t-sharon", notes: "Demo" });
const trId = r.result.id;
check("transition initiated", r.ok && r.result.status === "initiated");
r = await action("enrollTransition", { transitionId: trId, targetClass: "Primary 1 (Cambridge)" });
const kid = r.db.studentIndex["s-pres-1"];
const newInv = r.db.invoices[r.db.invoices.length - 1];
check("student migrated to main", kid.campus === "main" && kid.class === "Primary 1 (Cambridge)", `(${kid.campus})`);
check("invoice auto-created", newInv && newInv.total === 900000 && newInv.familyId === "fam-1", `(${newInv?.total})`);
check("bursar notified", r.db.messages.some((m) => m.subject.toLowerCase().includes("enrolment")));

// 7) Uniform/book pre-order
r = await action("placeOrder", { studentId: "s-main-1", items: [{ sku: "U-PE", name: "PE uniform set", type: "uniform", size: "M", price: 55000, qty: 2 }] });
check("pre-order placed", r.ok && r.result.total === 110000);

// 8) Notice, assessment, event publishing
r = await action("publishNotice", { title: "Term 2 closing day", body: "All classes end at noon.", audience: "all", author: "Head of School" });
check("notice published", r.ok && r.db.notices[0]?.title === "Term 2 closing day");
r = await action("addAssessment", { studentId: "s-main-1", subject: "Science", type: "Checkpoint practice", title: "Life cycles practice", score: 54, max: 60, feedback: "Great progress.", teacher: "t-brian" });
check("assessment saved + graded", r.ok && r.result.grade === "A");
r = await action("addEvent", { title: "Parent–Teacher Conferences", date: "2026-11-21", time: "09:00–14:00", location: "Classrooms", category: "Community" });
check("event published", r.ok && r.db.events.some((e) => e.title.includes("Conferences")));

// 9) ICS feed serves the published events
const ics = await (await fetch(`${BASE}/api/ics?campus=all`)).text();
check("ICS contains new event", ics.includes("Parent–Teacher Conferences") && ics.includes("BEGIN:VCALENDAR"));

// 10) Student portal account: parent creates a supervised account for a child
r = await action("createStudentAccount", {
  studentId: "s-pres-1",
  username: "maya.nansubuga",
  password: "maya123",
  perms: { progress: true, homework: true, library: true, calendar: true, messages: true, fees: false },
});
check("student account created + supervised", r.ok && r.db.studentAccounts[0].supervisedBy === "u-parent-1" && r.db.studentAccounts[0].status === "active");

// 11) Student sign-in with the parent-created credentials
const login = await (await fetch(`${BASE}/api/student-login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "maya.nansubuga", password: "maya123" }),
})).json();
check("student login works", login.ok && login.session.studentId === "s-pres-1" && login.session.perms.fees === false);

const badLogin = await (await fetch(`${BASE}/api/student-login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "maya.nansubuga", password: "nope" }),
})).json();
check("wrong password rejected", badLogin.ok === false);

// 12) Pause/resume from the parent's account manager
r = await action("updateStudentAccount", { accountId: r.db.studentAccounts[0].id, status: "paused" });
check("parent can pause account", r.result.status === "paused");

// 13) AUTO ONBOARDING — negative: Okello (fam-3) has a pending doc + unpaid tuition
const preState = await state();
const okello = Object.values(preState.familyAccountByFamily || {}).find((a) => a.familyId === "fam-3");
check("fam-3 not on-boarded (doc pending + tuition unpaid)", !okello && preState.applications.find((a) => a.studentId === "s-pres-3")?.status === "applied");

// 14) AUTO ONBOARDING — positive: clear inv-fam4-t3 → family account + SMS to BOTH parents, one shared login
r = await action("payInvoice", { invoiceId: "inv-fam4-t3", amount: 500000, channel: "MTN Mobile Money" });
check("full tuition cleared (inv-fam4-t3)", r.ok && r.db.invoices.find((i) => i.id === "inv-fam4-t3").status === "paid");
const fam4Acc = Object.values(r.db.familyAccountByFamily || {}).find((a) => a.familyId === "fam-4");
const app1 = r.db.applications.find((a) => a.id === "app-1");
check("fam-4 account auto-created on reconcile", !!fam4Acc && fam4Acc.username === "ssemwanga.family" && fam4Acc.status === "active");
check("one shared login for BOTH parents", app1?.status === "activated" && fam4Acc?.members.length === 2 && fam4Acc.members.includes("u-parent-4") && fam4Acc.members.includes("u-parent-4b"), `(members: ${fam4Acc?.members?.join(",")})`);
const inviteSms = r.db.deliveries.filter((d) => d.ref === "app-1" && d.channel === "SMS");
check("SMS sent to every parent number", inviteSms.length === 2 && inviteSms.some((d) => d.to === "+256771444555") && inviteSms.some((d) => d.to === "+256756666777"), `(to: ${inviteSms.map((d) => d.to).join(", ")})`);
check("invite SMS carries the OS link + shared login", inviteSms.every((d) => d.subject.includes(r.db.meta.inviteLink) && d.subject.includes("ssemwanga.family")));
check("audit trail records the activation", r.db.feesAudit[0]?.action.includes("Auto-onboarded Ssemwanga") && r.db.activatedNow?.some((a) => a.familyId === "fam-4"));

// 15) Before setup, the new family can't sign in — the SMS link is the first step
const parentLogin = await (await fetch(`${BASE}/api/parent-login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "ssemwanga.family", password: "gill2026" }),
})).json();
check("unverified family must use the invite link first", parentLogin.ok === false && /invite link/i.test(parentLogin.error || ""));
const badParent = await (await fetch(`${BASE}/api/parent-login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "ssemwanga.family", password: "wrong" }),
})).json();
check("wrong family password rejected", badParent.ok === false);

// 16) Admissions can re-send the invite SMS to both parents
r = await action("resendFamilyInvite", { applicationId: "app-1" });
check("invite re-send hits both parent numbers", r.ok && r.result.parents === 2 && r.db.deliveries.filter((d) => d.ref === "app-1" && d.channel === "SMS").length === 4);

// 17) SMS link → landing: create password → verification code → verified session
const token = fam4Acc.inviteToken;
check("new family has invite token + no password yet", !!token && fam4Acc.passwordSet === false && fam4Acc.verified === false);
r = await action("inviteSetup", { token, password: "ssem2026!", channel: "sms" });
const demoCode = r.result.demoCode;
check("password created + code sent to parent phone", r.ok && r.result.channel === "sms" && r.result.to === "+256771444555" && /^\d{6}$/.test(demoCode), `(to ${r.result.to})`);
r = await action("inviteVerify", { token, code: "000000" });
check("wrong verification code rejected", r.ok === false);
r = await action("inviteVerify", { token, code: demoCode });
check("correct code verifies + shared session returned", r.ok && r.result.session.members.length === 2 && r.result.session.familyName === "Ssemwanga");
const newLogin = await (await fetch(`${BASE}/api/parent-login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "ssemwanga.family", password: "ssem2026!" }),
})).json();
check("verified family signs in with the new password", newLogin.ok && newLogin.session.members.length === 2);

// 18) Assessment: separate teacher remarks for parent vs student
r = await action("addAssessment", {
  studentId: "s-main-1", subject: "English", type: "Continuous assessment", title: "Term 3 — persuasive writing",
  score: 14, max: 20, teacher: "t-aisha",
  remarkStudent: "Great argument, Jordan — add facts to make it stronger.",
  remarkParent: "Jordan argues well. At home, discuss one news story weekly so he adds real facts to his writing.",
});
const as = r.db.assessments[0];
check("two separate remarks stored", r.ok && as.remarkStudent.includes("Jordan") && as.remarkParent.includes("news story") && as.feedback === as.remarkStudent);

// 19) Group chat auto-created when "Receive messages from teachers" is on
r = await action("createStudentAccount", { studentId: "s-pres-2", username: "daniel.achieng", password: "daniel123", perms: { messages: true } });
const achiengChat = r.db.chats.find((c) => c.studentId === "s-pres-2");
check("chat auto-created (Achieng, pre-school)", !!achiengChat && achiengChat.status === "active" && achiengChat.members.some((m) => m.userId === "t-sharon") && achiengChat.members.filter((m) => m.role === "parent").length === 1);
const mayaChat = r.db.chats.find((c) => c.studentId === "s-pres-1");
check("Maya chat has both parents", !!mayaChat && mayaChat.members.filter((m) => m.role === "parent").length === 2);

// 20) Parents read-only except attendance issues
r = await action("sendChatMessage", { chatId: mayaChat.id, from: "t-aisha", text: "Maya brought her reading bag today — lovely.", tag: "general" });
check("teacher can post freely", r.ok);
r = await action("sendChatMessage", { chatId: mayaChat.id, from: "u-parent-1", text: "What are we covering next week?", tag: "general" });
check("parent general reply blocked", r.ok === false);
r = await action("sendChatMessage", { chatId: mayaChat.id, from: "u-parent-1", text: "Maya will be absent tomorrow — she has a clinic visit.", tag: "attendance" });
check("parent attendance reply allowed", r.ok && r.result.tag === "attendance" && r.result.role === "parent");

// 21) Parent access toggle creates/pauses the chat
r = await action("updateStudentAccount", { accountId: r.db.accountByStudent["s-main-1"].id, perms: { messages: true } });
const jordanChat = r.db.chats.find((c) => c.studentId === "s-main-1");
check("Jordan chat already active (seeded)", !!jordanChat && jordanChat.status === "active");
r = await action("updateStudentAccount", { accountId: r.db.accountByStudent["s-main-1"].id, perms: { messages: false } });
check("turning messages off pauses the chat", r.db.chats.find((c) => c.studentId === "s-main-1").status === "paused");
r = await action("updateStudentAccount", { accountId: r.db.accountByStudent["s-main-1"].id, perms: { messages: true } });
check("turning messages back on resumes it", r.db.chats.find((c) => c.studentId === "s-main-1").status === "active");

// 22) Student portal respects the remarks permission
const studentLogin = await (await fetch(`${BASE}/api/student-login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "jordan.nansubuga", password: "gill123" }),
})).json();
check("student session carries remarks perm", studentLogin.ok && studentLogin.session.perms.remarks === true);
r = await action("updateStudentAccount", { accountId: r.db.accountByStudent["s-main-1"].id, perms: { remarks: false } });
const studentLogin2 = await (await fetch(`${BASE}/api/student-login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "jordan.nansubuga", password: "gill123" }),
})).json();
check("parent can hide remarks from the child", studentLogin2.ok && studentLogin2.session.perms.remarks === false);

// Portal routes respond
const loginPage = await (await fetch(`${BASE}/portal/login`)).status;
const setupPage = await (await fetch(`${BASE}/portal/setup?invite=${token}`)).status;
check("parent login page serves", loginPage === 200);
check("invite setup landing serves", setupPage === 200);

// Reset so the demo starts from a clean seed
await fetch(`${BASE}/api/reset`, { method: "POST" });
const clean = await state();
check("demo data reset", clean.invoices.length === 5 && clean.pickups.length === 4 && clean.chats.length === 1);

console.log(failures ? `\n${failures} check(s) failed.` : "\nAll business rules verified ✔");
process.exit(failures ? 1 : 0);
