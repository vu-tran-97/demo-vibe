# Email Feature E2E Test Scenarios

## Overview
- **Feature**: Transactional email notifications with dual-provider support (AWS SES SMTP primary, Google SMTP fallback)
- **Related Modules**: Mail, Auth, Order
- **API Endpoints**: `POST /api/auth/signup` (triggers welcome email), `POST /api/orders` (triggers order confirmation email)
- **DB Tables**: TL_COMM_EML_LOG, TB_COMM_USER, TB_COMM_ORDR
- **Mail Templates**: `welcome` (signup), `order-confirm` (checkout)
- **Provider Logic**: `MAIL_PROVIDER` env (`ses` | `smtp`) or auto-detect (AWS_SES_SMTP_USER present -> SES, else -> SMTP)
- **Blueprint**: docs/blueprints/011-email-service/blueprint.md

## Summary Table

| ID | Scenario | Type | Priority | Group |
|----|----------|------|----------|-------|
| E2E-001 | Welcome email sent on first-time signup | Happy | Critical | Welcome Email |
| E2E-002 | Welcome email not sent on returning user login | Alternative | High | Welcome Email |
| E2E-003 | Welcome email contains correct user name | Happy | High | Welcome Email |
| E2E-004 | Welcome email subject matches template | Happy | Medium | Welcome Email |
| E2E-005 | Order confirmation email sent after order creation | Happy | Critical | Order Confirmation |
| E2E-006 | Order confirmation includes order number and items | Happy | Critical | Order Confirmation |
| E2E-007 | Order confirmation subject contains order number | Happy | Medium | Order Confirmation |
| E2E-008 | Multiple orders send separate confirmation emails | Alternative | High | Order Confirmation |
| E2E-009 | Email log created with SUCC status on successful send | Happy | Critical | Email Logging |
| E2E-010 | Email log created with FAIL status on send failure | Happy | Critical | Email Logging |
| E2E-011 | Email log records recipient, subject, template, and timestamp | Happy | High | Email Logging |
| E2E-012 | Order confirmation log includes orderNumber metadata | Happy | High | Email Logging |
| E2E-013 | Email log failure does not propagate to caller | Edge | Medium | Email Logging |
| E2E-014 | SES provider selected when MAIL_PROVIDER=ses | Happy | High | Provider Fallback |
| E2E-015 | SMTP provider selected when MAIL_PROVIDER=smtp | Happy | High | Provider Fallback |
| E2E-016 | Auto-detect selects SES when AWS_SES_SMTP_USER is set | Happy | High | Provider Fallback |
| E2E-017 | Auto-detect falls back to SMTP when no SES credentials | Happy | High | Provider Fallback |
| E2E-018 | Provider logged on startup | Happy | Medium | Provider Fallback |
| E2E-019 | SMTP failure does not block signup | Happy | Critical | Error Handling |
| E2E-020 | SMTP failure does not block order creation | Happy | Critical | Error Handling |
| E2E-021 | Transporter connection failure logged and recorded | Error | High | Error Handling |
| E2E-022 | Invalid recipient email address handled gracefully | Edge | Medium | Error Handling |

---

## Scenario Group 1: Welcome Email on Signup

### E2E-001: Welcome email sent on first-time signup
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: SMTP configured and working (Mailtrap or SES sandbox); no user with email "e2e-welcome-new@test.com"
- **User Journey**:
  1. Navigate to `/auth/signup`
  2. Select "Buyer" role
  3. Fill in name: "New Buyer", email: "e2e-welcome-new@test.com", password: "Test1234!"
  4. Accept terms and click "Create Account"
  5. User is logged in and redirected to homepage
- **Expected Results**:
  - UI: User redirected to "/" with logged-in state; no error toast
  - API: `POST /api/auth/signup` returns 201; `findOrCreateUser()` creates new user and calls `void this.mailService.sendWelcomeEmail(email, user.userNm)`
  - DB: TL_COMM_EML_LOG record created with `TMPLT_NM='welcome'`, `SND_STTS_CD='SUCC'`, `RCPNT_EML='e2e-welcome-new@test.com'`, `SBJ='Welcome to Vibe!'`
  - Server Log: `Email sent successfully: provider=ses, template=welcome, to=e2e-welcome-new@test.com`
- **Verification Method**: network / db-query / server-log
- **Test Data**: `{ email: "e2e-welcome-new@test.com", password: "Test1234!", name: "New Buyer", role: "BUYER" }`

### E2E-002: Welcome email not sent on returning user login
- **Type**: Alternative Path
- **Priority**: High
- **Preconditions**: User "e2e-returning@test.com" already exists in TB_COMM_USER
- **User Journey**:
  1. Login with "e2e-returning@test.com"
  2. Check email log
