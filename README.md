# Gill School OS 🎓

A unified campus management platform for **Gill International School** and **Gill Pre-School** — Najjera, Kampala (Cambridge curriculum). One platform for parents, teachers, admissions, the bursar, and the gate.

The landing page (`/`) sells the platform; the **Parent Portal** (`/portal`) and **Admin Console** (`/admin`) are fully working demo apps driven by one state store.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Production:

```bash
npm run build
npm run start      # or: node .next/standalone/server.js
```

First run seeds the demo database (`data/db.json` is generated and git-ignored). Use **↺ Reset demo data** on the admin dashboard to restore the seed at any time.

Smoke test (app must be running):

```bash
node scripts/smoke-test.mjs
```

## Demo identities

| Role | User | Where |
|---|---|---|
| Parent | Amina Nansubuga (children in **both** campuses) | `/portal` |
| Head of School | Mr. Francis Ssekandi | `/admin` |
| Bursar | Mr. Isaac Twesigye | `/admin/fees` |
| Admissions | Mrs. Mary Kyomukama | `/admin/admissions` |
| Gate / Front office | Mr. Peter Othieno | `/admin/pickups` |
| Teachers | Ms. Aisha Hassan · Mr. Brian Mugisha · Ms. Sharon Namukasa | `/admin/academics` |

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
- **Late-pickup auto-billing** — gate checkout after 5:00 pm adds UGX 20,000 to the family invoice, sends a polite SMS and logs an audit entry. The console includes a "simulate 5:07 pm" button for demos (`/admin/pickups`).
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

To go to production: swap `lib/store.js` for Postgres (the `reconcile` logic becomes views/triggers), connect a real SMS aggregator (MTN/Airtel Uganda) and payment gateway (MTN MoMo API, Flutterwave/Paystack for cards), and move document uploads to object storage with virus scanning.

## Layout

```
app/            Next.js routes (landing, portal/*, admin/*, api/*)
components/     Shell (sidebar app chrome) + ui primitives
lib/            seed data, store/reconcile engine, action handlers, client selectors
scripts/        smoke test
```
