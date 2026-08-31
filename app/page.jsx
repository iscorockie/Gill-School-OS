"use client";
import { useState } from "react";
import Icon from "@/components/icons.jsx";

const features = [
  { ico: "users", t: "One family, every child", d: "Siblings at Gill Pre-School and the International School share a single login — progress, fees and notices in one place.", accent: "var(--maroon)", tag: "Family first", hero: true },
  { ico: "wallet", t: "Mobile money fees", d: "MTN MoMo, Airtel Money and card payments settle instantly with digital receipts for every shilling.", accent: "var(--gold)" },
  { ico: "chart", t: "Real-time progress", d: "Continuous assessments, Checkpoint practice results and teacher feedback as they happen — not just on report day.", accent: "#2f7d46" },
  { ico: "chat", t: "Messages & notices", d: "School notices, teacher messages, SMS and email — one in-house channel for every family.", accent: "#7f9cd4" },
  { ico: "calendar", t: "One-tap calendar sync", d: "Sports Days, Coffee Mornings and Science Fairs subscribe straight to Google or Apple calendars.", accent: "#b3261e" },
  { ico: "bookOpen", t: "Paperless resources", d: "Past papers, worksheets, e-books and The Gill Insider — read online, print only what you need.", accent: "var(--gold)" },
  { ico: "send", t: "Absence in a tap", d: "Submit a sickness note online; class teachers are notified instantly, no phone queue.", accent: "#7f9cd4" },
  { ico: "shirt", t: "Term pre-orders", d: "Uniforms and book packs pre-ordered before term starts — collected on day one, right size, right quantity.", accent: "#2f7d46" },
  { ico: "key", t: "Student accounts", d: "Parents set up each child's supervised portal before they report to school — like adding a device to the family.", accent: "var(--maroon)" },
];

const steps = [
  { ico: "users", t: "Your family is set up", d: "Admissions registers your child's records. You sign in to Gill School OS with one family account.", who: "Admissions", meta: "Records ready on day one", metaIco: "file", photo: "/photos/three-kids.jpg" },
  { ico: "key", t: "Create your child's account", d: "Choose the username, password and what your child can see. The account is supervised by you.", who: "You, the parent", meta: "You choose the visibility", metaIco: "shield", photo: "/photos/reading-girl.jpg" },
  { ico: "grad", t: "Child signs in and learns", d: "Their own portal: today's classes, homework, progress, library and calendar — before they even report to school.", who: "Your child", meta: "Supervised, always", metaIco: "eye", photo: "/photos/science-teens.jpg" },
];

const requirements = [
  {
    stage: "Early Years (Ages 3–5)",
    tag: "Gill Pre-School",
    items: [
      "Completed application form — one per family",
      "Birth certificate or affidavit of birth",
      "Immunisation record (UPEP / health card)",
      "Two passport photographs",
      "Assessment visit & settling-in session at Gill Pre-School",
    ],
    note: "Rolling intake during the term",
  },
  {
    stage: "Cambridge Primary (Ages 5–11)",
    tag: "Gill International School",
    items: [
      "Completed application form",
      "Last two termly school reports",
      "Birth certificate & immunisation record",
      "Transfer assessment in English & Mathematics (Year 3 and above)",
      "Reference from the previous school",
    ],
    note: "Cambridge Checkpoint sits at the end of Year 6",
  },
  {
    stage: "Lower Secondary (Ages 12–14)",
    tag: "Gill International School",
    items: [
      "Completed application form",
      "Last two termly reports plus transcript",
      "Entry assessment — English, Mathematics & Science",
      "Passport photograph & birth certificate",
      "Short interview with the Academic Office",
    ],
    note: "Ongoing Checkpoint & project assessments",
  },
  {
    stage: "Upper Secondary & Advanced (Ages 15–18)",
    tag: "Cambridge Pathway",
    items: [
      "Completed application form",
      "IGCSE / Checkpoint transcript for A Level entry",
      "Entry assessment and subject-choice interview",
      "Head of School interview",
      "Two references from the previous school",
    ],
    note: "A Levels across Sciences, Humanities & Arts",
  },
];

