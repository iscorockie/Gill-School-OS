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
  const [smtp, setSmtp] = useState({ host: "", port: "465", secure: "true", user: "", pass: "", from: "" });
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [verifyBusy, setVerifyBusy] = useState(false);

  async function loadMail() {
    try {
      const m = await (await fetch("/api/mail-status")).json();
      setMail(m);
      setSmtp((s) => ({
        host: m.host || s.host,
        port: String(m.port ?? s.port),
        secure: String(m.secure ?? true),
        user: m.user || s.user,
        pass: s.pass, // password is write-only — never echoed back
        from: m.from || s.from,
      }));
    } catch {
      setMail({ ok: false });
    }
  }

  useEffect(() => { loadMail(); }, []);

  async function recheck() {
    setVerifyBusy(true);
    try { await loadMail(); } finally { setVerifyBusy(false); }
  }

  async function saveSmtp(e) {
    e.preventDefault();
    setSaveBusy(true);
    setSaveMsg(null);
    try {
      const r = await act("saveMailConfig", smtp);
      setSaveMsg({ ok: true, text: r.message });
      setSmtp((s) => ({ ...s, pass: "" }));
      await loadMail();
    } catch (err) {
      setSaveMsg({ ok: false, text: err.message });
    } finally {
      setSaveBusy(false);
    }
  }

  async function forgetSmtp() {
    if (!confirm("Remove the saved SMTP settings? Email falls back to the server environment, or to simulated mode (development only).")) return;
    try {
      const r = await act("clearMailConfig", {});
      setSaveMsg({ ok: true, text: r.message });
      await loadMail();
    } catch (err) {
      setSaveMsg({ ok: false, text: err.message });
    }
  }

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
          <div className="row" style={{ gap: "0.4rem" }}>
            {!mail ? <Badge tone="gray">checking…</Badge>
              : !mail.configured ? <Badge tone="gold">not configured — simulated mode</Badge>
              : mail.verified === false ? <Badge tone="red">configured, but not delivering</Badge>
              : <Badge tone="green">live — {mail.host}{mail.verified ? " · verified" : ""}</Badge>}
            {mail?.configured && (
              <button className="btn ghost sm" onClick={recheck} disabled={verifyBusy}>
                {verifyBusy ? "Checking…" : "Check connection"}
              </button>
            )}
          </div>
        </div>
        {mail && !mail.configured && (
          <p className="small muted" style={{ margin: "0 0 0.6rem" }}>
            Email runs in simulated mode (codes &amp; invites shown on screen) until the
            <b> noreply@gill.ac.ug mailbox password</b> is added — that one password is all it takes.
            The server, port and sender are already pre-filled in SMTP settings below; or set
            <span className="mono"> SMTP_PASS</span> on the host. See <span className="mono">docs/email-setup.md</span>.
          </p>
        )}
        {mail?.configured && mail.verified === false && (
          <div className="quote" style={{ background: "#fff3f0", borderColor: "#eec2b8", margin: "0 0 0.6rem" }}>
            <b className="small">The mail server rejected the connection — {mail.verifyError}</b>
            <div className="small" style={{ marginTop: "0.3rem" }}>
              Usual causes: wrong mailbox password, wrong port/encryption (465 = SSL/TLS, 587 = STARTTLS),
              or the host&rsquo;s SMTP restrictions. Fix the values below, press “Save settings”, then “Check connection”.
            </div>
          </div>
        )}
        {mail?.configured && mail.verified && (
          <p className="small muted" style={{ margin: "0 0 0.6rem" }}>
            Sending as <span className="mono">{mail.from}</span> via <span className="mono">{mail.host}:{mail.port}</span>
            {" "}({mail.secure ? "SSL/TLS" : "STARTTLS"}) · source: {mail.source === "saved" ? "settings saved from this console" : "server environment"}.
            Send yourself a test email to confirm end-to-end delivery:
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

        <details style={{ marginTop: "0.9rem" }} open={!mail?.configured}>
          <summary style={{ cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}> SMTP settings</summary>
          <form onSubmit={saveSmtp} style={{ marginTop: "0.6rem" }}>
            <div className="grid grid-2" style={{ gap: "0.6rem" }}>
              <Field label="Mail server">
                <input value={smtp.host} onChange={(e) => setSmtp((s) => ({ ...s, host: e.target.value }))} placeholder="mail.gill.ac.ug" required />
              </Field>
              <Field label="Port & encryption">
                <select
                  value={`${smtp.port}|${smtp.secure}`}
                  onChange={(e) => {
                    const [port, secure] = e.target.value.split("|");
                    setSmtp((s) => ({ ...s, port, secure }));
                  }}
                >
                  <option value="465|true">465 — SSL/TLS</option>
                  <option value="587|false">587 — STARTTLS</option>
                </select>
              </Field>
              <Field label="Mailbox (username)">
                <input value={smtp.user} onChange={(e) => setSmtp((s) => ({ ...s, user: e.target.value }))} placeholder="noreply@gill.ac.ug" required />
              </Field>
              <Field label="Mailbox password">
                <input
                  type="password" autoComplete="new-password"
                  value={smtp.pass} onChange={(e) => setSmtp((s) => ({ ...s, pass: e.target.value }))}
                  placeholder={mail?.savedSettings ? "unchanged — type to replace" : "the webmail mailbox password"}
                />
              </Field>
            </div>
            <Field label="Sender (from)">
              <input value={smtp.from} onChange={(e) => setSmtp((s) => ({ ...s, from: e.target.value }))} placeholder="Gill School OS <noreply@gill.ac.ug>" />
            </Field>
            <div className="row" style={{ gap: "0.5rem", flexWrap: "wrap", marginTop: "0.2rem" }}>
              <button className="btn sm" disabled={saveBusy}>{saveBusy ? "Saving…" : "Save settings"}</button>
              {mail?.savedSettings && (
                <button type="button" className="btn ghost sm" onClick={forgetSmtp}>Forget saved settings</button>
              )}
            </div>
            {saveMsg && (
              <p className="small" style={{ margin: "0.5rem 0 0", color: saveMsg.ok ? "var(--green)" : "var(--red)" }}>
                {saveMsg.text}
              </p>
            )}
            <p className="small muted" style={{ margin: "0.5rem 0 0" }}>
              Saved to <span className="mono">data/mail.json</span> (alongside the database — never committed to Git,
              never shown again after saving). When nothing is saved here the server environment (panel or
              <span className="mono"> .env</span>) is used instead.
            </p>
          </form>
        </details>
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
          {invite?.setupLink && (
            <div className="quote" style={{ background: "#fffbe8", borderColor: "var(--gold-2)", marginTop: "0.9rem" }}>
              <b className="small">No real email was sent{invite.mailError ? ` — ${invite.mailError}` : ""}.</b>
              <div className="small" style={{ marginTop: "0.3rem" }}>
                Invite code: <span className="mono">{invite.inviteToken}</span>
              </div>
              <div className="small" style={{ marginTop: "0.3rem" }}>
                Setup link: <span className="mono" style={{ wordBreak: "break-all" }}>{invite.setupLink}</span>
              </div>
              <div className="small muted" style={{ marginTop: "0.3rem" }}>
                Open <a href={`/staff/setup?invite=${invite.inviteToken}`}>/staff/setup</a> with this code to finish setting up.
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
