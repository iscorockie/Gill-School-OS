# Gill School OS — Demo credentials

> Verified live against the running app on **2026-09-11** (every row returns `ok:true`).
> **No email server is needed anywhere in the OS** — the only email-dependent step lives on the
> external school website (gill.ac.ug), which is a separate codebase.

## Quick rule of thumb

The magic demo password is **`gill2026`**. On the parent and student logins it works with **any**
username/email and signs you into the default demo profile. Real accounts (created on `/register`
or via an invite link) sign in with the password **chosen at creation** — any password other than
`gill2026` reaches the real-account branch.

## Credentials table

| Screen | URL | Username / email | Password | What you get |
|---|---|---|---|---|
| Parent portal (demo shortcut) | `/portal/login` | *any* email or username, e.g. `iiscorockie@gmail.com` | `gill2026` | **Nansubuga** family — children in *both* campuses (unified dashboard, sibling discount) |
| Parent portal (real account) | `/portal/login` | the username created at `/register`, e.g. `demo.family` | the password you chose (8+ chars, not `gill2026`) | That family's own session (`pending` until Admissions verifies) |
| Registration — no email needed | `/register` | you choose: family name, email, phone | you choose (8+ chars) | Creates the family account, signs you in **immediately**, opens the 6-step application wizard |
| Student portal (seeded) | `/student/login` | `jordan.nansubuga` | `gill123` | Jordan Nansubuga — Year 5, supervised account |
| Student portal (demo shortcut) | `/student/login` | *any* username | `gill2026` | Demo student (first active account = Jordan) |
| Staff / Admin console | `/staff` | any staff email (pick the role in the dropdown) | `gill2026` in **both** password fields | Staff session → `/admin` workspaces (see roles below) |

### Staff roles (dropdown on `/staff`, all with password `gill2026`)

| Role | Default person | Workspace highlights |
|---|---|---|
| Teacher | Ms. Aisha Hassan (`a.hassan@gill.sch`) · also Mr. Brian Mugisha, Ms. Sharon Namukasa | `/admin/academics` — assessments, remarks, family group chats |
| Admissions | Mrs. Mary Kyomukama (`m.kyomukama@gill.sch`) | `/admin/admissions` — documents, transitions, family onboarding |
| Bursar | Mr. Isaac Twesigye (`i.twesigye@gill.sch`) | `/admin/fees` — payments, receipts, reconciliation |
| Front Desk & Gate | Mr. Peter Othieno (`p.othieno@gill.sch`) | `/admin/pickups` — check-ins, checkouts, late-pickup billing |

## Good to know

- **Reset the demo:** `↺ Reset demo data` on the admin dashboard, or `POST /api/reset`.
- **Invite flow (SMS-simulated, no email):** families auto-onboard once documents are verified +
  tuition is cleared; the invite link is shown in the deliveries log and survives server restarts.
- The parent demo shortcut always resolves to the Nansubuga family — e.g. signing in as
  `achieng.family` with `gill2026` also lands you in the Nansubuga demo session by design.
