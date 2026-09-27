# Gill School OS — Supabase Authentication & Setup Guide

This guide details the Supabase configuration and authentication email templates for **Gill School OS** (Gill International School & Gill Pre-School, Najjera).

---

## 1. Supabase Authentication Setup

1. In the [Supabase Dashboard](https://supabase.com/dashboard), navigate to **Authentication** → **URL Configuration**.
2. Set **Site URL** to your production domain:
   - Primary: `https://portal.gill.ac.ug` (or your staging/local URL: `http://localhost:3000`)
3. Under **Redirect URLs**, add all authorized auth callback endpoints:
   - `https://portal.gill.ac.ug/**`
   - `http://localhost:3000/**`
4. Under **Authentication** → **Providers** → **Email**:
   - Ensure **Enable Email provider** is turned **ON**.
   - Enable **Confirm email** if you require new self-registered parents to verify before signing in.

---

## 2. Environment Variables

Add your Supabase credentials to your local `.env.local` or host dashboard:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 3. Email Templates (Authentication → Email Templates)

Copy and paste each of the four HTML templates below into **Supabase Dashboard → Authentication → Email Templates**.

Each template is pre-styled with Gill School's official brand palette (Deep Maroon `#6b1f2a`, Gold Accent `#b98a2f`, Warm Cream `#f6f1ec`), and includes both one-click button links (`{{ .ConfirmationURL }}`) and numerical OTP tokens (`{{ .Token }}`).

---

### 3.1 Confirm Signup

* **Template Tab:** `Confirm signup`
* **Subject:** `Confirm your Gill School OS account`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm your Gill School OS account</title>
</head>
<body style="margin:0;padding:24px 12px;background-color:#f4f5f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#222222;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06);border:1px solid #e7e5e4;">
          <!-- Header -->
          <tr>
            <td style="background-color:#6b1f2a;padding:24px 28px;text-align:left;">
              <div style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.2px;">Gill School OS</div>
              <div style="font-size:12px;color:#f3e8e8;margin-top:2px;letter-spacing:0.3px;">Gill International School · Najjera, Kampala</div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:28px 28px 20px 28px;">
              <h1 style="margin:0 0 12px 0;font-size:19px;font-weight:700;color:#6b1f2a;line-height:1.3;">Confirm your email address</h1>
              <p style="margin:0 0 18px 0;font-size:14px;line-height:1.6;color:#374151;">
                Welcome to <strong>Gill School OS</strong>. Please confirm your email address to activate your school portal account and access admissions, notices, and student progress.
              </p>
              
              <!-- Call to Action Button -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:24px 0;">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}" target="_blank" style="display:inline-block;background-color:#6b1f2a;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:8px;box-shadow:0 2px 4px rgba(107,31,42,0.25);">Confirm My Account</a>
                  </td>
                </tr>
              </table>

              <!-- Alternative OTP code -->
              <div style="background-color:#faf7f5;border:1px dashed #b98a2f;border-radius:8px;padding:14px 18px;text-align:center;margin:20px 0;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#78350f;font-weight:600;margin-bottom:6px;">Or enter this confirmation code</div>
                <div style="font-size:26px;font-weight:800;letter-spacing:6px;color:#6b1f2a;font-family:Courier,monospace;">{{ .Token }}</div>
              </div>

              <p style="margin:16px 0 0 0;font-size:12px;color:#6b7280;line-height:1.5;">
                If the button above does not work, copy and paste this link into your browser:<br>
                <a href="{{ .ConfirmationURL }}" style="color:#6b1f2a;word-break:break-all;">{{ .ConfirmationURL }}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#fafaf9;border-top:1px solid #f0eded;padding:18px 28px;text-align:left;">
              <p style="margin:0 0 6px 0;font-size:12px;color:#71717a;line-height:1.4;">
                This automated notification was sent by Gill School OS. If you did not create an account, please disregard this email.
              </p>
              <p style="margin:0;font-size:11px;color:#a1a1aa;">
                Gill International School &amp; Pre-School · P.O. Box Najjera, Kampala, Uganda
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

### 3.2 Invite User

* **Template Tab:** `Invite user`
* **Subject:** `Your Gill School OS account is ready`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Gill School OS account is ready</title>
</head>
<body style="margin:0;padding:24px 12px;background-color:#f4f5f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#222222;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06);border:1px solid #e7e5e4;">
          <!-- Header -->
          <tr>
            <td style="background-color:#6b1f2a;padding:24px 28px;text-align:left;">
              <div style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.2px;">Gill School OS</div>
              <div style="font-size:12px;color:#f3e8e8;margin-top:2px;letter-spacing:0.3px;">Gill International School · Najjera, Kampala</div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:28px 28px 20px 28px;">
              <h1 style="margin:0 0 12px 0;font-size:19px;font-weight:700;color:#6b1f2a;line-height:1.3;">You've been invited to join the school portal</h1>
              <p style="margin:0 0 18px 0;font-size:14px;line-height:1.6;color:#374151;">
                An account has been created for you on <strong>Gill School OS</strong>. Click the button below to accept your invitation, choose your private password, and sign in.
              </p>
              
              <!-- Call to Action Button -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:24px 0;">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}" target="_blank" style="display:inline-block;background-color:#6b1f2a;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:8px;box-shadow:0 2px 4px rgba(107,31,42,0.25);">Accept Invitation &amp; Set Password</a>
                  </td>
                </tr>
              </table>

              <p style="margin:16px 0 0 0;font-size:12px;color:#6b7280;line-height:1.5;">
                This invitation link is personal to your address. Please do not forward it. If you need a new invite link, contact the school administrator.<br><br>
                Link: <a href="{{ .ConfirmationURL }}" style="color:#6b1f2a;word-break:break-all;">{{ .ConfirmationURL }}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#fafaf9;border-top:1px solid #f0eded;padding:18px 28px;text-align:left;">
              <p style="margin:0 0 6px 0;font-size:12px;color:#71717a;line-height:1.4;">
                Sent by Gill International School. If you were not expecting an account invitation, please notify the school office.
              </p>
              <p style="margin:0;font-size:11px;color:#a1a1aa;">
                Gill International School &amp; Pre-School · Najjera, Kampala
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

### 3.3 Magic Link

* **Template Tab:** `Magic Link`
* **Subject:** `Your login link for Gill School OS`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your login link for Gill School OS</title>
</head>
<body style="margin:0;padding:24px 12px;background-color:#f4f5f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#222222;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06);border:1px solid #e7e5e4;">
          <!-- Header -->
          <tr>
            <td style="background-color:#6b1f2a;padding:24px 28px;text-align:left;">
              <div style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.2px;">Gill School OS</div>
              <div style="font-size:12px;color:#f3e8e8;margin-top:2px;letter-spacing:0.3px;">Gill International School · Najjera, Kampala</div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:28px 28px 20px 28px;">
              <h1 style="margin:0 0 12px 0;font-size:19px;font-weight:700;color:#6b1f2a;line-height:1.3;">Instant portal sign in</h1>
              <p style="margin:0 0 18px 0;font-size:14px;line-height:1.6;color:#374151;">
                You requested a password-free sign in link for <strong>Gill School OS</strong>. Click below to securely access your portal dashboard:
              </p>
              
              <!-- Call to Action Button -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:24px 0;">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}" target="_blank" style="display:inline-block;background-color:#6b1f2a;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:8px;box-shadow:0 2px 4px rgba(107,31,42,0.25);">Sign In to Portal</a>
                  </td>
                </tr>
              </table>

              <!-- Alternative OTP code -->
              <div style="background-color:#faf7f5;border:1px dashed #b98a2f;border-radius:8px;padding:14px 18px;text-align:center;margin:20px 0;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#78350f;font-weight:600;margin-bottom:6px;">Or enter this one-time code</div>
                <div style="font-size:26px;font-weight:800;letter-spacing:6px;color:#6b1f2a;font-family:Courier,monospace;">{{ .Token }}</div>
              </div>

              <p style="margin:16px 0 0 0;font-size:12px;color:#6b7280;line-height:1.5;">
                This link expires in 10 minutes and can only be used once. If you did not make this request, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#fafaf9;border-top:1px solid #f0eded;padding:18px 28px;text-align:left;">
              <p style="margin:0 0 6px 0;font-size:12px;color:#71717a;line-height:1.4;">
                Automated security message from Gill School OS. Never forward this link to anyone.
              </p>
              <p style="margin:0;font-size:11px;color:#a1a1aa;">
                Gill International School &amp; Pre-School · Najjera, Kampala
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

### 3.4 Reset Password

* **Template Tab:** `Reset password`
* **Subject:** `Reset your Gill School OS password`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your Gill School OS password</title>
</head>
<body style="margin:0;padding:24px 12px;background-color:#f4f5f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#222222;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06);border:1px solid #e7e5e4;">
          <!-- Header -->
          <tr>
            <td style="background-color:#6b1f2a;padding:24px 28px;text-align:left;">
              <div style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.2px;">Gill School OS</div>
              <div style="font-size:12px;color:#f3e8e8;margin-top:2px;letter-spacing:0.3px;">Gill International School · Najjera, Kampala</div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:28px 28px 20px 28px;">
              <h1 style="margin:0 0 12px 0;font-size:19px;font-weight:700;color:#6b1f2a;line-height:1.3;">Reset your password</h1>
              <p style="margin:0 0 18px 0;font-size:14px;line-height:1.6;color:#374151;">
                We received a request to reset your password for your <strong>Gill School OS</strong> account. Click the button below to choose a new password:
              </p>
              
              <!-- Call to Action Button -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:24px 0;">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}" target="_blank" style="display:inline-block;background-color:#6b1f2a;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:8px;box-shadow:0 2px 4px rgba(107,31,42,0.25);">Reset My Password</a>
                  </td>
                </tr>
              </table>

              <!-- Alternative OTP code -->
              <div style="background-color:#faf7f5;border:1px dashed #b98a2f;border-radius:8px;padding:14px 18px;text-align:center;margin:20px 0;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#78350f;font-weight:600;margin-bottom:6px;">Or enter this reset code in the portal</div>
                <div style="font-size:26px;font-weight:800;letter-spacing:6px;color:#6b1f2a;font-family:Courier,monospace;">{{ .Token }}</div>
              </div>

              <p style="margin:16px 0 0 0;font-size:12px;color:#6b7280;line-height:1.5;">
                This reset code expires in 15 minutes. If you did not request a password reset, you can safely ignore this email — your existing password remains unchanged.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#fafaf9;border-top:1px solid #f0eded;padding:18px 28px;text-align:left;">
              <p style="margin:0 0 6px 0;font-size:12px;color:#71717a;line-height:1.4;">
                Never share this link or code with anyone. Gill School staff will never ask for your password or reset codes.
              </p>
              <p style="margin:0;font-size:11px;color:#a1a1aa;">
                Gill International School &amp; Pre-School · Najjera, Kampala
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 4. How to Paste These Templates into Supabase Dashboard

1. Log in to **[supabase.com/dashboard](https://supabase.com/dashboard)** and select your project.
2. In the left-hand navigation sidebar, click on **Authentication** (the key icon / shield).
3. Under the Authentication sub-menu, select **Email Templates**.
4. For each of the four template tabs:
   - Click the tab:
     - **Confirm signup**
     - **Invite user**
     - **Magic Link**
     - **Reset password**
   - In the **Subject** field, paste the corresponding subject line from §3 above.
   - In the **Body** editor (code view), replace any default HTML by pasting the complete HTML code block provided above.
   - Click **Save** in the bottom right of each template tab.
5. Send a test email from Supabase or via your sign-in flows to verify that the emails render with your school's header and colors.
