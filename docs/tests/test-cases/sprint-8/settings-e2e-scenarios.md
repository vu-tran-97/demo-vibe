# Settings Feature E2E Test Scenarios

## Overview
- **Feature**: User settings — profile editing, password change (Firebase), account deletion (soft delete)
- **Related Modules**: Auth, Firebase Auth
- **API Endpoints**: `PATCH /api/auth/profile` (profile update), `DELETE /api/auth/account` (account deletion)
- **Frontend Pages**: `/settings` (standalone), `/dashboard/settings` (dashboard layout)
- **DB Tables**: TB_COMM_USER
- **Firebase Operations**: `reauthenticateWithCredential()`, `updatePassword()` (client-side)
- **Blueprint**: docs/blueprints/013-settings/blueprint.md

## Summary Table

| ID | Scenario | Type | Priority | Group |
|----|----------|------|----------|-------|
| E2E-001 | Update profile name successfully | Happy | Critical | Profile Update |
| E2E-002 | Update profile nickname | Happy | High | Profile Update |
| E2E-003 | Update profile image URL | Happy | High | Profile Update |
| E2E-004 | Update all profile fields at once | Happy | High | Profile Update |
| E2E-005 | Clear optional fields (nickname, image) | Alternative | Medium | Profile Update |
| E2E-006 | Change password with correct current password | Happy | Critical | Password Change |
| E2E-007 | Change password with wrong current password | Error | Critical | Password Change |
| E2E-008 | Password change requires Firebase reauthentication | Happy | High | Password Change |
| E2E-009 | Cancel password change resets form | Alternative | Medium | Password Change |
| E2E-010 | Soft delete account sets delYn=Y and userSttsCd=INAC | Happy | Critical | Account Deletion |
| E2E-011 | Delete confirmation modal prevents accidental deletion | Happy | High | Account Deletion |
| E2E-012 | Deleted account cannot log in | Happy | Critical | Account Deletion |
| E2E-013 | Dismiss delete modal by clicking overlay | Alternative | Medium | Account Deletion |
| E2E-014 | Modal disabled during deletion in progress | Edge | Medium | Account Deletion |
| E2E-015 | Empty name rejected | Error | Critical | Validation Errors |
| E2E-016 | Duplicate nickname rejected | Error | Critical | Validation Errors |
| E2E-017 | Password mismatch prevents submission | Error | High | Validation Errors |
| E2E-018 | Empty current/new password prevents submission | Error | High | Validation Errors |
| E2E-019 | Unauthenticated user redirected from settings | Security | Critical | Validation Errors |
| E2E-020 | Profile section shows current user data on load | Happy | High | UI States |
| E2E-021 | Password section toggle show/hide | Happy | Medium | UI States |
| E2E-022 | Save button shows loading state during save | Happy | Medium | UI States |
| E2E-023 | Toast messages for success and error | Happy | High | UI States |
| E2E-024 | Account info section shows email and role (read-only) | Happy | Medium | UI States |
| E2E-025 | Dashboard settings page uses same functionality | Happy | High | UI States |

---

## Scenario Group 1: Profile Update

### E2E-001: Update profile name successfully
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Authenticated user "TestUser" logged in; on `/settings` page
- **User Journey**:
  1. Navigate to `/settings`
  2. In the "Full Name" field, change value from "TestUser" to "Updated Name"
  3. Click "Save Changes" button
  4. Observe toast notification
- **Expected Results**:
  - UI: Success toast "Profile updated successfully" appears; avatar info updates to "Updated Name"; Save button shows "Saving..." during request
  - API: `PATCH /api/auth/profile` with body `{ name: "Updated Name" }` returns 200 with updated user object `{ name: "Updated Name", ... }`
  - DB: TB_COMM_USER.USE_NM updated to "Updated Name"; MDFCN_DT updated; MDFR_ID = user's ID
- **Verification Method**: network / ui-inspection / db-query
- **Test Data**: `{ name: "Updated Name" }`

