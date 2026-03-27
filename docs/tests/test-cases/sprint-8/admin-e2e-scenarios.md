# Admin E2E Test Scenarios (Sprint 8)

> End-to-end test scenarios for the Admin feature covering dashboard analytics, user management (CRUD, filtering, pagination), role/status management, bulk operations, CSV export, activity logging, user summary, and security guards.

---

## Overview
- **Feature**: Admin dashboard, user management, bulk operations, CSV export, activity log, user summary
- **Related Modules**: admin, auth, firebase, rbac
- **API Endpoints**: `/api/admin/dashboard`, `/api/admin/users/*`
- **DB Tables**: TB_COMM_USER, TL_COMM_USE_ACTV, TB_PROD_PRD, TB_COMM_ORDR_ITEM
- **Frontend Pages**: `/dashboard/admin`, `/dashboard/admin/users`
- **Auth**: Firebase Auth + JWT; all admin endpoints require `SUPER_ADMIN` role
- **Blueprint**: docs/blueprints/002-rbac/, docs/blueprints/003-admin-ui/, docs/blueprints/006-admin-enhance/

---

## Scenario Group 1: Admin Dashboard Overview

### E2E-001: Admin views dashboard with full analytics

- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as SUPER_ADMIN; system has 50+ users across BUYER, SELLER, SUPER_ADMIN roles; recent activity log entries exist
- **User Journey**:
  1. Log in as `admin@astratech.vn`
  2. Navigate to `/dashboard/admin`
  3. Verify page title "Admin Dashboard" loads
  4. Verify stats cards display: "Total Users" (correct count), "New This Week" (users registered within last 7 days), "Buyers" count, "Sellers" count
  5. Verify "Role Distribution" section shows bar chart with BUYER, SELLER, SUPER_ADMIN counts and percentages
  6. Verify "Recent Activity" section shows the 10 most recent entries with user name, action type badge, description, and timestamp
  7. Click "Manage Users" link in the header
  8. Verify arrival at `/dashboard/admin/users`
- **Expected Results**:
  - UI: Dashboard loads with skeleton placeholders then real data; stats cards show correct numbers; role distribution bars are proportional; recent activity list is populated with 10 entries
  - API: `GET /api/admin/dashboard` returns 200 with `{ totalUsers, newUsersThisWeek, roleDistribution: { BUYER, SELLER, SUPER_ADMIN }, recentActivity[] }`
  - DB: Aggregation queries on `TB_COMM_USER` (count by role, count by `rgstDt >= 7 days ago`, `delYn = "N"`); `TL_COMM_USE_ACTV` (latest 10 entries with user join)
  - Server Log: No errors logged
- **Verification Method**: network + snapshot
- **Test Data**: `admin@astratech.vn` / `Admin@123`; system seeded with 50+ users and activity entries

---

### E2E-002: Dashboard shows empty state when no recent activity

- **Type**: Edge Case
- **Priority**: Low
- **Preconditions**: Logged in as SUPER_ADMIN; no activity log entries exist (fresh system)
- **User Journey**:
  1. Navigate to `/dashboard/admin`
  2. Verify stats cards show correct user counts
  3. Verify "Recent Activity" section shows empty state message (e.g., "No recent activity")
- **Expected Results**:
  - UI: Empty state displayed gracefully; no console errors; stats cards still show correct values
  - API: `GET /api/admin/dashboard` returns 200 with `recentActivity: []`
  - DB: `TL_COMM_USE_ACTV` has no documents
  - Server Log: No errors
- **Verification Method**: snapshot
- **Test Data**: Clean system with users but no activity logs

---

### E2E-003: Dashboard displays correct "New This Week" count

- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN; 3 users registered today, 2 users registered 5 days ago, 5 users registered 10 days ago
- **User Journey**:
  1. Navigate to `/dashboard/admin`
  2. Verify "New This Week" card shows 5 (3 from today + 2 from 5 days ago)
  3. Verify "Total Users" includes all users
- **Expected Results**:
  - UI: "New This Week" stat card shows 5
  - API: `GET /api/admin/dashboard` returns `newUsersThisWeek: 5`
  - DB: Count of users where `rgstDt >= (now - 7 days)` and `delYn = "N"`
  - Server Log: No errors
- **Verification Method**: network
- **Test Data**: Users with controlled registration dates

---

## Scenario Group 2: User List & Filtering

### E2E-004: Admin lists users with pagination

- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as SUPER_ADMIN; 25+ users in system
- **User Journey**:
  1. Navigate to `/dashboard/admin/users`
  2. Verify user table loads with columns: checkbox, name, email, role, status, actions
  3. Verify page 1 shows 20 users (default limit)
  4. Verify pagination controls at the bottom show total pages
  5. Click page 2
  6. Verify next batch of users loads
