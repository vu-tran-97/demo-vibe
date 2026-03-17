# 006-Admin-Enhance: Admin Dashboard Enhancement Blueprint

> Enhanced admin capabilities — user activity logging, bulk operations, CSV export, dashboard analytics, and enriched user detail with e-commerce summary.

## 1. Overview

### 1.1 Purpose

Extend the existing admin user management module (003-admin-ui) with operational tools that SUPER_ADMIN users need for day-to-day platform management. This includes an audit trail for user actions, bulk status operations for moderation efficiency, data export for reporting, a dashboard with key metrics, and enhanced user detail that surfaces e-commerce context (orders placed, products listed).

### 1.2 Scope

- **Activity Log**: Record and display user activity (role changes, status changes, profile updates, logins) with actor, IP address, and timestamp
- **Bulk Status Change**: Multi-select users in the table and apply suspend/activate in a single operation
- **CSV Export**: Export the current filtered user list as a downloadable CSV file
- **Admin Dashboard**: Landing page at `/dashboard/admin` with user growth chart, role distribution pie chart, and recent activity table
- **Enhanced User Detail**: Show e-commerce summary (order count for buyers, product count for sellers) and an activity log tab in the user detail panel

### 1.3 Out of Scope

- Bulk role change (too risky for batch operation; individual confirmation required)
- Bulk user deletion
- Real-time dashboard updates (polling or WebSocket push)
- Excel export (CSV only for this sprint)
- Activity log for non-admin actions (e.g., product creation, order placement)
- Custom date range filtering on dashboard charts
- Email notifications on bulk actions

### 1.4 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS (existing AdminModule extension) |
| ORM | Prisma (MongoDB Adapter) |
| Frontend | Next.js 15 (App Router, CSS Modules) |
| Charts | Lightweight chart library (recharts or chart.js via react-chartjs-2) |
| CSV | Server-side CSV generation (json2csv or manual serialization) |
| State | React hooks (`useState`, `useCallback`), existing `adminFetch` wrapper |

### 1.5 Dependencies

| Module | Dependency | Reason |
|--------|-----------|--------|
| 001-auth | JWT authentication, `JwtPayload` interface | All endpoints require authentication |
| 002-rbac | `@Roles('SUPER_ADMIN')` guard, `RolesGuard` | All endpoints restricted to SUPER_ADMIN |
| 003-admin-ui | `AdminController`, `AdminService`, `AdminUsersPageClient`, existing components | This blueprint extends the existing admin module |

---

## 2. Architecture

### 2.1 Extension Strategy

This blueprint extends the existing admin module rather than creating a new one. All new endpoints are added to the existing `AdminController` and `AdminService`. A new `UserActivityLog` Prisma model is added for the audit trail.

```
Existing (003-admin-ui)              New (006-admin-enhance)
─────────────────────────            ────────────────────────
AdminController                      + GET  /api/admin/users/:id/activity
  POST   /api/admin/users            + POST /api/admin/users/bulk/status
  GET    /api/admin/users            + GET  /api/admin/users/export
  GET    /api/admin/users/:id        + GET  /api/admin/dashboard
  PATCH  /api/admin/users/:id/role   + GET  /api/admin/users/:id/summary
  PATCH  /api/admin/users/:id/status

AdminService                         + getActivityLog()
  createUser()                       + bulkChangeStatus()
  listUsers()                        + exportUsers()
  getUserById()                      + getDashboardAnalytics()
  changeRole()    → add logging      + getUserSummary()
  changeStatus()  → add logging      + logActivity() (private)
```

### 2.2 Activity Logging Integration

The existing `changeRole()` and `changeStatus()` methods in `AdminService` will be updated to call `logActivity()` after successful mutations. The `logActivity()` method writes to the new `TL_COMM_USE_ACTV` collection.

```
Admin Action → AdminService.changeRole()
    → Prisma update user
    → logActivity({ userId, type: 'ROLE_CHANGE', oldValue, newValue, performedBy, ipAddress })
    → Return updated user
```

### 2.3 New DB Collection

#### TL_COMM_USE_ACTV (User Activity Log)

| Field | Type | Required | Constraint | Description |
|-------|------|----------|-----------|-------------|
| _id | ObjectId | PK | | Activity log ID |
| USE_ID | ObjectId | FK | ref: TB_COMM_USER | Target user ID |
| ACTV_TYPE_CD | String | Y | enum: ROLE_CHANGE/STTS_CHANGE/PRFL_UPDATE/LGN | Activity type code |
| OLD_VAL | String | N | max 200 | Previous value |
| NEW_VAL | String | N | max 200 | New value |
| PRFM_BY_ID | ObjectId | FK | ref: TB_COMM_USER | Admin who performed the action |
| CLNT_IP_ADDR | String | Y | max 45 | Client IP address |
| RGST_DT | DateTime | Y | default: `now()` | Activity timestamp |
| RGTR_ID | String | N | | Created by |

> No DEL_YN field (log table with TL_ prefix cannot be deleted per project convention).
> TTL Index: `RGST_DT` (auto-delete after 365 days for log retention).

#### Prisma Model

```prisma
model UserActivityLog {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  userId      String   @map("USE_ID") @db.ObjectId
  actvTypeCd  String   @map("ACTV_TYPE_CD")
  oldVal      String?  @map("OLD_VAL")
  newVal      String?  @map("NEW_VAL")
  prfmById    String   @map("PRFM_BY_ID") @db.ObjectId
  clntIpAddr  String   @map("CLNT_IP_ADDR")
  rgstDt      DateTime @default(now()) @map("RGST_DT")
  rgtrId      String?  @map("RGTR_ID")

  user        User     @relation("ActivityTarget", fields: [userId], references: [id])
  performer   User     @relation("ActivityPerformer", fields: [prfmById], references: [id])

  // No DEL_YN — logs cannot be deleted
  @@map("TL_COMM_USE_ACTV")
}
```

