# Auth E2E Test Scenarios — Sprint 10

## Overview
- **Feature**: Authentication — signup, login (email/password via Firebase), logout, profile management, role setup, password change, account deletion, session management, security
- **Related Modules**: Firebase Auth (client-side), NestJS Auth Guard (server-side), Firebase Admin SDK (token verification)
- **API Endpoints**: GET /api/auth/me, PATCH /api/auth/profile, PATCH /api/auth/role, DELETE /api/auth/account
- **Auth Pages**: /auth/login, /auth/signup, /settings
- **DB Tables**: User (MongoDB via Prisma ORM)
- **Blueprint**: docs/blueprints/001-auth/blueprint.md
- **Auth Flow**: Firebase client SDK login -> get ID token -> send Bearer token in Authorization header -> backend verifies via Firebase Admin SDK -> auto-creates user in DB on first login
- **User Roles**: BUYER, SELLER, SUPER_ADMIN

### Test Accounts
| Account | Email | Password | Role |
|---------|-------|----------|------|
| Admin | admin@astratech.vn | Admin@123 | SUPER_ADMIN |
| Seller | seller1000@yopmail.com | Seller@123 | SELLER |

---

## Scenario Group 1: Signup Flow

### E2E-001: Successful signup as Buyer
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: No existing account with test email
- **User Journey**:
  1. Navigate to /auth/signup
  2. Fill Full Name: "Test Buyer Sprint10"
  3. Fill Email: unique test email (e.g., testbuyer-s10-{timestamp}@yopmail.com)
  4. Fill Password: "TestBuyer@123"
  5. Select "Buyer" role radio button
  6. Click "Create Account" button
  7. Verify redirect to dashboard or homepage with authenticated state
- **Expected Results**:
  - UI: User is logged in, name displayed in top bar, dashboard accessible
  - API: Firebase createUserWithEmailAndPassword succeeds, GET /api/auth/me returns 200 with role=BUYER
  - DB: New User record created with role=BUYER, email matches, deletedAt=null
- **Verification Method**: snapshot / network / console
- **Test Data**: Unique email per run, password "TestBuyer@123"

### E2E-002: Successful signup as Seller
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: No existing account with test email
- **User Journey**:
  1. Navigate to /auth/signup
  2. Fill Full Name: "Test Seller Sprint10"
  3. Fill Email: unique test email (e.g., testseller-s10-{timestamp}@yopmail.com)
  4. Fill Password: "TestSeller@123"
  5. Select "Seller" role radio button
  6. Click "Create Account"
  7. Verify redirect with seller-specific menu items visible
- **Expected Results**:
  - UI: Dashboard loads with seller features (My Products, Sales, etc.)
  - API: PATCH /api/auth/role called with role=SELLER, returns 200
  - DB: User record with role=SELLER
- **Verification Method**: snapshot / network
- **Test Data**: Unique email, role=SELLER

### E2E-003: Signup with duplicate email
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Account already exists with admin@astratech.vn
- **User Journey**:
  1. Navigate to /auth/signup
  2. Fill Email: "admin@astratech.vn"
  3. Fill Password: "SomePass@123"
  4. Fill Name: "Duplicate Test"
  5. Select any role
  6. Click "Create Account"
- **Expected Results**:
  - UI: Error message displayed (e.g., "This email is already in use")
  - API: Firebase returns auth/email-already-in-use error
  - DB: No new record created
- **Verification Method**: snapshot / console
- **Test Data**: admin@astratech.vn (pre-existing)

### E2E-004: Signup with weak password
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: Signup page loaded
- **User Journey**:
  1. Navigate to /auth/signup
  2. Fill Email: valid unique email
  3. Fill Password: "123" (too short, missing uppercase/special)
  4. Fill Name: "Weak Password User"
  5. Select "Buyer" role
  6. Click "Create Account"
- **Expected Results**:
  - UI: Validation error about password requirements (min length, complexity)
  - API: Firebase returns auth/weak-password if client validation is bypassed