- **Expected Results**:
  - API: `findOrCreateUser()` finds existing user and skips the welcome email branch (email only sent inside `if (!user)` block)
  - DB: No new TL_COMM_EML_LOG record with TMPLT_NM='welcome' created for this login
  - Server Log: No `Email sent successfully: template=welcome` log entry
- **Verification Method**: db-query / server-log
- **Test Data**: `{ email: "e2e-returning@test.com" }`

### E2E-003: Welcome email contains correct user name
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: SMTP configured; Mailtrap or email capture available
- **User Journey**:
  1. Sign up with name "Alice Builder"
  2. Inspect captured email HTML
- **Expected Results**:
  - API: `sendWelcomeEmail(email, user.userNm)` passes "Alice Builder" to `welcomeTemplate({ name })`
  - Email: HTML body contains personalized greeting with "Alice Builder"
- **Verification Method**: email-capture / server-log
- **Test Data**: `{ name: "Alice Builder", email: "e2e-alice@test.com" }`

### E2E-004: Welcome email subject matches template
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Signup completed
- **User Journey**:
  1. Sign up new user
  2. Verify email subject
- **Expected Results**:
  - API: Subject line set to `MAIL_TEMPLATES.WELCOME.subject` = `"Welcome to Vibe!"`
  - DB: TL_COMM_EML_LOG.SBJ = "Welcome to Vibe!"
- **Verification Method**: db-query / email-capture
- **Test Data**: Any valid signup data

---

## Scenario Group 2: Order Confirmation Email

### E2E-005: Order confirmation email sent after order creation
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Authenticated buyer; at least one active product with stock > 0
- **User Journey**:
  1. Add product to cart
  2. Proceed to checkout, fill shipping info
  3. Submit order
  4. Observe order confirmation page
- **Expected Results**:
  - UI: Order confirmation page displayed with order number
  - API: `POST /api/orders` returns 201; `void this.sendOrderConfirmEmail(buyerId, orderNumber, orderItems, totalAmount, dto)` called (non-blocking)
  - DB: TL_COMM_EML_LOG record with `TMPLT_NM='order-confirm'`, `SND_STTS_CD='SUCC'`, RCPNT_EML = buyer's email
  - Server Log: `Email sent successfully: provider=ses, template=order-confirm, to={buyer-email}`
- **Verification Method**: network / db-query / server-log
- **Test Data**: `{ items: [{ productId: 1, quantity: 1 }], shipAddr: "123 Test St", shipRcvrNm: "Test Buyer", shipTelno: "01012345678" }`

### E2E-006: Order confirmation includes order number and items
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Order created with multiple items
- **User Journey**:
  1. Create order with 2 items
  2. Inspect captured email HTML
- **Expected Results**:
  - API: `orderConfirmTemplate({ name, order })` receives `OrderConfirmData` with `orderNumber`, `items`, `totalAmount`, `shippingAddress`
  - Email: HTML body contains order number (VB-YYYY-MMDD-NNN format), each item's name/quantity/price, total amount, shipping address
  - DB: TL_COMM_EML_LOG.MTDT JSON contains `{ orderNumber: "VB-..." }`
- **Verification Method**: email-capture / db-query
- **Test Data**: `{ items: [{ productId: 1, quantity: 2 }, { productId: 2, quantity: 1 }] }`

### E2E-007: Order confirmation subject contains order number
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Order created with order number "VB-2026-0325-001"
- **User Journey**:
  1. Create order
  2. Verify email subject
- **Expected Results**:
  - API: Subject set to `MAIL_TEMPLATES.ORDER_CONFIRMATION.subject(order.orderNumber)` = `"Order VB-2026-0325-001 confirmed - Vibe"`
  - DB: TL_COMM_EML_LOG.SBJ matches `"Order VB-2026-0325-001 confirmed - Vibe"`
- **Verification Method**: db-query
- **Test Data**: Order with known order number

### E2E-008: Multiple orders send separate confirmation emails
- **Type**: Alternative Path
- **Priority**: High
- **Preconditions**: Authenticated buyer; two active products with sufficient stock
- **User Journey**:
  1. Create first order
  2. Create second order
  3. Check email log
- **Expected Results**:
  - DB: Two separate TL_COMM_EML_LOG records with TMPLT_NM='order-confirm', each with distinct MTDT.orderNumber values and different SND_DT timestamps
- **Verification Method**: db-query
- **Test Data**: Two separate order payloads

---

## Scenario Group 3: Email Logging Verification

### E2E-009: Email log created with SUCC status on successful send
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: SMTP working correctly
- **User Journey**:
  1. Trigger any email (signup or order)
  2. Query TL_COMM_EML_LOG
