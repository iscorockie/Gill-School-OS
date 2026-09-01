"use client";
import { useApp, Badge } from "@/components/ui.jsx";
import { useStudent } from "@/components/StudentProvider.jsx";
import Icon from "@/components/icons.jsx";

const TYPE_TONE = { "Past paper": "blue", Worksheet: "green", "E-book": "purple", Newsletter: "gold" };

export default function StudentLibrary() {
  const { db } = useApp();
  const { session } = useStudent();
  if (!db) return <div className="card">Loading…</div>;

  const items = db.resources.filter((r) => r.campus !== "preschool" || session.campus === "preschool");

  return (
    <div>
      <div className="section-head">
        <h2><Icon name="bookOpen" size={22} /> Library</h2>
        <Badge tone="blue">{items.length} resources</Badge>
      </div>

      <div className="grid grid-3" style={{ marginBottom: "1.2rem" }}>
        <div className="card stat"><span className="stat-label">Past papers</span><span className="stat-value">{items.filter((r) => r.type === "Past paper").length}</span></div>
        <div className="card stat"><span className="stat-label">Worksheets</span><span className="stat-value">{items.filter((r) => r.type === "Worksheet").length}</span></div>
        <div className="card stat"><span className="stat-label">E-books</span><span className="stat-value">{items.filter((r) => r.type === "E-book").length}</span></div>
      </div>

      <div className="card">
        <table>
          <thead><tr><th>Resource</th><th>Type</th><th>Subject</th><th>Stage</th><th>Downloads</th><th></th></tr></thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id}>
                <td>
                  <b>{r.title}</b>
                  <div className="small muted">{r.size} · added {r.date}</div>
                </td>
                <td><Badge tone={TYPE_TONE[r.type] || "gray"}>{r.type}</Badge></td>
                <td className="small">{r.subject}</td>
                <td className="small">{r.stage}</td>
                <td>{r.downloads}</td>
                <td><a className="btn secondary sm" href="#" onClick={(e) => e.preventDefault()}>Open</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
