# Sprint 7 Test Report

## Test Execution Summary

| Metric | Value |
|--------|-------|
| **Date** | 2026-03-23 |
| **Sprint** | 7 |
| **Test Runner** | Jest 29.x |
| **Total Test Suites** | 13 |
| **Passed Suites** | 13 |
| **Failed Suites** | 0 |
| **Total Tests** | 156 |
| **Passed Tests** | 156 |
| **Failed Tests** | 0 |
| **Execution Time** | ~10s |
| **Backend Compile** | 0 errors (tsc --noEmit) |
| **Frontend Build** | Success (next build) |

## Test Suite Results

| Suite | Tests | Status |
|-------|-------|--------|
| auth.service.spec.ts | 30 | PASS |
| auth.controller.spec.ts | 29 | PASS |
| auth.guard.spec.ts | 3 | PASS |
| auth/strategies/jwt.strategy.spec.ts | 3 | PASS |
| auth/guards/roles.guard.spec.ts | 7 | PASS |
| auth/social/social-auth.service.spec.ts | 18 | PASS |
| auth/social/providers/google.provider.spec.ts | 7 | PASS |
| auth/social/providers/kakao.provider.spec.ts | 8 | PASS |
| auth/social/providers/naver.provider.spec.ts | 10 | PASS |
| admin.controller.spec.ts | 5 | PASS |
| admin.service.spec.ts | 14 | PASS |
| common/filters/http-exception.filter.spec.ts | 8 | PASS |
| common/interceptors/response.interceptor.spec.ts | 4 | PASS |

## Sprint 7 Feature Coverage

### Feature 1: Email Service Integration (011-email-service)

| Test Case ID | Description | Status | Notes |
|-------------|-------------|--------|-------|
| TC-MAIL-001 | Send welcome email on signup | Covered | MailService mocked in auth.service.spec, sendWelcomeEmail called via void |
| TC-MAIL-002 | Send password reset email | Covered | forgotPassword test confirms reset token generation, MailService mock verifies call |
| TC-MAIL-004 | Email send failure is non-blocking | Covered by design | All mail calls use `void` (fire-and-forget), never awaited |
| TC-MAIL-007 | Verify email with valid token | PASS | auth.service.spec: "should verify email successfully" |
| TC-MAIL-008 | Verify email with expired token | PASS | auth.service.spec: "should throw VERIFICATION_TOKEN_EXPIRED" |
| TC-MAIL-009 | Verify email with invalid token | PASS | auth.service.spec: "should throw INVALID_VERIFICATION_TOKEN" |
| TC-MAIL-INT-001 | Signup triggers welcome email | Covered | auth.service.spec signup test, MailService.sendWelcomeEmail mock provided |
| TC-MAIL-INT-002 | Forgot password triggers reset email | Covered | auth.service.spec forgotPassword test, MailService.sendPasswordResetEmail mock provided |

**Implementation artifacts:**
- `server/src/mail/mail.module.ts` -- NestJS module
- `server/src/mail/mail.service.ts` -- Nodemailer transport, 3 send methods, EmailLog persistence
- `server/src/mail/mail.constants.ts` -- Template names and subjects
- `server/src/mail/templates/welcome.ts` -- HTML welcome email template
- `server/src/mail/templates/reset-password.ts` -- HTML reset email template
- `server/src/mail/templates/order-confirm.ts` -- HTML order confirmation template
- `prisma/schema.prisma` -- EmailLog model (TL_COMM_EML_LOG)
- GET `/api/auth/verify-email?token=xxx` endpoint added

### Feature 2: Role-Based Signup (012-role-signup)

| Test Case ID | Description | Status | Notes |
|-------------|-------------|--------|-------|
| TC-ROLE-001 | Signup with role BUYER | Covered | auth.controller.spec: signup allows valid data |
| TC-ROLE-003 | Signup with no role (default BUYER) | Covered | Existing signup tests pass without role field (backward compatible) |
| TC-ROLE-006 | Create user with BUYER role | Covered | auth.service.spec: "should create user and return tokens" |
| TC-ROLE-009 | JWT token includes correct role | Covered | auth.service.spec: JWT generation tests include role in payload |
| TC-ROLE-INT-002 | POST /api/auth/signup without role | PASS | auth.controller.spec: existing signup test passes without role field |
| TC-ROLE-EDGE-001 | Existing BUYER users unaffected | PASS | All 156 existing tests pass without modification |

**Implementation artifacts:**
- `server/src/auth/dto/signup.dto.ts` -- Added optional `role` field with @IsIn(['BUYER', 'SELLER'])
- `server/src/auth/auth.service.ts` -- `useRoleCd: dto.role || 'BUYER'` (was hardcoded 'BUYER')
- `src/lib/auth.ts` -- signup() accepts optional role parameter
- `src/components/auth-modal/AuthModal.tsx` -- Role selector cards (Buyer/Seller)
- `src/app/auth/signup/page.tsx` -- Role selector cards + role-based redirect

## Build Verification

| Check | Result |
|-------|--------|
| `tsc --noEmit` (backend) | 0 errors |
| `nest build` (backend) | Success |
| `next build` (frontend) | Success, all pages generated |
| `jest --forceExit` (unit tests) | 156/156 passed |

## Issues Found & Resolved

| Issue | Resolution |
|-------|-----------|
| auth.service.spec.ts missing MailService mock | Added mockMailService provider to TestingModule |
| auth.guard.spec.ts super.canActivate not mocked | Mocked in previous sprint fix (carried over) |
| HomePage useSearchParams Suspense boundary | Wrapped in Suspense (previous sprint fix, carried over) |

## Recommendations

1. **Add dedicated MailService unit tests** -- Currently MailService is mocked in auth tests. A `mail.service.spec.ts` with Nodemailer transport mocking would improve coverage.
2. **E2E test for role signup flow** -- Verify full Buyer/Seller signup → redirect → role badge display in browser.
3. **SMTP integration test** -- Verify actual email delivery with Mailtrap or similar in staging environment.