- **Verification Method**: snapshot / console

### E2E-005: Signup with invalid email format
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: Signup page loaded
- **User Journey**:
  1. Navigate to /auth/signup
  2. Fill Email: "not-an-email"
  3. Fill Password: "ValidPass@123"
  4. Fill Name: "Invalid Email User"
  5. Click "Create Account"
- **Expected Results**:
  - UI: Validation error about invalid email format
  - API: No request sent (client-side validation blocks)
- **Verification Method**: snapshot

### E2E-006: Signup with empty required fields
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: Signup page loaded
- **User Journey**:
  1. Navigate to /auth/signup
  2. Leave all fields empty
  3. Click "Create Account"
- **Expected Results**:
  - UI: Validation errors displayed for each required field (name, email, password, role)
  - API: No request sent
- **Verification Method**: snapshot

### E2E-007: Signup without selecting a role
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: Signup page loaded
- **User Journey**:
  1. Navigate to /auth/signup
  2. Fill Name: "No Role User"
  3. Fill Email: unique valid email
  4. Fill Password: "ValidPass@123"
  5. Do not select any role
  6. Click "Create Account"
- **Expected Results**:
  - UI: Validation error indicating role selection is required
  - API: No request sent (blocked by client validation)
- **Verification Method**: snapshot

---

## Scenario Group 2: Login Flow

### E2E-008: Successful email login as Seller
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Existing account (seller1000@yopmail.com)
- **User Journey**:
  1. Navigate to /auth/login
  2. Fill Email: "seller1000@yopmail.com"
  3. Fill Password: "Seller@123"
  4. Click "Sign In" button
  5. Wait for authentication to complete
  6. Verify redirect to dashboard/homepage with authenticated state
- **Expected Results**:
  - UI: Top bar shows user name/avatar, "Sign In" button replaced by user menu
  - API: Firebase signInWithEmailAndPassword succeeds, GET /api/auth/me returns 200 with user profile
  - DB: User record loaded, no new record created (existing user)
- **Verification Method**: snapshot / network
- **Test Data**: seller1000@yopmail.com / Seller@123

### E2E-009: Successful login as Admin
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Admin account exists
- **User Journey**:
  1. Navigate to /auth/login
  2. Fill Email: "admin@astratech.vn"
  3. Fill Password: "Admin@123"
  4. Click "Sign In"
  5. Verify admin-specific features are accessible
- **Expected Results**:
  - UI: Admin menu/dashboard visible with elevated permissions
  - API: GET /api/auth/me returns role=SUPER_ADMIN
  - DB: User record with role=SUPER_ADMIN
- **Verification Method**: snapshot / network
- **Test Data**: admin@astratech.vn / Admin@123

### E2E-010: Login with wrong password
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Existing account
- **User Journey**:
  1. Navigate to /auth/login
  2. Fill Email: "seller1000@yopmail.com"
  3. Fill Password: "WrongPassword@999"
  4. Click "Sign In"
- **Expected Results**:
  - UI: Error message "Invalid email or password" displayed
  - API: Firebase returns auth/wrong-password error
  - DB: No state change
- **Verification Method**: snapshot / console
- **Test Data**: seller1000@yopmail.com / WrongPassword@999

### E2E-011: Login with non-existent email
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: None
- **User Journey**:
  1. Navigate to /auth/login
  2. Fill Email: "nonexistent-user-xyz@yopmail.com"
  3. Fill Password: "AnyPass@123"
  4. Click "Sign In"
- **Expected Results**:
  - UI: Error message displayed (generic "Invalid email or password" for security)
  - API: Firebase returns auth/user-not-found
- **Verification Method**: snapshot / console

### E2E-012: Login with empty fields
- **Type**: Edge Case
- **Priority**: Low
- **Preconditions**: Login page loaded
- **User Journey**:
  1. Navigate to /auth/login
  2. Leave email and password empty
  3. Click "Sign In"
