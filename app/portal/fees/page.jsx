"use client";
import Link from "next/link";
import { useState } from "react";
import { useApp, Badge, Modal, Field, fmtUGX } from "@/components/ui.jsx";
import { currentFamily, familyInvoices, balances } from "@/lib/client.js";
import Icon from "@/components/icons.jsx";

const CHANNELS = [
  { id: "MTN Mobile Money", logo: "MoMo", bg: "#ffcc00", color: "#1b1b1b", hint: "You'll receive a prompt on your phone" },
  { id: "Airtel Money", logo: "Airtel", bg: "#e40000", color: "#fff", hint: "You'll receive a prompt on your phone" },
  { id: "Visa / Mastercard", logo: "VISA", bg: "#1a1f71", color: "#fff", hint: "Enter card details on the secure checkout page" },
];

function PayModal({ inv, onClose }) {
  const { act } = useApp();
  const [channel, setChannel] = useState("MTN Mobile Money");
  const [amount, setAmount] = useState(inv.balance);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  async function pay() {
    setBusy(true);
    try {
      await act("payInvoice", { invoiceId: inv.id, amount: Number(amount), channel, phone }, `Payment of ${fmtUGX(amount)} settled via ${channel} — receipt & SMS sent.`);
      onClose();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`Pay — ${inv.term}`} onClose={onClose}>
      <p className="small muted">Invoice {inv.id} · balance due {fmtUGX(inv.balance)}</p>
      <div className="grid" style={{ gap: "0.6rem", margin: "0.8rem 0" }}>
        {CHANNELS.map((c) => (
          <button key={c.id} className={`pay-btn ${channel === c.id ? "sel" : ""}`} onClick={() => setChannel(c.id)}>
            <span className="pay-logo" style={{ background: c.bg, color: c.color }}>{c.logo}</span>
            <span>
              <b>{c.id}</b>
              <div className="small muted">{c.hint}</div>
            </span>
          </button>
        ))}
      </div>
      <Field label="Amount (UGX)">
        <input type="number" min="1" max={inv.balance} value={amount} onChange={(e) => setAmount(e.target.value)} />
      </Field>
      {(channel === "MTN Mobile Money" || channel === "Airtel Money") && (
        <Field label="Mobile money number"><input placeholder="07XX XXX XXX" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
      )}
      <button className="btn" style={{ width: "100%" }} disabled={busy || !amount} onClick={pay}>
        {busy ? "Processing…" : `Pay ${fmtUGX(amount)} →`}
      </button>
      <p className="small muted" style={{ marginTop: "0.6rem", textAlign: "center" }}> Instant reconciliation: the Bursar's ledger clears automatically and a digital receipt is issued.
      </p>
    </Modal>
  );
}