- **Expected Results**:
  - DB: New record with `SND_STTS_CD='SUCC'`, `ERR_MSG=NULL`, `SND_DT` populated, `RGST_DT` populated
  - DB Schema: Fields match `{ rcpntEml, sbj, tmpltNm, sndSttsCd, errMsg, sndDt, mtdt, rgstDt }`
- **Verification Method**: db-query
- **Test Data**: Any email trigger

### E2E-010: Email log created with FAIL status on send failure
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: SMTP misconfigured (invalid credentials or unreachable host)
- **User Journey**:
  1. Configure invalid SMTP credentials
  2. Trigger signup to send welcome email
  3. Query TL_COMM_EML_LOG
- **Expected Results**:
  - DB: Record with `SND_STTS_CD='FAIL'`, `ERR_MSG` contains error message (e.g., "Invalid login" or "ECONNREFUSED"), `SND_DT` populated
  - Server Log: `Failed to send email: provider=smtp, template=welcome, to={email}, error={message}`
- **Verification Method**: db-query / server-log
- **Test Data**: Invalid SMTP config + valid signup data

### E2E-011: Email log records recipient, subject, template, and timestamp
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Welcome email sent successfully
- **User Journey**:
  1. Sign up as "Log Test" with "e2e-log-verify@test.com"
  2. Query the latest TL_COMM_EML_LOG record
- **Expected Results**:
  - DB: Record fields: `RCPNT_EML='e2e-log-verify@test.com'`, `SBJ='Welcome to Vibe!'`, `TMPLT_NM='welcome'`, `SND_DT` within last 5 seconds, `RGST_DT` within last 5 seconds
- **Verification Method**: db-query
- **Test Data**: `{ email: "e2e-log-verify@test.com", name: "Log Test" }`

### E2E-012: Order confirmation log includes orderNumber metadata
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Order created and confirmation email sent
- **User Journey**:
  1. Create order
  2. Query TL_COMM_EML_LOG for TMPLT_NM='order-confirm'
- **Expected Results**:
  - DB: `MTDT` JSON column contains `{ "orderNumber": "VB-..." }`; matches the order's ORDR_NO in TB_COMM_ORDR
  - API: `logEmailSend()` receives `metadata: { orderNumber: order.orderNumber }` from `sendOrderConfirmation()`
- **Verification Method**: db-query
- **Test Data**: Any order creation

### E2E-013: Email log failure does not propagate to caller
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: DB connection intermittently failing (simulate Prisma error on emailLog.create)
- **User Journey**:
  1. Trigger email send (e.g., signup)
  2. Email sends successfully but `prisma.emailLog.create` throws
- **Expected Results**:
  - UI: User sees successful signup (no error)
  - API: 201 response returned normally
  - Server Log: `Failed to log email send: {error message}` (caught in try/catch within `logEmailSend()`)
  - DB: No TL_COMM_EML_LOG record (logging failed), but TB_COMM_USER record created
- **Verification Method**: server-log / db-query
- **Test Data**: Simulated Prisma failure

---

## Scenario Group 4: Provider Fallback

### E2E-014: SES provider selected when MAIL_PROVIDER=ses
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: `MAIL_PROVIDER=ses`, `AWS_SES_SMTP_USER` and `AWS_SES_SMTP_PASSWORD` configured, `AWS_SES_REGION=ap-northeast-2`
- **User Journey**:
  1. Start server with `MAIL_PROVIDER=ses`
  2. Observe startup logs
  3. Trigger email send
- **Expected Results**:
  - Server Log (startup): `Mail provider: AWS SES SMTP (ap-northeast-2)`
  - Server Log (send): `Email sent successfully: provider=ses, template=...`
  - DB: Transporter connects to `email-smtp.ap-northeast-2.amazonaws.com:587`
- **Verification Method**: server-log
- **Test Data**: `{ MAIL_PROVIDER: "ses", AWS_SES_REGION: "ap-northeast-2" }`

