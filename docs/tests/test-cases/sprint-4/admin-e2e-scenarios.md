# Admin Enhancement — E2E Test Scenarios (Sprint 4)

> End-to-end test scenarios for the admin enhancement feature covering admin dashboard analytics, user management table, user edit, role change, password reset, suspend/activate, bulk operations, CSV export, and activity logging.

---

## Scenarios

### E2E-ADM-001: Admin views dashboard with analytics

- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: SUPER_ADMIN logged in; system has 50+ users across all roles; recent activity exists
- **User Journey**:
  1. Navigate to `/dashboard/admin`
  2. Observe the "Admin Dashboard" page title and "Overview of platform analytics" subtitle
  3. Verify stats cards display:
     - "Total Users" with correct count
     - "New This Week" with count of users registered in the last 7 days
     - "Buyers" with count of BUYER role users
     - "Sellers" with count of SELLER role users
  4. Verify "Role Distribution" section shows horizontal bar chart with BUYER, SELLER, SUPER_ADMIN counts and percentages
  5. Verify "Recent Activity" section shows the 10 most recent activity entries with user avatar (first letter), name, action type badge, description, and timestamp
  6. Click "Manage Users" link in the header
  7. Arrive at `/dashboard/admin/users`
- **Expected Results**:
  - UI: Dashboard loads with skeleton placeholders then real data; stats cards show correct numbers; role distribution bars are proportional; recent activity list is populated
  - API: `GET /api/admin/dashboard` returns 200 with `{ totalUsers, newUsersThisWeek, roleDistribution, recentActivity[] }`
  - DB: Aggregation queries on `TB_COMM_USER` (count by role, count by registration date) and `TL_COMM_USE_ACTV` (latest 10 entries)
- **Verification Method**: network + snapshot
- **Test Data**: System with users across all roles and recent activity log entries

---

### E2E-ADM-002: Admin views user management table

- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: SUPER_ADMIN logged in; 20+ users in system
- **User Journey**:
  1. Navigate to `/dashboard/admin/users`
  2. Observe user table with columns: checkbox, name, email, role, status, actions
  3. Observe search input and filter controls (role, status filters)
  4. Observe pagination controls at the bottom
  5. Verify users are listed with correct data and status badges (Active = green, Suspended = red)
- **Expected Results**:
  - UI: User table displays paginated list; columns show correct user data; status badges color-coded
  - API: `GET /api/admin/users?page=1&limit=20` returns 200 with paginated user list
  - DB: Query on `TB_COMM_USER` with `DEL_YN = "N"` filter
- **Verification Method**: network + snapshot
- **Test Data**: 20+ users with mixed roles and statuses

---

### E2E-ADM-003: Admin searches users by name/email

- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: SUPER_ADMIN logged in; users "John Doe" and "Jane Smith" exist
- **User Journey**:
  1. Navigate to `/dashboard/admin/users`
  2. Type "John" in the search input
  3. Observe the user table filters to show only users matching "John"
  4. Clear the search and type "jane@example.com"
  5. Observe the table filters to show Jane Smith
  6. Clear the search
  7. Verify all users are shown again
- **Expected Results**:
  - UI: Table updates in real-time or on search submit; matching users displayed
  - API: `GET /api/admin/users?search=John&page=1&limit=20` returns filtered results
  - DB: Query with text search on `USE_NM`, `USE_EML`, `USE_NCNM`
- **Verification Method**: network + snapshot
- **Test Data**: Users with distinct names for search verification

---

### E2E-ADM-004: Admin filters users by role

- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: SUPER_ADMIN logged in; users exist with BUYER, SELLER, and SUPER_ADMIN roles
- **User Journey**:
  1. Navigate to `/dashboard/admin/users`
  2. Select "SELLER" from the role filter
  3. Observe only sellers are shown in the table
  4. Select "All" from the role filter
  5. Verify all users are shown
- **Expected Results**:
  - UI: Table filters by selected role; count updates
  - API: `GET /api/admin/users?role=SELLER&page=1&limit=20` returns only seller users
  - DB: Query adds `USE_ROLE_CD = "SELLER"` filter
- **Verification Method**: network
- **Test Data**: Users across all three roles

---

### E2E-ADM-005: Admin edits user profile (name, nickname)

- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: SUPER_ADMIN logged in; target user "John Doe" with nickname "johnd" exists
- **User Journey**:
  1. Navigate to `/dashboard/admin/users`
  2. Find "John Doe" in the user table
  3. Click the edit action (pencil icon or "Edit" button)
  4. Edit panel/modal opens
  5. Change "Name" to "John Updated"
  6. Change "Nickname" to "johnupdated"
  7. Click "Save" or "Update" button
  8. Observe success feedback; table row updates with new name