> The `User` model needs two new relation fields: `activityLogs UserActivityLog[] @relation("ActivityTarget")` and `performedActivities UserActivityLog[] @relation("ActivityPerformer")`.

#### Code Group Addition

Add to `USE_ACTV_TYPE` code group (already defined in database-design.md):

| CD_VAL | CD_NM |
|--------|-------|
| `ROLE_CHANGE` | Role Change |
| `STTS_CHANGE` | Status Change |
| `PRFL_UPDATE` | Profile Update |
| `LGN` | Login |

#### Index Strategy

| Collection | Field(s) | Type | Purpose |
|-----------|----------|------|---------|
| TL_COMM_USE_ACTV | USE_ID + RGST_DT(desc) | Compound | User activity listing (paginated) |
| TL_COMM_USE_ACTV | RGST_DT | TTL (365 days) | Auto-delete old logs |
| TL_COMM_USE_ACTV | PRFM_BY_ID | Single | Admin activity audit |
| TL_COMM_USE_ACTV | ACTV_TYPE_CD | Single | Filter by activity type |

---

## 3. API Endpoints

### 3.1 GET /api/admin/users/:id/activity

Retrieve paginated activity log entries for a specific user.

**Request:**

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| id | path | string | Y | Target user ID |
| page | query | number | N | Page number (default: 1) |
| limit | query | number | N | Items per page (default: 20, max: 100) |
| type | query | string | N | Filter by activity type (ROLE_CHANGE, STTS_CHANGE, PRFL_UPDATE, LGN) |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "665a...",
        "userId": "664b...",
        "activityType": "ROLE_CHANGE",
        "oldValue": "BUYER",
        "newValue": "SELLER",
        "performedBy": {
          "id": "664a...",
          "name": "Admin User",
          "email": "admin@example.com"
        },
        "ipAddress": "192.168.1.1",
        "createdAt": "2026-03-17T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

**Error Responses:**

| Status | Code | Message |
|--------|------|---------|
| 404 | USER_NOT_FOUND | User not found |
| 400 | INVALID_ACTIVITY_TYPE | Invalid activity type filter |

---

### 3.2 POST /api/admin/users/bulk/status

Change the status of multiple users in a single operation.

**Request Body:**

```json
{
  "userIds": ["664b...", "664c...", "664d..."],
  "status": "SUSP",
  "reason": "Violation of terms of service"
}
```

| Field | Type | Required | Constraint | Description |
|-------|------|----------|-----------|-------------|
| userIds | string[] | Y | min: 1, max: 50 | Array of user IDs to update |
| status | string | Y | enum: ACTV, SUSP | Target status |
| reason | string | N | max: 500 | Reason for status change (logged in activity) |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "updated": 3,
    "skipped": 1,
    "errors": [
      {
        "userId": "664e...",
        "code": "CANNOT_SUSPEND_SUPER_ADMIN",
        "message": "Cannot change the status of a SUPER_ADMIN"
      }
    ]
  }
}
```

**Business Rules:**
- SUPER_ADMIN users are always skipped (never bulk-modified)
- The requesting admin's own account is always skipped
- Each successful status change generates an activity log entry
- Maximum 50 users per request to prevent timeout
- Users already in the target status are skipped (counted in `skipped`)

**Error Responses:**

| Status | Code | Message |
|--------|------|---------|
| 400 | EMPTY_USER_IDS | At least one user ID is required |
| 400 | TOO_MANY_USER_IDS | Maximum 50 users per bulk operation |
| 400 | INVALID_STATUS | Invalid status value |

---

### 3.3 GET /api/admin/users/export

Export the current filtered user list as a CSV file. Applies the same filters as the list endpoint.

**Request:**

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| search | query | string | N | Search term (email, name, nickname) |
| role | query | string | N | Filter by role |
| status | query | string | N | Filter by status |

**Response (200):**

- Content-Type: `text/csv; charset=utf-8`
- Content-Disposition: `attachment; filename="users-export-2026-03-17.csv"`
- Body: CSV with UTF-8 BOM for Excel compatibility

**CSV Columns:**

| Column | Source Field | Format |
|--------|-------------|--------|
| ID | id | Raw ObjectId string |
| Email | userEmail | Raw string |
| Name | userNm | Raw string |
| Nickname | userNcnm | Raw string or empty |
| Role | useRoleCd | SUPER_ADMIN / SELLER / BUYER |
| Status | userSttsCd | ACTV / SUSP / INAC |
| Email Verified | emailVrfcYn | Yes / No |
| Registered At | rgstDt | YYYY-MM-DD HH:mm:ss |
| Last Login At | lstLgnDt | YYYY-MM-DD HH:mm:ss or empty |

**Business Rules:**
- Maximum 10,000 rows per export (to prevent memory exhaustion)
- Streams response rather than buffering entire dataset
- Applies the same `delYn: 'N'` filter as the list endpoint
- File name includes the current date

**Error Responses:**

| Status | Code | Message |
|--------|------|---------|
| 400 | EXPORT_TOO_LARGE | Export exceeds 10,000 rows. Apply filters to reduce the result set. |

---

### 3.4 GET /api/admin/dashboard

Retrieve dashboard analytics data for the admin overview page.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "totalUsers": 1250,
    "newUsersThisWeek": 23,
    "newUsersLastWeek": 18,
    "activeUsers": 1100,
    "suspendedUsers": 45,
    "roleDistribution": {
      "SUPER_ADMIN": 3,
      "SELLER": 247,
      "BUYER": 1000
    },
    "userGrowth": [
      { "date": "2026-03-11", "count": 3 },
      { "date": "2026-03-12", "count": 5 },
      { "date": "2026-03-13", "count": 2 },
      { "date": "2026-03-14", "count": 8 },
      { "date": "2026-03-15", "count": 1 },
      { "date": "2026-03-16", "count": 2 },
      { "date": "2026-03-17", "count": 2 }
    ],
    "recentActivity": [
      {
        "id": "665a...",
        "activityType": "ROLE_CHANGE",
        "targetUser": { "id": "664b...", "name": "John Doe", "email": "john@example.com" },
        "performedBy": { "id": "664a...", "name": "Admin" },
        "oldValue": "BUYER",
        "newValue": "SELLER",
        "createdAt": "2026-03-17T10:30:00Z"
      }
    ],
    "loginActivityToday": 87,
    "loginActivityThisWeek": 542
  }
}
```

