# AWS SES Setup Guide — Step by Step

> **Goal:** Setup AWS SES (Sandbox) to send emails from the Vibe app
> **Time:** ~15 minutes
> **Cost:** Free (Sandbox: 200 emails/day)
> **Domain required:** No

---

## Step 0: Create AWS Account (skip if you already have one)

1. Go to **https://aws.amazon.com**
2. Click **"Create an AWS Account"**
3. Fill in:
   - Email address (root account)
   - Account name: `vibe-demo`
4. Verify email → Set password
5. Contact info: **Personal** account is fine
6. Payment: Add a credit/debit card (will NOT be charged for free tier)
7. Identity verification: Phone number → SMS code
8. Support plan: **Basic (Free)**
9. Click **"Complete sign up"**

> AWS Free Tier includes SES: 62,000 emails/month from EC2, or 200/day sandbox.

---

## Step 1: Open SES Console & Select Region

1. Login to **https://console.aws.amazon.com**
2. In the top-right corner, click the **region selector** (e.g., "N. Virginia")
3. Select: **Asia Pacific (Seoul) — ap-northeast-2**

```
┌──────────────────────────────────────────────┐
│  AWS Console          [Region: Seoul ▼]  [?] │
├──────────────────────────────────────────────┤
│                                              │
│  Search bar: type "SES"                      │
│                                              │
│  → Click "Amazon Simple Email Service"       │
│                                              │
└──────────────────────────────────────────────┘
```

4. In the search bar at the top, type **"SES"**
5. Click **"Amazon Simple Email Service"**

---

## Step 2: Verify Sender Email

This is the email address that will appear in the "From" field.

1. In the SES left sidebar, click **"Verified identities"**
2. Click **"Create identity"** button (orange)

```
┌──────────────────────────────────────────────┐
│  Create identity                             │
├──────────────────────────────────────────────┤
│                                              │
│  Identity type:                              │
│    ○ Domain                                  │
│    ● Email address    ← Select this          │
│                                              │
│  Email address:                              │
│  ┌──────────────────────────────────┐        │
│  │ your-real-email@gmail.com        │        │
│  └──────────────────────────────────┘        │
│                                              │
│  [Create identity]                           │
│                                              │
└──────────────────────────────────────────────┘
```

3. Select **"Email address"**
4. Enter your email: e.g., `your-email@gmail.com`
5. Click **"Create identity"**
6. **Check your Gmail inbox** → You'll receive an email from AWS:
   - Subject: "Amazon Web Services – Email Address Verification Request"
   - Click the **verification link** in the email

7. Go back to SES Console → **Verified identities**
8. Your email should show: **Identity status: Verified** (green checkmark)

```
┌──────────────────────────────────────────────────────┐
│  Verified identities                                 │
├──────────────────────────────────────────────────────┤
│  Identity              │ Type  │ Status              │
│  ──────────────────────┼───────┼──────────────────── │
│  your-email@gmail.com  │ Email │ ✅ Verified          │
└──────────────────────────────────────────────────────┘
```

---

## Step 3: Verify Recipient Emails (Sandbox Requirement)

> **IMPORTANT:** In Sandbox mode, you can ONLY send to verified email addresses.
> You need to verify every recipient email you want to test with.

Repeat the same process for test recipient emails:

1. **"Verified identities"** → **"Create identity"**
2. Add: `buyer1@yopmail.com` (or any email you can access)
3. Click **"Create identity"**
4. Check that email's inbox → Click verification link

> **Tip for yopmail.com:** Go to https://yopmail.com → enter `buyer1` → check inbox for AWS verification email.

Verify at least 2-3 test emails:
- `buyer1@yopmail.com`
- `seller1@yopmail.com`
- Your personal email for testing

---

## Step 4: Create SMTP Credentials

This is the most important step — you'll get the username/password for sending emails.

1. In the SES left sidebar, click **"SMTP settings"**

```
┌──────────────────────────────────────────────────────┐
│  Simple Mail Transfer Protocol (SMTP) settings       │
├──────────────────────────────────────────────────────┤
│                                                      │
│  SMTP endpoint:                                      │
│  email-smtp.ap-northeast-2.amazonaws.com             │
│                                                      │
│  STARTTLS Port: 587                                  │
│  TLS Wrapper Port: 465                               │
│                                                      │
│  [Create SMTP credentials]  ← Click this             │
│                                                      │
└──────────────────────────────────────────────────────┘
```

2. Click **"Create SMTP credentials"**
3. This opens the **IAM Console** with a pre-filled form:

```
┌──────────────────────────────────────────────────────┐
│  Create User for SMTP                                │
├──────────────────────────────────────────────────────┤
│                                                      │
│  IAM User Name:                                      │
│  ┌──────────────────────────────────┐                │
│  │ ses-smtp-user.20260324-095500    │  ← Keep or     │
│  └──────────────────────────────────┘    rename to    │
│                                         "ses-vibe"   │
│                                                      │
│  [Create user]                                       │
│                                                      │
└──────────────────────────────────────────────────────┘
```

4. Click **"Create user"**
5. **CRITICAL: Download/copy credentials NOW!**

