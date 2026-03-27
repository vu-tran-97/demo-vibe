# Settings E2E Test Scenarios — Sprint 10

## Overview
- **Feature**: User profile settings — view/update name, nickname, profile image, change password, delete account
- **Related Modules**: Auth, Firebase Auth (client-side password update)
- **API Endpoints**: GET /api/auth/me, PATCH /api/auth/profile, DELETE /api/auth/account
- **Settings Pages**: /settings, /dashboard/settings
- **DB Tables**: User (PostgreSQL via Prisma ORM)
- **Blueprint**: docs/blueprints/008-user-settings/blueprint.md
- **Production Frontend**: https://demo-vibe-production.up.railway.app
- **Production Backend**: https://demo-vibe-backend-production.up.railway.app
- **Password Change**: Uses Firebase client SDK `updatePassword` (requires recent re-authentication)

### Test Accounts
| Account | Email | Password | Role |
|---------|-------|----------|------|
| Admin | admin@astratech.vn | Admin@123 | SUPER_ADMIN |
| Seller | seller1000@yopmail.com | Seller1000@123 | SELLER |
| Buyer (disposable) | testbuyer-settings-{timestamp}@yopmail.com | TestBuyer@123 | BUYER |

---

## Scenario Group 1: View Profile Settings

### E2E-001: View settings page as authenticated user
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as any role
- **User Journey**:
  1. Navigate to https://demo-vibe-production.up.railway.app/dashboard/settings
  2. Verify settings page loads with current profile information
  3. Verify name, email, nickname fields are displayed
  4. Verify email field is read-only (managed by Firebase)
  5. Verify profile image section is visible
- **Expected Results**:
  - UI: Settings form rendered with pre-filled current values (name, email, nickname, profile image)
  - API: GET /api/auth/me returns 200 with user profile data
- **Verification Method**: snapshot / network
- **Test Data**: Login as seller1000@yopmail.com

### E2E-002: Access settings page from /settings route
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in
- **User Journey**:
  1. Navigate directly to /settings
  2. Verify page loads correctly (either renders settings or redirects to /dashboard/settings)
  3. Verify same profile data is displayed as /dashboard/settings
- **Expected Results**:
  - UI: Settings page accessible from both routes
- **Verification Method**: snapshot / network

### E2E-003: Unauthenticated user redirected from settings
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Not logged in (no active session)
- **User Journey**:
  1. Navigate directly to /dashboard/settings without authentication
  2. Verify redirect to login page
- **Expected Results**:
  - UI: Redirect to /auth/login (or login modal)
  - API: No /api/auth/me call succeeds (401 if attempted)
- **Verification Method**: snapshot / network

---

## Scenario Group 2: Update Name and Nickname

### E2E-004: Update display name successfully
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in, on settings page
- **User Journey**:
  1. Navigate to /dashboard/settings
  2. Clear the name field
  3. Type "Updated Name Sprint10"
  4. Click "Save" or "Update Profile" button
  5. Verify success toast/message appears
  6. Refresh the page
  7. Verify name field shows "Updated Name Sprint10"
- **Expected Results**:
  - UI: Success message displayed; name persists after refresh
  - API: PATCH /api/auth/profile with { name: "Updated Name Sprint10" } returns 200
  - DB: User.name updated to "Updated Name Sprint10"
- **Verification Method**: snapshot / network
- **Test Data**: name = "Updated Name Sprint10"

### E2E-005: Update nickname successfully
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in, on settings page
- **User Journey**:
  1. Navigate to /dashboard/settings
  2. Clear the nickname field
  3. Type "coolnick10"
  4. Click "Save"
  5. Verify success message
  6. Refresh and verify nickname persisted
- **Expected Results**:
  - UI: Success message; nickname shows "coolnick10" after refresh
  - API: PATCH /api/auth/profile with { nickname: "coolnick10" } returns 200
  - DB: User.nickname updated
- **Verification Method**: snapshot / network
- **Test Data**: nickname = "coolnick10"

### E2E-006: Update name and nickname simultaneously
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in, on settings page
- **User Journey**:
  1. Change name to "Both Updated"
  2. Change nickname to "bothnick"
  3. Click "Save"
  4. Verify both fields updated after refresh
