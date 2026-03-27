# Admin E2E Test Scenarios — Sprint 10

## Overview
- **Feature**: Admin panel — dashboard statistics, user management (CRUD), role/status management, bulk operations, CSV export, activity log, cross-seller product management
- **Related Modules**: Auth (SUPER_ADMIN role), RBAC, Product
- **API Endpoints**: GET /api/admin/dashboard, POST /api/admin/users, GET /api/admin/users, GET /api/admin/users/export, POST /api/admin/users/bulk/status, GET /api/admin/users/:id, GET /api/admin/users/:id/activity, GET /api/admin/users/:id/summary, PATCH /api/admin/users/:id, PATCH /api/admin/users/:id/role, PATCH /api/admin/users/:id/status
- **Admin Pages**: /dashboard/admin, /dashboard/admin/users
- **DB Tables**: User, ActivityLog
- **Blueprint**: docs/blueprints/003-admin-ui/blueprint.md, docs/blueprints/006-admin-enhance/blueprint.md
- **Production Frontend**: https://demo-vibe-production.up.railway.app
- **Production Backend**: https://demo-vibe-backend-production.up.railway.app

### Test Accounts
| Account | Email | Password | Role |
|---------|-------|----------|------|
| Admin | admin@astratech.vn | Admin@123 | SUPER_ADMIN |
| Seller | seller1000@yopmail.com | Seller1000@123 | SELLER |
| Buyer | (use a newly created buyer from auth tests) | — | BUYER |

---

## Scenario Group 1: Admin Dashboard

### E2E-001: Dashboard displays platform statistics
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as SUPER_ADMIN (admin@astratech.vn)
- **User Journey**:
  1. Navigate to https://demo-vibe-production.up.railway.app/dashboard/admin
  2. Verify dashboard page loads without errors
  3. Verify stat cards display: total users, active users, suspended users, inactive users
  4. Verify numeric values are non-negative integers
- **Expected Results**:
  - API: GET /api/admin/dashboard returns 200 with `{ success: true, data: { totalUsers, activeUsers, ... } }`
  - UI: Dashboard cards render with correct counts, no loading spinners stuck
- **Verification Method**: snapshot / network
- **Test Data**: Pre-seeded users in the system

### E2E-002: Dashboard displays role distribution
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN
- **User Journey**:
  1. Navigate to /dashboard/admin
  2. Verify role distribution section shows breakdown by role (BUYER, SELLER, SUPER_ADMIN)
  3. Verify the sum of role counts equals total users count
- **Expected Results**:
  - API: GET /api/admin/dashboard returns 200 with role distribution data
  - UI: Role distribution chart or table renders correctly
- **Verification Method**: snapshot / network

### E2E-003: Dashboard stats refresh on page reload
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in as SUPER_ADMIN, on dashboard page
- **User Journey**:
  1. Note current total users count
  2. Refresh the page (F5)
  3. Verify stats reload and display updated values
- **Expected Results**:
  - API: GET /api/admin/dashboard called again, returns 200
  - UI: Stats re-render without stale data
- **Verification Method**: network

---

## Scenario Group 2: User List with Filtering, Search, and Pagination

### E2E-004: List all users with pagination
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as SUPER_ADMIN
- **User Journey**:
  1. Navigate to https://demo-vibe-production.up.railway.app/dashboard/admin/users
  2. Verify user table renders with columns: name, email, role, status, created date
  3. Verify pagination controls appear (page numbers or next/prev)
  4. Click next page
  5. Verify table updates with a new set of users
- **Expected Results**:
  - API: GET /api/admin/users?page=1 returns 200, GET /api/admin/users?page=2 returns 200
  - UI: Table rows update, pagination indicator reflects current page
- **Verification Method**: snapshot / network

### E2E-005: Filter users by role
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN, on users page
- **User Journey**:
  1. Select role filter dropdown and choose "SELLER"
  2. Verify table updates to show only SELLER users
  3. Verify all displayed rows have role badge "SELLER"
