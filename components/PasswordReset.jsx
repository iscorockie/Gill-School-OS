"use client";
import { useState } from "react";
import Icon from "@/components/icons.jsx";

// Shared email password-reset card used by the staff, parent and student
// portals. Step 1: identifier → emailed 6-digit code. Step 2: code + new
// password. The code is delivered by email only — never shown on screen.
export default function PasswordReset({
  portal,
  title,
  subtitle,
  identifierLabel,
  identifierPlaceholder,
  identifierType = "text",
  signInHref,
  signInLabel = "Back to sign in",
  note,
}) {
  const [step, setStep] = useState("request"); // request > reset > done
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function request(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "requestPasswordReset", portal, identifier }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "Could not send the code.");
      setTo(j.result.to);
      setStep("reset");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function reset(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    if (pw.length < 8) { setError("Password must be at least 8 characters."); setBusy(false); return; }
    if (pw !== confirm) { setError("Passwords don't match."); setBusy(false); return; }
    try {
      const r = await fetch("/api/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "resetPasswordWithCode", portal, identifier, code, newPassword: pw }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "Reset failed.");
      setStep("done");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="logo-row">
          <a href="https://www.gill.ac.ug/#home" aria-label="Back to gill.ac.ug" style={{ textDecoration: "none" }}>
            <img src="/logo.png" alt="Gill International School logo" />
          </a>
          <div>
            <h1>{title}</h1>
            <div className="sub">{subtitle}</div>
          </div>
        </div>

        {step === "request" && (
          <form onSubmit={request}>
            <div className="card" style={{ background: "var(--peri-l)", borderColor: "var(--peri-2)", boxShadow: "none", padding: "0.8rem 1rem", marginBottom: "1rem" }}>
              <div className="row" style={{ gap: "0.6rem" }}>
                <Icon name="mail" size={19} style={{ color: "var(--maroon)" }} />
                <p className="small muted" style={{ margin: 0 }}>
                  Enter your sign-in {portal === "staff" ? "school email" : "detail"} and we email you a 6-digit code.
                </p>
              </div>
            </div>
            <label style={{ display: "block", marginBottom: "1rem" }}>
              <span className="small" style={{ fontWeight: 700, display: "block", marginBottom: "0.3rem" }}>{identifierLabel}</span>
              <input type={identifierType} value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder={identifierPlaceholder} autoComplete="username" />
            </label>
            {error && <p className="small" style={{ color: "var(--red)", margin: "0 0 0.7rem" }}>{error}</p>}
            <button className="btn" style={{ width: "100%" }} disabled={busy || !identifier}>
              {busy ? "Sending code…" : "Email me a reset code"}
            </button>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={reset}>
            <div className="card" style={{ background: "var(--peri-l)", borderColor: "var(--peri-2)", boxShadow: "none", padding: "0.8rem 1rem", marginBottom: "1rem" }}>
              <div className="row" style={{ gap: "0.6rem" }}>
                <Icon name="mail" size={19} style={{ color: "var(--maroon)" }} />
                <p className="small muted" style={{ margin: 0 }}>
                  Code sent to <b>{to}</b> · expires in 15 minutes. Check your inbox (and spam folder).
                </p>
              </div>
            </div>
            <label style={{ display: "block", marginBottom: "0.85rem" }}>
              <span className="small" style={{ fontWeight: 700, display: "block", marginBottom: "0.3rem" }}>6-digit code</span>
              <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="••••••" inputMode="numeric" className="mono" style={{ letterSpacing: "0.5rem", fontSize: "1.1rem" }} />
            </label>
            <label style={{ display: "block", marginBottom: "0.85rem" }}>
              <span className="small" style={{ fontWeight: 700, display: "block", marginBottom: "0.3rem" }}>New password</span>
              <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" />
            </label>
            <label style={{ display: "block", marginBottom: "1rem" }}>
              <span className="small" style={{ fontWeight: 700, display: "block", marginBottom: "0.3rem" }}>Confirm new password</span>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat the password" autoComplete="new-password" />
            </label>
            {error && <p className="small" style={{ color: "var(--red)", margin: "0 0 0.7rem" }}>{error}</p>}
            <button className="btn" style={{ width: "100%" }} disabled={busy || code.length !== 6 || !pw}>
              {busy ? "Resetting…" : "Set new password"}
            </button>
            <div style={{ marginTop: "0.7rem", textAlign: "center" }}>
              <button type="button" className="btn ghost sm" onClick={request} disabled={busy}>
                <Icon name="refresh" size={14} /> Resend code
              </button>
            </div>
          </form>
        )}

        {step === "done" && (
          <div className="card" style={{ background: "#f0faf0", borderColor: "#bfe3bf", boxShadow: "none", padding: "1rem", textAlign: "center" }}>
            <Icon name="check" size={26} style={{ color: "var(--green)" }} />
            <p><b>Password updated.</b></p>
            <p className="small muted">Sign in with your new password.</p>
            <a className="btn" href={signInHref}>Sign in</a>
          </div>
        )}

        {note && step !== "done" && <p className="small muted" style={{ marginTop: "0.9rem" }}>{note}</p>}

        <div className="row" style={{ justifyContent: "space-between", marginTop: "1.1rem" }}>
          <a href={signInHref} className="small">{signInLabel} &gt;</a>
          <a href="/" className="small">School home</a>
        </div>
      </div>
    </div>
  );
}