const heroPhotos = [
  { src: "/photos/three-kids.jpg", alt: "Gill pupils in uniform" },
  { src: "/photos/reading-girl.jpg", alt: "Pupil reading" },
  { src: "/photos/uganda-day.jpg", alt: "Uganda Day celebrations" },
  { src: "/photos/sports-day.jpg", alt: "Sports day" },
  { src: "/photos/science-teens.jpg", alt: "Science practical" },
  { src: "/photos/two-kids-building.jpg", alt: "Pupils outside the school building" },
];

export default function Landing() {
  const [openReq, setOpenReq] = useState(0);
  const [openFeat, setOpenFeat] = useState(0);
  return (
    <main>
      {/* ------- Top nav, like the school site ------- */}
      <nav className="land-nav">
        <div className="container inner">
          <img src="/logo.png" alt="Gill International School logo" />
          <div className="links">
            <a href="#platform">Platform</a>
            <a href="#journey">For Families</a>
            <a href="#gallery">Our School</a>
          </div>
          <div className="cta">
            <a href="#portals" className="btn gold" style={{ padding: "0.55rem 1.3rem", fontSize: "0.85rem" }}>Sign in</a>
          </div>
        </div>
      </nav>

      {/* ------- Photo hero ------- */}
      <header className="hero-photo">
        <div className="bg" style={{ backgroundImage: "url(/photos/assembly.jpg)" }} />
        <div className="container inner">
          <span className="kicker">Gill International School · Najjera, Kampala · Cambridge Curriculum</span>
          <h1>One school, one family account, every child.</h1>
          <p> From first steps at Gill Pre-School to Cambridge Checkpoint and beyond — parents, teachers and students work in one place. Set up your children's portals before they report to school.
          </p>
          <div className="cta">
            <a href="#portals" className="btn gold">Open a Portal</a>
            <a href="/api/ics?campus=all" className="btn-hero-ghost"><Icon name="calendar" size={17} /> Sync calendar</a>
          </div>

          <div className="hero-strip">
            {[
              [<Icon key="1" name="grad" size={20} />, "Ages 3–19", "Pre-School to A Levels"],
              [<Icon key="2" name="globe" size={20} />, "Cambridge", "CAIE pathway"],
              [<Icon key="3" name="pin" size={20} />, "Najjera", "Plot 8, Block 228"],
              [<Icon key="4" name="clock" size={20} />, "7:45 am – 5:00 pm", "School day"],
            ].map(([ico, t, d]) => (
              <div className="chip" key={t}>
                <span className="ico">{ico}</span>
                <span><b>{t}</b><br /><span>{d}</span></span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ------- Choose your portal ------- */}
      <section className="container portal-choice" id="portals" style={{ paddingTop: "2.6rem" }}>
        <div className="section-head">
          <h2><Icon name="users" size={24} /> Choose your portal</h2>
          <span className="muted small">Sign in to the portal that belongs to you — each one opens with its own account.</span>
        </div>
        <div className="grid grid-3">
          <a className="portal-card pc-parents" href="/portal/login">
            <div className="pc-photo" aria-hidden="true" />
            <div className="pc-content">
              <div className="ico"><Icon name="users" size={24} /></div>
              <h3>Parents' Portal</h3>
              <p>One shared family login for every parent on the admission form — children & progress, fees, notices, group chats and supervised student accounts.</p>
              <span className="btn gold sm">Open Parents' Portal →</span>
              <div className="pc-note"><Icon name="checkCircle" size={14} style={{ verticalAlign: "-3px" }} /> One login per family · verified by sms code</div>
            </div>
          </a>
          <a className="portal-card pc-staff" href="/staff">
            <div className="pc-photo" aria-hidden="true" />
            <div className="pc-content">
              <div className="ico"><Icon name="grad" size={24} /></div>
              <h3>Staff Portal</h3>
              <p>Teachers, admissions, bursar and gate staff: classes, pupils, assessment remarks, family group chats and daily operations.</p>
              <span className="btn gold sm">Open Staff Portal →</span>
              <div className="pc-note"><Icon name="checkCircle" size={14} style={{ verticalAlign: "-3px" }} /> Role-based sign-in · named accounts</div>
            </div>
          </a>
          <a className="portal-card pc-students" href="/student/login">
            <div className="pc-photo" aria-hidden="true" />
            <div className="pc-content">
              <div className="ico"><Icon name="user" size={24} /></div>
              <h3>Student Portal</h3>
              <p>Each child's supervised account — today's classes, homework, progress, library and calendar. Parents decide what they can see.</p>
              <span className="btn gold sm">Open Student Portal →</span>
              <div className="pc-note"><Icon name="checkCircle" size={14} style={{ verticalAlign: "-3px" }} /> Created & supervised by parents</div>
            </div>
          </a>
        </div>
      </section>

      {/* ------- Platform + entry requirements — uniform glass zone ------- */}
      <div className="zone-dark" id="platform">
        <section className="container" style={{ paddingTop: "3.2rem" }}>
          <div className="sec-head-dark spread">
            <div>
              <span className="kicker-line">The platform</span>
              <h2><Icon name="layers" size={26} /> Everything in one place</h2>
            </div>
            <span className="small" style={{ color: "rgba(255,255,255,0.7)", maxWidth: 300, textAlign: "right" }}>
              One portal for parents · one for every student · one console for the school
            </span>
          </div>
          <div className="platform-grid">
            {features.map((f, i) => {
              const open = openFeat === i;
              return (
                <div className={`feature ${f.hero ? "feature-hero" : ""} ${open ? "open" : ""}`} key={f.t} style={{ "--ft": f.accent }}>
                  <button className="feature-btn" onClick={() => setOpenFeat(open ? -1 : i)} aria-expanded={open}>
                    <span className="feature-label">
                      <span className={`ico ico-${i % 5}`}><Icon name={f.ico} size={22} /></span>
                      <span className="ft-title">{f.t}</span>
                      {f.hero && !open && <span className="ft-chip">{f.tag}</span>}
                    </span>
                    <span className="acc-plus"><Icon name="plus" size={17} /></span>
                  </button>
                  <div className="feature-body" hidden={!open}>
                    <p>{f.d}</p>
                    {f.tag && !f.hero && <span className="ft-chip">{f.tag}</span>}
                    {f.hero && (
                      <div className="ft-pills">
                        {[["users", "Parents' Portal"], ["grad", "Staff Portal"], ["user", "Student Portal"]].map(([ico, label]) => (
                          <span key={label}><Icon name={ico} size={15} /> {label}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="container" id="requirements" style={{ paddingTop: "2.6rem", paddingBottom: "3.2rem" }}>
          <div className="sec-head-dark" style={{ marginBottom: "1.3rem" }}>
            <span className="kicker-line">Entry requirements</span>
            <h2>What each stage needs</h2>
            <span className="small" style={{ color: "rgba(255,255,255,0.7)", maxWidth: 520, marginTop: "0.2rem" }}>
              The same records you upload once carry your child through every stage — verified by the OS admissions pipeline, never re-typed.
            </span>
          </div>
          <div className="req-grid">
            {requirements.map((r, i) => {
              const open = openReq === i;
              return (
                <div className={`acc ${open ? "open" : ""}`} key={r.stage}>
                  <button className="acc-head" onClick={() => setOpenReq(open ? -1 : i)} aria-expanded={open}>
                    <span>{r.stage}</span>
                    <span className="acc-plus"><Icon name="plus" size={17} /></span>
                  </button>
                  <div className="acc-body" hidden={!open}>
                    <span className="ft-chip">{r.tag}</span>
                    <ul>
                      {r.items.map((it) => (
                        <li key={it}><Icon name="check" size={15} /> {it}</li>
                      ))}
                    </ul>
                    <span className="acc-note"><Icon name="info" size={14} /> {r.note}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="row" style={{ marginTop: "1.2rem", gap: "0.6rem", flexWrap: "wrap" }}>
            <span className="ft-chip"><Icon name="checkCircle" size={14} /> No paper re-submissions between stages</span>
            <span className="ft-chip"><Icon name="checkCircle" size={14} /> Documents verified once in the OS</span>
            <span className="ft-chip"><Icon name="checkCircle" size={14} /> Entry assessments arranged by Admissions</span>
          </div>
        </section>
      </div>

      {/* ------- Journey ------- */}
      <section className="container" id="journey" style={{ paddingTop: "3.4rem" }}>
        <div className="section-head">
          <div>
            <span className="kicker-sm">From enrolment to first day</span>
            <h2><Icon name="users" size={24} /> For families</h2>
          </div>
          <span className="muted small">Three steps — most families finish in an afternoon</span>
        </div>
        <div className="steps">
          {steps.map((s, i) => (
            <div className="step" key={s.t}>
              <div className="step-head" style={{ backgroundImage: `url(${s.photo})` }}>
                <span className="num">{i + 1}</span>
                <span className="ico"><Icon name={s.ico} size={26} /></span>
              </div>
              <div className="step-body">
                <span className="ft-chip">{s.who}</span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
                <div className="step-foot">
                  <Icon name={s.metaIco} size={14} /> <span>{s.meta}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ------- Family proof ------- */}
        <div className="proof" style={{ marginTop: "1.6rem" }}>
          <div className="proof-photo">
            <img src="/photos/three-kids.jpg" alt="Gill pupils in uniform" loading="lazy" />
            <div className="proof-overlay">
              <span className="chip-pre" style={{ display: "inline-flex" }}>Parent → Student accounts</span>
              <h3>Set up before day one</h3>
              <p className="small">The school already has your child's record on file. From the Parent Portal you create their supervised account — username, password, and exactly what they can see.</p>
              <div className="row">
                <a href="/portal/accounts" className="btn gold">Create a student account</a>
                <span className="proof-stat"><Icon name="clock" size={15} /> ~2 minutes</span>
              </div>
            </div>
          </div>

          <div className="card testimonial">
            <div className="quote-mark">“</div>
            <div className="stars">
              {[...Array(5)].map((_, i) => <Icon key={i} name="star" size={16} />)}
            </div>
            <p className="quote-body">
              Moving Maya from Gill Pre-School to the International School felt like one school, not two —
              my children share one dashboard, one fee statement, and the team already knew her records.
            </p>
            <div className="t-who">
              <div className="t-ava">N</div>
              <div>
                <b>Nansubuga family</b>
                <span className="small muted">Najjera · two children, both campuses</span>
              </div>
            </div>
            <div className="proof-stats">
              <span><b>1</b> login for the family</span>
              <span><b>0</b> paper forms re-typed</span>
              <span><b>24/7</b> progress tracking</span>
            </div>
          </div>
        </div>
      </section>

      {/* ------- Gallery ------- */}
      <section className="container" id="gallery" style={{ paddingTop: "3.4rem", paddingBottom: "1rem" }}>
        <div className="section-head">
          <div>
            <span className="kicker-sm">Najjera · Kampala</span>
            <h2><Icon name="camera" size={24} /> Our school</h2>
          </div>
          <span className="muted small">One campus, two schools — Pre-School to A Levels</span>
        </div>
        <div className="mosaic">
          {[
            { src: "/photos/three-kids.jpg", alt: "Gill pupils in uniform", cap: "Morning assembly, Najjera" },
            { src: "/photos/reading-girl.jpg", alt: "Pupil reading", cap: "Cambridge reading programme" },
            { src: "/photos/uganda-day.jpg", alt: "Uganda Day celebrations", cap: "Uganda Day" },
            { src: "/photos/sports-day.jpg", alt: "Sports day", cap: "Sports day, house colours" },
            { src: "/photos/assembly.jpg", alt: "Whole-school assembly", cap: "Whole-school assembly" },
            { src: "/photos/science-teens.jpg", alt: "Science practical", cap: "Science practicals" },
            { src: "/photos/two-kids-building.jpg", alt: "Pupils outside the school building", cap: "Life at Gill" },
            { src: "/photos/upper-primary.jpg", alt: "Upper primary pupils", cap: "Upper Primary" },
          ].map((p, i) => (
            <div className={`g g${i + 1}`} key={p.src}>
              <img src={p.src} alt={p.alt} loading="lazy" />
              <span className="cap">{p.cap}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ------- Footer, like the school site ------- */}
      <footer className="footer-dark" style={{ marginTop: "2.8rem", padding: "2.6rem 0 1.6rem" }}>
        <div className="container">
          <div className="footer-grid">
            <div className="f-brand">
              <div className="row" style={{ gap: "0.8rem" }}>
                <img src="/logo.png" alt="Gill International School logo" style={{ height: 54, borderRadius: 10, background: "#fff", padding: "4px 8px" }} />
                <div>
                  <b style={{ fontFamily: "var(--fd)", fontSize: "1.1rem", display: "block", color: "#fff" }}>Gill School OS</b>
                  <span className="small" style={{ color: "#cbb9bb" }}>Gill International School & Gill Pre-School</span>
                </div>
              </div>
              <p className="small" style={{ margin: "1rem 0 0", color: "#cbb9bb", maxWidth: 340 }}>
                One campus platform — parents, staff and students each work in their own portal.
              </p>
            </div>

            <div>
              <b className="f-title">Call or WhatsApp</b>
              <div className="f-links" style={{ marginTop: "0.7rem", gap: "0.55rem" }}>
                {["+256 771 648 684", "+256 755 071 456", "+256 783 003 231"].map((n) => {
                  const digits = n.replace(/\s/g, "");
                  return (
                    <span className="row" key={n} style={{ gap: "0.5rem" }}>
                      <a href={`tel:${digits}`} className="row" style={{ gap: "0.5rem", color: "#efe4e5" }}>
                        <Icon name="phone" size={15} /> {n}
                      </a>
                      <a href={`https://wa.me/${digits.slice(1)}`} target="_blank" rel="noreferrer" title={`WhatsApp ${n}`} style={{ color: "var(--leaf)", opacity: 0.85 }}>
                        <Icon name="chat" size={14} /> WhatsApp
                      </a>
                    </span>
                  );
                })}
                <a href="mailto:info.gillschool@gmail.com" className="row" style={{ gap: "0.5rem", color: "#efe4e5", marginTop: "0.25rem" }}>
                  <Icon name="mail" size={15} /> info.gillschool@gmail.com
                </a>
              </div>
            </div>

            <div>
              <b className="f-title">Portals</b>
              <div className="f-links" style={{ marginTop: "0.7rem" }}>
                <a href="/portal/login" className="row" style={{ gap: "0.5rem" }}><Icon name="users" size={15} /> Parents' Portal</a>
                <a href="/staff" className="row" style={{ gap: "0.5rem" }}><Icon name="grad" size={15} /> Staff Portal</a>
                <a href="/student/login" className="row" style={{ gap: "0.5rem" }}><Icon name="user" size={15} /> Student Portal</a>
                <a href="/api/ics?campus=all" className="row" style={{ gap: "0.5rem" }}><Icon name="calendar" size={15} /> School calendar (.ics)</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© 2026 Gill International School · Excellence, Integrity, Service — Gill School OS. All rights reserved.</span>
            <span>Powered by <a href="https://lubech.tech" target="_blank" rel="noreferrer">Lubech.tech</a></span>
          </div>
        </div>
      </footer>
    </main>
  );
}
