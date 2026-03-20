# Admin E2E Test Scenarios (Sprint 6)

## Overview
- **Feature**: Admin dashboard, user management, bulk operations, CSV export
- **Related Modules**: admin, auth, rbac
- **API Endpoints**: `/api/admin/*`
- **DB Tables**: TB_COMM_USER, TL_COMM_USE_ACTV
- **Blueprint**: docs/blueprints/002-rbac/, docs/blueprints/003-admin-ui/, docs/blueprints/006-admin-enhance/

## Scenario Group 1: Admin Dashboard

### E2E-001: Admin views dashboard analytics
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN
- **User Journey**:
  1. Log in as admin
  2. Navigate to `/dashboard/admin`
  3. Verify dashboard shows: user count, growth chart, role distribution, recent activity
- **Expected Results**:
  - API: `GET /api/admin/dashboard` returns metrics
  - UI: Charts and statistics rendered
- **Verification Method**: snapshot / network
- **Test Data**: `admin@astratech.vn` / `Admin@123`

### E2E-002: Non-admin cannot access admin pages
- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: Logged in as BUYER
- **User Journey**:
  1. Log in as buyer
  2. Navigate to `/dashboard/admin`
  3. Verify redirected or access denied
- **Expected Results**:
  - UI: Redirect away from admin pages or access denied message
  - API: Admin endpoints return 403
- **Verification Method**: snapshot / network
- **Test Data**: `buyer@vibe.com` / `Buyer@123`

## Scenario Group 2: User Management

### E2E-003: Admin lists and searches users
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Multiple users in system
- **User Journey**:
  1. Navigate to `/dashboard/admin/users`
  2. Verify user table with pagination
  3. Search by email or name
  4. Verify filtered results
- **Expected Results**:
  - API: `GET /api/admin/users?search=...`
  - UI: User table with search/filter controls
- **Verification Method**: snapshot / network
- **Test Data**: Search: "seller"

### E2E-004: Admin creates a user
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Admin logged in
- **User Journey**:
  1. Navigate to `/dashboard/admin/users`
  2. Click "Create User"
  3. Fill form: email, password, name, nickname, role
  4. Submit
  5. Verify new user appears in list
- **Expected Results**:
  - API: `POST /api/admin/users` returns new user
  - DB: User created with specified role
- **Verification Method**: snapshot / network
- **Test Data**: Unique email, role: "SELLER"

### E2E-005: Admin changes user role
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: User exists
- **User Journey**:
  1. Navigate to `/dashboard/admin/users`
  2. Click on a user
  3. Change role (e.g., BUYER → SELLER)
  4. Confirm
  5. Verify role updated
- **Expected Results**:
  - API: `PATCH /api/admin/users/:id/role`
  - DB: `useRoleCd` updated
  - Activity log: Role change recorded
- **Verification Method**: network
- **Test Data**: Any buyer user

### E2E-006: Admin suspends and reactivates user
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Active user exists
- **User Journey**:
  1. Navigate to user management
  2. Click on active user
  3. Click "Suspend"
  4. Verify status changes to SUSP
  5. Click "Activate"
  6. Verify status changes to ACTV
- **Expected Results**:
  - API: `PATCH /api/admin/users/:id/status`
  - DB: Status toggled
- **Verification Method**: network
- **Test Data**: Non-admin user

### E2E-007: Admin bulk status change
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Multiple users exist
- **User Journey**:
  1. Navigate to user management
  2. Select multiple users
  3. Click bulk action: "Suspend"
  4. Verify all selected users suspended
- **Expected Results**:
  - API: `POST /api/admin/users/bulk/status`
  - DB: All selected users updated
- **Verification Method**: network
- **Test Data**: 2+ user IDs

### E2E-008: Admin exports users to CSV
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Users in system
- **User Journey**:
  1. Navigate to user management
  2. Click "Export CSV"
  3. Verify file download
- **Expected Results**:
  - API: `GET /api/admin/users/export` returns CSV data (200)
  - UI: File downloaded
- **Verification Method**: network
- **Test Data**: Default user list

### E2E-009: Admin views user detail with e-commerce summary
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: User with orders/products exists
- **User Journey**:
  1. Navigate to user management
  2. Click on a buyer user
  3. Verify detail panel shows: profile info, e-commerce summary (order count), activity log
- **Expected Results**:
  - API: `GET /api/admin/users/:id`, `GET /api/admin/users/:id/summary`, `GET /api/admin/users/:id/activity`
  - UI: Detail panel with all sections
- **Verification Method**: snapshot / network
- **Test Data**: Buyer user with orders

### E2E-010: Admin resets user password
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: User exists
- **User Journey**:
  1. Open user detail
  2. Click "Reset Password"
  3. Enter new password
  4. Confirm
  5. Verify user can login with new password
- **Expected Results**:
  - API: `PATCH /api/admin/users/:id/password`
  - DB: Password hash updated
- **Verification Method**: network
- **Test Data**: New password: "Reset1234!"

---

## Summary
| Type | Count |
|------|-------|
| Happy Path | 9 |
| Alternative Path | 0 |
| Edge Case | 0 |
| Error Path | 1 |
| **Total** | **10** |
