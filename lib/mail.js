// Gill School OS — cPanel webmail (SMTP) integration.
//
// Every email the portal sends (staff invites, verification codes, password
// resets, receipts, welcome notes) goes through sendMail() here.
//
// Activation — the school's mail server is fixed (mail.gill.ac.ug), so the
// ONLY secret needed is the noreply mailbox password. It can be provided in
// any of these ways (later sources win per setting):
//
//   1. Built-in defaults (below)  → host/port/user/from are already correct
//   2. Server environment         → SMTP_* / APP_URL (panel env vars or .env;
//      server.js loads .env explicitly) — set at least SMTP_PASS
//   3. Admin → Staff Accounts     → "School email (SMTP) status" card saves
//      the settings to DATA_DIR/mail.json (git-ignored, chmod 600). Saved
//      settings override the environment, so a wrong panel value can be fixed
//      from the console without a redeploy.
//
// When NO password is available nothing is sent: sends return
// { ok: false, simulated: true } and callers log "Not sent" honestly. Codes
// and credentials are delivered by live email only — never shown on screen.

import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";

// Non-secret school defaults (see docs/email-setup.md).
const DEFAULTS = {
  host: "mail.gill.ac.ug",
  port: 465,
  secure: true,
  user: "noreply@gill.ac.ug",
  from: "Gill School OS <noreply@gill.ac.ug>",
  appUrl: "https://portal.gill.ac.ug",
};

function dataDir() {
  return process.env.DATA_DIR || path.join(process.cwd(), "data");
}

function savedFile() {
  return path.join(dataDir(), "mail.json");
}

// ---- Saved settings (DATA_DIR/mail.json) ---------------------------------
let savedCache = { mtimeMs: -1, data: null };

function savedMailConfig() {
  try {
    const st = fs.statSync(savedFile());
    if (savedCache.data && savedCache.mtimeMs === st.mtimeMs) return savedCache.data;
    const data = JSON.parse(fs.readFileSync(savedFile(), "utf8"));
    savedCache = { mtimeMs: st.mtimeMs, data };
    return data;
  } catch {
    savedCache = { mtimeMs: -1, data: null };
    return null;
  }
}

function resetSavedCache() {
  savedCache = { mtimeMs: -1, data: null };
}

export function saveMailConfig(patch = {}) {
  const next = { ...(savedMailConfig() || {}) };
  for (const [k, v] of Object.entries(patch)) {
    if (v == null) continue;
    const s = String(v).trim();
    // Blank values never erase an existing setting (a blank password field
    // simply keeps the password already on file).
    if (!s) continue;
    if (k === "port") {
      const n = Number(s);
      if (!Number.isInteger(n) || n < 1 || n > 65535) throw new Error("SMTP port must be a number between 1 and 65535.");
      next.port = n;
    } else if (k === "secure") {
      next.secure = String(s).toLowerCase() !== "false";
    } else {
      next[k] = s;
    }
  }
  try {
    if (!fs.existsSync(dataDir())) fs.mkdirSync(dataDir(), { recursive: true });
    fs.writeFileSync(savedFile(), JSON.stringify(next, null, 2), { mode: 0o600 });
    try { fs.chmodSync(savedFile(), 0o600); } catch { /* best effort */ }
  } catch (e) {
    throw new Error(`Could not save the SMTP settings (${e?.code || e?.message}). On serverless hosts set SMTP_* as environment variables instead.`);
  }
  resetSavedCache();
  resetTransport();
  return mailStatus();
}

export function clearMailConfig() {
  try { fs.unlinkSync(savedFile()); } catch { /* already gone */ }
  resetSavedCache();
  resetTransport();
  return mailStatus();
}

// ---- Effective configuration ---------------------------------------------
function pick(savedVal, envVal, dflt) {
  const s = typeof savedVal === "string" ? savedVal.trim() : savedVal == null ? "" : String(savedVal).trim();
  if (s) return s;
  const e = typeof envVal === "string" ? envVal.trim() : "";
  if (e) return e;
  return dflt;
}