**Data Sources:**
- `totalUsers`, `activeUsers`, `suspendedUsers`: `prisma.user.count()` with status filters (`delYn: 'N'`)
- `newUsersThisWeek/LastWeek`: `prisma.user.count()` with `rgstDt` range filter
- `roleDistribution`: `prisma.user.groupBy({ by: ['useRoleCd'] })`
- `userGrowth`: `prisma.user.groupBy()` aggregated by day for the last 7 days (or 30 days if extended)
- `recentActivity`: Last 10 entries from `TL_COMM_USE_ACTV` with performer and target user joined
- `loginActivityToday/ThisWeek`: `prisma.loginLog.count()` with date filter and `lgnRsltCd: 'SUCC'`

**Performance Notes:**
- All counts run in parallel via `Promise.all()`
- Dashboard data can be cached for 60 seconds (optional, for high-traffic deployments)

---

### 3.5 GET /api/admin/users/:id/summary

Enhanced user detail with e-commerce context. Returns the base user data plus order count and product count.

**Request:**

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| id | path | string | Y | Target user ID |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "664b...",
    "email": "john@example.com",
    "name": "John Doe",
    "nickname": "johndoe",
    "role": "SELLER",
    "status": "ACTV",
    "emailVerified": true,
    "profileImageUrl": null,
    "lastLoginAt": "2026-03-16T14:22:00Z",
    "createdAt": "2026-01-15T09:00:00Z",
    "ecommerceSummary": {
      "productCount": 12,
      "activeProductCount": 8,
      "totalSoldCount": 156,
      "orderCount": 0,
      "totalPostCount": 5,
      "totalCommentCount": 23
    },
    "recentActivity": [
      {
        "activityType": "ROLE_CHANGE",
        "oldValue": "BUYER",
        "newValue": "SELLER",
        "performedBy": { "id": "664a...", "name": "Admin" },
        "createdAt": "2026-02-01T10:00:00Z"
      }
    ]
  }
}
```

**E-commerce Summary Fields:**

| Field | Source | Applicable Roles |
|-------|--------|-----------------|
| productCount | `prisma.product.count({ where: { sellerId, delYn: 'N' } })` | SELLER |
| activeProductCount | `prisma.product.count({ where: { sellerId, prdSttsCd: 'ACTV', delYn: 'N' } })` | SELLER |
| totalSoldCount | `prisma.product.aggregate({ _sum: { soldCnt } })` | SELLER |
| orderCount | Future — returns 0 until order module is built | BUYER |
| totalPostCount | `prisma.boardPost.count({ where: { userId, delYn: 'N' } })` | ALL |
| totalCommentCount | `prisma.boardComment.count({ where: { userId, delYn: 'N' } })` | ALL |

**Error Responses:**

| Status | Code | Message |
|--------|------|---------|
| 404 | USER_NOT_FOUND | User not found |

---

## 4. Component Design

### 4.1 Updated Component Tree

```
app/dashboard/admin/
├── page.tsx (NEW — Admin Dashboard page)
├── loading.tsx (NEW — Dashboard loading skeleton)
└── users/
    └── page.tsx (existing)

AdminUsersPageClient (ENHANCED)
├── BulkActionBar (NEW — appears when rows selected)
│   ├── SelectionCount
│   ├── BulkSuspendButton
│   ├── BulkActivateButton
│   └── ClearSelectionButton
├── ExportButton (NEW — CSV download trigger)
├── AdminUserFilters (existing)
├── AdminUserTable (ENHANCED — checkbox column, selectable rows)
│   └── AdminUserRow (ENHANCED — checkbox, selected state)
├── Pagination (existing)
├── AdminCreateUserModal (existing)
├── ConfirmActionModal (existing)
└── UserDetailPanel (ENHANCED — tabs: Details | Activity | E-commerce)
    ├── UserDetailsTab (existing detail content)
    ├── UserActivityTab (NEW)
    │   ├── ActivityLogList
    │   │   └── ActivityLogItem (type icon, description, timestamp, performer)
    │   └── Pagination (reused)
    └── UserEcommerceSummaryTab (NEW)
        ├── SummaryStatCards (product count, sold count, post count, etc.)
        └── (future: recent orders table for buyers)