- **Expected Results**:
  - UI: Validation errors for required fields
  - API: No request sent
- **Verification Method**: snapshot

### E2E-013: Login with invalid email format
- **Type**: Error Path
- **Priority**: Low
- **Preconditions**: Login page loaded
- **User Journey**:
  1. Navigate to /auth/login
  2. Fill Email: "invalid-email-format"
  3. Fill Password: "SomePass@123"
  4. Click "Sign In"
- **Expected Results**:
  - UI: Validation error about invalid email format
  - API: No request sent (client-side validation blocks)
- **Verification Method**: snapshot

### E2E-014: Auto-creation of user on first backend call
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: User exists in Firebase but not yet in MongoDB
- **User Journey**:
  1. Create a new Firebase user (via signup)
  2. Immediately call GET /api/auth/me with the Firebase ID token
  3. Verify the backend auto-creates the user record in DB
- **Expected Results**:
  - API: GET /api/auth/me returns 200 with newly created user profile
  - DB: New User record auto-created with Firebase UID linked
- **Verification Method**: network / DB query
- **Test Data**: Freshly created Firebase account

---

## Scenario Group 3: Profile Management

### E2E-015: View current user profile
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: User logged in as seller1000@yopmail.com
- **User Journey**:
  1. Login with seller1000@yopmail.com
  2. Navigate to /settings
  3. Verify profile information is pre-filled
- **Expected Results**:
  - UI: Profile page shows name, email, role, and other profile fields
  - API: GET /api/auth/me returns 200 with complete user object
- **Verification Method**: snapshot / network
- **Test Data**: seller1000@yopmail.com / Seller@123

### E2E-016: Update profile name
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: User logged in, on /settings page
- **User Journey**:
  1. Navigate to /settings
  2. Change name field to "Updated Name Sprint10"
  3. Click Save / Update button
  4. Verify success notification
  5. Refresh page and verify name persists
- **Expected Results**:
  - UI: Success toast/message displayed, name field shows updated value after refresh
  - API: PATCH /api/auth/profile returns 200 with updated user
  - DB: User.name updated to "Updated Name Sprint10"
- **Verification Method**: snapshot / network
- **Test Data**: New name "Updated Name Sprint10"

### E2E-017: Update profile nickname
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: User logged in, on /settings page
- **User Journey**:
  1. Navigate to /settings
  2. Change nickname field to "sprint10-nick"
  3. Click Save
  4. Verify success notification
- **Expected Results**:
  - UI: Success message, nickname updated
  - API: PATCH /api/auth/profile returns 200
  - DB: User.nickname updated
- **Verification Method**: snapshot / network

### E2E-018: Update profile with empty name
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: User logged in, on /settings page
- **User Journey**:
  1. Navigate to /settings
  2. Clear name field completely
  3. Click Save
- **Expected Results**:
  - UI: Validation error "Name is required"
  - API: PATCH /api/auth/profile returns 400 or request is blocked by client validation
- **Verification Method**: snapshot / network

### E2E-019: Update profile with excessively long name
- **Type**: Edge Case
- **Priority**: Low
- **Preconditions**: User logged in, on /settings page
- **User Journey**:
  1. Navigate to /settings
  2. Enter a name with 300+ characters
  3. Click Save
- **Expected Results**:
  - UI: Validation error about max length, or name is truncated
  - API: Returns 400 if validation fails
- **Verification Method**: snapshot / network

### E2E-020: Profile reflects role correctly for Buyer vs Seller
- **Type**: Alternative Path
- **Priority**: Medium
- **Preconditions**: Two accounts — one BUYER, one SELLER
- **User Journey**:
  1. Login as Buyer account, navigate to /settings
  2. Verify role displayed as "Buyer"
  3. Logout, login as Seller account
  4. Navigate to /settings
  5. Verify role displayed as "Seller"
- **Expected Results**:
  - UI: Role field is read-only and displays the correct assigned role for each user
  - API: GET /api/auth/me returns correct role in both cases