- **Expected Results**:
  - UI: User table displays paginated list; columns show correct data; status badges color-coded (Active = green, Suspended = red)
  - API: `GET /api/admin/users?page=1&limit=20` returns 200 with `{ items[], pagination: { page: 1, limit: 20, total, totalPages } }`
  - DB: Query on `TB_COMM_USER` with `delYn = "N"`, ordered by `rgstDt` desc
  - Server Log: No errors
- **Verification Method**: network + snapshot
- **Test Data**: 25+ users with mixed roles and statuses

---

### E2E-005: Admin searches users by name or email

- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN; users "John Doe" (john@test.com) and "Jane Smith" (jane@test.com) exist
- **User Journey**:
  1. Navigate to `/dashboard/admin/users`
  2. Type "John" in the search input
  3. Verify table filters to show only users matching "John"
  4. Clear search, type "jane@test.com"
  5. Verify table shows Jane Smith
  6. Clear search
  7. Verify all users are shown again
- **Expected Results**:
  - UI: Table updates with filtered results; matching users displayed
  - API: `GET /api/admin/users?search=John&page=1&limit=20` returns filtered results
  - DB: Query with text search on `userEmail`, `userNm`, `userNcnm` (case-insensitive contains)
  - Server Log: No errors
- **Verification Method**: network + snapshot
- **Test Data**: Users with distinct names for verification

---

### E2E-006: Admin filters users by role

- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN; users exist with BUYER, SELLER, and SUPER_ADMIN roles
- **User Journey**:
  1. Navigate to `/dashboard/admin/users`
  2. Select "SELLER" from the role filter
  3. Verify only seller users are shown in the table
  4. Select "All" from the role filter
  5. Verify all users are shown
- **Expected Results**:
  - UI: Table filters by selected role; user count updates
  - API: `GET /api/admin/users?role=SELLER&page=1&limit=20` returns only SELLER users
  - DB: Query adds `useRoleCd = "SELLER"` filter
  - Server Log: No errors
- **Verification Method**: network
- **Test Data**: Users across all three roles

---

### E2E-007: Admin filters users by status

- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN; active and suspended users exist
- **User Journey**:
  1. Navigate to `/dashboard/admin/users`
  2. Select "Suspended" from the status filter
  3. Verify only suspended users are shown
  4. Select "Active" from the status filter
  5. Verify only active users are shown
- **Expected Results**:
  - UI: Table filters by selected status
  - API: `GET /api/admin/users?status=SUSP&page=1&limit=20` returns only suspended users
  - DB: Query adds `userSttsCd = "SUSP"` filter
  - Server Log: No errors
- **Verification Method**: network
- **Test Data**: Mix of active and suspended users

---

### E2E-008: Admin uses jump-to-page input on user table

- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in as SUPER_ADMIN; 100+ users (5+ pages at limit=20)
- **User Journey**:
  1. Navigate to `/dashboard/admin/users`
  2. Verify currently on page 1
  3. Enter "4" in the jump-to-page input field
  4. Press Enter or click Go
  5. Verify table loads page 4
  6. Enter "999" (beyond total pages)
  7. Verify graceful handling (stays on last page or shows empty/error)
- **Expected Results**:
  - UI: Page jumps to the specified page number; invalid page numbers are handled gracefully
  - API: `GET /api/admin/users?page=4&limit=20` returns page 4 data
  - DB: Skip = (4-1) * 20 = 60
  - Server Log: No errors
- **Verification Method**: network + snapshot
- **Test Data**: 100+ users in system

---

### E2E-009: Admin combines search with role filter

- **Type**: Alternative Path
- **Priority**: Medium
- **Preconditions**: Logged in as SUPER_ADMIN; multiple users with role SELLER exist, one named "Alice"
- **User Journey**:
  1. Navigate to `/dashboard/admin/users`
  2. Select "SELLER" from the role filter
  3. Type "Alice" in the search input
  4. Verify only seller users matching "Alice" are shown
- **Expected Results**:
  - UI: Intersection of role filter and search applied
  - API: `GET /api/admin/users?role=SELLER&search=Alice&page=1&limit=20` returns filtered results
  - DB: Query with `useRoleCd = "SELLER"` AND (`userNm` OR `userEmail` OR `userNcnm` contains "Alice")
  - Server Log: No errors
- **Verification Method**: network
- **Test Data**: Seller named "Alice" and other non-matching sellers

---

## Scenario Group 3: User Detail & Summary

### E2E-010: Admin views user detail by ID

- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN; target user exists with known data
- **User Journey**:
  1. Navigate to `/dashboard/admin/users`
  2. Click on a user row to view detail
  3. Verify user detail panel shows: name, email, nickname, profile image, role, status, last login date, registration date
- **Expected Results**:
  - UI: User detail panel/page displays all profile fields correctly
  - API: `GET /api/admin/users/:id` returns 200 with `{ id, email, name, nickname, profileImageUrl, role, status, lastLoginAt, createdAt }`
  - DB: Query on `TB_COMM_USER` where `id = :id` and `delYn = "N"`
  - Server Log: No errors
- **Verification Method**: network + snapshot
- **Test Data**: Known user ID with complete profile