AdminDashboardPage (NEW)
├── StatCards (total users, new this week, active, suspended)
├── UserGrowthChart (line chart — last 7 days)
├── RoleDistributionChart (pie/donut chart)
├── RecentActivityTable (last 10 admin actions)
└── QuickLinks (Users, Export, etc.)
```

### 4.2 Component Specifications

#### BulkActionBar

| Property | Detail |
|----------|--------|
| Props | `selectedCount: number`, `onBulkSuspend()`, `onBulkActivate()`, `onClearSelection()` |
| Visibility | Appears at the top of the table card when `selectedCount > 0` |
| Layout | Horizontal bar: "[N] users selected" + action buttons + "Clear" link |
| Animation | Slides down from above the table with `--transition-fast` (150ms) |
| Style | Background `--color-primary-50`, border `--color-primary-200`, rounded `--radius-md` |

#### ExportButton

| Property | Detail |
|----------|--------|
| Props | `filters: UserListParams` |
| Behavior | Triggers `GET /api/admin/users/export` with current filter params |
| Download | Creates a hidden `<a>` element with blob URL, triggers click |
| Loading | Shows spinner icon while download is in progress |
| Placement | Next to the "+ New User" button in the page header |
| Style | Secondary button style (outline variant) |

#### AdminUserTable (Enhanced)

| Property | Detail |
|----------|--------|
| New Props | `selectable: boolean`, `selectedIds: Set<string>`, `onSelectionChange(ids: Set<string>)` |
| Header Checkbox | "Select all on this page" — toggles all visible rows |
| Row Checkbox | Individual row selection, does not trigger detail panel open |
| Selected Style | Row background `--color-primary-50`, left border 3px `--color-primary-500` |
| Click Behavior | Checkbox click = toggle selection; row click (non-checkbox area) = open detail panel |

#### UserDetailPanel (Enhanced — Tabbed)

| Property | Detail |
|----------|--------|
| Tabs | `Details` (default), `Activity`, `Summary` |
| Tab Style | Underline tabs at the top of the panel, active tab has `--color-primary-500` underline |
| Data Fetching | `Details` tab = existing `getUserById`, `Activity` tab = `getActivityLog`, `Summary` tab = `getUserSummary` |
| Lazy Loading | Activity and Summary tabs fetch data only when selected (not on panel open) |

#### UserActivityTab

| Property | Detail |
|----------|--------|
| Props | `userId: string` |
| Layout | Vertical timeline-style list with type-specific icons |
| Icons | ROLE_CHANGE = shield icon, STTS_CHANGE = toggle icon, PRFL_UPDATE = user-edit icon, LGN = log-in icon |
| Each Item | Type label + description ("Role changed from BUYER to SELLER") + performer name + relative time |
| Pagination | "Load more" button at the bottom (append mode, not page replace) |
| Empty State | "No activity recorded for this user" |

#### UserEcommerceSummaryTab

| Property | Detail |
|----------|--------|
| Props | `userId: string`, `userRole: string` |
| Layout | Grid of stat cards (2 columns on desktop, 1 column on mobile) |
| Seller Cards | Total Products, Active Products, Total Items Sold |
| Buyer Cards | Total Orders (placeholder: "Coming soon" until order module) |
| Common Cards | Total Posts, Total Comments |
| Card Style | Icon + label + large number, background `--color-surface`, border `--color-border` |

#### AdminDashboardPage

| Property | Detail |
|----------|--------|
| Route | `/dashboard/admin` |
| Layout | 4 stat cards (top row) + 2 charts (middle row) + activity table (bottom) |
| Data | Fetched via `GET /api/admin/dashboard` on mount |
| Refresh | Manual refresh button (no auto-refresh) |

#### StatCards (Dashboard)

| Card | Value | Icon | Color |
|------|-------|------|-------|
| Total Users | `totalUsers` | Users icon | `--color-primary-500` |
| New This Week | `newUsersThisWeek` (with +/- change from last week) | TrendingUp icon | `--color-success` |
| Active Users | `activeUsers` | CheckCircle icon | `--color-success` |
| Suspended Users | `suspendedUsers` | XCircle icon | `--color-error` |

#### UserGrowthChart

| Property | Detail |
|----------|--------|
| Type | Line chart |
| X-axis | Last 7 days (date labels) |
| Y-axis | New user count |
| Style | Line color `--color-primary-500`, fill gradient `--color-primary-100` to transparent |
| Size | Half-width on desktop, full-width on mobile |

#### RoleDistributionChart

| Property | Detail |
|----------|--------|
| Type | Donut chart |
| Segments | SUPER_ADMIN (purple), SELLER (blue), BUYER (green) — matches existing badge colors |
| Center | Total user count displayed in center |
| Legend | Below chart with color dot + label + count |
| Size | Half-width on desktop, full-width on mobile |

#### RecentActivityTable

| Property | Detail |
|----------|--------|
| Columns | Activity Type (badge), Target User, Performed By, Timestamp |
| Rows | Last 10 activity log entries |
| Style | Compact table, matches existing admin table design |
| Click | Row click navigates to the target user's detail panel on the users page |

---

## 5. Data Flow

### 5.1 Activity Logging (Automatic)

```
Admin changes user role/status
    → AdminService.changeRole() / changeStatus()
    → Prisma update user record
    → logActivity({
        userId: targetUserId,
        type: 'ROLE_CHANGE' | 'STTS_CHANGE',
        oldValue: previousValue,
        newValue: newValue,
        performedBy: adminId,
        ipAddress: req.ip
      })
    → Prisma create UserActivityLog document
    → Return updated user (logging is fire-and-forget; failure does not block response)
```

### 5.2 Bulk Status Change

```
Admin selects multiple users → clicks "Bulk Suspend"
    → ConfirmActionModal opens:
        "Suspend N users? SUPER_ADMIN accounts will be skipped."
    → Admin confirms
    → POST /api/admin/users/bulk/status { userIds, status: 'SUSP', reason }
    → Backend: for each userId (filtered, excluding SUPER_ADMIN and self):
        → Update user status
        → Log activity
    → Response: { updated: N, skipped: M, errors: [...] }
    → Frontend: clear selection, refresh user list, show toast with summary
