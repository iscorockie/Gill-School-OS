"use client";
// Personalised family mailbox (Webuzo) — shared bursar/admin control.
//
// Access policy, enforced here AND in lib/actions.js:
//   • A normal (personal) email is enough for the Parent OS from registration.
//   • The personalised @gill.ac.ug Webuzo mailbox is NEVER handed out at
//     random — only the Bursar or an admin can issue it, and only once the
//     family has applied for their child AND tuition is completed.
//   • The issued address then works on BOTH the Parent OS and Webuzo webmail.

import { useState } from "react";
import { useApp, Modal, Field } from "@/components/ui.jsx";

export function familyMailEligibility(db, familyId) {
  const fam = db.families.find((f) => f.id === familyId);
  const account = (db.familyAccounts || []).find((a) => a.familyId === familyId) || null;
  const apps = db.applications.filter((a) => db.studentIndex[a.studentId]?.familyId === familyId);
  const appliedOK = apps.some((a) => a.status === "applied" || a.status === "activated");
  const invoices = db.invoices.filter((i) => i.familyId === familyId);
  const outstanding = invoices.reduce((s, i) => s + Math.max(0, i.balance || 0), 0);
  const tuitionOK = invoices.length > 0 && invoices.some((i) => i.total > 0) && outstanding === 0;
  const recipients = [
    ...new Set(
      (account?.members || [])
        .map((id) => db.users.find((u) => u.id === id)?.email)
        .filter((e) => e && /.+@.+\..+/.test(e))
        .map((e) => e.toLowerCase())
    ),
  ];
  const issued = account?.schoolEmail || null;
  const blockers = [];
  if (!account) blockers.push("the family has no OS account yet");
  if (!appliedOK) blockers.push("waiting on the application for their child");
  if (!tuitionOK) blockers.push(invoices.length ? `tuition incomplete — UGX ${outstanding.toLocaleString()} outstanding` : "no tuition billed/paid yet");
  if (!recipients.length) blockers.push("no parent email on file");
  return { fam, account, appliedOK, tuitionOK, outstanding, recipients, issued, eligible: blockers.length === 0, blockers };
}

// Mirror of the server-side suggestion (kept tiny + deterministic-ish).
export function suggestSchoolEmail(db, familyId) {
  const g = familyMailEligibility(db, familyId);
  const domain = "gill.ac.ug";
  const primary = db.users.find((u) => u.id === g.fam?.parentUserId) || {};
  const slug = String(primary.name || g.fam?.name || "family")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  const taken = (addr) =>
    (db.familyAccounts || []).some((x) => (x.schoolEmail?.address || "").toLowerCase() === addr) ||
    (db.staffAccounts || []).some((x) => (x.email || "").toLowerCase() === addr);
  let addr = `${slug}@${domain}`;
  let n = 2;
  while (taken(addr)) addr = `${slug}${n++}@${domain}`;
  return addr;
}