export function mailConfig() {
  const saved = savedMailConfig() || {};
  const host = pick(saved.host, process.env.SMTP_HOST, DEFAULTS.host);
  const port = Number(pick(saved.port, process.env.SMTP_PORT, String(DEFAULTS.port))) || DEFAULTS.port;
  const secureRaw = pick(saved.secure, process.env.SMTP_SECURE, "");
  const secure = secureRaw ? secureRaw.toLowerCase() !== "false" : port === 465;
  const user = pick(saved.user, process.env.SMTP_USER, DEFAULTS.user);
  const pass = pick(saved.pass, process.env.SMTP_PASS, "");
  const from = pick(saved.from, process.env.SMTP_FROM, user === DEFAULTS.user ? DEFAULTS.from : `Gill School OS <${user}>`);
  const appUrl = pick(saved.appUrl, process.env.APP_URL, DEFAULTS.appUrl);
  const source = pick(saved.pass, "", "") ? "saved" : (process.env.SMTP_PASS || "").trim() ? "env" : "none";
  return { host, port, secure, user, pass, from, appUrl, configured: Boolean(host && user && pass), source };
}

// Non-secret summary for the admin console / API (never includes the password).
export function mailStatus() {
  const c = mailConfig();
  return {
    configured: c.configured,
    host: c.host,
    port: c.port,
    secure: c.secure,
    user: c.user,
    from: c.from,
    appUrl: c.appUrl,
    source: c.source,
    savedSettings: Boolean(savedMailConfig()),
  };
}

export function isMailConfigured() {
  return mailConfig().configured;
}

export function portalBaseUrl(fallback) {
  const saved = savedMailConfig() || {};
  const explicit = pick(saved.appUrl, process.env.APP_URL, "");
  return (explicit || fallback || DEFAULTS.appUrl).replace(/\/$/, "");
}

// ---- Transport -----------------------------------------------------------
let transporter = null;
let transporterKey = "";

function resetTransport() {
  transporter = null;
  transporterKey = "";
}

function getTransport() {
  const c = mailConfig();
  if (!c.configured) return null;
  const key = `${c.host}:${c.port}:${c.secure}:${c.user}:${c.pass}`;
  if (!transporter || transporterKey !== key) {
    transporter = nodemailer.createTransport({
      host: c.host,
      port: c.port,
      secure: c.secure,
      auth: { user: c.user, pass: c.pass },
      // Timeouts keep a dead mail server from hanging admin actions.
      connectionTimeout: 10_000,
      greetingTimeout: 8_000,
      socketTimeout: 20_000,
    });
    transporterKey = key;
  }
  return transporter;
}

export function mailProviderLabel() {
  const c = mailConfig();
  return c.configured ? `cPanel SMTP ${c.host} (live)` : "School mail relay (simulated)";
}

// Live connection check (EHLO + auth). Never throws.
export async function verifyMailConnection() {
  const c = mailConfig();
  if (!c.configured) {
    return { ok: false, simulated: true, error: "SMTP is not configured — no mailbox password is set." };
  }
  try {
    await getTransport().verify();
    return { ok: true, host: c.host, port: c.port, user: c.user };
  } catch (e) {
    return { ok: false, error: e?.message || "SMTP verification failed" };
  }
}

// Low-level send. Never throws — failures come back as { ok:false } so a
// mail outage can never break a portal flow; the caller logs the delivery.
export async function sendMail({ to, subject, text, html }) {
  const c = mailConfig();
  if (!c.configured) return { ok: false, simulated: true };
  try {
    const info = await getTransport().sendMail({
      from: c.from,
      to,
      subject,
      text: text || "",
      html: html || `<p>${String(text || "").replace(/\n/g, "<br>")}</p>`,
    });
    return { ok: true, simulated: false, messageId: info.messageId };
  } catch (e) {
    return { ok: false, simulated: false, error: e?.message || "SMTP send failed" };
  }
}

