"use client";
import { useState } from "react";
import { useApp, Badge, Stat, Progress, Modal, Field, fmtUGX } from "@/components/ui.jsx";

export default function AdminFeesPage() {
  const { db, act } = useApp();
  const [tab, setTab] = useState("ledger");
  const [inv, setInv] = useState(null);
  if (!db) return <div className="card">Loading…</div>;

  const termInvs = db.invoices.filter((i) => i.term === db.meta.currentTerm);
  const paid = termInvs.reduce((s, i) => s + i.paid, 0);
  const total = termInvs.reduce((s, i) => s + i.total, 0);
  const discounts = termInvs.reduce((s, i) => s + (i.siblingDiscount || 0), 0);

  function settle(invoiceId) {
    setInv(invoiceId);
  }

  return (
    <div>
      <div className="section-head">
        <h2>Fees, Reconciliation & Mobile Money</h2>
        <Badge tone="blue">Mr. Isaac Twesigye · Bursar</Badge>
      </div>

      <div className="grid grid-4" style={{ marginBottom: "1.2rem" }}>
        <Stat label="Collected ({term})" value={fmtUGX(paid)} sub={`${Math.round((paid / Math.max(1, total)) * 100)}% of ${fmtUGX(total)}`} tone="green" />
        <Stat label="Outstanding" value={fmtUGX(total - paid)} sub="monthly reminder SMS auto-sends" tone="red" />
        <Stat label="Sibling discounts auto-applied" value={fmtUGX(discounts)} sub="pre-school families with a main-school sibling" tone="gold" />
        <Stat label="Reconciled payments" value={db.payments.length} sub="MTN · Airtel · Visa — zero manual entry" />
      </div>

      <div className="tabs">
        <button className={tab === "ledger" ? "on" : ""} onClick={() => setTab("ledger")}>🧾 Fee ledger</button>
        <button className={tab === "payments" ? "on" : ""} onClick={() => setTab("payments")}>💸 Payments & receipts</button>
        <button className={tab === "audit" ? "on" : ""} onClick={() => setTab("audit")}>🔍 Audit trail</button>
      </div>

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
            <h3>💸 Payment stream</h3>
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
            <h3>🔄 Reconciliation, automated</h3>
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
            <div className="quote" style={{ marginTop: "0.7rem" }}>
              ⏱️ Estimated saving: <b>36 hours of manual bank reconciliation per month</b> — the platform clears the balance, sends the receipt and notifies the family.
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
                  <td>{a.actor}</td>
                  <td>{a.action}</td>
                  <td style={{ textAlign: "right" }} className="mono">{a.amount ? fmtUGX(a.amount) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {inv && (
        <Modal title="Record payment" onClose={() => setInv(null)}>
          <RecordPaymentForm invoiceId={inv} onDone={() => setInv(null)} />
        </Modal>
      )}
    </div>
  );
}

function RecordPaymentForm({ invoiceId, onDone }) {
  const { db, act } = useApp();
  const inv = db.invoices.find((i) => i.id === invoiceId);
  const [amount, setAmount] = useState(inv.balance);
  const [channel, setChannel] = useState("MTN Mobile Money");
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    try {
      await act("payInvoice", { invoiceId, amount: Number(amount), channel }, `Payment of ${fmtUGX(amount)} recorded, receipt issued, invoice cleared.`);
      onDone();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <p className="small muted">Invoice {inv.id} · {fmtUGX(inv.balance)} remaining for {inv.term}</p>
      <Field label="Amount (UGX)"><input type="number" value={amount} max={inv.balance} onChange={(e) => setAmount(e.target.value)} /></Field>
      <Field label="Channel">
        <select value={channel} onChange={(e) => setChannel(e.target.value)}>
          <option>MTN Mobile Money</option><option>Airtel Money</option><option>Visa / Mastercard</option><option>Cash — front office</option><option>Bank transfer</option>
        </select>
      </Field>
      <button className="btn" style={{ width: "100%" }} disabled={busy} onClick={go}>{busy ? "Recording…" : "Record & settle"}</button>
    </div>
  );
}
