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

let s = await state();
check("seed loads", !!s.meta && s.families.length === 3);

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

// Reset so the demo starts from a clean seed
await fetch(`${BASE}/api/reset`, { method: "POST" });
const clean = await state();
check("demo data reset", clean.invoices.length === 4 && clean.pickups.length === 4);

console.log(failures ? `\n${failures} check(s) failed.` : "\nAll business rules verified ✔");
process.exit(failures ? 1 : 0);
