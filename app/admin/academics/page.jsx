"use client";
import { useState } from "react";
import { useApp, Badge, Field, Tabs, fmtDate } from "@/components/ui.jsx";

export default function AcademicsPage() {
  const { db, act } = useApp();
  const [tab, setTab] = useState("record");
  if (!db) return <div className="card">Loading…</div>;

  const [studentId, setStudentId] = useState("");
  const [subject, setSubject] = useState("Mathematics");
  const [type, setType] = useState("Continuous assessment");
  const [title, setTitle] = useState("");
  const [score, setScore] = useState("");
  const [max, setMax] = useState("100");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  const student = db.studentIndex[studentId || Object.values(db.studentIndex)[0]?.id];
  const teacher = db.users.find((u) => u.role === "teacher");
  const myAssessments = db.assessments.filter((a) => a.studentId === student?.id);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await act("addAssessment", { studentId: student.id, subject, type, title, score, max, feedback, teacher: teacher.id }, `Assessment saved for ${student.name} — visible to the parent instantly.`);
      setTitle(""); setScore(""); setFeedback("");
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="section-head">
        <h2>Academics — Assessments & Feedback</h2>
        <Badge tone="blue">Ms. Aisha Hassan · Mr. Brian Mugisha</Badge>
      </div>

      <Tabs tabs={[{ id: "record", label: " Record assessment" }, { id: "history", label: " Assessment history" }]}
        active={tab}
        onChange={setTab}
      />

      {tab === "record" && (
        <div className="grid grid-2">
          <div className="card">
            <form onSubmit={save}>
              <Field label="Student">
                <select value={student?.id} onChange={(e) => setStudentId(e.target.value)}>
                  {Object.values(db.studentIndex).map((s) => (
                    <option key={s.id} value={s.id}>{s.name} — {s.class}</option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-2">
                <Field label="Subject">
                  <select value={subject} onChange={(e) => setSubject(e.target.value)}>
                    {["English", "Mathematics", "Science", "Global Perspectives", "Emergent Literacy", "Personal & Social"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Type">
                  <select value={type} onChange={(e) => setType(e.target.value)}>
                    {["Continuous assessment", "Checkpoint practice", "Quiz", "Observation", "Homework"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Title"><input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Fractions quiz — unit 4" /></Field>
              <div className="grid grid-2">
                <Field label="Score"><input type="number" required min="0" value={score} onChange={(e) => setScore(e.target.value)} /></Field>
                <Field label="Out of"><input type="number" required min="1" value={max} onChange={(e) => setMax(e.target.value)} /></Field>
              </div>
              <Field label="Feedback to parent"><textarea rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="One encouraging, specific sentence." /></Field>
              <button className="btn" disabled={busy}>{busy ? "Saving…" : "Save & publish to parent"}</button>
              <p className="small muted" style={{ marginTop: "0.6rem" }}> Saved assessments appear on the parent's dashboard immediately — continuous tracking, not just closing-day report cards.
              </p>
            </form>
          </div>
          <div className="card">
            <h3> {student?.name} — recent</h3>
            {myAssessments.slice(0, 6).map((a) => (
              <div className="list-item" key={a.id}>
                <div className="spread">
                  <div><b>{a.subject}</b> · <span className="small muted">{a.title}</span><div className="small muted">{a.type} · {fmtDate(a.date)}</div></div>
                  <div style={{ textAlign: "right" }}>
                    <b>{a.score}/{a.max}</b>
                    <div><Badge tone={Number(a.score) / Number(a.max) >= 0.75 ? "green" : "gold"}>{a.grade}</Badge></div>
                  </div>
                </div>
                {a.feedback && <div className="small muted"> {a.feedback}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="card">
          <table>
            <thead><tr><th>Student</th><th>Subject</th><th>Assessment</th><th>Score</th><th>Grade</th><th>Date</th></tr></thead>
            <tbody>
              {db.assessments.map((a) => {
                const s = db.studentIndex[a.studentId];
                return (
                  <tr key={a.id}>
                    <td><b>{s?.name}</b><div className="small muted">{s?.class}</div></td>
                    <td>{a.subject}</td>
                    <td className="small">{a.title}<div className="small muted">{a.type}</div></td>
                    <td>{a.score}/{a.max}</td>
                    <td><Badge tone={Number(a.score) / Number(a.max) >= 0.75 ? "green" : "gold"}>{a.grade}</Badge></td>
                    <td className="small">{fmtDate(a.date)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
