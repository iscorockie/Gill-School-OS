"use client";
import { useEffect, useState } from "react";
import { useApp, Badge, Field, fmtDate } from "@/components/ui.jsx";
import { currentFamily } from "@/lib/client.js";
import { useParent } from "@/components/ParentProvider.jsx";
import Icon from "@/components/icons.jsx";

export default function FamilyChatsPage() {
  const { db, act } = useApp();
  const { session } = useParent();
  const [openChat, setOpenChat] = useState(null);
  const [text, setText] = useState("");
  const [attendance, setAttendance] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!db || !openChat) return;
    const chat = db.chats.find((c) => c.id === openChat);
    if (chat && chat.messages.some((m) => !m.readBy.includes(session.primaryUserId))) {
      act("markChatRead", { chatId: openChat, from: session.primaryUserId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, openChat]);

  if (!db) return <div className="card">Loading…</div>;
  const family = currentFamily(db, session.primaryUserId);
  const chats = db.chats.filter((c) => c.familyId === family.id);
  const active = db.chats.find((c) => c.id === openChat);
  const kids = family.children;
  const kidsWithChat = chats.map((c) => c.studentId);
  const kidsNoChat = kids.filter((k) => !kidsWithChat.includes(k.id));
  const unread = (chat) => chat.messages.filter((m) => m.from !== session.primaryUserId && !m.readBy.includes(session.primaryUserId)).length;

  async function enableFor(kid) {
    try {
      await act(
        "updateStudentAccount",
        { accountId: db.accountByStudent[kid.id].id, perms: { messages: true } },
        `Group chat created for ${kid.name} — teachers and your family are in it.`
      );
    } catch (e) {
      alert(e.message);
    }
  }

  async function send(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await act(
        "sendChatMessage",
        { chatId: openChat, from: session.primaryUserId, text, tag: attendance ? "attendance" : "general" },
        attendance ? "Attendance message sent — the class teacher has been notified." : "Message sent to the group."
      );
      setText("");
      setAttendance(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="section-head">
        <h2><Icon name="chat" size={22} /> Family Group Chats</h2>
        <Badge tone="blue">{chats.filter((c) => c.status === "active").length} active · {kids.length} child(ren)</Badge>
      </div>

      <div className="card" style={{ marginBottom: "1.2rem", background: "var(--peri-l)", borderColor: "var(--peri-2)" }}>
        <div className="row" style={{ gap: "0.7rem" }}>
          <Icon name="shield" size={22} style={{ color: "var(--maroon)" }} />
          <div>
            <b>Automatic group chat — created when you tick “Receive messages from teachers”.</b>
            <p className="small" style={{ margin: "0.2rem 0 0" }}>
              Your child's teachers and your family are in one group. <b>You can read every message</b> teachers post —
              it's your family's viewing window into school life. To keep it respectful and focused, parents
              <b> can only reply about attendance issues</b> (absence, late collection, pickup change, sickness).
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: "1.2rem" }}>
        {chats.map((c) => {
          const kid = db.studentIndex[c.studentId];
          const teachers = c.members.filter((m) => m.role === "teacher").map((m) => m.name.split(" ")[0]);
          return (
            <button
              key={c.id}
              onClick={() => setOpenChat(c.id)}
              className={`card chat-card ${c.status === "paused" ? "soon" : ""}`}
              style={{ textAlign: "left", cursor: "pointer" }}
            >
              <div className="spread">
                <div className="row" style={{ gap: "0.65rem" }}>
                  <div className={`ava ${kid?.campus === "preschool" ? "pre" : ""}`}>{kid?.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</div>
                  <div>
                    <b>{kid?.name}</b>
                    <div className="small muted">{c.title}</div>
                  </div>
                </div>
                {unread(c) > 0 && c.status === "active" ? (
                  <Badge tone="green">{unread(c)} new</Badge>
                ) : (
                  <Badge tone={c.status === "active" ? "gray" : "gold"}>{c.status}</Badge>
                )}
              </div>
              <div className="small muted" style={{ marginTop: "0.5rem" }}>
                Teachers: {teachers.join(" & ")} · Parents: {c.members.filter((m) => m.role === "parent").length} · {c.messages.length} messages
              </div>
            </button>
          );
        })}

        {kidsNoChat.map((kid) => {
          const acc = db.accountByStudent[kid.id];
          return (
            <div className="card soon" key={kid.id}>
              <div className="row2">
                <div className={`ava ${kid.campus === "preschool" ? "pre" : ""}`}>{kid.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</div>
                <div style={{ flex: 1 }}>
                  <b>{kid.name}</b>
                  <div className="small muted">No group chat yet — groups are created automatically when you tick “Receive messages from teachers” for this child.</div>
                </div>
              </div>
              <div className="row" style={{ marginTop: "0.6rem" }}>
                {acc ? (
                  <button className="btn sm" onClick={() => enableFor(kid)} disabled={acc.perms.messages}>
                    <Icon name="plus" size={15} /> {acc.perms.messages ? "Chat already enabled" : "Create the group chat"}
                  </button>
                ) : (
                  <span className="small muted">Create {kid.name.split(" ")[0]}'s student account first, then switch on teacher messages.</span>
                )}
              </div>
            </div>
          );
        })}
        {kids.length === 0 && (
          <div className="card soon"><b>No children on file</b> — contact the school office.</div>
        )}
      </div>

      {active && (
        <div className="card">
          <div className="spread" style={{ marginBottom: "0.8rem" }}>
            <div>
              <h3 style={{ margin: 0 }}>{active.title}</h3>
              <div className="small muted">
                {active.members.map((m) => m.name).join(" · ")}
                {active.status === "paused" && <span style={{ color: "var(--red)" }}> — paused (teacher messages off)</span>}
              </div>
            </div>
            <button className="btn ghost sm" onClick={() => setOpenChat(null)}>Close</button>
          </div>

          <div className="chat-thread" style={{ maxHeight: 380, overflowY: "auto", padding: "0.4rem 0.2rem", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            {active.messages.map((m) => {
              const mine = m.from === session.primaryUserId;
              const teacher = m.role === "teacher";
              return (
                <div key={m.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                  <div className={`chat-bubble ${mine ? "mine" : teacher ? "teacher" : ""}`} style={{ maxWidth: "72%", padding: "0.6rem 0.8rem", borderRadius: 14, background: mine ? "var(--maroon)" : teacher ? "var(--peri-l)" : "#fff", border: mine ? "none" : "1px solid var(--line)", color: mine ? "#fff" : "inherit" }}>
                    <div className="small" style={{ fontWeight: 700, marginBottom: "0.15rem" }}>
                      {active.members.find((x) => x.userId === m.from)?.name || m.from}
                      {m.tag === "attendance" && <span className="badge gold" style={{ marginLeft: "0.4rem" }}>attendance</span>}
                      {m.tag === "system" && <span className="badge gray" style={{ marginLeft: "0.4rem" }}>system</span>}
                    </div>
                    <div className="small" style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
                    <div className="small muted" style={{ marginTop: "0.25rem", fontSize: "0.72rem" }}>{new Date(m.date).toLocaleString()}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {active.status === "active" && (
            <form onSubmit={send} style={{ marginTop: "0.9rem" }}>
              <div className="row" style={{ gap: "0.6rem", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <Field label={attendance ? "Attendance message (goes straight to the class teacher)" : "Message to the group (teachers only reply — parents can't post here)"}>
                    <textarea
                      rows={2}
                      value={text}
                      disabled={!attendance}
                      onChange={(e) => setText(e.target.value)}
                      placeholder={attendance ? "e.g. Maya will be absent tomorrow. / Please collect Maya at 17:30 today — traffic." : "Parents can read the group, but only attendance-related messages can be sent."}
                    />
                  </Field>
                </div>
                <button className="btn" disabled={busy || !text.trim() || !attendance} style={{ marginTop: "1.65rem" }}>
                  {busy ? "Sending…" : "Send"}
                </button>
              </div>
              <label className="perm" style={{ cursor: "pointer", marginTop: "0.4rem" }}>
                <input type="checkbox" checked={attendance} onChange={(e) => setAttendance(e.target.checked)} style={{ width: "auto" }} />
                <span className="small"><Icon name="alert" size={15} style={{ verticalAlign: "-3px", marginRight: "0.3rem" }} />
                  This message is about an attendance issue (absence, late collection, pickup change, sickness)</span>
              </label>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
