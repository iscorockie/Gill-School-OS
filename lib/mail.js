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
// When NO password is available the mailer runs in *simulated* mode: nothing
// is sent, every email is recorded in the deliveries log, and verification
// codes are returned to the UI so the demo keeps working offline.

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
