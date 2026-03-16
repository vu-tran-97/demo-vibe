# RBAC / Admin E2E Test Scenarios

## Overview
- **Feature**: Role-Based Access Control (RBAC) — admin user management, role/status changes, role enforcement
- **Related Modules**: Admin module (NestJS), Auth module (JWT + RolesGuard), UserMenu (Next.js)
- **API Endpoints**: GET/POST `/api/admin/users`, GET `/api/admin/users/:id`, PATCH `/api/admin/users/:id/role`, PATCH `/api/admin/users/:id/status`
- **DB Tables**: TB_COMM_USER, TB_COMM_RFRSH_TKN, TC_COMM_CD (USE_ROLE)
- **Blueprint**: docs/blueprints/002-rbac/blueprint.md
- **Existing Test Cases**: `sprint-2/rbac-test-cases.md` (58 unit/integration/edge/security tests)

---

## Scenario Group 1: Admin — Create User

### E2E-100: Admin creates a SELLER account
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: SUPER_ADMIN logged in (`admin@astratech.vn` / `Admin@123`). No user with email `new-seller@example.com`.
- **User Journey**:
  1. Login as admin, obtain access token
  2. Call `POST /api/admin/users` with headers `Authorization: Bearer {accessToken}` and body `{ email: "new-seller@example.com", password: "Seller@123", name: "New Seller", role: "SELLER" }`
  3. Verify response
  4. Login as the newly created seller to confirm account works
- **Expected Results**:
  - API: POST returns 201 with `{ success: true, data: { email: "new-seller@example.com", role: "SELLER", status: "ACTV" } }`
  - API: Seller login returns 200 with `user.role: 'SELLER'`
  - DB: New user in TB_COMM_USER with `USE_ROLE_CD: 'SELLER'`, `USE_STTS_CD: 'ACTV'`, `EMAIL_VRFC_YN: 'Y'` (pre-verified by admin)
  - Server Log: No errors
- **Verification Method**: network / server-log
- **Test Data**: Admin credentials + `{ email: "new-seller@example.com", password: "Seller@123", name: "New Seller", role: "SELLER" }`

### E2E-101: Admin creates a BUYER account
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: SUPER_ADMIN logged in
- **User Journey**:
  1. Login as admin
  2. Call `POST /api/admin/users` with `{ email: "new-buyer@example.com", password: "Buyer@123", name: "New Buyer", role: "BUYER" }`
- **Expected Results**:
  - API: Returns 201 with `role: 'BUYER'`
- **Verification Method**: network
- **Test Data**: `{ email: "new-buyer@example.com", password: "Buyer@123", name: "New Buyer", role: "BUYER" }`

### E2E-102: Admin cannot create SUPER_ADMIN account
- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: SUPER_ADMIN logged in
- **User Journey**:
  1. Login as admin
  2. Call `POST /api/admin/users` with `{ role: "SUPER_ADMIN", email: "rogue-admin@example.com", password: "Admin@123", name: "Rogue Admin" }`
- **Expected Results**:
  - API: Returns 400 with `error: 'INVALID_ROLE'`
  - DB: No SUPER_ADMIN user created
- **Verification Method**: network

### E2E-103: Admin create with duplicate email rejected
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: SUPER_ADMIN logged in, `admin@astratech.vn` already exists
- **User Journey**:
  1. Login as admin
  2. Call `POST /api/admin/users` with `{ email: "admin@astratech.vn", password: "Test@1234!", name: "Dup", role: "SELLER" }`
- **Expected Results**:
  - API: Returns 409 with `error: 'EMAIL_ALREADY_EXISTS'`
- **Verification Method**: network

---

## Scenario Group 2: Admin — List & View Users

### E2E-110: Admin lists all users with pagination
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: SUPER_ADMIN logged in. Multiple users exist in DB (from seed: 1 admin, 3 sellers, 1 buyer).
- **User Journey**:
  1. Login as admin
  2. Call `GET /api/admin/users?page=1&limit=10`
- **Expected Results**:
  - API: Returns 200 with `{ users: [...], pagination: { page: 1, limit: 10, total: N, totalPages: M } }`
  - API: User objects contain `email`, `name`, `role`, `status`, `createdAt`
- **Verification Method**: network

### E2E-111: Admin filters users by role
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: SUPER_ADMIN logged in. SELLER users exist.
- **User Journey**:
  1. Login as admin
  2. Call `GET /api/admin/users?role=SELLER`
- **Expected Results**:
  - API: Returns only SELLER users (3 sellers from seed)
- **Verification Method**: network

### E2E-112: Admin views user detail
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: SUPER_ADMIN logged in. Known user ID.
- **User Journey**:
  1. Login as admin
  2. List users to get a user ID
  3. Call `GET /api/admin/users/:id`
- **Expected Results**:
  - API: Returns 200 with full user profile including social accounts