- **Verification Method**: snapshot / network

---

## Scenario Group 4: Role Selection (First-Time Setup)

### E2E-021: First-time role selection as Buyer
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: User just signed up, role not yet assigned via separate step (if role assignment is decoupled from signup)
- **User Journey**:
  1. Complete signup flow
  2. System prompts for role selection (Buyer/Seller)
  3. Select "Buyer"
  4. Confirm selection
  5. Verify role is applied and buyer dashboard loads
- **Expected Results**:
  - UI: Role selection UI appears, after selection buyer-specific features become available
  - API: PATCH /api/auth/role with body { role: "BUYER" } returns 200
  - DB: User.role updated to BUYER
- **Verification Method**: snapshot / network

### E2E-022: First-time role selection as Seller
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: User just signed up, role not yet assigned
- **User Journey**:
  1. Complete signup flow
  2. System prompts for role selection
  3. Select "Seller"
  4. Confirm selection
  5. Verify seller-specific features (My Products, Sales) become available
- **Expected Results**:
  - UI: Seller dashboard with product management features
  - API: PATCH /api/auth/role with body { role: "SELLER" } returns 200
  - DB: User.role updated to SELLER
- **Verification Method**: snapshot / network

### E2E-023: Attempt to change role after already set
- **Type**: Edge Case
- **Priority**: High
- **Preconditions**: User already has role=SELLER assigned
- **User Journey**:
  1. Login as seller1000@yopmail.com
  2. Attempt to call PATCH /api/auth/role with body { role: "BUYER" } directly via API
- **Expected Results**:
  - API: Returns 400 or 403 (role already set, cannot change)
  - DB: Role remains SELLER, no change
- **Verification Method**: network
- **Test Data**: seller1000@yopmail.com (existing SELLER role)

### E2E-024: Set role with invalid value
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: User logged in, no role set yet
- **User Journey**:
  1. Call PATCH /api/auth/role with body { role: "INVALID_ROLE" }
- **Expected Results**:
  - API: Returns 400 with validation error
  - DB: No role change
- **Verification Method**: network

### E2E-025: Set role without authentication
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: No active session
- **User Journey**:
  1. Call PATCH /api/auth/role without Authorization header
  2. Body: { role: "BUYER" }
- **Expected Results**:
  - API: Returns 401 Unauthorized
  - DB: No changes
- **Verification Method**: network

---

## Scenario Group 5: Password Change

### E2E-026: Change password from settings page
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: User logged in, on /settings page
- **User Journey**:
  1. Navigate to /settings
  2. Locate "Change Password" section
  3. Enter Current Password: "Seller@123"
  4. Enter New Password: "NewSeller@456"
  5. Enter Confirm Password: "NewSeller@456"
  6. Click "Change Password" button
  7. Verify success notification
- **Expected Results**:
  - UI: Success message "Password changed successfully"
  - API: Firebase reauthenticateWithCredential + updatePassword called
  - DB: No DB change (password managed by Firebase)
- **Verification Method**: snapshot / console
- **Test Data**: Current: "Seller@123", New: "NewSeller@456"

### E2E-027: Change password with incorrect current password
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: User logged in, on /settings page
- **User Journey**:
  1. Navigate to /settings
  2. Enter Current Password: "WrongCurrentPass@999"
  3. Enter New Password: "NewPass@123"
  4. Enter Confirm Password: "NewPass@123"
  5. Click "Change Password"
- **Expected Results**:
  - UI: Error message "Current password is incorrect"
  - API: Firebase reauthenticateWithCredential fails with auth/wrong-password
- **Verification Method**: snapshot / console

### E2E-028: Change password with mismatched confirmation
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: User logged in, on /settings page
- **User Journey**:
  1. Navigate to /settings
  2. Enter Current Password: "Seller@123"
  3. Enter New Password: "NewPass@123"
  4. Enter Confirm Password: "DifferentPass@456"
  5. Click "Change Password"
