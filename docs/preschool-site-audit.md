# Preschool site audit — preschool.gill.ac.ug

**Audited:** 2026-08-31 · **Auditor:** Gill School OS build review
**Scope:** verify live information on the pre-school site and flag what needs to be updated, edited, included or changed before rollout.
**Constrained by owner:** the **footer is final and unchanged** — no footer edits anywhere in this audit.

---

## 1. What is verified and correct ✅

| Item | Live value | Status |
|---|---|---|
| Domain | https://preschool.gill.ac.ug serves the GIPS single-page site | ✅ live |
| Programmes | Daycare (1–2) · Toddlers (2–3) · Nursery (3–4) · Reception (4–5) | ✅ matches class names now used in the OS |
| Age range | children aged 1–6 years; "feeds into GIS Primary" | ✅ consistent w/ the OS landing (Ages 1–19) |
| Class size | 20 pupils per class | ✅ noted |
| Vision / Mission | Christ-centred, holistic, "sensitivity and affection…" | ✅ matches main site |
| Values | Respect & Tolerance · Confidence & Independence · Teamwork | ✅ matches main site |
| Day rhythm | 7:30 arrival → 8:30 circle → 9:00 play → 10:30 snack/outdoor → 12:00 lunch/rest → 15:00 home | ✅ |
| Tours | every weekday, by appointment | ✅ |
| Testimonial | Mrs. Sarah Katamba — "Pre-School Parent, Now Year 1" | ✅ |
| Messaging | "Applications for the 2026–2027 intake are now open" | ✅ current (better than main-site copy below) |
| WhatsApp / phone | +256 755 071 456 (wa.me/256755071456) | ✅ |
| Email | info.gillschool@gmail.com | ⚠️ mismatch with preschool.gillschool.ac.ug (see §2) |

**Term dates banner (new site):** Term I begins 1 Sep, ends 18 Dec 2026; Coffee Morning 4 Sep; Orientation Breakfast 12 Sep; Family Picnic 25 Sep; Independence 9 Oct; Dress-Up Day 16 Oct; Mid-Term 26–30 Oct; Mini Sports 13 Nov; Arts & Craft Evening 20 Nov; Carols & Prize Day 4 Dec; Christmas 25 Dec.

---

## 2. Inconsistencies to fix (preschool.gill.ac.ug)

1. **Two pre-school sites are live.** `preschool.gill.ac.ug` (new, single-page) and `preschool.gillschool.ac.ug` (older Joomla/"Buildal" site) both resolve and rank. The old one says **"Applications for the academic year 2025 are open"**, lists **info@gillschool.ac.ug** (vs `info.gillschool@gmail.com` on the new site), and its Term Dates page is an empty 2022 article.
   → **Action:** point/redirect `preschool.gillschool.ac.ug` (and any printed/social links) to `preschool.gill.ac.ug`, or park it; keep one canonical site. This is the single biggest confusion risk for new parents.
