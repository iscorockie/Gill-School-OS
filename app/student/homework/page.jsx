"use client";
import { useApp, Badge, fmtDate } from "@/components/ui.jsx";
import { useStudent } from "@/components/StudentProvider.jsx";
import Icon from "@/components/icons.jsx";

export default function StudentHomework() {
  const { db } = useApp();
  const { session } = useStudent();
  if (!db) return <div className="card">Loading…</div>;

  const list = db.homework.filter((h) => h.studentId === session.studentId);
  const teacher = (id) => db.users.find((u) => u.id === id)?.name?.replace(/^(Mr\.|Mrs\.|Ms\.)\s*/, "") || "";
  const pending = list.filter((h) => h.status === "pending").length;

  return (
    <div>
      <div className="section-head">
        <h2><Icon name="clipboard" size={22} /> Homework</h2>
        <Badge tone={pending ? "gold" : "green"}>{pending ? `${pending} to do` : "All done"}</Badge>
      </div>

      <div className="card">
        {list.map((h) => (
          <div className="list-item" key={h.id}>
            <div className="spread">
              <div>
                <b>{h.subject} — {h.title}</b>
                <div className="small muted"> Set {fmtDate(h.assigned)} · due <b>{fmtDate(h.due)}</b> · {teacher(h.teacher)}
                </div>
                {h.note && <p className="small" style={{ margin: "0.35rem 0 0" }}>{h.note}</p>}
                {h.grade && <div style={{ marginTop: "0.35rem" }}><Badge tone="green">Grade {h.grade}</Badge></div>}
              </div>
              <Badge tone={h.status === "graded" ? "green" : h.status === "submitted" ? "blue" : "gold"}>{h.status}</Badge>
            </div>
          </div>
        ))}
        <p className="small muted" style={{ marginTop: "0.6rem" }}> Submit written work to your teacher; digital worksheets can be completed in the Resource Hub.
        </p>
      </div>

      <div className="card" style={{ marginTop: "1rem", background: "var(--peri-l)", borderColor: "var(--peri-2)" }}>
        <div className="row" style={{ gap: "0.6rem" }}>
          <Icon name="info" size={20} style={{ color: "var(--maroon)" }} />
          <span className="small"> Need help? Message your class teacher from the noticeboard, or ask at the library desk.
          </span>
        </div>
      </div>
    </div>
  );
}
