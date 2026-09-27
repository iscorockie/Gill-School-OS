"use client";
import { useEffect, useState } from "react";
import { useApp, Badge, Field } from "@/components/ui.jsx";
import Icon from "@/components/icons.jsx";

const ROLES = [
  { id: "teacher", label: "Teacher" },
  { id: "admissions", label: "Admissions" },
  { id: "bursar", label: "Bursar" },
  { id: "frontdesk", label: "Front Desk & Gate" },
  { id: "admin", label: "Top School Administration" },
];

// Head of School console: issue staff portal accounts on school emails.
// Each invite is emailed (cPanel SMTP when configured); the holder sets
// their own portal password through the link.
export default function StaffAccountsPage() {
  const { db, act } = useApp();
  const [form, setForm] = useState({ name: "", email: "", role: "teacher", phone: "" });
  const [busy, setBusy] = useState(false);
  const [invite, setInvite] = useState(null);
  const [mail, setMail] = useState(null);
  const [testTo, setTestTo] = useState("");
  const [testBusy, setTestBusy] = useState(false);
  const [testMsg, setTestMsg] = useState(null);

  useEffect(() => {
    fetch("/api/mail-status").then((r) => r.json()).then(setMail).catch(() => setMail({ ok: false }));
  }, []);

  async function sendTest(e) {
    e.preventDefault();
    setTestBusy(true);
    setTestMsg(null);
    try {
      const r = await act("sendTestEmail", { to: testTo });
      setTestMsg({ ok: true, text: r.message });
    } catch (err) {
      setTestMsg({ ok: false, text: err.message });
    } finally {
      setTestBusy(false);
    }
  }

  if (!db) return <div className="card">Loading…</div>;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const accounts = db.staffAccounts || [];

  async function sendInvite(e) {
    e.preventDefault();
    setBusy(true);
    setInvite(null);
    try {
      const r = await act("inviteStaff", form, `Invite sent to ${form.email}.`);
      setInvite(r);
      setForm({ name: "", email: "", role: "teacher", phone: "" });
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function resend(accountId) {
    setInvite(null);
    try {
      const r = await act("resendStaffInvite", { accountId }, "Invite re-sent.");
      setInvite(r);
    } catch (err) {
      alert(err.message);
    }
  }

  async function toggle(account) {
    const next = account.status === "active" ? "suspended" : "active";
    if (next === "suspended" && !confirm(`Deactivate ${account.email}? They will be locked out immediately.`)) return;
    try {
      await act("setStaffStatus", { accountId: account.id, status: next }, `${account.email} → ${next}.`);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      <div className="section-head">
        <h2>Staff Accounts</h2>
        <Badge tone="blue">{accounts.filter((a) => a.status === "active").length} active · school emails</Badge>
      </div>

      <div className="card" style={{ marginBottom: "1.2rem", background: "var(--peri-l)", borderColor: "var(--peri-2)" }}>
        <div className="spread" style={{ marginBottom: "0.6rem" }}>
          <h3 style={{ margin: 0 }}><Icon name="mail" size={18} /> School email (SMTP) status</h3>
          {!mail ? <Badge tone="gray">checking…</Badge>
            : mail.configured ? <Badge tone="green">live — {mail.host}</Badge>
            : <Badge tone="gold">simulated demo mode</Badge>}
        </div>
        {mail && !mail.configured && (
          <p className="small muted" style={{ margin: "0 0 0.6rem" }}>
            No <span className="mono">SMTP_*</span> variables set — invites and codes are shown on screen instead of
            emailed. See <span className="mono">docs/email-setup.md</span> to connect cPanel/Webuzo webmail.
          </p>
        )}
        {mail?.configured && (
          <p className="small muted" style={{ margin: "0 0 0.6rem" }}>
            Sending as <span className="mono">{mail.from}</span> via <span className="mono">{mail.host}:{mail.port}</span>.
            Send yourself a test email to confirm delivery:
          </p>
        )}
        <form onSubmit={sendTest} className="row" style={{ gap: "0.5rem", flexWrap: "wrap" }}>
          <input
            type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)}
            placeholder="you@gill.ac.ug" style={{ flex: 1, minWidth: 200 }} required
          />
          <button className="btn sm" disabled={testBusy}>{testBusy ? "Sending…" : "Send test email"}</button>
        </form>
        {testMsg && (
          <p className="small" style={{ margin: "0.5rem 0 0", color: testMsg.ok ? "var(--green)" : "var(--red)" }}>
            {testMsg.text}
          </p>
        )}
        {invite?.mailError && (
          <div className="quote" style={{ background: "#fff3f0", borderColor: "#eec2b8", marginTop: "0.9rem" }}>
            <b className="small">Email send failed — {invite.mailError}.</b>
            <div className="small" style={{ marginTop: "0.3rem" }}>
              The account was still created. Share this setup link manually (e.g. WhatsApp) until SMTP is fixed:
            </div>
            <div className="small" style={{ marginTop: "0.3rem" }}>
              Invite code: <span className="mono">{invite.inviteToken}</span>
            </div>
            <div className="small" style={{ marginTop: "0.3rem" }}>
              Setup link: <span className="mono" style={{ wordBreak: "break-all" }}>{invite.setupLink}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3><Icon name="key" size={18} /> Invite a staff member</h3>
          <p className="small muted" style={{ marginTop: "-0.3rem" }}>
            1. Create their mailbox in cPanel webmail first (<span className="mono">@gill.ac.ug</span>).
            2. Send the invite below — they set their own portal password from the email.
          </p>
          <form onSubmit={sendInvite}>
            <Field label="Full name">
              <input value={form.name} onChange={set("name")} placeholder="e.g. Ms. Jane Anyango" required />
            </Field>
            <Field label="School email address">
              <input type="email" value={form.email} onChange={set("email")} placeholder="j.anyango@gill.ac.ug" required />
            </Field>
            <div className="grid grid-2" style={{ gap: "0.6rem" }}>
              <Field label="Role">
                <select value={form.role} onChange={set("role")}>
                  {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </Field>
              <Field label="Phone (optional)">
                <input value={form.phone} onChange={set("phone")} placeholder="+2567…" />
              </Field>
            </div>
            <button className="btn" disabled={busy}>{busy ? "Sending invite…" : "Send email invite"}</button>
          </form>
          {invite?.simulated && invite?.inviteToken && (
            <div className="quote" style={{ background: "#fffbe8", borderColor: "var(--gold-2)", marginTop: "0.9rem" }}>
              <b className="small">Demo mail — no real email was sent.</b>
              <div className="small" style={{ marginTop: "0.3rem" }}>
                Invite code: <span className="mono">{invite.inviteToken}</span>
              </div>
              <div className="small" style={{ marginTop: "0.3rem" }}>
                Setup link: <span className="mono" style={{ wordBreak: "break-all" }}>{invite.setupLink}</span>
              </div>
              <div className="small muted" style={{ marginTop: "0.3rem" }}>
                Open <a href={`/staff/setup?invite=${invite.inviteToken}`}>/staff/setup</a> with this code to finish the demo setup.
                Connect SMTP (see docs/email-setup.md) to send real invites.
              </div>
            </div>
          )}
          {invite && !invite.simulated && (
            <div className="quote" style={{ background: "#f0faf0", borderColor: "#bfe3bf", marginTop: "0.9rem" }}>
              <b className="small">Invite emailed to {invite.email}.</b>
              <div className="small muted">They set their password from the link. Re-send any time below if it expires.</div>
            </div>
          )}
        </div>

        <div className="card">
          <h3><Icon name="users" size={18} /> All staff logins</h3>
          {accounts.map((a) => {
            const user = db.users.find((u) => u.id === a.userId) || {};
            const pending = !a.verified || !a.passwordSet;
            return (
              <div className="list-item" key={a.id}>
                <div className="spread">
                  <div>
                    <b>{user.name || a.email}</b>{" "}
                    <Badge tone={a.status === "active" ? (pending ? "gold" : "green") : "red"}>
                      {a.status === "active" ? (pending ? "invite pending" : "active") : "suspended"}
                    </Badge>
                    <div className="small muted">{a.email} · {user.title || user.subject || a.userId}</div>
                  </div>
                  <div className="row" style={{ gap: "0.4rem" }}>
                    {pending && a.status === "active" && (
                      <button className="btn ghost sm" onClick={() => resend(a.id)}>Re-send invite</button>
                    )}
                    {a.userId !== "u-admin" && (
                      <button className="btn secondary sm" onClick={() => toggle(a)}>
                        {a.status === "active" ? "Deactivate" : "Reactivate"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {accounts.length === 0 && <p className="small muted">No staff accounts yet.</p>}
          <p className="small muted" style={{ marginTop: "0.6rem" }}>
            Staff sign in at <span className="mono">/staff</span> with their school email + portal password.
            Forgotten passwords are self-served through the emailed reset code — no office visit needed.
          </p>
        </div>
      </div>
    </div>
  );
}