2. **Term numbering mismatch.** The new site calls Sep–Dec 2026 **"Term I"**, while the main site + OS call the same period **Term 3 2026 (Sep–Dec)**. A parent comparing the two sites sees two different terms.
   → **Action:** pick one convention (recommend "Term 3 2026" = Uganda's Sep–Dec term) and use it on both sites, or clearly label it "2026/27 Academic Year — Term I".
3. **Map/landmarks (the review's main point).** The new pre-school site **has no map and no coordinates**; the old site's Contact page has a pin at `0°22'34.4"N 32°37'28.0"E` → **0.3762226, 32.6244347** (White Close, Plot 341, opposite Hass Petrol Station) — that one is correct and verified. The **misleading location is on the main-school side** (old listing shows a different area/Namugongo); the OS now pins both correctly:
   - **Pre-School (GIPS):** 0.3762226, 32.6244347 — White Close, Plot 341, opposite Hass Petrol Station — plus code 6GGJ9JGF+FQ
   - **Main School:** 0.384875, 32.626375 — Mbogo Road 1, plus code **9JMG+XH** Kampala (~1 km apart)
   → **Action:** on the pre-school site, add a "Visit us" block with the exact address + the same White Close-pin Google Maps link (`https://www.google.com/maps/place/0%C2%B022'34.4%22N+32%C2%B037'28.0%22E/...`), not the old single-pin city-centre view. Cross-link the Main School pin (Mbogo Rd 1 / 9JMG+XH) with a note that it is a separate campus.
4. **Physical address is missing from the new site's Contact section** ("Najjera, Kampala, Uganda" only). The real address is **P.O. Box 1972, White Close, Plot 341, Najjera–Kira Municipality**.
   → **Action:** add the full address and the landmark phrase "opposite Hass Petrol Station".
5. **"Applications for 2026–2027" (new site) vs "2025–2026 academic year" (main gillschool.ac.ug landing + old pre-school site).** The main-site banner is now stale.
   → **Action:** update the main site to "2026–2027 intake" to match the pre-school site and the OS.
6. **Teacher/team placeholder data.** `preschool.gillschool.ac.ug/about` shows "Teacher Name" placeholders (Nursery, Daycare, Toddlers, Reception).
   → **Action:** either remove the team block or populate real names/photos on the single-page site.
7. **New site has no Application form.** Old site has a full Joomla "Apply" form (pupil bio-data, photos, sessions 8:00–13:00 or 8:00–16:00, health history, fee payer). The new site only has WhatsApp/Call CTAs.
   → **Action:** link the new site's CTA to the OS **/register** page (which re-implements the 6-step wizard: Basic Info → Parent Details → Emergency Contacts → Documents → Payment → Review & Submit). Keep the WhatsApp CTA as the fallback.

---

## 3. The OS side — what changed in this build (already implemented)

- **Landing map:** two distinct landmark pins (GIPS White Close/Hass; Main School Mbogo Rd 1 `9JMG+XH`), dashed connector, per-campus "Open in Google Maps" links, plus landmark cards with phone/plus code/coordinates. Replace `0.4044/32.6728` (wrong-pin, near Namugongo) everywhere — it is dead.
- **/register:** OS landing-style "Join Our Community / Create Account" — parents only, **no Staff Portal entry**, terms checkbox, "Already have an account? Sign In" → /portal/login. After account creation → **/apply** 6-step wizard (green success banner after Parent Details, blue/active current step — mirrors the old wizard screenshot).
- **New-parent dashboard (OS version of old /parent/dashboard):** after creating an account the parent signs in and sees application status — wizard progress, document verification, term fees, and **once the Admission registrar verifies documents + tuition, both parents receive an SMS with the shared family login + the child's portal link** (a supervised student account is auto-provisioned; parents can change credentials in Parent Portal → Student Accounts).
- **Programme names** in OS seed data aligned to the live GIPS naming: Daycare / Toddlers / Nursery / Reception (was "Pre-K", "Nursery 2").

---

## 4. Recommended rollout checklist (site edits only; footer untouched)

- [ ] Canonicalize to `preschool.gill.ac.ug`; redirect/park `preschool.gillschool.ac.ug`.
- [ ] Add full address + "opposite Hass Petrol Station" to the Contact/Visits section.
- [ ] Add the White Close map pin (0.3762226, 32.6244347) and a second pin/card for the Main School (0.384875, 32.626375, Mbogo Rd 1, 9JMG+XH).
- [ ] Decide term naming ("Term 3 2026") and apply to both sites.
- [ ] Update main-site banner to 2026–2027 intake.
- [ ] Point the pre-school site's application CTA to the OS `/register` (or embed the OS link).
- [ ] Update old-site email to info.gillschool@gmail.com or drop the old site.
- [ ] Remove/repopulate "Teacher Name" placeholders.
- [ ] No footer changes (final per school).