---

### E2E-011: Admin views user e-commerce summary (seller)

- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in as SUPER_ADMIN; target seller has 5 products and $500 in delivered orders
- **User Journey**:
  1. Navigate to `/dashboard/admin/users`
  2. Click on the seller user
  3. Navigate to or view summary section
  4. Verify e-commerce stats: orderCount, productCount = 5, totalRevenue = $500
- **Expected Results**:
  - UI: Summary section shows product count, order count, and total revenue
  - API: `GET /api/admin/users/:id/summary` returns 200 with `{ ...userProfile, stats: { orderCount, productCount: 5, totalRevenue: 500 } }`
  - DB: `TB_PROD_PRD` count where `sellerId = :id`; `TB_COMM_ORDR_ITEM` aggregate `subtotAmt` where `sllrId = :id` and order status = "DELIVERED"
  - Server Log: No errors
- **Verification Method**: network + snapshot
- **Test Data**: Seller with 5 products and $500 in delivered revenue

---

### E2E-012: Admin views user summary for buyer (no products, no revenue)

- **Type**: Edge Case
- **Priority**: Low
- **Preconditions**: Logged in as SUPER_ADMIN; target buyer has 3 orders but zero products and zero seller revenue
- **User Journey**:
  1. Navigate to user detail for a buyer
  2. View summary section
  3. Verify stats: orderCount = 3, productCount = 0, totalRevenue = 0
- **Expected Results**:
  - UI: Summary shows zero for product count and revenue; order count is 3
  - API: `GET /api/admin/users/:id/summary` returns `{ stats: { orderCount: 3, productCount: 0, totalRevenue: 0 } }`
  - DB: No products for buyer; no order items as seller
  - Server Log: No errors
- **Verification Method**: network
- **Test Data**: Buyer with 3 orders, no seller activity

---

### E2E-013: Admin views non-existent user by ID

- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN
- **User Journey**:
  1. Navigate directly to `/api/admin/users/999999` (non-existent ID)
  2. Verify 404 error response
- **Expected Results**:
  - UI: Error page or "User not found" message
  - API: `GET /api/admin/users/999999` returns 404 with `{ errorCode: "USER_NOT_FOUND", message: "User not found" }`
  - DB: No matching record
  - Server Log: BusinessException logged
- **Verification Method**: network
- **Test Data**: Non-existent user ID `999999`

---

## Scenario Group 4: Role Management

### E2E-014: Admin changes user role from BUYER to SELLER

- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as SUPER_ADMIN; target user is a BUYER
- **User Journey**:
  1. Navigate to `/dashboard/admin/users`
  2. Find the BUYER user in the table
  3. Click the role change action
  4. Select "SELLER" from the role dropdown
  5. Confirm the role change
  6. Verify role badge updates to "SELLER"
- **Expected Results**:
  - UI: Role badge changes from "BUYER" to "SELLER"; success feedback displayed
  - API: `PATCH /api/admin/users/:id/role` with `{ role: "SELLER" }` returns 200
  - DB: `useRoleCd = "SELLER"` in `TB_COMM_USER`; new entry in `TL_COMM_USE_ACTV` with `actvTypeCd = "ROLE_CHANGE"`, `prevVal = "BUYER"`, `newVal = "SELLER"`, `prfmrId = admin's ID`
  - Server Log: `Admin {adminId} changed user {userId} role from BUYER to SELLER`
- **Verification Method**: network + db-query
- **Test Data**: BUYER user to be promoted to SELLER

---

### E2E-015: Admin changes user role from SELLER to BUYER

- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN; target user is a SELLER
- **User Journey**:
  1. Find the SELLER user
  2. Change role to "BUYER"
  3. Confirm
  4. Verify role badge updates to "BUYER"
- **Expected Results**:
  - UI: Role badge changes to "BUYER"; success feedback
  - API: `PATCH /api/admin/users/:id/role` with `{ role: "BUYER" }` returns 200
  - DB: `useRoleCd = "BUYER"` updated; activity log entry with `ROLE_CHANGE`
  - Server Log: Role change logged
- **Verification Method**: network + db-query
- **Test Data**: SELLER user

---

### E2E-016: Admin cannot change their own role (self-modification guard)

- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: Logged in as SUPER_ADMIN (user ID = X)
- **User Journey**:
  1. Navigate to `/dashboard/admin/users`
  2. Find the current admin's own entry in the table
  3. Attempt to change own role to "BUYER"
  4. Verify error response
- **Expected Results**:
  - UI: Error message "Cannot change your own role"
  - API: `PATCH /api/admin/users/:selfId/role` returns 400 with `{ errorCode: "CANNOT_CHANGE_OWN_ROLE", message: "Cannot change your own role" }`
  - DB: No changes to admin's role
  - Server Log: BusinessException logged
- **Verification Method**: network
- **Test Data**: Admin's own user ID

---

### E2E-017: Admin cannot demote another SUPER_ADMIN

- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: Logged in as SUPER_ADMIN; another SUPER_ADMIN user exists
- **User Journey**:
  1. Find the other SUPER_ADMIN user in the table
  2. Attempt to change their role to "BUYER"
  3. Verify error response
- **Expected Results**:
  - UI: Error message "Cannot change the role of a SUPER_ADMIN"
  - API: `PATCH /api/admin/users/:id/role` returns 403 with `{ errorCode: "CANNOT_DEMOTE_SUPER_ADMIN", message: "Cannot change the role of a SUPER_ADMIN" }`
  - DB: No changes
  - Server Log: BusinessException logged
- **Verification Method**: network
- **Test Data**: Another SUPER_ADMIN user ID

---

## Scenario Group 5: Status Management

### E2E-018: Admin suspends an active user

- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as SUPER_ADMIN; target user has status ACTV
- **User Journey**:
  1. Navigate to `/dashboard/admin/users`
  2. Find an active user
  3. Click "Suspend" action
  4. Confirm the suspension
  5. Verify status badge changes to "Suspended" (red)
  6. The suspended user attempts to log in
  7. Verify login is rejected
- **Expected Results**:
  - UI: Status badge changes to "Suspended"; success feedback
  - API: `PATCH /api/admin/users/:id/status` with `{ status: "SUSP" }` returns 200
  - DB: `userSttsCd = "SUSP"` in `TB_COMM_USER`; new entry in `TL_COMM_USE_ACTV` with `actvTypeCd = "STATUS_CHANGE"`, `prevVal = "ACTV"`, `newVal = "SUSP"`
  - Server Log: `Admin {adminId} changed user {userId} status from ACTV to SUSP`
- **Verification Method**: network + db-query + manual login attempt
- **Test Data**: Active non-admin user

---

### E2E-019: Admin activates a suspended user

- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN; target user has status SUSP
- **User Journey**:
  1. Navigate to `/dashboard/admin/users`
  2. Filter by status "Suspended"
  3. Find the suspended user
  4. Click "Activate" action
  5. Verify status badge changes to "Active" (green)
  6. The reactivated user logs in successfully
- **Expected Results**:
  - UI: Status badge changes to "Active"; success feedback
  - API: `PATCH /api/admin/users/:id/status` with `{ status: "ACTV" }` returns 200
  - DB: `userSttsCd = "ACTV"` in `TB_COMM_USER`; activity log entry with `STATUS_CHANGE`
  - Server Log: Status change logged
- **Verification Method**: network + manual login
- **Test Data**: Suspended user account

---

### E2E-020: Admin cannot change their own status (self-modification guard)

- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: Logged in as SUPER_ADMIN (user ID = X)
- **User Journey**:
  1. Attempt to suspend own account via API: `PATCH /api/admin/users/:selfId/status` with `{ status: "SUSP" }`
  2. Verify error response
- **Expected Results**:
  - UI: Error message "Cannot change your own status"
  - API: Returns 400 with `{ errorCode: "CANNOT_CHANGE_OWN_STATUS", message: "Cannot change your own status" }`
  - DB: No changes to admin's status
  - Server Log: BusinessException logged
- **Verification Method**: network
- **Test Data**: Admin's own user ID

---

### E2E-021: Admin cannot suspend another SUPER_ADMIN

- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: Logged in as SUPER_ADMIN; another SUPER_ADMIN user exists
- **User Journey**:
  1. Find the other SUPER_ADMIN user
  2. Attempt to suspend them
  3. Verify error response
- **Expected Results**:
  - UI: Error message "Cannot change the status of a SUPER_ADMIN"
  - API: `PATCH /api/admin/users/:id/status` returns 403 with `{ errorCode: "CANNOT_SUSPEND_SUPER_ADMIN", message: "Cannot change the status of a SUPER_ADMIN" }`
  - DB: No changes
  - Server Log: BusinessException logged
- **Verification Method**: network
- **Test Data**: Another SUPER_ADMIN user ID

---

## Scenario Group 6: Bulk Operations

### E2E-022: Admin performs bulk suspend on multiple users

- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN; 3+ active non-admin users visible
- **User Journey**:
  1. Navigate to `/dashboard/admin/users`
  2. Select 3 users by clicking their checkboxes
  3. Click "Bulk Suspend" button
  4. Confirm the bulk operation
  5. Verify all 3 users' status badges change to "Suspended"
  6. Verify success message with count
- **Expected Results**:
  - UI: All selected users show "Suspended" status; success message "3 users suspended"
  - API: `POST /api/admin/users/bulk/status` with `{ userIds: ["id1","id2","id3"], status: "SUSP" }` returns 200 with `{ summary: { total: 3, success: 3, failure: 0 }, results: [...] }`
  - DB: All 3 users have `userSttsCd = "SUSP"`; 3 activity log entries created in `TL_COMM_USE_ACTV`
  - Server Log: 3 status change log entries
- **Verification Method**: network + db-query
- **Test Data**: 3 active non-SUPER_ADMIN user IDs

---