```

### 5.3 CSV Export

```
Admin clicks "Export CSV" button
    → Build query params from current filters (search, role, status)
    → GET /api/admin/users/export?search=...&role=...&status=...
    → Backend: query users with filters (max 10,000)
    → Stream CSV rows with UTF-8 BOM header
    → Frontend: receive blob → create Object URL → trigger download → revoke URL
```

### 5.4 Dashboard Load

```
Admin navigates to /dashboard/admin
    → AdminDashboardPage mounts
    → GET /api/admin/dashboard
    → Backend runs in parallel:
        Promise.all([
          prisma.user.count({ where: { delYn: 'N' } }),
          prisma.user.count({ where: { delYn: 'N', rgstDt: { gte: startOfWeek } } }),
          prisma.user.count({ where: { delYn: 'N', rgstDt: { gte: startOfLastWeek, lt: startOfWeek } } }),
          prisma.user.count({ where: { delYn: 'N', userSttsCd: 'ACTV' } }),
          prisma.user.count({ where: { delYn: 'N', userSttsCd: 'SUSP' } }),
          prisma.user.groupBy({ by: ['useRoleCd'], where: { delYn: 'N' }, _count: true }),
          // user growth by day (last 7 days)
          prisma.user.groupBy({ by: ['rgstDt_day'], ... }),
          prisma.userActivityLog.findMany({ take: 10, orderBy: { rgstDt: 'desc' }, include: { user, performer } }),
          prisma.loginLog.count({ where: { lgnDt: { gte: startOfToday }, lgnRsltCd: 'SUCC' } }),
          prisma.loginLog.count({ where: { lgnDt: { gte: startOfWeek }, lgnRsltCd: 'SUCC' } }),
        ])
    → Assemble response object
    → Frontend renders stat cards, charts, and activity table
```

### 5.5 Enhanced User Detail

```
Admin clicks user row → UserDetailPanel opens
    → Tab: "Details" (default) — existing getUserById flow
    → Admin clicks "Activity" tab
        → GET /api/admin/users/:id/activity?page=1&limit=20
        → Render timeline list
        → "Load more" appends next page
    → Admin clicks "Summary" tab
        → GET /api/admin/users/:id/summary
        → Render stat cards with e-commerce data
```

---

## 6. UI/UX Design

### 6.1 Admin Dashboard Page (`/dashboard/admin`)

**Desktop Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Sidebar (240px)  │  Admin Dashboard                   [Refresh]│
│                   │                                              │
│  Dashboard        │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  ...              │  │Total Users│ │New (Week)│ │ Active   │ │Suspended │
│  ─────────        │  │  1,250   │ │  +23     │ │  1,100   │ │    45    │
│  Admin            │  │          │ │ +27.8%   │ │          │ │          │
│    Dashboard ◀    │  └──────────┘ └──────────┘ └──────────┘ └──────────┘
│    Users          │                                              │
│                   │  ┌─────────────────────┐ ┌─────────────────┐│
│                   │  │  User Growth (7d)   │ │ Role Distrib.   ││
│                   │  │  ╱‾‾╲               │ │   ┌───┐         ││
│                   │  │ ╱    ╲_╱‾╲          │ │  ╱BUYER╲        ││
│                   │  │╱          ╲_        │ │ ╱  80%  ╲       ││
│                   │  │  Mon-Sun           │ │ SELLER 20%      ││
│                   │  └─────────────────────┘ └─────────────────┘│
│                   │                                              │
│                   │  Recent Activity                             │
│                   │  ┌──────┬──────────┬──────────┬──────────┐  │
│                   │  │Type  │Target    │By        │Time      │  │
│                   │  ├──────┼──────────┼──────────┼──────────┤  │
│                   │  │ROLE  │John Doe  │Admin     │2 min ago │  │
│                   │  │STTS  │Jane Smith│Admin     │1 hour ago│  │
│                   │  └──────┴──────────┴──────────┴──────────┘  │
└───────────────────┴──────────────────────────────────────────────┘
```

### 6.2 Bulk Selection UI

**Table with Selection Mode:**

