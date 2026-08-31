"use client";
import Icon from "@/components/icons.jsx";

const features = [
  { ico: "users", t: "One family, every child", d: "Siblings at Gill Pre-School and the International School share a single login — progress, fees and notices in one place." },
  { ico: "wallet", t: "Mobile money fees", d: "MTN MoMo, Airtel Money and card payments settle instantly with digital receipts for every shilling." },
  { ico: "chart", t: "Real-time progress", d: "Continuous assessments, Checkpoint practice results and teacher feedback as they happen — not just on report day." },
  { ico: "chat", t: "Messages & notices", d: "School notices, teacher messages, SMS and email — one in-house channel for every family." },
  { ico: "calendar", t: "One-tap calendar sync", d: "Sports Days, Coffee Mornings and Science Fairs subscribe straight to Google or Apple calendars." },
  { ico: "bookOpen", t: "Paperless resources", d: "Past papers, worksheets, e-books and The Gill Insider — read online, print only what you need." },
  { ico: "send", t: "Absence in a tap", d: "Submit a sickness note online; class teachers are notified instantly, no phone queue." },
  { ico: "shirt", t: "Term pre-orders", d: "Uniforms and book packs pre-ordered before term starts — collected on day one, right size, right quantity." },
  { ico: "key", t: "Student accounts", d: "Parents set up each child's supervised portal before they report to school — like adding a device to the family." },
];

const steps = [
  { ico: "users", t: "Your family is set up", d: "Admissions registers your child's records. You sign in to Gill School OS with one family account." },
  { ico: "key", t: "Create your child's account", d: "Choose the username, password and what your child can see. The account is supervised by you." },
  { ico: "grad", t: "Child signs in and learns", d: "Their own portal: today's classes, homework, progress, library and calendar — before they even report to school." },
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
            <a href="/student/login" className="btn-hero-ghost" style={{ padding: "0.55rem 1.2rem", fontSize: "0.85rem" }}>Student sign in</a>
            <a href="/admin" className="btn" style={{ padding: "0.55rem 1.3rem", fontSize: "0.85rem" }}>School portal</a>
            <a href="/portal" className="btn gold" style={{ padding: "0.55rem 1.3rem", fontSize: "0.85rem" }}>Parent Portal</a>
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
            <a href="/portal" className="btn gold">Open Parent Portal</a>
            <a href="/student/login" className="btn-hero-ghost">Student sign in</a>
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

      {/* ------- Platform ------- */}
      <section className="container" id="platform" style={{ paddingTop: "3rem" }}>
        <div className="section-head">
          <h2><Icon name="layers" size={24} /> Everything in one place</h2>
          <span className="muted small">One portal for parents, one for every student, one console for the school</span>
        </div>
        <div className="grid grid-3">
          {features.map((f) => (
            <div className="feature" key={f.t}>
              <div className="ico"><Icon name={f.ico} size={22} /></div>
              <h3>{f.t}</h3>
              <p>{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------- Journey ------- */}
      <section className="container" id="journey" style={{ paddingTop: "2.5rem" }}>
        <div className="section-head">
          <h2><Icon name="users" size={24} /> For families</h2>
        </div>
        <div className="steps">
          {steps.map((s, i) => (
            <div className="step" key={s.t}>
              <span className="num">{i + 1}</span>
              <span className="ico"><Icon name={s.ico} size={26} /></span>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-2" style={{ marginTop: "1.6rem", alignItems: "stretch" }}>
          <div className="card surface-deep">
            <span className="chip-pre" style={{ marginBottom: "0.6rem", display: "inline-flex" }}>Parent → Student accounts</span>
            <h3 style={{ color: "#fff" }}>Set up before day one</h3>
            <p className="small" style={{ color: "rgba(255,255,255,0.85)" }}> The school already has your child's record on file. From Parent Portal you create their supervised account —
              username, password, and exactly what they can see.
            </p>
            <div className="row" style={{ marginTop: "0.9rem" }}>
              <a href="/portal/accounts" className="btn">Create a student account</a>
            </div>
          </div>
          <div className="card">
            <div className="quote sun">
              “Moving Maya from Gill Pre-School to the International School felt like one school, not two —
              my children share one dashboard, one fee statement, and the team already knew her records.”
              <div className="small muted" style={{ marginTop: "0.4rem" }}>— Nansubuga family, Najjera</div>
            </div>
            <div className="row" style={{ marginTop: "0.9rem" }}>
              <a href="/portal" className="btn secondary">Explore the parent portal</a>
              <a href="/student" className="btn secondary"><Icon name="grad" size={16} /> See the student portal</a>
            </div>
          </div>
        </div>
      </section>

      {/* ------- Gallery ------- */}
      <section className="container" id="gallery" style={{ paddingTop: "2.5rem", paddingBottom: "1rem" }}>
        <div className="section-head">
          <h2><Icon name="camera" size={24} /> Our school</h2>
          <span className="muted small">Najjera · Kampala</span>
        </div>
        <div className="gallery">
          {heroPhotos.map((p) => (
            <div className="g" key={p.src}>
              <img src={p.src} alt={p.alt} loading="lazy" />
            </div>
          ))}
        </div>
      </section>

      {/* ------- Footer, like the school site ------- */}
      <footer className="footer-dark" style={{ marginTop: "2.5rem", padding: "2rem 0 2.4rem" }}>
        <div className="container">
          <div className="grid grid-3" style={{ gap: "1.5rem" }}>
            <div>
              <div className="row" style={{ gap: "0.8rem" }}>
                <img src="/logo.png" alt="Gill International School logo" style={{ height: 52, borderRadius: 10, background: "#fff", padding: "4px 8px" }} />
                <div>
                  <b style={{ fontFamily: "var(--fd)", fontSize: "1.05rem", display: "block", color: "#fff" }}>Gill School OS</b>
                  <span className="small" style={{ color: "#cbb9bb" }}>Gill International School & Gill Pre-School</span>
                </div>
              </div>
            </div>
            <div>
              <b className="small" style={{ color: "var(--peri-2)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Contact</b>
              <div className="small" style={{ marginTop: "0.5rem", display: "grid", gap: "0.35rem", color: "#efe4e5" }}>
                <span className="row" style={{ gap: "0.5rem" }}><Icon name="pin" size={15} /> Plot 8, Block 228, Najjera, Kampala</span>
                <span className="row" style={{ gap: "0.5rem" }}><Icon name="phone" size={15} /> +256 755 071 456</span>
                <span className="row" style={{ gap: "0.5rem" }}><Icon name="mail" size={15} /> admissions@gillschool.ac.ug</span>
              </div>
            </div>
            <div>
              <b className="small" style={{ color: "var(--peri-2)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Portals</b>
              <div className="small" style={{ marginTop: "0.5rem", display: "grid", gap: "0.35rem" }}>
                <a href="/portal">Parent Portal</a>
                <a href="/student/login">Student Portal</a>
                <a href="/admin">School Administration</a>
                <a href="/api/ics?campus=all">School calendar (.ics)</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