### E2E-023: Admin performs bulk activate on suspended users

- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN; 2+ suspended non-admin users
- **User Journey**:
  1. Filter by status "Suspended"
  2. Select 2 suspended users
  3. Click "Bulk Activate" button
  4. Confirm
  5. Verify status badges change to "Active"
- **Expected Results**:
  - UI: Selected users show "Active" status; success message
  - API: `POST /api/admin/users/bulk/status` with `{ userIds: [...], status: "ACTV" }` returns 200 with `{ summary: { total: 2, success: 2, failure: 0 } }`
  - DB: Both users have `userSttsCd = "ACTV"`; activity log entries created
  - Server Log: Status change entries logged
- **Verification Method**: network + db-query
- **Test Data**: 2 suspended user IDs

---

### E2E-024: Bulk suspend skips SUPER_ADMIN and self

- **Type**: Edge Case
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN; selection includes 2 regular users, 1 SUPER_ADMIN, and admin's own account
- **User Journey**:
  1. Select 4 users: 2 regular users, 1 other SUPER_ADMIN, and self
  2. Click bulk suspend
  3. Confirm the operation
  4. Verify partial success: 2 suspended, 2 failed
- **Expected Results**:
  - UI: 2 users suspended; feedback shows partial result with skip reasons
  - API: `POST /api/admin/users/bulk/status` returns 200 with `{ summary: { total: 4, success: 2, failure: 2 }, results: [{ userId, success: true }, { userId, success: true }, { userId, success: false, error: "Cannot change the status of a SUPER_ADMIN" }, { userId, success: false, error: "Cannot change your own status" }] }`
  - DB: Only the 2 regular users have `userSttsCd = "SUSP"`; admin and other SUPER_ADMIN unchanged
  - Server Log: 2 success + 2 BusinessException entries
- **Verification Method**: network + db-query
- **Test Data**: Mixed user selection including SUPER_ADMIN and self IDs

---

### E2E-025: Bulk operation with empty user ID list

- **Type**: Edge Case
- **Priority**: Low
- **Preconditions**: Logged in as SUPER_ADMIN
- **User Journey**:
  1. Attempt `POST /api/admin/users/bulk/status` with `{ userIds: [], status: "SUSP" }`
  2. Verify response handles gracefully
- **Expected Results**:
  - API: Returns 200 with `{ summary: { total: 0, success: 0, failure: 0 }, results: [] }` or 400 validation error
  - DB: No changes
  - Server Log: No errors or validation warning
- **Verification Method**: network
- **Test Data**: Empty userIds array

---

## Scenario Group 7: CSV Export

### E2E-026: Admin exports all users as CSV

- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN; users exist in the system
- **User Journey**:
  1. Navigate to `/dashboard/admin/users`
  2. Click "Export CSV" button (no filters applied)
  3. Verify browser downloads `users.csv`
  4. Open CSV file
  5. Verify header row: `id,email,name,role,status,registered`
  6. Verify data rows match all users
- **Expected Results**:
  - UI: Browser initiates file download
  - API: `GET /api/admin/users/export` returns 200 with `Content-Type: text/csv` and `Content-Disposition: attachment; filename=users.csv`; body is valid CSV
  - DB: Query on `TB_COMM_USER` with `delYn = "N"` ordered by `rgstDt` desc
  - Server Log: No errors
- **Verification Method**: network + file inspection
- **Test Data**: Multiple users in system

---

### E2E-027: Admin exports filtered users as CSV

- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in as SUPER_ADMIN; users exist with SELLER role
- **User Journey**:
  1. Navigate to `/dashboard/admin/users`
  2. Apply role filter "SELLER"
  3. Click "Export CSV" button
  4. Verify downloaded CSV contains only SELLER users
- **Expected Results**:
  - UI: CSV file downloaded
  - API: `GET /api/admin/users/export?role=SELLER` returns CSV with only seller rows
  - DB: Query filtered by `useRoleCd = "SELLER"` and `delYn = "N"`
  - Server Log: No errors
- **Verification Method**: network + file inspection
- **Test Data**: Users with SELLER role

---

### E2E-028: CSV export with search filter applied

- **Type**: Alternative Path
- **Priority**: Medium
- **Preconditions**: Logged in as SUPER_ADMIN; user "Alice" exists
- **User Journey**:
  1. Type "Alice" in search input
  2. Click "Export CSV"
  3. Verify downloaded CSV contains only users matching "Alice"
- **Expected Results**:
  - API: `GET /api/admin/users/export?search=Alice` returns CSV with matching rows only
  - DB: Query with text search on name/email/nickname
  - Server Log: No errors
- **Verification Method**: network + file inspection
- **Test Data**: User named "Alice"

---

### E2E-029: CSV export handles commas in user names

- **Type**: Edge Case
- **Priority**: Low
- **Preconditions**: Logged in as SUPER_ADMIN; a user with name containing a comma exists (e.g., "Doe, John")
- **User Journey**:
  1. Export all users as CSV
  2. Open CSV file
  3. Verify the comma in the name is escaped (replaced with space per implementation)