- **Verification Method**: network

### E2E-113: Admin views non-existent user
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: SUPER_ADMIN logged in
- **User Journey**:
  1. Login as admin
  2. Call `GET /api/admin/users/000000000000000000000000` (invalid ObjectId format or non-existent)
- **Expected Results**:
  - API: Returns 404 with `error: 'USER_NOT_FOUND'`
- **Verification Method**: network

---

## Scenario Group 3: Admin — Change Role

### E2E-120: Admin changes user from BUYER to SELLER
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: SUPER_ADMIN logged in. BUYER user exists.
- **User Journey**:
  1. Login as admin
  2. List users, find a BUYER user ID
  3. Call `PATCH /api/admin/users/:id/role` with `{ role: "SELLER" }`
  4. Verify response
  5. Login as the user, verify JWT contains `role: 'SELLER'`
- **Expected Results**:
  - API: PATCH returns 200 with `{ role: 'SELLER', previousRole: 'BUYER' }`
  - API: User's next login returns JWT with `role: 'SELLER'`
  - DB: `USE_ROLE_CD` updated to `'SELLER'`
- **Verification Method**: network
- **Test Data**: BUYER user credentials for verification login

### E2E-121: Admin changes SELLER back to BUYER
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: A SELLER user exists
- **User Journey**:
  1. Login as admin
  2. Call `PATCH /api/admin/users/:sellerId/role` with `{ role: "BUYER" }`
- **Expected Results**:
  - API: Returns 200 with `{ role: 'BUYER', previousRole: 'SELLER' }`
- **Verification Method**: network

### E2E-122: Admin cannot change own role
- **Type**: Edge Case
- **Priority**: Critical
- **Preconditions**: SUPER_ADMIN logged in
- **User Journey**:
  1. Login as admin
  2. Get own user ID from JWT or list
  3. Call `PATCH /api/admin/users/:ownId/role` with `{ role: "BUYER" }`
- **Expected Results**:
  - API: Returns 400 with `error: 'CANNOT_CHANGE_OWN_ROLE'`
  - DB: Admin role unchanged
- **Verification Method**: network

### E2E-123: Cannot set role to SUPER_ADMIN via API
- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: SUPER_ADMIN logged in. BUYER user exists.
- **User Journey**:
  1. Login as admin
  2. Call `PATCH /api/admin/users/:buyerId/role` with `{ role: "SUPER_ADMIN" }`
- **Expected Results**:
  - API: Returns 400 with `error: 'INVALID_ROLE'`
  - DB: User role unchanged
- **Verification Method**: network

### E2E-124: Cannot demote another SUPER_ADMIN
- **Type**: Edge Case
- **Priority**: Critical
- **Preconditions**: Two SUPER_ADMIN users exist
- **User Journey**:
  1. Login as admin1
  2. Call `PATCH /api/admin/users/:admin2Id/role` with `{ role: "BUYER" }`
- **Expected Results**:
  - API: Returns 400 with `error: 'CANNOT_DEMOTE_SUPER_ADMIN'`
- **Verification Method**: network

---

## Scenario Group 4: Admin — Suspend / Activate User

### E2E-130: Admin suspends an active user
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: SUPER_ADMIN logged in. Active BUYER user exists.
- **User Journey**:
  1. Login as admin
  2. Call `PATCH /api/admin/users/:buyerId/status` with `{ status: "SUSP" }`
  3. Attempt login as the suspended user
- **Expected Results**:
  - API: PATCH returns 200 with `{ status: 'SUSP', previousStatus: 'ACTV' }`
  - API: Suspended user login returns 403 with `error: 'ACCOUNT_SUSPENDED'`
  - DB: `USE_STTS_CD` updated to `'SUSP'`, all refresh tokens revoked
- **Verification Method**: network / server-log

### E2E-131: Suspended user's existing tokens are invalidated
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: BUYER user logged in with active refresh token. Admin suspends the user.
- **User Journey**:
  1. Login as buyer, save refresh token
  2. Login as admin, suspend the buyer
  3. Attempt `POST /api/auth/refresh` with buyer's saved refresh token
- **Expected Results**:
  - API: Refresh returns 401 (token revoked)
- **Verification Method**: network

### E2E-132: Admin activates a suspended user
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: A suspended user exists
- **User Journey**:
  1. Login as admin
  2. Call `PATCH /api/admin/users/:suspendedUserId/status` with `{ status: "ACTV" }`
  3. Login as the reactivated user
- **Expected Results**:
  - API: PATCH returns 200 with `{ status: 'ACTV', previousStatus: 'SUSP' }`
  - API: Reactivated user can login successfully
- **Verification Method**: network

