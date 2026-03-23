# Email Service Test Cases (Sprint 7)

## Unit Tests

### MailService

#### TC-MAIL-001: Send welcome email on signup
- **Given**: A new user signs up with email "test@example.com" and name "John"
- **When**: MailService.sendWelcomeEmail() is called
- **Then**: Nodemailer transport sends email with subject "Welcome to Vibe! Verify your email", recipient "test@example.com", and HTML body containing name and verification link

#### TC-MAIL-002: Send password reset email
- **Given**: A user requests password reset
- **When**: MailService.sendPasswordResetEmail() is called with email and reset token
- **Then**: Email is sent with subject "Reset your Vibe password" and body containing reset URL with token

#### TC-MAIL-003: Send order confirmation email
- **Given**: A buyer completes checkout with order number "VB-2026-0323-001"
- **When**: MailService.sendOrderConfirmation() is called with order details
- **Then**: Email is sent with subject "Order VB-2026-0323-001 confirmed - Vibe" and body containing item list, total amount, and shipping address

#### TC-MAIL-004: Email send failure is non-blocking
- **Given**: SMTP server is unreachable
- **When**: MailService.sendWelcomeEmail() is called
- **Then**: The method does not throw, returns gracefully, and logs the error to TL_COMM_EML_LOG with SND_STTS_CD = 'FAIL'

#### TC-MAIL-005: Email send success is logged
- **Given**: SMTP server is available
- **When**: Any email is sent successfully
- **Then**: A record is created in TL_COMM_EML_LOG with SND_STTS_CD = 'SUCC', correct TMPLT_NM, and SND_DT

#### TC-MAIL-006: Template rendering with variables
- **Given**: A welcome email template with {{name}} and {{verifyUrl}} placeholders
- **When**: Template is rendered with name="Jane" and verifyUrl="http://localhost:3000/auth/verify-email?token=abc123"
- **Then**: HTML output contains "Jane" and the full verification URL

### Email Verification Endpoint

#### TC-MAIL-007: Verify email with valid token
- **Given**: A user with emlVrfcTkn = "valid-uuid" and emlVrfcExprDt in the future
- **When**: GET /api/auth/verify-email?token=valid-uuid
- **Then**: Response 200 with success message, user's emailVrfcYn is set to 'Y', emlVrfcTkn is cleared

#### TC-MAIL-008: Verify email with expired token
- **Given**: A user with emlVrfcTkn = "expired-uuid" and emlVrfcExprDt in the past
- **When**: GET /api/auth/verify-email?token=expired-uuid
- **Then**: Response 400 with error "INVALID_OR_EXPIRED_TOKEN"

#### TC-MAIL-009: Verify email with invalid token
- **Given**: No user has the provided token
- **When**: GET /api/auth/verify-email?token=nonexistent-uuid
- **Then**: Response 400 with error "INVALID_OR_EXPIRED_TOKEN"

#### TC-MAIL-010: Verify email with missing token param
- **Given**: No token query parameter
- **When**: GET /api/auth/verify-email
- **Then**: Response 400 with validation error

## Integration Tests

### Auth + Mail Integration

#### TC-MAIL-INT-001: Signup triggers welcome email
- **Given**: Mail module is configured and SMTP is available
- **When**: POST /api/auth/signup with valid data
- **Then**: User is created AND welcome email is sent to the registered email AND email log record is created

#### TC-MAIL-INT-002: Forgot password triggers reset email
- **Given**: A registered user with email "existing@example.com"
- **When**: POST /api/auth/forgot-password with email "existing@example.com"
- **Then**: Reset token is generated AND password reset email is sent AND email log record is created

### Order + Mail Integration

#### TC-MAIL-INT-003: Order creation triggers confirmation email
- **Given**: A logged-in buyer with items in cart
- **When**: POST /api/orders with valid checkout data
- **Then**: Order is created AND order confirmation email is sent to buyer AND email log record is created

#### TC-MAIL-INT-004: Email failure does not block order creation
- **Given**: SMTP is unavailable
- **When**: POST /api/orders with valid checkout data
- **Then**: Order is created successfully AND email log shows FAIL status AND API returns success

## Edge Cases

#### TC-MAIL-EDGE-001: Special characters in user name
- **Given**: User name contains special characters like "O'Brien" or "José"
- **When**: Welcome email is sent
- **Then**: Name renders correctly in email HTML without XSS or encoding issues

#### TC-MAIL-EDGE-002: Very long email address
- **Given**: Email address is 100 characters long (maximum allowed)
- **When**: Email is sent
- **Then**: Email is sent successfully without truncation
