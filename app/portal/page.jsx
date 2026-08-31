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

  // New parents (registered on /register) see the application dashboard until
  // the Admissions registrar verifies records + tuition → account "active".
  const fa = db.familyAccountByFamily[family.id];
  if (fa?.status === "pending" || (fa?.status === "active" && kids.every((k) => !k.enrolled))) {
    return <ApplicationHome db={db} session={session} family={family} />;
  }

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

function ApplicationHome({ db, session, family }) {
  // The OS dashboard for a newly registered family: follows the old school
  // /parent/dashboard behaviour for new parents, adapted to the OS —
  // application status, wizard progress, documents and fees, then the
  // child-portal link once the Admission registrar completes verification.
  const app = db.applications.find(
    (a) => a.studentId && db.studentIndex[a.studentId]?.familyId === family.id
  );
  const kid = app && db.studentIndex[app.studentId];
  const fa = db.familyAccountByFamily[family.id];
  const isActive = fa?.status === "active";
  const docs = db.documents.filter((d) => d.studentId === kid?.id);
  const docsOK = docs.length > 0 && docs.every((d) => d.status === "verified");
  const inv = db.invoices.find((i) => i.familyId === family.id && i.term === db.meta.currentTerm);
  const tuitionOK = !!(inv && inv.total > 0 && inv.paid >= inv.total && inv.balance === 0);
  const sa = kid && db.accountByStudent?.[kid.id];

  const steps = [
    { key: "Basic Information", done: app?.steps?.basic, ico: "user" },
    { key: "Parent Details", done: app?.steps?.parent, ico: "users" },
    { key: "Emergency Contacts", done: app?.steps?.emergency, ico: "phone" },
    { key: "Documents", done: app?.steps?.documents, ico: "file" },
    { key: "Payment", done: app?.steps?.payment, ico: "wallet" },
    { key: "Review & Submit", done: app?.steps?.review, ico: "checkCircle" },
  ];

  return (
    <div>
      <div className="card surface-deep" style={{ marginBottom: "1.2rem" }}>
        <div className="spread">
          <div>
            <span style={{ color: "var(--sun2)", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              {db.meta.currentTerm} · {isActive ? "Verified" : "New family"}
            </span>
            <h2 style={{ color: "#fff", margin: "0.3rem 0 0.4rem" }}>
              {isActive ? `Karibu, ${family.name} family — you're in!` : `Welcome, ${family.name} family`}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.92rem" }}>
              {isActive
                ? `${kid?.name}'s admission is verified and tuition is cleared. ${sa ? "Open the child's portal below — credentials are in the SMS and in Student Accounts." : ""}`
                : app
                  ? `${kid?.name}'s application (${kid?.schoolId}) is with the Admissions team. We'll SMS both parents the shared login and your child's portal link once records are verified.`
                  : "Complete the 6-step application to apply for admission."}
            </p>
          </div>
          {app && <Badge tone={isActive ? "green" : "gold"}>{isActive ? "Admission verified" : app.status === "applied" ? "Under review" : "Application in progress"}</Badge>}
        </div>
        <div className="row" style={{ marginTop: "1rem" }}>
          {!app && <Link className="btn gold" href="/apply">Start the application →</Link>}
          {app && !isActive && app.status === "in_progress" && <Link className="btn gold" href="/apply">Continue application →</Link>}
          {app && !isActive && app.status === "applied" && (<>
            <span className="btn-hero-ghost" style={{ padding: "0.7rem 1.5rem", pointerEvents: "none" }}>
              <Icon name="clock" size={16} /> Awaiting Admission review
            </span>
          </>)}
          {isActive && sa && (
            <Link className="btn gold" href={`/student/login?u=${encodeURIComponent(sa.username)}`}>
              <Icon name="user" size={16} /> Open {kid.name.split(" ")[0]}'s portal
            </Link>
          )}
        </div>
      </div>

      {!app ? (
        <div className="card">
          <h3>No application yet</h3>
          <p className="small muted">Your family account is ready. Start the application — it follows the same 6 steps as the school's admission form.</p>
          <Link className="btn" href="/apply">Start the application →</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-2" style={{ marginBottom: "1.2rem" }}>
            <div className="card">
              <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><Icon name="clipboard" size={19} /> Application progress</h3>
              {steps.map((s, i) => (
                <div className="list-item spread" key={s.key} style={{ padding: "0.55rem 0.2rem" }}>
                  <span className="row" style={{ gap: "0.6rem" }}><Icon name={s.ico} size={16} style={{ color: s.done ? "var(--leaf)" : "var(--muted)" }} /> {s.key}</span>
                  <span className={`badge ${s.done ? "green" : "gray"}`}>{s.done ? "✓ Done" : "Pending"}</span>
                </div>
              ))}
              <p className="small muted" style={{ margin: "0.4rem 0 0" }}>
                {kid?.name} · {kid?.class} · {app.campus === "preschool" ? "Gill Pre-School" : "Main School"} · {app.intake}
              </p>
            </div>
            <div className="card">
              <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><Icon name="file" size={19} /> Documents & fees</h3>
              <div className="list-item"><b className="small">Documents</b>
                <div className="small muted">{docs.length ? docs.map((d) => `${d.type} — ${d.status}`).join(" · ") : "None attached yet"}</div>
              </div>
              <div className="list-item"><b className="small">Term fees</b>
                <div className="small muted">
                  {inv ? `${(inv.total - inv.paid).toLocaleString()} UGX outstanding of ${inv.total.toLocaleString()} UGX` : "Invoice opens at submission"}
                </div>
              </div>
              <div className="row" style={{ marginTop: "0.7rem", gap: "0.5rem" }}>
                <span className={`badge ${docsOK ? "green" : "gold"}`}>{docsOK ? "✓ Documents verified" : `${docs.filter((d) => d.status === "verified").length}/${docs.length} verified`}</span>
                <span className={`badge ${tuitionOK ? "green" : "gold"}`}>{tuitionOK ? "✓ Tuition cleared" : "Tuition pending"}</span>
                {fa?.status === "pending" && <Badge tone="blue">account active after verification</Badge>}
              </div>
              {inv && !tuitionOK && (
                <Link className="btn secondary sm" href="/portal/fees" style={{ marginTop: "0.8rem" }}>Pay with mobile money →</Link>
              )}
            </div>
          </div>

          {isActive && (
            <div className="card" style={{ background: "var(--peri-l)", borderColor: "var(--peri-2)" }}>
              <div className="spread">
                <div className="row" style={{ gap: "0.7rem" }}>
                  <Icon name="key" size={22} style={{ color: "var(--maroon)" }} />
                  <div>
                    <b>Your child's portal is ready — {kid?.name}</b>
                    <p className="small muted" style={{ margin: "0.2rem 0 0" }}>
                      Username <span className="mono">@{sa?.username || "—"}</span> (supervised by you). The SMS to both parents carries the same link; change the password any time in <b>Student Accounts</b>.
                    </p>
                  </div>
                </div>
                {sa && <Link className="btn sm" href={`/student/login?u=${encodeURIComponent(sa.username)}`}>Open portal →</Link>}
              </div>
            </div>
          )}
        </>
      )}
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
              {session.members.map((m) => m.name).join(" & ")}.
              {fa.registeredAt ? (
                <> You created this account on the OS (password chosen at registration). Both parents on the form share it; the child's portal link arrives by SMS once Admission verifies the records.</>
              ) : (
                <> The SMS invite (to {(invites.length ? invites.map((d) => d.to) : session.smsInvitesTo || []).join(", ")}
                  ) opens the portal landing: create the shared password, get a verification code by phone or email, then you're in.</>
              )}
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
