# Auth E2E Test Scenarios

## Overview
- **Feature**: Authentication — signup, login (email + Google OAuth), logout, profile management, account deletion
- **Related Modules**: Firebase Auth (client-side), NestJS Auth Guard (server-side)
- **API Endpoints**: GET /api/auth/me, PATCH /api/auth/profile, PATCH /api/auth/role, DELETE /api/auth/account
- **DB Tables**: User
- **Blueprint**: docs/blueprints/001-auth/blueprint.md

## Scenario Group 1: Email Signup Flow

### E2E-001: Successful email signup as Buyer
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: No existing account with test email
- **User Journey**:
  1. Navigate to http://localhost:3000
  2. Click "Sign Up" button in top bar
  3. Verify "Create account" modal appears
  4. Fill Full Name: "Test Buyer"
  5. Fill Email: unique test email
  6. Fill Password: "TestPass1!" (uppercase, lowercase, number, special char)
  7. Select "Buyer" radio
  8. Click "Create Account"
  9. Verify redirect to dashboard
- **Expected Results**:
  - UI: Dashboard page loads with user name displayed
  - API: POST to Firebase Auth, then GET /api/auth/me returns 200
  - DB: New User record created with role=BUYER
- **Verification Method**: snapshot / network / console
- **Test Data**: Unique email per run

### E2E-002: Successful email signup as Seller
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: No existing account with test email
- **User Journey**:
  1. Navigate to http://localhost:3000
  2. Click "Sign Up" → fill form with Seller role
  3. Click "Create Account"
  4. Verify dashboard loads with seller menu options
- **Expected Results**:
  - UI: Dashboard with seller-specific features (My Products, Sales)
  - API: PATCH /api/auth/role with role=SELLER
  - DB: User record with role=SELLER
- **Verification Method**: snapshot / network
- **Test Data**: Unique email, role=SELLER

### E2E-003: Signup with duplicate email
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Account already exists with test email
- **User Journey**:
  1. Open signup modal
  2. Fill form with existing email
  3. Click "Create Account"
- **Expected Results**:
  - UI: Error message displayed (e.g., "email already in use")
  - API: Firebase returns auth/email-already-in-use error
- **Verification Method**: snapshot / console
- **Test Data**: Pre-existing email

### E2E-004: Signup with weak password
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: Signup modal open
- **User Journey**:
  1. Fill email with valid email
  2. Fill password: "123" (too short, no uppercase/special)
  3. Click "Create Account"
- **Expected Results**:
  - UI: Error message about password requirements
  - API: Firebase returns auth/weak-password error
- **Verification Method**: snapshot / console

## Scenario Group 2: Email Login Flow

### E2E-005: Successful email login
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Existing user account
- **User Journey**:
  1. Navigate to http://localhost:3000
  2. Click "Sign In"
  3. Fill email and password
  4. Click "Sign In" button
  5. Verify modal closes and user menu appears
- **Expected Results**:
  - UI: Top bar shows user avatar/name instead of "Sign In"
  - API: Firebase signInWithEmailAndPassword, then GET /api/auth/me returns 200
  - DB: User profile loaded from DB
- **Verification Method**: snapshot / network
- **Test Data**: Valid credentials

### E2E-006: Login with wrong password
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Existing account
- **User Journey**:
  1. Open Sign In modal
  2. Enter correct email, wrong password
  3. Click "Sign In"
- **Expected Results**:
  - UI: Error message "Invalid email or password"
  - API: Firebase returns auth/wrong-password
- **Verification Method**: snapshot / console

### E2E-007: Login with non-existent email
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: None
- **User Journey**:
  1. Open Sign In modal
  2. Enter non-existent email
  3. Click "Sign In"
- **Expected Results**:
  - UI: Error message displayed
  - API: Firebase returns auth/user-not-found
- **Verification Method**: snapshot / console

## Scenario Group 3: Google OAuth Flow

### E2E-008: Google OAuth login button presence
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Homepage loaded
- **User Journey**:
  1. Click "Sign In" in top bar
  2. Verify "Continue with Google" button visible
  3. Click "Create one" to switch to signup
  4. Verify "Sign up with Google" button visible
- **Expected Results**:
  - UI: Google OAuth button present in both login and signup modals
- **Verification Method**: snapshot

### E2E-009: Switch between login and signup modals
- **Type**: Alternative Path
- **Priority**: Medium
- **Preconditions**: Homepage loaded
- **User Journey**:
  1. Click "Sign In" → verify login modal
  2. Click "Create one" link → verify signup modal
  3. Click "Sign in" link → verify back to login modal
- **Expected Results**:
  - UI: Smooth transition between login/signup forms
- **Verification Method**: snapshot

## Scenario Group 4: Logout Flow

### E2E-010: Successful logout
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: User logged in
- **User Journey**:
  1. Click user menu (avatar/name)
  2. Click "Logout"
  3. Verify redirect to homepage
  4. Verify "Sign In" button reappears
- **Expected Results**:
  - UI: Homepage with unauthenticated state
  - API: Firebase signOut called
  - DB: No server-side change (stateless JWT)
- **Verification Method**: snapshot / network

## Scenario Group 5: Profile Management

### E2E-011: Update profile name
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: User logged in
- **User Journey**:
  1. Navigate to /dashboard/settings
  2. Change name field
  3. Click save
  4. Verify success message
- **Expected Results**:
  - API: PATCH /api/auth/profile returns 200
  - DB: User.name updated
- **Verification Method**: snapshot / network

### E2E-012: Protected route redirect when not logged in
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: User not logged in
- **User Journey**:
  1. Navigate to /dashboard
  2. Verify redirect to homepage
- **Expected Results**:
  - UI: Redirected to / (homepage)
- **Verification Method**: snapshot

## Scenario Group 6: Forgot Password

### E2E-013: Forgot password flow
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Sign In modal open
- **User Journey**:
  1. Click "Forgot password?" in login modal
  2. Verify forgot password page/form loads
  3. Enter registered email
  4. Submit
  5. Verify confirmation message
- **Expected Results**:
  - UI: Success message "If an account with that email exists, a reset link has been sent"
  - API: Firebase sendPasswordResetEmail called
- **Verification Method**: snapshot

---

## Summary
| Type | Count |
|------|-------|
| Happy Path | 8 |
| Alternative Path | 1 |
| Edge Case | 0 |
| Error Path | 4 |
| **Total** | **13** |
