"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Icon from "@/components/icons.jsx";
import { ParentProvider, useParent } from "@/components/ParentProvider.jsx";

export default function SetupLanding() {
  return (
    <ParentProvider>
      <Suspense fallback={<div className="auth-wrap"><div className="auth-card">Opening your invite…</div></div>}>
        <Setup />
      </Suspense>
    </ParentProvider>
  );
}

function Setup() {
  const search = useSearchParams();
  const router = useRouter();
  const { login } = useParent();
  const [token, setToken] = useState(search.get("invite") || "");
  const [step, setStep] = useState("welcome"); // welcome → password → verify → done
  const [info, setInfo] = useState(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [channel, setChannel] = useState("sms");
  const [code, setCode] = useState("");
  const [demoCode, setDemoCode] = useState("");
  const [sender, setSender] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function api(op, body = {}) {
    const r = await fetch("/api/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op, token, ...body }),
    });
    return r.json();
  }

  async function openInvite(e) {
    e?.preventDefault();
    setBusy(true); setError("");
    try {
      const j = await api("inviteLookup");
      if (!j.ok) throw new Error(j.error);
      if (j.result.verified) {
        router.replace("/portal/login");
        return;
      }
      setInfo(j.result);
      setStep("password");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function createPassword(e) {
    e.preventDefault();
    setBusy(true); setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); setBusy(false); return; }
    if (password !== confirm) { setError("Passwords don't match."); setBusy(false); return; }
    try {
      const j = await api("inviteSetup", { password, channel });
      if (!j.ok) throw new Error(j.error);
      setDemoCode(j.result.demoCode);
      setSender({ channel: j.result.channel, to: j.result.to });
      setStep("verify");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function verify(e) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const j = await api("inviteVerify", { code });
      if (!j.ok) throw new Error(j.error);
      login(j.result.session);
      router.replace("/portal");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setBusy(true); setError("");
    try {
      const j = await api("inviteResend");
      if (!j.ok) throw new Error(j.error);
      setDemoCode(j.result.demoCode);
      setCode("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const mask = (v) => (v ? v.replace(/.(?=.{4})/g, "•") : "");

  return (
    <div className="auth-wrap">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="logo-row">
          <img src="/logo.png" alt="Gill International School logo" />
          <div>
            <h1>Your family portal</h1>
            <div className="sub">Gill International School · Najjera</div>
          </div>
        </div>

        {/* STEP 0 — open the invite */}
        {step === "welcome" && (
          <>
            <form onSubmit={openInvite}>
              <label style={{ display: "block", marginBottom: "0.9rem" }}>
                <span className="small" style={{ fontWeight: 700, display: "block", marginBottom: "0.3rem" }}>Invite code from your SMS</span>
                <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="e.g. INV-SSEM-3F7B" />
              </label>
              <p className="small muted" style={{ margin: "0 0 0.9rem" }}>
                Both parents on the admission form received this link. Open it to create your shared password —
                one login for the whole family.
              </p>
              {error && <p className="small" style={{ color: "var(--red)", margin: "0 0 0.7rem" }}>{error}</p>}
              <button className="btn" style={{ width: "100%" }} disabled={busy || !token}>
                {busy ? "Opening…" : "Open my invite"}
              </button>
            </form>
            <div className="demo-hint" style={{ marginTop: "1rem" }}>
              <b>Demo</b> — pay the Ssemwanga invoice in Admin → Fees, then use{" "}
              <span className="mono">INV-SSEM-XXXX</span> from the invite SMS. Already set up?{" "}
              <a href="/portal/login">Sign in →</a>
            </div>
          </>
        )}

        {/* STEP 1 — create password */}
        {step === "password" && info && (
          <>
            <div className="card" style={{ background: "var(--peri-l)", borderColor: "var(--peri-2)", boxShadow: "none", padding: "0.8rem 1rem", marginBottom: "1rem" }}>
              <div className="row" style={{ gap: "0.7rem" }}>
                <Icon name="users" size={20} style={{ color: "var(--maroon)" }} />
                <div>
                  <b className="small">{info.familyName} family · {info.kids.map((k) => k.name).join(", ")}</b>
                  <p className="small muted" style={{ margin: "0.15rem 0 0" }}>
                    One shared login (<span className="mono">@{info.username}</span>) for{" "}
                    {info.members.map((m) => m.name.split(" ")[0]).join(" & ")}.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={createPassword}>
              <label style={{ display: "block", marginBottom: "0.8rem" }}>
                <span className="small" style={{ fontWeight: 700, display: "block", marginBottom: "0.3rem" }}>Create your family password</span>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" />
              </label>
              <label style={{ display: "block", marginBottom: "1rem" }}>
                <span className="small" style={{ fontWeight: 700, display: "block", marginBottom: "0.3rem" }}>Confirm password</span>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat the password" autoComplete="new-password" />
              </label>

              <span className="small" style={{ fontWeight: 700, display: "block", marginBottom: "0.5rem" }}>Where should we send your verification code?</span>
              <div className="grid grid-2" style={{ gap: "0.5rem", marginBottom: "1rem" }}>
                {[
                  ["sms", "phone", "SMS", info.members[0]?.phone ? mask(info.members[0].phone) : ""],
                  ["email", "mail", "Email", info.members[0]?.email || info.email || ""],
                ].map(([id, icon, label, to]) => (
                  <label key={id} className={`perm ${channel === id ? "" : "off"}`} style={{ cursor: "pointer" }}>
                    <input type="radio" name="vchannel" checked={channel === id} onChange={() => setChannel(id)} style={{ width: "auto" }} />
                    <span className="small"><Icon name={icon} size={15} style={{ verticalAlign: "-3px", marginRight: "0.3rem" }} /> {label}{to ? <span className="muted"> · {to}</span> : ""}</span>
                  </label>
                ))}
              </div>

              {error && <p className="small" style={{ color: "var(--red)", margin: "0 0 0.7rem" }}>{error}</p>}
              <button className="btn" style={{ width: "100%" }} disabled={busy}>
                {busy ? "Sending code…" : "Create password & send code"}
              </button>
            </form>
            <p className="small muted" style={{ marginTop: "0.8rem", textAlign: "center" }}>
              <a href="/portal/login">Already set up? Sign in instead →</a>
            </p>
          </>
        )}

        {/* STEP 2 — enter verification code */}
        {step === "verify" && info && (
          <>
            <div className="card" style={{ background: "var(--peri-l)", borderColor: "var(--peri-2)", boxShadow: "none", padding: "0.8rem 1rem", marginBottom: "1rem" }}>
              <div className="row" style={{ gap: "0.7rem" }}>
                <Icon name={sender?.channel === "email" ? "mail" : "phoneCard"} size={20} style={{ color: "var(--maroon)" }} />
                <div>
                  <b className="small">Code sent by {sender?.channel === "email" ? "email" : "SMS"}</b>
                  <p className="small muted" style={{ margin: "0.15rem 0 0" }}>
                    To {mask(sender?.to || "")} · expires in 10 minutes. Enter the 6 digits below.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={verify}>
              <label style={{ display: "block", marginBottom: "0.9rem" }}>
                <span className="small" style={{ fontWeight: 700, display: "block", marginBottom: "0.3rem" }}>Verification code</span>
                <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="••••••" inputMode="numeric" className="mono" style={{ letterSpacing: "0.5rem", fontSize: "1.1rem" }} />
              </label>
              {demoCode && (
                <div className="quote" style={{ background: "#fffbe8", borderColor: "var(--gold-2)", marginBottom: "0.9rem" }}>
                  <b className="small">Demo gateway</b>
                  <div className="small">Since SMS is simulated here, your code is <span className="mono">{demoCode}</span>.</div>
                </div>
              )}
              {error && <p className="small" style={{ color: "var(--red)", margin: "0 0 0.7rem" }}>{error}</p>}
              <button className="btn" style={{ width: "100%" }} disabled={busy || code.length !== 6}>
                {busy ? "Verifying…" : "Verify & open portal"}
              </button>
            </form>
            <div className="spread" style={{ marginTop: "0.8rem" }}>
              <button className="btn ghost sm" onClick={resend} disabled={busy}>
                <Icon name="refresh" size={14} /> Resend code
              </button>
              <a className="small" href="/portal/login">Sign in instead →</a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
