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
    </div>
  );
}
