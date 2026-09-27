"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/icons.jsx";
import { useStaff } from "@/components/StaffSession.jsx";

// Staff sign-in: school webmail address (@gill.ac.ug) + portal password.
// Accounts are issued by the Head of School (Admin → Staff Accounts); the
// emailed invite sets the first password.
const DEMO = [
  { email: "a.hassan@gill.ac.ug", label: "Teacher · Ms. Aisha Hassan" },
  { email: "i.twesigye@gill.ac.ug", label: "Bursar · Mr. Isaac Twesigye" },
  { email: "m.kyomukama@gill.ac.ug", label: "Admissions · Mrs. Mary Kyomukama" },
];

export default function StaffPortalPage() {
  const router = useRouter();
  const { signIn } = useStaff();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/staff-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "Sign in failed");
      signIn(j.session);
      router.push(j.session.id === "u-admin" ? "/admin" : "/staff/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function fillDemo(addr) {
    setEmail(addr);
    setPassword("gill2026");
    setError("");
  }

  return (
    <main className="staff-onboard">
      <a className="staff-onboard-logo" href="/" aria-label="Gill School OS home">
        <img src="/logo.png" alt="Gill International School logo" />
      </a>

      <section className="staff-onboard-card" aria-labelledby="staff-login-title">
        <a className="staff-back" href="/"><Icon name="arrowRight" size={16} /> Back</a>

        <div className="staff-onboard-head">
          <span className="heading-icon"><Icon name="shield" size={19} /></span>
          <h1 id="staff-login-title">Staff sign in</h1>
          <p>Use your school email address and portal password to open your workspace.</p>
        </div>

        <form onSubmit={submit} className="staff-onboard-form">
          <fieldset className="staff-form-section">
            <legend>Staff details</legend>
            <label className="field">
              <span className="fw700">School email address</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gill.ac.ug"
                autoComplete="username"
                required
              />
            </label>
            <label className="field">
              <span className="fw700">Portal password</span>
              <span className="password-input">
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your portal password"
                  autoComplete="current-password"
                  required
                />
                <button type="button" onClick={() => setShow(!show)} aria-label={`${show ? "Hide" : "Show"} password`}>
                  <Icon name={show ? "eyeOff" : "eye"} size={19} />
                </button>
              </span>
            </label>
          </fieldset>

          {error && <p className="staff-form-error" role="alert"><Icon name="alert" size={16} /> {error}</p>}

          <button className="btn" disabled={busy}>{busy ? "Signing in…" : "Sign in to my workspace"}</button>
        </form>

        <div className="spread" style={{ marginTop: "0.9rem" }}>
          <a className="small" href="/staff/setup">First time? Open your invite &gt;</a>
          <a className="small" href="/staff/forgot">Forgot password?</a>
        </div>

        <div className="staff-security-note">
          <Icon name="lock" size={17} />
          <span><b>School-managed access</b> · Accounts are issued by the Head of School — there is no self-registration.</span>
        </div>

        <div className="demo-hint" style={{ marginTop: "1rem" }}>
          <b>Demo</b> — pick a profile, password <span className="mono">gill2026</span>
          <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {DEMO.map((d) => (
              <button key={d.email} type="button" className="btn secondary sm" onClick={() => fillDemo(d.email)}>
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