```
┌──────────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────────────┐  │
│  │ ☑ 3 users selected   [Suspend]  [Activate]  ✕ Clear  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───┬──────┬───────────┬──────┬──────┬──────┬────────────┐ │
│  │ ☐ │ Name │ Email     │ Role │Status│ Date │  Actions   │ │
│  ├───┼──────┼───────────┼──────┼──────┼──────┼────────────┤ │
│  │ ☑ │ John │ john@...  │BUYER │ ACTV │03/10 │    ...     │ │
│  │ ☑ │ Jane │ jane@...  │SELLER│ ACTV │03/08 │    ...     │ │
│  │ ☐ │ Bob  │ bob@...   │BUYER │ SUSP │03/05 │    ...     │ │
│  │ ☑ │ Alice│ alice@... │SELLER│ ACTV │03/01 │    ...     │ │
│  └───┴──────┴───────────┴──────┴──────┴──────┴────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### 6.3 Export Button Placement

```
┌──────────────────────────────────────────────────────────┐
│  User Management                                          │
│  Manage all platform users, roles, and account statuses   │
│                                    [⬇ Export]  [+ New User] │
└──────────────────────────────────────────────────────────┘
```

### 6.4 Enhanced User Detail Panel (Tabbed)

```
┌──────────────────────────────────┐
│  ✕  User Detail                  │
├──────────────────────────────────┤
│  [Details]  [Activity]  [Summary]│
│  ─────────                       │
│                                  │
│  (Activity tab selected)         │
│                                  │
│  ● Role Change          2 min ago│
│    BUYER → SELLER                │
│    by Admin User                 │
│                                  │
│  ● Status Change       1 day ago │
│    SUSP → ACTV                   │
│    by Admin User                 │
│                                  │
│  ● Login              3 days ago │
│    Successful login              │
│    IP: 192.168.1.100             │
│                                  │
│  [Load more...]                  │
└──────────────────────────────────┘
```

```
┌──────────────────────────────────┐
│  ✕  User Detail                  │
├──────────────────────────────────┤
│  [Details]  [Activity]  [Summary]│
│                          ─────── │
│                                  │
│  (Summary tab — SELLER)          │
│                                  │
│  ┌──────────────┐ ┌────────────┐│
│  │ 📦 Products  │ │ ✅ Active  ││
│  │    12        │ │    8       ││
│  └──────────────┘ └────────────┘│
│  ┌──────────────┐ ┌────────────┐│
│  │ 🛒 Sold      │ │ 📝 Posts   ││
│  │    156       │ │    5       ││
│  └──────────────┘ └────────────┘│
│  ┌──────────────┐               │
│  │ 💬 Comments  │               │
│  │    23        │               │
│  └──────────────┘               │
└──────────────────────────────────┘
```

### 6.5 Design Token Usage (New Components)

| Element | Token |
|---------|-------|
| BulkActionBar bg | `--color-primary-50` |
| BulkActionBar border | `--color-primary-200` |
| BulkActionBar text | `--color-primary-700` |
| Selection checkbox accent | `--color-primary-500` |
| Selected row bg | `--color-primary-50` |
| Selected row left border | 3px `--color-primary-500` |
| Stat card bg | `--color-background` (#fff) |
| Stat card border | `--color-border` |
| Stat card value | `--font-size-2xl`, `--font-weight-bold` |
| Stat card label | `--font-size-sm`, `--color-gray-500` |
| Chart line color | `--color-primary-500` |
| Chart fill | `--color-primary-100` → transparent gradient |
| Tab underline (active) | `--color-primary-500`, 2px |
| Tab text (active) | `--color-primary-700`, `--font-weight-semibold` |
| Tab text (inactive) | `--color-gray-500` |
| Activity icon (ROLE) | `--color-secondary-500` (purple) |
| Activity icon (STTS) | `--color-warning` (yellow) |
| Activity icon (LGN) | `--color-success` (green) |
| Timeline connector | 1px `--color-gray-200` |
| Export button | Secondary style (outline `--color-gray-300`, text `--color-gray-700`) |

### 6.6 Responsive Behavior

| Component | Desktop (1024px+) | Tablet (768-1023px) | Mobile (~767px) |
|-----------|-------------------|---------------------|-----------------|
| Dashboard stat cards | 4 columns | 2 columns | 1 column (stacked) |
| Charts | 2 columns side by side | 2 columns | 1 column (stacked) |
| Recent activity table | Full table | Full table | Card layout |
| Bulk action bar | Full width above table | Full width | Full width, buttons stack |
| Export button | Next to "+ New User" | Next to "+ New User" | Icon-only button |
| User detail tabs | Horizontal | Horizontal | Horizontal (scrollable) |
| Summary stat cards | 2 columns | 2 columns | 1 column |

---

## 7. Security

### 7.1 Authorization

| Measure | Implementation |
|---------|---------------|
| All new endpoints | `@Roles('SUPER_ADMIN')` decorator on controller class (inherited) |
| Bulk operation guard | Backend skips SUPER_ADMIN targets and self-targeting |
| Export rate limiting | Maximum 1 export request per 10 seconds per admin (prevent abuse) |
| Dashboard access | Same admin layout guard as users page |

### 7.2 Data Protection

| Measure | Implementation |
|---------|---------------|
| CSV content | No password hashes, no tokens, no sensitive fields in export |
| IP address logging | Stored for audit purposes; displayed only to SUPER_ADMIN |
| Activity log immutability | No update/delete endpoints for activity logs |
| Bulk operation limit | Maximum 50 users per request to prevent DoS |

### 7.3 Input Validation

| Field | DTO Validation | Description |
|-------|---------------|-------------|
| userIds (bulk) | `@IsArray()`, `@ArrayMinSize(1)`, `@ArrayMaxSize(50)`, `@IsString({ each: true })` | Array of valid user IDs |
| status (bulk) | `@IsIn(['ACTV', 'SUSP'])` | Only ACTV and SUSP allowed |
| reason (bulk) | `@IsOptional()`, `@IsString()`, `@MaxLength(500)` | Optional reason text |
| type (activity filter) | `@IsOptional()`, `@IsIn(['ROLE_CHANGE', 'STTS_CHANGE', 'PRFL_UPDATE', 'LGN'])` | Activity type enum |
| page/limit | `@IsOptional()`, `@IsNumberString()` | Pagination params |

### 7.4 IP Address Extraction

```typescript
// Use X-Forwarded-For header (reverse proxy) or req.ip (direct connection)
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || 'unknown';
}
```

---

## 8. Error Handling

### 8.1 API Error Responses

| Endpoint | Error | Status | Code | Message |
|----------|-------|--------|------|---------|
| Activity log | User not found | 404 | USER_NOT_FOUND | User not found |
| Activity log | Invalid type filter | 400 | INVALID_ACTIVITY_TYPE | Invalid activity type |
| Bulk status | Empty array | 400 | EMPTY_USER_IDS | At least one user ID required |
| Bulk status | Too many IDs | 400 | TOO_MANY_USER_IDS | Maximum 50 users per bulk operation |
| Bulk status | Invalid status | 400 | INVALID_STATUS | Status must be ACTV or SUSP |
| Export | Too many rows | 400 | EXPORT_TOO_LARGE | Result set exceeds 10,000 rows |
| User summary | User not found | 404 | USER_NOT_FOUND | User not found |
| Dashboard | Internal error | 500 | DASHBOARD_ERROR | Failed to load dashboard data |

### 8.2 Bulk Operation Partial Failure

The bulk status change endpoint uses a "best effort" approach:
- Each user update is processed independently
- Failures for individual users are collected in the `errors` array
- The response always returns 200 with a summary of results
- The frontend displays a toast: "Updated N users. M skipped. K failed."

### 8.3 Frontend Error Display

| Scenario | Display |
|----------|---------|
| Activity log load failure | "Failed to load activity log" + retry button inside the tab |
| Bulk operation partial success | Toast with summary: "3 updated, 1 skipped (SUPER_ADMIN)" |
| Bulk operation complete failure | Toast error: "Bulk operation failed: {reason}" |
| Export failure (too large) | Toast: "Too many users to export. Please apply filters." |
| Export failure (network) | Toast: "Export failed. Please try again." |
| Dashboard load failure | Error state with retry button on the dashboard page |
| User summary load failure | "Failed to load summary" + retry button inside the tab |

### 8.4 Loading States

| Component | Loading Indicator |
|-----------|------------------|
| Dashboard page (initial) | Skeleton stat cards + skeleton charts + skeleton table |
| Activity tab | Skeleton timeline items (5 items) |
| Summary tab | Skeleton stat cards (4 cards) |
| Bulk action processing | BulkActionBar buttons disabled + spinner, table overlay with opacity 0.6 |
| CSV export | Export button shows spinner icon, disabled until download completes |

---

## 9. File Structure

### 9.1 Backend (New/Modified Files)

```
server/src/admin/
├── admin.controller.ts              # MODIFIED — add 5 new endpoint methods
├── admin.service.ts                 # MODIFIED — add 6 new methods + logging in existing methods
├── admin.module.ts                  # EXISTING (no changes needed)
├── dto/
│   ├── create-user.dto.ts           # EXISTING
│   ├── update-role.dto.ts           # EXISTING
│   ├── update-status.dto.ts         # EXISTING
│   ├── list-users-query.dto.ts      # EXISTING
│   ├── bulk-status.dto.ts           # NEW — bulk status change validation
│   └── activity-query.dto.ts        # NEW — activity log query validation
└── interfaces/
    └── dashboard.interface.ts       # NEW — dashboard response types

