# Admin E2E Test Scenarios

## Overview
- **Feature**: Admin panel — user management, dashboard overview, bulk operations, CSV export
- **Related Modules**: Auth (SUPER_ADMIN role), RBAC
- **API Endpoints**: GET /api/admin/dashboard, GET /api/admin/users, POST /api/admin/users, GET /api/admin/users/:id, PATCH /api/admin/users/:id, PATCH /api/admin/users/:id/role, PATCH /api/admin/users/:id/status, GET /api/admin/users/:id/activity, GET /api/admin/users/:id/summary, GET /api/admin/users/export, POST /api/admin/users/bulk/status
- **DB Tables**: User, ActivityLog
- **Blueprint**: docs/blueprints/003-admin-ui/blueprint.md, docs/blueprints/006-admin-enhance/blueprint.md

## Scenario Group 1: Admin Dashboard

### E2E-001: Admin dashboard overview
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as SUPER_ADMIN
- **User Journey**:
  1. Navigate to /dashboard/admin
  2. Verify dashboard statistics (total users, active users, etc.)
  3. Verify charts/graphs render
- **Expected Results**:
  - API: GET /api/admin/dashboard returns 200
  - UI: Dashboard cards with user counts, role distribution
- **Verification Method**: snapshot / network

### E2E-002: Non-admin access denied
- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: Logged in as BUYER
- **User Journey**:
  1. Navigate to /dashboard/admin
  2. Verify access denied or redirect
- **Expected Results**:
  - UI: Access denied page or redirect to dashboard
  - API: GET /api/admin/dashboard returns 403
- **Verification Method**: snapshot / network

## Scenario Group 2: User Management

### E2E-003: List all users with pagination
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN
- **User Journey**:
  1. Navigate to /dashboard/admin/users
  2. Verify user table renders with name, email, role, status
  3. Verify pagination controls
  4. Click next page
- **Expected Results**:
  - API: GET /api/admin/users returns 200
  - UI: User table with sortable columns
- **Verification Method**: snapshot / network

### E2E-004: Filter users by role
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Admin users page
- **User Journey**:
  1. Select role filter (e.g., "SELLER")
  2. Verify table updates to show only sellers
- **Expected Results**:
  - API: GET /api/admin/users?role=SELLER returns 200
  - UI: Filtered user list
- **Verification Method**: snapshot / network

### E2E-005: Filter users by status
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Admin users page
- **User Journey**:
  1. Select status filter (e.g., "ACTIVE")
  2. Verify filtered results
- **Expected Results**:
  - API: GET /api/admin/users?status=ACTIVE returns 200
- **Verification Method**: snapshot / network

### E2E-006: Create new user (admin)
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Admin users page
- **User Journey**:
  1. Click "Create User" button
  2. Fill user form (name, email, role)
  3. Submit
  4. Verify new user appears in list
- **Expected Results**:
  - API: POST /api/admin/users returns 201
  - DB: New User record created
- **Verification Method**: snapshot / network

### E2E-007: Change user role
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Admin users page
- **User Journey**:
  1. Click on a user
  2. Change role from BUYER to SELLER
  3. Save
  4. Verify role badge updated
- **Expected Results**:
  - API: PATCH /api/admin/users/:id/role returns 200
  - DB: User.role updated
- **Verification Method**: snapshot / network

### E2E-008: Suspend a user
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Admin users page, active user
- **User Journey**:
  1. Select a user
  2. Change status to "SUSPENDED"
  3. Confirm
  4. Verify status badge changes
- **Expected Results**:
  - API: PATCH /api/admin/users/:id/status returns 200
  - DB: User.status updated to SUSPENDED
- **Verification Method**: snapshot / network

### E2E-009: Bulk status change
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Admin users page, multiple users selected
- **User Journey**:
  1. Select multiple users via checkboxes
  2. Choose bulk action "Suspend"
  3. Confirm
  4. Verify all selected users' status updated
- **Expected Results**:
  - API: POST /api/admin/users/bulk/status returns 201
- **Verification Method**: snapshot / network

### E2E-010: Export users as CSV
- **Type**: Happy Path
- **Priority**: Low
- **Preconditions**: Admin users page
- **User Journey**:
  1. Click "Export CSV" button
  2. Verify CSV file download starts
- **Expected Results**:
  - API: GET /api/admin/users/export returns 200 with text/csv content-type
- **Verification Method**: network

### E2E-011: View user activity log
- **Type**: Happy Path
- **Priority**: Low
- **Preconditions**: Admin, viewing user detail
- **User Journey**:
  1. Navigate to user detail
  2. Verify activity log section
- **Expected Results**:
  - API: GET /api/admin/users/:id/activity returns 200
- **Verification Method**: snapshot / network

---

## Summary
| Type | Count |
|------|-------|
| Happy Path | 10 |
| Alternative Path | 0 |
| Edge Case | 0 |
| Error Path | 1 |
| **Total** | **11** |