### E2E-133: Admin cannot suspend themselves
- **Type**: Edge Case
- **Priority**: Critical
- **Preconditions**: SUPER_ADMIN logged in
- **User Journey**:
  1. Login as admin
  2. Call `PATCH /api/admin/users/:ownId/status` with `{ status: "SUSP" }`
- **Expected Results**:
  - API: Returns 400 with `error: 'CANNOT_CHANGE_OWN_STATUS'`
- **Verification Method**: network

### E2E-134: Admin cannot suspend another SUPER_ADMIN
- **Type**: Edge Case
- **Priority**: Critical
- **Preconditions**: Two SUPER_ADMIN users exist
- **User Journey**:
  1. Login as admin1
  2. Call `PATCH /api/admin/users/:admin2Id/status` with `{ status: "SUSP" }`
- **Expected Results**:
  - API: Returns 400 with `error: 'CANNOT_SUSPEND_SUPER_ADMIN'`
- **Verification Method**: network

---

## Scenario Group 5: Role Enforcement (Authorization)

### E2E-140: BUYER cannot access admin endpoints
- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: BUYER user logged in (`buyer@vibe.com`)
- **User Journey**:
  1. Login as buyer, get access token
  2. Call `GET /api/admin/users` with buyer's token
  3. Call `POST /api/admin/users` with buyer's token
  4. Call `PATCH /api/admin/users/:id/role` with buyer's token
- **Expected Results**:
  - API: All requests return 403 Forbidden
- **Verification Method**: network

### E2E-141: SELLER cannot access admin endpoints
- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: SELLER user logged in (`minji@vibe.com`)
- **User Journey**:
  1. Login as seller, get access token
  2. Call `GET /api/admin/users` with seller's token
- **Expected Results**:
  - API: Returns 403 Forbidden
- **Verification Method**: network

### E2E-142: Unauthenticated request to admin endpoints
- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: None
- **User Journey**:
  1. Call `GET /api/admin/users` without Authorization header
- **Expected Results**:
  - API: Returns 401 Unauthorized
- **Verification Method**: network

### E2E-143: Expired access token rejected by admin endpoints
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: An expired JWT access token
- **User Journey**:
  1. Use an expired access token to call `GET /api/admin/users`
- **Expected Results**:
  - API: Returns 401 Unauthorized
- **Verification Method**: network

---

## Scenario Group 6: Security — Role Escalation Prevention

### E2E-150: Signup with role field in body is ignored
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: None
- **User Journey**:
  1. Call `POST /api/auth/signup` with body including `role: "SUPER_ADMIN"` alongside valid signup fields
  2. Login as the newly created user
- **Expected Results**:
  - API: Signup returns 201 with `user.role: 'BUYER'` (role field ignored)
  - API: Login JWT contains `role: 'BUYER'`
- **Verification Method**: network

### E2E-151: No public endpoint can create SUPER_ADMIN
- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: SUPER_ADMIN logged in
- **User Journey**:
  1. Attempt `POST /api/auth/signup` with `role: "SUPER_ADMIN"` — verify role ignored, user gets BUYER
  2. Attempt `POST /api/admin/users` with `role: "SUPER_ADMIN"` — verify rejected with INVALID_ROLE
- **Expected Results**:
  - API: No SUPER_ADMIN can be created via any API endpoint
- **Verification Method**: network

---

## Scenario Group 7: Full RBAC User Lifecycle

### E2E-160: Complete lifecycle: create → role change → suspend → activate → login
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: SUPER_ADMIN logged in
- **User Journey**:
  1. Admin creates a BUYER account `lifecycle@example.com`
  2. New user logs in, verify role is BUYER
  3. Admin changes user's role to SELLER
  4. User logs in again, verify JWT role is SELLER
  5. Admin suspends the user
  6. User tries to login, verify 403 ACCOUNT_SUSPENDED
  7. Admin activates the user
  8. User logs in again, verify success
- **Expected Results**:
  - API: Each step returns expected status codes
  - DB: User record reflects each state change
  - Server Log: No unexpected errors throughout lifecycle
- **Verification Method**: network / server-log
- **Test Data**: `{ email: "lifecycle@example.com", password: "Test@1234!", name: "Lifecycle User", role: "BUYER" }`

### E2E-161: Signup → login → admin changes role → re-login with new role
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: SUPER_ADMIN available
- **User Journey**:
  1. New user signs up via `POST /api/auth/signup` — gets BUYER role
  2. User logs in, verifies BUYER role in JWT
  3. Admin changes user's role to SELLER via `PATCH /api/admin/users/:id/role`
  4. User logs in again, verifies SELLER role in JWT
- **Expected Results**:
  - API: Role change reflected in subsequent login tokens
- **Verification Method**: network

---

## Summary
| Type | Count |
|------|-------|
| Happy Path | 14 |
| Alternative Path | 0 |
| Edge Case | 5 |
| Error Path | 9 |
| **Total** | **28** |
