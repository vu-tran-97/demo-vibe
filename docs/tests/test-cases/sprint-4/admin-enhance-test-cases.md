# Admin Enhancement — Test Cases (Sprint 4)

## Unit Tests

### AdminService (Enhancements)

#### TC-ADM-001: Log activity on role change
- **Given**: Admin changes user role from BUYER to SELLER
- **When**: changeRole completes
- **Then**: UserActivity record created with type=ROLE_CHANGE, prevVal=BUYER, newVal=SELLER

#### TC-ADM-002: Log activity on status change
- **Given**: Admin suspends a user (ACTV → SUSP)
- **When**: changeStatus completes
- **Then**: UserActivity record created with type=STTS_CHANGE, prevVal=ACTV, newVal=SUSP

#### TC-ADM-003: Get user activity log paginated
- **Given**: User has 25 activity records
- **When**: getUserActivity with page=1, limit=10
- **Then**: Returns 10 records sorted by actvDt desc, pagination shows total=25

#### TC-ADM-004: Bulk change status — all succeed
- **Given**: 3 valid user IDs, new status = SUSP
- **When**: bulkChangeStatus
- **Then**: All 3 users updated to SUSP, 3 activity logs created

#### TC-ADM-005: Bulk change status — skip SUPER_ADMIN
- **Given**: 3 user IDs including 1 SUPER_ADMIN
- **When**: bulkChangeStatus to SUSP
- **Then**: 2 users suspended, SUPER_ADMIN skipped, partial success reported

#### TC-ADM-006: Bulk change status — skip self
- **Given**: Admin includes own ID in bulk operation
- **When**: bulkChangeStatus
- **Then**: Own ID skipped, others processed

#### TC-ADM-007: Export users as CSV
- **Given**: 10 users in the system
- **When**: exportUsersAsCsv with no filters
- **Then**: Returns CSV string with header + 10 rows, proper escaping for commas in names

#### TC-ADM-008: Export users with role filter
- **Given**: 5 SELLER, 3 BUYER users
- **When**: exportUsersAsCsv with role=SELLER
- **Then**: CSV contains 5 rows (excluding header)

#### TC-ADM-009: Dashboard analytics — total users
- **Given**: 50 active users in the system
- **When**: getDashboard
- **Then**: Returns totalUsers=50

#### TC-ADM-010: Dashboard analytics — new users this week
- **Given**: 5 users registered in the last 7 days
- **When**: getDashboard
- **Then**: Returns newUsersThisWeek=5

#### TC-ADM-011: Dashboard analytics — role distribution
- **Given**: 1 SUPER_ADMIN, 10 SELLER, 39 BUYER
- **When**: getDashboard
- **Then**: roleDistribution = { SUPER_ADMIN: 1, SELLER: 10, BUYER: 39 }

#### TC-ADM-012: Dashboard analytics — recent activity
- **Given**: 20 activity records exist
- **When**: getDashboard
- **Then**: recentActivity contains the 10 most recent entries

#### TC-ADM-013: User summary for buyer
- **Given**: Buyer has placed 5 orders
- **When**: getUserSummary
- **Then**: Returns user details + orderCount=5, productCount=0, totalRevenue=0

#### TC-ADM-014: User summary for seller
- **Given**: Seller has 8 products and $1200 in DELIVERED orders
- **When**: getUserSummary
- **Then**: Returns user details + orderCount=0, productCount=8, totalRevenue=1200

#### TC-ADM-015: User summary for non-existent user
- **Given**: Non-existent user ID
- **When**: getUserSummary
- **Then**: Throws USER_NOT_FOUND (404)

### AdminController (Enhancements)

#### TC-ADM-016: Export endpoint returns CSV headers
- **Given**: Valid SUPER_ADMIN token
- **When**: GET /api/admin/users/export
- **Then**: Response has Content-Type: text/csv and Content-Disposition header

#### TC-ADM-017: Bulk endpoint validates input
- **Given**: Empty userIds array
- **When**: POST /api/admin/users/bulk/status
- **Then**: Returns 400 validation error

#### TC-ADM-018: All endpoints require SUPER_ADMIN role
- **Given**: SELLER auth token
- **When**: Access any /api/admin/* endpoint
- **Then**: Returns 403 Forbidden

## Integration Tests

#### TC-ADM-INT-001: Role change with activity logging
- **Given**: Admin changes user role
- **When**: Get user activity log
- **Then**: Activity record appears with correct details

#### TC-ADM-INT-002: Bulk operation end-to-end
- **Given**: 5 users selected
- **When**: Bulk suspend → Check each user → Check activity logs
- **Then**: All users suspended (except SUPER_ADMIN), all activities logged

#### TC-ADM-INT-003: Dashboard data accuracy
- **Given**: Known set of users, orders, and activities
- **When**: Fetch dashboard
- **Then**: All metrics match expected values

## Edge Cases

#### TC-ADM-EDGE-001: Activity log for user with no activities
- **Given**: User with no activity records
- **When**: getUserActivity
- **Then**: Returns empty array with pagination total=0

#### TC-ADM-EDGE-002: Export with no users matching filter
- **Given**: No users match the filter criteria
- **When**: exportUsersAsCsv
- **Then**: Returns CSV with header row only

#### TC-ADM-EDGE-003: Bulk operation with all invalid IDs
- **Given**: All user IDs are non-existent
- **When**: bulkChangeStatus
- **Then**: Returns result with 0 successes, all failures reported
