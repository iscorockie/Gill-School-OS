"use client";
import { useApp, Badge, Stat, fmtUGX } from "@/components/ui.jsx";

export default function SavingsPage() {
  const { db } = useApp();
  if (!db) return <div className="card">Loading…</div>;

  const cs = db.meta.costSaving;
  const capturedLate = db.pickups.filter((p) => p.late).reduce((s, p) => s + p.fee, 0);
  const reconciled = db.payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <div className="section-head">
        <h2>Cost-Savings & Revenue Report</h2>
        <Badge tone="gold">prepared for School Leadership</Badge>
      </div>

      <div className="grid grid-4" style={{ marginBottom: "1.2rem" }}>
        <Stat label="3rd-party app savings" value={`$${cs.classDojoPremiumAnnual}`} sub="ClassDojo premium replaced by built-in noticeboard" tone="green" />
        <Stat label="Paper & printing" value={fmtUGX(cs.paperPrintingAnnual)} sub="paperless admissions + digital library" tone="green" />
        <Stat label="Bursar hours saved" value={`${cs.hoursReconciledMonthly}h/mo`} sub="automated Mobile Money reconciliation" tone="blue" />
        <Stat label="Late-pickup revenue" value={fmtUGX(capturedLate)} sub="auto-billed at the gate — never lost" tone="red" />
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>💰 What the platform earns & saves (annual estimate)</h3>
          <table>
            <thead><tr><th>Stream</th><th>Type</th><th style={{ textAlign: "right" }}>Value</th></tr></thead>
            <tbody>
              {[
                ["In-house noticeboard & messaging", "Save", `$${cs.classDojoPremiumAnnual} subscriptions avoided`],
                ["Paperless admissions & documents", "Save", fmtUGX(cs.paperPrintingAnnual)],
                ["Digital resource hub (worksheets, past papers)", "Save", fmtUGX(1200000), "photocopying cost avoided"],
                ["Mobile Money auto-reconciliation", "Save", `${cs.hoursReconciledMonthly} hrs/mo`],
                ["Late-pickup auto-billing", "Revenue", fmtUGX(capturedLate) + " captured this term"],
                ["Term pre-orders (uniforms & books)", "Revenue", fmtUGX(db.stats.ordersValue) + " pre-paid this term"],
                ["Pre-School → Main transition fee", "Revenue", "one less lost enrolment"],
              ].map((r) => (
                <tr key={r[0]}>
                  <td><b>{r[0]}</b>{r[3] && <div className="small muted">{r[3]}</div>}</td>
                  <td><Badge tone={r[1] === "Save" ? "green" : "gold"}>{r[1]}</Badge></td>
                  <td style={{ textAlign: "right" }}>{r[2]}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={2} style={{ textAlign: "right" }}><b>Combined annual impact</b></td>
                <td style={{ textAlign: "right" }}><b>≈ UGX 8.2M + 36 hrs/mo</b></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>🧾 Reconciliation dashboard</h3>
          <div className="spread" style={{ marginBottom: "0.6rem" }}>
            <span className="stat-label" style={{ fontSize: "0.9rem" }}>Payments auto-settled this demo</span>
            <b>{fmtUGX(reconciled)}</b>
          </div>
          <div className="list-item">
            <div className="spread"><span>MTN Mobile Money</span><b>{fmtUGX(db.payments.filter((p) => p.channel === "MTN Mobile Money").reduce((s, p) => s + p.amount, 0))}</b></div>
            <div className="small muted">matched by merchant reference → invoice</div>
          </div>
          <div className="list-item">
            <div className="spread"><span>Airtel Money</span><b>{fmtUGX(db.payments.filter((p) => p.channel === "Airtel Money").reduce((s, p) => s + p.amount, 0))}</b></div>
            <div className="small muted">matched by merchant reference → invoice</div>
          </div>
          <div className="list-item">
            <div className="spread"><span>Card / Visa</span><b>{fmtUGX(db.payments.filter((p) => p.channel === "Visa / Mastercard").reduce((s, p) => s + p.amount, 0))}</b></div>
            <div className="small muted">matched by settlement receipt</div>
          </div>
          <div className="quote" style={{ marginTop: "0.8rem" }}>
            The Bursar's evening is spent approving, not reconciling. Every shilling appears in the audit trail above with a timestamp and actor.
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: "1.2rem", background: "var(--green-50)", borderColor: "var(--green)" }}>
        <h3>🗣️ The pitch to leadership</h3>
        <p className="small" style={{ margin: "0.3rem 0 0" }}>
          Gill School OS doesn't just digitise the website — it <b>pays for itself</b>. It replaces premium third-party apps, reclaims
          late-fee revenue that manual registers lose, moves the whole admissions flow paperless, and gives parents one login for a
          Pre-Schooler and a Cambridge pupil so the school keeps families from Pre-K all the way to Checkpoint.
        </p>
      </div>
    </div>
  );
}
