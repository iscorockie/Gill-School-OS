"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/icons.jsx";
import { useParent } from "@/components/ParentProvider.jsx";

export default function ParentLoginPage() {
  return <ParentLogin />;
}

function ParentLogin() {
  const { login } = useParent();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/parent-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const j = await res.json();
      if (!j.ok) {
        setError(j.error || "Sign in failed");
        return;
      }
      login(j.session);
      router.replace("/portal");
    } catch (err) {
      setError("Could not reach the portal. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function demo() {
    setUsername("nansubuga.family");
    setPassword("gill2026");
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="logo-row">
          <a href="https://www.gill.ac.ug/#home" aria-label="Back to gill.ac.ug" style={{ textDecoration: "none" }}>
          <img src="/logo.png" alt="Gill International School logo" />
        </a>
          <div>
            <h1>Parent Portal</h1>
            <div className="sub">Gill International School · Najjera</div>
          </div>
        </div>

        <div className="card" style={{ padding: "0.8rem 1rem", marginBottom: "1.1rem", background: "var(--peri-l)", borderColor: "var(--peri-2)", boxShadow: "none" }}>
          <div className="row" style={{ gap: "0.6rem" }}>
            <Icon name="users" size={20} style={{ color: "var(--maroon)" }} />
            <div>
              <b className="small">One login per family.</b>
              <p className="small muted" style={{ margin: "0.15rem 0 0" }}>
                Both parents on the admission form received this username by SMS when admission was completed.
                You share the same login.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={submit}>
          <label style={{ display: "block", marginBottom: "0.85rem" }}>
            <span className="small" style={{ fontWeight: 700, display: "block", marginBottom: "0.3rem" }}>Family username</span>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. nansubuga.family" autoComplete="username" />
          </label>
          <label style={{ display: "block", marginBottom: "1rem" }}>
            <span className="small" style={{ fontWeight: 700, display: "block", marginBottom: "0.3rem" }}>Family password</span>
            <div style={{ position: "relative" }}>
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ paddingRight: "2.6rem" }}
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                style={{ position: "absolute", right: 8, top: 6, border: "none", background: "none", cursor: "pointer", color: "var(--muted)" }}
                aria-label="Toggle password visibility"
              >
                <Icon name={show ? "eyeOff" : "eye"} size={18} />
              </button>
            </div>
          </label>
          {error && <p className="small" style={{ color: "var(--red)", margin: "0 0 0.7rem" }}>{error}</p>}
          <button className="btn" style={{ width: "100%" }} disabled={busy || !username || !password}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="demo-hint">
          <b>Demo family</b> — username <span className="mono">nansubuga.family</span> · password <span className="mono">gill2026</span>.
          <div style={{ marginTop: "0.5rem" }}>
            <button className="btn secondary sm" onClick={demo}>Fill demo details</button>
          </div>
        </div>

        <div className="card" style={{ marginTop: "1.1rem", background: "var(--peri-l)", borderColor: "var(--peri-2)", boxShadow: "none", padding: "0.7rem 0.9rem" }}>
          <b className="small">New family?</b>
          <span className="small muted"> Start your application online — create the family account and follow the 6-step application, or open your invite link from the SMS (set a password, then verify with a code sent to your phone).</span>
          <div className="row" style={{ marginTop: "0.5rem", gap: "0.5rem", flexWrap: "wrap" }}>
            <a className="btn secondary sm" href="/register">Register &amp; apply →</a>
            <a className="btn ghost sm" href="/portal/setup">Open the invite setup →</a>
          </div>
        </div>

        <div className="row" style={{ justifyContent: "space-between", marginTop: "1.1rem" }}>
          <a href="/student/login" className="small">Student portal →</a>
          <a href="/" className="small">School home</a>
        </div>
      </div>
    </div>
  );
}
