"use client";
import Link from "next/link";
import { useApp, Badge, Stat, Progress } from "@/components/ui.jsx";
import { useParent } from "@/components/ParentProvider.jsx";
import Icon from "@/components/icons.jsx";
import { currentFamily, balances, notificationsFor } from "@/lib/client.js";
import { fmtUGX, fmtDate } from "@/components/ui.jsx";

export default function PortalHome() {
  const { db } = useApp();
  const { session } = useParent();
  if (!db) return <div className="card">Loading…</div>;

  const family = currentFamily(db, session.primaryUserId);
  const kids = family.children;
  const bal = balances(db);
  const notes = notificationsFor(db, session.primaryUserId).filter((m) => !m.read);
  const pres = kids.find((c) => c.campus === "preschool");
  const main = kids.find((c) => c.campus === "main");
  const inv = db.invoices.find((i) => i.familyId === family.id && i.term === db.meta.currentTerm);
  const chats = db.chats.filter((c) => c.familyId === family.id && c.status === "active");
  const chatUnread = chats.reduce(
    (n, c) => n + c.messages.filter((m) => m.from !== session.primaryUserId && !m.readBy.includes(session.primaryUserId)).length,
    0
  );

  return (
    <div>
      <div className="card surface-deep" style={{ marginBottom: "1.2rem" }}>
        <div className="spread">
          <div>
            <span style={{ color: "var(--sun2)", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              {db.meta.currentTerm}
            </span>
            <h2 style={{ color: "#fff", margin: "0.3rem 0 0.4rem" }}>Karibu, {family.name} family </h2>
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.92rem" }}>
              {kids.length} children across both campuses · {pres ? "Pre-School" : ""}{pres && main ? " + " : ""}{main ? "International School" : ""} · one account, one fee statement.
            </p>
          </div>
          <div className="card" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(201,212,242,0.4)", minWidth: 230 }}>
            <span className="stat-label" style={{ color: "rgba(255,255,255,0.72)" }}>Balance due · {db.meta.currentTerm}</span>
            <div style={{ fontSize: "1.7rem", fontWeight: 800, fontFamily: "var(--fd)" }}>{fmtUGX(bal.balance)}</div>
            <Progress pct={(bal.paid / Math.max(1, bal.total)) * 100} gold />
            <div className="small" style={{ color: "rgba(255,255,255,0.8)", marginTop: "0.35rem" }}>
              {fmtUGX(bal.paid)} paid of {fmtUGX(bal.total)}
            </div>
          </div>
        </div>
        <div className="row" style={{ marginTop: "1rem" }}>
          <Link className="btn gold" href="/portal/fees">Pay with Mobile Money</Link>
          <Link className="btn-hero-ghost" href="/portal/leave" style={{ padding: "0.7rem 1.5rem" }}>Request absence</Link>
          {notes.length > 0 && (
            <Link className="btn-hero-ghost" href="/portal/news" style={{ padding: "0.7rem 1.5rem" }}>
              <Icon name="bell" size={16} /> {notes.length} unread
            </Link>
          )}
        </div>
      </div>

      <FamilyLoginCard db={db} session={session} />

      {chats.length > 0 && (
        <div className="card" style={{ marginBottom: "1.2rem", display: "flex", flexWrap: "wrap", gap: "0.8rem", alignItems: "center", justifyContent: "space-between" }}>
          <div className="row" style={{ gap: "0.7rem" }}>
            <Icon name="chat" size={21} style={{ color: "var(--maroon)" }} />
            <div>
              <b>Family group chats</b>
              <div className="small muted">
                {chats.map((c) => db.studentIndex[c.studentId]?.name.split(" ")[0]).join(" & ")} — teachers post, you can read everything and reply about attendance.
              </div>
            </div>
          </div>
          <Link className="btn secondary sm" href="/portal/messages">
            {chatUnread ? `${chatUnread} unread · ` : ""}Open group chats →
          </Link>
        </div>
      )}

      <div className="grid grid-4" style={{ marginBottom: "1.2rem" }}>
        <Stat label="Sibling discount applied" value={fmtUGX(bal.siblingDiscounts)} sub="10% off Pre-School tuition — automatic" tone="gold" />
        <Stat label="Late fees this term" value={fmtUGX(bal.lateFees)} sub="auto-billed at the gate" tone={bal.lateFees ? "red" : undefined} />
        <Stat label="Next event" value={db.events[0] ? fmtDate(db.events[0].date) : "—"} sub={db.events[0]?.title} tone="blue" />
        <Stat label="Assessment updates" value={db.assessments.filter((a) => a.studentId === main?.id || a.studentId === pres?.id).length} sub="continuous & Checkpoint tracking" />
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><Icon name="users" size={19} /> Your children</h3>
          {kids.map((k) => (
            <div className={`list-item ${k.campus === "preschool" ? "gips-body" : ""}`} key={k.id}>
              <div className="spread">
                <div className="row">
                  <div className="avatar-lg" style={{
                    width: 40, height: 40, fontSize: "0.95rem",
                    background: k.campus === "preschool" ? "var(--cream)" : "var(--peri-l)",
                    border: k.campus === "preschool" ? "1px solid var(--sun2)" : "1px solid var(--peri-2)",
                    color: k.campus === "preschool" ? "var(--gips-deep)" : "var(--maroon)",
                    fontFamily: k.campus === "preschool" ? "var(--fpd)" : "var(--fd)",
                  }}>
                    {k.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    {k.campus === "preschool" ? (
                      <b style={{ fontFamily: "var(--fpd)" }}>{k.name}</b>
                    ) : (
                      <b>{k.name}</b>
                    )}{" "}
                    {k.campus === "preschool" ? (
                      <span className="chip-pre"> Gill Pre-School</span>
                    ) : (
                      <Badge tone="purple"> Gill International School</Badge>
                    )}
                    <div className="small muted">{k.class} · {k.campus === "main" ? "Cambridge Primary" : "Cambridge Early Years"}</div>
                  </div>
                </div>
                <span className="small muted">{k.campus === "preschool" ? `Attending since ${fmtDate(k.startDate)}` : `Year 5 · since ${fmtDate(k.startDate)}`}</span>
              </div>
              {k.featuredNote && <p className="small" style={{ marginTop: "0.45rem" }}> {k.featuredNote}</p>}
            </div>
          ))}
          <Link href="/portal/children" className="btn secondary sm">View progress & documents →</Link>
        </div>

        <div className="card">
          <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><Icon name="bell" size={19} /> Latest school notices</h3>
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

      <div className="card gips" style={{ marginTop: "1.2rem" }}>
        <div className="spread">
          <div>
            <b><Icon name="clock" size={16} style={{ verticalAlign: "-3px", marginRight: "0.4rem" }} /> Pre-order window closes Friday 4 September</b>
            <div className="small muted">Uniforms (sports kit, house T-shirts) and Cambridge book packs for {db.meta.currentTerm}. Pay online and collect on day one.</div>
          </div>
          <Link className="btn sm" href="/portal/orders">Pre-order now</Link>
        </div>
      </div>
    </div>
  );
}

function FamilyLoginCard({ db, session }) {
  const fa = db.familyAccountByFamily[session.familyId];
  if (!fa) return null;
  const app = db.applications.find(
    (a) => a.studentId && db.studentIndex[a.studentId]?.familyId === session.familyId
  );
  const invites = db.deliveries.filter((d) => d.channel === "SMS" && app && d.ref === app.id);
  return (
    <div className="card" style={{ marginBottom: "1.2rem", background: "var(--peri-l)", borderColor: "var(--peri-2)" }}>
      <div className="spread">
        <div className="row" style={{ gap: "0.7rem", alignItems: "flex-start" }}>
          <Icon name="users" size={22} style={{ color: "var(--maroon)", marginTop: "0.2rem" }} />
          <div>
            <b>Family account · shared by every parent on the admission form</b>
            <p className="small muted" style={{ margin: "0.25rem 0 0" }}>
              Username <span className="mono">@{fa.username}</span> — one login for{" "}
              {session.members.map((m) => m.name).join(" & ")}. The SMS invite (to{" "}
              {(invites.length ? invites.map((d) => d.to) : session.smsInvitesTo || []).join(", ")}
              ) opens the portal landing: create the shared password, get a verification code by phone or email, then you're in.
            </p>
          </div>
        </div>
        <div className="row">
          {session.members.map((m) => (
            <span className="chip-pre" key={m.id}>{m.relation.split(" / ")[0]} · {m.name.split(" ")[0]}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
