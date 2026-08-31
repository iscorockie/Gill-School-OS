"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/icons.jsx";
import { useStaff } from "@/components/StaffSession.jsx";

const ROLES = [
  {
    id: "teacher",
    label: "Teacher",
    icon: "grad",
    copy: "Record assessments, write remarks, post to family group chats.",
    users: ["t-aisha", "t-brian", "t-sharon"],
  },
  {
    id: "admissions",
    label: "Admissions",
    icon: "file",
    copy: "Verify documents, run transitions, watch auto-onboarding.",
    users: ["u-admissions"],
  },
  {
    id: "bursar",
    label: "Bursar",
    icon: "card",
    copy: "Fees, payments, receipts and reconciliation.",
    users: ["u-bursar"],
  },
  {
    id: "frontdesk",
    label: "Front Desk & Gate",
    icon: "gate",
    copy: "Check-ins, checkouts, late pickup handling.",
    users: ["u-gate"],
  },
];

const STAFF_DB = {
  "t-aisha": { id: "t-aisha", role: "staff", name: "Ms. Aisha Hassan", title: "English & Class Teacher — Year 5", email: "a.hassan@gill.sch" },
  "t-brian": { id: "t-brian", role: "staff", name: "Mr. Brian Mugisha", title: "Mathematics & Science — Year 5", email: "b.mugisha@gill.sch" },
  "t-sharon": { id: "t-sharon", role: "staff", name: "Ms. Sharon Namukasa", title: "Pre-School Lead — Nursery", email: "s.namukasa@gill.sch" },
  "u-admissions": { id: "u-admissions", role: "staff", name: "Mrs. Mary Kyomukama", title: "Head of Admissions", email: "m.kyomukama@gill.sch" },
  "u-bursar": { id: "u-bursar", role: "staff", name: "Mr. Isaac Twesigye", title: "Bursar", email: "i.twesigye@gill.sch" },
  "u-gate": { id: "u-gate", role: "staff", name: "Mr. Peter Othieno", title: "Security & Gate Officer", email: "p.othieno@gill.sch" },
  "u-admin": { id: "u-admin", role: "staff", name: "Mr. Francis Ssekandi", title: "Head of School", email: "f.ssekandi@gill.sch" },
};

export default function StaffPortalPage() {
  const router = useRouter();
  const { signIn } = useStaff();
  const [role, setRole] = useState("teacher");
  const [userId, setUserId] = useState("t-aisha");
  const [password, setPassword] = useState("gill2026");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const activeRole = ROLES.find((r) => r.id === role);
  const person = STAFF_DB[userId];

  function pickRole(r) {
    setRole(r.id);
    setUserId(r.users[0]);
    setError("");
  }

  function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    if (password !== "gill2026") {
      setError("That password doesn't match. Demo password: gill2026");
      setBusy(false);
      return;
    }
    signIn({ ...person, roleLabel: activeRole.label, actor: true });
    router.push("/staff/home");
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card" style={{ maxWidth: 560 }}>
        <div className="logo-row">
          <a href="https://www.gill.ac.ug/#home" aria-label="Back to gill.ac.ug" style={{ textDecoration: "none" }}>
          <img src="/logo.png" alt="Gill International School logo" />
        </a>
          <div>
            <h1>Staff Portal</h1>
            <div className="sub">Gill International School · Gill Pre-School</div>
          </div>
        </div>

        <div className="card" style={{ background: "var(--peri-l)", borderColor: "var(--peri-2)", boxShadow: "none", padding: "0.8rem 1rem", marginBottom: "1.1rem" }}>
          <div className="row" style={{ gap: "0.6rem" }}>
            <Icon name="shield" size={19} style={{ color: "var(--maroon)" }} />
            <div>
              <b className="small">One workspace for teachers, admissions, bursar, gate and leadership.</b>
              <p className="small muted" style={{ margin: "0.15rem 0 0" }}>
                Assessments, documents, leave requests, fee reconciliation, gate checkouts and family group chats — in place of paper registers, folders and phone calls.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={submit}>
          <span className="small" style={{ fontWeight: 700, display: "block", marginBottom: "0.5rem" }}>Who are you?</span>
          <div className="grid grid-2" style={{ gap: "0.5rem", marginBottom: "0.9rem" }}>
            {ROLES.map((r) => (
              <button
                type="button"
                key={r.id}
                onClick={() => pickRole(r)}
                className={`perm ${role === r.id ? "" : "off"}`}
                style={{ textAlign: "left", cursor: "pointer", border: "1px solid var(--line)", borderRadius: 10, padding: "0.5rem 0.6rem" }}
              >
                <span className="row" style={{ gap: "0.4rem" }}>
                  <Icon name={r.icon} size={15} style={{ color: "var(--maroon)" }} />
                  <b className="small">{r.label}</b>
                </span>
                <span className="small muted" style={{ display: "block", marginTop: "0.15rem" }}>{r.copy}</span>
              </button>
            ))}
          </div>

          <label style={{ display: "block", marginBottom: "0.8rem" }}>
            <span className="small" style={{ fontWeight: 700, display: "block", marginBottom: "0.3rem" }}>Staff member</span>
            <select value={userId} onChange={(e) => setUserId(e.target.value)}>
              {activeRole.users.map((id) => {
                const u = STAFF_DB[id];
                return <option key={id} value={id}>{u.name} — {u.title}</option>;
              })}
            </select>
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
            {busy ? "Opening…" : `Enter Staff Portal as ${person?.name.split(" ")[0]}`}
          </button>
        </form>

        <div className="demo-hint" style={{ marginTop: "1rem" }}>
          <b>Demo</b> — every staff role signs in with <span className="mono">gill2026</span>.
          <div className="small muted" style={{ marginTop: "0.3rem" }}>Your name and role follow you across the workspace; no shared desk logins.</div>
        </div>

        <div className="row" style={{ justifyContent: "space-between", marginTop: "1.1rem" }}>
          <a href="/student/login" className="small">Student portal →</a>
          <a href="/" className="small">School home</a>
        </div>
      </div>
    </div>
  );
}
