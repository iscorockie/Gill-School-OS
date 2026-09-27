"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/icons.jsx";
import { ParentProvider, useParent } from "@/components/ParentProvider.jsx";
import { useStaff } from "@/components/StaffSession.jsx";

export default function LoginPage() {
  return (
    <ParentProvider>
      <EmailLogin />
    </ParentProvider>
  );
}

function EmailLogin() {
  const router = useRouter();
  const { login } = useParent();
  const { signIn } = useStaff();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (!result.ok) {
        setError(result.error || "Sign in failed");
        return;
      }

      if (result.kind === "parent") {
        login(result.session);
        router.replace("/portal");
      } else {
        signIn(result.session);
        router.replace(result.destination);
      }
    } catch {
      setError("Could not reach the portal. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="logo-row">
          <a href="/" aria-label="Gill School OS home" style={{ textDecoration: "none" }}>
            <img src="/logo.png" alt="Gill International School logo" />
          </a>
          <div>
            <h1>Gill School OS</h1>
            <div className="sub">Sign in to your school account</div>
          </div>
        </div>

        <p className="small muted" style={{ marginTop: "-0.3rem" }}>
          Use the email linked to your OS account and its portal password. We&apos;ll open the right workspace for you.
        </p>

        <form onSubmit={submit}>
          <label style={{ display: "block", marginBottom: "0.85rem" }}>
            <span className="small" style={{ fontWeight: 700, display: "block", marginBottom: "0.3rem" }}>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@gill.ac.ug"
              autoComplete="username"
              required
            />
          </label>
          <label style={{ display: "block", marginBottom: "1rem" }}>
            <span className="small" style={{ fontWeight: 700, display: "block", marginBottom: "0.3rem" }}>Portal password</span>
            <div style={{ position: "relative" }}>
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                style={{ paddingRight: "2.6rem" }}
                required
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                style={{ position: "absolute", right: 8, top: 6, border: "none", background: "none", cursor: "pointer", color: "var(--muted)" }}
                aria-label={show ? "Hide password" : "Show password"}
              >
                <Icon name={show ? "eyeOff" : "eye"} size={18} />
              </button>
            </div>
          </label>
          {error && <p className="small" role="alert" style={{ color: "var(--red)", margin: "0 0 0.7rem" }}>{error}</p>}
          <button className="btn" style={{ width: "100%" }} disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", marginTop: "1.1rem", gap: "0.6rem" }}>
          <a href="/portal/login" className="small">Family username sign in</a>
          <a href="/portal/forgot" className="small">Parent password reset</a>
          <a href="/staff/forgot" className="small">Staff/admin reset</a>
          <a href="/student/login" className="small">Student sign in</a>
          <a href="/register" className="small">Create parent account</a>
        </div>
      </div>
    </div>
  );
}