- **Expected Results**:
  - UI: Validation error "Passwords do not match"
  - API: No request sent (blocked by client validation)
- **Verification Method**: snapshot

### E2E-029: Change password with weak new password
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: User logged in, on /settings page
- **User Journey**:
  1. Navigate to /settings
  2. Enter Current Password: correctly
  3. Enter New Password: "123"
  4. Enter Confirm Password: "123"
  5. Click "Change Password"
- **Expected Results**:
  - UI: Validation error about password requirements
  - API: Firebase returns auth/weak-password if client validation bypassed
- **Verification Method**: snapshot / console

### E2E-030: Forgot password flow from login page
- **Type**: Alternative Path
- **Priority**: Medium
- **Preconditions**: Login page loaded, user has forgotten password
- **User Journey**:
  1. Navigate to /auth/login
  2. Click "Forgot password?" link
  3. Enter registered email: "seller1000@yopmail.com"
  4. Click "Send Reset Link"
  5. Verify confirmation message
- **Expected Results**:
  - UI: Success message "If an account with that email exists, a password reset link has been sent"
  - API: Firebase sendPasswordResetEmail called successfully
- **Verification Method**: snapshot
- **Test Data**: seller1000@yopmail.com

---

## Scenario Group 6: Account Deletion

### E2E-031: Soft delete account with confirmation
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: User logged in with a disposable test account
- **User Journey**:
  1. Navigate to /settings
  2. Scroll to "Delete Account" section
  3. Click "Delete Account" button
  4. Confirm in the confirmation dialog (type confirmation text or click confirm)
  5. Verify logout and redirect
- **Expected Results**:
  - UI: Confirmation modal appears, after confirmation user is logged out and redirected to homepage
  - API: DELETE /api/auth/account returns 200
  - DB: User.deletedAt set to current timestamp (soft delete), record not physically removed
- **Verification Method**: snapshot / network / DB query
- **Test Data**: Disposable test account created for this scenario

### E2E-032: Cancel account deletion
- **Type**: Alternative Path
- **Priority**: Medium
- **Preconditions**: User logged in, on /settings page
- **User Journey**:
  1. Navigate to /settings
  2. Click "Delete Account" button
  3. Confirmation dialog appears
  4. Click "Cancel" or close the dialog
- **Expected Results**:
  - UI: Dialog closes, user remains on settings page, still logged in
  - API: No DELETE request sent
  - DB: No changes
- **Verification Method**: snapshot

### E2E-033: Login attempt with soft-deleted account
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Account has been soft-deleted (deletedAt is set)
- **User Journey**:
  1. Navigate to /auth/login
  2. Enter credentials of the soft-deleted account
  3. Click "Sign In"
- **Expected Results**:
  - UI: Error message indicating account is deactivated or does not exist
  - API: GET /api/auth/me returns 401 or 403 (account deleted)
- **Verification Method**: snapshot / network
- **Test Data**: Previously soft-deleted account credentials

### E2E-034: Delete account without authentication
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: No active session
- **User Journey**:
  1. Call DELETE /api/auth/account without Authorization header
- **Expected Results**:
  - API: Returns 401 Unauthorized
  - DB: No records affected
- **Verification Method**: network

---

## Scenario Group 7: Token Expiration Handling

### E2E-035: Token refresh on page reload
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: User logged in
- **User Journey**:
  1. Login successfully
  2. Reload the page (F5 / Ctrl+R)
  3. Verify user remains authenticated
  4. Verify GET /api/auth/me returns valid data
- **Expected Results**:
  - UI: User remains logged in, profile data displayed
  - API: Firebase token auto-refreshed, GET /api/auth/me returns 200
- **Verification Method**: snapshot / network

### E2E-036: Expired token auto-refresh
- **Type**: Edge Case
- **Priority**: High
- **Preconditions**: User logged in, token has expired (simulate by waiting or manipulating token)
- **User Journey**:
  1. Login successfully
  2. Wait for Firebase ID token to expire (1 hour) or simulate expired token
  3. Attempt to call GET /api/auth/me with expired token
  4. Verify Firebase SDK auto-refreshes the token
  5. Verify subsequent requests succeed with new token
