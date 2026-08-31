"use client";
import { useState } from "react";
import { useApp, Badge, Field, Modal, fmtDate } from "@/components/ui.jsx";
import { currentFamily } from "@/lib/client.js";
import Icon from "@/components/icons.jsx";
import { useParent } from "@/components/ParentProvider.jsx";

const DEFAULT_PERMS = {
  progress: true,
  remarks: true,
  homework: true,
  library: true,
  calendar: true,
  messages: true,
  fees: false,
};

const PERM_LABELS = [
  ["progress", "View progress & assessment scores"],
  ["remarks", "See teacher remarks written to them"],
  ["homework", "See homework and due dates"],
  ["library", "Download worksheets & past papers"],
  ["calendar", "View the school calendar"],
  ["messages", "Receive messages from teachers (creates the family group chat)"],
  ["fees", "View family fees & payments"],
];

export default function AccountsPage() {
  const { db, act } = useApp();
  const { session } = useParent();
  const [open, setOpen] = useState(null);
  const [accessFor, setAccessFor] = useState(null);

  if (!db) return <div className="card">Loading…</div>;
  const family = currentFamily(db, session.primaryUserId);

  return (
    <div>
      <div className="section-head">
        <h2><Icon name="key" size={22} /> Student Accounts</h2>
        <span className="muted small">Set up each child's portal before they report to school</span>
      </div>

      <div className="card" style={{ marginBottom: "1.2rem", background: "var(--peri-l)", borderColor: "var(--peri-2)" }}>
        <div className="row" style={{ gap: "0.7rem" }}>
          <Icon name="shield" size={22} style={{ color: "var(--maroon)" }} />
          <div>
            <b>Supervised accounts, like adding a device to your family.</b>
            <p className="small" style={{ margin: "0.2rem 0 0" }}> Your parent account is the supervising account. The school's records for each child are already on file —
              you simply create the child's sign-in, choose what they can see, and manage it here anytime.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        {family.children.map((c) => {
          const acc = db.accountByStudent[c.id];
          return (
            <div className={`acct-card ${acc ? "" : "soon"}`} key={c.id}>
              <div className="row2">
                <div className={`ava ${c.campus === "preschool" ? "pre" : ""}`}>
                  {c.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <b style={c.campus === "preschool" ? { fontFamily: "var(--fpd)" } : undefined}>{c.name}</b>
                  <div className="small muted">
                    {c.schoolId} · {c.class} · {c.campus === "preschool" ? "Pre-School" : "Main School"}
                  </div>
                </div>
                {acc ? (
                  <Badge tone={acc.status === "active" ? "green" : "red"}>
                    {acc.status === "active" ? "Account live" : "Paused"}
                  </Badge>
                ) : (
                  <Badge tone="gold">No account yet</Badge>
                )}
              </div>

              {acc ? (
                <>
                  <div className="row" style={{ margin: "0.8rem 0 0.5rem" }}>
                    <span className="mono small muted">@{acc.username}</span>
                    <span className="chip-pre" style={{ fontSize: "0.7rem" }}>supervised by {family.name} family</span>
                  </div>
                  <div className="badge-row" style={{ marginBottom: "0.7rem" }}>
                    {Object.entries(acc.perms).map(([k, v]) => (
                      <span className={`perm ${v ? "" : "off"}`} key={k}>
                        <Icon name={v ? "check" : "minus"} size={14} />
                        {PERM_LABELS.find(([key]) => key === k)?.[1].split(" ").slice(0, 3).join(" ")}
                      </span>
                    ))}
                  </div>
                  <div className="row">
                    <button className="btn secondary sm" onClick={() => setAccessFor(c.id)}>
                      <Icon name="eye" size={14} /> What they can see
                    </button>
                    <button
                      className="btn ghost sm"
                      onClick={async () => {
                        const r = await act("resetStudentAccount", { accountId: acc.id });
                        alert(`New password for ${c.name}: ${r.password}`);
                      }}
                    >
                      <Icon name="refresh" size={14} /> Reset password
                    </button>
                    <button className="btn ghost sm"
                      onClick={async () => {
                        await act("updateStudentAccount", { accountId: acc.id, status: acc.status === "active" ? "paused" : "active" }, acc.status === "active" ? `${c.name}'s account paused.` : `${c.name}'s account is live again.`);
                      }}
                    >
                      {acc.status === "active" ? "Pause" : "Resume"}
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ marginTop: "0.8rem" }}>
                  <button className="btn sm" onClick={() => setOpen(c.id)}>
                    <Icon name="plus" size={16} /> Create student account
                  </button>
                  <p className="small muted" style={{ marginTop: "0.5rem" }}> The school has {c.name}'s records ready. Creating the account takes under a minute.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="card" style={{ marginTop: "1.2rem" }}>
        <div className="row" style={{ gap: "0.7rem" }}>
          <Icon name="info" size={20} style={{ color: "var(--maroon)" }} />
          <p className="small" style={{ margin: 0 }}> When a child graduates from Pre-School to the International School, their account follows automatically —
            same username, same supervised parent, updated class and timetable.
          </p>
        </div>
      </div>

      {open && <CreateAccountModal childId={open} onClose={() => setOpen(null)} />}
      {accessFor && <AccessModal childId={accessFor} onClose={() => setAccessFor(null)} />}
    </div>
  );
}

function AccessModal({ childId, onClose }) {
  const { db, act } = useApp();
  const { session } = useParent();
  const family = currentFamily(db, session.primaryUserId);
  const child = family.children.find((c) => c.id === childId);
  const acc = db.accountByStudent[childId];
  const [perms, setPerms] = useState({ ...acc.perms });
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await act(
        "updateStudentAccount",
        { accountId: acc.id, perms },
        perms.messages && !acc.perms.messages
          ? `Teacher messages switched on — the ${child.name.split(" ")[0]} group chat was created automatically.`
          : "Access updated."
      );
      onClose();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`What can ${child.name.split(" ")[0]} see?`} onClose={onClose}>
      <div className="quote" style={{ marginBottom: "0.9rem" }}>
        <b>Two separate remark streams.</b>
        <div className="small muted">
          Teachers write a remark for your child <b>and</b> a private remark for the family. You decide here whether the
          child sees their own remark; the family remark stays with you either way.
        </div>
      </div>
      <div className="grid grid-2" style={{ gap: "0.5rem", marginBottom: "0.9rem" }}>
        {PERM_LABELS.map(([key, label]) => (
          <label key={key} className={`perm ${perms[key] ? "" : "off"}`} style={{ cursor: "pointer" }}>
            <input type="checkbox" checked={!!perms[key]} onChange={(e) => setPerms({ ...perms, [key]: e.target.checked })} style={{ width: "auto" }} />
            <span className="small">{label}</span>
          </label>
        ))}
      </div>
      <p className="small muted">
        Tick “Receive messages from teachers” and the family group chat is created automatically — you can read
        everything teachers post and reply about attendance issues.
      </p>
      <button className="btn" style={{ width: "100%", marginTop: "0.8rem" }} disabled={busy} onClick={save}>
        {busy ? "Saving…" : "Save access & create/update group chat"}
      </button>
    </Modal>
  );
}

