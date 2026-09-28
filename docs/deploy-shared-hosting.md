# Gill School OS — deploy on CrystalCloud shared hosting (`portal.gill.ac.ug`)

> Host the portal itself on the same account as your webmail. Your panel's
> **Add Applications** screen (Node.js app manager) runs the app and maps a
> subdomain to it — no Vercel/VPS needed.

## What you need before starting

- The subdomain `portal.gill.ac.ug` (we create it below).
- Node.js **18.18 or newer** available in the panel (20 or 22 preferred — check
  the *Application type* dropdown; if the newest is older than 18, ask
  CrystalCloud support to enable a newer Node.js).
- The **server's shared/web IP**: `104.194.11.128` (confirmed in Webuzo →
  Domain → Manage Domains). Mail lives on different IPs — use this one for
  `portal` and `webmail` A records.
- The SMTP values from `docs/email-setup.md`.

## Step 1 — create the subdomain (2 min)

1. Webuzo → **Domain → Subdomains** → create `portal.gill.ac.ug` (default
   path `public_html/portal` is fine — leave it; the app itself goes in
   `/home/gillacug/portal` in Step 3, outside the web root).
2. Leave **Force HTTPS OFF** for now — it goes ON after SSL in Step 6.

## Step 2 — point DNS at the server (2 min + propagation)

1. **Vercel → Domains → `gill.ac.ug` → DNS** → add an **A record**:
   - Name: `portal`, value: `104.194.11.128` (confirmed in
     Webuzo → Domain → Manage Domains, the IP column).
   - This overrides the wildcard that currently sends `portal.*` to the website host.
2. Wait ~5 minutes, then check: `portal.gill.ac.ug` should stop showing the
   school website (it may show a default/hosting page until Step 5 — normal).

## Step 3 — upload the app (5 min)

Pick one:

**Option A — Git (recommended, easiest updates):**
1. Panel → **Git™ Version Control** (or use the Terminal/SSH) and clone:
   `https://github.com/iscorockie/Gill-School-OS.git` into `/home/gillacug/portal`.
2. Check out the branch you want live (e.g. `main` once merged).

**Option B — ZIP upload:**
1. On your computer: download the repo as ZIP (Code → Download ZIP).
2. Panel → **File Manager** → upload to `/home/gillacug/portal` → Extract.
3. Delete the ZIP after extracting.

## Step 4 — register the Node.js app (3 min)

Panel → **Applications → Add Applications**, fill exactly:

| Field | Value |
|---|---|
| Application Name | `Gill School OS` |
| Deployment Domain | `portal.gill.ac.ug` |
| Base Application URL | `/` |
| Application Path | `/home/gillacug/portal` |
| Application type | `Node.js` (newest version, ≥ 18.18) |
| Application startup file | `server.js` |
| Deployment Environment | **Production** |
| Start Command | `node server.js` |
| Stop Command | *(leave default/blank)* |
| Port | *(leave the assigned one, e.g. `30008` — the app reads `PORT` automatically)* |

Environment Variables → **Add** each of these:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `APP_URL` | `https://portal.gill.ac.ug` |
| `STAFF_EMAIL_DOMAIN` | `gill.ac.ug` |
| `SMTP_HOST` | `mail.gill.ac.ug` |
| `SMTP_PORT` | `465` |
| `SMTP_SECURE` | `true` |
| `SMTP_USER` | `noreply@gill.ac.ug` |
| `SMTP_PASS` | *(the noreply mailbox password)* |
| `SMTP_FROM` | `Gill School OS <noreply@gill.ac.ug>` |
| `DATA_DIR` *(optional but recommended)* | `/home/gillacug/portal-data` |

> Email note: `SMTP_PASS` is the only *required* mail variable — the host,
> port, mailbox and sender above are the app's built-in defaults. And if the
> panel's variable screen doesn't work, skip `SMTP_*` entirely and save the
> password from **Admin → Staff Accounts →  SMTP settings** (it lands in
> `DATA_DIR/mail.json`, git-ignored) — see `docs/email-setup.md` Part 2.

> `DATA_DIR` keeps the live database **outside** the app folder, so re-uploading
> the app can never wipe school data. Create that folder once in File Manager.

> **There is no demo dataset or demo mode.** The product ships live-only:
> real accounts, live email, codes delivered by email and never shown on
> screen. A fresh database is seeded at first boot (`docs/first-sign-in.md`).

Click **Create**, but don't start the app yet.

## Step 5 — install, build, start (5 min)

In the panel **Terminal** (or SSH), as the account user:

```bash
cd /home/gillacug/portal
node --version            # must be >= 18.18
npm install
npm run build
```

Back in **Applications → List Applications** (or the app row): **Start**.
Open `http://portal.gill.ac.ug` — the portal landing page should load. First
boot seeds the live database (school configuration + staff setup links printed
to the app log — `docs/first-sign-in.md`).

## Step 6 — SSL (2 min)

