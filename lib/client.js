// Shared client-side selectors. Everything is derived from the single
// /api/state payload, so pages stay tiny and consistent.

export function currentFamily(db, userId) {
  const u = db.users.find((x) => x.id === userId);
  if (!u) return null;
  return db.families.find((f) => f.id === u.familyId) || null;
}

export function studentsOf(db, family) {
  if (!family) return [];
  return family.children.filter((c) => c.enabled !== false);
}

export function familyInvoices(db, familyId) {
  return db.invoices.filter((i) => i.familyId === familyId).sort((a, b) => (a.term < b.term ? 1 : -1));
}

export function balances(db) {
  const current = db.invoices.filter((i) => i.term === db.meta.currentTerm);
  return {
    total: current.reduce((s, i) => s + i.total, 0),
    paid: current.reduce((s, i) => s + i.paid, 0),
    balance: current.reduce((s, i) => s + i.balance, 0),
    siblingDiscounts: current.reduce((s, i) => s + (i.siblingDiscount || 0), 0),
    lateFees: current.reduce((s, i) => s + i.lines.filter((l) => l.kind === "latefee").reduce((x, l) => x + l.amount, 0), 0),
  };
}

export function studentAssessments(db, studentId) {
  return db.assessments.filter((a) => a.studentId === studentId).sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function notificationsFor(db, userId) {
  return db.messages
    .filter((m) => m.to === userId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function familyLeaves(db, family) {
  if (!family) return [];
  const ids = family.children.map((c) => c.id);
  return db.leaves.filter((l) => ids.includes(l.studentId)).sort((a, b) => (a.date < b.date ? 1 : -1));
}