- **Expected Results**:
  - API: CSV response body has commas in names replaced with spaces to prevent column misalignment
  - Server Log: No errors
- **Verification Method**: file inspection
- **Test Data**: User with name "Doe, John" (stored as "Doe John" in CSV)

---

## Scenario Group 8: Activity Log

### E2E-030: Admin views user activity log with pagination

- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN; target user has 25+ activity log entries
- **User Journey**:
  1. Navigate to user detail for target user
  2. View activity log tab/section
  3. Verify first page shows 20 entries (default limit)
  4. Verify each entry shows: type, previous value, new value, performer ID, client IP, activity date
  5. Navigate to page 2
  6. Verify next batch of entries loads
- **Expected Results**:
  - UI: Activity log displayed with pagination; entries show action type badges, timestamps, and change details
  - API: `GET /api/admin/users/:id/activity?page=1&limit=20` returns 200 with `{ items: [{ id, userId, type, previousValue, newValue, performerId, clientIp, activityDate }], pagination: { page, limit, total, totalPages } }`
  - DB: Query on `TL_COMM_USE_ACTV` where `userId = :id` ordered by `actvDt` desc
  - Server Log: No errors
- **Verification Method**: network + snapshot
- **Test Data**: User ID with 25+ activity entries

---

### E2E-031: Activity log shows empty state for user with no activity

- **Type**: Edge Case
- **Priority**: Low
- **Preconditions**: Logged in as SUPER_ADMIN; target user has no activity log entries
- **User Journey**:
  1. Navigate to user detail for new user
  2. View activity log section
  3. Verify empty state message
- **Expected Results**:
  - UI: Empty state displayed (e.g., "No activity recorded")
  - API: `GET /api/admin/users/:id/activity?page=1&limit=20` returns 200 with `{ items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }`
  - DB: No matching entries in `TL_COMM_USE_ACTV`
  - Server Log: No errors
- **Verification Method**: snapshot
- **Test Data**: Newly created user with no activity

---

### E2E-032: Activity log records role change action

- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN; BUYER user exists
- **User Journey**:
  1. Change a BUYER user's role to SELLER (E2E-014)
  2. Navigate to that user's activity log
  3. Verify latest entry shows: type = "ROLE_CHANGE", previousValue = "BUYER", newValue = "SELLER", performerId = admin's ID
- **Expected Results**:
  - UI: Activity log contains the role change entry with correct before/after values
  - API: Activity endpoint returns entry with `type: "ROLE_CHANGE"`
  - DB: `TL_COMM_USE_ACTV` row with `actvTypeCd = "ROLE_CHANGE"`, `prevVal = "BUYER"`, `newVal = "SELLER"`, `prfmrId = adminId`
  - Server Log: No errors
- **Verification Method**: network + db-query
- **Test Data**: User whose role was just changed

---

### E2E-033: Activity log records status change action

- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN; active user exists
- **User Journey**:
  1. Suspend an active user (E2E-018)
  2. Navigate to that user's activity log
  3. Verify latest entry shows: type = "STATUS_CHANGE", previousValue = "ACTV", newValue = "SUSP"
- **Expected Results**:
  - UI: Activity log contains the status change entry
  - API: Activity endpoint returns entry with `type: "STATUS_CHANGE"`
  - DB: `TL_COMM_USE_ACTV` row with `actvTypeCd = "STATUS_CHANGE"`, `prevVal = "ACTV"`, `newVal = "SUSP"`
  - Server Log: No errors
- **Verification Method**: network + db-query
- **Test Data**: User whose status was just changed

---

## Scenario Group 9: Security (Non-Admin Access & Guards)

### E2E-034: BUYER cannot access admin dashboard

- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: Logged in as BUYER
- **User Journey**:
  1. Log in as a BUYER user
  2. Navigate to `/dashboard/admin`
  3. Verify access denied or redirect
  4. Attempt direct API call: `GET /api/admin/dashboard`
  5. Verify 403 response
- **Expected Results**:
  - UI: Access denied page or redirect to buyer dashboard
  - API: `GET /api/admin/dashboard` returns 403 Forbidden
  - DB: No admin data exposed
  - Server Log: Forbidden access attempt logged
- **Verification Method**: network
- **Test Data**: `buyer@vibe.com` / `Buyer@123`

---

### E2E-035: SELLER cannot access admin user management

- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: Logged in as SELLER
- **User Journey**:
  1. Log in as a SELLER user
  2. Navigate to `/dashboard/admin/users`
  3. Verify access denied or redirect
  4. Attempt direct API calls:
     - `GET /api/admin/users`
     - `POST /api/admin/users`
     - `PATCH /api/admin/users/:id/role`
     - `PATCH /api/admin/users/:id/status`
     - `POST /api/admin/users/bulk/status`
     - `GET /api/admin/users/export`
  5. Verify all return 403