1. Panel → **SSL** → issue a free certificate (AutoSSL / Let's Encrypt) covering
   `portal.gill.ac.ug`. (DNS from Step 2 must already resolve, or validation fails.)
2. Open `https://portal.gill.ac.ug` — padlock, no warnings.
3. Then **Force HTTPS ON** for the subdomain (Webuzo → Domain → Manage Domains).

### "Your connection isn't private" (`NET::ERR_CERT_AUTHORITY_INVALID`)

The browser is being shown a certificate it can't trace to a trusted CA — on
this panel that almost always means `portal.gill.ac.ug` is still on Webuzo's
**default self-signed certificate** instead of the one issued in Step 6 (same
issue the webmail port has: the fallback cert names the hosting company's
hostname, not yours). **Never advise anyone to click through the warning or
install a certificate by hand** — fix it on the server instead:

1. Webuzo → **SSL** (or SSL/TLS → Manage SSL) → issue/renew the free
   certificate for `portal.gill.ac.ug` (AutoSSL or Let's Encrypt).
   - The certificate must list `portal.gill.ac.ug` among its names.
   - If AutoSSL reports "issued" but the browser still warns, the site vhost is
     not using the certificate yet — Webuzo → Domain → Manage Domains →
     `portal.gill.ac.ug` → SSL ON / select the certificate, or ask CrystalCloud
     support to attach it (see the message below).
2. The **full chain** must be installed (the panel usually does this). A missing
   intermediate certificate looks exactly like `ERR_CERT_AUTHORITY_INVALID`.
3. Verify from a phone on mobile data (not the school Wi-Fi, to rule out a
   proxy): `https://portal.gill.ac.ug/api/state` should return JSON with a
   padlock, and `https://portal.gill.ac.ug/login` should land on the Parent
   Portal sign-in.
4. Only after the padlock shows, turn **Force HTTPS ON**.

If AutoSSL claims success but the warning persists, send CrystalCloud support:

> Please install the issued SSL certificate (with the intermediate/CA bundle)
> for `portal.gill.ac.ug` on its web vhost — browsers currently show
> `NET::ERR_CERT_AUTHORITY_INVALID`, so the site is serving the default
> self-signed certificate instead of ours.

Meanwhile, parents who hit the warning should **wait for the fix — not enter
their password on a page with a certificate warning, and not click
"Advanced → Proceed"**. Sign-in URLs (all under `https://portal.gill.ac.ug`):

| Who | URL |
|---|---|
| Parents | `/portal/login` — the short link `/login` redirects there |
| Students | `/student/login` |
| Admin / Bursar / Admissions | `/admin` |
| Staff | `/staff` |

## Step 7 — go-live checklist (launch day)

- [ ] Factory-reset any old database with demo records: stop the app, delete
      `DATA_DIR/db.json`, start — the console prints fresh one-time staff
      setup links (`docs/first-sign-in.md`).
- [ ] Sign in at `/admin` as the Head of School via your printed
      `/staff/setup?invite=…` link (choose the portal password there).
- [ ] **Admin → Staff Accounts → Send test email** to yourself — confirms SMTP.
- [ ] Share each remaining staff member their setup link (visible in Staff
      Accounts), or let them use **Forgot password** once SMTP works.
- [ ] **Admin → Security → Force password reset for everyone** — if any
      account was ever created outside the setup-link flow.
- [ ] Confirm DNS is complete (`docs/dns.md`) and the SSL padlock shows (Step 6)
      from a phone on mobile data.
- [ ] Panel → **Backuply** (or Backup): schedule backups including `portal-data`
      (or `portal/data/db.json` if you skipped `DATA_DIR`).
- [ ] Families self-register at `/register` — live mode contains no demo
      families; admit real applicants through the normal flow.

## If the site shows a "50X error" (Webuzo page)

That page means the panel's proxy can't reach the app — the Node process is
down, not built, or not listening where the proxy expects it. Work through:

1. **Is the app started?** Panel → Applications → List Applications → the row
   for `Gill School OS` → **Start** (or **Restart** after any change).
2. **Read the app log** (the panel's log/console link for the app). The
   launcher prints `[gill-os] …` lines that name the exact problem:
   - `No production build found` → in the panel **Terminal**:
     `cd /home/gillacug/portal && npm install && npm run build`, then **Start**.
   - `Node.js X.Y.Z is too old` → Application type → pick **Node 20 or 22** → Start.
   - `failed to listen on … (EADDRINUSE)` → the panel's `PORT` doesn't match
     what the app read — check the Environment Variables, then **Restart**.
   - `ready on http://0.0.0.0:…` → the app is healthy; the 50X is then the
     proxy/DNS side — confirm the Deployment Domain is `portal.gill.ac.ug`
     and that DNS still points at the server IP.
3. **Environment variables are read at boot** — after adding/changing any
   (SMTP_*, DATA_DIR, …) always **Restart** the app.
4. The launcher binds `0.0.0.0` automatically (a stray `HOSTNAME` variable
   from the panel can't break it anymore; set `BIND_HOST` only if you really
   want a specific interface).

Health check from anywhere: `https://portal.gill.ac.ug/api/state` should
return JSON (not the Webuzo error page).

## Updating later

```bash
cd /home/gillacug/portal
git pull              # or re-upload the ZIP (never touch DATA_DIR)
npm install
npm run build
```

Then **Restart** the app in the panel. `data/db.json` (or `DATA_DIR`) is
untouched by deploys, so no data is lost. `node server.js` refuses to start
without a fresh build and says exactly what's missing.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `No production build found` in the app log | Run `npm install && npm run build` in `/home/gillacug/portal`, then Restart. |
| `portal.gill.ac.ug` shows the school website | DNS still on the wildcard — check the Vercel A record is `portal` → `104.194.11.128`, and wait out propagation (up to ~30 min). |
| `503 / app won't start` | Open the app log in the panel: wrong Node.js version (< 18.18) is the usual cause — switch *Application type* to Node 20/22 and Restart. |
| `SMTP … failed` in Admin → Communications → Delivery log | Re-check `SMTP_*` variables (host `mail.gill.ac.ug`, port `465`, full `noreply@` username). Test from webmail first to prove the mailbox works. |
| Invite/reset emails land in spam (or Gmail bounces) | Finish SPF + DKIM from `docs/email-setup.md` — same fix as webmail. |
| Data resets after redeploy | You re-uploaded over `data/` — move to `DATA_DIR=/home/gillacug/portal-data` (Step 4) and restore `db.json` from backup. |
