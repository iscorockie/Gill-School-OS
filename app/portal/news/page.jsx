"use client";
import { useState } from "react";
import { useApp, Badge, Field, fmtDate } from "@/components/ui.jsx";
import { notificationsFor } from "@/lib/client.js";

export default function NewsPage() {
  const { db, act } = useApp();
  const [tab, setTab] = useState("notices");
  const [to, setTo] = useState("t-aisha");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  if (!db) return <div className="card">Loading…</div>;
  const inbox = notificationsFor(db, "u-parent-1");

  async function send(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await act("sendMessage", { from: "u-parent-1", to, subject, body, channel: "app" }, "Message sent — the teacher is notified instantly. (SMS & email not needed for this one.)");
      setSubject(""); setBody("");
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="section-head">
        <h2>Noticeboard & Messages</h2>
        <span className="muted small">Notices, teacher messages and alerts in one place</span>
      </div>

      <div className="tabs">
        <button className={tab === "notices" ? "on" : ""} onClick={() => setTab("notices")}> Notices</button>
        <button className={tab === "inbox" ? "on" : ""} onClick={() => setTab("inbox")}> Inbox</button>
        <button className={tab === "compose" ? "on" : ""} onClick={() => setTab("compose")}> Message a teacher</button>
      </div>

      {tab === "notices" && (
        <div className="grid grid-2">
          {db.notices.map((n) => (
            <div className={`card ${n.audience === "preschool" ? "gips" : ""}`} key={n.id}>
              <div className="spread">
                <b style={n.audience === "preschool" ? { fontFamily: "var(--fpd)" } : undefined}>{n.title}</b>
                {n.audience === "preschool" ? (
                  <span className="chip-pre"> Pre-School</span>
                ) : (
                  <Badge tone={n.audience === "parents" ? "blue" : "gray"}>{n.audience}</Badge>
                )}
              </div>
              <p className="small muted">{n.body}</p>
              <div className="small muted">{n.author} · {fmtDate(n.date)}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "inbox" && (
        <div className="card">
          {inbox.length === 0 && <p className="muted small">Inbox is empty.</p>}
          {inbox.map((m) => (
            <div className="list-item" key={m.id}>
              <div className="spread">
                <div className="row">
                  {!m.read && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--gold)", display: "inline-block" }} />}
                  <b>{m.subject}</b>
                </div>
                <span className="small muted">{fmtDate(m.date)} · via {m.channel}</span>
              </div>
              <p className="small">{m.body}</p>
              <div className="small muted"> From: {db.users.find((u) => u.id === m.from)?.name || "System"} ·{" "}
                <button className="btn ghost sm" onClick={() => act("markRead", { messageId: m.id })}>Mark read</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "compose" && (
        <div className="card" style={{ maxWidth: 640 }}>
          <form onSubmit={send}>
            <Field label="To">
              <select value={to} onChange={(e) => setTo(e.target.value)}>
                {db.users.filter((u) => u.role === "teacher").map((t) => (
                  <option key={t.id} value={t.id}>{t.name} — {t.subject}</option>
                ))}
                <option value="u-bursar">Mr. Isaac Twesigye — Bursar</option>
                <option value="u-admissions">Mrs. Mary Kyomukama — Admissions</option>
              </select>
            </Field>
            <Field label="Subject"><input value={subject} onChange={(e) => setSubject(e.target.value)} required /></Field>
            <Field label="Message"><textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} required /></Field>
            <button className="btn" disabled={busy}>{busy ? "Sending…" : "Send"}</button>
            <p className="small muted" style={{ marginTop: "0.6rem" }}> Messages land in the teacher's in-app inbox. Critical updates can be escalated to SMS/email at the admin console.
            </p>
          </form>
        </div>
      )}
    </div>
  );
}
