"use client";
import { useApp, Badge, fmtDate } from "@/components/ui.jsx";

export default function LeavesPage() {
  const { db, act } = useApp();
  if (!db) return <div className="card">Loading…</div>;

  return (
    <div>
      <div className="section-head">
        <h2>Leave & Absence Approvals</h2>
        <span className="muted small">Parents submit online; teachers are notified instantly</span>
      </div>

      <div className="grid grid-3" style={{ marginBottom: "1.2rem" }}>
        <div className="card stat"><span className="stat-label">Pending</span><span className="stat-value">{db.stats.pendingLeaves}</span></div>
        <div className="card stat"><span className="stat-label">Approved</span><span className="stat-value">{db.leaves.filter((l) => l.status === "approved").length}</span></div>
        <div className="card stat"><span className="stat-label">Auto-notified teachers</span><span className="stat-value">{db.leaves.reduce((s, l) => s + (l.teacherNotified?.length || 0), 0)}</span><span className="small muted">in-app + SMS hooks</span></div>
      </div>

      <div className="card">
        {db.leaves.map((l) => {
          const kid = db.studentIndex[l.studentId];
          const fam = db.families.find((f) => f.id === kid?.familyId);
          const teachers = (l.teacherNotified || []).map((tid) => db.users.find((u) => u.id === tid)?.name).filter(Boolean);
          return (
            <div className="list-item" key={l.id}>
              <div className="spread">
                <div>
                  <b>{kid?.name}</b> · <span className="small">{fam?.name} family · {l.from} → {l.to}</span>
                  <div className="small">{l.reason || "No reason given"}</div>
                  <div className="small muted">
                    Notified automatically: {teachers.join(", ") || "—"} · submitted {fmtDate(l.date)}
                  </div>
                </div>
                <div className="row" style={{ justifyContent: "flex-end" }}>
                  <Badge tone={l.status === "approved" ? "green" : l.status === "declined" ? "red" : "gold"}>{l.status === "pending" ? "⏳ pending" : l.status}</Badge>
                  {l.status === "pending" && (
                    <>
                      <button className="btn sm" onClick={() => act("decideLeave", { leaveId: l.id, approve: true }, "Leave approved — attendance register updated for the class teacher.")}>✓ Approve</button>
                      <button className="btn danger sm" onClick={() => act("decideLeave", { leaveId: l.id, approve: false }, "Leave declined — parent notified.")}>✗ Decline</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
