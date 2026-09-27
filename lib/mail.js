// Gill School OS — cPanel webmail (SMTP) integration.
//
// Every email the portal sends (staff invites, verification codes, password
// resets, receipts, welcome notes) goes through sendMail() here.
//
// Configuration (env — see .env.example):
//   SMTP_HOST=m.gill.ac.ug   SMTP_PORT=465   SMTP_SECURE=true
//   SMTP_USER=noreply@gill.ac.ug   SMTP_PASS=xxxx
//   SMTP_FROM=Gill School OS <noreply@gill.ac.ug>
//   APP_URL=https://portal.gill.ac.ug   (links printed inside emails)
//
// When SMTP is NOT configured the mailer runs in *simulated* mode: nothing is
// sent, every email is recorded in the deliveries log, and verification codes
// are returned to the UI so the demo keeps working offline.

import nodemailer from "nodemailer";

let transporter = null;

export function mailConfig() {
  const host = (process.env.SMTP_HOST || "").trim();
  const port = Number(process.env.SMTP_PORT || 465);
  const secure =
    typeof process.env.SMTP_SECURE === "string"
      ? process.env.SMTP_SECURE.toLowerCase() !== "false"
      : port === 465;
  const user = (process.env.SMTP_USER || "").trim();
  const pass = process.env.SMTP_PASS || "";
  const from =
    (process.env.SMTP_FROM || "").trim() ||
    (user ? `Gill School OS <${user}>` : "Gill School OS <noreply@gill.ac.ug>");
  return { host, port, secure, user, pass, from, configured: Boolean(host && user && pass) };
}

export function isMailConfigured() {
  return mailConfig().configured;
}

export function portalBaseUrl(fallback) {
  return (
    (process.env.APP_URL || "").trim().replace(/\/$/, "") ||
    fallback ||
    "https://portal.gill.ac.ug"
  );
}

function getTransport() {
  const c = mailConfig();
  if (!c.configured) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: c.host,
      port: c.port,
      secure: c.secure,
      auth: { user: c.user, pass: c.pass },
    });
  }
  return transporter;
}

export function mailProviderLabel() {
  const c = mailConfig();
  return c.configured ? `cPanel SMTP ${c.host} (live)` : "School mail relay (simulated)";
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