- **Expected Results**:
  - API: PATCH /api/auth/profile with { name: "Both Updated", nickname: "bothnick" } returns 200
  - DB: Both fields updated in a single request
- **Verification Method**: snapshot / network
- **Test Data**: name = "Both Updated", nickname = "bothnick"

### E2E-007: Submit settings with no changes
- **Type**: Edge Case
- **Priority**: Low
- **Preconditions**: Logged in, on settings page, no fields modified
- **User Journey**:
  1. Open settings page
  2. Click "Save" without changing anything
  3. Verify behavior — either no API call or success with unchanged data
- **Expected Results**:
  - UI: No error; success message or no-op behavior
  - API: PATCH /api/auth/profile returns 200 (idempotent) or no call made
- **Verification Method**: snapshot / network

### E2E-008: Update name with empty value
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: Logged in, on settings page
- **User Journey**:
  1. Clear the name field entirely
  2. Click "Save"
  3. Verify validation error displayed
- **Expected Results**:
  - UI: Validation error (e.g., "Name is required")
  - API: No PATCH call made, or returns 400
- **Verification Method**: snapshot / network

---

## Scenario Group 3: Change Password

### E2E-009: Change password successfully
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in with email/password account (not social login), on settings page
- **User Journey**:
  1. Navigate to /dashboard/settings
  2. Locate the "Change Password" section
  3. Enter current password: "Seller1000@123"
  4. Enter new password: "NewSeller@456"
  5. Enter confirm new password: "NewSeller@456"
  6. Click "Change Password" button
  7. Verify success message
  8. Log out
  9. Log in with old password — verify login fails
  10. Log in with new password — verify login succeeds
- **Expected Results**:
  - UI: Success message after password change
  - Firebase: updatePassword succeeds (client SDK)
  - Auth: Old password no longer works; new password works
- **Verification Method**: snapshot / network / console
- **Test Data**: currentPassword = "Seller1000@123", newPassword = "NewSeller@456"

### E2E-010: Change password with wrong current password
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Logged in, on settings page
- **User Journey**:
  1. Enter incorrect current password: "WrongPassword@999"
  2. Enter new password: "NewPass@123"
  3. Enter confirm password: "NewPass@123"
  4. Click "Change Password"
  5. Verify error message about incorrect current password
- **Expected Results**:
  - UI: Error message (e.g., "Current password is incorrect" or Firebase re-auth error)
  - Firebase: reauthenticateWithCredential fails
  - Auth: Password remains unchanged
- **Verification Method**: snapshot / console
- **Test Data**: currentPassword = "WrongPassword@999"

### E2E-011: Change password with mismatched confirmation
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: Logged in, on settings page
- **User Journey**:
  1. Enter current password correctly
  2. Enter new password: "NewPass@123"
  3. Enter confirm password: "DifferentPass@456"
  4. Click "Change Password"
  5. Verify validation error about password mismatch
- **Expected Results**:
  - UI: Validation error (e.g., "Passwords do not match")
  - Firebase: No updatePassword call made
- **Verification Method**: snapshot
- **Test Data**: newPassword = "NewPass@123", confirmPassword = "DifferentPass@456"

### E2E-012: Change password with weak new password
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: Logged in, on settings page
- **User Journey**:
  1. Enter current password correctly
  2. Enter new password: "123" (too short/weak)
  3. Enter confirm password: "123"
  4. Click "Change Password"
  5. Verify validation error about password strength
- **Expected Results**:
  - UI: Validation error (e.g., "Password must be at least 6 characters") or Firebase weak-password error
- **Verification Method**: snapshot / console
- **Test Data**: newPassword = "123"

---

## Scenario Group 4: Profile Image Upload

### E2E-013: Upload profile image successfully
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in, on settings page
- **User Journey**:
  1. Navigate to /dashboard/settings
  2. Click the profile image area or "Change Photo" button
  3. Select a valid image file (e.g., test-avatar.jpg, < 2MB)
  4. Verify image preview updates
  5. Click "Save" (if upload requires explicit save)
  6. Refresh page and verify new profile image persists
- **Expected Results**:
  - UI: Profile image preview updated; persists after refresh
  - API: PATCH /api/auth/profile with image URL or file upload returns 200
  - DB: User.profileImage updated with new URL
