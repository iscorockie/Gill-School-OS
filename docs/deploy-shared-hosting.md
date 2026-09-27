# Gill School OS — deploy on CrystalCloud shared hosting (`portal.gill.ac.ug`)

> Host the portal itself on the same account as your webmail. Your panel's
> **Add Applications** screen (Node.js app manager) runs the app and maps a
> subdomain to it — no Vercel/VPS needed.

## What you need before starting

- The subdomain `portal.gill.ac.ug` (we create it below).
- Node.js **18.18 or newer** available in the panel (20 or 22 preferred — check
  the *Application type* dropdown; if the newest is older than 18, ask
  CrystalCloud support to enable a newer Node.js).
- The **server's shared/web IP** (shown in the panel sidebar as *Shared IP* /
  *Server IP*, or ask support). Mail lives on different IPs — use the web one.
- The SMTP values from `docs/email-setup.md`.

## Step 1 — create the subdomain (2 min)

1. Panel → **Domains** (or *Subdomains*) → create `portal.gill.ac.ug`.
2. Point its document root anywhere harmless (e.g. `portal_html`) — the Node.js
   app manager, not the document root, will serve it.

## Step 2 — point DNS at the server (2 min + propagation)

1. **Vercel → Domains → `gill.ac.ug` → DNS** → add an **A record**:
   - Name: `portal`, value: the **shared/web IP** from the panel.
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

> `DATA_DIR` keeps the live database **outside** the app folder, so re-uploading
> the app can never wipe school data. Create that folder once in File Manager.

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
boot seeds demo data automatically.

## Step 6 — SSL (2 min)

1. Panel → **SSL** → issue a free certificate (AutoSSL / Let's Encrypt) covering
   `portal.gill.ac.ug`. (DNS from Step 2 must already resolve, or validation fails.)
2. Open `https://portal.gill.ac.ug` — padlock, no warnings.

## Step 7 — go-live checklist (launch day)

- [ ] Sign in at `/admin` (`f.ssekandi@gill.ac.ug` / `gill2026`).
- [ ] **Admin → Staff Accounts → Send test email** to yourself — confirms SMTP.
- [ ] **Admin → Security → Force password reset for everyone** — rotates all
      demo passwords; every holder re-verifies by email.
- [ ] Invite any real staff missing from the seed (must match their Webuzo mailbox).
- [ ] Panel → **Backuply** (or Backup): schedule backups including `portal-data`
      (or `portal/data/db.json` if you skipped `DATA_DIR`).
- [ ] Keep the demo families for training, or tell us when you want a clean
      production seed + real-data import before admitting families.

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
| `portal.gill.ac.ug` shows the school website | DNS still on the wildcard — check the Vercel A record points at the **shared/web IP**, and wait out propagation (up to ~30 min). |
| `503 / app won't start` | Open the app log in the panel: wrong Node.js version (< 18.18) is the usual cause — switch *Application type* to Node 20/22 and Restart. |
| `SMTP … failed` in Admin → Communications → Delivery log | Re-check `SMTP_*` variables (host `mail.gill.ac.ug`, port `465`, full `noreply@` username). Test from webmail first to prove the mailbox works. |
| Invite/reset emails land in spam (or Gmail bounces) | Finish SPF + DKIM from `docs/email-setup.md` — same fix as webmail. |
| Data resets after redeploy | You re-uploaded over `data/` — move to `DATA_DIR=/home/gillacug/portal-data` (Step 4) and restore `db.json` from backup. |
