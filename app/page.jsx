"use client";
import { useState } from "react";
import Icon from "@/components/icons.jsx";
import SchoolFooter from "@/components/SchoolFooter.jsx";

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
  { ico: "users", t: "Your family is set up", d: "Register online and complete the 6-step application, or let Admissions set you up. Either way you sign in with one family account.", who: "Register or Admissions", meta: "One shared family login", metaIco: "file", photo: "/photos/three-kids.jpg" },
  { ico: "key", t: "Create your child's account", d: "Choose the username, password and what your child can see. The account is supervised by you.", who: "You, the parent", meta: "You choose the visibility", metaIco: "shield", photo: "/photos/reading-girl.jpg" },
  { ico: "grad", t: "Child signs in and learns", d: "Their own portal: today's classes, homework, progress, library and calendar — before they even report to school.", who: "Your child", meta: "Supervised, always", metaIco: "eye", photo: "/photos/science-teens.jpg" },
];

const requirements = [
  {
    stage: "Early Years (Ages 1–6)",
    tag: "Gill Pre-School",
    items: [
      "Completed application form — one per family",
      "Birth certificate or affidavit of birth",
      "Immunisation record (UPEP / health card)",
      "Two passport photographs",
      "Assessment visit & settling-in session at Gill Pre-School",
      "Programmes: Daycare (1–2) · Toddlers (2–3) · Nursery (3–4) · Reception (4–5)",
    ],
    note: "20 pupils per class · rolling intake during the term",
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
          <a href="https://www.gill.ac.ug/#home" aria-label="Back to gill.ac.ug" className="nav-badge">
            <img src="/logo.png" alt="Gill International School logo" />
          </a>
          <div className="links">
            <a href="#platform">Platform</a>
            <a href="#journey">For Families</a>
            <a href="#gallery">Our School</a>
            <a href="#suggestions">Suggestions</a>
          </div>
          <div className="cta">
            <a href="/portal/login" className="btn gold" style={{ padding: "0.55rem 1.3rem", fontSize: "0.85rem" }}>Sign in</a>
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
              [<Icon key="1" name="grad" size={20} />, "Ages 1–19", "Pre-School Daycare to A Levels"],
              [<Icon key="2" name="globe" size={20} />, "Cambridge", "CAIE pathway"],
              [<Icon key="3" name="pin" size={20} />, "Najjera", "Two campuses · Mbogo Rd + White Close"],
              [<Icon key="4" name="clock" size={20} />, "7:45 am – 5:00 pm", "School day"],
            ].map(([ico, t, d]) => (
              <div className="chip" key={t}>
                <span className="ico">{ico}</span>
                <span className="hero-chip-copy">
                  <b>{t}</b>
                  <span>{d}</span>
                </span>
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
        <div className="card" style={{ marginBottom: "1.2rem", background: "var(--peri-l)", borderColor: "var(--peri-2)", display: "flex", flexWrap: "wrap", gap: "0.8rem", alignItems: "center", justifyContent: "space-between" }}>
          <div className="row" style={{ gap: "0.7rem" }}>
            <Icon name="key" size={20} style={{ color: "var(--maroon)" }} />
            <div>
              <b>New family joining Gill?</b>
              <div className="small muted">Create your family account and apply in the same 6 steps as the school admission form — Pre-School to Year 13.</div>
            </div>
          </div>
          <a href="/register" className="btn gold sm">Register &amp; start application &gt;</a>
        </div>
        <div className="grid grid-3">
          <a className="portal-card pc-parents" href="/portal/login">
            <div className="pc-photo" aria-hidden="true" />
            <div className="pc-content">
              <div className="ico"><Icon name="users" size={24} /></div>
              <h3>Parents' Portal</h3>
              <p>One shared family login for every parent on the admission form — children & progress, fees, notices, group chats and supervised student accounts.</p>
              <span className="btn gold sm">Open Parents' Portal &gt;</span>
              <div className="pc-note"><Icon name="checkCircle" size={14} style={{ verticalAlign: "-3px" }} /> One login per family · verified by sms code</div>
            </div>
          </a>
          <a className="portal-card pc-staff" href="/staff">
            <div className="pc-photo" aria-hidden="true" />
            <div className="pc-content">
              <div className="ico"><Icon name="grad" size={24} /></div>
              <h3>Staff Portal</h3>
              <p>Teachers, admissions, bursar and gate staff: classes, pupils, assessment remarks, family group chats and daily operations.</p>
              <span className="btn gold sm">Open Staff Portal &gt;</span>
              <div className="pc-note"><Icon name="checkCircle" size={14} style={{ verticalAlign: "-3px" }} /> Role-based sign-in · named accounts</div>
            </div>
          </a>
          <a className="portal-card pc-students" href="/student/login">
            <div className="pc-photo" aria-hidden="true" />
            <div className="pc-content">
              <div className="ico"><Icon name="user" size={24} /></div>
              <h3>Student Portal</h3>
              <p>Each child's supervised account — today's classes, homework, progress, library and calendar. Parents decide what they can see.</p>
              <span className="btn gold sm">Open Student Portal &gt;</span>
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
              <span className="chip-pre" style={{ display: "inline-flex" }}>Parent &gt; Student accounts</span>
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
          <span className="muted small">Two campuses in Najjera — Pre-School & International School</span>
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

      {/* ------- Suggestion box ------- */}
      <SuggestionBox />

      {/* ------- Footer (shared, final content) ------- */}
      <SchoolFooter />

    </main>
  );
}


function SuggestionBox() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "Parent or guardian",
    category: "Teaching and learning",
    message: "",
    anonymous: false,
  });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [sending, setSending] = useState(false);

  const update = (key) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
  };

  async function submit(event) {
    event.preventDefault();
    setStatus({ type: "", message: "" });
    setSending(true);
    try {
      const response = await fetch("/api/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "submitSuggestion", payload: form }),
      });
      const data = await response.json();
      if (!data.ok) throw new Error(data.error || "We could not send your suggestion.");
      setStatus({ type: "success", message: "Thank you. Your suggestion has been sent to the school team." });
      setForm((current) => ({ ...current, name: "", email: "", message: "", anonymous: false }));
    } catch (error) {
      setStatus({ type: "error", message: error.message || "We could not send your suggestion." });
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="suggestion-section" id="suggestions">
      <div className="container suggestion-shell">
        <div className="suggestion-intro">
          <span className="kicker-line">Help us improve</span>
          <h2><Icon name="chat" size={27} /> Suggestion box</h2>
          <p>
            Your ideas help us build a better school experience for every learner, family and member of staff.
            Share an improvement, concern or new idea with the Gill School team.
          </p>

          <div className="suggestion-promises">
            <div><span><Icon name="shield" size={18} /></span><p><b>Private and respectful</b><small>Submissions are reviewed only by the appropriate school team.</small></p></div>
            <div><span><Icon name="eyeOff" size={18} /></span><p><b>Anonymous if preferred</b><small>You can send useful feedback without sharing your identity.</small></p></div>
            <div><span><Icon name="checkCircle" size={18} /></span><p><b>Every idea is reviewed</b><small>We route suggestions to the team best placed to respond.</small></p></div>
          </div>
        </div>

        <form className="suggestion-form" onSubmit={submit}>
          <div className="suggestion-form-head">
            <span className="heading-icon"><Icon name="pencil" size={18} /></span>
            <div>
              <h3>Share your suggestion</h3>
              <p>Fields marked optional may be left blank.</p>
            </div>
          </div>

          <label className="suggestion-anonymous">
            <input type="checkbox" checked={form.anonymous} onChange={update("anonymous")} />
            <span><b>Send anonymously</b><small>Your name and email will not be included.</small></span>
          </label>

          <div className="suggestion-fields two">
            <label className="field">
              <span>Your name <small>Optional</small></span>
              <input value={form.name} onChange={update("name")} disabled={form.anonymous} placeholder="Full name" autoComplete="name" />
            </label>
            <label className="field">
              <span>Email address <small>Optional</small></span>
              <input type="email" value={form.email} onChange={update("email")} disabled={form.anonymous} placeholder="you@example.com" autoComplete="email" />
            </label>
          </div>

          <div className="suggestion-fields two">
            <label className="field">
              <span>I am a</span>
              <select value={form.role} onChange={update("role")}>
                <option>Parent or guardian</option>
                <option>Student</option>
                <option>Staff member</option>
                <option>Community member</option>
                <option>Visitor</option>
              </select>
            </label>
            <label className="field">
              <span>Suggestion topic</span>
              <select value={form.category} onChange={update("category")}>
                <option>Teaching and learning</option>
                <option>Student wellbeing</option>
                <option>School facilities</option>
                <option>Communication</option>
                <option>Activities and events</option>
                <option>Other</option>
              </select>
            </label>
          </div>

          <label className="field suggestion-message">
            <span>Your suggestion</span>
            <textarea
              value={form.message}
              onChange={update("message")}
              placeholder="Tell us what could be improved and how your idea would help."
              minLength={10}
              maxLength={2000}
              rows={5}
              required
            />
            <small>{form.message.length}/2000 characters</small>
          </label>

          {status.message && (
            <div className={`suggestion-status ${status.type}`} role="status">
              <Icon name={status.type === "success" ? "checkCircle" : "alert"} size={17} /> {status.message}
            </div>
          )}

          <button className="btn gold" disabled={sending}>
            <Icon name="send" size={17} /> {sending ? "Sending…" : <>Send suggestion &gt;</>}
          </button>
          <p className="suggestion-note">For urgent safeguarding or medical concerns, please contact the school office directly.</p>
        </form>
      </div>
    </section>
  );
}
