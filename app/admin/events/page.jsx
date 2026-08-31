"use client";
import { useState } from "react";
import { useApp, Badge, Field, fmtDate, Modal } from "@/components/ui.jsx";

export default function AdminEventsPage() {
  const { db, act } = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", date: "", time: "08:00", location: "School", category: "Community", audience: "all" });
  if (!db) return <div className="card">Loading…</div>;

  async function add(e) {
    e.preventDefault();
    setOpen(false);
    try {
      await act("addEvent", form, "Event published — subscribers' Google/Apple calendars update automatically.");
      setForm({ title: "", date: "", time: "08:00", location: "School", category: "Community", audience: "all" });
    } catch (err) {
      alert(err.message);
    }
  }

  const ics = "/api/ics?campus=all";

  return (
    <div>
      <div className="section-head">
        <h2>Events & Calendar Publishing</h2>
        <button className="btn sm" onClick={() => setOpen(true)}>＋ Add event</button>
      </div>

      <div className="card" style={{ marginBottom: "1.2rem", background: "var(--peri-l)", borderColor: "var(--peri-2)" }}>
        <div className="spread">
          <div>
            <b>🔗 Live calendar feed (ICS)</b>
            <p className="small" style={{ margin: "0.2rem 0 0" }}>
              One URL powers every parent's Google/Apple sync — new events appear automatically. No re-printing paper calendars.
            </p>
          </div>
          <div className="row">
            <span className="mono small">{ics}</span>
            <a className="btn secondary sm" href={ics}>Subscribe/Download</a>
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
                    <div className="small muted">{e.time} · {e.location} · {fmtDate(e.date)}</div>
                  </div>
                </div>
                {pre ? (
                  <span className="chip-pre">🌱 GIPS</span>
                ) : (
                  <Badge tone={e.category === "Sports" ? "gold" : e.category === "Community" ? "blue" : "gray"}>{e.category}</Badge>
                )}
              </div>
              <div className="small muted" style={{ marginTop: "0.4rem" }}>Audience: {pre ? "🌱 Pre-School families" : "Whole school"}</div>
            </div>
          );
        })}
      </div>

      {open && (
        <Modal title="Publish a new event" onClose={() => setOpen(false)}>
          <form onSubmit={add}>
            <Field label="Title"><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
            <div className="grid grid-2">
              <Field label="Date"><input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
              <Field label="Time"><input value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></Field>
            </div>
            <Field label="Location"><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
            <div className="grid grid-2">
              <Field label="Category">
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {["Community", "Academic", "Sports", "Ceremony", "Admin"].map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Audience">
                <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
                  <option value="all">Whole school</option><option value="preschool">Pre-School</option><option value="parents">Parents</option>
                </select>
              </Field>
            </div>
            <button className="btn" style={{ width: "100%" }}>Publish to calendar</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
