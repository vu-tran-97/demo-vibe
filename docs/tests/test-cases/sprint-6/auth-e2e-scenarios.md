# Auth E2E Test Scenarios (Sprint 6)

## Overview
- **Feature**: Authentication — signup, login, logout, token refresh, profile, password, account deletion
- **Related Modules**: auth, user-settings
- **API Endpoints**: `/api/auth/*`
- **DB Tables**: TB_COMM_USER, TB_COMM_RFRSH_TKN, TL_COMM_LGN_LOG
- **Blueprint**: docs/blueprints/001-auth/, docs/blueprints/008-user-settings/
- **Note**: Extends sprint-2 auth scenarios with new public pages and user settings

## Scenario Group 1: Public Auth Pages

### E2E-001: Signup from public homepage
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: User is not logged in
- **User Journey**:
  1. Navigate to `/`
  2. Click "Sign In" in header
  3. AuthModal opens — click "Sign Up" tab
  4. Fill: email, password, name, nickname
  5. Click "Create Account"
  6. Verify modal closes, user menu appears in header
- **Expected Results**:
  - UI: UserMenu component shows user name/nickname
  - API: `POST /api/auth/signup` returns `success: true` with tokens
  - DB: New user created in TB_COMM_USER with `userSttsCd: 'ACTV'`
- **Verification Method**: snapshot / network
- **Test Data**: `e2e-test-{timestamp}@test.com`, `Test1234!`, "E2E User", "e2euser"

### E2E-002: Login from public homepage
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: User account exists
- **User Journey**:
  1. Navigate to `/`
  2. Click "Sign In"
  3. AuthModal opens — enter email and password
  4. Click "Sign In"
  5. Verify modal closes, user menu shows
- **Expected Results**:
  - UI: UserMenu visible, "Sign In" button replaced
  - API: `POST /api/auth/login` returns tokens
  - DB: Login log entry in TL_COMM_LGN_LOG
- **Verification Method**: snapshot / network
- **Test Data**: `buyer@vibe.com` / `Buyer@123`

### E2E-003: Login with invalid credentials
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: None
- **User Journey**:
  1. Navigate to `/`, click "Sign In"
  2. Enter wrong email or password
  3. Click "Sign In"
  4. Verify error message shown in modal
- **Expected Results**:
  - UI: Error message: "Invalid email or password"
  - API: `POST /api/auth/login` returns `success: false`
- **Verification Method**: snapshot / network
- **Test Data**: `buyer@vibe.com` / `wrongpassword`

### E2E-004: Logout from any page
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: User logged in
- **User Journey**:
  1. Log in and navigate to any page
  2. Click user menu, click "Logout"
  3. Verify redirected to `/`, "Sign In" button reappears
- **Expected Results**:
  - UI: UserMenu replaced with "Sign In" button
  - API: `POST /api/auth/logout` called
  - DB: Refresh token invalidated
- **Verification Method**: snapshot / network
- **Test Data**: Any logged-in user

## Scenario Group 2: User Settings

### E2E-005: Update profile from settings page
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: User logged in
- **User Journey**:
  1. Navigate to `/dashboard/settings` or `/settings`
  2. Change nickname
  3. Click "Save"
  4. Verify success toast
- **Expected Results**:
  - API: `PATCH /api/auth/profile` returns success
  - DB: User record updated
- **Verification Method**: snapshot / network
- **Test Data**: New nickname: "updated_nick"

### E2E-006: Change password
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: User logged in
- **User Journey**:
  1. Navigate to settings page
  2. Enter current password and new password
  3. Submit
  4. Verify success
  5. Logout and login with new password
- **Expected Results**:
  - API: `PATCH /api/auth/password` returns success
  - DB: Password hash updated
- **Verification Method**: network
- **Test Data**: Current: `Buyer@123`, New: `NewPass1234!`

### E2E-007: Change password with wrong current password
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: User logged in
- **User Journey**:
  1. Navigate to settings
  2. Enter wrong current password
  3. Submit
  4. Verify error message
- **Expected Results**:
  - API: `PATCH /api/auth/password` returns error
  - UI: Error message displayed
- **Verification Method**: snapshot / network
- **Test Data**: Wrong current: `wrongpass`

### E2E-008: Token refresh flow
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: User has valid refresh token, access token expired
- **User Journey**:
  1. Log in to get tokens
  2. Call `POST /api/auth/refresh` with refresh token
  3. Verify new access token returned
- **Expected Results**:
  - API: `POST /api/auth/refresh` returns new `accessToken`
- **Verification Method**: network
- **Test Data**: Valid refresh token from login response

---

## Summary
| Type | Count |
|------|-------|
| Happy Path | 6 |
| Alternative Path | 0 |
| Edge Case | 0 |
| Error Path | 2 |
| **Total** | **8** |
