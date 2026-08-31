"use client";
import { useState } from "react";
import { useApp, Badge, Field, Modal, fmtDate } from "@/components/ui.jsx";

const TYPE_TONE = { "Past paper": "blue", Worksheet: "green", "E-book": "purple", Newsletter: "gold" };

export default function AdminResourcesPage() {
  const { db, act } = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: "Worksheet", title: "", subject: "Mathematics", stage: "Stage 5", campus: "main" });
  if (!db) return <div className="card">Loading…</div>;

  async function add(e) {
    e.preventDefault();
    try {
      await act("addResource", { ...form, by: "u-admin" }, "Resource published to the parent library — no photocopies needed.");
      setOpen(false);
      setForm({ type: "Worksheet", title: "", subject: "Mathematics", stage: "Stage 5", campus: "main" });
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      <div className="section-head">
        <h2>Resource & E-Library Hub</h2>
        <button className="btn sm" onClick={() => setOpen(true)}>＋ Publish resource</button>
      </div>

      <div className="grid grid-3" style={{ marginBottom: "1.2rem" }}>
        <div className="card stat"><span className="stat-label">Items</span><span className="stat-value">{db.resources.length}</span></div>
        <div className="card stat"><span className="stat-label">Total downloads</span><span className="stat-value">{db.resources.reduce((s, r) => s + r.downloads, 0).toLocaleString()}</span><span className="small muted">≈ pages never photocopied</span></div>
        <div className="card stat"><span className="stat-label">Print budget avoided</span><span className="stat-value">UGX 4.8M/yr</span><span className="small muted">est. from worksheets & past papers</span></div>
      </div>

      <div className="card">
        <table>
          <thead><tr><th>Resource</th><th>Type</th><th>Subject / Stage</th><th>Campus</th><th>Downloads</th><th>Added</th></tr></thead>
          <tbody>
            {db.resources.map((r) => (
              <tr key={r.id}>
                <td><b>{r.title}</b><div className="small muted">{r.size} · {r.file}</div></td>
                <td><Badge tone={TYPE_TONE[r.type] || "gray"}>{r.type}</Badge></td>
                <td className="small">{r.subject} · {r.stage}</td>
                <td className="small">{r.campus === "preschool" ? "🌱 Pre-School" : r.campus === "all" ? "All" : "🏫 Main"}</td>
                <td>{r.downloads}</td>
                <td className="small">{fmtDate(r.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="small muted" style={{ marginTop: "0.6rem" }}>
          Uploads are scanned for virus/malware and stored in object storage (S3-compatible) in production; this demo keeps metadata only.
        </p>
      </div>

      {open && (
        <Modal title="Publish resource" onClose={() => setOpen(false)}>
          <form onSubmit={add}>
            <Field label="Type">
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {["Worksheet", "Past paper", "E-book", "Newsletter", "Video", "Other"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Title"><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
            <div className="grid grid-2">
              <Field label="Subject"><input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></Field>
              <Field label="Stage"><input value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} /></Field>
            </div>
            <Field label="Campus">
              <select value={form.campus} onChange={(e) => setForm({ ...form, campus: e.target.value })}>
                <option value="main">Main School</option><option value="preschool">Pre-School</option><option value="all">Both</option>
              </select>
            </Field>
            <button className="btn" style={{ width: "100%" }}>Publish</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