- **Expected Results**:
  - UI: Access denied or redirect for all admin pages
  - API: All `/api/admin/*` endpoints return 403 Forbidden for SELLER role
  - DB: No data modification or exposure
  - Server Log: Forbidden access attempts logged
- **Verification Method**: network
- **Test Data**: SELLER account credentials

---

### E2E-036: Unauthenticated user cannot access admin endpoints

- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: No authentication token
- **User Journey**:
  1. Without logging in, attempt direct API calls to:
     - `GET /api/admin/dashboard`
     - `GET /api/admin/users`
     - `POST /api/admin/users`
  2. Verify 401 Unauthorized for all
- **Expected Results**:
  - API: All endpoints return 401 Unauthorized (no valid Firebase token)
  - DB: No data exposed
  - Server Log: Authentication failure logged
- **Verification Method**: network
- **Test Data**: No auth headers

---

### E2E-037: Expired or invalid token is rejected on admin endpoints

- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Using an expired or malformed Firebase token
- **User Journey**:
  1. Send `GET /api/admin/dashboard` with an expired token in the Authorization header
  2. Verify 401 Unauthorized
  3. Send `GET /api/admin/users` with a malformed token string
  4. Verify 401 Unauthorized
- **Expected Results**:
  - API: 401 Unauthorized for all requests with invalid tokens
  - DB: No data exposed
  - Server Log: Token verification failure logged
- **Verification Method**: network
- **Test Data**: Expired JWT token; random string as token

---

### E2E-038: Admin creates user with duplicate email

- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN; user with email `existing@test.com` already exists
- **User Journey**:
  1. Navigate to `/dashboard/admin/users`
  2. Click "Create User"
  3. Fill form with email `existing@test.com`, name "Duplicate", role "BUYER"
  4. Submit
  5. Verify error response
- **Expected Results**:
  - UI: Error message "Email is already registered"
  - API: `POST /api/admin/users` returns 409 with `{ errorCode: "EMAIL_ALREADY_EXISTS", message: "Email is already registered" }`
  - DB: No new user created
  - Server Log: BusinessException logged
- **Verification Method**: network
- **Test Data**: Email of an existing user

---

### E2E-039: Admin creates user with duplicate nickname

- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: Logged in as SUPER_ADMIN; user with nickname `taken_nick` already exists
- **User Journey**:
  1. Click "Create User"
  2. Fill form with unique email, name "New User", nickname `taken_nick`, role "BUYER"
  3. Submit
  4. Verify error response
- **Expected Results**:
  - UI: Error message "Nickname is already taken"
  - API: `POST /api/admin/users` returns 409 with `{ errorCode: "NICKNAME_ALREADY_EXISTS", message: "Nickname is already taken" }`
  - DB: No new user created
  - Server Log: BusinessException logged
- **Verification Method**: network
- **Test Data**: Existing nickname `taken_nick`

---

### E2E-040: Admin creates user successfully

- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as SUPER_ADMIN
- **User Journey**:
  1. Navigate to `/dashboard/admin/users`
  2. Click "Create User"
  3. Fill form: email `newuser@test.com`, name "New User", nickname "newuser1", role "SELLER"
  4. Submit
  5. Verify success feedback
  6. Verify new user appears in the user list
- **Expected Results**:
  - UI: Success toast; new user visible in table with role "SELLER" and status "ACTV"
  - API: `POST /api/admin/users` with `{ email: "newuser@test.com", name: "New User", nickname: "newuser1", role: "SELLER" }` returns 201 with created user data
  - DB: New row in `TB_COMM_USER` with `userSttsCd = "ACTV"`, `useRoleCd = "SELLER"`, `rgtrId = adminId`, `firebaseUid` starts with `admin_created_`
  - Server Log: `Admin {adminId} created user {userId} with role SELLER`
- **Verification Method**: network + db-query
- **Test Data**: Unique email and nickname

---

### E2E-041: Admin updates user profile (name, nickname)

- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN; target user "John Doe" with nickname "johnd" exists
- **User Journey**:
  1. Navigate to `/dashboard/admin/users`
  2. Find "John Doe" and click edit
  3. Change name to "John Updated"
  4. Change nickname to "johnupdated"
  5. Click "Save"
  6. Verify success feedback and table row updates
- **Expected Results**:
  - UI: User name updates in table; success toast
  - API: `PATCH /api/admin/users/:id` with `{ name: "John Updated", nickname: "johnupdated" }` returns 200
  - DB: `userNm = "John Updated"`, `userNcnm = "johnupdated"`, `mdfrId = adminId` in `TB_COMM_USER`
  - Server Log: `Admin {adminId} updated user {userId} profile`
- **Verification Method**: network + db-query
- **Test Data**: Target user "John Doe"

---

### E2E-042: Admin updates user with duplicate nickname (conflict)

- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: Logged in as SUPER_ADMIN; user A with nickname "alice_nick" and user B exist
- **User Journey**:
  1. Edit user B's profile
  2. Change nickname to "alice_nick" (already taken by user A)
  3. Submit
  4. Verify error response
