# Gill School OS — DNS & nameservers (verified 2026-09-28)

> **Verdict: no nameserver change is needed.** `gill.ac.ug` already lives on
> Vercel nameservers and every record the portal, webmail and mail need is
> published. The one live blocker is **not DNS** — it's the SSL certificate on
> the CrystalCloud server (`docs/deploy-shared-hosting.md` → Step 6).

Nameservers for `gill.ac.ug` (keep these — do **not** move them):

```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

All records below are managed in **Vercel → Domains → `gill.ac.ug` → DNS**.

## The complete record set (current state)

| Type | Name | Value | Status |
|---|---|---|---|
| NS | `gill.ac.ug` | `ns1.vercel-dns.com`, `ns2.vercel-dns.com` | ✅ |
| A | `gill.ac.ug` | `216.198.79.65`, `216.198.79.1` (Vercel website) | ✅ |
| A | `portal` | `104.194.11.128` (CrystalCloud server) | ✅ |
| A | `webmail` | `104.194.11.128` | ✅ |
| A | `mail` | `104.194.11.128` | ✅ |
| MX | `gill.ac.ug` | `10 mail.gill.ac.ug` | ✅ |
| TXT (SPF) | `gill.ac.ug` | `v=spf1 a mx ip4:104.194.11.128 ~all` | ✅ |
| TXT (DKIM) | `default._domainkey` | `v=DKIM1; p=MIIBIjAN…` | ✅ |
| TXT (DMARC) | `_dmarc` | `v=DMARC1; p=none; rua=mailto:admin@gill.ac.ug` | ✅ |

(There is also a `google-gws-recovery-domain-verification` TXT — leave it in
place.)

## What each record does

- **`portal` A** — the Gill School OS itself (`https://portal.gill.ac.ug`).
- **`webmail` A** — Roundcube webmail for staff/parent school mailboxes
  (`https://webmail.gill.ac.ug:2003`).
- **`mail` A + MX** — the Postfix/SMTP server: `mail.gill.ac.ug` is both the
  outgoing SMTP host (`SMTP_HOST`) and the MX target for incoming mail.
- **SPF** — authorises the server IP to send for `gill.ac.ug`.
- **DKIM** — the mail server's signing key (`default._domainkey` selector
  matches the milter configuration on the server).
- **DMARC** — tells receivers what to do with unauthenticated mail and where
  to send aggregate reports (`admin@gill.ac.ug`).

## Verification (any machine with internet)

```bash
dig NS   gill.ac.ug +short          # ns1/ns2.vercel-dns.com
dig A    portal.gill.ac.ug +short   # 104.194.11.128
dig MX   gill.ac.ug +short          # 10 mail.gill.ac.ug.
dig TXT  gill.ac.ug +short          # SPF + google recovery
dig TXT  default._domainkey.gill.ac.ug +short
dig TXT  _dmarc.gill.ac.ug +short
```

Mail proof: send any mailbox → Gmail, open **Show original**, confirm
`SPF: PASS` and `DKIM: PASS`.

## After DNS — the real remaining blocker

DNS is done; the browser warning on `https://portal.gill.ac.ug`
(`NET::ERR_CERT_AUTHORITY_INVALID`) is the server presenting its default
self-signed certificate. Fix it in Webuzo → **SSL** (issue the certificate for
`portal.gill.ac.ug`, attach it to the vhost) — full steps with troubleshooting:
`docs/deploy-shared-hosting.md` → **Step 6**.

## Later hardening (optional, recommended)

1. **DMARC**: after ~2 weeks of clean `rua` reports, move
   `_dmarc.gill.ac.ug` from `p=none` to `p=quarantine` (then `p=reject`).
2. **SPF**: once sending is stable you can switch `~all` → `-all`.
3. Never move the nameservers off Vercel while the school website is hosted
   there — everything above would have to be recreated at the new host first.