- **Expected Results**:
  - API: GET /api/admin/users?role=SELLER returns 200
  - UI: Filtered list shows only sellers, pagination resets to page 1
- **Verification Method**: snapshot / network

### E2E-006: Filter users by status
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN, on users page
- **User Journey**:
  1. Select status filter and choose "ACTV" (Active)
  2. Verify table shows only active users
  3. Change filter to "SUSP" (Suspended)
  4. Verify table updates to show only suspended users
- **Expected Results**:
  - API: GET /api/admin/users?status=ACTV returns 200, then GET /api/admin/users?status=SUSP returns 200
  - UI: Status badges on all rows match the selected filter
- **Verification Method**: snapshot / network

### E2E-007: Search users by name or email
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN, on users page
- **User Journey**:
  1. Type "seller1000" in the search input
  2. Wait for debounced search to trigger
  3. Verify table filters to show matching users
  4. Clear search input
  5. Verify full list is restored
- **Expected Results**:
  - API: GET /api/admin/users?search=seller1000 returns 200
  - UI: Table shows only matching rows, result count updates
- **Verification Method**: snapshot / network
- **Test Data**: Search term "seller1000" matches seller1000@yopmail.com

### E2E-008: Combined filter and search
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in as SUPER_ADMIN, on users page
- **User Journey**:
  1. Select role filter "SELLER"
  2. Select status filter "ACTV"
  3. Type partial name in search field
  4. Verify results match all three criteria
- **Expected Results**:
  - API: GET /api/admin/users?role=SELLER&status=ACTV&search=... returns 200
  - UI: Table shows only matching rows
- **Verification Method**: network

### E2E-009: Empty search result
- **Type**: Alternative Path
- **Priority**: Medium
- **Preconditions**: Logged in as SUPER_ADMIN, on users page
- **User Journey**:
  1. Type "nonexistentuserxyz12345" in search input
  2. Wait for results
  3. Verify empty state is displayed
- **Expected Results**:
  - API: GET /api/admin/users?search=nonexistentuserxyz12345 returns 200 with empty data array
  - UI: "No users found" or equivalent empty state message
- **Verification Method**: snapshot / network

---

## Scenario Group 3: Create New User

### E2E-010: Create new user via admin form
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as SUPER_ADMIN, on users page
- **User Journey**:
  1. Click "Create User" button
  2. Fill form: Name = "Admin Created User", Email = "admin-created-s10-{timestamp}@yopmail.com", Role = BUYER
  3. Submit the form
  4. Verify success notification appears
  5. Verify the new user appears in the user list
- **Expected Results**:
  - API: POST /api/admin/users returns 201 with `{ success: true, data: { id, name, email, role } }`
  - DB: New User record created with specified role and status ACTV
  - UI: Success toast, user list refreshes with new user visible
- **Verification Method**: snapshot / network
- **Test Data**: Unique email with timestamp to avoid collisions

### E2E-011: Create user with duplicate email fails
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN, on users page
- **User Journey**:
  1. Click "Create User" button
  2. Fill form with Email = "admin@astratech.vn" (already exists)
  3. Fill other required fields
  4. Submit the form
  5. Verify error message displayed
- **Expected Results**:
  - API: POST /api/admin/users returns 409 or 400 with error message
  - DB: No duplicate record created
  - UI: Error notification "Email already exists" or similar
- **Verification Method**: snapshot / network
- **Test Data**: admin@astratech.vn (pre-existing)

### E2E-012: Create user with invalid email format
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: Logged in as SUPER_ADMIN
- **User Journey**:
  1. Click "Create User" button
  2. Fill Email = "not-an-email"
  3. Fill other required fields
  4. Attempt to submit
  5. Verify validation error
