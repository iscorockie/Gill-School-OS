"use client";
import { useApp, Badge, fmtDate } from "@/components/ui.jsx";
import { useStudent } from "@/components/StudentProvider.jsx";
import Icon from "@/components/icons.jsx";

export default function StudentProgress() {
  const { db } = useApp();
  const { session } = useStudent();
  if (!db) return <div className="card">Loading…</div>;

  const list = db.assessments.filter((a) => a.studentId === session.studentId);
  const teacher = (id) => db.users.find((u) => u.id === id)?.name || "";

  return (
    <div>
      <div className="section-head">
        <h2><Icon name="chart" size={22} /> My Progress</h2>
        <Badge tone="blue">{list.length} assessments this year</Badge>
      </div>

      <div className="grid grid-4" style={{ marginBottom: "1.2rem" }}>
        <div className="card stat"><span className="stat-label">Overall</span><span className="stat-value" style={{ color: "var(--maroon)" }}>{avg(list)}%</span><span className="small muted">across all subjects</span></div>
        <div className="card stat"><span className="stat-label">Best subject</span><span className="stat-value" style={{ fontSize: "1.2rem" }}>{best(list)}</span></div>
        <div className="card stat"><span className="stat-label">Checkpoint practice</span><span className="stat-value">{cp(list)}</span><span className="small muted">Cambridge Primary</span></div>
        <div className="card stat"><span className="stat-label">Next target</span><span className="stat-value" style={{ fontSize: "1.2rem" }}>{target(list)}</span></div>
      </div>

      <div className="card">
        {list.map((a) => {
          const pct = Math.round((a.score / a.max) * 100);
          return (
            <div className="list-item" key={a.id}>
              <div className="spread">
                <div>
                  <b>{a.subject}</b> · <span className="small muted">{a.title}</span>
                  <div className="small muted">{a.type} · {fmtDate(a.date)} · {a.term}</div>
                  {a.feedback && (
                    <div className="quote" style={{ marginTop: "0.5rem", fontSize: "0.86rem" }}>
                      <b>{teacher(a.teacher)}:</b> {a.feedback}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right", minWidth: 90 }}>
                  <span style={{ fontWeight: 800, fontSize: "1.1rem", fontFamily: "var(--fd)" }}>{a.score}/{a.max}</span>
                  <div><Badge tone={pct >= 75 ? "green" : pct >= 50 ? "gold" : "red"}>{a.grade}</Badge></div>
                </div>
              </div>
            </div>
          );
        })}
        {list.length === 0 && <p className="muted small">Your teachers haven't published assessments yet — check back soon.</p>}
      </div>

      <div className="card" style={{ marginTop: "1rem", background: "var(--peri-l)", borderColor: "var(--peri-2)" }}>
        <div className="row" style={{ gap: "0.6rem" }}>
          <Icon name="award" size={20} style={{ color: "var(--maroon)" }} />
          <span>
            <b>Keep going!</b> Your latest Checkpoint practice shows steady improvement in Science and Mathematics.
            Parent feedback and progress notes are visible on your family's dashboard too.
          </span>
        </div>
      </div>
    </div>
  );
}

function avg(list) {
  if (!list.length) return 0;
  return Math.round(list.reduce((s, a) => s + (a.score / a.max) * 100, 0) / list.length);
}

function best(list) {
  if (!list.length) return "—";
  const bySub = {};
  for (const a of list) {
    bySub[a.subject] = (bySub[a.subject] || []).concat(a.score / a.max);
  }
  const best = Object.entries(bySub).sort((x, y) => avgOf(y[1]) - avgOf(x[1]))[0];
  return best ? best[0] : "—";
}

function avgOf(arr) {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function cp(list) {
  const c = list.find((a) => a.type === "Checkpoint (mock)" || a.type === "Checkpoint practice");
  return c ? `${c.score}/${c.max}` : "—";
}

function target(list) {
  if (!list.length) return "—";
  const weakest = [...list].sort((a, b) => a.score / a.max - b.score / b.max)[0];
  return weakest.subject;
}