### E2E-002: Update profile nickname
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Authenticated user; nickname "user_abc123" (auto-generated at signup)
- **User Journey**:
  1. Navigate to `/settings`
  2. Change nickname to "coolnick"
  3. Click "Save Changes"
- **Expected Results**:
  - UI: Success toast; nickname field shows "coolnick"
  - API: `PATCH /api/auth/profile` with `{ nickname: "coolnick" }` returns 200
  - DB: TB_COMM_USER.USE_NCNM updated to "coolnick"; uniqueness check passes (no other active user has this nickname)
- **Verification Method**: network / db-query
- **Test Data**: `{ nickname: "coolnick" }`

### E2E-003: Update profile image URL
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Authenticated user; no profile image set (prflImgUrl = null)
- **User Journey**:
  1. Navigate to `/settings`
  2. Paste "https://example.com/avatar.jpg" in Profile Image URL field
  3. Click "Save Changes"
- **Expected Results**:
  - UI: Avatar section shows image instead of initial letter; success toast
  - API: `PATCH /api/auth/profile` with `{ profileImageUrl: "https://example.com/avatar.jpg" }` returns 200
  - DB: TB_COMM_USER.PRFL_IMG_URL updated to "https://example.com/avatar.jpg"
- **Verification Method**: network / ui-inspection / db-query
- **Test Data**: `{ profileImageUrl: "https://example.com/avatar.jpg" }`

### E2E-004: Update all profile fields at once
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Authenticated user
- **User Journey**:
  1. Change name to "Full Update"
  2. Change nickname to "fullupdatenick"
  3. Set profile image URL to "https://example.com/new-avatar.png"
  4. Click "Save Changes"
- **Expected Results**:
  - UI: All three fields updated; success toast
  - API: `PATCH /api/auth/profile` with `{ name: "Full Update", nickname: "fullupdatenick", profileImageUrl: "https://example.com/new-avatar.png" }` returns 200
  - DB: USE_NM, USE_NCNM, PRFL_IMG_URL all updated in single transaction
- **Verification Method**: network / db-query
- **Test Data**: `{ name: "Full Update", nickname: "fullupdatenick", profileImageUrl: "https://example.com/new-avatar.png" }`

### E2E-005: Clear optional fields (nickname, image)
- **Type**: Alternative Path
- **Priority**: Medium
- **Preconditions**: User has nickname "existingnick" and profile image URL set
- **User Journey**:
  1. Clear the Nickname field (leave empty)
  2. Clear the Profile Image URL field (leave empty)
  3. Click "Save Changes"
- **Expected Results**:
  - UI: Avatar reverts to initial letter display; success toast
  - API: `PATCH /api/auth/profile` with `{ nickname: undefined, profileImageUrl: undefined }` — empty strings trimmed to undefined in frontend `handleSaveProfile()`
  - DB: USE_NCNM and PRFL_IMG_URL may remain unchanged (undefined fields skipped) or set to null depending on DTO handling
- **Verification Method**: network / ui-inspection / db-query
- **Test Data**: `{ nickname: "", profileImageUrl: "" }`

---

## Scenario Group 2: Password Change

### E2E-006: Change password with correct current password
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Authenticated email/password user (not social login); current password "Test1234!"
- **User Journey**:
  1. Navigate to `/settings`
  2. Click "Change Password" button in Security section
  3. Enter current password: "Test1234!"
  4. Enter new password: "NewPass5678!"
  5. Confirm new password: "NewPass5678!"
  6. Click "Update Password"
- **Expected Results**:
  - UI: Success toast "Password changed successfully"; password form collapses; all password fields cleared
  - API (Firebase client-side): `reauthenticateWithCredential(firebaseUser, credential)` succeeds, then `updatePassword(firebaseUser, newPassword)` succeeds
  - DB: No direct DB change (password stored in Firebase Auth, not PostgreSQL)
  - Firebase: User's password updated; subsequent login requires "NewPass5678!"
- **Verification Method**: ui-inspection / firebase-console
- **Test Data**: `{ currentPassword: "Test1234!", newPassword: "NewPass5678!", confirmPassword: "NewPass5678!" }`