export default function FeesPage() {
  const { db } = useApp();
  const [payInv, setPayInv] = useState(null);
  if (!db) return <div className="card">Loading…</div>;

  const family = currentFamily(db, "u-parent-1");
  const invs = familyInvoices(db, family.id);
  const bal = balances(db);
  const current = invs[0];
  const receipts = db.payments.filter((p) => p.familyId === family.id);

  return (
    <div>
      <div className="section-head">
        <h2>Fees & Payments</h2>
        <Badge tone="gold">{fmtUGX(bal.balance)} outstanding</Badge>
      </div>

      <div className="grid grid-3" style={{ marginBottom: "1.2rem" }}>
        <div className="card stat"><span className="stat-label">Term total</span><span className="stat-value">{fmtUGX(bal.total)}</span></div>
        <div className="card stat"><span className="stat-label">Paid & reconciled</span><span className="stat-value" style={{ color: "var(--green)" }}>{fmtUGX(bal.paid)}</span></div>
        <div className="card stat"><span className="stat-label">Auto sibling discount</span><span className="stat-value" style={{ color: "#8a6410" }}>{fmtUGX(bal.siblingDiscounts)}</span></div>
      </div>

      {current && (
        <div className="card" style={{ marginBottom: "1.4rem", borderColor: bal.balance > 0 ? "var(--maroon-2)" : "var(--leaf)" }}>
          <div className="spread">
            <div>
              <h3>{current.term} — consolidated statement (both children)</h3>
              <span className="small muted">Due {current.due} · issued {current.issued}</span>
            </div>
            <Badge tone={current.status === "paid" ? "green" : current.status === "partial" ? "gold" : "red"}>
              {current.status === "paid" ? "PAID" : current.status === "partial" ? "PARTIALLY PAID" : "UNPAID"}
            </Badge>
          </div>
          <table style={{ marginTop: "0.6rem" }}>
            <thead><tr><th>Item</th><th>Child</th><th>Discount</th><th style={{ textAlign: "right" }}>Amount</th></tr></thead>
            <tbody>
              {current.lines.map((l, i) => {
                const kid = db.studentIndex[l.studentId];
                return (
                  <tr key={i}>
                    <td>{l.label} {l.kind === "latefee" && <Badge tone="red">late fee</Badge>}</td>
                    <td className="small">{kid?.name || "—"}</td>
                    <td>{l.discount ? <span className="badge gold">−{fmtUGX(l.discount)}</span> : <span className="muted small">—</span>}</td>
                    <td style={{ textAlign: "right" }}>{fmtUGX(l.amount - l.discount)}</td>
                  </tr>
                );
              })}
              <tr>
                <td colSpan="3" style={{ textAlign: "right" }}><b>Total</b></td>
                <td style={{ textAlign: "right" }}><b>{fmtUGX(current.total)}</b></td>
              </tr>
              <tr>
                <td colSpan="3" style={{ textAlign: "right" }}><span className="muted">Paid</span></td>
                <td style={{ textAlign: "right", color: "var(--green)" }}>{fmtUGX(current.paid)}</td>
              </tr>
              <tr>
                <td colSpan="3" style={{ textAlign: "right" }}><b>Balance</b></td>
                <td style={{ textAlign: "right", color: current.balance ? "var(--red)" : "var(--green)" }}><b>{fmtUGX(current.balance)}</b></td>
              </tr>
            </tbody>
          </table>
          {current.balance > 0 && (
            <div style={{ marginTop: "0.9rem" }}>
              <button className="btn gold" onClick={() => setPayInv(current)}>
                <Icon name="card" size={16} /> {current.balance > 0 ? `Pay ${fmtUGX(current.balance)} now` : "Pay now"}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-2">
        <div className="card">
          <h3> How payments work</h3>
          <div className="small muted" style={{ marginBottom: "0.7rem" }}>All three channels reconcile against the Bursar's ledger instantly.</div>
          {[
            ["MTN Mobile Money", "Pay directly from your phone — prompt arrives in seconds.", "yellow"],
            ["Airtel Money", "Same instant flow, Airtel network friendly.", "red"],
            ["Visa / Mastercard", "Secure card checkout with digital receipt.", "blue"],
            ["Auto-receipts", "Every payment issues a receipt and updates all balances.", "green"],
          ].map(([t, d, tone]) => (
            <div className="list-item" key={t}>
              <b>{t}</b> <Badge tone={tone}>{tone === "yellow" ? "MTN" : tone === "red" ? "Airtel" : tone === "blue" ? "Card" : "System"}</Badge>
              <div className="small muted">{d}</div>
            </div>
          ))}
          <Link href="#" onClick={(e) => e.preventDefault()} className="small">View payment methods policy →</Link>
        </div>
        <div className="card">
          <h3> Recent payments & receipts</h3>
          {receipts.length === 0 && <p className="muted small">No payments yet.</p>}
          {receipts.map((p) => (
            <div className="list-item" key={p.id}>
              <div className="spread">
                <div>
                  <b>{fmtUGX(p.amount)}</b> · <span className="small">{p.channel}</span>
                  <div className="small muted mono">{p.receipt} · {p.reference}</div>
                </div>
                <Badge tone="green">settled</Badge>
              </div>
              <div className="small muted">{p.date}</div>
            </div>
          ))}
        </div>
      </div>

      {payInv && <PayModal inv={payInv} onClose={() => setPayInv(null)} />}
    </div>
  );
}
