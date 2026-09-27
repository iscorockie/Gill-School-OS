# Gill School OS — Demo credentials

> The magic demo password is **`gill2026`**. Staff sign in with their school
> email (`@gill.ac.ug`); parents use the family username **or** a parent
> email; students use their supervised username.
>
> Real email delivery (cPanel SMTP) is optional: without `SMTP_*` env vars the
> portal shows every code on screen and logs every email instead of sending
> it. See **`docs/email-setup.md`** to connect your webmail.

## Credentials table

| Screen | URL | Username / email | Password | What you get |
|---|---|---|---|--- |
| Parent portal (demo shortcut) | `/portal/login` | *any* email or username, e.g. `iiscorockie@gmail.com` | `gill2026` | **Nansubuga** family — children in *both* campuses (unified dashboard, sibling discount) |
| Parent portal (real account) | `/portal/login` | family username (`nansubuga.family`, `achieng.family`) **or** a parent email on file | `gill2026` (seeded) or the password you chose | That family's own session |
| Parent reset | `/portal/forgot` | family username or parent email | — (emailed 6-digit code) | Set a new family password |
| Registration — no email needed | `/register` | you choose: family name, email, phone | you choose (8+ chars) | Creates the family account, signs you in **immediately**, opens the 6-step application wizard |
| Student portal (seeded) | `/student/login` | `jordan.nansubuga` | `gill123` | Jordan Nansubuga — Year 5, supervised account |
| Student portal (demo shortcut) | `/student/login` | *any* username | `gill2026` | Demo student (first active account = Jordan) |
| Student reset | `/student/forgot` | student username | — (code goes to the **parent's** email) | Parent + child set a new password together |
| Staff portal | `/staff` | school email (see roles below) | `gill2026` | Staff workspace for that role |
| Staff first-time setup | `/staff/setup?invite=…` | invite code from the email | you choose (8+ chars) | Activates an invited account |
| Staff reset | `/staff/forgot` | school email | — (emailed 6-digit code) | Set a new staff password |
| OS Admin console | `/admin/login` | `f.ssekandi@gill.ac.ug` | `gill2026` | Head of School monitoring console |

### Staff roles (all with password `gill2026`)

| Role | Person & school email | Workspace highlights |
|---|---|---|
| Teacher | Ms. Aisha Hassan (`a.hassan@gill.ac.ug`) · Mr. Brian Mugisha (`b.mugisha@gill.ac.ug`) · Ms. Sharon Namukasa (`s.namukasa@gill.ac.ug`) | `/staff/home` — classes, assessments, family group chats |
| Admissions | Mrs. Mary Kyomukama (`m.kyomukama@gill.ac.ug`) | `/staff/home` — admissions desk |
| Bursar | Mr. Isaac Twesigye (`i.twesigye@gill.ac.ug`) | `/staff/home` — bursar desk |
| Front Desk & Gate | Mr. Peter Othieno (`p.othieno@gill.ac.ug`) | `/staff/home` — gate desk |
| Head of School | Mr. Francis Ssekandi (`f.ssekandi@gill.ac.ug`) | `/admin` — full monitoring console + Staff Accounts |

## Good to know

- **Reset the demo:** `↺ Reset demo data` on the admin dashboard, or `POST /api/reset`.
- **Invite flow (SMS-simulated, no email):** families auto-onboard once documents are verified +
  tuition is cleared; the invite link is shown in the deliveries log and survives server restarts.
- **Email invite flow (staff):** Head of School → Admin → Staff Accounts → invite. In demo
  mode the invite code/link is shown on screen; with SMTP configured it is emailed.
- The parent demo shortcut always resolves to the Nansubuga family — e.g. signing in with an
  unknown email + `gill2026` lands you in the Nansubuga demo session by design. Real family
  passwords (anything other than `gill2026`, or a matching seeded account) open that family's
  own session.
