"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/icons.jsx";
import { useStaff } from "@/components/StaffSession.jsx";

// Restricted sign-in: only the Top School Administration can open the OS
// console here. Everyone else uses their own portal (Parents / Staff / Student).
// Authentication is server-side against the staff account for f.ssekandi@gill.ac.ug.
export default function AdminLoginPage() {
  const router = useRouter();
  const { signIn } = useStaff();
  const [email, setEmail] = useState("f.ssekandi@gill.ac.ug");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
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
      if (j.session.id !== "u-admin") {
        throw new Error("Restricted — this console is for the Head of School only. Staff sign in at /staff.");
      }
      signIn(j.session);
      router.replace("/admin");
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
            <h1>OS Admin</h1>
            <div className="sub">Gill School OS · Monitoring Console</div>
          </div>
        </div>

        <div className="card" style={{ background: "var(--peri-l)", borderColor: "var(--peri-2)", boxShadow: "none", padding: "0.8rem 1rem", marginBottom: "1.1rem" }}>
          <div className="row" style={{ gap: "0.6rem", alignItems: "flex-start" }}>
            <Icon name="shield" size={19} style={{ color: "var(--maroon)" }} />
            <div>
              <b className="small">Restricted — top school administration only.</b>
              <p className="small muted" style={{ margin: "0.15rem 0 0" }}>
                This console monitors the Parents' Portal, Staff Portal and Student Portals.
                Staff, parents and students each have their own portal; access here is limited to the Head of School.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={submit}>
          <label style={{ display: "block", marginBottom: "0.85rem" }}>
            <span className="small" style={{ fontWeight: 700, display: "block", marginBottom: "0.3rem" }}>Administration email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
          </label>
          <label style={{ display: "block", marginBottom: "1rem" }}>
            <span className="small" style={{ fontWeight: 700, display: "block", marginBottom: "0.3rem" }}>Password</span>
            <div style={{ position: "relative" }}>
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
          <button className="btn" style={{ width: "100%" }} disabled={busy}>
            {busy ? "Checking…" : "Sign in to the OS console"}
          </button>
        </form>

        <div className="row" style={{ justifyContent: "space-between", marginTop: "1.1rem" }}>
          <a href="/staff/forgot" className="small">Forgot password?</a>
          <a href="/" className="small">← Back to the OS</a>
        </div>
      </div>
    </div>
  );
}