- **Expected Results**:
  - UI: User experiences no interruption if token refresh succeeds
  - API: If auto-refresh works, GET /api/auth/me returns 200 with new token; if refresh fails, returns 401
- **Verification Method**: network / console

### E2E-037: API call with manually expired/revoked token
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: User logged in, token manually invalidated
- **User Journey**:
  1. Login and capture the Bearer token
  2. Revoke the token from Firebase Admin console
  3. Call GET /api/auth/me with the revoked token
- **Expected Results**:
  - API: Returns 401 Unauthorized (Firebase Admin SDK rejects revoked token)
  - UI: User prompted to re-login
- **Verification Method**: network

---

## Scenario Group 8: Unauthorized Access

### E2E-038: Access protected route without authentication
- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: User not logged in (no session)
- **User Journey**:
  1. Open browser with no stored session
  2. Navigate directly to /settings
  3. Verify redirect to login page or homepage
- **Expected Results**:
  - UI: Redirected to /auth/login or homepage with "Sign In" prompt
  - API: No Bearer token sent, protected endpoints return 401
- **Verification Method**: snapshot / network

### E2E-039: API call without Bearer token
- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: None
- **User Journey**:
  1. Call GET /api/auth/me without Authorization header
  2. Call PATCH /api/auth/profile without Authorization header
  3. Call PATCH /api/auth/role without Authorization header
  4. Call DELETE /api/auth/account without Authorization header
- **Expected Results**:
  - API: All endpoints return 401 Unauthorized with { success: false, error: "Unauthorized" }
  - DB: No data exposed or modified
- **Verification Method**: network (curl / API client)

### E2E-040: API call with forged/invalid Bearer token
- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: None
- **User Journey**:
  1. Call GET /api/auth/me with Authorization: Bearer "fake-token-12345"
  2. Call PATCH /api/auth/profile with the same fake token
- **Expected Results**:
  - API: Returns 401 Unauthorized (Firebase Admin SDK rejects invalid token)
  - DB: No data exposed or modified
- **Verification Method**: network
- **Test Data**: Bearer token = "fake-token-12345"