- **Expected Results**:
  - UI: Form validation error on email field, form not submitted
  - API: No request sent (client-side validation) or 400 if server-side
- **Verification Method**: snapshot

---

## Scenario Group 4: User Detail and Activity Log

### E2E-013: View user detail page
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN, on users page
- **User Journey**:
  1. Click on a user row in the table
  2. Verify user detail panel/page loads
  3. Verify displayed fields: name, email, role, status, created date, last login
- **Expected Results**:
  - API: GET /api/admin/users/:id returns 200 with full user object
  - UI: Detail view shows all user fields correctly
- **Verification Method**: snapshot / network

### E2E-014: View user summary statistics
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in as SUPER_ADMIN, viewing a user detail
- **User Journey**:
  1. Navigate to user detail for a known active user
  2. Verify summary section shows: total orders, total spent, account age, last activity
- **Expected Results**:
  - API: GET /api/admin/users/:id/summary returns 200
  - UI: Summary stats render with numeric values
- **Verification Method**: snapshot / network

### E2E-015: View user activity log
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN, viewing user detail
- **User Journey**:
  1. Navigate to user detail
  2. Locate the activity log section
  3. Verify log entries are displayed in reverse chronological order
  4. Verify each entry shows: action type, timestamp, details
- **Expected Results**:
  - API: GET /api/admin/users/:id/activity returns 200 with array of activity entries
  - UI: Activity log list renders with timestamps and action descriptions
- **Verification Method**: snapshot / network

### E2E-016: Activity log is empty for newly created user
- **Type**: Alternative Path
- **Priority**: Low
- **Preconditions**: Logged in as SUPER_ADMIN, newly created user via E2E-010
- **User Journey**:
  1. Navigate to the detail page of the newly created user
  2. Check activity log section
  3. Verify empty state or minimal entries (e.g., "Account created")
- **Expected Results**:
  - API: GET /api/admin/users/:id/activity returns 200 with empty or minimal array
  - UI: Empty state message or single creation entry
- **Verification Method**: snapshot / network

---

## Scenario Group 5: Role Change

### E2E-017: Change user role from BUYER to SELLER
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as SUPER_ADMIN, target user has role BUYER
- **User Journey**:
  1. Navigate to user detail for a BUYER user
  2. Click role change control (dropdown or button)
  3. Select "SELLER"
  4. Confirm the change
  5. Verify role badge updates to SELLER
- **Expected Results**:
  - API: PATCH /api/admin/users/:id/role with `{ role: "SELLER" }` returns 200
  - DB: User.role updated to SELLER
  - UI: Role badge changes from BUYER to SELLER, success notification
- **Verification Method**: snapshot / network

### E2E-018: Change user role from SELLER to BUYER
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN, target user has role SELLER
- **User Journey**:
  1. Navigate to user detail for a SELLER user
  2. Change role to "BUYER"
  3. Confirm
  4. Verify role badge updates to BUYER
- **Expected Results**:
  - API: PATCH /api/admin/users/:id/role with `{ role: "BUYER" }` returns 200
  - DB: User.role updated to BUYER
  - UI: Role badge changes to BUYER
- **Verification Method**: snapshot / network

### E2E-019: Role change reflects in user list
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: After completing E2E-017 or E2E-018
- **User Journey**:
  1. Navigate back to /dashboard/admin/users
  2. Find the user whose role was changed
  3. Verify the role column shows the updated role
- **Expected Results**:
  - API: GET /api/admin/users returns updated role for the user
  - UI: Role badge in table matches the changed role
- **Verification Method**: snapshot / network

### E2E-020: Cannot change own role
- **Type**: Edge Case
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN
- **User Journey**:
  1. Navigate to own user detail (admin@astratech.vn)
  2. Attempt to change own role
  3. Verify the action is disabled or rejected
- **Expected Results**:
  - UI: Role change control disabled, or error message if attempted
  - API: PATCH /api/admin/users/:id/role returns 400/403 if attempted
