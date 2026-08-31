"use client";
import { useEffect, useMemo, useState } from "react";
import { useApp, Badge, Field, fmtDate, fmtUGX } from "@/components/ui.jsx";
import Icon from "@/components/icons.jsx";
import { useStaff } from "@/components/StaffSession.jsx";

export default function StaffHome() {
  const { db, act } = useApp();
  const { staff } = useStaff();
  const [tab, setTab] = useState("day");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!db) return;
    for (const c of db.chats) {
      if (c.members.some((m) => m.userId === staff.id) && c.messages.some((m) => !m.readBy.includes(staff.id))) {
        act("markChatRead", { chatId: c.id, from: staff.id });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]);

  const pupils = useMemo(() => {
    if (!db) return [];
    const mine = staff.id === "t-sharon"
      ? Object.values(db.studentIndex).filter((s) => s.campus === "preschool")
      : ["t-aisha", "t-brian"].includes(staff.id)
        ? Object.values(db.studentIndex).filter((s) => s.campus === "main")
        : [];
    return mine.map((s) => {
      const ass = db.assessments.filter((a) => a.studentId === s.id);
      const avg = ass.length ? Math.round(ass.reduce((x, a) => x + (a.score / a.max) * 100, 0) / ass.length) : null;
      return { ...s, assessments: ass.length, avg, last: ass[0] };
    });
  }, [db, staff]);

  const classes = useMemo(() => {
    const g = {};
    for (const p of pupils) g[p.class] = (g[p.class] || []).concat(p);
    return Object.entries(g);
  }, [pupils]);

  const myChats = useMemo(() => (db ? db.chats.filter((c) => c.members.some((m) => m.userId === staff.id)) : []), [db, staff]);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = db ? db.events.filter((e) => e.date >= today).slice(0, 4) : [];

  async function send(chatId) {
    setBusy(true);
    try {
      await act("sendChatMessage", { chatId, from: staff.id, text, tag: "general" }, "Message posted to the family group.");
      setText("");
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!db) return <div className="card">Loading…</div>;

  return (
    <div>
      <div className="section-head">
        <h2><Icon name="grad" size={22} /> My day at Gill</h2>
        <Badge tone="blue">{staff.name}</Badge>
      </div>

      <div className="tabs">
        <button className={tab === "day" ? "on" : ""} onClick={() => setTab("day")}>Today</button>
        <button className={tab === "classes" ? "on" : ""} onClick={() => setTab("classes")}>Classes & pupils</button>
        <button className={tab === "chats" ? "on" : ""} onClick={() => setTab("chats")}>Family group chats {myChats.length ? `(${myChats.length})` : ""}</button>
        <button className={tab === "desk" ? "on" : ""} onClick={() => setTab("desk")}>My desk</button>
      </div>

      {/* ---------- TODAY ---------- */}
      {tab === "day" && (
        <div>
          <div className="grid grid-4" style={{ marginBottom: "1.2rem" }}>
            <div className="card stat"><span className="stat-label">My classes</span><span className="stat-value">{classes.length}</span><span className="small muted">{pupils.length} pupils across my classes</span></div>
            <div className="card stat"><span className="stat-label">Assessments on file</span><span className="stat-value">{pupils.reduce((s, p) => s + p.assessments, 0)}</span><span className="small muted">term 3 continuous tracking</span></div>
            <div className="card stat"><span className="stat-label">Family groups</span><span className="stat-value">{myChats.length}</span><span className="small muted">messages parents can read</span></div>
            <div className="card stat"><span className="stat-label">Events ahead</span><span className="stat-value">{upcoming.length}</span><span className="small muted">school calendar</span></div>
          </div>

          <div className="grid grid-2">
            <div className="card">
              <h3>Today's lessons</h3>
              {Object.values(db.studentIndex)[0]?.campus === "main" && db.timetable.filter((t) => t.teacher === staff.id && t.day === new Date().toLocaleString("en", { weekday: "short" })).length ? (
                db.timetable.filter((t) => t.teacher === staff.id && t.day === new Date().toLocaleString("en", { weekday: "short" })).map((t) => (
                  <div className="list-item" key={t.id}>
                    <div className="spread">
                      <div>
                        <b>{t.subject}</b>
                        <div className="small muted">{t.period} · {t.room}</div>
                      </div>
                      <Badge tone="blue">{db.studentIndex[t.studentId]?.name.split(" ")[0]}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="list-item">
                  <div className="spread">
                    <div><b>{staff.id === "t-sharon" ? "Nursery 2 — full day programme" : "Year 5 class programme"}</b>
                      <div className="small muted">{staff.id === "t-sharon" ? "Pre-School Lead · morning circle, phonics, play-based learning" : "English & Mathematics cycles"}</div>
                    </div>
                    <Badge tone="green">ready</Badge>
                  </div>
                </div>
              )}
              <p className="small muted" style={{ marginTop: "0.6rem" }}>Assessment results you record go to the family instantly — with the private remark stream for parents.</p>
            </div>

            <div className="card">
              <h3>Upcoming school events</h3>
              {upcoming.map((e) => (
                <div className="list-item" key={e.id}>
                  <div className="spread">
                    <div>
                      <b>{e.title}</b>
                      <div className="small muted">{fmtDate(e.date)} · {e.time} · {e.location}</div>
                    </div>
                    <Badge tone="gold">{e.category}</Badge>
                  </div>
                </div>
              ))}
              {upcoming.length === 0 && <p className="small muted">Nothing scheduled yet — check the OS calendar for the latest.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ---------- CLASSES & PUPILS ---------- */}
      {tab === "classes" && (
        <div>
          {classes.map(([className, kids]) => (
            <div className="card" key={className} style={{ marginBottom: "1rem" }}>
              <div className="spread" style={{ marginBottom: "0.6rem" }}>
                <div>
                  <h3 style={{ margin: 0 }}>{className}</h3>
                  <div className="small muted">{kids.length} pupil(s) · {kids.reduce((s, k) => s + k.assessments, 0)} assessments published</div>
                </div>
                <Badge tone="blue">my class</Badge>
              </div>
              {kids.map((k) => {
                const fam = db.families.find((f) => f.id === k.familyId);
                return (
                  <div className="list-item" key={k.id}>
                    <div className="spread">
                      <div>
                        <div className="row" style={{ gap: "0.5rem" }}>
                          <b>{k.name}</b>
                          <span className="chip-pre" style={{ fontSize: "0.7rem" }}>{k.schoolId}</span>
                        </div>
                        <div className="small muted">{fam?.name} family</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        {k.avg !== null && <b style={{ color: k.avg >= 75 ? "var(--green)" : "var(--red)" }}>{k.avg}%</b>}
                        <div className="small muted">{k.last ? `${k.last.subject} · ${k.last.score}/${k.last.max}` : "no assessment yet"}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          {classes.length === 0 && (
            <div className="card soon">No teaching classes for this role — your work appears in “My desk”.</div>
          )}
        </div>
      )}

      {/* ---------- GROUP CHATS ---------- */}
      {tab === "chats" && (
        <div>
          {myChats.map((c) => {
            const kid = db.studentIndex[c.studentId];
            return (
              <div className="card" key={c.id} style={{ marginBottom: "1rem" }}>
                <div className="spread" style={{ marginBottom: "0.6rem" }}>
                  <div className="row" style={{ gap: "0.55rem" }}>
                    <span className="badge gray">{c.status}</span>
                    <b>{kid?.name}</b>
                    <span className="small muted">{c.members.filter((m) => m.role === "parent").length} parent(s) · {c.members.filter((m) => m.role === "teacher").length} teacher(s)</span>
                  </div>
                  <span className="small muted">families see everything you post here; they reply about attendance only</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: 320, overflowY: "auto", padding: "0.2rem 0" }}>
                  {c.messages.map((m) => {
                    const who = c.members.find((x) => x.userId === m.from);
                    const mine = m.from === staff.id;
                    return (
                      <div key={m.id} className="quote" style={{ margin: 0, padding: "0.5rem 0.7rem", background: mine ? "var(--peri-l)" : "#fff", borderColor: mine ? "var(--peri-2)" : "var(--line)", alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "80%", width: "fit-content" }}>
                        <div className="small" style={{ fontWeight: 700 }}>{who?.name}{m.tag === "attendance" && <span className="badge gold" style={{ marginLeft: "0.35rem" }}>attendance</span>}</div>
                        <div className="small">{m.text}</div>
                        <div className="small muted" style={{ fontSize: "0.72rem" }}>{new Date(m.date).toLocaleString()}</div>
                      </div>
                    );
                  })}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); send(c.id); }} style={{ marginTop: "0.7rem", display: "flex", gap: "0.6rem" }}>
                  <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Post an update to the family group…" style={{ flex: 1 }} />
                  <button className="btn sm" disabled={busy || !text.trim()}>Post</button>
                </form>
              </div>
            );
          })}
          {myChats.length === 0 && <div className="card soon">No group chats yet — they open when a parent ticks “Receive messages from teachers” for their child.</div>}
        </div>
      )}

      {/* ---------- MY DESK (role-specific, read-only for non-teaching staff) ---------- */}
      {tab === "desk" && (
        <div className="grid grid-2">
          {staff.id === "u-admissions" && (
            <div className="card">
              <h3>Admissions desk</h3>
              <div className="list-item"><b>{db.applications.filter((a) => a.status !== "activated").length} applications awaiting activation</b><div className="small muted">docs verified + tuition cleared → auto on-boarded</div></div>
              <div className="list-item"><b>{db.documents.filter((d) => d.status === "pending review").length} documents pending verification</b><div className="small muted">verified records follow the pupil at transition</div></div>
            </div>
          )}
          {staff.id === "u-bursar" && (
            <div className="card">
              <h3>Bursar desk</h3>
              <div className="list-item"><b className="small">Billed this term: {fmtUGX(db.invoices.filter((i) => i.term === db.meta.currentTerm).reduce((s, i) => s + i.total, 0))}</b><div className="small muted">{db.meta.currentTerm}</div></div>
              <div className="list-item"><b className="small">Collected: {fmtUGX(db.invoices.filter((i) => i.term === db.meta.currentTerm).reduce((s, i) => s + i.paid, 0))}</b><div className="small muted">auto-reconciled via MTN / Airtel</div></div>
            </div>
          )}
          {staff.id === "u-gate" && (
            <div className="card">
              <h3>Gate desk</h3>
              {db.pickups.length ? db.pickups.slice(0, 5).map((p) => (
                <div className="list-item" key={p.id}>
                  <div className="spread">
                    <div><b>{db.studentIndex[p.studentId]?.name}</b><div className="small muted">out {p.timeOut} · collected by {p.collector}</div></div>
                    {p.late ? <Badge tone="red">late · {fmtUGX(p.fee)}</Badge> : <Badge tone="green">on time</Badge>}
                  </div>
                </div>
              )) : <p className="small muted">No checkouts logged today.</p>}
            </div>
          )}
          {["t-aisha", "t-brian", "t-sharon"].includes(staff.id) && (
            <div className="card">
              <h3>Teacher desk</h3>
              <div className="list-item"><b>Two remark streams per assessment</b><div className="small muted">one for the pupil's portal, one private for the family — parents choose what the child sees.</div></div>
              <div className="list-item"><b>Groups post instantly</b><div className="small muted">your messages reach every parent on the admission form.</div></div>
            </div>
          )}
          <div className="card">
            <h3>OS administration is separate</h3>
            <p className="small muted" style={{ margin: "0.3rem 0 0" }}>
              The monitoring console is restricted to the Top School Administration. Staff work happens here in the Staff Portal —
              same records, no shared desk logins.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