### E2E-041: Regular user accessing admin-only endpoints
- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: Logged in as seller1000@yopmail.com (SELLER role)
- **User Journey**:
  1. Login as seller1000@yopmail.com
  2. Attempt to access admin-only API endpoints or pages (e.g., /admin/*)
  3. Verify access is denied
- **Expected Results**:
  - UI: 403 Forbidden page or redirect to unauthorized page
  - API: Returns 403 with { success: false, error: "Forbidden" }
- **Verification Method**: snapshot / network
- **Test Data**: seller1000@yopmail.com / Seller@123

### E2E-042: XSS attempt in profile name field
- **Type**: Edge Case
- **Priority**: High
- **Preconditions**: User logged in, on /settings page
- **User Journey**:
  1. Navigate to /settings
  2. Enter name: `<script>alert('XSS')</script>`
  3. Click Save
  4. Reload the page
  5. Verify the script tag is not executed
- **Expected Results**:
  - UI: Name displayed as escaped text, no script execution
  - API: PATCH /api/auth/profile either sanitizes input or stores escaped version
  - DB: Stored as plain text (not executable)
- **Verification Method**: snapshot / console (verify no alert dialog)
- **Test Data**: `<script>alert('XSS')</script>`

### E2E-043: SQL/NoSQL injection attempt in profile fields
- **Type**: Edge Case
- **Priority**: High
- **Preconditions**: User logged in
- **User Journey**:
  1. Navigate to /settings
  2. Enter name: `'; DROP TABLE "User"; --`
  3. Click Save
- **Expected Results**:
  - UI: Name saved as literal string or rejected
  - API: Prisma ORM parameterizes queries, no injection possible
  - DB: No data corruption, User collection intact
- **Verification Method**: network / DB query
- **Test Data**: `'; DROP TABLE "User"; --`

---

## Scenario Group 9: Session Management

### E2E-044: Successful logout clears session
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: User logged in
- **User Journey**:
  1. Click user menu / avatar
  2. Click "Logout"
  3. Verify redirect to homepage
  4. Attempt to navigate to /settings
  5. Verify redirect back to login or homepage
- **Expected Results**:
  - UI: User menu replaced by "Sign In" button, protected routes inaccessible
  - API: Firebase signOut called, subsequent API calls return 401
  - DB: No server-side change (stateless JWT)
- **Verification Method**: snapshot / network

### E2E-045: Multiple tabs session consistency
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: User logged in
- **User Journey**:
  1. Login in Tab A
  2. Open a new tab (Tab B) to the same URL
  3. Verify Tab B is also authenticated
  4. Logout in Tab A
  5. Refresh Tab B
  6. Verify Tab B is also logged out
- **Expected Results**:
  - UI: Both tabs share authentication state; logout in one reflects in the other after refresh
- **Verification Method**: snapshot

### E2E-046: Session persistence after browser restart
- **Type**: Alternative Path
- **Priority**: Medium
- **Preconditions**: User logged in with "Remember me" or Firebase persistence set to LOCAL
- **User Journey**:
  1. Login successfully
  2. Close the browser completely
  3. Reopen the browser and navigate to the application
  4. Verify user is still authenticated
- **Expected Results**:
  - UI: User remains logged in, profile data accessible
  - API: Firebase token persisted in localStorage/indexedDB, auto-refreshed on load
- **Verification Method**: snapshot / network

### E2E-047: Concurrent login from different browsers
- **Type**: Alternative Path
- **Priority**: Low
- **Preconditions**: User account exists
- **User Journey**:
  1. Login with seller1000@yopmail.com in Browser A
  2. Login with the same account in Browser B
  3. Verify both sessions are active and functional
  4. Perform actions in both browsers
- **Expected Results**:
  - UI: Both browsers show authenticated state
  - API: Both sessions receive valid tokens, no session invalidation
  - DB: Single user record, no conflict
- **Verification Method**: snapshot / network

### E2E-048: Rate limiting on login endpoint
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: Login page accessible
- **User Journey**:
  1. Attempt 20 consecutive failed login attempts with wrong password for seller1000@yopmail.com
  2. Observe response behavior after multiple failures
- **Expected Results**:
  - UI: After N failed attempts, Firebase may temporarily block the account or throttle requests
  - API: Firebase returns auth/too-many-requests after excessive failed attempts
- **Verification Method**: network / console

---

## Summary

### Scenario Group Breakdown
| Scenario Group | Scenario IDs | Count |
|---------------|-------------|-------|
| Signup Flow | E2E-001 ~ E2E-007 | 7 |
| Login Flow | E2E-008 ~ E2E-014 | 7 |
| Profile Management | E2E-015 ~ E2E-020 | 6 |
| Role Selection | E2E-021 ~ E2E-025 | 5 |
| Password Change | E2E-026 ~ E2E-030 | 5 |
| Account Deletion | E2E-031 ~ E2E-034 | 4 |
| Token Expiration | E2E-035 ~ E2E-037 | 3 |
| Unauthorized Access | E2E-038 ~ E2E-043 | 6 |
| Session Management | E2E-044 ~ E2E-048 | 5 |
| **Total** | | **48** |

### Type Distribution
| Type | Count |
|------|-------|
| Happy Path | 16 |
| Alternative Path | 4 |
| Edge Case | 12 |
| Error Path | 16 |
| **Total** | **48** |

### Priority Distribution
| Priority | Count |
|----------|-------|
| Critical | 10 |
| High | 18 |
| Medium | 14 |
| Low | 6 |
| **Total** | **48** |
