"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Icon from "@/components/icons.jsx";
import { useStaff } from "@/components/StaffSession.jsx";

// First-time staff setup: the emailed invite link lands here with
// ?invite=STAFF-XXXX-XXXX. The holder sets a portal password and is signed in.
export default function StaffSetupLanding() {
  return (
    <Suspense fallback={<div className="auth-wrap"><div className="auth-card">Opening your invite…</div></div>}>
      <StaffSetup />
    </Suspense>
  );
}

function StaffSetup() {
  const search = useSearchParams();
  const router = useRouter();
  const { signIn } = useStaff();
  const [token, setToken] = useState(search.get("invite") || "");
  const [info, setInfo] = useState(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (search.get("invite")) openInvite();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openInvite(e) {
    e?.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "staffInviteLookup", token }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error);
      if (j.result.verified) {
        router.replace("/staff");
        return;
      }
      setInfo(j.result);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function setup(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); setBusy(false); return; }
    if (password !== confirm) { setError("Passwords don't match."); setBusy(false); return; }
    try {
      const r = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "staffInviteSetup", token, password }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error);
      signIn(j.result.session);
      router.push(j.result.session.id === "u-admin" ? "/admin" : "/staff/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="logo-row">
          <a href="https://www.gill.ac.ug/#home" aria-label="Back to gill.ac.ug" style={{ textDecoration: "none" }}>
            <img src="/logo.png" alt="Gill International School logo" />
          </a>
          <div>
            <h1>Staff setup</h1>
            <div className="sub">Gill School OS · Staff Portal</div>
          </div>
        </div>

        {!info ? (
          <>
            <div className="card" style={{ background: "var(--peri-l)", borderColor: "var(--peri-2)", boxShadow: "none", padding: "0.85rem 1rem", marginBottom: "1rem" }}>
              <div className="row" style={{ gap: "0.7rem" }}>
                <Icon name="key" size={20} style={{ color: "var(--maroon)" }} />
                <p className="small muted" style={{ margin: 0 }}>
                  The Head of School emailed you an invite link. Open it (or paste the code) to set your portal password.
                </p>
              </div>
            </div>
            <form onSubmit={openInvite}>
              <label className="field" style={{ marginBottom: "0.9rem" }}>
                <span className="small fw700" style={{ display: "block", marginBottom: "0.3rem" }}>Invite code from your email</span>
                <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="e.g. STAFF-AB12-CD34" autoComplete="off" />
              </label>
              {error && <p className="small" style={{ color: "var(--red)", margin: "0 0 0.7rem" }}>{error}</p>}
              <button className="btn" style={{ width: "100%" }} disabled={busy || !token}>
                {busy ? "Opening…" : "Open my invite"}
              </button>
            </form>
            <p className="small muted" style={{ marginTop: "0.8rem", textAlign: "center" }}>
              <a href="/staff">Already set up? Sign in instead &gt;</a>
            </p>
          </>
        ) : (
          <>
            <div className="card" style={{ background: "var(--peri-l)", borderColor: "var(--peri-2)", boxShadow: "none", padding: "0.85rem 1rem", marginBottom: "1rem" }}>
              <div className="row" style={{ gap: "0.7rem" }}>
                <Icon name="users" size={20} style={{ color: "var(--maroon)" }} />
                <div>
                  <b className="small">{info.name} · {info.roleLabel}</b>
                  <p className="small muted" style={{ margin: "0.15rem 0 0" }}>
                    Signing in as <span className="mono">{info.email}</span>
                  </p>
                </div>
              </div>
            </div>
            <form onSubmit={setup}>
              <label className="field" style={{ marginBottom: "0.8rem" }}>
                <span className="small fw700" style={{ display: "block", marginBottom: "0.3rem" }}>Create your portal password</span>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" />
              </label>
              <label className="field" style={{ marginBottom: "1rem" }}>
                <span className="small fw700" style={{ display: "block", marginBottom: "0.3rem" }}>Confirm password</span>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat the password" autoComplete="new-password" />
              </label>
              {error && <p className="small" style={{ color: "var(--red)", margin: "0 0 0.7rem" }}>{error}</p>}
              <button className="btn" style={{ width: "100%" }} disabled={busy}>
                {busy ? "Activating…" : "Set password & open workspace"}
              </button>
            </form>
            <p className="small muted" style={{ marginTop: "0.8rem", textAlign: "center" }}>
              This password opens the Staff Portal only — your webmail password is separate.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
