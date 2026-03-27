# Email Service E2E Test Scenarios

## Overview
- **Feature**: Platform-wide email notifications (welcome, order confirmation, password reset, email verification)
- **Related Modules**: Auth, Order, Mail
- **API Endpoints**: POST /api/auth/signup, GET /api/auth/verify-email, POST /api/auth/forgot-password, POST /api/auth/reset-password, POST /api/orders
- **DB Tables**: TB_COMM_USER, TL_COMM_EML_LOG, TB_COMM_ORDR
- **Blueprint**: docs/blueprints/011-email-service/blueprint.md

## Scenario Group 1: Welcome Email on Signup

### E2E-001: Welcome email sent on successful signup
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: SMTP configured (Mailtrap), no user with email "e2e-welcome@test.com"
- **User Journey**:
  1. Navigate to /auth/signup
  2. Select "Buyer" role
  3. Fill in name: "Welcome Test", email: "e2e-welcome@test.com", password: "Test1234!"
  4. Accept terms and click "Create Account"
  5. Observe redirect to homepage
- **Expected Results**:
  - UI: User is redirected to "/" with logged-in state
  - API: POST /api/auth/signup returns 201 with user.emailVerified = false
  - DB: TL_COMM_EML_LOG has record with TMPLT_NM = "welcome", SND_STTS_CD = "SUCC", RCPNT_EML = "e2e-welcome@test.com"
  - Server Log: `[MailService] Email sent successfully: template=welcome, to=e2e-welcome@test.com`
  - Email: Mailtrap inbox shows email with subject "Welcome to Vibe! Verify your email" containing verification link
- **Verification Method**: network / db-query / server-log
- **Test Data**: { email: "e2e-welcome@test.com", password: "Test1234!", name: "Welcome Test", role: "BUYER" }

### E2E-002: Welcome email contains valid verification link
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: User signed up and welcome email received in Mailtrap
- **User Journey**:
  1. Open Mailtrap inbox, find the welcome email
  2. Extract verification URL from email body
  3. Verify URL matches format: `{FRONTEND_URL}/auth/verify-email?token={UUID}`
  4. Open the verification URL in browser
- **Expected Results**:
  - UI: Verification page shows "Email verified successfully" message
  - API: GET /api/auth/verify-email?token={token} returns 200
  - DB: TB_COMM_USER.EML_VRFC_YN updated to 'Y', EML_VRFC_TKN cleared
- **Verification Method**: network / db-query
- **Test Data**: Token from welcome email

### E2E-003: Signup with SMTP failure does not block user creation
- **Type**: Edge Case
- **Priority**: High
- **Preconditions**: Invalid SMTP credentials configured
- **User Journey**:
  1. Navigate to /auth/signup
  2. Fill valid signup data and submit
- **Expected Results**:
  - UI: User is created and redirected successfully (no error shown)
  - API: POST /api/auth/signup returns 201
  - DB: User record created, TL_COMM_EML_LOG has record with SND_STTS_CD = "FAIL"
  - Server Log: `[MailService] Failed to send email: template=welcome`
- **Verification Method**: network / db-query / server-log
- **Test Data**: { email: "smtp-fail@test.com", password: "Test1234!", name: "SMTP Fail" }

## Scenario Group 2: Email Verification Flow

### E2E-004: Verify email with valid token
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: User signed up, has valid emlVrfcTkn in DB
- **User Journey**:
  1. GET /api/auth/verify-email?token={valid-token}
- **Expected Results**:
  - API: 200 response with { success: true, data: { message: "Email verified successfully" } }
  - DB: User.emailVrfcYn = 'Y', emlVrfcTkn = null
- **Verification Method**: network / db-query
- **Test Data**: Valid UUID token from signup

### E2E-005: Verify email with expired token (24h+)
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: User with emlVrfcExprDt in the past
- **User Journey**:
  1. GET /api/auth/verify-email?token={expired-token}
