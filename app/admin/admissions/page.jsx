"use client";
import { useState } from "react";
import { useApp, Badge, Modal, Field, fmtDate } from "@/components/ui.jsx";

export default function AdmissionsPage() {
  const { db, act } = useApp();
  const [tab, setTab] = useState("transitions");
  const [trId, setTrId] = useState(null);
  const [class_, setClass] = useState("Primary 1 (Cambridge)");
  const [notes, setNotes] = useState("Teacher recommends progression. Parents confirmed intake.");
  const [busy, setBusy] = useState(false);

  if (!db) return <div className="card">Loading…</div>;
  const transition = db.transitions.find((t) => t.id === trId);
  const docs = db.documents;
  const presKids = [];
  for (const fam of db.families) for (const c of fam.children) if (c.campus === "preschool") presKids.push({ ...c, family: fam });

  async function doEnroll() {
    setBusy(true);
    try {
      await act("enrollTransition", { transitionId: trId, targetClass: class_ }, "Enrolled! Records migrated and invoice created — parent, bursar and admissions notified automatically.");
      setTrId(null);
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="section-head">
        <h2>Admissions & Pre-School Transition</h2>
        <Badge tone="blue">Mrs. Mary Kyomukama · Admissions</Badge>
      </div>

      <div className="tabs">
        <button className={tab === "transitions" ? "on" : ""} onClick={() => setTab("transitions")}>🎓 Transitions</button>
        <button className={tab === "docs" ? "on" : ""} onClick={() => setTab("docs")}>🗂️ Document vault</button>
        <button className={tab === "applicants" ? "on" : ""} onClick={() => setTab("applicants")}>🌱 New applicants</button>
      </div>

      {tab === "transitions" && (
        <div className="grid grid-2">
          {db.transitions.map((t) => {
            const kid = db.studentIndex[t.studentId];
            const fam = db.families.find((f) => f.id === kid?.familyId);
            const done = t.checklist.filter((c) => c.done).length;
            return (
              <div className="card" key={t.id}>
                <div className="spread">
                  <div className="row">
                    <div className="avatar-lg" style={{ background: "var(--green-50)", color: "var(--green)" }}>{kid?.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</div>
                    <div>
                      <h3>{kid?.name}</h3>
                      <div className="small muted">{kid?.class} → <b style={{ color: "var(--green)" }}>{t.targetClass}</b> · {fam?.name} family</div>
                    </div>
                  </div>
                  <Badge tone={t.status === "enrolled" ? "green" : "gold"}>{t.status}</Badge>
                </div>
                <div className="small muted" style={{ margin: "0.6rem 0 0.3rem" }}>Records ready: {done}/{t.checklist.length}</div>
                <div className="row" style={{ marginBottom: "0.7rem" }}>
                  {t.checklist.map((c) => (
                    <span className="badge gray" key={c.key}>{c.done ? "✓" : "…"} {c.label}</span>
                  ))}
                </div>
                <div className="row">
                  <button className="btn secondary sm" onClick={() => { setTrId(t.id); setNotes(t.notes || ""); }}>One-click migrate →</button>
                  <button className="btn ghost sm" onClick={() => act("initiateTransition", { studentId: t.studentId, by: "u-admissions", notes: "Manual re-initiation." }, "Transition record re-created.")}>Re-initiate</button>
                </div>
              </div>
            );
          })}

          <div className="card" style={{ borderStyle: "dashed" }}>
            <h3>＋ Start a new transition</h3>
            <p className="small muted">Pick a Pre-School pupil who is ready for Primary 1. Their records are already on file — this takes one click.</p>
            {presKids.filter((k) => !db.transitions.some((t) => t.studentId === k.id)).map((k) => (
              <div className="list-item row" key={k.id} style={{ justifyContent: "space-between" }}>
                <span>{k.name} · {k.class} <span className="badge gray">{k.readiness?.assessment || "on track"}</span></span>
                <button className="btn secondary sm" onClick={() => act("initiateTransition", { studentId: k.id, by: "u-admissions", notes }, `Transition initiated for ${k.name}.`)}>Initiate</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "docs" && (
        <div className="card">
          <table>
            <thead><tr><th>Student</th><th>Type</th><th>File</th><th>Uploaded</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {docs.map((d) => {
                const kid = db.studentIndex[d.studentId];
                return (
                  <tr key={d.id}>
                    <td><b>{kid?.name}</b><div className="small muted">{kid?.campus === "preschool" ? "🌱 Pre-School" : "🏫 Main"}</div></td>
                    <td>{d.type}</td>
                    <td className="mono small">{d.name}</td>
                    <td className="small">{fmtDate(d.uploadedAt)}</td>
                    <td><Badge tone={d.status === "verified" ? "green" : "gold"}>{d.status}</Badge></td>
                    <td>
                      {d.status !== "verified" ? (
                        <button className="btn sm" onClick={() => act("verifyDocument", { docId: d.id, status: "verified" }, "Record verified — no paper copy needed.")}>✓ Verify</button>
                      ) : (
                        <span className="small muted">on file</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="small muted" style={{ marginTop: "0.6rem" }}>
            🖨️ Previously these lived in folders and a filing cabinet. Verified records migrate with the pupil at transition — parents never re-submit.
          </p>
        </div>
      )}

      {tab === "applicants" && (
        <div className="card">
          <h3>🌱 Pre-School & Main School pipeline</h3>
          {presKids.map((k) => (
            <div className="list-item spread" key={k.id}>
              <div>
                <b>{k.name}</b> · <span className="small muted">{k.class} · {k.family.name} family</span>
                <div className="small muted">Documents: {db.documents.filter((d) => d.studentId === k.id).length} on file</div>
              </div>
              <Badge tone="green">enrolled</Badge>
            </div>
          ))}
          <p className="small muted" style={{ marginTop: "0.6rem" }}>
            New applications arrive here with automatic profile creation — parents fill the form once and the platform builds the records.
          </p>
        </div>
      )}

      {transition && (
        <Modal title={`Migrate ${db.studentIndex[transition.studentId]?.name} → Main School`} onClose={() => setTrId(null)}>
          <div className="quote" style={{ marginBottom: "0.9rem" }}>
            <b>What migrates automatically:</b> progress records, immunisation records, medical history, parent contacts, and birth certificate.
            <div className="small muted">No re-typing for Admissions, no re-filling forms for parents.</div>
          </div>
          <Field label="Target class">
            <input value={class_} onChange={(e) => setClass(e.target.value)} />
          </Field>
          <Field label="Notes (optional)">
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <div className="quote" style={{ background: "var(--green-50)", borderColor: "var(--green)" }}>
            <b>On enrolment the system will:</b>
            <div className="small">① move the pupil to the Main School campus · ② create a first-term invoice (tuition + records fee) ·
            ③ notify the Bursar and Admissions · ④ log everything in the audit trail.</div>
          </div>
          <button className="btn" style={{ width: "100%", marginTop: "0.9rem" }} disabled={busy} onClick={doEnroll}>
            {busy ? "Migrating…" : "✅ Enrol & migrate records"}
          </button>
        </Modal>
      )}
    </div>
  );
}
