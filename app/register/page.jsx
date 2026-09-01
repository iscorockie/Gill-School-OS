"use client";
// Public registration — parents / guardians only (no Staff Portal).
// Modeled on the live school register page ("Join Our Community" / Create
// Account) rendered in the OS design system. After the account is created the
// family continues into the 6-step application wizard at /apply.
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/icons.jsx";
import { CAMPUSES } from "@/components/CampusMap.jsx";
import { AppProvider } from "@/components/ui.jsx";
import SchoolFooter from "@/components/SchoolFooter.jsx";
import { ParentProvider, useParent } from "@/components/ParentProvider.jsx";

export default function RegisterPage() {
  return (
    <AppProvider>
      <ParentProvider>
        <Register />
      </ParentProvider>
    </AppProvider>
  );
}

const nextSteps = [
  { ico: "users", t: "Create your family account", d: "One login for every parent on the application form — you choose the password right here." },
  { ico: "file", t: "Complete the 6-step application", d: "Basic information, parent details, emergency contacts, documents, payment and review." },
  { ico: "key", t: "Get the child's portal link", d: "Once the Admissions registrar verifies your records, we SMS the link to your child's portal." },
];

function Register() {
  const { login } = useParent();
  const router = useRouter();
  const [form, setForm] = useState({
    parentName: "", familyName: "", relation: "Mother / Guardian",
    phone: "", email: "", password: "", confirm: "", terms: false,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setBool = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.checked }));

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) return setError("Passwords don't match.");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");
    if (!form.terms) return setError("Please agree to the terms & conditions to continue.");
    setBusy(true);
    try {
      const r = await fetch("/api/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "registerFamily",
          payload: {
            familyName: form.familyName, parentName: form.parentName, relation: form.relation,
            phone: form.phone, email: form.email, password: form.password, terms: form.terms,
          },
        }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "Registration failed");
      const acc = j.result.account;
      // Sign the parent in immediately; the application wizard and the
      // application-status dashboard both read this session.
      login({
        familyId: acc.familyId,
        familyName: form.familyName.trim(),
        username: acc.username,
        primaryUserId: j.result.userId,
        members: [{ id: j.result.userId, name: form.parentName.trim(), phone: form.phone.trim(), relation: form.relation }],
        inviteLink: acc.inviteLink,
        status: "pending",
      });
      router.push(`/apply?family=${acc.familyId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <nav className="land-nav">
        <div className="container inner">
          <a href="/" aria-label="Gill School OS home" className="nav-badge">
            <img src="/logo.png" alt="Gill International School logo" />
          </a>
          <div className="links">
            <a href="/#platform">Platform</a>
            <a href="/#journey">For Families</a>
            <a href="/#find-us">Find Us</a>
          </div>
          <div className="cta">
            <a href="/portal/login" className="btn gold" style={{ padding: "0.55rem 1.3rem", fontSize: "0.85rem" }}>Sign In</a>
          </div>
        </div>
      </nav>

      {/* ------- Join Our Community ------- */}
      <header className="hero-photo reg-hero">
        <div className="bg" style={{ backgroundImage: "url(/photos/three-kids.jpg)" }} />
        <div className="container inner">
          <span className="kicker">Gill International School · Najjera, Kampala · Cambridge Curriculum</span>
          <h1>Join Our Community</h1>
          <p>Begin your journey with Christ-centred Cambridge education in Najjera by creating your account. Parents and guardians only — staff accounts are issued by the school office.</p>
        </div>
      </header>

      <section className="container" style={{ paddingTop: "2.8rem" }}>
        <div className="reg-grid">
          <aside className="reg-side">
            <div className="reg-side-card">
              <span className="kicker-sm">Gill International School</span>
              <h3>Cambridge International</h3>
              <p className="small muted">Reception to Year 13 — Early Years at Gill Pre-School, Primary, Lower Secondary, IGCSE and A Levels.</p>
              <div className="reg-side-points">
                <div className="row"><Icon name="users" size={17} /> One shared family login</div>
                <div className="row"><Icon name="file" size={17} /> 6-step application, one afternoon</div>
                <div className="row"><Icon name="key" size={17} /> Child's portal link after verification</div>
                <div className="row"><Icon name="shield" size={17} /> Supervised student accounts</div>
              </div>
              <div className="quote" style={{ margin: "1rem 0 0", padding: "0.8rem 0.9rem" }}>
                <b>Start your application journey with us…</b>
                <div className="small" style={{ marginTop: "0.25rem", color: "var(--muted)" }}>
                  Create the account first — the wizard opens automatically and you can finish it in one sitting.
                </div>
              </div>
              <p className="small" style={{ marginTop: "1rem", color: "var(--muted)" }}>
                <Icon name="phone" size={14} style={{ verticalAlign: "-2px" }} /> Admissions: +256 771 648 684 ·
                Email <a href="mailto:info.gillschool@gmail.com" className="small">info.gillschool@gmail.com</a>
              </p>
            </div>
          </aside>

          <div className="auth-card reg-card">
            <div className="logo-row">
              <img src="/logo.png" alt="Gill International School logo" />
              <div>
                <h1>Create Account</h1>
                <div className="sub">Parents' &amp; guardians' platform — Gill School OS</div>
              </div>
            </div>

            <form onSubmit={submit}>
              <div className="form-grid">
                <label className="field">
                  <span className="small fw700">Your full name</span>
                  <input value={form.parentName} onChange={set("parentName")} placeholder="e.g. Amina Nansubuga" autoComplete="name" required />
                </label>
                <label className="field">
                  <span className="small fw700">Family name</span>
                  <input value={form.familyName} onChange={set("familyName")} placeholder="e.g. Nansubuga" required />
                </label>
                <label className="field">
                  <span className="small fw700">You are the…</span>
                  <select value={form.relation} onChange={set("relation")}>
                    <option>Mother / Guardian</option>
                    <option>Father / Guardian</option>
                    <option>Grandparent / Guardian</option>
                    <option>Other guardian</option>
                  </select>
                </label>
                <label className="field">
                  <span className="small fw700">Mobile phone (SMS)</span>
                  <input value={form.phone} onChange={set("phone")} placeholder="+2567…" autoComplete="tel" required />
                </label>
                <label className="field" style={{ gridColumn: "1 / -1" }}>
                  <span className="small fw700">Email (optional)</span>
                  <input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" autoComplete="email" />
                </label>
                <label className="field">
                  <span className="small fw700">Password</span>
                  <input type="password" value={form.password} onChange={set("password")} placeholder="At least 8 characters" autoComplete="new-password" required />
                </label>
                <label className="field">
                  <span className="small fw700">Confirm password</span>
                  <input type="password" value={form.confirm} onChange={set("confirm")} placeholder="Repeat password" autoComplete="new-password" required />
                </label>
              </div>

              <label className="row" style={{ gap: "0.5rem", margin: "0.9rem 0 1rem", alignItems: "flex-start" }}>
                <input type="checkbox" checked={form.terms} onChange={setBool("terms")} style={{ marginTop: 2 }} />
                <span className="small">I agree to the <b>terms &amp; conditions</b> and to the processing of the family's information for admission and school communication.</span>
              </label>

              {error && <p className="small" style={{ color: "var(--red)", margin: "0 0 0.7rem" }}>{error}</p>}

              <button className="btn" style={{ width: "100%" }} disabled={busy}>
                {busy ? "Creating your account…" : "Create Account"}
              </button>
            </form>

            <p className="small" style={{ textAlign: "center", margin: "1rem 0 0" }}>
              Already have an account? <a href="/portal/login" style={{ fontWeight: 700 }}>Sign In</a>
            </p>

            <div className="card" style={{ marginTop: "1rem", background: "var(--peri-l)", borderColor: "var(--peri-2)", boxShadow: "none", padding: "0.75rem 0.9rem" }}>
              <div className="row" style={{ gap: "0.6rem" }}>
                <Icon name="shield" size={18} style={{ color: "var(--maroon)" }} />
                <div>
                  <b className="small">Parents only — no Staff Portal here.</b>
                  <p className="small muted" style={{ margin: "0.2rem 0 0" }}>
                    Teachers and staff accounts are created by the school office, never self-registered.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------- What happens next ------- */}
      <section className="container" style={{ paddingTop: "2.6rem", paddingBottom: "3rem" }}>
        <div className="section-head">
          <div>
            <span className="kicker-sm">After you click Create Account</span>
            <h2><Icon name="arrowRight" size={24} /> Your family's journey</h2>
          </div>
        </div>
        <div className="steps">
          {nextSteps.map((s, i) => (
            <div className="step" key={s.t}>
              <div className="row" style={{ gap: "0.6rem" }}><Icon name={s.ico} size={22} style={{ color: "var(--maroon)" }} /><span className="chip-pre">Step {i + 1}</span></div>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------- Two campuses, two landmarks (same pins as the landing map) ------- */}
      <section className="container" id="find-us" style={{ paddingBottom: "3rem" }}>
        <div className="section-head">
          <div>
            <span className="kicker-sm">Visit us</span>
            <h2><Icon name="pin" size={24} /> Two campuses in Najjera</h2>
          </div>
          <span className="muted small">Two distinct landmarks about 1 km apart, both on Mbogo Road</span>
        </div>
        <div className="find-grid">
          {CAMPUSES.map((c) => (
            <div className={`find-card ${c.class}`} key={c.id}>
              <div className="find-top">
                <span className="find-dot" style={{ background: c.color }} />
                <div>
                  <h3 style={c.class === "gips" ? { fontFamily: "var(--fpd)", color: "var(--gips-deep)", margin: 0 } : { color: "var(--maroon)", margin: 0 }}>{c.name}</h3>
                  <span className="small muted">{c.landmark}</span>
                </div>
              </div>
              <ul className="find-list">
                <li><Icon name="pin" size={15} /> {c.address}</li>
                <li><Icon name="file" size={15} /> Plus code {c.plusCode}</li>
                <li><Icon name="phone" size={15} /> {c.phone}</li>
                <li><Icon name="globe" size={15} /> Coordinates {c.lat}, {c.lng}</li>
              </ul>
              <a className="btn secondary sm" href={`https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`} target="_blank" rel="noreferrer">
                <Icon name="pin" size={15} /> Get directions →
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ------- Footer (shared, final content) ------- */}
      <SchoolFooter />

    </main>
  );
}
