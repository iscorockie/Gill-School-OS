"use client";
import { useState } from "react";
import { useApp, Badge, Field, fmtUGX, fmtDate } from "@/components/ui.jsx";

export default function PickupsPage() {
  const { db, act } = useApp();
  const [studentId, setStudentId] = useState("");
  const [collector, setCollector] = useState("");
  const [busy, setBusy] = useState(false);

  if (!db) return <div className="card">Loading…</div>;
  const allStudents = Object.values(db.studentIndex);

  async function checkout(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await act("checkout", { studentId, collector }, "Checkout logged. The system applied the correct late fee (if any) and sent the family an automated SMS + in-app notice.");
      setCollector("");
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="section-head">
        <h2>Gate & Checkout Console</h2>
        <Badge tone="blue">Mr. Peter Othieno · Security & Front Office</Badge>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3> Log a checkout</h3>
          <form onSubmit={checkout}>
            <Field label="Child">
              <select value={studentId || allStudents[0]?.id} onChange={(e) => setStudentId(e.target.value)}>
                {allStudents.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} — {s.class} ({s.campus === "preschool" ? "Pre-School" : "Main"})</option>
                ))}
              </select>
            </Field>
            <Field label="Collector (as shown on the register)">
              <input required value={collector} onChange={(e) => setCollector(e.target.value)} placeholder="e.g. Amina Nansubuga (mother)" />
            </Field>
            <button className="btn" disabled={busy}>{busy ? "Logging…" : "Log checkout at current time"}</button>
            <button type="button"
              className="btn secondary"
              style={{ marginTop: "0.5rem" }}
              disabled={busy}
              onClick={async () => {
                if (!collector) return alert("Enter a collector first");
                setBusy(true);
                try {
                  await act("checkout", { studentId, collector, timeOut: "17:07" }, "Demo: simulated 5:07 pm checkout — UGX 20,000 auto-billed and SMS sent to the family.");
                  setCollector("");
                } catch (err) { alert(err.message); }
                setBusy(false);
              }}
            > Demo: simulate 5:07 pm checkout
            </button>
          </form>
          <div className="quote" style={{ marginTop: "0.9rem" }}>
            <b>Policy:</b> gate closes for pickup at <b>5:00 pm</b>. After that, a <b>UGX 20,000</b> late fee is added to the family's fee account automatically and a polite SMS is sent — no manual tracking, no lost revenue.
          </div>
        </div>

        <div className="card">
          <h3> Today's log</h3>
          {db.pickups.slice(0, 8).map((p) => {
            const kid = db.studentIndex[p.studentId];
            return (
              <div className="list-item spread" key={p.id}>
                <div>
                  <b>{kid?.name}</b> · <span className="small">{p.collector}</span>
                  <div className="small muted">{fmtDate(p.date)} · out {p.timeOut}</div>
                </div>
                {p.late ? (
                  <div style={{ textAlign: "right" }}>
                    <Badge tone="red">late +{fmtUGX(p.fee)}</Badge>
                    <div className="small muted">billed {p.billedTo ? "✓ auto" : ""} · SMS {p.notified ? "✓" : "pending"}</div>
                  </div>
                ) : (
                  <Badge tone="green">on time</Badge>
                )}
              </div>
            );
          })}
          <p className="small muted" style={{ marginTop: "0.5rem" }}> This term: <b>{fmtUGX(db.pickups.filter((p) => p.late).reduce((s, p) => s + p.fee, 0))}</b> in late fees captured automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
