# Auth E2E Test Scenarios

## Overview
- **Feature**: Authentication — signup, login, logout, token refresh, email verification, password reset
- **Related Modules**: Auth module (NestJS), Auth modal (Next.js), User menu, Homepage
- **API Endpoints**: POST `/api/auth/signup`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/refresh`, `/api/auth/verify-email`, `/api/auth/forgot-password`, `/api/auth/reset-password`
- **DB Tables**: TB_COMM_USER, TB_COMM_RFRSH_TKN, TL_COMM_LGN_LOG
- **Existing Test Cases**: `sprint-1/auth-test-cases.md` (78 unit/integration/edge/security tests)

---

## Scenario Group 1: User Signup Journey

### E2E-001: Successful email signup via modal
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: No user with email `e2e-signup@example.com` exists. Server running at localhost:4000.
- **User Journey**:
  1. Navigate to `http://localhost:3000/`
  2. Click "Sign Up" button in top bar
  3. Verify auth modal appears with "Create account" heading
  4. Fill "Full Name" with `E2E Test User`
  5. Fill "Nickname" with `e2e_tester`
  6. Fill "Email" with `e2e-signup@example.com`
  7. Fill "Password" with `Test@1234!`
  8. Click "Create Account" button
  9. Wait for modal to close and page to redirect to `/dashboard`
- **Expected Results**:
  - UI: Modal closes, dashboard page loads, user name displayed in header
  - API: `POST /api/auth/signup` returns 201 with `{ success: true, data: { user: { role: 'BUYER' }, accessToken, refreshToken } }`
  - DB: New user record in TB_COMM_USER with `USE_ROLE_CD: 'BUYER'`, `USE_STTS_CD: 'ACTV'`, `EMAIL_VRFC_YN: 'N'`
  - Server Log: No errors
- **Verification Method**: snapshot / network
- **Test Data**: `{ email: "e2e-signup@example.com", password: "Test@1234!", name: "E2E Test User", nickname: "e2e_tester" }`

### E2E-002: Signup without optional nickname
- **Type**: Alternative Path
- **Priority**: Medium
- **Preconditions**: No user with email `e2e-nonick@example.com` exists
- **User Journey**:
  1. Navigate to `http://localhost:3000/`
  2. Click "Sign Up" button in top bar
  3. Fill "Full Name" with `No Nick User`
  4. Leave "Nickname" field empty
  5. Fill "Email" with `e2e-nonick@example.com`
  6. Fill "Password" with `Test@1234!`
  7. Click "Create Account" button
- **Expected Results**:
  - UI: Modal closes, redirected to `/dashboard`
  - API: `POST /api/auth/signup` returns 201 with `data.user.nickname: null`
  - DB: User created with `USE_NCNM: null`
- **Verification Method**: snapshot / network
- **Test Data**: `{ email: "e2e-nonick@example.com", password: "Test@1234!", name: "No Nick User" }`

### E2E-003: Signup with duplicate email shows error
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: User `admin@astratech.vn` exists (from seed)
- **User Journey**:
  1. Navigate to `http://localhost:3000/`
  2. Click "Sign Up" in top bar
  3. Fill form with `admin@astratech.vn` / `Test@1234!` / `Duplicate User`
  4. Click "Create Account"
- **Expected Results**:
  - UI: Error message "This email is already registered." displayed in modal
  - API: `POST /api/auth/signup` returns 409 with `error: 'EMAIL_ALREADY_EXISTS'`
  - DB: No new user created
- **Verification Method**: snapshot / network
- **Test Data**: `{ email: "admin@astratech.vn", password: "Test@1234!", name: "Duplicate User" }`

### E2E-004: Signup with duplicate nickname shows error
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: User with nickname matching an existing user exists
- **User Journey**:
  1. Open signup modal
  2. Fill form with unique email but existing nickname
  3. Click "Create Account"
- **Expected Results**:
  - UI: Error message "This nickname is already taken." displayed in modal
  - API: Returns 409 with `error: 'NICKNAME_ALREADY_EXISTS'`
- **Verification Method**: snapshot / network

### E2E-005: Signup form client-side validation
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: None
- **User Journey**:
  1. Open signup modal
  2. Leave all fields empty and click "Create Account"
  3. Verify HTML5 required validation prevents submission
  4. Fill email with invalid format (e.g., `notanemail`)
  5. Fill password with < 8 characters
  6. Verify browser shows validation errors
- **Expected Results**:
  - UI: Browser native validation messages for required fields, email format, min password length
  - API: No API call made (blocked by client-side validation)
- **Verification Method**: snapshot

---

## Scenario Group 2: User Login Journey

