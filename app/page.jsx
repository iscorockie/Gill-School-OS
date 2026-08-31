"use client";

const features = [
  { ico: "🎓", t: "Pre-School → International School", d: "One login for every child. When a pupil graduates from Gill Pre-School, records (immunisation, medical history, parent contacts, reports) migrate to the Main School in one click — no re-filling forms for parents, no re-typing for Admissions." },
  { ico: "🧾", t: "Automated sibling discounts", d: "Families with children in both campuses automatically receive a 10% Pre-School tuition discount, applied live to consolidated invoices before the Bursar opens the ledger." },
  { ico: "📱", t: "Mobile Money & instant reconciliation", d: "MTN MoMo, Airtel Money and Visa payments settle against invoices instantly, issue digital receipts and clear balances — saving the Bursar hours of bank reconciliation." },
  { ico: "🕔", t: "Late-pickup auto-billing", d: "The gate logs every checkout. Collections after 5:00 pm add the UGX 20,000 fee to the family account automatically and send a polite SMS — no lost revenue." },
  { ico: "💬", t: "In-house communications", d: "Noticeboard, staff-parent messaging, SMS and email are built in — replacing paid third-party tools like ClassDojo premium with zero per-seat subscription." },
  { ico: "📄", t: "Paperless admissions", d: "Birth certificates, immunisation cards and past reports are uploaded to the platform, verified by Admissions, and never lost in a filing cabinet again." },
  { ico: "📚", t: "Digital resource & e-library hub", d: "Cambridge past papers, worksheets, e-books and The Gill Insider newsletter live in one repository — cutting the photocopying and printing budget." },
  { ico: "🙋", t: "Digital absence requests", d: "Parents submit sickness notes online; teachers and the front office are notified instantly instead of phone-tag through the front desk." },
  { ico: "📅", t: "Calendar sync & reminders", d: "Sports Days, Coffee Mornings and Science Fairs sync straight to Google or Apple calendars as one ICS feed." },
  { ico: "📈", t: "Live academic tracking", d: "Continuous assessments, Cambridge Checkpoint practice results and teacher feedback, visible from the first week — not only on report-card day." },
  { ico: "👕", t: "Term pre-orders", d: "Uniforms and book packs are pre-ordered and pre-paid before term start so the school buys exact quantities — no dead stock." },
  { ico: "🗂️", t: "One admin console", d: "Bursar, Admissions, Head of School, teachers and gate staff each get a tailored console with an audit trail on every shilling." },
];

export default function Landing() {
  return (
    <main>
      <section className="hero">
        <div className="container">
          <span className="kicker">Gill International School · Najjera, Kampala · Cambridge Curriculum</span>
          <h1>One platform for the whole Gill family — Pre-School to International School.</h1>
          <p>
            Gill School OS unifies fees, admissions, communications, academics and the guard gate for
            Gill International School and Gill Pre-School. Parents get one login for every child;
            administrators get automation that saves money and hours.
          </p>
          <div className="cta">
            <a className="btn gold" href="/portal">Open Parent Portal →</a>
            <a className="btn" style={{ background: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.4)" }} href="/admin">Admin Console</a>
            <a className="btn secondary" href="/api/ics?campus=all" style={{ background: "transparent", color: "#fff", borderColor: "rgba(255,255,255,0.4)" }}>📅 Sync Calendar (.ics)</a>
          </div>
        </div>
      </section>

      <section className="container" style={{ marginTop: "-2.6rem", position: "relative", zIndex: 2 }}>
        <div className="grid grid-4">
          {[
            ["🌱", "Pre-School", "Nursery 2 & Pre-K, play-based Cambridge Early Years"],
            ["🏫", "International School", "Cambridge Primary & Lower Secondary, Years 1–9"],
            ["👨‍👩‍👧", "One account", "Siblings across both campuses under a single login"],
            ["🇺🇬", "Built for Uganda", "MTN MoMo, Airtel Money, UGX fees, SMS-first"],
          ].map(([ico, t, d]) => (
            <div className="card" key={t}>
              <div style={{ fontSize: "1.5rem" }}>{ico}</div>
              <b>{t}</b>
              <div className="small muted">{d}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="container">
        <div className="section-head"><h2>Everything the platform does</h2><span className="muted small">12 modules · one login</span></div>
        <div className="grid grid-3">
          {features.map((f) => (
            <div className="feature" key={f.t}>
              <div className="ico">{f.ico}</div>
              <h3>{f.t}</h3>
              <p>{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container">
        <div className="grid grid-2" style={{ alignItems: "stretch" }}>
          <div className="card" style={{ background: "var(--green)", color: "#fff", borderColor: "var(--green)" }}>
            <h3 style={{ color: "#fff" }}>A real parent, a real transition</h3>
            <div className="quote" style={{ background: "rgba(255,255,255,0.1)", borderColor: "var(--gold)", color: "#fff" }}>
              “Moving Maya from Gill Pre-School to the International School felt like one school, not two —
              my children share one dashboard, one fee statement, and the team already knew her records.”
              <div className="small" style={{ marginTop: "0.4rem", color: "var(--gold)" }}>— Nansubuga family, Najjera</div>
            </div>
            <p className="small" style={{ color: "rgba(255,255,255,0.8)", marginTop: "0.9rem" }}>
              That testimonial is now a built-in workflow: automated sibling discounts, one-click record migration,
              and consolidated billing across campuses.
            </p>
          </div>
          <div className="card">
            <h3>Saved by automation (est. per year)</h3>
            <div className="grid" style={{ gap: "0.8rem" }}>
              {[
                ["$720", "ClassDojo premium subscriptions replaced by the in-built noticeboard & messaging"],
                ["UGX 4.8M", "paper, printing & physical records storage"],
                ["36 hrs/mo", "bursar time replacing manual payment reconciliation"],
                ["UGX 20,000 / late pickup", "late-fee revenue captured automatically by the gate log"],
              ].map(([v, d]) => (
                <div className="row" key={d}>
                  <div className="badge green" style={{ fontSize: "0.95rem", padding: "0.4rem 0.8rem" }}>{v}</div>
                  <span className="small">{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid var(--line)", marginTop: "2.5rem", padding: "1.6rem 0 2.4rem" }}>
        <div className="container spread">
          <div>
            <b style={{ fontFamily: "ui-serif, Georgia, serif" }}>Gill School OS</b>
            <div className="small muted">Demo platform — Gill International School & Gill Pre-School, Najjera, Kampala</div>
          </div>
          <div className="row">
            <a href="/portal" className="btn secondary sm">Parent Portal</a>
            <a href="/admin" className="btn secondary sm">Admin Console</a>
            <a href="/api/ics?campus=all" className="btn secondary sm">📅 .ics</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
