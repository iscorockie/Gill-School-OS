# Gill School OS — webmail & email-login setup (Webuzo + portal)

> Goal: staff sign in with their `@gill.ac.ug` webmail addresses, and every
> portal (staff · parent · student) sends real emails for invites,
> verification codes, password resets and fee receipts.

How it works (the model you chose):

- **The mailbox and the portal password are separate.** Webuzo webmail owns the
  `you@gill.ac.ug` mailbox; the portal owns a separate portal password for
  that same address. If a staff member forgets the portal password they reset
  it themselves from the login screen — the webmail password never changes.
- **Webuzo is the postman.** The portal (hosted on Vercel/VPS) connects to
  your Webuzo SMTP to *send* mail. It never reads mailboxes and never needs
  your Webuzo login — only the SMTP username/password of one mailbox.

## Part 1 — in Webuzo (about 15 minutes)

### 1. Create the sender mailbox

1. Webuzo → **Email Accounts** → **Create**.
2. Domain: `gill.ac.ug`, username: `noreply`, password: generate a strong one
   and save it (this becomes `SMTP_PASS`).
3. Mailbox quota: 1 GB is plenty (it only sends).

### 2. Create one mailbox per staff member

Same screen → **Create** for each person, e.g.:

| Staff | Mailbox |
|---|---|
| Ms. Aisha Hassan | `a.hassan@gill.ac.ug` |
| Mr. Brian Mugisha | `b.mugisha@gill.ac.ug` |
| Ms. Sharon Namukasa | `s.namukasa@gill.ac.ug` |
| Mrs. Mary Kyomukama | `m.kyomukama@gill.ac.ug` |
| Mr. Isaac Twesigye | `i.twesigye@gill.ac.ug` |
| Mr. Peter Othieno | `p.othieno@gill.ac.ug` |
| Mr. Francis Ssekandi | `f.ssekandi@gill.ac.ug` |

Give each person their webmail password privately (they can change it in
webmail later). Staff access webmail at
`https://nexus.crystalcloudhost.com:2003/` (Roundcube), or the branded
`https://webmail.gill.ac.ug:2003/` once set up below.

### 3. Copy the SMTP settings

1. Webuzo → **Email Accounts** → next to `noreply@` → **Connect Devices**
   (or *Set Up Mail Client*).
2. Note the **outgoing (SMTP)** host and port. Typical Webuzo values:
   - Host: `mail.gill.ac.ug`
   - Port **465** with SSL/TLS (`SMTP_SECURE=true`), **or** port **587**
     with STARTTLS (`SMTP_SECURE=false`).
3. Username is the full address: `noreply@gill.ac.ug`.

### 4. Deliverability (so Gmail/Yahoo don't flag you)

> ✅ **Verified live 2026-09-27:** SPF
`v=spf1 a mx ip4:104.194.11.128 ~all` and the `default._domainkey` DKIM
key are both published in DNS. The Webuzo SPF screen only edits the
panel's *local* zone (ignored while nameservers stay at Vercel) — nothing
to click there.

Final proof: send any mailbox → Gmail, open **Show original**, and confirm
`SPF: PASS` and `DKIM: PASS`.

Optional but recommended: ask your host to add a **DMARC** record.

## Branded webmail URL (optional, recommended)

Staff don't have to use the ugly server URL (`nexus.crystalcloudhost.com:2003`).
Put webmail on your own subdomain instead:

1. In **Vercel → Domains → `gill.ac.ug` → DNS**, add an **A record**:
   - Name: `webmail`, value: `104.194.11.128` (the CrystalCloud server;
     this overrides the wildcard that points everything at the website host).
2. Wait ~5 minutes, then open `https://webmail.gill.ac.ug:2003/`.
3. The `:2003` port and the `/sessXXXX/` session token stay — only the
   hostname changes. That is normal for panel webmail.
4. First visit may show a certificate warning (*“Your connection is not
   private”*). That just means the server certificate names the hosting
   company's hostname, not yours. Either click Advanced → Proceed, or ask
   CrystalCloud support to cover `webmail.gill.ac.ug` (or set up port-less
   `https://webmail.gill.ac.ug/` proxying) — both are standard requests.