### E2E-015: SMTP provider selected when MAIL_PROVIDER=smtp
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: `MAIL_PROVIDER=smtp`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD` configured
- **User Journey**:
  1. Start server with `MAIL_PROVIDER=smtp`
  2. Observe startup logs
- **Expected Results**:
  - Server Log (startup): `Mail provider: SMTP ({MAIL_HOST})`
  - API: Emails sent through generic SMTP transporter (e.g., smtp.gmail.com or Mailtrap)
- **Verification Method**: server-log
- **Test Data**: `{ MAIL_PROVIDER: "smtp", MAIL_HOST: "smtp.mailtrap.io" }`

### E2E-016: Auto-detect selects SES when AWS_SES_SMTP_USER is set
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: `MAIL_PROVIDER` not set (undefined), `AWS_SES_SMTP_USER` set to valid value
- **User Journey**:
  1. Start server without `MAIL_PROVIDER` env but with `AWS_SES_SMTP_USER`
  2. Observe startup logs
- **Expected Results**:
  - Server Log: `Mail provider: AWS SES SMTP (...)` (resolveProvider returns 'ses')
  - API: `resolveProvider()` checks `AWS_SES_SMTP_USER` is truthy, returns 'ses'
- **Verification Method**: server-log
- **Test Data**: `{ AWS_SES_SMTP_USER: "AKIA..." }`

### E2E-017: Auto-detect falls back to SMTP when no SES credentials
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: `MAIL_PROVIDER` not set, `AWS_SES_SMTP_USER` not set, `MAIL_HOST` configured
- **User Journey**:
  1. Start server without SES credentials
  2. Observe startup logs
- **Expected Results**:
  - Server Log: `Mail provider: SMTP ({MAIL_HOST})`
  - API: `resolveProvider()` falls through to return 'smtp'
- **Verification Method**: server-log
- **Test Data**: `{ MAIL_HOST: "smtp.gmail.com", MAIL_USER: "test@gmail.com" }`

### E2E-018: Provider logged on startup
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Any valid mail configuration
- **User Journey**:
  1. Start server
  2. Check NestJS bootstrap logs
- **Expected Results**:
  - Server Log: One of `Mail provider: AWS SES SMTP (...)` or `Mail provider: SMTP (...)` appears during MailService constructor initialization
- **Verification Method**: server-log
- **Test Data**: Any mail env config

---

## Scenario Group 5: Error Handling (Send Failure)

### E2E-019: SMTP failure does not block signup
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Invalid SMTP credentials (wrong password)
- **User Journey**:
  1. Navigate to `/auth/signup`
  2. Fill valid signup data and submit
  3. Observe user is created and logged in
- **Expected Results**:
  - UI: User redirected to homepage in logged-in state; no error message shown
  - API: `POST /api/auth/signup` returns 201 (email sent with `void` fire-and-forget pattern)
  - DB: TB_COMM_USER record created; TL_COMM_EML_LOG record with `SND_STTS_CD='FAIL'`
  - Server Log: `Failed to send email: provider=smtp, template=welcome, to={email}, error={message}`
- **Verification Method**: network / db-query / server-log
- **Test Data**: `{ email: "e2e-smtp-fail@test.com", password: "Test1234!", name: "SMTP Fail Test" }`

### E2E-020: SMTP failure does not block order creation
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Invalid SMTP credentials; authenticated buyer; active product with stock
- **User Journey**:
  1. Login as buyer
  2. Add product to cart
  3. Submit order
  4. Observe order is created successfully
- **Expected Results**:
  - UI: Order confirmation page shown with order number
  - API: `POST /api/orders` returns 201; `void this.sendOrderConfirmEmail(...)` does not throw to caller
  - DB: TB_COMM_ORDR created with ORDR_STTS_CD='PENDING'; TL_COMM_EML_LOG with SND_STTS_CD='FAIL'
  - Server Log: `Order {orderNumber} created by buyer {id}` followed by `Failed to send email: provider=smtp, template=order-confirm`
- **Verification Method**: network / db-query / server-log
- **Test Data**: Valid order payload with broken SMTP

### E2E-021: Transporter connection failure logged and recorded
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: SMTP host unreachable (e.g., `MAIL_HOST=nonexistent.smtp.example.com`)
- **User Journey**:
  1. Start server with unreachable SMTP host
  2. Trigger signup
- **Expected Results**:
  - DB: TL_COMM_EML_LOG record with `SND_STTS_CD='FAIL'`, `ERR_MSG` containing "ENOTFOUND" or "ECONNREFUSED"
  - Server Log: `Failed to send email: provider=smtp, template=welcome, to={email}, error=getaddrinfo ENOTFOUND...`
  - API: Signup still returns 201
- **Verification Method**: db-query / server-log
- **Test Data**: `{ MAIL_HOST: "nonexistent.smtp.example.com" }`

### E2E-022: Invalid recipient email address handled gracefully
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: SMTP configured correctly; user somehow has malformed email in DB (e.g., "not-an-email")
- **User Journey**:
  1. Directly call `mailService.sendWelcomeEmail("not-an-email", "Test")`
  2. Observe behavior
- **Expected Results**:
  - DB: TL_COMM_EML_LOG with `SND_STTS_CD='FAIL'`, `ERR_MSG` describing invalid recipient
  - Server Log: `Failed to send email: provider=..., template=welcome, to=not-an-email, error=...`
  - API: No exception propagated (caught in `send()` try/catch)
- **Verification Method**: db-query / server-log
- **Test Data**: `{ to: "not-an-email", template: "welcome" }`
