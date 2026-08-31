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
  };
  return db;
}

export const fmtUGX = (n) =>
  "UGX " + (n || 0).toLocaleString("en-UG", { maximumFractionDigits: 0 });

export const fmtDate = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" });

export const uid = (prefix) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
