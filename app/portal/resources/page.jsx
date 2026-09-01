"use client";
import { useApp, Badge } from "@/components/ui.jsx";

const TYPE_TONE = { "Past paper": "blue", Worksheet: "green", "E-book": "purple", Newsletter: "gold" };

export default function ResourcesPage() {
  const { db } = useApp();
  if (!db) return <div className="card">Loading…</div>;

  return (
    <div>
      <div className="section-head">
        <h2>Resources & E-Library</h2>
        <span className="muted small">Cambridge past papers, worksheets, e-books & The Gill Insider — all paperless</span>
      </div>

      <div className="grid grid-3" style={{ marginBottom: "1.2rem" }}>
        <div className="card stat"><span className="stat-label">Items in library</span><span className="stat-value">{db.resources.length}</span><span className="small muted">across both campuses</span></div>
        <div className="card stat"><span className="stat-label">Downloads</span><span className="stat-value">{db.resources.reduce((s, r) => s + r.downloads, 0).toLocaleString()}</span><span className="small muted">≈ 0 pages photocopied</span></div>
        <div className="card stat"><span className="stat-label">Newsletter</span><span className="stat-value">The Gill Insider</span><span className="small muted">archived digitally since Q1 2026</span></div>
      </div>

      <div className="card">
        <table>
          <thead><tr><th>Resource</th><th>Type</th><th>Subject</th><th>Stage</th><th>Campus</th><th>Downloads</th><th></th></tr></thead>
          <tbody>
            {db.resources.map((r) => (
              <tr key={r.id}>
                <td>
                  <b>{r.title}</b>
                  <div className="small muted">{r.size} · added {r.date}</div>
                </td>
                <td><Badge tone={TYPE_TONE[r.type] || "gray"}>{r.type}</Badge></td>
                <td className="small">{r.subject}</td>
                <td className="small">{r.stage}</td>
                <td className="small">{r.campus === "preschool" ? " Pre-School" : r.campus === "all" ? "All" : " Main"}</td>
                <td>{r.downloads}</td>
                <td><a className="btn secondary sm" href="#" onClick={(e) => e.preventDefault()}>Open ↗</a></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="small muted" style={{ marginTop: "0.7rem" }}> In production, links open the actual PDFs from the school's storage. Teachers upload new materials at the admin console.
        </p>
      </div>
    </div>
  );
}
