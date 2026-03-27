# Settings E2E Test Scenarios

## Overview
- **Feature**: User profile settings — update name, nickname, profile image, delete account
- **Related Modules**: Auth
- **API Endpoints**: GET /api/auth/me, PATCH /api/auth/profile, DELETE /api/auth/account
- **DB Tables**: User
- **Blueprint**: docs/blueprints/008-user-settings/blueprint.md

## Scenario Group 1: Profile Settings

### E2E-001: View settings page
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in
- **User Journey**:
  1. Navigate to /dashboard/settings
  2. Verify current profile info displayed (name, email, nickname)
  3. Verify form fields are editable
- **Expected Results**:
  - UI: Settings form with pre-filled current values
  - API: GET /api/auth/me called (via useAuth hook)
- **Verification Method**: snapshot / network

### E2E-002: Update display name
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Settings page loaded
- **User Journey**:
  1. Change name field to "New Name"
  2. Click save
  3. Verify success message
  4. Refresh page and verify name persisted
- **Expected Results**:
  - API: PATCH /api/auth/profile returns 200
  - DB: User.name updated
- **Verification Method**: snapshot / network

### E2E-003: Update nickname
- **Type**: Happy Path
- **Priority**: Low
- **Preconditions**: Settings page loaded
- **User Journey**:
  1. Change nickname field
  2. Save
  3. Verify update
- **Expected Results**:
  - API: PATCH /api/auth/profile returns 200
- **Verification Method**: snapshot / network

## Scenario Group 2: Account Deletion

### E2E-004: Delete account
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in, on settings page
- **User Journey**:
  1. Navigate to /dashboard/settings
  2. Click "Delete Account"
  3. Confirm in confirmation dialog
  4. Verify redirect to homepage
  5. Verify cannot login with same credentials
- **Expected Results**:
  - API: DELETE /api/auth/account returns 200
  - DB: User soft-deleted (status=DELETED)
  - UI: Logged out, redirected to homepage
- **Verification Method**: snapshot / network

---

## Summary
| Type | Count |
|------|-------|
| Happy Path | 4 |
| Alternative Path | 0 |
| Edge Case | 0 |
| Error Path | 0 |
| **Total** | **4** |
