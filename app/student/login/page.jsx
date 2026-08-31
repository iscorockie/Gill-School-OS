"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/icons.jsx";
import { useStudent } from "@/components/StudentProvider.jsx";

export default function StudentLoginPage() {
  return <StudentLogin />;
}

function StudentLogin() {
  const { login, ready } = useStudent();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  // The activation SMS links straight here with ?u=<username> (child portal).
  useEffect(() => {
    const u = new URLSearchParams(window.location.search).get("u");
    if (u) setUsername(u);
  }, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/student-login", {
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
      router.replace("/student");
    } catch (err) {
      setError("Could not reach the portal. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function demo() {
    setUsername("jordan.nansubuga");
    setPassword("gill123");
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="logo-row">
          <a href="https://www.gill.ac.ug/#home" aria-label="Back to gill.ac.ug" style={{ textDecoration: "none" }}>
          <img src="/logo.png" alt="Gill International School logo" />
        </a>
          <div>
            <h1>Student Portal</h1>
            <div className="sub">Gill International School · Najjera</div>
          </div>
        </div>
        <p className="small muted" style={{ marginTop: "-0.4rem" }}> Your account was created by your parent before you reported to school.
          Sign in with the username they set up.
        </p>
        <form onSubmit={submit}>
          <label style={{ display: "block", marginBottom: "0.85rem" }}>
            <span className="small" style={{ fontWeight: 700, display: "block", marginBottom: "0.3rem" }}>Username</span>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. jordan.nansubuga" autoComplete="username" />
          </label>
          <label style={{ display: "block", marginBottom: "1rem" }}>
            <span className="small" style={{ fontWeight: 700, display: "block", marginBottom: "0.3rem" }}>Password</span>
            <div style={{ position: "relative" }}>
              <input type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ paddingRight: "2.6rem" }}
              />
              <button type="button"
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
          <b>Demo account</b> — username <span className="mono">jordan.nansubuga</span> · password <span className="mono">gill123</span>.
          <div style={{ marginTop: "0.5rem" }}>
            <button className="btn secondary sm" onClick={demo}>Fill demo details</button>
          </div>
          <p style={{ marginTop: "0.55rem", marginBottom: 0 }}> Parents create and manage student accounts from <b>Parent Portal → Student Accounts</b>.
          </p>
        </div>

        <div className="row" style={{ justifyContent: "space-between", marginTop: "1.1rem" }}>
          <a href="/portal" className="small">← Parent Portal</a>
          <a href="/" className="small">School home</a>
        </div>
      </div>
    </div>
  );
}
