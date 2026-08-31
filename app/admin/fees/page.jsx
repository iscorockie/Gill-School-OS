"use client";
import { useMemo, useState } from "react";
import { useApp, Badge, Modal, Field, fmtUGX } from "@/components/ui.jsx";
import { AreaChart, GroupedBars, Donut, HBarList, Sparkline, CHART_COLORS } from "@/components/charts.jsx";

function monthLabel(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleString("en", { month: "short" }) + " " + String(d.getFullYear()).slice(2);
}

function channelShort(ch) {
  if (!ch) return "Other";
  if (ch.includes("MTN")) return "MTN MoMo";
  if (ch.includes("Airtel")) return "Airtel Money";
  if (ch.includes("VISA") || ch.includes("Card")) return "Card";
  return "Cash / other";
}

export default function AdminFeesPage() {
  const { db, act } = useApp();
  const [tab, setTab] = useState("analytics");
  const [termFilter, setTermFilter] = useState("current");
  const [inv, setInv] = useState(null);

  // All hooks run unconditionally (db may briefly be null while loading).
  const payments = useMemo(() => {
    if (!db) return { filtered: [], keys: [], monthlyValues: [], totalFiltered: 0 };
    const filtered = db.payments.filter((p) => {
      const i = db.invoices.find((x) => x.id === p.invoiceId);
      if (termFilter === "current") return i?.term === db.meta.currentTerm;
      if (termFilter === "all") return true;
      return i?.term === termFilter;
    });
    const byMonth = {};
    for (const p of filtered) {
      const k = monthLabel(p.date);
      byMonth[k] = (byMonth[k] || 0) + p.amount;
    }
    const keys = Object.keys(byMonth).sort((a, b) => new Date(a) - new Date(b));
    const monthlyValues = keys.map((k) => byMonth[k]);
    return { filtered, keys, monthlyValues, totalFiltered: filtered.reduce((s, p) => s + p.amount, 0) };
  }, [db, termFilter]);

  const billed = useMemo(() => {
    if (!db) return {};
    const invs = db.invoices.filter((i) => (termFilter === "current" ? i.term === db.meta.currentTerm : termFilter === "all" ? true : i.term === termFilter));
    const byMonth = {};
    for (const i of invs) {
      const k = monthLabel(i.issued);
      byMonth[k] = (byMonth[k] || 0) + i.total;
    }
    return byMonth;
  }, [db, termFilter]);

  const months = useMemo(() => {
    const keys = [...new Set([...Object.keys(billed), ...payments.keys])];
    return keys.sort((a, b) => new Date(a) - new Date(b));
  }, [billed, payments]);

  const channelMix = useMemo(() => {
    const m = {};
    for (const p of payments.filtered) {
      const k = channelShort(p.channel);
      m[k] = (m[k] || 0) + p.amount;
    }
    const colors = { "MTN MoMo": CHART_COLORS.maroon, "Airtel Money": CHART_COLORS.gold, Card: CHART_COLORS.peri, "Cash / other": CHART_COLORS.green };
    return Object.entries(m)
      .map(([label, value]) => ({ label, value, color: colors[label] || CHART_COLORS.slate }))
      .sort((a, b) => b.value - a.value);
  }, [payments]);

  const familyCollection = useMemo(() => {
    if (!db) return [];
    const invs = db.invoices.filter((i) => (termFilter === "current" ? i.term === db.meta.currentTerm : termFilter === "all" ? true : i.term === termFilter));
    return db.families
      .map((f) => {
        const fi = invs.filter((i) => i.familyId === f.id);
        const t = fi.reduce((s, i) => s + i.total, 0);
        const p = fi.reduce((s, i) => s + i.paid, 0);
        return { id: f.id, family: f, total: t, paid: p, balance: t - p, pct: t ? (p / t) * 100 : 0 };
      })
      .filter((x) => x.total > 0);
  }, [db, termFilter]);

  const statusMix = useMemo(() => {
    if (!db) return [];
    const m = { paid: 0, partial: 0, unpaid: 0 };
    for (const i of db.invoices.filter((x) => (termFilter === "current" ? x.term === db.meta.currentTerm : termFilter === "all" ? true : x.term === termFilter))) m[i.status] += i.balance === 0 && i.status === "paid" ? i.total : i.balance || 0;
    return [
      { label: "Fully paid", value: m.paid, color: CHART_COLORS.green },
      { label: "Partially paid", value: m.partial, color: CHART_COLORS.gold },
      { label: "Unpaid", value: m.unpaid, color: CHART_COLORS.red },
    ].filter((s) => s.value > 0);
  }, [db, termFilter]);

  const composition = useMemo(() => {
    if (!db) return [];
    const invs = db.invoices.filter((i) => (termFilter === "current" ? i.term === db.meta.currentTerm : termFilter === "all" ? true : i.term === termFilter));
    const byKind = {};
    for (const i of invs) for (const l of i.lines) byKind[l.kind] = (byKind[l.kind] || 0) + l.amount;
    const discountsTotal = invs.reduce((s, i) => s + (i.siblingDiscount || 0), 0);
    return [
      { label: "Tuition", value: byKind.tuition || 0, sub: "Pre-School + Main School", bar: CHART_COLORS.maroon, tone: "var(--maroon)" },
      { label: "Registration & materials", value: (byKind.fee || 0), sub: "one-off per term", bar: CHART_COLORS.peri },
      { label: "Late fees", value: byKind.latefee || 0, sub: "gate auto-billing", bar: CHART_COLORS.red, tone: "var(--red)" },
      { label: "Sibling discounts", value: discountsTotal, sub: "10% pre-school line", bar: CHART_COLORS.gold },
    ];
  }, [db, termFilter]);

  if (!db) return <div className="card">Loading…</div>;

  const terms = [...new Set(db.invoices.map((i) => i.term))].sort();
  const termInvs = db.invoices.filter((i) => i.term === db.meta.currentTerm);
  const paid = termInvs.reduce((s, i) => s + i.paid, 0);
  const total = termInvs.reduce((s, i) => s + i.total, 0);
  const discounts = termInvs.reduce((s, i) => s + (i.siblingDiscount || 0), 0);
  const lateFees = termInvs.reduce((s, i) => s + i.lines.filter((l) => l.kind === "latefee").reduce((x, l) => x + l.amount, 0), 0);

  const rate = Math.round((paid / Math.max(1, total)) * 100);
  const avgPayment = payments.filtered.length ? Math.round(payments.totalFiltered / payments.filtered.length) : 0;
  const riskFamilies = familyCollection.filter((f) => f.balance > 0).sort((a, b) => a.pct - b.pct);
  const overdue = db.invoices.filter((i) => i.balance > 0 && i.term === db.meta.currentTerm && i.due < new Date().toISOString().slice(0, 10));

  function settle(invoiceId) {
    setInv(invoiceId);
  }

  return (
    <div>
      <div className="section-head">
        <h2>Fees, Reconciliation & Mobile Money</h2>
        <Badge tone="blue">Mr. Isaac Twesigye · Bursar</Badge>
      </div>

      <div className="tabs">
        <button className={tab === "analytics" ? "on" : ""} onClick={() => setTab("analytics")}>Analytics</button>
        <button className={tab === "ledger" ? "on" : ""} onClick={() => setTab("ledger")}>Fee ledger</button>
        <button className={tab === "payments" ? "on" : ""} onClick={() => setTab("payments")}>Payments & receipts</button>
        <button className={tab === "audit" ? "on" : ""} onClick={() => setTab("audit")}>Audit trail</button>
      </div>

      {/* ---------------- ANALYTICS ---------------- */}
      {tab === "analytics" && (
        <div>
          <div className="row" style={{ marginBottom: "1rem", gap: "0.5rem", flexWrap: "wrap" }}>
            <span className="small muted">Terms:</span>
            {[{ id: "current", label: db.meta.currentTerm }, { id: "all", label: "All terms" }, ...terms.filter((t) => t !== db.meta.currentTerm).map((t) => ({ id: t, label: t }))].map((t) => (
              <button
                key={t.id}
                onClick={() => setTermFilter(t.id)}
                className="small"
                style={{
                  cursor: "pointer",
                  padding: "0.35rem 0.8rem",
                  borderRadius: 999,
                  border: termFilter === t.id ? "1px solid var(--maroon)" : "1px solid var(--line)",
                  background: termFilter === t.id ? "var(--maroon)" : "#fff",
                  color: termFilter === t.id ? "#fff" : "var(--ink)",
                  fontWeight: termFilter === t.id ? 700 : 500,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* KPI row with trends */}
          <div className="grid grid-4" style={{ marginBottom: "1.2rem" }}>
            <div className="card stat">
              <span className="stat-label">Collected {termFilter === "current" ? `(${db.meta.currentTerm})` : ""}</span>
              <span className="stat-value" style={{ color: "var(--green)" }}>{fmtUGX(payments.totalFiltered || paid)}</span>
              <div className="small muted">{payments.filtered.length} reconciled payments · avg {fmtUGX(avgPayment)}</div>
              <Sparkline values={payments.monthlyValues} color={CHART_COLORS.green} />
            </div>
            <div className="card stat">
              <span className="stat-label">Outstanding {termFilter === "current" ? `(${db.meta.currentTerm})` : ""}</span>
              <span className="stat-value" style={{ color: "var(--red)" }}>{fmtUGX(familyCollection.reduce((s, f) => s + f.balance, 0))}</span>
              <div className="small muted">{riskFamilies.length} families with a balance · {overdue.length} overdue</div>
              <Sparkline values={payments.monthlyValues.map((v) => Math.max(0, 1 - v / (Math.max(...payments.monthlyValues, 1))))} color={CHART_COLORS.red} />
            </div>
            <div className="card stat">
              <span className="stat-label">Collection rate</span>
              <span className="stat-value">{rate}%</span>
              <div className="progress" style={{ margin: "0.4rem 0 0.2rem" }}><div style={{ width: `${Math.max(2, rate)}%` }} /></div>
              <div className="small muted">{fmtUGX(paid)} of {fmtUGX(total)} · {Math.round(rate / 10) * 10}% target</div>
            </div>
            <div className="card stat">
              <span className="stat-label">Late fees & discounts</span>
              <span className="stat-value" style={{ color: "#8a6410" }}>{fmtUGX(lateFees)}</span>
              <div className="small muted">late fees · <b>{fmtUGX(discounts)}</b> sibling discounts applied</div>
              <Sparkline values={[discounts, discounts, lateFees + discounts, lateFees + discounts + 10000]} color={CHART_COLORS.gold} />
            </div>
          </div>

          {/* Cash flow + channel mix */}
          <div className="grid grid-analytics" style={{ marginBottom: "1.2rem" }}>
            <div className="card">
              <div className="spread" style={{ marginBottom: "0.6rem" }}>
                <div>
                  <h3 style={{ margin: 0 }}>Cash flow — billed vs collected</h3>
                  <p className="small muted" style={{ margin: "0.2rem 0 0" }}>Billing from invoice issue dates, collections from settled payments.</p>
                </div>
                <Badge tone="blue">UGX {fmtUGX(payments.totalFiltered)} in</Badge>
              </div>
              <GroupedBars
                labels={months}
                series={[
                  { name: "Billed", color: CHART_COLORS.periLight, values: months.map((m) => billed[m] || 0) },
                  { name: "Collected", color: CHART_COLORS.maroon, values: months.map((m) => payments.keys.includes(m) ? payments.monthlyValues[payments.keys.indexOf(m)] : 0) },
                ]}
              />
            </div>
            <div className="card">
              <h3 style={{ margin: 0 }}>Channel mix</h3>
              <p className="small muted" style={{ margin: "0.2rem 0 0.8rem" }}>Where the money came in — auto-reconciled.</p>
              <Donut segments={channelMix} centerTitle="Total received" centerValue={commentCompact(payments.totalFiltered)} />
            </div>
          </div>

          {/* Family collection + status */}
          <div className="grid grid-analytics" style={{ marginBottom: "1.2rem" }}>
            <div className="card">
              <div className="spread" style={{ marginBottom: "0.8rem" }}>
                <div>
                  <h3 style={{ margin: 0 }}>Collection by family</h3>
                  <p className="small muted" style={{ margin: "0.2rem 0 0" }}>Lowest completion first — the families to follow up.</p>
                </div>
                <Badge tone={riskFamilies.length ? "gold" : "green"}>{riskFamilies.length} with balance</Badge>
              </div>
              <HBarList
                unit=""
                items={familyCollection
                  .slice()
                  .sort((a, b) => a.pct - b.pct)
                  .map((f) => ({
                    label: `${f.family.name} family`,
                    sub: f.family.children.map((c) => c.name.split(" ")[0]).join(", "),
                    value: f.pct,
                    extra: `${fmtUGX(f.balance)} left of ${fmtUGX(f.total)}`,
                    bar: f.pct >= 100 ? CHART_COLORS.green : f.pct >= 50 ? CHART_COLORS.gold : CHART_COLORS.red,
                    tone: f.pct >= 100 ? "var(--green)" : f.pct >= 50 ? "#8a6410" : "var(--red)",
                  }))}
              />
            </div>
            <div className="card">
              <h3 style={{ margin: 0 }}>Invoice status mix</h3>
              <p className="small muted" style={{ margin: "0.2rem 0 0.8rem" }}>Paid vs remaining balances.</p>
              <Donut segments={statusMix} centerTitle="Total billed" centerValue={commentCompact(statusMix.reduce((s, x) => s + x.value, 0))} size={170} />
              {overdue.length > 0 && (
                <div className="quote" style={{ marginTop: "0.9rem", borderColor: "var(--red)" }}>
                  <b className="small">Due now</b>
                  {overdue.map((i) => {
                    const f = db.families.find((x) => x.id === i.familyId);
                    return (
                      <div key={i.id} className="small" style={{ marginTop: "0.25rem" }}>
                        {f?.name} · {fmtUGX(i.balance)} · due {i.due}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Composition + risk list */}
          <div className="grid grid-2" style={{ marginBottom: "1.2rem" }}>
            <div className="card">
              <h3 style={{ margin: 0 }}>What the bills are made of</h3>
              <p className="small muted" style={{ margin: "0.2rem 0 0.8rem" }}>Billing composition{termFilter === "current" ? ` for ${db.meta.currentTerm}` : termFilter === "all" ? " across all terms" : ` for ${termFilter}`}.</p>
              <HBarList items={composition} unit=" UGX" />
            </div>
            <div className="card">
              <h3 style={{ margin: 0 }}>Collection trend</h3>
              <p className="small muted" style={{ margin: "0.2rem 0 0.8rem" }}>Monthly inflow{termFilter === "current" ? ` — ${db.meta.currentTerm}` : ""}.</p>
              <AreaChart data={payments.keys.map((k, i) => ({ label: k, value: payments.monthlyValues[i] }))} height={230} color={CHART_COLORS.maroon} unit="" />
            </div>
          </div>
        </div>
      )}

      {tab === "ledger" && (
        <div className="card">
          <table>
            <thead><tr><th>Family</th><th>Term</th><th>Children</th><th>Late fees</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {db.invoices.map((i) => {
                const fam = db.families.find((f) => f.id === i.familyId);
                const kidNames = fam.children.map((c) => c.name).join(", ");
                const lateAmt = i.lines.filter((l) => l.kind === "latefee").reduce((s, l) => s + l.amount, 0);
                return (
                  <tr key={i.id}>
                    <td><b>{fam.name}</b><div className="small muted">{kidNames}</div></td>
                    <td className="small">{i.term}</td>
                    <td>{i.siblingDiscount ? <span className="badge gold">sib −{fmtUGX(i.siblingDiscount)}</span> : <span className="muted small">—</span>}</td>
                    <td>{lateAmt ? <span className="badge red">+{fmtUGX(lateAmt)}</span> : <span className="muted small">—</span>}</td>
                    <td><b>{fmtUGX(i.total)}</b></td>
                    <td style={{ color: "var(--green)" }}>{fmtUGX(i.paid)}</td>
                    <td style={{ color: i.balance ? "var(--red)" : "var(--green)" }}><b>{fmtUGX(i.balance)}</b></td>
                    <td><Badge tone={i.status === "paid" ? "green" : i.status === "partial" ? "gold" : "red"}>{i.status}</Badge></td>
                    <td>
                      {i.balance > 0 && (
                        <button className="btn secondary sm" onClick={() => settle(i.id)}>Record payment</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === "payments" && (
        <div className="grid grid-2">
          <div className="card">
            <h3> Payment stream</h3>
            {db.payments.map((p) => {
              const fam = db.families.find((f) => f.id === p.familyId);
              return (
                <div className="list-item" key={p.id}>
                  <div className="spread">
                    <div>
                      <b>{fmtUGX(p.amount)}</b> · <span className="small">{p.channel}</span>
                      <div className="small muted mono">{p.receipt} · {p.reference}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <Badge tone="green">settled</Badge>
                      <div className="small muted">{fam?.name} · {p.date}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="card">
            <h3> Reconciliation, automated</h3>
            {[
              ["MTN MoMo statement batch", "Auto-matched to invoices by reference · 4:00 pm sweep", "green"],
              ["Airtel Merchant portal", "API call-out → ledger update → recipient = invoice", "green"],
              ["Visa / card", "Card processor settlement matched by receipt number", "green"],
              ["Cash & bank slips (front office)", "Manual entry remains, but every entry is audit-logged", "gold"],
            ].map(([t, d, tone]) => (
              <div className="list-item" key={t}>
                <b>{t}</b> <Badge tone={tone}>{tone === "green" ? "automated" : "assisted"}</Badge>
                <div className="small muted">{d}</div>
              </div>
            ))}
            <div className="quote" style={{ marginTop: "0.7rem" }}> Estimated saving: <b>36 hours of manual bank reconciliation per month</b> — the platform clears the balance, sends the receipt and notifies the family.
            </div>
          </div>
        </div>
      )}

      {tab === "audit" && (
        <div className="card">
          <table>
            <thead><tr><th>When</th><th>Actor</th><th>Action</th><th style={{ textAlign: "right" }}>Amount</th></tr></thead>
            <tbody>
              {db.feesAudit.map((a) => (
                <tr key={a.id}>
                  <td className="small muted mono">{a.date}</td>
                  <td className="small">{a.actor}</td>
                  <td className="small">{a.action}</td>
                  <td className="small" style={{ textAlign: "right" }}>{a.amount ? fmtUGX(a.amount) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {inv && <RecordPaymentModal invoiceId={inv} onClose={() => setInv(null)} />}
    </div>
  );
}

function RecordPaymentModal({ invoiceId, onClose }) {
  const { db, act } = useApp();
  const inv = db.invoices.find((i) => i.id === invoiceId);
  const fam = db.families.find((f) => f.id === inv.familyId);
  const [amount, setAmount] = useState(inv.balance);
  const [channel, setChannel] = useState("MTN Mobile Money");
  const [phone, setPhone] = useState(fam ? db.users.find((u) => u.id === fam.parentUserId)?.phone : "");
  const [busy, setBusy] = useState(false);

  async function pay(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await act("payInvoice", { invoiceId, amount: Number(amount), channel, phone }, `Payment settled — receipt sent to ${fam.name} family.`);
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`Record payment — ${fam.name} family`} onClose={onClose}>
      <div className="quote" style={{ marginBottom: "0.9rem" }}>
        <b>Balance due: {fmtUGX(inv.balance)}</b>
        <div className="small muted">Receipt is generated automatically and the family is notified by SMS.</div>
      </div>
      <form onSubmit={pay}>
        <Field label="Amount (UGX)"><input type="number" required min="1" max={inv.balance} value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
        <Field label="Channel">
          <select value={channel} onChange={(e) => setChannel(e.target.value)}>
            {["MTN Mobile Money", "Airtel Money", "Visa / Mastercard", "Cash (front office)"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        {channel.includes("Money") && (
          <Field label="Parent phone (for the payment reference)"><input value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
        )}
        <button className="btn" style={{ width: "100%", marginTop: "0.8rem" }} disabled={busy}>
          {busy ? "Settling…" : "Settle & send receipt"}
        </button>
      </form>
    </Modal>
  );
}

function commentCompact(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "k";
  return String(n);
}