- **Verification Method**: snapshot / network
- **Test Data**: Valid JPG image file, < 2MB

### E2E-014: Upload oversized profile image
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: Logged in, on settings page
- **User Journey**:
  1. Click the profile image area
  2. Select a large image file (> 5MB)
  3. Verify error message about file size limit
- **Expected Results**:
  - UI: Error message (e.g., "File size exceeds the maximum limit")
  - API: No upload request made, or server returns 413/400
- **Verification Method**: snapshot / console
- **Test Data**: Image file > 5MB

### E2E-015: Upload non-image file as profile image
- **Type**: Edge Case
- **Priority**: Low
- **Preconditions**: Logged in, on settings page
- **User Journey**:
  1. Click the profile image area
  2. Attempt to select a non-image file (e.g., .pdf, .txt)
  3. Verify file is rejected or filtered by file picker
- **Expected Results**:
  - UI: File picker only allows image types, or error message shown
- **Verification Method**: snapshot

---

## Scenario Group 5: Account Deletion

### E2E-016: Delete account with confirmation
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in with a disposable test account, on settings page
- **User Journey**:
  1. Navigate to /dashboard/settings
  2. Scroll to "Delete Account" section
  3. Click "Delete Account" button
  4. Verify confirmation dialog/modal appears
  5. Confirm deletion (click "Yes, delete" or type confirmation text)
  6. Verify redirect to homepage or login page
  7. Attempt to login with deleted account credentials
  8. Verify login fails or shows "Account deleted" message
- **Expected Results**:
  - UI: Confirmation dialog shown; after deletion, user is logged out and redirected
  - API: DELETE /api/auth/account returns 200
  - DB: User.deletedAt set to current timestamp (soft delete), User.status = DELETED
  - Auth: Deleted user cannot log in
- **Verification Method**: snapshot / network / console
- **Test Data**: Disposable account (testbuyer-settings-{timestamp}@yopmail.com)

### E2E-017: Cancel account deletion
- **Type**: Alternative Path
- **Priority**: High
- **Preconditions**: Logged in, on settings page
- **User Journey**:
  1. Click "Delete Account"
  2. Verify confirmation dialog appears
  3. Click "Cancel" or close the dialog
  4. Verify user remains on settings page
  5. Verify account is not deleted (refresh + check profile loads)
- **Expected Results**:
  - UI: Dialog dismissed, user stays on settings page
  - API: No DELETE call made
  - DB: User record unchanged
- **Verification Method**: snapshot / network

---

## Scenario Group 6: Settings Access by Role

### E2E-018: SUPER_ADMIN can access settings
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as admin@astratech.vn (SUPER_ADMIN)
- **User Journey**:
  1. Navigate to /dashboard/settings
  2. Verify settings page loads with admin profile data
  3. Verify all settings sections visible (profile, password, image, delete)
- **Expected Results**:
  - UI: Full settings page rendered with admin's name and email
  - API: GET /api/auth/me returns 200 with role=SUPER_ADMIN
- **Verification Method**: snapshot / network
- **Test Data**: admin@astratech.vn / Admin@123

### E2E-019: SELLER can access settings
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as seller1000@yopmail.com (SELLER)
- **User Journey**:
  1. Navigate to /dashboard/settings
  2. Verify settings page loads with seller profile data
  3. Verify all settings sections visible
- **Expected Results**:
  - UI: Settings page with seller's profile information
  - API: GET /api/auth/me returns 200 with role=SELLER
- **Verification Method**: snapshot / network
- **Test Data**: seller1000@yopmail.com / Seller1000@123

### E2E-020: BUYER can access settings
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in as a buyer account
- **User Journey**:
  1. Navigate to /dashboard/settings
  2. Verify settings page loads with buyer profile data
  3. Verify all settings sections visible
- **Expected Results**:
  - UI: Settings page with buyer's profile information
  - API: GET /api/auth/me returns 200 with role=BUYER
- **Verification Method**: snapshot / network
- **Test Data**: Buyer test account

---

## Summary
| Type | Count |
|------|-------|
| Happy Path | 12 |
| Alternative Path | 1 |
| Edge Case | 4 |
| Error Path | 3 |
| **Total** | **20** |