- **Expected Results**:
  - UI: Error message "Nickname is already taken"
  - API: `PATCH /api/admin/users/:id` returns 409 with `{ errorCode: "NICKNAME_ALREADY_EXISTS" }`
  - DB: No changes to user B
  - Server Log: BusinessException logged
- **Verification Method**: network
- **Test Data**: User B and existing nickname "alice_nick"

---

## Summary

| ID | Scenario | Type | Priority | Group |
|----|----------|------|----------|-------|
| E2E-001 | Admin views dashboard with full analytics | Happy Path | Critical | 1. Dashboard |
| E2E-002 | Dashboard empty state (no activity) | Edge Case | Low | 1. Dashboard |
| E2E-003 | Dashboard "New This Week" count accuracy | Happy Path | High | 1. Dashboard |
| E2E-004 | Admin lists users with pagination | Happy Path | Critical | 2. User List |
| E2E-005 | Admin searches users by name/email | Happy Path | High | 2. User List |
| E2E-006 | Admin filters users by role | Happy Path | High | 2. User List |
| E2E-007 | Admin filters users by status | Happy Path | High | 2. User List |
| E2E-008 | Admin uses jump-to-page input | Happy Path | Medium | 2. User List |
| E2E-009 | Admin combines search with role filter | Alternative Path | Medium | 2. User List |
| E2E-010 | Admin views user detail by ID | Happy Path | High | 3. User Detail |
| E2E-011 | Admin views seller e-commerce summary | Happy Path | Medium | 3. User Detail |
| E2E-012 | Admin views buyer summary (no products) | Edge Case | Low | 3. User Detail |
| E2E-013 | Admin views non-existent user | Error Path | High | 3. User Detail |
| E2E-014 | Admin changes role BUYER to SELLER | Happy Path | Critical | 4. Role Mgmt |
| E2E-015 | Admin changes role SELLER to BUYER | Happy Path | High | 4. Role Mgmt |
| E2E-016 | Cannot change own role (self-guard) | Error Path | Critical | 4. Role Mgmt |
| E2E-017 | Cannot demote another SUPER_ADMIN | Error Path | Critical | 4. Role Mgmt |
| E2E-018 | Admin suspends active user | Happy Path | Critical | 5. Status Mgmt |
| E2E-019 | Admin activates suspended user | Happy Path | High | 5. Status Mgmt |
| E2E-020 | Cannot change own status (self-guard) | Error Path | Critical | 5. Status Mgmt |
| E2E-021 | Cannot suspend another SUPER_ADMIN | Error Path | Critical | 5. Status Mgmt |
| E2E-022 | Bulk suspend multiple users | Happy Path | High | 6. Bulk Ops |
| E2E-023 | Bulk activate suspended users | Happy Path | High | 6. Bulk Ops |
| E2E-024 | Bulk suspend skips SUPER_ADMIN and self | Edge Case | High | 6. Bulk Ops |
| E2E-025 | Bulk operation with empty list | Edge Case | Low | 6. Bulk Ops |
| E2E-026 | Export all users as CSV | Happy Path | High | 7. CSV Export |
| E2E-027 | Export filtered users as CSV | Happy Path | Medium | 7. CSV Export |
| E2E-028 | CSV export with search filter | Alternative Path | Medium | 7. CSV Export |
| E2E-029 | CSV handles commas in names | Edge Case | Low | 7. CSV Export |
| E2E-030 | View user activity log with pagination | Happy Path | High | 8. Activity Log |
| E2E-031 | Activity log empty state | Edge Case | Low | 8. Activity Log |
| E2E-032 | Activity log records role change | Happy Path | High | 8. Activity Log |
| E2E-033 | Activity log records status change | Happy Path | High | 8. Activity Log |
| E2E-034 | BUYER cannot access admin dashboard | Error Path | Critical | 9. Security |
| E2E-035 | SELLER cannot access admin endpoints | Error Path | Critical | 9. Security |
| E2E-036 | Unauthenticated access rejected | Error Path | Critical | 9. Security |
| E2E-037 | Expired/invalid token rejected | Error Path | High | 9. Security |
| E2E-038 | Create user with duplicate email | Error Path | High | 9. Security |
| E2E-039 | Create user with duplicate nickname | Error Path | Medium | 9. Security |
| E2E-040 | Admin creates user successfully | Happy Path | Critical | 9. Security |
| E2E-041 | Admin updates user profile | Happy Path | High | 9. Security |
| E2E-042 | Update user with duplicate nickname | Error Path | Medium | 9. Security |

### Type Distribution

| Type | Count |
|------|-------|
| Happy Path | 22 |
| Alternative Path | 2 |
| Edge Case | 7 |
| Error Path | 11 |
| **Total** | **42** |

### Priority Distribution

| Priority | Count |
|----------|-------|
| Critical | 13 |
| High | 19 |
| Medium | 7 |
| Low | 3 |
| **Total** | **42** |