### E2E-010: Successful login via modal
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Seed data loaded. User `admin@astratech.vn` / `Admin@123` exists.
- **User Journey**:
  1. Navigate to `http://localhost:3000/`
  2. Verify top bar shows "Sign Up" and "Sign In" buttons (not logged in)
  3. Click "Sign In" button
  4. Verify auth modal appears with "Welcome back" heading
  5. Fill "Email" with `admin@astratech.vn`
  6. Fill "Password" with `Admin@123`
  7. Click "Sign In" button
  8. Wait for modal to close and redirect to `/dashboard`
- **Expected Results**:
  - UI: Modal closes, dashboard loads, UserMenu shows user avatar and name
  - API: `POST /api/auth/login` returns 200 with tokens and `user.role: 'SUPER_ADMIN'`
  - DB: `LST_LGN_DT` updated, new refresh token created, login log with `LGN_RSLT_CD: 'SUCC'`
  - Server Log: No errors
- **Verification Method**: snapshot / network
- **Test Data**: `{ email: "admin@astratech.vn", password: "Admin@123" }`

### E2E-011: Login as SELLER
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Seed data loaded. Seller `minji@vibe.com` / `Seller@123` exists.
- **User Journey**:
  1. Navigate to `http://localhost:3000/`
  2. Click "Sign In", fill email/password, submit
- **Expected Results**:
  - UI: Dashboard loads, UserMenu shows seller-specific menu items
  - API: Login returns `user.role: 'SELLER'`
- **Verification Method**: snapshot / network
- **Test Data**: `{ email: "minji@vibe.com", password: "Seller@123" }`

### E2E-012: Login as BUYER
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Seed data loaded. Buyer `buyer@vibe.com` / `Buyer@123` exists.
- **User Journey**:
  1. Navigate to `http://localhost:3000/`
  2. Click "Sign In", fill email/password, submit
- **Expected Results**:
  - UI: Dashboard loads, UserMenu shows buyer-specific menu items (My Orders, Cart)
  - API: Login returns `user.role: 'BUYER'`
- **Verification Method**: snapshot / network
- **Test Data**: `{ email: "buyer@vibe.com", password: "Buyer@123" }`

### E2E-013: Login with invalid credentials shows error
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: User `admin@astratech.vn` exists
- **User Journey**:
  1. Navigate to `http://localhost:3000/`
  2. Click "Sign In"
  3. Fill email `admin@astratech.vn`, password `WrongPass1!`
  4. Click "Sign In"
- **Expected Results**:
  - UI: Error message "Invalid email or password." displayed in modal, modal stays open
  - API: `POST /api/auth/login` returns 401 with `error: 'INVALID_CREDENTIALS'`
  - DB: Login log created with `LGN_RSLT_CD: 'FAIL'`
- **Verification Method**: snapshot / network
- **Test Data**: `{ email: "admin@astratech.vn", password: "WrongPass1!" }`

### E2E-014: Login with nonexistent email shows same error (no enumeration)
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: No user with email `nonexistent@example.com`
- **User Journey**:
  1. Open login modal
  2. Fill `nonexistent@example.com` / `Test@1234!`
  3. Click "Sign In"
- **Expected Results**:
  - UI: Same error message "Invalid email or password." (no distinction from wrong password)
  - API: Returns 401 with `error: 'INVALID_CREDENTIALS'`
- **Verification Method**: snapshot / network

### E2E-015: Login to suspended account shows suspended error
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: A user account with status `SUSP` exists
- **User Journey**:
  1. Open login modal
  2. Fill suspended user's credentials
  3. Click "Sign In"
- **Expected Results**:
  - UI: Error message "Your account has been suspended." displayed in modal
  - API: Returns 403 with `error: 'ACCOUNT_SUSPENDED'`
- **Verification Method**: snapshot / network

---

## Scenario Group 3: Modal Behavior

### E2E-020: Modal does not close on outside click
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: None
- **User Journey**:
  1. Navigate to `http://localhost:3000/`
  2. Click "Sign In" to open modal
  3. Click on the overlay area outside the modal box
- **Expected Results**:
  - UI: Modal remains open (does not close)
- **Verification Method**: snapshot

### E2E-021: Modal closes via X button
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: None
- **User Journey**:
  1. Open login modal
  2. Click the "X" close button
- **Expected Results**:
  - UI: Modal closes, homepage visible again
- **Verification Method**: snapshot

### E2E-022: Switch between login and signup views
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: None
- **User Journey**:
  1. Click "Sign In" to open login modal
  2. Verify "Welcome back" heading visible
  3. Click "Create one" link at the bottom
  4. Verify "Create account" heading visible
  5. Click "Sign in" link at the bottom
  6. Verify "Welcome back" heading visible again
