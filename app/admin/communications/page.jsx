"use client";
import { useState } from "react";
import { useApp, Badge, Field, fmtDate } from "@/components/ui.jsx";

export default function CommunicationsPage() {
  const { db, act } = useApp();
  const [channel, setChannel] = useState("app");
  const [audience, setAudience] = useState("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  if (!db) return <div className="card">Loading…</div>;
  const co = db.communications;

  async function publish(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await act(
        "publishNotice",
        { title, body, audience, author: "Head of School" },
        channel === "app" ? "Notice published to the app noticeboard for all families." : `${channel} broadcast queued — delivery simulated in the log below.`
      );
      if (channel !== "app") {
        await act("sendMessage", { from: "u-admin", to: "u-parent-1", subject: title, body, channel: channel === "sms" ? "sms" : "email" });
      }
      setTitle(""); setBody("");
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="section-head">
        <h2>Communications</h2>
        <Badge tone="green">Notices · messaging · SMS & email</Badge>
      </div>

      <div className="grid grid-3" style={{ marginBottom: "1.2rem" }}>
        {co.providers.map((p) => (
          <div className="card" key={p.id}>
            <b>{p.name}</b>
            <div className="small muted">{p.unit}</div>
            <div className="badge green" style={{ marginTop: "0.4rem" }}>{p.monthlyEstimate > 0 ? `≈ ${p.monthlyEstimate.toLocaleString()} UGX/mo` : "included — no subscription"}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3> Compose & broadcast</h3>
          <form onSubmit={publish}>
            <Field label="Audience">
              <select value={audience} onChange={(e) => setAudience(e.target.value)}>
                <option value="all">Whole school</option>
                <option value="parents">Parents (main school)</option>
                <option value="preschool">Pre-School families only</option>
              </select>
            </Field>
            <Field label="Title"><input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Sports Day — house colours" /></Field>
            <Field label="Message"><textarea rows={4} required value={body} onChange={(e) => setBody(e.target.value)} /></Field>
            <Field label="Primary channel">
              <select value={channel} onChange={(e) => setChannel(e.target.value)}>
                <option value="app">In-app noticeboard (free)</option>
                <option value="sms">SMS broadcast (MTN/Airtel gateway)</option>
                <option value="email">Email broadcast</option>
              </select>
            </Field>
            <button className="btn" disabled={busy}>{busy ? "Sending…" : "Publish & notify"}</button>
          </form>
          <p className="small muted" style={{ marginTop: "0.6rem" }}> Notices appear instantly on every family's dashboard; SMS is used for urgent fee, absence and late-pickup alerts.
          </p>
        </div>

        <div className="card">
          <h3> Delivery log</h3>
          {db.deliveries.map((d) => (
            <div className="list-item" key={d.id}>
              <div className="spread">
                <div>
                  <Badge tone={d.channel === "In-app" ? "green" : d.channel === "SMS" ? "blue" : "gray"}>{d.channel}</Badge>{" "}
                  <b className="small">{d.subject}</b>
                  <div className="small muted">{d.to} · {d.provider}</div>
                </div>
                <span className="small muted">{d.date}</span>
              </div>
            </div>
          ))}
          <p className="small muted" style={{ marginTop: "0.5rem" }}> In production this connects to an SMS aggregator (MTN Uganda / Airtel Uganda) with a failover to email for delivery receipts.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: "1.2rem" }}>
        <div className="spread" style={{ marginBottom: "0.7rem" }}>
          <div>
            <h3> Family group chats — monitoring view</h3>
            <p className="small muted" style={{ margin: "0.2rem 0 0" }}>
              Every message in a teacher–family group is visible here. Families can read everything but only reply about
              attendance issues; teachers post freely.
            </p>
          </div>
          <Badge tone="blue">{db.chats.filter((c) => c.status === "active").length} active groups</Badge>
        </div>
        {db.chats.map((c) => {
          const kid = db.studentIndex[c.studentId];
          const fam = db.families.find((f) => f.id === c.familyId);
          return (
            <div className="list-item" key={c.id} style={{ alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div className="spread">
                  <div>
                    <b>{kid?.name}</b> · <span className="small muted">{fam?.name} family</span>
                    <span className="badge gray" style={{ marginLeft: "0.4rem" }}>{c.status}</span>
                  </div>
                  <span className="small muted">{c.messages.length} messages</span>
                </div>
                <div style={{ marginTop: "0.45rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  {c.messages.map((m) => {
                    const who = c.members.find((x) => x.userId === m.from);
                    return (
                      <div key={m.id} className="small quote" style={{ margin: 0, padding: "0.45rem 0.65rem" }}>
                        <b>{who?.name}</b> ({who?.role})
                        {m.tag === "attendance" && <Badge tone="gold">attendance</Badge>}
                        <div>{m.text}</div>
                      </div>
                    );
                  })}
                  {c.messages.length === 0 && <div className="small muted">No messages yet.</div>}
                </div>
              </div>
            </div>
          );
        })}
        {db.chats.length === 0 && <p className="small muted">No group chats yet — they are created automatically when a parent switches on “Receive messages from teachers”.</p>}
      </div>
    </div>
  );
}
