# Gill School OS — first sign-in & production bootstrap

The portal is **live-only**: real accounts, live email, no demo dataset, no
shared/magic passwords, no on-screen verification codes.

## First boot

On the very first start (or after a factory reset) the app seeds only:

- school configuration (fee structure, term, contacts, book/uniform catalog)
- the **real staff roster** (7 `@gill.ac.ug` webmail addresses) as
  **invite-style accounts — no passwords exist yet**

The server console prints the one-time setup links at that moment:

```
[gill-os] LIVE database seeded — staff one-time setup links (also in Admin → Staff Accounts):
[gill-os]   Mr. Francis Ssekandi   f.ssekandi@gill.ac.ug → https://portal.gill.ac.ug/staff/setup?invite=STF-XXXX-YYYY
[gill-os]   Mrs. Mary Kyomukama    m.kyomukama@gill.ac.ug → https://portal.gill.ac.ug/staff/setup?invite=STF-...
...
```

**Bootstrap order:**

1. **Head of School** opens their `/staff/setup?invite=…` link, chooses a
   portal password (the link is single-use) and signs in at `/admin`.
2. Configure SMTP immediately — **Admin → Staff Accounts → "School email
   (SMTP) status"** (`docs/email-setup.md`). Until SMTP works, live mode
   refuses to pretend: verification/reset codes are **never shown on screen**
   (they're delivered by email only).
3. Share each remaining staff member their own setup link (visible in
   **Admin → Staff Accounts**), or have them use **Forgot password** once SMTP
   is live — the code goes to their school webmail.
4. **Admin → Security → Force password reset for everyone** if any account
   was ever created outside this process.
5. Parents and students need no manual creation: families register at
   `/register` (normal email is enough), and student portal accounts are
   created by parents in **Parent Portal → Student Accounts**.

## Sign-in URLs

| Who | URL |
|---|---|
| Parents | `https://portal.gill.ac.ug/portal/login` (short link `/login` redirects) |
| Students | `https://portal.gill.ac.ug/student/login` |
| Admin / Bursar / Admissions | `https://portal.gill.ac.ug/admin` |
| Staff | `https://portal.gill.ac.ug/staff` |

## Factory reset (wipe everything and re-seed)

There is **no "reset" button in live mode** — wiping real school records is
deliberately manual:

1. Stop the app.
2. Delete the database file (`DATA_DIR/db.json`, or `portal/data/db.json`).
3. Start the app — the live seed runs again and prints fresh setup links.

## Development smoke test

The product ships **without any demo dataset** — and the smoke test doesn't
need one: it builds its own families, applications, invoices and accounts
through the same public flows real users use, and captures verification codes
from a local SMTP sink (exactly like production delivery — codes still never
appear on screen).

```bash
npm run dev                   # or: node server.js
node scripts/smoke-test.mjs   # end-to-end business-rule checks
```

The test is idempotent: every run creates uniquely-named records, so it can
be re-run against a working database. It briefly saves SMTP settings pointing
at its local sink and restores/clears them before finishing.