- **Verification Method**: snapshot / network

---

## Scenario Group 6: Status Change

### E2E-021: Suspend an active user
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as SUPER_ADMIN, target user status is ACTV
- **User Journey**:
  1. Navigate to user detail for an active user
  2. Click status change control
  3. Select "SUSP" (Suspended)
  4. Confirm the action
  5. Verify status badge changes to Suspended
- **Expected Results**:
  - API: PATCH /api/admin/users/:id/status with `{ status: "SUSP" }` returns 200
  - DB: User.status updated to SUSP
  - UI: Status badge changes to "Suspended" with appropriate color
- **Verification Method**: snapshot / network

### E2E-022: Deactivate an active user
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN, target user status is ACTV
- **User Journey**:
  1. Navigate to user detail for an active user
  2. Change status to "INAC" (Inactive)
  3. Confirm
  4. Verify status badge changes to Inactive
- **Expected Results**:
  - API: PATCH /api/admin/users/:id/status with `{ status: "INAC" }` returns 200
  - DB: User.status updated to INAC
  - UI: Status badge changes to "Inactive"
- **Verification Method**: snapshot / network

### E2E-023: Reactivate a suspended user
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN, target user status is SUSP (from E2E-021)
- **User Journey**:
  1. Navigate to user detail for the suspended user
  2. Change status to "ACTV" (Active)
  3. Confirm
  4. Verify status badge changes to Active
- **Expected Results**:
  - API: PATCH /api/admin/users/:id/status with `{ status: "ACTV" }` returns 200
  - DB: User.status updated to ACTV
  - UI: Status badge changes to "Active"
- **Verification Method**: snapshot / network

### E2E-024: Reactivate an inactive user
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in as SUPER_ADMIN, target user status is INAC (from E2E-022)
- **User Journey**:
  1. Navigate to user detail for the inactive user
  2. Change status to "ACTV"
  3. Confirm
  4. Verify status is restored to Active
- **Expected Results**:
  - API: PATCH /api/admin/users/:id/status with `{ status: "ACTV" }` returns 200
  - DB: User.status updated to ACTV
  - UI: Status badge changes to "Active"
- **Verification Method**: snapshot / network

### E2E-025: Cannot suspend own account
- **Type**: Edge Case
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN
- **User Journey**:
  1. Navigate to own user detail
  2. Attempt to change own status to SUSP
  3. Verify the action is disabled or rejected
- **Expected Results**:
  - UI: Status change control disabled for self, or error message displayed
  - API: PATCH /api/admin/users/:id/status returns 400/403 if attempted
- **Verification Method**: snapshot / network

### E2E-026: Status change creates activity log entry
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in as SUPER_ADMIN, after performing a status change
- **User Journey**:
  1. Change a user's status (e.g., ACTV to SUSP)
  2. Navigate to that user's activity log
  3. Verify a new entry exists for the status change with admin actor and timestamp
- **Expected Results**:
  - API: GET /api/admin/users/:id/activity returns entry with action "STATUS_CHANGE"
  - UI: Activity log shows the status change event
- **Verification Method**: network

---

## Scenario Group 7: Bulk Status Operations

### E2E-027: Bulk suspend multiple users
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN, on users page, multiple active users exist
- **User Journey**:
  1. Navigate to /dashboard/admin/users
  2. Select 3 or more users via checkboxes
  3. Click bulk action button
  4. Choose "Suspend" from bulk actions
  5. Confirm the bulk operation
  6. Verify all selected users' status changed to SUSP
- **Expected Results**:
  - API: POST /api/admin/users/bulk/status with `{ userIds: [...], status: "SUSP" }` returns 200/201
  - DB: All selected users' status updated to SUSP
  - UI: Status badges update for all selected rows, success notification with count
- **Verification Method**: snapshot / network