const ALPHA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function newPassword() {
  const chunk = () => Array.from({ length: 4 }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join("");
  return `Gill-${chunk()}-${chunk()}`;
}

export function SchoolEmailControl({ db, familyId, actor }) {
  const { act } = useApp();
  const [open, setOpen] = useState(false);
  const [addr, setAddr] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [justSent, setJustSent] = useState(null);

  const g = familyMailEligibility(db, familyId);

  function openModal() {
    setAddr(suggestSchoolEmail(db, familyId));
    setPass(newPassword());
    setJustSent(null);
    setOpen(true);
  }

  async function issue() {
    setBusy(true);
    try {
      const r = await act(
        "issuePersonalisedEmail",
        { familyId, address: addr.trim(), password: pass.trim(), actor },
        `Personalised email issued — ${addr.trim()} · sent to ${g.recipients.length} parent email(s).`
      );
      setJustSent(r);
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setBusy(true);
    try {
      await act(
        "resendPersonalisedEmail",
        { familyId, actor },
        `Personalised email reminder re-sent to ${g.recipients.length} parent email(s).`
      );
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (g.issued) {
    return (
      <div className="small" style={{ textAlign: "right" }}>
        <div className="mono" style={{ fontSize: "0.82rem", color: "var(--maroon)", fontWeight: 700 }}>{g.issued.address}</div>
        <div className="small muted" style={{ marginBottom: "0.35rem" }}>
          issued {g.issued.issuedAt?.slice(0, 10)} · {g.issued.provisioning === "webuzo" ? "Webuzo API" : "Webuzo manual"}
        </div>
        <button className="btn ghost sm" disabled={busy} onClick={resend}>Re-send to parents</button>
      </div>
    );
  }

  return (
    <>
      <div style={{ textAlign: "right" }}>
        {g.eligible ? (
          <button className="btn sm" disabled={busy} onClick={openModal}> Send personalised email</button>
        ) : (
          <div className="small muted" style={{ maxWidth: 260 }}>
            <button className="btn sm" disabled title={g.blockers.join(" · ")} style={{ opacity: 0.45, cursor: "not-allowed" }}>
              Send personalised email
            </button>
            <div style={{ marginTop: "0.3rem" }}>Unlocks when: applied + tuition completed{g.recipients.length ? "" : " + parent email on file"}.</div>
          </div>
        )}
      </div>

      {open && (
        <Modal title="Issue personalised Gill email" onClose={() => setOpen(false)}>
          {justSent ? (
            <div>
              <div className="quote" style={{ background: "var(--peri-l)", borderColor: "var(--maroon-2)" }}>
                <b>Issued — {justSent.address}</b>
                <div className="small" style={{ marginTop: "0.4rem" }}>
                  Sent to {justSent.sentTo.join(", ")}.
                  {justSent.provisioning === "manual" && " Create the same mailbox in Webuzo → Email Accounts if you haven't already (use the password above)."}
                </div>
              </div>
              <button className="btn" style={{ width: "100%", marginTop: "0.8rem" }} onClick={() => setOpen(false)}>Done</button>
            </div>
          ) : (
            <div>
              <div className="quote" style={{ marginBottom: "0.9rem" }}>
                This family completed their application and tuition — the moment the parent has been waiting for.
                <div className="small muted" style={{ marginTop: "0.35rem" }}>
                  The address works on <b>both</b> the Parent OS (with their usual portal password) and <b>Webuzo webmail</b> (with the webmail password).
                  Their normal email keeps working on the OS too.
                </div>
              </div>

              <Field label="School mailbox address">
                <input value={addr} onChange={(e) => setAddr(e.target.value)} spellCheck={false} />
              </Field>
              <Field label="Webmail password (shown to the parents once)">
                <div className="row" style={{ gap: "0.5rem" }}>
                  <input value={pass} onChange={(e) => setPass(e.target.value)} spellCheck={false} style={{ flex: 1 }} />
                  <button className="btn secondary sm" type="button" onClick={() => setPass(newPassword())}>↻ New</button>
                </div>
              </Field>

              <div className="small muted" style={{ margin: "0.2rem 0 0.8rem" }}>
                Sent to: {g.recipients.join(", ")}
              </div>

              <div className="quote" style={{ background: "var(--gold-l, #fdf6e7)", borderColor: "var(--gold, #b98a2f)" }}>
                <b>Webuzo mailbox:</b>
                <div className="small" style={{ marginTop: "0.25rem" }}>
                  If the Webuzo API is connected (<code>WEBUZO_API_URL</code> + <code>WEBUZO_API_TOKEN</code>, see docs/email-setup.md) the mailbox is
                  created automatically. Otherwise create it first in <b>Webuzo → Email Accounts</b> with this same password — exactly like staff mailboxes.
                </div>
              </div>

              <button className="btn" style={{ width: "100%", marginTop: "0.9rem" }} disabled={busy || !addr.trim() || pass.trim().length < 8} onClick={issue}>
                {busy ? "Issuing…" : "Issue & send to parents"}
              </button>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