function shell(title, intro, rows, outro) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#222">
    <div style="background:#6b1f2a;color:#fff;padding:18px 22px;border-radius:10px 10px 0 0">
      <div style="font-size:18px;font-weight:bold">Gill School OS</div>
      <div style="font-size:12px;opacity:.85">Gill International School · Najjera, Kampala</div>
    </div>
    <div style="border:1px solid #e5dfe0;border-top:none;padding:20px 22px;border-radius:0 0 10px 10px">
      <h2 style="margin:0 0 10px;font-size:18px;color:#6b1f2a">${title}</h2>
      <p style="font-size:14px;line-height:1.6">${intro}</p>
      ${rows}
      ${outro ? `<p style="font-size:13px;color:#555;line-height:1.6">${outro}</p>` : ""}
      <p style="font-size:12px;color:#888;margin-top:18px">This email was sent by the Gill School OS portal. If you didn't expect it, please contact the school office.</p>
    </div>
  </div>`;
}

function codeBlock(code) {
  return `<div style="text-align:center;margin:16px 0"><span style="display:inline-block;font-size:28px;letter-spacing:8px;font-weight:bold;background:#f6f1ec;border:1px dashed #b98a2f;border-radius:8px;padding:10px 18px 10px 26px">${code}</span></div>`;
}

function button(href, label) {
  return `<div style="text-align:center;margin:16px 0"><a href="${href}" style="display:inline-block;background:#6b1f2a;color:#fff;text-decoration:none;font-size:14px;font-weight:bold;padding:11px 26px;border-radius:8px">${label}</a></div>`;
}

export async function sendVerificationCode({ to, name, code, portalLabel }) {
  const subject = `Your Gill School OS verification code: ${code}`;
  const text =
    `Hello ${name},\n\nYour ${portalLabel} verification code is: ${code}\n\nIt expires in 10 minutes. Enter it in the portal to continue.\n\n— Gill International School, Najjera`;
  return sendMail({
    to,
    subject,
    text,
    html: shell(
      "Verify it's you",
      `Hello ${name}, use this code to continue in the <b>${portalLabel}</b>. It expires in <b>10 minutes</b>.`,
      codeBlock(code),
      "Never share this code with anyone. The school will never ask for it by phone."
    ),
  });
}

export async function sendStaffInvite({ to, name, roleLabel, setupLink }) {
  const subject = "Your Gill School OS staff account is ready";
  const text =
    `Hello ${name},\n\nYour ${roleLabel} account on Gill School OS is ready.\n\nOpen this link to set your password and sign in:\n${setupLink}\n\nYour sign-in email is ${to}. This invite link is personal — please don't forward it.\n\n— Gill International School, Najjera`;
  return sendMail({
    to,
    subject,
    text,
    html: shell(
      "Your staff account is ready",
      `Hello ${name}, your <b>${roleLabel}</b> account on Gill School OS is ready. Your sign-in email is <b>${to}</b>.`,
      button(setupLink, "Set my password & sign in") +
        `<p style="font-size:12px;color:#555">Or paste this link into your browser:<br><span style="word-break:break-all">${setupLink}</span></p>`,
      "This invite link is personal — please don't forward it. If it expires, ask the Head of School to re-send it."
    ),
  });
}

export async function sendPasswordReset({ to, name, code, portalLabel }) {
  const subject = `Reset your Gill School OS password: ${code}`;
  const text =
    `Hello ${name},\n\nSomeone requested a password reset for your ${portalLabel} account.\n\nYour reset code is: ${code}\n\nIt expires in 15 minutes. If you didn't ask for this, ignore this email — your password stays unchanged.\n\n— Gill International School, Najjera`;
  return sendMail({
    to,
    subject,
    text,
    html: shell(
      "Reset your password",
      `Hello ${name}, someone requested a reset for your <b>${portalLabel}</b> account. Use this code — it expires in <b>15 minutes</b>.`,
      codeBlock(code),
      "If you didn't ask for this, just ignore this email — your password stays unchanged."
    ),
  });
}

export async function sendWelcomeFamily({ to, name, username, portalLink }) {
  const subject = "Welcome to Gill School OS — your family account";
  const text =
    `Hello ${name},\n\nYour Gill family account (${username}) is created.\n\nSign in any time at:\n${portalLink}\n\nOnce Admissions verifies your application and tuition is cleared, your full parent portal opens automatically.\n\n— Gill International School, Najjera`;
  return sendMail({
    to,
    subject,
    text,
    html: shell(
      "Welcome to Gill School OS",
      `Hello ${name}, your family account <b>${username}</b> is created.`,
      button(portalLink, "Open the Parent Portal") +
        `<p style="font-size:12px;color:#555">Or paste this link into your browser:<br><span style="word-break:break-all">${portalLink}</span></p>`,
      "Once Admissions verifies your application and tuition is cleared, your full parent portal opens automatically."
    ),
  });
}