- **Expected Results**:
  - UI: User name updates in the table; success toast or feedback shown
  - API: `PATCH /api/admin/users/:id` with `{ name: "John Updated", nickname: "johnupdated" }` returns 200
  - DB: `USE_NM = "John Updated"`, `USE_NCNM = "johnupdated"` in `TB_COMM_USER`; activity log entry created in `TL_COMM_USE_ACTV` with `ACTV_TYPE_CD = "PRFL_UPDATE"`
- **Verification Method**: network + db-query
- **Test Data**: Target user "John Doe"

---

### E2E-ADM-006: Admin changes user role (BUYER to SELLER)

- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: SUPER_ADMIN logged in; target user is BUYER role
- **User Journey**:
  1. Navigate to `/dashboard/admin/users`
  2. Find a BUYER user in the table
  3. Click the role change action
  4. Select "SELLER" from the role dropdown
  5. Confirm the role change
  6. Observe the user's role badge updates to "SELLER"
- **Expected Results**:
  - UI: Role badge changes from "BUYER" to "SELLER"; success feedback
  - API: `PATCH /api/admin/users/:id/role` with `{ role: "SELLER" }` returns 200
  - DB: `USE_ROLE_CD = "SELLER"` in `TB_COMM_USER`; `TL_COMM_USE_ACTV` entry with `ACTV_TYPE_CD = "ROLE_CHANGE"`, `PREV_VAL = "BUYER"`, `NEW_VAL = "SELLER"`, `PRFMR_ID = admin's ID`
- **Verification Method**: network + db-query
- **Test Data**: BUYER user to be promoted to SELLER

---

### E2E-ADM-007: Admin resets user password

- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: SUPER_ADMIN logged in; target user exists
- **User Journey**:
  1. Navigate to `/dashboard/admin/users`
  2. Find the target user in the table
  3. Click the "Reset Password" action
  4. Enter new password "NewPassword123!" in the password field
  5. Confirm the reset
  6. Observe success feedback
  7. Log out; log in as the target user with the new password
  8. Verify login succeeds
- **Expected Results**:
  - UI: Success message after password reset; user can log in with new password
  - API: `PATCH /api/admin/users/:id/password` with `{ password: "NewPassword123!" }` returns 200
  - DB: `USE_PSWD` updated (bcrypt hash) in `TB_COMM_USER`; activity logged
- **Verification Method**: network + manual login
- **Test Data**: Target user credentials; new password

---

### E2E-ADM-008: Admin suspends a user

- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: SUPER_ADMIN logged in; target user has status ACTV
- **User Journey**:
  1. Navigate to `/dashboard/admin/users`
  2. Find an active user in the table
  3. Click the "Suspend" action
  4. Confirm the suspension
  5. Observe the user's status badge changes to "Suspended" (red)
  6. The suspended user attempts to log in
  7. Login is rejected with "Account suspended" message
- **Expected Results**:
  - UI: Status badge changes to "Suspended"; success feedback
  - API: `PATCH /api/admin/users/:id/status` with `{ status: "SUSP" }` returns 200
  - DB: `USE_STTS_CD = "SUSP"` in `TB_COMM_USER`; `TL_COMM_USE_ACTV` entry with `ACTV_TYPE_CD = "STTS_CHANGE"`, `PREV_VAL = "ACTV"`, `NEW_VAL = "SUSP"`
- **Verification Method**: network + db-query + manual login attempt
- **Test Data**: Active user to be suspended

---

### E2E-ADM-009: Admin activates a suspended user

- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: SUPER_ADMIN logged in; target user has status SUSP
- **User Journey**:
  1. Navigate to `/dashboard/admin/users`
  2. Filter by status "Suspended"
  3. Find the suspended user
  4. Click the "Activate" action
  5. Observe status badge changes to "Active" (green)
  6. The reactivated user logs in successfully
- **Expected Results**:
  - UI: Status badge changes to "Active"; success feedback
  - API: `PATCH /api/admin/users/:id/status` with `{ status: "ACTV" }` returns 200
  - DB: `USE_STTS_CD = "ACTV"` in `TB_COMM_USER`; activity logged
- **Verification Method**: network + manual login
- **Test Data**: Suspended user account

---

### E2E-ADM-010: Admin performs bulk suspend operation

- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: SUPER_ADMIN logged in; 3+ active non-admin users visible in user table
- **User Journey**:
  1. Navigate to `/dashboard/admin/users`
  2. Select 3 users by clicking their checkboxes
  3. Click the "Bulk Suspend" button (or similar bulk action control)
  4. Confirm the bulk operation
  5. Observe all 3 users' status badges change to "Suspended"
  6. Observe success message with count (e.g., "3 users suspended")
- **Expected Results**:
  - UI: All selected users show "Suspended" status; success count message
  - API: `POST /api/admin/users/bulk/status` with `{ userIds: [...], status: "SUSP" }` returns 200 with `{ successCount: 3, skipCount: 0, skipped: [] }`
  - DB: All 3 users have `USE_STTS_CD = "SUSP"`; 3 activity log entries created
- **Verification Method**: network + db-query
- **Test Data**: 3 active user IDs (non-SUPER_ADMIN)

