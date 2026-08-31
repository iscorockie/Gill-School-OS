"use client";
import { useApp, Badge, fmtDate } from "@/components/ui.jsx";
import { useStudent } from "@/components/StudentProvider.jsx";
import Icon from "@/components/icons.jsx";

export default function StudentCalendar() {
  const { db } = useApp();
  const { session } = useStudent();
  if (!db) return <div className="card">Loading…</div>;

  const events = db.events.filter((e) => e.audience === "all" || (session.campus === "preschool" && e.audience === "preschool"));

  return (
    <div>
      <div className="section-head">
        <h2><Icon name="calendar" size={22} /> School Calendar</h2>
        <Badge tone="blue">{events.length} upcoming events</Badge>
      </div>

      <div className="grid grid-2">
        {events.map((e) => (
          <div className={`card ${e.audience === "preschool" ? "gips" : ""}`} key={e.id}>
            <div className="spread">
              <div className="row">
                <div style={{
                  textAlign: "center", borderRadius: 12, padding: "0.35rem 0.7rem",
                  background: e.audience === "preschool" ? "var(--cream)" : "var(--peri-l)",
                  border: e.audience === "preschool" ? "1px solid var(--sun2)" : "1px solid var(--peri-2)",
                }}>
                  <div style={{ fontWeight: 800, fontSize: "1.2rem", color: e.audience === "preschool" ? "var(--gips-deep)" : "var(--maroon)", fontFamily: "var(--fd)" }}>
                    {new Date(e.date + "T00:00:00").getDate()}
                  </div>
                  <div className="small muted" style={{ textTransform: "uppercase", fontSize: "0.65rem" }}>
                    {new Date(e.date + "T00:00:00").toLocaleString("en", { month: "short" })}
                  </div>
                </div>
                <div>
                  <b>{e.title}</b>
                  <div className="small muted">{e.time} · {e.location}</div>
                </div>
              </div>
              <Badge tone={e.category === "Sports" ? "gold" : e.category === "Community" ? "blue" : "gray"}>{e.category}</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
