"use client";
import { useApp, Badge, fmtDate } from "@/components/ui.jsx";

const ICS_URL =
  typeof window !== "undefined"
    ? `${window.location.origin}/api/ics?campus=all`
    : "/api/ics?campus=all";

export default function CalendarPage() {
  const { db } = useApp();
  if (!db) return <div className="card">Loading…</div>;

  return (
    <div>
      <div className="section-head">
        <h2>School Calendar</h2>
        <span className="muted small">Sync to Google or Apple — reminders included</span>
      </div>

      <div className="card" style={{ marginBottom: "1.2rem", background: "var(--peri-l)", borderColor: "var(--peri-2)" }}>
        <div className="spread">
          <div>
            <b> One-tap calendar sync</b>
            <p className="small muted" style={{ margin: "0.25rem 0 0" }}> Sports Days, Coffee Mornings, Science Fairs and term dates — subscribe once and they stay in your personal calendar forever.
            </p>
          </div>
          <div className="row">
            <a className="btn sm" href={`https://calendar.google.com/calendar/render?cid=${encodeURIComponent(ICS_URL)}`} target="_blank" rel="noreferrer">Google Calendar →</a>
            <a className="btn secondary sm" href={`webcal://${ICS_URL.replace(/^https?:\/\//, "")}`}>Apple / iCal</a>
            <a className="btn secondary sm" href="/api/ics?campus=all" download="gill-school-events.ics">Download .ics</a>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        {db.events.map((e) => {
          const pre = e.audience === "preschool";
          return (
            <div className={`card ${pre ? "gips" : ""}`} key={e.id}>
              <div className="spread">
                <div className="row">
                  <div style={{
                    textAlign: "center", borderRadius: 12, padding: "0.35rem 0.7rem",
                    background: pre ? "var(--cream)" : "var(--peri-l)",
                    border: pre ? "1px solid var(--sun2)" : "1px solid var(--peri-2)",
                  }}>
                    <div style={{ fontWeight: 800, fontSize: "1.2rem", color: pre ? "var(--gips-deep)" : "var(--maroon)", fontFamily: "var(--fd)" }}>{new Date(e.date + "T00:00:00").getDate()}</div>
                    <div className="small muted" style={{ textTransform: "uppercase", fontSize: "0.65rem" }}>{new Date(e.date + "T00:00:00").toLocaleString("en", { month: "short" })}</div>
                  </div>
                  <div>
                    <b style={pre ? { fontFamily: "var(--fpd)" } : undefined}>{e.title}</b>
                    <div className="small muted">{e.time} · {e.location}</div>
                  </div>
                </div>
                {pre ? (
                  <span className="chip-pre">GIPS</span>
                ) : (
                  <Badge tone={e.category === "Sports" ? "gold" : e.category === "Community" ? "blue" : e.category === "Ceremony" ? "purple" : "gray"}>{e.category}</Badge>
                )}
              </div>
              <div className="small muted" style={{ marginTop: "0.5rem" }}> Audience: {e.audience === "preschool" ? "Pre-School families" : e.audience === "all" ? "Whole school" : "Parents"}
                {e.audience === "all" && !e.title.includes("Pre-School") ? " · Primary & Secondary" : ""}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