- **Expected Results**:
  - API: 400 response with error "INVALID_OR_EXPIRED_TOKEN" or "VERIFICATION_TOKEN_EXPIRED"
  - DB: User.emailVrfcYn remains 'N'
- **Verification Method**: network
- **Test Data**: Expired token

### E2E-006: Verify email with invalid/nonexistent token
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: None
- **User Journey**:
  1. GET /api/auth/verify-email?token=nonexistent-uuid-token
- **Expected Results**:
  - API: 400 response with error "INVALID_OR_EXPIRED_TOKEN" or "INVALID_VERIFICATION_TOKEN"
- **Verification Method**: network
- **Test Data**: Random UUID

## Scenario Group 3: Password Reset Email

### E2E-007: Forgot password sends reset email
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Registered user with email "reset-test@test.com"
- **User Journey**:
  1. Navigate to /auth/forgot-password
  2. Enter email: "reset-test@test.com"
  3. Click "Send Reset Link"
- **Expected Results**:
  - UI: Success message "If an account exists, a reset link has been sent"
  - API: POST /api/auth/forgot-password returns 200
  - DB: TL_COMM_EML_LOG has record with TMPLT_NM = "reset-password", SND_STTS_CD = "SUCC"
  - Email: Mailtrap shows email with subject "Reset your Vibe password" containing reset link
- **Verification Method**: network / db-query / server-log
- **Test Data**: { email: "reset-test@test.com" }

### E2E-008: Reset password via email link
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Password reset email received
- **User Journey**:
  1. Extract reset URL from Mailtrap email
  2. Navigate to reset URL (format: /auth/reset-password?token={token})
  3. Enter new password: "NewPass1234!"
  4. Confirm password and submit
- **Expected Results**:
  - UI: Success message, redirect to login
  - API: POST /api/auth/reset-password returns 200
  - DB: User.USE_PSWD updated (new bcrypt hash), PSWD_RST_TKN cleared
- **Verification Method**: network / db-query
- **Test Data**: { token: from email, password: "NewPass1234!" }

### E2E-009: Forgot password for nonexistent email (no enumeration)
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: No user with email "nobody@test.com"
- **User Journey**:
  1. POST /api/auth/forgot-password with email: "nobody@test.com"
- **Expected Results**:
  - API: 200 response (same as valid email, to prevent user enumeration)
  - DB: No email log created (no email sent)
- **Verification Method**: network / db-query
- **Test Data**: { email: "nobody@test.com" }

## Scenario Group 4: Order Confirmation Email

### E2E-010: Order creation sends confirmation email
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged-in buyer with access token, products available in stock
- **User Journey**:
  1. Login as buyer
  2. POST /api/orders with valid items, shipping address
  3. Observe order creation response
- **Expected Results**:
  - API: POST /api/orders returns 201 with order data
  - DB: TL_COMM_EML_LOG has record with TMPLT_NM = "order-confirm", SND_STTS_CD = "SUCC"
  - Email: Mailtrap shows email with subject "Order {orderNo} confirmed - Vibe" containing item list and total
  - Server Log: `[MailService] Email sent successfully: template=order-confirm`
- **Verification Method**: network / db-query / server-log
- **Test Data**: Valid order with 1+ items

### E2E-011: Order confirmation email contains correct order details
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Order created successfully, confirmation email in Mailtrap
- **User Journey**:
  1. Open order confirmation email in Mailtrap
  2. Verify email content matches order data
- **Expected Results**:
  - Email contains: order number, item names, quantities, unit prices, total amount, shipping address
  - All values match the API response from order creation
- **Verification Method**: manual / snapshot
- **Test Data**: Order from E2E-010

---

## Summary
| Type | Count |
|------|-------|
| Happy Path | 7 |
| Alternative Path | 0 |
| Edge Case | 2 |
| Error Path | 2 |
| **Total** | **11** |