### E2E-007: Change password with wrong current password
- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: Authenticated user; current password is not "WrongPass123!"
- **User Journey**:
  1. Click "Change Password"
  2. Enter current password: "WrongPass123!"
  3. Enter new password: "ValidNew1234!"
  4. Confirm: "ValidNew1234!"
  5. Click "Update Password"
- **Expected Results**:
  - UI: Error toast "Current password is incorrect"; password form stays open; fields not cleared
  - API (Firebase): `reauthenticateWithCredential()` throws error with code `auth/wrong-password` or `auth/invalid-credential`
  - Firebase: Password unchanged
- **Verification Method**: ui-inspection
- **Test Data**: `{ currentPassword: "WrongPass123!", newPassword: "ValidNew1234!" }`

### E2E-008: Password change requires Firebase reauthentication
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: User authenticated but Firebase token expired or near expiry
- **User Journey**:
  1. Attempt password change
  2. Firebase SDK requires fresh credential via `reauthenticateWithCredential()`
- **Expected Results**:
  - API: `EmailAuthProvider.credential(firebaseUser.email, currentPassword)` creates credential; `reauthenticateWithCredential(firebaseUser, credential)` must succeed before `updatePassword()` is called
  - UI: If reauthentication fails, error toast shown; if succeeds, password updated
- **Verification Method**: ui-inspection / network (Firebase Auth API calls)
- **Test Data**: `{ currentPassword: "Test1234!", newPassword: "NewSecure9!" }`

### E2E-009: Cancel password change resets form
- **Type**: Alternative Path
- **Priority**: Medium
- **Preconditions**: Password section expanded with partial input
- **User Journey**:
  1. Click "Change Password"
  2. Type partial values in current/new/confirm fields
  3. Click "Cancel"
- **Expected Results**:
  - UI: Password section collapses; all three password fields reset to empty; no API call made
  - State: `showPasswordSection` = false, `currentPassword` = "", `newPassword` = "", `confirmPassword` = ""
- **Verification Method**: ui-inspection
- **Test Data**: N/A

---

## Scenario Group 3: Account Deletion

### E2E-010: Soft delete account sets delYn=Y and userSttsCd=INAC
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Authenticated active user (USE_STTS_CD='ACTV', DEL_YN='N')
- **User Journey**:
  1. Navigate to `/settings`
  2. Scroll to "Danger Zone" section
  3. Click "Delete Account" button
  4. Confirmation modal appears with warning text
  5. Click "Yes, Delete My Account"
  6. User redirected to homepage
- **Expected Results**:
  - UI: Modal shows "Delete your account?" with warning "This action cannot be undone. All your data, orders, and messages will be permanently deleted."; after confirmation, redirect to "/"
  - API: `DELETE /api/auth/account` returns 200 with `{ message: "Account deleted successfully" }`
  - DB: TB_COMM_USER updated: `DEL_YN='Y'`, `USE_STTS_CD='INAC'`, `MDFR_ID='{userId}'`
  - Firebase: User session cleared on frontend (local storage/cookies)
- **Verification Method**: network / db-query / ui-inspection
- **Test Data**: Authenticated user with known ID

### E2E-011: Delete confirmation modal prevents accidental deletion
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: On settings page
- **User Journey**:
  1. Click "Delete Account" button
  2. Modal appears
  3. Click "Cancel" button
- **Expected Results**:
  - UI: Modal closes; user remains on settings page; no API call made; account unchanged
  - DB: No changes to TB_COMM_USER
- **Verification Method**: ui-inspection / network (no DELETE request)
- **Test Data**: N/A

### E2E-012: Deleted account cannot log in
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Account for "deleted-user@test.com" has been soft-deleted (DEL_YN='Y')
- **User Journey**:
  1. Log out
  2. Attempt to log in with "deleted-user@test.com"
