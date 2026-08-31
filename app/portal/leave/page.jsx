"use client";
import { useState } from "react";
import { useApp, Badge, Field, fmtDate } from "@/components/ui.jsx";
import { currentFamily, familyLeaves } from "@/lib/client.js";

export default function LeavePage() {
  const { db, act } = useApp();
  const [studentId, setStudentId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  if (!db) return <div className="card">Loading…</div>;
  const family = currentFamily(db, "u-parent-1");
  const leaves = familyLeaves(db, family);
  const selected = studentId || family.children[0]?.id;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await act("requestLeave", { studentId: selected, from, to, reason }, "Leave request submitted — class teachers and the front office were notified automatically.");
      setFrom(""); setTo(""); setReason("");
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="section-head">
        <h2>Absence Requests</h2>
        <span className="muted small">No more phone-calls to the front office — teachers are notified instantly</span>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3> Submit a sickness / absence note</h3>
          <form onSubmit={submit}>
            <Field label="Child">
              <select value={selected} onChange={(e) => setStudentId(e.target.value)}>
                {family.children.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.class}</option>)}
              </select>
            </Field>
            <div className="grid grid-2">
              <Field label="From"><input type="date" required value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
              <Field label="To"><input type="date" required value={to} onChange={(e) => setTo(e.target.value)} /></Field>
            </div>
            <Field label="Reason (optional)"><textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Fever — seeing doctor on Tuesday." /></Field>
            <button className="btn" disabled={busy}>{busy ? "Submitting…" : "Submit request"}</button>
            <p className="small muted" style={{ marginTop: "0.6rem" }}> On submit, the class teacher and front office receive an in-app notification; SMS goes to the class teacher's phone.
            </p>
          </form>
        </div>

        <div className="card">
          <h3> Requests & status</h3>
          {leaves.length === 0 && <p className="muted small">No requests yet.</p>}
          {leaves.map((l) => {
            const kid = db.studentIndex[l.studentId];
            return (
              <div className="list-item" key={l.id}>
                <div className="spread">
                  <div>
                    <b>{kid?.name}</b> · <span className="small">{fmtDate(l.from)} → {fmtDate(l.to)}</span>
                    <div className="small muted">{l.reason || "No reason given"}</div>
                    <div className="small muted">Notified: {l.teacherNotified?.map((t) => db.users.find((u) => u.id === t)?.name?.split(" ").slice(-1)[0]).join(", ") || "—"}</div>
                  </div>
                  <Badge tone={l.status === "approved" ? "green" : l.status === "declined" ? "red" : "gold"}>
                    {l.status === "pending" ? "⏳ pending" : l.status}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card" style={{ marginTop: "1.2rem", background: "var(--peri-l)", borderColor: "var(--peri-2)" }}>
        <b> Planning ahead?</b>
        <p className="small"> Long absences (3+ days) also sync to the class attendance register automatically once approved. For emergency same-day absences,
          the front office still keeps a phone line — but the platform is the fastest route.
        </p>
      </div>
    </div>
  );
}
