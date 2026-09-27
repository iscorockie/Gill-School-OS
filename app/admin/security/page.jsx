"use client";
import { useState } from "react";
import { useApp, Badge } from "@/components/ui.jsx";
import Icon from "@/components/icons.jsx";

const legacy = (a) => a.authStrength === "legacy"; // derived server-side; passwords never reach the UI

// Head of School console: launch-day password safety. One click flags every
// active account so each holder re-verifies with an emailed code on next
// sign-in — rotating all seeded/demo passwords at once.
export default function SecurityPage() {
  const { db, act } = useApp();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  if (!db) return <div className="card">Loading…</div>;

  const staff = db.staffAccounts || [];
  const families = db.familyAccounts || [];
  const students = db.studentAccounts || [];

  const legacyStaff = staff.filter((a) => a.status === "active" && a.verified && legacy(a));
  const legacyFam = families.filter((a) => (a.status === "active" || a.status === "pending") && a.verified && legacy(a));
  const wouldFlag = {
    staff: staff.filter((a) => a.status === "active" && a.verified && a.passwordSet).length,
    family: families.filter((a) => (a.status === "active" || a.status === "pending") && a.verified).length,
    student: students.filter((a) => a.status === "active").length,
  };
  const flagged = [
    ...staff.filter((a) => a.mustReset).map((a) => ({ scope: "staff", id: a.id, label: a.email, sub: (db.users.find((u) => u.id === a.userId) || {}).name || "" })),
    ...families.filter((a) => a.mustReset).map((a) => ({ scope: "family", id: a.id, label: a.username, sub: `${(db.families.find((f) => f.id === a.familyId) || {}).name || ""} family` })),
    ...students.filter((a) => a.mustReset).map((a) => ({ scope: "student", id: a.id, label: a.username, sub: (db.studentIndex[a.studentId] || {}).name || "" })),
  ];

  async function force() {
    setBusy(true);
    setResult(null);
    try {
      const r = await act(
        "forcePasswordResetAll",
        {},
        "Reset forced — every account must re-verify by email."
      );
      setResult(r);
      setConfirm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function clear(scope, accountId) {
    try {
      await act("clearMustReset", { scope, accountId }, "Reset flag cleared.");
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      <div className="section-head">
        <h2>Security</h2>
        <Badge tone="blue">password safety · launch control</Badge>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3><Icon name="shield" size={18} /> Launch readiness</h3>
          <p className="small muted" style={{ marginTop: "-0.3rem" }}>
            Accounts still on original (seeded) passwords. Forcing a reset below rotates all of them at once.
          </p>
          <div className="list-item">
            <div className="spread">
              <b>{legacyStaff.length} staff on original passwords</b>
              <Badge tone={legacyStaff.length ? "gold" : "green"}>{legacyStaff.length ? "action" : "clear"}</Badge>
            </div>
            {legacyStaff.length > 0 && (
              <div className="small muted" style={{ marginTop: "0.3rem" }}>{legacyStaff.map((a) => a.email).join(", ")}</div>
            )}
          </div>
          <div className="list-item">
            <div className="spread">
              <b>{legacyFam.length} families on original passwords</b>
              <Badge tone={legacyFam.length ? "gold" : "green"}>{legacyFam.length ? "action" : "clear"}</Badge>
            </div>
            {legacyFam.length > 0 && (
              <div className="small muted" style={{ marginTop: "0.3rem" }}>{legacyFam.map((a) => a.username).join(", ")}</div>
            )}
          </div>
          <p className="small muted" style={{ marginTop: "0.5rem" }}>
            Student passwords stay parent-readable by design (supervised accounts, no fee access) and are
            managed in Parent Portal → Student Accounts.
          </p>
        </div>

        <div className="card">
          <h3><Icon name="key" size={18} /> Force password reset for everyone</h3>
          <p className="small muted" style={{ marginTop: "-0.3rem" }}>
            One click. Every active account must re-verify with an emailed code at next sign-in:
          </p>
          <div className="row" style={{ gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.8rem" }}>
            <span className="badge blue">{wouldFlag.staff} staff</span>
            <span className="badge blue">{wouldFlag.family} families</span>
            <span className="badge blue">{wouldFlag.student} students</span>
          </div>
          <p className="small muted">
            Staff codes go to school mailboxes · family codes to the parent email on file · student codes
            to the parent (supervised). Unverified invite accounts are skipped. Families with no email on
            file will need the office — clear their flag below after helping them.
          </p>
          <label className="row" style={{ gap: "0.5rem", margin: "0.8rem 0", alignItems: "flex-start" }}>
            <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} style={{ marginTop: 2 }} />
            <span className="small">I understand everyone (including me) will be signed out into a password reset.</span>
          </label>
          <button className="btn" disabled={busy || !confirm} onClick={force}>
            {busy ? "Flagging accounts…" : "Force reset for everyone"}
          </button>
          {result && (
            <div className="quote" style={{ background: "#f0faf0", borderColor: "#bfe3bf", marginTop: "0.9rem" }}>
              <b className="small">Done — {result.total} account(s) flagged.</b>
              <div className="small muted">
                {result.counts.staff} staff · {result.counts.family} families · {result.counts.student} students.
                Each holder re-verifies by email at next sign-in.
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: "1.2rem" }}>
        <div className="spread" style={{ marginBottom: "0.6rem" }}>
          <h3 style={{ margin: 0 }}><Icon name="users" size={18} /> Currently flagged ({flagged.length})</h3>
          <Badge tone={flagged.length ? "gold" : "green"}>{flagged.length ? "awaiting re-verification" : "none"}</Badge>
        </div>
        {flagged.map((f) => (
          <div className="list-item" key={`${f.scope}-${f.id}`}>
            <div className="spread">
              <div>
                <b>{f.label}</b> <span className="chip-pre" style={{ fontSize: "0.7rem" }}>{f.scope}</span>
                <div className="small muted">{f.sub}</div>
              </div>
              <button className="btn ghost sm" onClick={() => clear(f.scope, f.id)}>
                Clear flag (support override)
              </button>
            </div>
          </div>
        ))}
        {flagged.length === 0 && (
          <p className="small muted">No accounts are flagged. Flags clear automatically once the holder resets.</p>
        )}
      </div>
    </div>
  );
}
