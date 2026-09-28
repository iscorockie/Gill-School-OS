# Gill School OS 🎓

A unified campus management platform for **Gill International School** and **Gill Pre-School** — Najjera, Kampala (Cambridge curriculum). One platform for parents, teachers, admissions, the bursar, and the gate.

The landing page (`/`) sells the platform; the **Parent Portal** (`/portal`) and **Admin Console** (`/admin`) are fully working apps driven by one state store.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Production:

```bash
npm run build
node server.js     # production launcher (PORT/HOSTNAME/DATA_DIR aware)
```

**Live only** — there is no demo dataset anywhere in the product. First run seeds a production database (`data/db.json`, git-ignored) with school configuration and the staff roster as invite-style accounts (no passwords); the one-time setup links are printed to the server console. Bootstrap, sign-in URLs and factory-reset: **`docs/first-sign-in.md`**. DNS status: **`docs/dns.md`**.

Smoke test (app must be running; the test builds its own data through the real registration → application → tuition flows and captures verification codes from a local SMTP sink):

```bash
npm run dev                 # or: node server.js
node scripts/smoke-test.mjs # end-to-end business-rule checks
```

## Sign-in URLs (once deployed at `https://portal.gill.ac.ug`)

| Who | URL |
|---|---|
| Parents | `/portal/login` — the short link `/login` redirects there |
| Students | `/student/login` |
| Admin / Bursar / Admissions | `/admin` |
| Staff | `/staff` |

The staff roster: Head of School **Mr. Francis Ssekandi** (`/admin`), Bursar **Mr. Isaac Twesigye** (`/admin/fees`), Admissions **Mrs. Mary Kyomukama** (`/admin/admissions`), Gate **Mr. Peter Othieno** (`/admin/pickups`), Teachers **Ms. Aisha Hassan · Mr. Brian Mugisha · Ms. Sharon Namukasa** (`/admin/academics`) — each signs in with their `@gill.ac.ug` webmail address and a portal password they set via their one-time setup link.

## Feature map (per your brief)

### Pre-School ↔ International School link
- **Unified Parent Dashboard** — siblings from both campuses under one login (`/portal`, `/portal/children`).
- **Automated Enrollment Transition** — `Admissions → Transitions → One-click migrate` copies records (immunisation, medical, contacts, reports), moves the pupil to the Main School, auto-creates a first-term invoice, and notifies the Bursar. Parents never re-fill forms.
- **Automated Sibling Discounts** — any family with children in both campuses gets 10% off Pre-School tuition, recomputed live on every invoice (`lib/store.js → reconcile`).

### Cost savings
- **In-house communications** — noticeboard + staff/parent messaging + SMS/email relay log replace ClassDojo premium (`/admin/communications`).
- **Paperless admissions** — document upload, verification queue, no paper (`/portal/children`, `/admin/admissions`).
- **Digital resource & e-library** — past papers, worksheets, e-books, *The Gill Insider* (`/portal/resources`, `/admin/resources`).

### Administrators
- **Gated personalised parent emails** — families use a normal email on the OS from day one; only after they've applied and tuition is completed does the Bursar/Admin issue their personalised `@gill.ac.ug` mailbox, which then works on both the Parent OS and Webuzo webmail (`/admin/fees` → School emails).
- **Late-pickup auto-billing** — gate checkout after 5:00 pm adds UGX 20,000 to the family invoice, sends a polite SMS and logs an audit entry. The gate console can record a back-dated late checkout (`/admin/pickups`).
- **Mobile Money & reconciliation** — MTN MoMo, Airtel Money, Visa; instant receipt + ledger clearance (`/portal/fees`, `/admin/fees`).
- **Pre-orders** — uniform/book packs pre-paid before term (`/portal/orders`).

### Parents
- **Live academic tracking** — continuous assessments, Checkpoint practice, teacher feedback, visible on demand (`/portal/children`).
- **Calendar sync** — ICS feed at `/api/ics?campus=all` for Google/Apple calendars (`/portal/calendar`).
- **Digital absence requests** — online submission auto-notifies class teachers (`/portal/leave`, `/admin/leaves`).

## Architecture

- **Next.js 15 (App Router)** + React 19, no external UI dependencies (hand-rolled design system in `app/globals.css`).
- **JSON file store** (`lib/store.js`) with an idempotent `reconcile()` that derives sibling discounts, invoice totals, balances, student indices and dashboard stats on every read — the same engine a real SQL/Postgres schema would use.
- **Action dispatcher** — every mutation goes through `POST /api/action` (`lib/actions.js`); all side effects (SMS/email simulation, audit trail, notifications) are logged in-state.
- **ICS endpoint** (`/api/ics`) generates a live subscribe-able calendar.
- **Shared email sign-in** (`/login`) routes parent, staff and administrator accounts to their OS workspace; students continue to sign in with their parent-managed username at `/student/login`.

To go to production: swap `lib/store.js` for Postgres (the `reconcile` logic becomes views/triggers), connect a real SMS aggregator (MTN/Airtel Uganda) and payment gateway (MTN MoMo API, Flutterwave/Paystack for cards), and move document uploads to object storage with virus scanning.

## Production email (Webuzo webmail)

Staff sign in with their `@gill.ac.ug` webmail addresses, and all three portals send real email (staff invites, verification codes, password resets, fee receipts) through your Webuzo SMTP. **Live mode requires SMTP** for anything that delivers a code or credential — codes are emailed, never shown on screen. Full walkthrough: **`docs/email-setup.md`** (copy `.env.example` → `.env`, set `SMTP_*`, invite staff from Admin → Staff Accounts).

**Parent access is two-tier by design** — school mailboxes are never handed out at random: a normal (personal) email is enough for the Parent OS from registration, while the personalised `@gill.ac.ug` mailbox (Webuzo webmail + OS sign-in) is issued by the **Bursar/Admin only after the family has applied for their child and tuition is completed** (Admin → Fees → School emails). The parents receive their mailbox credentials by email, and the same address works on both the Parent OS and Webuzo webmail.

## Account lifecycle (one-time accounts, tenure access)

- **One-time creation** — the family account is created once, the first time a parent registers (`/register`), and each student gets exactly one supervised portal account. Re-registering with the same email/phone points to the existing login instead of minting a duplicate.
- **Tenure access** — once created, the OS stays accessible for the student's entire time at the school. An outstanding balance (e.g. next term's fees) **never** locks anyone out of the Parent or Student OS: fee collection and portal access are fully decoupled after admission.
- **End of tenure** — when a student leaves the school or completes their academic years, Admissions marks them in **Admissions → Leavers & alumni**: their student account closes, and the family login closes once every child is done.
- **Admin deletion** — afterwards the admin deletes the accounts from the same screen (typed confirmation). Invoices, receipts, applications and academic records are always retained; if a new pupil joins later, a fresh account is created at registration.

## Deploying on shared hosting

Run the portal itself on the CrystalCloud account at `portal.gill.ac.ug` via the panel's Node.js app manager (`server.js` launcher, `PORT`/`DATA_DIR` env support). Full walkthrough: **`docs/deploy-shared-hosting.md**`.

## Layout

```
app/            Next.js routes (landing, portal/*, admin/*, api/*)
components/     Shell (sidebar app chrome) + ui primitives
lib/            seed data, store/reconcile engine, action handlers, client selectors
scripts/        smoke test
```