### E2E-028: Bulk activate multiple users
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN, multiple suspended users from E2E-027
- **User Journey**:
  1. Filter users by status "SUSP"
  2. Select multiple suspended users
  3. Choose bulk action "Activate"
  4. Confirm
  5. Verify all selected users reactivated
- **Expected Results**:
  - API: POST /api/admin/users/bulk/status with `{ userIds: [...], status: "ACTV" }` returns 200/201
  - DB: All selected users' status updated to ACTV
  - UI: Status badges update, success notification
- **Verification Method**: snapshot / network

### E2E-029: Bulk action with no users selected
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: Logged in as SUPER_ADMIN, on users page, no checkboxes selected
- **User Journey**:
  1. Without selecting any users, attempt to click bulk action button
  2. Verify button is disabled or shows a warning
- **Expected Results**:
  - UI: Bulk action button disabled or tooltip "Select users first"
  - API: No request sent
- **Verification Method**: snapshot

### E2E-030: Bulk action excludes admin's own account
- **Type**: Edge Case
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN, on users page
- **User Journey**:
  1. Select multiple users including the admin's own account
  2. Choose bulk action "Suspend"
  3. Verify admin's own account is excluded from the operation or an error is returned
- **Expected Results**:
  - UI: Warning that admin's own account cannot be suspended, or own account auto-deselected
  - API: Returns error or processes only the other users
- **Verification Method**: snapshot / network

---

## Scenario Group 8: CSV Export

### E2E-031: Export all users as CSV
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN, on users page
- **User Journey**:
  1. Click "Export CSV" button (no filters applied)
  2. Verify file download initiates
  3. Verify downloaded file has .csv extension
  4. Verify CSV contains headers: name, email, role, status, createdAt
- **Expected Results**:
  - API: GET /api/admin/users/export returns 200 with Content-Type: text/csv
  - UI: Browser triggers file download
- **Verification Method**: network
- **Test Data**: Verify at least the header row and one data row

### E2E-032: Export filtered users as CSV
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in as SUPER_ADMIN, on users page with active role filter
- **User Journey**:
  1. Apply role filter "SELLER"
  2. Click "Export CSV" button
  3. Verify exported CSV contains only SELLER users
- **Expected Results**:
  - API: GET /api/admin/users/export?role=SELLER returns 200 with text/csv
  - UI: Downloaded file contains only filtered results
- **Verification Method**: network

### E2E-033: CSV export with no matching results
- **Type**: Alternative Path
- **Priority**: Low
- **Preconditions**: Logged in as SUPER_ADMIN, filters applied that yield 0 results
- **User Journey**:
  1. Apply filters that produce an empty list (e.g., search for nonexistent user)
  2. Click "Export CSV"
  3. Verify behavior: either empty CSV with headers only, or a message indicating no data
- **Expected Results**:
  - API: GET /api/admin/users/export?search=nonexistent returns 200 with headers-only CSV or appropriate message
  - UI: Download completes or informational message displayed
- **Verification Method**: network

---

## Scenario Group 9: Non-Admin Access Denied

### E2E-034: BUYER cannot access admin dashboard
- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: Logged in as BUYER (non-admin account)
- **User Journey**:
  1. Login as a BUYER account
  2. Navigate to /dashboard/admin
  3. Verify access is denied
- **Expected Results**:
  - UI: Access denied page, redirect to buyer dashboard, or 403 error page
  - API: GET /api/admin/dashboard returns 403
- **Verification Method**: snapshot / network

### E2E-035: SELLER cannot access admin users page
- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: Logged in as SELLER (seller1000@yopmail.com)
- **User Journey**:
  1. Login as seller1000@yopmail.com / Seller1000@123
  2. Navigate to /dashboard/admin/users
  3. Verify access is denied
- **Expected Results**:
  - UI: Access denied or redirect
  - API: GET /api/admin/users returns 403
- **Verification Method**: snapshot / network