- **Expected Results**:
  - API: `findOrCreateUser()` or `getProfile()` queries with `delYn: 'N'` filter; soft-deleted user not found; returns appropriate error or creates a new account based on Firebase UID
  - DB: Original record remains with DEL_YN='Y'; query `WHERE DEL_YN='N'` excludes this user
- **Verification Method**: network / db-query
- **Test Data**: `{ email: "deleted-user@test.com" }`

### E2E-013: Dismiss delete modal by clicking overlay
- **Type**: Alternative Path
- **Priority**: Medium
- **Preconditions**: Delete confirmation modal is open
- **User Journey**:
  1. Click "Delete Account" to open modal
  2. Click on the dark overlay area outside the modal
- **Expected Results**:
  - UI: Modal closes (onClick handler on `modalOverlay` calls `setShowDeleteConfirm(false)` when not loading)
  - DB: No changes
- **Verification Method**: ui-inspection
- **Test Data**: N/A

### E2E-014: Modal disabled during deletion in progress
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: Delete confirmation modal open; slow network
- **User Journey**:
  1. Click "Yes, Delete My Account"
  2. While API call is in progress, attempt to click "Cancel" or overlay
- **Expected Results**:
  - UI: "Yes, Delete My Account" button shows "Deleting..." text; Cancel button is disabled (`disabled={deleteLoading}`); overlay click no-op (`!deleteLoading && setShowDeleteConfirm(false)`)
- **Verification Method**: ui-inspection
- **Test Data**: N/A (simulate slow network)

---

## Scenario Group 4: Validation Errors

### E2E-015: Empty name rejected
- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: Authenticated user on settings page
- **User Journey**:
  1. Clear the "Full Name" field completely
  2. Click "Save Changes"
- **Expected Results**:
  - UI: Error toast "Name cannot be empty"; no API call made (client-side validation in `handleSaveProfile()`: `if (!name.trim())`)
  - API: Request not sent
- **Verification Method**: ui-inspection / network (no PATCH request)
- **Test Data**: `{ name: "" }`

### E2E-016: Duplicate nickname rejected
- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: Another active user has nickname "taken_nick" in DB
- **User Journey**:
  1. Change nickname to "taken_nick"
  2. Click "Save Changes"
- **Expected Results**:
  - UI: Error toast with message from AuthError (e.g., "NICKNAME_ALREADY_EXISTS" or similar business exception)
  - API: `PATCH /api/auth/profile` with `{ nickname: "taken_nick" }` returns 409 Conflict
  - DB: Server checks `prisma.user.findFirst({ where: { userNcnm: "taken_nick", delYn: 'N', id: { not: userId } } })`; finds existing user; throws BusinessException 'NICKNAME_ALREADY_EXISTS'
- **Verification Method**: network / ui-inspection
- **Test Data**: `{ nickname: "taken_nick" }`

### E2E-017: Password mismatch prevents submission
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Password change section open
- **User Journey**:
  1. Enter current password: "Test1234!"
  2. Enter new password: "NewPass1!"
  3. Enter confirm password: "DifferentPass2!"
  4. Observe button state
- **Expected Results**:
  - UI: "Passwords do not match" error text shown below confirm field (inline validation); "Update Password" button is disabled (`disabled={...newPassword !== confirmPassword}`)
  - API: No request sent; button cannot be clicked
- **Verification Method**: ui-inspection
- **Test Data**: `{ newPassword: "NewPass1!", confirmPassword: "DifferentPass2!" }`

### E2E-018: Empty current/new password prevents submission
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Password change section open
- **User Journey**:
  1. Leave current password empty
  2. Enter new password: "NewPass1!"
  3. Confirm: "NewPass1!"
  4. Observe button state
- **Expected Results**:
  - UI: "Update Password" button disabled (`disabled={...!currentPassword || !newPassword...}`)
  - API: No request sent
- **Verification Method**: ui-inspection
- **Test Data**: `{ currentPassword: "", newPassword: "NewPass1!" }`

### E2E-019: Unauthenticated user redirected from settings
- **Type**: Security
- **Priority**: Critical
- **Preconditions**: User not logged in (no valid token)
- **User Journey**:
  1. Navigate directly to `/settings` without authentication