function CreateAccountModal({ childId, onClose }) {
  const { db, act } = useApp();
  const { session } = useParent();
  const family = currentFamily(db, session.primaryUserId);
  const child = family.children.find((c) => c.id === childId);
  const [username, setUsername] = useState(child.name.toLowerCase().replace(/\s+/g, "."));
  const [password, setPassword] = useState("gill" + Math.floor(1000 + Math.random() * 9000));
  const [perms, setPerms] = useState(DEFAULT_PERMS);
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    try {
      await act(
        "createStudentAccount",
        { studentId: child.id, username, password, perms },
        `${child.name}'s portal account is live — they can sign in at Student Portal.`
      );
      onClose();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`Create ${child.name}'s account`} onClose={onClose}>
      <div className="quote" style={{ marginBottom: "1rem" }}>
        <b>Who will use this account?</b>
        <div className="small muted"> Like setting up a new device: your family account is already set up, so this one is for{" "}
          <b>{child.name}</b> — a child account supervised by {family.name} family.
        </div>
      </div>

      <Field label="Username">
        <input value={username} onChange={(e) => setUsername(e.target.value)} />
      </Field>
      <Field label="Password">
        <input value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>

      <div style={{ marginBottom: "0.9rem" }}>
        <span className="small" style={{ fontWeight: 700, display: "block", marginBottom: "0.5rem" }}> What can {child.name.split(" ")[0]} access?
        </span>
        <div className="grid grid-2" style={{ gap: "0.5rem" }}>
          {PERM_LABELS.map(([key, label]) => (
            <label key={key} className={`perm ${perms[key] ? "" : "off"}`} style={{ cursor: "pointer" }}>
              <input type="checkbox"
                checked={!!perms[key]}
                onChange={(e) => setPerms({ ...perms, [key]: e.target.checked })}
                style={{ width: "auto" }}
              />
              <span className="small">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <p className="small muted"> Fees stay parent-only by default — you can grant access above if you'd like your child to see them.
      </p>

      <button className="btn" style={{ width: "100%", marginTop: "0.8rem" }} disabled={busy || !username || !password} onClick={create}>
        {busy ? "Creating…" : `Create supervised account`}
      </button>
    </Modal>
  );
}
