"use client";
import { useState } from "react";
import { useApp, Badge, Tabs, Field, Modal, fmtUGX } from "@/components/ui.jsx";
import { currentFamily, studentAssessments } from "@/lib/client.js";
import { fmtDate } from "@/components/ui.jsx";

function KidPanel({ db, kid }) {
  const { act } = useApp();
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("Birth certificate");
  const [file, setFile] = useState("");
  const assessments = studentAssessments(db, kid.id);
  const docs = db.documents.filter((d) => d.studentId === kid.id);

  async function upload() {
    if (!file) return alert("Choose a file first");
    setUploading(true);
    try {
      await act("uploadDocument", { studentId: kid.id, type: docType, name: file.name, size: `${(file.size / 1024).toFixed(0)} KB`, by: "u-parent-1" }, `${file.name} uploaded for ${kid.name} — Admissions will verify it.`);
    } catch (e) {
      alert(e.message);
    } finally {
      setUploading(false);
      setFile("");
    }
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: "1rem" }}>
        <div className="spread">
          <div className="row">
            <div className="avatar-lg" style={{ background: kid.campus === "preschool" ? "var(--gold-50)" : "var(--green-50)", color: kid.campus === "preschool" ? "#8a6410" : "var(--green)" }}>
              {kid.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
            </div>
            <div>
              <h3>{kid.name}</h3>
              <div className="small muted">{kid.class} · {kid.campus === "preschool" ? "Gill Pre-School" : "Gill International School"}</div>
            </div>
          </div>
          <Badge tone={kid.campus === "preschool" ? "gold" : "green"}>{kid.campus === "preschool" ? "🌱 Pre-School" : "🏫 Main School"}</Badge>
        </div>
        {kid.readiness && (
          <div className="row" style={{ marginTop: "0.7rem" }}>
            <span className="badge green">Readiness: {kid.readiness.assessment}</span>
            {kid.readiness.strengths.map((s) => <span className="badge gray" key={s}>{s}</span>)}
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3>📈 Academic tracking — {kid.campus === "preschool" ? "early years observations" : "Cambridge assessments"}</h3>
        {assessments.length === 0 && <p className="muted small">No assessments yet this term.</p>}
        {assessments.map((a) => (
          <div className="list-item" key={a.id}>
            <div className="spread">
              <div>
                <b>{a.subject}</b> · <span className="small muted">{a.title}</span>
                <div className="small muted">{a.type} · {fmtDate(a.date)} · {a.term}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontWeight: 800, fontSize: "1.05rem" }}>{a.score}/{a.max}</span>
                <div><Badge tone={Number(a.score) / Number(a.max) >= 0.75 ? "green" : Number(a.score) / Number(a.max) >= 0.5 ? "gold" : "red"}>{a.grade}</Badge></div>
              </div>
            </div>
            {a.feedback && (
              <div className="quote" style={{ marginTop: "0.55rem", fontSize: "0.88rem" }}>
                💬 <b>{db.studentIndex[a.studentId]?.name === kid.name ? db.users.find((u) => u.id === a.teacher)?.name : ""}:</b>{" "}
                {a.feedback}
              </div>
            )}
          </div>
        ))}
        {kid.campus === "main" && (
          <p className="small muted" style={{ marginTop: "0.5rem" }}>
            📌 Checkpoint practice results appear here as they are marked — no need to wait for report cards on closing day.
          </p>
        )}
      </div>

      <div className="card">
        <div className="spread">
          <h3>🗂️ Documents on file</h3>
          <Badge tone="blue">{docs.filter((d) => d.status === "verified").length} verified</Badge>
        </div>
        {docs.map((d) => (
          <div className="list-item" key={d.id}>
            <div className="spread">
              <div>
                <b>{d.type}</b> <span className="small muted">· {d.name}</span>
                <div className="small muted">{d.size} · uploaded {fmtDate(d.uploadedAt)}</div>
              </div>
              <Badge tone={d.status === "verified" ? "green" : "gold"}>{d.status === "verified" ? "✓ verified" : "pending review"}</Badge>
            </div>
          </div>
        ))}
        <div className="row" style={{ marginTop: "0.8rem", gap: "0.5rem", alignItems: "flex-end" }}>
          <div style={{ width: 190 }}>
            <Field label="Document type">
              <select value={docType} onChange={(e) => setDocType(e.target.value)}>
                {["Birth certificate", "Immunisation card", "Past report", "Medical history", "Passport photo"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="Upload (demo — stored in the platform vault)">
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] || "")} />
            </Field>
          </div>
          <button className="btn" style={{ marginBottom: "0.85rem" }} disabled={uploading} onClick={upload}>
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>
        <p className="small muted" style={{ marginTop: "0.4rem" }}>
          🖨️ No paper needed — Admissions verifies these records online and they automatically carry forward on Pre-School → Main School transition.
        </p>
      </div>
    </div>
  );
}

export default function ChildrenPage() {
  const { db } = useApp();
  const [kidId, setKidId] = useState(null);
  if (!db) return <div className="card">Loading…</div>;

  const family = currentFamily(db, "u-parent-1");
  const kid = db.studentIndex[kidId || family.children[0].id];

  return (
    <div>
      <div className="section-head">
        <h2>Children & Progress</h2>
        <span className="muted small">One dashboard for both campuses</span>
      </div>

      <Tabs
        tabs={family.children.map((c) => ({ id: c.id, label: `${c.name} · ${c.campus === "preschool" ? "Pre-School" : "Yr 5"}` }))}
        active={kid.id}
        onChange={setKidId}
      />

      <KidPanel db={db} kid={kid} />
    </div>
  );
}