---

### E2E-ADM-011: Bulk suspend skips SUPER_ADMIN and self

- **Type**: Edge Case
- **Priority**: High
- **Preconditions**: SUPER_ADMIN logged in; selection includes another SUPER_ADMIN and the current admin's own account
- **User Journey**:
  1. Navigate to `/dashboard/admin/users`
  2. Select 4 users: 2 regular users, 1 SUPER_ADMIN, and self
  3. Click bulk suspend
  4. Confirm the operation
  5. Observe partial success: 2 suspended, 2 skipped
  6. Observe skip reasons in the response
- **Expected Results**:
  - UI: 2 users suspended; feedback shows "2 suspended, 2 skipped (SUPER_ADMIN/self)"
  - API: `POST /api/admin/users/bulk/status` returns 200 with `{ successCount: 2, skipCount: 2, skipped: [{ id, reason }] }`
  - DB: Only the 2 regular users have `USE_STTS_CD = "SUSP"`; admin and other SUPER_ADMIN unchanged
- **Verification Method**: network + db-query
- **Test Data**: Mixed user selection including SUPER_ADMIN and self

---

### E2E-ADM-012: Admin exports users as CSV

- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: SUPER_ADMIN logged in; users exist in the system
- **User Journey**:
  1. Navigate to `/dashboard/admin/users`
  2. Optionally apply role filter (e.g., "SELLER")
  3. Click the "Export CSV" button
  4. Observe browser downloads a file named `users.csv`
  5. Open the CSV file
  6. Verify header row contains expected columns (ID, Name, Email, Nickname, Role, Status, Created Date)
  7. Verify data rows match the filtered user list
- **Expected Results**:
  - UI: Browser initiates file download
  - API: `GET /api/admin/users/export?role=SELLER` returns 200 with `Content-Type: text/csv` and `Content-Disposition: attachment; filename=users.csv`; response body is valid CSV
  - DB: Query matches the same filter as the list endpoint
- **Verification Method**: network + file inspection
- **Test Data**: Users with SELLER role filter applied

---

### E2E-ADM-013: Admin views user detail with e-commerce summary

- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: SUPER_ADMIN logged in; target user is a SELLER with 5 products and $500 in delivered orders
- **User Journey**:
  1. Navigate to `/dashboard/admin/users`
  2. Click on a seller user row to view their detail
  3. Observe user detail panel showing: name, email, nickname, role, status, registration date
  4. Observe e-commerce summary: productCount = 5, totalRevenue = $500
  5. Observe activity log tab with user's recent activities
- **Expected Results**:
  - UI: User detail shows profile info plus e-commerce summary; activity log tab is populated
  - API: `GET /api/admin/users/:id` returns user data; `GET /api/admin/users/:id/summary` returns `{ orderCount, productCount, totalRevenue }`; `GET /api/admin/users/:id/activity?page=1&limit=20` returns activity log
  - DB: Aggregation on `TB_PROD_PRD` (count by SLLR_ID), `TB_COMM_ORDR_ITEM` (sum by SLLR_ID for DELIVERED orders), `TL_COMM_USE_ACTV` (by USE_ID)
- **Verification Method**: network + snapshot
- **Test Data**: Seller with known product count and revenue

---

### E2E-ADM-014: Non-admin user cannot access admin endpoints

- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: User logged in as SELLER or BUYER role
- **User Journey**:
  1. Manually navigate to `/dashboard/admin` in the browser
  2. Observe access denied or redirect (depending on client-side guard)
  3. Attempt direct API calls: `GET /api/admin/dashboard`, `GET /api/admin/users`
- **Expected Results**:
  - UI: Access denied page or redirect to dashboard
  - API: All `/api/admin/*` endpoints return 403 Forbidden for non-SUPER_ADMIN roles
  - DB: No data exposed
- **Verification Method**: network
- **Test Data**: SELLER or BUYER account credentials

---

### E2E-ADM-015: Admin dashboard shows empty state for no activity

- **Type**: Edge Case
- **Priority**: Low
- **Preconditions**: SUPER_ADMIN logged in; no activity log entries exist in the system (fresh setup)
- **User Journey**:
  1. Navigate to `/dashboard/admin`
  2. Observe stats cards show correct user counts
  3. Observe "Recent Activity" section shows empty state: "No recent activity" with subtitle "Activity will appear here as users interact with the platform"
- **Expected Results**:
  - UI: Empty state displayed gracefully; no errors; stats still show correct values
  - API: `GET /api/admin/dashboard` returns 200 with `recentActivity: []`
  - DB: `TL_COMM_USE_ACTV` collection has no documents
- **Verification Method**: snapshot
- **Test Data**: Clean system with no activity logs

---

## Summary

| Type | Count |
|------|-------|
| Happy Path | 11 |
| Alternative Path | 0 |
| Edge Case | 2 |
| Error Path | 2 |
| **Total** | **15** |