prisma/
└── schema.prisma                    # MODIFIED — add UserActivityLog model + User relations
```

### 9.2 Frontend (New/Modified Files)

```
src/
├── app/
│   └── dashboard/
│       └── admin/
│           ├── page.tsx                    # NEW — Admin Dashboard page
│           ├── loading.tsx                 # NEW — Dashboard loading skeleton
│           └── users/
│               └── page.tsx                # EXISTING (no changes)
├── components/
│   └── admin/
│       ├── AdminUsersPageClient.tsx        # MODIFIED — add bulk selection + export
│       ├── AdminUserTable.tsx              # MODIFIED — add checkbox column
│       ├── AdminUserFilters.tsx            # EXISTING (no changes)
│       ├── AdminCreateUserModal.tsx        # EXISTING (no changes)
│       ├── ConfirmActionModal.tsx          # EXISTING (no changes)
│       ├── Pagination.tsx                  # EXISTING (no changes)
│       ├── RoleBadge.tsx                   # EXISTING (no changes)
│       ├── StatusBadge.tsx                 # EXISTING (no changes)
│       ├── BulkActionBar.tsx              # NEW — bulk action controls
│       ├── ExportButton.tsx               # NEW — CSV export trigger
│       ├── UserDetailPanel.tsx            # NEW — tabbed user detail (replaces inline detail)
│       ├── UserActivityTab.tsx            # NEW — activity timeline
│       ├── UserEcommerceSummaryTab.tsx    # NEW — e-commerce stats
│       ├── AdminDashboardClient.tsx       # NEW — dashboard page client component
│       ├── StatCard.tsx                   # NEW — reusable stat card
│       ├── UserGrowthChart.tsx            # NEW — line chart
│       ├── RoleDistributionChart.tsx      # NEW — donut chart
│       ├── RecentActivityTable.tsx        # NEW — recent admin activity
│       ├── ActivityTypeBadge.tsx          # NEW — activity type badge
│       └── admin.module.css               # MODIFIED — add new component styles
├── lib/
│   └── admin.ts                           # MODIFIED — add new API functions
└── types/
    └── admin.ts                           # NEW — extended admin types (or inline in lib/admin.ts)
```

---

## 10. TypeScript Types

### 10.1 Activity Log Types

```typescript
export type ActivityType = 'ROLE_CHANGE' | 'STTS_CHANGE' | 'PRFL_UPDATE' | 'LGN';

export interface ActivityPerformer {
  id: string;
  name: string;
  email: string;
}

export interface ActivityLogItem {
  id: string;
  userId: string;
  activityType: ActivityType;
  oldValue: string | null;
  newValue: string | null;
  performedBy: ActivityPerformer;
  ipAddress: string;
  createdAt: string;
}

export interface ActivityLogResponse {
  items: ActivityLogItem[];
  pagination: PaginationInfo;
}

export interface ActivityLogParams {
  page?: number;
  limit?: number;
  type?: ActivityType;
}
```

### 10.2 Bulk Operation Types

```typescript
export interface BulkStatusInput {
  userIds: string[];
  status: 'ACTV' | 'SUSP';
  reason?: string;
}

export interface BulkStatusResult {
  updated: number;
  skipped: number;
  errors: BulkStatusError[];
}