```
┌──────────────────────────────────────────────────────┐
│  ✅ User created successfully                         │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ⚠️  This is the ONLY time you can view the password │
│                                                      │
│  SMTP username:                                      │
│  ┌──────────────────────────────────┐                │
│  │ AKIAIOSFODNN7EXAMPLE             │ ← Copy this    │
│  └──────────────────────────────────┘                │
│                                                      │
│  SMTP password:                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │ BM+H0bG2Kfiug5F1kVcXYZABCDEFGHIJKLMNOPQR   │ ← Copy this │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  [Download credentials]  [Close]                     │
│                                                      │
└──────────────────────────────────────────────────────┘
```

6. **Copy both values** or click **"Download credentials"** (CSV file)

> ⚠️ You will NEVER be able to see the SMTP password again.
> If you lose it, you must create new credentials.

---

## Step 5: Update .env in the Project

Open your `.env` file and add the AWS SES credentials:

```bash
# ── Email Provider ──────────────────────────────────────
MAIL_PROVIDER=ses
MAIL_FROM="Vibe <your-verified-email@gmail.com>"

# AWS SES
AWS_SES_REGION=ap-northeast-2
AWS_SES_SMTP_USER=AKIAIOSFODNN7EXAMPLE          # ← Paste your SMTP username
AWS_SES_SMTP_PASSWORD=BM+H0bG2Kfiug5F1kVcXYZ... # ← Paste your SMTP password
```

> **MAIL_FROM must use your verified sender email!**
> In sandbox mode, the "from" address must be a verified identity.

---

## Step 6: Restart Backend & Test

### 6.1 Restart the NestJS server

The server will hot-reload automatically. Check the logs:

```
[MailService] Mail provider: AWS SES SMTP (ap-northeast-2)
```

If you see `Mail provider: SMTP (smtp.gmail.com)` instead, the env vars are not loaded. Try restarting manually.

### 6.2 Test via Sign Up

1. Open http://localhost:3000/auth/signup
2. Sign up with a **verified recipient email** (e.g., `buyer1@yopmail.com`)
3. Check:
   - Backend logs: `Email sent successfully: provider=ses, template=welcome, to=buyer1@yopmail.com`
   - Recipient inbox: Welcome email from "Vibe"

### 6.3 Test via curl (alternative)

```bash
# Sign in to get a token
FIREBASE_API_KEY="AIzaSyAlVpwJ91xzok_uMSdX4a57TrxX3R8nNRw"

# Create a new test user (triggers welcome email)
curl -s -X POST \
  "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=$FIREBASE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"verified-test@yopmail.com","password":"Test@1234","returnSecureToken":true}'

# The backend guard will auto-create the user and send a welcome email
```

### 6.4 Check Email Log in Database

```sql
SELECT "RCPNT_EML", "TMPLT_NM", "SND_STTS_CD", "ERR_MSG", "SND_DT"
FROM "TL_COMM_EML_LOG"
ORDER BY "SND_DT" DESC
LIMIT 5;
```

Expected result:
```
 RCPNT_EML              | TMPLT_NM | SND_STTS_CD | ERR_MSG | SND_DT
------------------------+----------+-------------+---------+---------------------
 buyer1@yopmail.com     | welcome  | SUCC        | NULL    | 2026-03-24 09:xx:xx
```

---

## Troubleshooting

### Error: "Email address is not verified"

```
MessageRejected: Email address is not verified.
The following identities failed the check in region AP-NORTHEAST-2: buyer1@yopmail.com
```

**Fix:** In sandbox mode, verify the recipient email:
- SES Console → Verified identities → Create identity → Add recipient email

### Error: "Credential should be scoped to a valid region"

**Fix:** Make sure `AWS_SES_REGION` matches the region where you verified identities:
```bash
AWS_SES_REGION=ap-northeast-2  # Must match SES console region
```

### Error: "Invalid login" or "Authentication failed"

**Fix:** You may be using IAM credentials instead of SMTP credentials:
- Go to SES Console → SMTP settings → Create **new** SMTP credentials
- SMTP credentials are DIFFERENT from IAM access keys

### Emails going to spam

In sandbox mode this is expected. For production:
1. Verify a domain (not just email)
2. Set up DKIM, SPF, DMARC DNS records
3. Request production access

---

## Summary

```
What you did:
  ✅ Created AWS account (free)
  ✅ Verified sender email in SES
  ✅ Verified recipient emails (sandbox)
  ✅ Created SMTP credentials
  ✅ Updated .env with SES config
  ✅ Tested email sending

What you get:
  📧 200 emails/day (free, sandbox)
  🔒 TLS encrypted SMTP
  📊 Email logs in database
  🔄 Auto-detect: remove AWS vars → falls back to Gmail SMTP
```

---

## Next Steps (When you have a domain)

| Step | Action |
|------|--------|
| 1 | Buy domain: Namecheap `.xyz` (~$1/yr) |
| 2 | Add domain to Cloudflare (free DNS) |
| 3 | Verify domain in SES (not just email) |
| 4 | Add DKIM CNAME records (3x) in Cloudflare |
| 5 | Add SPF TXT record in Cloudflare |
| 6 | Add DMARC TXT record in Cloudflare |
| 7 | Request SES production access |
| 8 | Update `MAIL_FROM` to use domain email |
