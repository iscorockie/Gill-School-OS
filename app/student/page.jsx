"use client";
import Link from "next/link";
import { useApp, Badge, fmtDate } from "@/components/ui.jsx";
import { useStudent } from "@/components/StudentProvider.jsx";
import Icon from "@/components/icons.jsx";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function StudentHome() {
  const { db } = useApp();
  const { session } = useStudent();
  if (!db) return <div className="card">Loading…</div>;

  const sid = session.studentId;
  const today = new Date().getDay();
  const todayName = DAYS[today];
  const lessons = db.timetable.filter((t) => t.studentId === sid && t.day === todayName).sort((a, b) => a.period.localeCompare(b.period));
  const hw = db.homework.filter((h) => h.studentId === sid && h.status !== "graded");
  const upcoming = db.events.filter((e) => e.audience === "all").slice(0, 4);
  const msgs = db.studentMessages.filter((m) => m.studentId === sid);
  const teacher = (id) => db.users.find((u) => u.id === id)?.name?.replace(/^(Mr\.|Mrs\.|Ms\.)\s*/, "") || "";

  return (
    <div>
      <div className="card surface-deep" style={{ marginBottom: "1.2rem" }}>
        <div className="spread">
          <div className="row" style={{ gap: "1rem" }}>
            <div className="big-avatar">{session.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</div>
            <div>
              <span style={{ color: "var(--sun2)", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                {todayName} · {db.meta.currentTerm}
              </span>
              <h2 style={{ color: "#fff", margin: "0.15rem 0 0.2rem" }}>Hi, {session.name.split(" ")[0]}!</h2>
              <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.92rem", margin: 0 }}>
                {session.class} · {lessonCount(lessons.length)} lessons today · {msgs.filter((m) => !m.read).length} new messages
              </p>
            </div>
          </div>
          <div className="row">
            <Link className="btn gold" href="/student/progress">My Progress</Link>
            <Link className="btn-hero-ghost" style={{ padding: "0.7rem 1.4rem", fontSize: "0.88rem" }} href="/student/homework">Homework</Link>
          </div>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: "1.2rem" }}>
        <div className="card stat">
          <span className="stat-label">Lessons today</span>
          <span className="stat-value">{lessonCount(lessons.length)}</span>
          <span className="small muted">{lessons[0] ? `${lessons[0].period} · ${lessons[0].subject}` : "No classes today"}</span>
        </div>
        <div className="card stat">
          <span className="stat-label">Homework open</span>
          <span className="stat-value">{hw.length}</span>
          <span className="small muted">{hw[0] ? `Next due ${hw[0].due}` : "All caught up"}</span>
        </div>
        <div className="card stat">
          <span className="stat-label">Class average</span>
          <span className="stat-value" style={{ color: "var(--maroon)" }}>
            {avg(db, sid)}
          </span>
          <span className="small muted">assessments & Checkpoint practice</span>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="section-head" style={{ margin: "0 0 0.5rem" }}>
            <h2 style={{ fontSize: "1.1rem" }}><Icon name="calendar" size={20} /> Today's classes</h2>
          </div>
          {lessons.length === 0 && <p className="muted small">No classes on the timetable for today.</p>}
          {lessons.map((l) => (
            <div className="list-item" key={l.id}>
              <div className="spread">
                <div className="row" style={{ gap: "0.7rem" }}>
                  <span className="badge blue">{l.period}</span>
                  <div>
                    <b>{l.subject}</b>
                    <div className="small muted">{l.room} · {teacher(l.teacher)}</div>
                  </div>
                </div>
                <Icon name="chevronRight" size={16} style={{ color: "var(--muted)" }} />
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="section-head" style={{ margin: "0 0 0.5rem" }}>
            <h2 style={{ fontSize: "1.1rem" }}><Icon name="clipboard" size={20} /> Homework to finish</h2>
          </div>
          {hw.length === 0 && <p className="muted small">Nothing outstanding.</p>}
          {hw.slice(0, 4).map((h) => (
            <div className="list-item" key={h.id}>
              <div className="spread">
                <div>
                  <b>{h.subject} — {h.title}</b>
                  <div className="small muted">Due {fmtDate(h.due)} · {h.note}</div>
                </div>
                <Badge tone={h.status === "submitted" ? "green" : "gold"}>{h.status}</Badge>
              </div>
            </div>
          ))}
          <Link href="/student/homework" className="btn secondary sm">All homework</Link>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: "1.2rem" }}>
        <div className="card">
          <div className="section-head" style={{ margin: "0 0 0.5rem" }}>
            <h2 style={{ fontSize: "1.1rem" }}><Icon name="chat" size={20} /> Messages from teachers</h2>
          </div>
          {msgs.length === 0 && <p className="muted small">No messages yet.</p>}
          {msgs.map((m) => (
            <div className="list-item" key={m.id}>
              <b>{m.subject}</b>
              <p className="small muted" style={{ margin: "0.15rem 0 0.1rem" }}>{m.body}</p>
              <div className="small muted">{teacher(m.from)} · {fmtDate(m.date)} {m.read ? "" : <Badge tone="gold">new</Badge>}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="section-head" style={{ margin: "0 0 0.5rem" }}>
            <h2 style={{ fontSize: "1.1rem" }}><Icon name="star" size={20} /> Coming up</h2>
          </div>
          {upcoming.map((e) => (
            <div className="list-item spread" key={e.id}>
              <div>
                <b>{e.title}</b>
                <div className="small muted">{fmtDate(e.date)} · {e.time} · {e.location}</div>
              </div>
              <Badge tone="blue">{e.category}</Badge>
            </div>
          ))}
          <Link href="/student/calendar" className="btn secondary sm">Full calendar</Link>
        </div>
      </div>
    </div>
  );
}

function lessonCount(n) {
  return n || 0;
}

function avg(db, sid) {
  const list = db.assessments.filter((a) => a.studentId === sid);
  if (!list.length) return "—";
  const pct = list.reduce((s, a) => s + (a.score / a.max) * 100, 0) / list.length;
  return pct.toFixed(0) + "%";
}
