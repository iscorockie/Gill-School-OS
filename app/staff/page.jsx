"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/icons.jsx";
import { useStaff } from "@/components/StaffSession.jsx";

const ROLES = [
  { id: "teacher", label: "Teacher", icon: "grad", copy: "Assessments, remarks and family group chats", users: ["t-aisha", "t-brian", "t-sharon"] },
  { id: "admissions", label: "Admissions", icon: "file", copy: "Documents, transitions and family onboarding", users: ["u-admissions"] },
  { id: "bursar", label: "Bursar", icon: "card", copy: "Fees, payments, receipts and reconciliation", users: ["u-bursar"] },
  { id: "frontdesk", label: "Front Desk & Gate", icon: "gate", copy: "Check-ins, checkouts and late pickup handling", users: ["u-gate"] },
];

const STAFF_DB = {
  "t-aisha": { id: "t-aisha", name: "Ms. Aisha Hassan", title: "English & Class Teacher, Year 5", email: "a.hassan@gill.sch" },
  "t-brian": { id: "t-brian", name: "Mr. Brian Mugisha", title: "Mathematics & Science, Year 5", email: "b.mugisha@gill.sch" },
  "t-sharon": { id: "t-sharon", name: "Ms. Sharon Namukasa", title: "Pre-School Lead, Nursery", email: "s.namukasa@gill.sch" },
  "u-admissions": { id: "u-admissions", name: "Mrs. Mary Kyomukama", title: "Head of Admissions", email: "m.kyomukama@gill.sch" },
  "u-bursar": { id: "u-bursar", name: "Mr. Isaac Twesigye", title: "Bursar", email: "i.twesigye@gill.sch" },
  "u-gate": { id: "u-gate", name: "Mr. Peter Othieno", title: "Security & Gate Officer", email: "p.othieno@gill.sch" },
};

export default function StaffPortalPage() {
  const router = useRouter();
  const { signIn } = useStaff();
  const [role, setRole] = useState("teacher");
  const [userId, setUserId] = useState("t-aisha");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const activeRole = ROLES.find((item) => item.id === role);
  const person = STAFF_DB[userId];

  function changeRole(event) {
    const nextRole = ROLES.find((item) => item.id === event.target.value);
    setRole(nextRole.id);
    setUserId(nextRole.users[0]);
    setError("");
  }

  function submit(event) {
    event.preventDefault();
    setError("");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    if (password !== "gill2026") return setError("Use the school-issued demo password: gill2026");

    setBusy(true);
    signIn({ ...person, role: "staff", roleLabel: activeRole.label, actor: true });
    router.push("/staff/home");
  }

  return (
    <main className="staff-onboard">
      <a className="staff-onboard-logo" href="/" aria-label="Gill School OS home">
        <img src="/logo.png" alt="Gill International School logo" />
      </a>

      <section className="staff-onboard-card" aria-labelledby="staff-onboard-title">
        <a className="staff-back" href="/"><Icon name="arrowRight" size={16} /> Back</a>

        <div className="staff-onboard-head">
          <span className="heading-icon"><Icon name="shield" size={19} /></span>
          <h1 id="staff-onboard-title">Set up your staff account</h1>
          <p>Use your school-issued profile to access the Gill School workspace.</p>
        </div>

        <form onSubmit={submit} className="staff-onboard-form">
          <fieldset className="staff-form-section">
            <legend>Staff role</legend>
            <label className="field">
              <span className="fw700">Select your role</span>
              <select value={role} onChange={changeRole}>
                {ROLES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>

            {activeRole.users.length > 1 && (
              <label className="field">
                <span className="fw700">Issued staff profile</span>
                <select value={userId} onChange={(event) => setUserId(event.target.value)}>
                  {activeRole.users.map((id) => <option key={id} value={id}>{STAFF_DB[id].name}</option>)}
                </select>
              </label>
            )}

            <div className="staff-role-note">
              <Icon name={activeRole.icon} size={18} />
              <span><b>{activeRole.label}</b><small>{activeRole.copy}</small></span>
            </div>
          </fieldset>

          <fieldset className="staff-form-section">
            <legend>Staff details</legend>
            <div className="staff-field-grid">
              <label className="field">
                <span className="fw700">Full name</span>
                <input value={person.name} readOnly aria-readonly="true" />
              </label>

              <label className="field">
                <span className="fw700">School email address</span>
                <input type="email" value={person.email} readOnly aria-readonly="true" />
              </label>
            </div>
          </fieldset>

          <fieldset className="staff-form-section">
            <legend>Secure your account</legend>
            <div className="staff-field-grid">
              <PasswordField label="Password" value={password} setValue={setPassword} visible={showPassword} setVisible={setShowPassword} autoComplete="new-password" />
              <PasswordField label="Confirm password" value={confirm} setValue={setConfirm} visible={showConfirm} setVisible={setShowConfirm} autoComplete="new-password" />
            </div>
          </fieldset>

          {error && <p className="staff-form-error" role="alert"><Icon name="alert" size={16} /> {error}</p>}

          <button className="btn" disabled={busy}>{busy ? "Opening your workspace…" : "Complete staff setup"}</button>
        </form>

        <div className="staff-security-note">
          <Icon name="lock" size={17} />
          <span><b>School-managed access</b> · Staff profiles are issued by the school office. Demo password: <span className="mono">gill2026</span>.</span>
        </div>

        <p className="staff-onboard-foot">Already set up? Completing this form securely opens your existing staff workspace.</p>
      </section>
    </main>
  );
}

function PasswordField({ label, value, setValue, visible, setVisible, autoComplete }) {
  return (
    <label className="field">
      <span className="fw700">{label}</span>
      <span className="password-input">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="At least 8 characters"
          autoComplete={autoComplete}
          required
        />
        <button type="button" onClick={() => setVisible(!visible)} aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}>
          <Icon name={visible ? "eyeOff" : "eye"} size={19} />
        </button>
      </span>
    </label>
  );
}
