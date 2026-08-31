"use client";
import Link from "next/link";
import { useApp, Badge, Stat, Progress } from "@/components/ui.jsx";
import { currentFamily, balances, notificationsFor } from "@/lib/client.js";
import { fmtUGX, fmtDate } from "@/components/ui.jsx";

export default function PortalHome() {
  const { db } = useApp();
  if (!db) return <div className="card">Loading…</div>;

  const family = currentFamily(db, "u-parent-1");
  const kids = family.children;
  const bal = balances(db);
  const notes = notificationsFor(db, "u-parent-1").filter((m) => !m.read);
  const pres = kids.find((c) => c.campus === "preschool");
  const main = kids.find((c) => c.campus === "main");
  const inv = db.invoices.find((i) => i.familyId === family.id && i.term === db.meta.currentTerm);

  return (
    <div>
      <div className="card" style={{ background: "linear-gradient(135deg,#0b6b4f,#0f8262)", borderColor: "transparent", color: "#fff", marginBottom: "1.2rem" }}>
        <div className="spread">
          <div>
            <span style={{ color: "var(--gold)", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {db.meta.currentTerm}
            </span>
            <h2 style={{ color: "#fff", margin: "0.25rem 0 0.4rem" }}>Karibu, {family.name} family 👋</h2>
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.92rem" }}>
              {kids.length} children across both campuses · {pres ? "Pre-School" : ""}{pres && main ? " + " : ""}{main ? "International School" : ""} · one account, one fee statement.
            </p>
          </div>
          <div className="card" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.25)", minWidth: 230 }}>
            <span className="stat-label" style={{ color: "rgba(255,255,255,0.7)" }}>Balance due · {db.meta.currentTerm}</span>
            <div style={{ fontSize: "1.7rem", fontWeight: 800, fontFamily: "ui-serif, Georgia, serif" }}>{fmtUGX(bal.balance)}</div>
            <Progress pct={(bal.paid / Math.max(1, bal.total)) * 100} gold />
            <div className="small" style={{ color: "rgba(255,255,255,0.8)", marginTop: "0.35rem" }}>
              {fmtUGX(bal.paid)} paid of {fmtUGX(bal.total)}
            </div>
          </div>
        </div>
        <div className="row" style={{ marginTop: "1rem" }}>
          <Link className="btn gold" href="/portal/fees">Pay with Mobile Money</Link>
          <Link className="btn" style={{ background: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.4)", color: "#fff" }} href="/portal/leave">Request absence</Link>
          {notes.length > 0 && (
            <Link className="btn" style={{ background: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.4)", color: "#fff" }} href="/portal/news">
              🔔 {notes.length} unread
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: "1.2rem" }}>
        <Stat label="Sibling discount applied" value={fmtUGX(bal.siblingDiscounts)} sub="10% off Pre-School tuition — automatic" tone="gold" />
        <Stat label="Late fees this term" value={fmtUGX(bal.lateFees)} sub="auto-billed at the gate" tone={bal.lateFees ? "red" : undefined} />
        <Stat label="Next event" value={db.events[0] ? fmtDate(db.events[0].date) : "—"} sub={db.events[0]?.title} tone="blue" />
        <Stat label="Assessment updates" value={db.assessments.filter((a) => a.studentId === main?.id || a.studentId === pres?.id).length} sub="continuous & Checkpoint tracking" />
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>👦👧 Your children</h3>
          {kids.map((k) => (
            <div className="list-item" key={k.id}>
              <div className="spread">
                <div>
                  <b>{k.name}</b>{" "}
                  <Badge tone={k.campus === "preschool" ? "gold" : "green"}>{k.campus === "preschool" ? "🌱 Pre-School" : "🏫 International School"}</Badge>
                  <div className="small muted">{k.class} · {k.campus === "main" ? "Cambridge Primary" : "Cambridge Early Years"}</div>
                </div>
                <span className="small muted">{k.campus === "preschool" ? `Attending since ${fmtDate(k.startDate)}` : `Year 5 · since ${fmtDate(k.startDate)}`}</span>
              </div>
              {k.featuredNote && <p className="small" style={{ marginTop: "0.45rem" }}>💬 {k.featuredNote}</p>}
            </div>
          ))}
          <Link href="/portal/children" className="btn secondary sm">View progress & documents →</Link>
        </div>

        <div className="card">
          <h3>📜 Latest school notices</h3>
          {db.notices.slice(0, 3).map((n) => (
            <div className="list-item" key={n.id}>
              <div className="spread">
                <b style={{ fontSize: "0.94rem" }}>{n.title}</b>
                <span className="small muted">{fmtDate(n.date)}</span>
              </div>
              <p className="small muted">{n.body}</p>
            </div>
          ))}
          <Link href="/portal/news" className="btn secondary sm">Open noticeboard →</Link>
        </div>
      </div>

      <div className="card" style={{ marginTop: "1.2rem", background: "var(--gold-50)", borderColor: "var(--gold)" }}>
        <div className="spread">
          <div>
            <b>🧾 Pre-order window closes Friday 4 September</b>
            <div className="small muted">Uniforms (sports kit, house T-shirts) and Cambridge book packs for {db.meta.currentTerm}. Pay online and collect on day one.</div>
          </div>
          <Link className="btn sm" href="/portal/orders">Pre-order now</Link>
        </div>
      </div>
    </div>
  );
}