// --- Personalised family mailboxes (Webuzo) ---------------------------------
// A family's personalised school mailbox is NEVER created at registration or
// handed out at random. The Bursar/Admin issues it only after the family has
// applied for their child AND tuition is completed (issuePersonalisedEmail in
// lib/actions.js). The mailbox lives in Webuzo webmail; the same address also
// signs the family into the Parent OS (webmail password ≠ portal password).

export function webmailUrl() {
  return String(process.env.WEBMAIL_URL || "https://webmail.gill.ac.ug:2003/").trim();
}

function parseApiJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// Optional Webuzo/cPanel UAPI provisioning (WEBUZO_API_URL + WEBUZO_API_TOKEN).
// Without those the mailbox is created by hand in the Webuzo panel (exactly
// like staff mailboxes) and this reports "manual" mode — the OS still records
// the issue and emails the parents their credentials.
export async function provisionSchoolMailbox({ address, password }) {
  const base = String(process.env.WEBUZO_API_URL || "").trim().replace(/\/$/, "");
  const token = String(process.env.WEBUZO_API_TOKEN || "").trim();
  if (!base || !token) return { ok: true, provisioned: false, simulated: true };
  const [local, domain] = String(address).split("@");
  const call = (fn, params) =>
    fetch(`${base}/execute/Email/${fn}`, {
      method: "POST",
      headers: {
        Authorization: `cpanel ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(params),
    }).then(async (r) => ({ status: r.status, body: await r.text() }));
  try {
    const r = await call("add_pop", { email: local, domain, password, quota: "1024" });
    const data = parseApiJson(r.body);
    const ok = data?.status === 1 || data?.result?.status === 1;
    if (ok) return { ok: true, provisioned: true };
    const raw = r.body.toLowerCase();
    // Already exists → align the password, then treat as an idempotent success.
    if (raw.includes("already") || raw.includes("exists")) {
      await call("passwd_pop", { email: local, domain, password });
      return { ok: true, provisioned: true, existed: true };
    }
    const errors = data?.errors || data?.result?.errors || data?.error || data?.result?.error;
    return { ok: false, error: Array.isArray(errors) ? errors.join("; ") : String(errors || `Webuzo API error (HTTP ${r.status})`) };
  } catch (e) {
    return { ok: false, error: e?.message || "Webuzo API unreachable" };
  }
}

export async function sendApplicationReceived({ to, name, childName, schoolId, intake, portalLink, resubmit }) {
  const subject = resubmit
    ? `Application updated — ${childName} (${schoolId})`
    : `Application received — ${childName} (${schoolId})`;
  const intro = resubmit
    ? `Hello ${name}, thank you — we received your updated application for <b>${childName}</b> (${schoolId}) for <b>${intake}</b>. The Admissions team will re-check your records.`
    : `Hello ${name}, thank you — we received your application for <b>${childName}</b> (${schoolId}) for <b>${intake}</b>. Our Admissions team will verify your documents and confirm.`;
  const text =
    `Hello ${name},\n\n` +
    (resubmit
      ? `We received your updated application for ${childName} (${schoolId}) for ${intake}. The Admissions team will re-check your records.\n`
      : `We received your application for ${childName} (${schoolId}) for ${intake}. Our Admissions team will verify your documents and confirm.\n`) +
    `\nWhat happens next:\n1. Admissions verifies your documents.\n2. Tuition is cleared (see the invoice in the portal).\n3. The Bursar/Admin then issues your personalised Gill email, which works on both the Parent OS and Webuzo webmail.\n\nYour normal email keeps working on the Parent OS throughout.\n\nTrack everything any time:\n${portalLink}\n\n— Admissions, Gill International School, Najjera`;
  return sendMail({
    to,
    subject,
    text,
    html: shell(
      resubmit ? "Application updated" : "Application received",
      intro,
      `<table style="font-size:14px;margin:8px 0 4px"><tr><td style="color:#555;padding:4px 12px 4px 0">Child</td><td><b>${childName}</b> (${schoolId})</td></tr><tr><td style="color:#555;padding:4px 12px 4px 0">Intake</td><td><b>${intake}</b></td></tr></table>
       <p style="font-size:13px;color:#555;line-height:1.7"><b>What happens next:</b><br>1. Admissions verifies your documents.<br>2. Tuition is cleared (see the invoice in the portal).<br>3. The Bursar/Admin then issues your personalised Gill email, which works on both the Parent OS and Webuzo webmail.</p>`,
      `Your normal email keeps working on the Parent OS throughout.` + button(portalLink, "Track my application")
    ),
  });
}

export async function sendPersonalisedMailbox({ to, name, address, webmailPassword, webmailLink, portalLink, username }) {
  const issued = !!webmailPassword;
  const wUrl = webmailLink || webmailUrl();
  const subject = issued
    ? `Your personalised Gill email — ${address}`
    : `Reminder — your personalised Gill email: ${address}`;
  const text =
    `Hello ${name},\n\n` +
    (issued
      ? `As promised after your application and tuition were completed, here is your personalised Gill email. It works on both the Parent OS and Webuzo webmail:\n`
      : `A reminder of your personalised Gill email — it works on both the Parent OS and Webuzo webmail:\n`) +
    `\nEmail address: ${address}\n` +
    (issued ? `Webmail password: ${webmailPassword}\n` : `Webmail password: the one set when the mailbox was issued (ask the Bursar to reset it in Webuzo if forgotten)\n`) +
    `\nWebuzo webmail (Roundcube): ${wUrl}\n  sign in with ${address} + the webmail password above.\n\nParent OS: ${portalLink}\n  sign in with ${address} (or the family login "${username}") + your usual portal password.\n\nThe webmail password and the portal password are separate — resetting one never locks the other.\n\n— Gill International School, Najjera`;
  const rows =
    `<table style="font-size:14px;margin:8px 0 4px">
      <tr><td style="color:#555;padding:4px 12px 4px 0">Email address</td><td><b>${address}</b></td></tr>
      <tr><td style="color:#555;padding:4px 12px 4px 0">Webmail password</td><td><b>${issued ? webmailPassword : "set at issuance — ask the Bursar to reset in Webuzo"}</b></td></tr>
      <tr><td style="color:#555;padding:4px 12px 4px 0">Webuzo webmail</td><td><a href="${wUrl}">${wUrl}</a></td></tr>
      <tr><td style="color:#555;padding:4px 12px 4px 0">Parent OS</td><td><a href="${portalLink}">${portalLink}</a></td></tr>
    </table>`;
  return sendMail({
    to,
    subject,
    text,
    html: shell(
      issued ? "Your personalised Gill email is ready" : "Your personalised Gill email",
      issued
        ? `Hello ${name}, as promised after your application and tuition were completed, here is your personalised Gill email. <b>It works on both the Parent OS and Webuzo webmail.</b>`
        : `Hello ${name}, a reminder of your personalised Gill email. <b>It works on both the Parent OS and Webuzo webmail.</b>`,
      rows,
      `On <b>Webuzo webmail</b> sign in with the webmail password; on the <b>Parent OS</b> use the same address with your usual portal password (family login "${username}" still works too). The two passwords are separate — resetting one never locks the other.`
    ),
  });
}

export async function sendReceipt({ to, name, amount, receipt, balance, portalLink }) {
  const subject = `Payment receipt ${receipt} — Gill International School`;
  const text =
    `Hello ${name},\n\nThank you! Your payment of UGX ${Number(amount).toLocaleString()} was received and reconciled.\n\nReceipt: ${receipt}\nRemaining balance: UGX ${Number(balance).toLocaleString()}\n\nView it any time in the Parent Portal:\n${portalLink}\n\n— Bursar, Gill International School`;
  return sendMail({
    to,
    subject,
    text,
    html: shell(
      "Payment received — thank you",
      `Hello ${name}, your payment of <b>UGX ${Number(amount).toLocaleString()}</b> was received and reconciled.`,
      `<table style="font-size:14px;margin:8px 0 4px"><tr><td style="color:#555;padding:4px 12px 4px 0">Receipt</td><td><b>${receipt}</b></td></tr><tr><td style="color:#555;padding:4px 12px 4px 0">Remaining balance</td><td><b>UGX ${Number(balance).toLocaleString()}</b></td></tr></table>`,
      `View it any time in the <a href="${portalLink}">Parent Portal</a>.`
    ),
  });
}
