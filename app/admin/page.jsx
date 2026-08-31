"use client";
import Link from "next/link";
import { useApp, Badge, Stat, Progress, fmtUGX, fmtDate } from "@/components/ui.jsx";

export default function AdminDashboard() {
  const { db } = useApp();
  if (!db) return <div className="card">Loading…</div>;

  const term = db.stats;
  const paid = term.invoices.reduce((s, i) => s + i.paid, 0);
  const total = term.invoices.reduce((s, i) => s + i.total, 0);
  const discount = term.invoices.reduce((s, i) => s + (i.siblingDiscount || 0), 0);
  const late = term.invoices.reduce((s, i) => s + i.lines.filter((l) => l.kind === "latefee").reduce((x, l) => x + l.amount, 0), 0);

  return (
    <div>
      <div className="section-head">
        <h2>Operations dashboard</h2>
        <Badge tone="gold">{db.meta.currentTerm}</Badge>
      </div>

      <div className="grid grid-4" style={{ marginBottom: "1.2rem" }}>
        <Stat label="Families" value={term.families} sub={`${term.students} children · pre + main`} />
        <Stat label="Fees collected" value={fmtUGX(paid)} sub={`of ${fmtUGX(total)} due this term`} tone="green" />
        <Stat label="Auto sibling discounts" value={fmtUGX(discount)} sub="10% pre-school tuition · applied live" tone="gold" />
        <Stat label="Notices / late-fee revenue" value={fmtUGX(late)} sub="auto-billed at the gate" tone={late ? "red" : undefined} />
      </div>

      <div className="grid grid-2" style={{ marginBottom: "1.2rem" }}>
        <div className="card">
          <div className="spread">
            <h3>💰 Term fee collection</h3>
            <span className="small muted">{Math.round((paid / Math.max(1, total)) * 100)}% collected</span>
          </div>
          <Progress pct={(paid / Math.max(1, total)) * 100} />
          <table style={{ marginTop: "0.7rem" }}>
            <tbody>
              {term.invoices.map((i) => {
                const fam = db.families.find((f) => f.id === i.familyId);
                return (
                  <tr key={i.id}>
                    <td><b>{fam.name} family</b><div className="small muted">{i.term}</div></td>
                    <td><span className="badge gold">sib −{fmtUGX(i.siblingDiscount)}</span> {i.lines.some((l) => l.kind === "latefee") && <span className="badge red">late</span>}</td>
                    <td style={{ textAlign: "right" }}><b>{fmtUGX(i.balance)}</b><div className="small muted">of {fmtUGX(i.total)}</div></td>
                    <td style={{ textAlign: "right" }}>
                      <Badge tone={i.status === "paid" ? "green" : i.status === "partial" ? "gold" : "red"}>{i.status}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Link href="/admin/fees" className="btn secondary sm">Open fees & reconciliation →</Link>
        </div>

        <div className="card">
          <h3>🚨 Needs attention</h3>
          <div className="list-item">
            <div className="spread">
              <b>⏳ {term.pendingLeaves} pending leave {term.pendingLeaves === 1 ? "request" : "requests"}</b>
              <Link className="btn ghost sm" href="/admin/leaves">Review</Link>
            </div>
          </div>
          <div className="list-item">
            <div className="spread">
              <b>🧾 {term.pendingDocs} documents awaiting admissions verification</b>
              <Link className="btn ghost sm" href="/admin/admissions">Review</Link>
            </div>
          </div>
          <div className="list-item">
            <div className="spread">
              <b>🎓 {term.openTransitions} Pre-School → Main School transition{term.openTransitions === 1 ? "" : "s"} ready</b>
              <Link className="btn ghost sm" href="/admin/admissions">One-click migrate</Link>
            </div>
          </div>
          <div className="list-item">
            <div className="spread">
              <b>👕 {fmtUGX(term.ordersValue)} in pre-orders this term</b>
              <Link className="btn ghost sm" href="/portal/orders">View</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>🕔 Gate log — late collections</h3>
          {db.pickups.slice(0, 5).map((p) => {
            const kid = db.studentIndex[p.studentId];
            return (
              <div className="list-item" key={p.id}>
                <div className="spread">
                  <div>
                    <b>{kid?.name}</b> · <span className="small">{p.collector}</span>
                    <div className="small muted">{p.date} · out at {p.timeOut}</div>
                  </div>
                  {p.late ? (
                    <div style={{ textAlign: "right" }}>
                      <Badge tone="red">+{fmtUGX(p.fee)} billed</Badge>
                      <div className="small muted">SMS sent {p.notified ? "✓" : "✗"}</div>
                    </div>
                  ) : (
                    <Badge tone="green">on time</Badge>
                  )}
                </div>
              </div>
            );
          })}
          <Link href="/admin/pickups" className="btn secondary sm">Open gate console →</Link>
        </div>

        <div className="card">
          <h3>📈 Live audit trail (last actions)</h3>
          {db.feesAudit.slice(0, 5).map((a) => (
            <div className="list-item" key={a.id}>
              <div className="spread">
                <div>
                  <b className="small">{a.action}</b>
                  <div className="small muted">{a.date} · {a.actor}</div>
                </div>
                {a.amount > 0 && <span className="mono small">{fmtUGX(a.amount)}</span>}
              </div>
            </div>
          ))}
          <p className="small muted" style={{ marginTop: "0.5rem" }}>
            Every shilling the system moves is logged — perfect for the Bursar's audit.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: "1.2rem", background: "var(--green-50)", borderColor: "var(--green)" }}>
        <div className="spread">
          <div>
            <b>🔑 Demo access</b>
            <p className="small" style={{ margin: "0.2rem 0 0" }}>
              Parent: <span className="mono">Amina Nansubuga</span> · Bursar: <span className="mono">Mr. Isaac Twesigye</span> ·
              Admissions: <span className="mono">Mrs. Mary Kyomukama</span> · Gate: <span className="mono">Mr. Peter Othieno</span>
            </p>
          </div>
          <div className="row">
            <Link className="btn secondary sm" href="/">Landing page</Link>
            <button className="btn ghost sm" onClick={() => fetch("/api/reset", { method: "POST" }).then(() => location.reload())}>↺ Reset demo data</button>
          </div>
        </div>
      </div>
    </div>
  );
}
