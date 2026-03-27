# 011-Email-Service: Email Notification Module Blueprint

> Platform-wide email notifications via Nodemailer SMTP -- welcome emails, order confirmations, password resets, and email verification.

## 1. Overview

### 1.1 Purpose

Build a centralized email service module that integrates with existing auth and order flows. Currently, the codebase has placeholder TODOs for email sending (e.g., `auth.service.ts` line 302: `// TODO: Send reset email via MailService`). This module fills that gap with HTML templates, async sending, and send logging.

### 1.2 Scope

- NestJS MailModule with MailService (Nodemailer + SMTP)
- HTML email templates with variable interpolation
- Welcome email on signup (with email verification link)
- Email verification endpoint (activate `emailVrfcYn`)
- Password reset email (complete existing TODO)
- Order confirmation email on successful checkout
- Email send logging (TL_COMM_EMAIL_LOG collection)
- Environment-based SMTP configuration

### 1.3 Out of Scope

- Third-party providers (SendGrid, AWS SES) -- SMTP only for now
- Push notifications / SMS
- Email preference settings UI
- Marketing / newsletter emails
- Attachment support

### 1.4 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS, Nodemailer |
| Template Engine | Handlebars (inline HTML) |
| Database | MongoDB (Prisma) |
| SMTP Provider | Configurable (Gmail, Mailtrap, etc.) |

## 2. Architecture

### 2.1 Module Structure

```
server/src/mail/
├── mail.module.ts          # NestJS module, exports MailService
├── mail.service.ts         # Core send logic, template rendering
├── mail.constants.ts       # Template names, default subjects
└── templates/
    ├── welcome.html        # Signup welcome + verification link
    ├── verify-email.html   # Email verification
    ├── reset-password.html # Password reset link
    └── order-confirm.html  # Order confirmation with items
```

### 2.2 Integration Points

```
AuthService.signup()        --> MailService.sendWelcomeEmail()
AuthService.forgotPassword()--> MailService.sendPasswordResetEmail()
OrderService.createOrder()  --> MailService.sendOrderConfirmation()
AuthController (new)        --> GET /api/auth/verify-email?token=xxx
```

### 2.3 Flow Diagram

```
[User Action] --> [Service Method] --> [MailService.send()]
                                            |
                                    [Render Template]
                                            |
                                    [Nodemailer Transport]
                                            |
                                    [Log to TL_COMM_EMAIL_LOG]
                                            |
                                    [SMTP Server] --> [User Inbox]
```

## 3. Database Design

### 3.1 TL_COMM_EMAIL_LOG (Email Send Log)

| Field | Column | Type | Description |
|-------|--------|------|-------------|
| id | _id | ObjectId | PK |
| recipientEmail | RCPNT_EML | String | Recipient email address |
| subject | SBJ | String | Email subject line |
| templateName | TMPLT_NM | String | Template used (welcome, reset-password, order-confirm) |
| sendStatus | SND_STTS_CD | String | SUCC / FAIL |
| errorMessage | ERR_MSG | String? | Error details if failed |
| sentAt | SND_DT | DateTime | Send timestamp |
| metadata | MTDT | Json? | Additional data (orderId, userId, etc.) |
| rgstDt | RGST_DT | DateTime | Created at |

### 3.2 Existing Fields Used

From `TB_COMM_USER` (already in schema):
- `emailVrfcYn` (EML_VRFC_YN) -- set to 'Y' after verification
- `emlVrfcTkn` (EML_VRFC_TKN) -- UUID token for verification link
- `emlVrfcExprDt` (EML_VRFC_EXPR_DT) -- 24h expiry
- `pswdRstTkn` (PSWD_RST_TKN) -- UUID token for reset link
- `pswdRstExprDt` (PSWD_RST_EXPR_DT) -- expiry for reset

## 4. API Endpoints

### 4.1 Email Verification

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/auth/verify-email | Public | Verify email with token query param |

**Request**: `GET /api/auth/verify-email?token=uuid-string`

**Response (200)**:
```json
{
  "success": true,
  "data": { "message": "Email verified successfully" }
}
```

**Response (400)**:
```json
{
  "success": false,
  "error": "INVALID_OR_EXPIRED_TOKEN"
}
```

## 5. Email Templates

### 5.1 Welcome Email
- **Subject**: "Welcome to Vibe! Verify your email"
- **Variables**: `{{name}}`, `{{verifyUrl}}`
- **Content**: Greeting, verify button/link, 24h expiry notice

### 5.2 Password Reset Email
- **Subject**: "Reset your Vibe password"
- **Variables**: `{{name}}`, `{{resetUrl}}`
- **Content**: Reset button/link, expiry notice, ignore-if-not-you disclaimer

### 5.3 Order Confirmation Email
- **Subject**: "Order {{orderNumber}} confirmed - Vibe"
- **Variables**: `{{name}}`, `{{orderNumber}}`, `{{items[]}}`, `{{totalAmount}}`, `{{shippingAddress}}`
- **Content**: Order summary, item list with prices, shipping info

## 6. Environment Configuration

Add to `.env.example` and `server/.env`:

```env
# Mail
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM="Vibe <noreply@vibe.com>"
```

## 7. Implementation Notes

- Use `async` sending -- do not block API responses waiting for email delivery
- Wrap mail sends in try/catch -- email failure should NOT fail the parent operation (signup, order)
- Log all send attempts (success and failure) to TL_COMM_EMAIL_LOG
- Verification URL format: `${FRONTEND_URL}/auth/verify-email?token=${emlVrfcTkn}`
- Reset URL format: `${FRONTEND_URL}/auth/reset-password?token=${pswdRstTkn}`
- Use `@nestjs/config` ConfigService for SMTP settings
- Register MailModule as global module or import in AuthModule and OrderModule