export interface BulkStatusError {
  userId: string;
  code: string;
  message: string;
}
```

### 10.3 Dashboard Types

```typescript
export interface DashboardData {
  totalUsers: number;
  newUsersThisWeek: number;
  newUsersLastWeek: number;
  activeUsers: number;
  suspendedUsers: number;
  roleDistribution: Record<string, number>;
  userGrowth: UserGrowthPoint[];
  recentActivity: DashboardActivityItem[];
  loginActivityToday: number;
  loginActivityThisWeek: number;
}

export interface UserGrowthPoint {
  date: string;
  count: number;
}

export interface DashboardActivityItem {
  id: string;
  activityType: ActivityType;
  targetUser: { id: string; name: string; email: string };
  performedBy: { id: string; name: string };
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}
```

### 10.4 User Summary Types

```typescript
export interface EcommerceSummary {
  productCount: number;
  activeProductCount: number;
  totalSoldCount: number;
  orderCount: number;
  totalPostCount: number;
  totalCommentCount: number;
}

export interface UserSummary extends AdminUser {
  ecommerceSummary: EcommerceSummary;
  recentActivity: ActivityLogItem[];
}
```

### 10.5 Backend DTOs

```typescript
// dto/bulk-status.dto.ts
import {
  IsArray, ArrayMinSize, ArrayMaxSize,
  IsString, IsIn, IsOptional, MaxLength,
} from 'class-validator';

export class BulkStatusDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsString({ each: true })
  userIds: string[];

  @IsIn(['ACTV', 'SUSP'])
  status: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

// dto/activity-query.dto.ts
import { IsOptional, IsIn, IsNumberString } from 'class-validator';

export class ActivityQueryDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsIn(['ROLE_CHANGE', 'STTS_CHANGE', 'PRFL_UPDATE', 'LGN'])
  type?: string;
}
```

---

## 11. Implementation Sequence

| Step | Task | Files | Dependencies |
|------|------|-------|-------------|
| 1 | Add `UserActivityLog` model to Prisma schema + `User` relation fields | `prisma/schema.prisma` | None |
| 2 | Run `prisma generate` to update Prisma client | — | Step 1 |
| 3 | Create `BulkStatusDto` and `ActivityQueryDto` | `server/src/admin/dto/bulk-status.dto.ts`, `activity-query.dto.ts` | None |
| 4 | Create `dashboard.interface.ts` with backend response types | `server/src/admin/interfaces/dashboard.interface.ts` | None |
| 5 | Add `logActivity()` private method to `AdminService` | `server/src/admin/admin.service.ts` | Steps 1-2 |
| 6 | Update `changeRole()` and `changeStatus()` in `AdminService` to call `logActivity()` | `server/src/admin/admin.service.ts` | Step 5 |
| 7 | Implement `getActivityLog()` in `AdminService` | `server/src/admin/admin.service.ts` | Steps 1-2 |
| 8 | Implement `bulkChangeStatus()` in `AdminService` | `server/src/admin/admin.service.ts` | Steps 3, 5 |
| 9 | Implement `exportUsers()` in `AdminService` (CSV generation) | `server/src/admin/admin.service.ts` | None |
| 10 | Implement `getDashboardAnalytics()` in `AdminService` | `server/src/admin/admin.service.ts` | Steps 1-2 |
| 11 | Implement `getUserSummary()` in `AdminService` | `server/src/admin/admin.service.ts` | None |
| 12 | Add 5 new endpoint methods to `AdminController` | `server/src/admin/admin.controller.ts` | Steps 7-11 |
| 13 | Write backend unit tests for new service methods | `server/src/admin/admin.service.spec.ts` | Steps 5-12 |
| 14 | Write backend controller tests for new endpoints | `server/src/admin/admin.controller.spec.ts` | Step 12 |
| 15 | Add new TypeScript types to frontend `lib/admin.ts` | `src/lib/admin.ts` | None |
| 16 | Add new API functions to frontend `lib/admin.ts` | `src/lib/admin.ts` | Step 15 |
| 17 | Create `StatCard`, `ActivityTypeBadge` shared components | `src/components/admin/` | None |
| 18 | Create `BulkActionBar` and `ExportButton` components | `src/components/admin/` | Step 16 |
| 19 | Create `UserActivityTab` component | `src/components/admin/` | Steps 16, 17 |
| 20 | Create `UserEcommerceSummaryTab` component | `src/components/admin/` | Steps 16, 17 |
| 21 | Create `UserDetailPanel` with tabs (Details, Activity, Summary) | `src/components/admin/` | Steps 19, 20 |
| 22 | Enhance `AdminUserTable` with checkbox column and selection state | `src/components/admin/AdminUserTable.tsx` | None |
| 23 | Enhance `AdminUsersPageClient` with bulk selection, export, and tabbed detail | `src/components/admin/AdminUsersPageClient.tsx` | Steps 18, 21, 22 |
| 24 | Create chart components (`UserGrowthChart`, `RoleDistributionChart`) | `src/components/admin/` | Chart library install |
| 25 | Create `RecentActivityTable` component | `src/components/admin/` | Step 17 |
| 26 | Create `AdminDashboardClient` orchestrator component | `src/components/admin/` | Steps 17, 24, 25 |
| 27 | Create `/dashboard/admin/page.tsx` and `loading.tsx` | `src/app/dashboard/admin/` | Step 26 |
| 28 | Update sidebar navigation to include "Dashboard" link under Admin section | Sidebar component | None |
| 29 | Add new CSS module styles for all new components | `src/components/admin/admin.module.css` | Steps 17-27 |
| 30 | Write frontend unit tests | Test files | Steps 17-27 |
| 31 | Write integration tests (E2E flows) | Test files | All steps |
| 32 | Update `docs/database/database-design.md` with TL_COMM_USE_ACTV schema | `docs/database/database-design.md` | Step 1 |