Naming tip: use `webmail.gill.ac.ug` for mail and reserve
`portal.gill.ac.ug` for the Gill School OS portal itself, so staff never
confuse the two.

## Part 2 — on the portal host (Vercel or VPS)

Set these environment variables (Vercel: Project → Settings →
Environment Variables; VPS: a `.env` file next to the app):

| Variable | Value |
|---|---|
| `SMTP_HOST` | `mail.gill.ac.ug` (from step 3) |
| `SMTP_PORT` | `465` |
| `SMTP_SECURE` | `true` (use `false` with port 587) |
| `SMTP_USER` | `noreply@gill.ac.ug` |
| `SMTP_PASS` | the mailbox password from step 1 |
| `SMTP_FROM` | `Gill School OS <noreply@gill.ac.ug>` |
| `APP_URL` | `https://portal.gill.ac.ug` (your public portal address) |
| `STAFF_EMAIL_DOMAIN` | `gill.ac.ug` |

Redeploy / restart after saving. A full template lives in `.env.example`.

> Without these variables the portal still works fully in **simulated-mail
> demo mode**: emails are logged (Admin → Communications → Delivery log) and
> codes are shown on screen so nothing is ever blocked.

## Part 3 — issue the staff logins (Head of School)

1. Sign in at `/admin` (demo: `f.ssekandi@gill.ac.ug` / `gill2026`).
2. Open **Staff Accounts** → invite each person with their `@gill.ac.ug`
   address. They receive an email, set their own portal password, and sign in
   at `/staff`.
3. Seeded demo staff already have the password `gill2026` — ask everyone to
   use **Forgot password** on `/staff` once, so each mailbox holds its own
   private password.

## Part 4 — parents & students

- **Parents** keep their shared family login, but can now also sign in with
  their own email address, and reset the family password from
  `/portal/forgot` (code goes to the parent email on file). Make sure the
  admission form captures at least one parent email.
- **Students** keep their supervised usernames; `/student/forgot` emails the
  reset code to the **parent**, who completes the reset with the child.

## Testing checklist

> Fastest check from anywhere with internet: open **Admin → Staff Accounts**
> and use the **SMTP status card** to send yourself a test email. If it fails,
> the error is shown with the fix; staff invites still work via a manual
> setup link (shown in the console) until SMTP is fixed.


- [ ] Admin → Staff Accounts → invite a test address → email arrives, link
      opens `/staff/setup`, password sets, sign-in works.
- [ ] `/staff/forgot` with your own school email → code arrives in webmail.
- [ ] `/portal/forgot` with a parent email → code arrives.
- [ ] Pay a demo invoice → parent email receives the receipt.
- [ ] Admin → Communications → Delivery log shows `Webuzo SMTP … (live)`.

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `Webuzo SMTP (failed: …)` in the delivery log | Wrong `SMTP_PASS`, or host/port mismatch. Re-check *Connect Devices*; try port 587 + `SMTP_SECURE=false`. Some hosts require *SMTP Restrictions* disabled — ask your host. |
| Emails arrive in spam | Finish Part 1 step 4 (SPF/DKIM/DMARC). Also avoid sending the first real broadcast to hundreds of parents at once — warm up with staff/family mail first. |
| Staff invite email never arrives, no failure logged | Check the mailbox exists in Webuzo and the address was typed correctly; look in spam. Re-send from Staff Accounts. |
| `Staff accounts must use the school domain` | The invite address isn't `@gill.ac.ug`. Create the mailbox in Webuzo first. |
| Codes shown on screen instead of emailed | SMTP env vars aren't set on the host (simulated mode). Set them and redeploy. |

## Security notes

- Portal passwords are hashed (scrypt) from the moment they are set through
  an invite or a reset. Seeded demo passwords are plaintext `gill2026` and
  should be replaced via Forgot password before going live with real data.
- Student passwords stay parent-readable by design (supervised accounts with
  no fee access) — parents manage them in Parent Portal → Student Accounts.
- Invite links are single-use; reset codes expire in 15 minutes and lock
  after 5 wrong attempts.