- **Expected Results**:
  - UI (`/settings`): `isLoggedIn()` returns false; `router.replace('/')` called; page returns null
  - UI (`/dashboard/settings`): `useAuth(true)` with `requireAuth=true` redirects to homepage; page returns null while loading
  - API: `DELETE /api/auth/account` without token returns 401 Unauthorized (AuthGuard)
- **Verification Method**: ui-inspection / network
- **Test Data**: No auth token

---

## Scenario Group 5: UI States

### E2E-020: Profile section shows current user data on load
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Authenticated user with name "Jane Doe", nickname "janedoe", profile image URL "https://example.com/jane.jpg", role "SELLER"
- **User Journey**:
  1. Navigate to `/settings`
  2. Observe profile section
- **Expected Results**:
  - UI: Full Name input pre-filled with "Jane Doe"; Nickname input with "janedoe"; Profile Image URL with "https://example.com/jane.jpg"; Avatar shows image; Avatar info shows "Jane Doe" and "SELLER"; role badge styled with `roleBadgeSeller` class
- **Verification Method**: ui-inspection
- **Test Data**: Pre-existing user with known profile data

### E2E-021: Password section toggle show/hide
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Authenticated user on settings page
- **User Journey**:
  1. Observe Security section — only "Change Password" button visible, no input fields
  2. Click "Change Password"
  3. Three password input fields appear (current, new, confirm)
  4. Click "Cancel"
  5. Password fields hidden; "Change Password" button reappears
- **Expected Results**:
  - UI: `showPasswordSection` toggles between true/false; fields mount/unmount correctly
- **Verification Method**: ui-inspection
- **Test Data**: N/A

### E2E-022: Save button shows loading state during save
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Authenticated user; profile form filled
- **User Journey**:
  1. Change name and click "Save Changes"
  2. Observe button during API call
- **Expected Results**:
  - UI: Button text changes to "Saving..."; button is disabled (`disabled={profileSaving}`); after response, button reverts to "Save Changes"
- **Verification Method**: ui-inspection
- **Test Data**: Any valid profile update

### E2E-023: Toast messages for success and error
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Authenticated user
- **User Journey**:
  1. Successfully save profile -> observe success toast
  2. Attempt duplicate nickname -> observe error toast
- **Expected Results**:
  - UI (success): Green toast with checkmark icon and "Profile updated successfully" text; auto-dismisses after 4 seconds
  - UI (error): Red-styled toast (`toastError` class) with alert icon and error message; auto-dismisses after 4 seconds
- **Verification Method**: ui-inspection
- **Test Data**: Valid + invalid profile updates

### E2E-024: Account info section shows email and role (read-only)
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Authenticated user with email "test@example.com", role "BUYER"
- **User Journey**:
  1. Navigate to `/settings` or `/dashboard/settings`
  2. Scroll to Account section
- **Expected Results**:
  - UI: Email displayed as "test@example.com" (read-only text, not input); Role badge shows "BUYER" with `roleBadgeBuyer` class; Member Since date formatted (dashboard version only, via `formatDate()`)
  - UI: No edit controls for email or role
- **Verification Method**: ui-inspection
- **Test Data**: `{ email: "test@example.com", role: "BUYER" }`

### E2E-025: Dashboard settings page uses same functionality
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Authenticated user with dashboard access
- **User Journey**:
  1. Navigate to `/dashboard/settings`
  2. Update profile name
  3. Change password
  4. Open delete modal
- **Expected Results**:
  - UI: Dashboard version uses `useAuth(true)` hook (vs standalone `isLoggedIn()`); same form fields, same API calls, same toast behavior
  - API: Same `PATCH /api/auth/profile` and `DELETE /api/auth/account` endpoints called
  - Difference: Dashboard version rendered within dashboard layout; includes `formatDate()` for Member Since; standalone version has full page layout with header/footer
- **Verification Method**: ui-inspection / network
- **Test Data**: Same as E2E-001 through E2E-010