### E2E-036: SELLER cannot call admin API directly
- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: Logged in as SELLER, using browser console or API tool
- **User Journey**:
  1. Login as SELLER
  2. Attempt direct API call: PATCH /api/admin/users/:id/role with `{ role: "SUPER_ADMIN" }`
  3. Verify 403 response
- **Expected Results**:
  - API: Returns 403 Forbidden
  - DB: No changes made
- **Verification Method**: network / console

### E2E-037: Unauthenticated user cannot access admin APIs
- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: Not logged in (no auth token)
- **User Journey**:
  1. Open an incognito/private browser window
  2. Navigate to /dashboard/admin
  3. Verify redirect to login page
  4. Attempt direct API call to GET /api/admin/dashboard without Bearer token
- **Expected Results**:
  - UI: Redirect to /auth/login
  - API: Returns 401 Unauthorized
- **Verification Method**: network

---

## Scenario Group 10: Admin Manages Products of Any Seller

### E2E-038: Admin views products from any seller
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN, at least one seller has products
- **User Journey**:
  1. Navigate to admin dashboard or product management section
  2. Verify admin can see products from all sellers, not just their own
  3. Verify product list shows seller name/email alongside each product
- **Expected Results**:
  - API: Product list API returns products across all sellers
  - UI: Product table includes seller identification column
- **Verification Method**: snapshot / network

### E2E-039: Admin edits a seller's product
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN, a seller's product exists
- **User Journey**:
  1. Navigate to a product belonging to seller1000@yopmail.com
  2. Edit product details (e.g., change title or price)
  3. Save changes
  4. Verify product is updated successfully
- **Expected Results**:
  - API: PATCH product endpoint returns 200
  - DB: Product record updated regardless of admin not being the product owner
  - UI: Success notification, updated values displayed
- **Verification Method**: snapshot / network

### E2E-040: Admin deletes a seller's product
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in as SUPER_ADMIN, a seller's product exists
- **User Journey**:
  1. Navigate to a product belonging to another seller
  2. Click delete button
  3. Confirm deletion
  4. Verify product is removed from the list
- **Expected Results**:
  - API: DELETE product endpoint returns 200
  - DB: Product record soft-deleted or removed
  - UI: Product removed from list, success notification
- **Verification Method**: snapshot / network

### E2E-041: Admin changes product status/visibility
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in as SUPER_ADMIN, a seller's product exists
- **User Journey**:
  1. Navigate to a seller's product detail
  2. Toggle product visibility or change status (e.g., active to hidden)
  3. Save
  4. Verify product status updated
- **Expected Results**:
  - API: PATCH product status endpoint returns 200
  - DB: Product status/visibility flag updated
  - UI: Status badge reflects new state
- **Verification Method**: snapshot / network

---

## Scenario Group 11: Update User (Admin Edit)

### E2E-042: Admin updates user profile information
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN, viewing user detail
- **User Journey**:
  1. Navigate to a user's detail page
  2. Click edit button
  3. Change the user's display name
  4. Save changes
  5. Verify updated name is displayed
- **Expected Results**:
  - API: PATCH /api/admin/users/:id with `{ name: "Updated Name" }` returns 200
  - DB: User.name updated
  - UI: User detail shows new name, success notification
- **Verification Method**: snapshot / network

### E2E-043: Admin update with invalid data rejected
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: Logged in as SUPER_ADMIN, viewing user detail
- **User Journey**:
  1. Navigate to user detail edit form
  2. Clear the name field (empty string)
  3. Attempt to save
  4. Verify validation error
- **Expected Results**:
  - UI: Validation error message on name field
  - API: PATCH /api/admin/users/:id returns 400 if submitted
- **Verification Method**: snapshot

---

## Summary

| Type | Count |
|------|-------|
| Happy Path | 29 |
| Alternative Path | 2 |
| Edge Case | 4 |
| Error Path | 8 |
| **Total** | **43** |