- **Expected Results**:
  - UI: Modal view toggles between login and signup without closing
  - UI: Error messages cleared when switching views
- **Verification Method**: snapshot

### E2E-023: Form resets when modal closes and reopens
- **Type**: Edge Case
- **Priority**: Low
- **Preconditions**: None
- **User Journey**:
  1. Open login modal
  2. Fill in email and password fields
  3. Close modal via X button
  4. Reopen login modal
- **Expected Results**:
  - UI: Email and password fields are empty, no error message displayed
- **Verification Method**: snapshot

---

## Scenario Group 4: Auth State Persistence & Logout

### E2E-030: Logged-in state persists across page navigation
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: User is logged in as SUPER_ADMIN
- **User Journey**:
  1. Log in via modal (admin@astratech.vn)
  2. Navigate to `/dashboard`
  3. Navigate back to `/`
  4. Verify user is still logged in (UserMenu visible, no Sign In button)
- **Expected Results**:
  - UI: UserMenu component visible on homepage with user name
  - DB: localStorage contains `accessToken`, `refreshToken`, `user`
- **Verification Method**: snapshot

### E2E-031: Logout clears auth state
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: User is logged in
- **User Journey**:
  1. Log in via modal
  2. Click user menu avatar to open dropdown
  3. Click "Log Out"
  4. Verify redirected to homepage `/`
  5. Verify "Sign Up" and "Sign In" buttons visible (logged out state)
- **Expected Results**:
  - UI: Homepage shows Sign Up / Sign In buttons, no UserMenu
  - API: `POST /api/auth/logout` called with refresh token
  - DB: Refresh token revoked (`RVKD_YN: 'Y'`), localStorage cleared
- **Verification Method**: snapshot / network

### E2E-032: Access dashboard without login redirects to homepage
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: User is not logged in (no tokens in localStorage)
- **User Journey**:
  1. Clear localStorage
  2. Navigate directly to `http://localhost:3000/dashboard`
- **Expected Results**:
  - UI: Redirected to `/` (homepage)
- **Verification Method**: snapshot

---

## Scenario Group 5: Password Reset Flow (API-level)

### E2E-040: Complete forgot password → reset → login flow
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: User `buyer@vibe.com` exists with password `Buyer@123`
- **User Journey**:
  1. Call `POST /api/auth/forgot-password` with `{ email: "buyer@vibe.com" }`
  2. Verify response 200
  3. Read `PSWD_RST_TKN` from DB for this user
  4. Call `POST /api/auth/reset-password` with `{ token: "{reset_token}", newPassword: "NewPass@123" }`
  5. Verify response 200
  6. Call `POST /api/auth/login` with `{ email: "buyer@vibe.com", password: "NewPass@123" }`
  7. Verify response 200 with tokens
- **Expected Results**:
  - API: All steps return success
  - DB: Password hash updated, reset token cleared, all old refresh tokens revoked
- **Verification Method**: network / server-log

### E2E-041: Forgot password with nonexistent email (no enumeration)
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: No user with email `nobody@nowhere.com`
- **User Journey**:
  1. Call `POST /api/auth/forgot-password` with `{ email: "nobody@nowhere.com" }`
- **Expected Results**:
  - API: Returns 200 (same as valid email — prevents email enumeration)
- **Verification Method**: network

---

## Scenario Group 6: Token Refresh (API-level)

### E2E-050: Token refresh rotates tokens
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: User logged in with valid refresh token
- **User Journey**:
  1. Login to get initial access + refresh tokens
  2. Call `POST /api/auth/refresh` with the refresh token
  3. Verify new tokens returned
  4. Verify old refresh token is revoked
- **Expected Results**:
  - API: Returns 200 with new `accessToken` and `refreshToken`
  - DB: Old refresh token has `RVKD_YN: 'Y'`, new token stored
- **Verification Method**: network

### E2E-051: Reused refresh token triggers breach detection
- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: User has active tokens
- **User Journey**:
  1. Login to get Token-A
  2. Refresh Token-A to get Token-B (Token-A now revoked)
  3. Attempt to refresh Token-A again (reuse)
- **Expected Results**:
  - API: Returns 401 with `error: 'TOKEN_REUSE_DETECTED'`
  - DB: ALL user refresh tokens revoked (security measure)
- **Verification Method**: network / server-log

---

## Summary
| Type | Count |
|------|-------|
| Happy Path | 11 |
| Alternative Path | 1 |
| Edge Case | 4 |
| Error Path | 7 |
| **Total** | **23** |
