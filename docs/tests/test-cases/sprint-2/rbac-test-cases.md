# RBAC Module Test Cases — Sprint 2

> Based on `docs/blueprints/002-rbac/blueprint.md`
> Format: Given-When-Then
> Naming convention: `{module}.{layer}.spec.ts`

---

## 1. Unit Tests

### 1.1 Roles Decorator (`roles.decorator.spec.ts`)

#### TC-U-100: @Roles sets metadata on handler

- **Priority**: P0
- **Given**: A controller method decorated with `@Roles('SUPER_ADMIN')`
- **When**: Metadata is read with key `ROLES_KEY` from the handler
- **Then**: The metadata value is `['SUPER_ADMIN']`

#### TC-U-101: @Roles supports multiple roles

- **Priority**: P0
- **Given**: A controller method decorated with `@Roles('SUPER_ADMIN', 'SELLER')`
- **When**: Metadata is read with key `ROLES_KEY` from the handler
- **Then**: The metadata value is `['SUPER_ADMIN', 'SELLER']`

---

### 1.2 Roles Guard (`roles.guard.spec.ts`)

#### TC-U-110: Allow request when no @Roles decorator

- **Priority**: P0
- **Given**: A route handler without `@Roles()` decorator
- **When**: An authenticated user with role `BUYER` makes a request
- **Then**: `canActivate()` returns `true`

#### TC-U-111: Allow request when user role matches

- **Priority**: P0
- **Given**: A route handler with `@Roles('SUPER_ADMIN')`
- **When**: An authenticated user with `role: 'SUPER_ADMIN'` in JWT payload makes a request
- **Then**: `canActivate()` returns `true`

#### TC-U-112: Deny request when user role does not match

- **Priority**: P0
- **Given**: A route handler with `@Roles('SUPER_ADMIN')`
- **When**: An authenticated user with `role: 'BUYER'` in JWT payload makes a request
- **Then**: `canActivate()` returns `false` (NestJS converts to 403 Forbidden)

#### TC-U-113: Allow request when user has one of multiple required roles

- **Priority**: P1
- **Given**: A route handler with `@Roles('SUPER_ADMIN', 'SELLER')`
- **When**: An authenticated user with `role: 'SELLER'` makes a request
- **Then**: `canActivate()` returns `true`

#### TC-U-114: RolesGuard skips check on @Public routes

- **Priority**: P1
- **Given**: A route handler with `@Public()` decorator (no user on request)
- **When**: The guard runs
- **Then**: `canActivate()` returns `true` (no role check on public routes)

---

### 1.3 JWT Payload with Role (`auth.service.spec.ts`)

#### TC-U-120: Access token includes role in payload

- **Priority**: P0
- **Given**: A user with `useRoleCd: 'BUYER'`
- **When**: `generateTokens()` is called with the user's id, email, and role
- **Then**: The decoded access token payload contains `role: 'BUYER'`

#### TC-U-121: Refresh token includes role in payload

- **Priority**: P0
- **Given**: A user with `useRoleCd: 'SELLER'`
- **When**: `generateTokens()` is called
- **Then**: The decoded refresh token payload contains `role: 'SELLER'`

#### TC-U-122: formatUserResponse includes role field

- **Priority**: P0
- **Given**: A user record with `useRoleCd: 'SUPER_ADMIN'`
- **When**: `formatUserResponse()` is called
- **Then**: The response object contains `role: 'SUPER_ADMIN'`

---

### 1.4 Signup Role Default (`auth.service.spec.ts`)

#### TC-U-130: Signup creates user with BUYER role

- **Priority**: P0
- **Given**: A valid signup request with email, password, and name
- **When**: `signup()` is called
- **Then**: The created user has `useRoleCd: 'BUYER'` in the database

#### TC-U-131: Signup ignores role field in request body

- **Priority**: P0
- **Given**: A signup request body that includes `role: 'SUPER_ADMIN'`
- **When**: `signup()` is called
- **Then**: The created user has `useRoleCd: 'BUYER'` (role field ignored)

---

### 1.5 Admin Service (`admin.service.spec.ts`)

#### TC-U-140: List users with default pagination

- **Priority**: P0
- **Given**: 25 users in the database
- **When**: `listUsers({ page: 1, limit: 20 })` is called
- **Then**: Returns 20 users, pagination shows `{ page: 1, limit: 20, total: 25, totalPages: 2 }`

#### TC-U-141: List users with search filter

- **Priority**: P1
- **Given**: Users with names "Alice", "Bob", "Alicia"
- **When**: `listUsers({ search: 'ali' })` is called
- **Then**: Returns "Alice" and "Alicia" (case-insensitive partial match on name/email/nickname)

#### TC-U-142: List users with role filter

- **Priority**: P1
- **Given**: 3 BUYER users, 2 SELLER users, 1 SUPER_ADMIN user
- **When**: `listUsers({ role: 'SELLER' })` is called
- **Then**: Returns only the 2 SELLER users

#### TC-U-143: Create user with SELLER role

- **Priority**: P0
- **Given**: A valid create user request with `role: 'SELLER'`
- **When**: `createUser()` is called by an admin
- **Then**: User is created with `useRoleCd: 'SELLER'`, `userSttsCd: 'ACTV'`, `emailVrfcYn: 'Y'` (pre-verified)

#### TC-U-144: Reject creation with SUPER_ADMIN role

- **Priority**: P0
- **Given**: A create user request with `role: 'SUPER_ADMIN'`
- **When**: `createUser()` is called
- **Then**: Throws `BusinessException` with code `INVALID_ROLE`, HTTP 400

#### TC-U-145: Reject creation with duplicate email

- **Priority**: P0
- **Given**: An existing user with email `existing@example.com`
- **When**: `createUser({ email: 'existing@example.com' })` is called
- **Then**: Throws `BusinessException` with code `EMAIL_ALREADY_EXISTS`, HTTP 409

#### TC-U-146: Change user role from BUYER to SELLER

- **Priority**: P0
- **Given**: A BUYER user with id `userId`
- **When**: `updateRole(userId, { role: 'SELLER' })` is called by admin
- **Then**: User's `useRoleCd` updated to `'SELLER'`, response includes `previousRole: 'BUYER'`

#### TC-U-147: Reject changing own role

- **Priority**: P0
- **Given**: Admin with id `adminId` tries to change their own role
- **When**: `updateRole(adminId, { role: 'BUYER' })` is called by admin with id `adminId`
- **Then**: Throws `BusinessException` with code `CANNOT_CHANGE_OWN_ROLE`, HTTP 400

#### TC-U-148: Reject setting role to SUPER_ADMIN

- **Priority**: P0
- **Given**: A BUYER user with id `userId`
- **When**: `updateRole(userId, { role: 'SUPER_ADMIN' })` is called
- **Then**: Throws `BusinessException` with code `INVALID_ROLE`, HTTP 400

#### TC-U-149: Suspend user and revoke tokens

- **Priority**: P0
- **Given**: An active BUYER user with 3 refresh tokens
- **When**: `updateStatus(userId, { status: 'SUSP' })` is called
- **Then**: User's `userSttsCd` updated to `'SUSP'` AND all 3 refresh tokens have `rvkdYn: 'Y'`

#### TC-U-150: Reject suspending self

- **Priority**: P0
- **Given**: Admin with id `adminId`
- **When**: `updateStatus(adminId, { status: 'SUSP' })` is called by admin with id `adminId`
- **Then**: Throws `BusinessException` with code `CANNOT_SUSPEND_SELF`, HTTP 400

#### TC-U-151: Reject suspending a SUPER_ADMIN user

- **Priority**: P0
- **Given**: Another SUPER_ADMIN user with id `otherAdminId`
- **When**: `updateStatus(otherAdminId, { status: 'SUSP' })` is called
- **Then**: Throws `BusinessException` with code `CANNOT_SUSPEND_ADMIN`, HTTP 400

#### TC-U-152: Activate a suspended user

- **Priority**: P0
- **Given**: A suspended user (status `SUSP`) with id `userId`
- **When**: `updateStatus(userId, { status: 'ACTV' })` is called
- **Then**: User's `userSttsCd` updated to `'ACTV'`

#### TC-U-153: Get user detail

- **Priority**: P1
- **Given**: A user with linked social accounts
- **When**: `getUserDetail(userId)` is called
- **Then**: Returns user profile with `socialAccounts` array containing provider, email, linkedAt

#### TC-U-154: Get non-existent user returns 404

- **Priority**: P1
- **Given**: A non-existent user id
- **When**: `getUserDetail(invalidId)` is called
- **Then**: Throws `BusinessException` with code `USER_NOT_FOUND`, HTTP 404

---

### 1.6 Seed Script (`seed.spec.ts`)

#### TC-U-160: Seed creates default admin account

- **Priority**: P0
- **Given**: An empty database
- **When**: The seed script runs
- **Then**: A user exists with email `admin@astratech.vn`, `useRoleCd: 'SUPER_ADMIN'`, `userSttsCd: 'ACTV'`, `emailVrfcYn: 'Y'`, and the password matches `Admin@123` via bcrypt.compare

#### TC-U-161: Seed creates USE_ROLE code group

- **Priority**: P0
- **Given**: An empty database
- **When**: The seed script runs
- **Then**: `TC_COMM_CD_GRP` contains a group with `cdGrpId: 'USE_ROLE'` and `TC_COMM_CD` contains 3 codes: SUPER_ADMIN (sortNo: 1), SELLER (sortNo: 2), BUYER (sortNo: 3)

#### TC-U-162: Seed is idempotent — skip if admin exists

- **Priority**: P0
- **Given**: The admin user `admin@astratech.vn` already exists in the database
- **When**: The seed script runs again
- **Then**: No duplicate admin is created, no errors thrown

#### TC-U-163: Seed is idempotent — skip if code group exists

- **Priority**: P1
- **Given**: The `USE_ROLE` code group already exists with 3 codes
- **When**: The seed script runs again
- **Then**: No duplicate code groups or codes are created

---

## 2. Integration Tests

### 2.1 Admin List Users (`admin.controller.spec.ts`)

#### TC-I-200: SUPER_ADMIN can list users

- **Priority**: P0
- **Spec file**: `admin.controller.spec.ts`
- **Given**: An authenticated SUPER_ADMIN user
- **When**: `GET /api/admin/users` is called
- **Then**: Returns 200 with `{ success: true, data: { users: [...], pagination: {...} } }`

#### TC-I-201: Pagination works correctly

- **Priority**: P1
- **Given**: 25 users in the database
- **When**: `GET /api/admin/users?page=2&limit=10` is called by SUPER_ADMIN
- **Then**: Returns 10 users (users 11-20), pagination shows `{ page: 2, limit: 10, total: 25, totalPages: 3 }`

#### TC-I-202: Search filters by name/email/nickname

- **Priority**: P1
- **Given**: Users with email `alice@example.com` and `bob@example.com`
- **When**: `GET /api/admin/users?search=alice` is called
- **Then**: Returns only the user with email `alice@example.com`

#### TC-I-203: Filter by role

- **Priority**: P1
- **Given**: Users with roles BUYER and SELLER
- **When**: `GET /api/admin/users?role=SELLER` is called
- **Then**: Returns only SELLER users

---

### 2.2 Admin Get User Detail (`admin.controller.spec.ts`)

#### TC-I-210: SUPER_ADMIN can get user detail

- **Priority**: P0
- **Given**: An existing user with id `userId`
- **When**: `GET /api/admin/users/:userId` is called by SUPER_ADMIN
- **Then**: Returns 200 with full user profile including socialAccounts array

#### TC-I-211: Get deleted user returns 404

- **Priority**: P1
- **Given**: A soft-deleted user (delYn: 'Y')
- **When**: `GET /api/admin/users/:id` is called
- **Then**: Returns 404 with `{ success: false, error: 'USER_NOT_FOUND' }`

---

### 2.3 Admin Create User (`admin.controller.spec.ts`)

#### TC-I-220: Create SELLER account

- **Priority**: P0
- **Given**: SUPER_ADMIN is authenticated
- **When**: `POST /api/admin/users` with `{ email, password, name, role: 'SELLER' }`
- **Then**: Returns 201, created user has `role: 'SELLER'`, `status: 'ACTV'`

#### TC-I-221: Created user can login immediately

- **Priority**: P0
- **Given**: A SELLER account was just created by admin
- **When**: The new seller calls `POST /api/auth/login` with their credentials
- **Then**: Returns 200 with tokens, user response includes `role: 'SELLER'`

#### TC-I-222: Create BUYER account

- **Priority**: P1
- **Given**: SUPER_ADMIN is authenticated
- **When**: `POST /api/admin/users` with `{ email, password, name, role: 'BUYER' }`
- **Then**: Returns 201, created user has `role: 'BUYER'`

#### TC-I-223: Reject duplicate email on admin create

- **Priority**: P0
- **Given**: A user with email `existing@example.com` already exists
- **When**: `POST /api/admin/users` with the same email
- **Then**: Returns 409 with `{ success: false, error: 'EMAIL_ALREADY_EXISTS' }`

#### TC-I-224: DTO validation on admin create

- **Priority**: P1
- **Given**: SUPER_ADMIN is authenticated
- **When**: `POST /api/admin/users` with empty email, weak password
- **Then**: Returns 400 with `{ success: false, error: 'VALIDATION_ERROR' }`

---

### 2.4 Admin Change Role (`admin.controller.spec.ts`)

#### TC-I-230: Change user role from BUYER to SELLER

- **Priority**: P0
- **Given**: A BUYER user with id `userId`
- **When**: `PATCH /api/admin/users/:userId/role` with `{ role: 'SELLER' }` by SUPER_ADMIN
- **Then**: Returns 200 with `{ role: 'SELLER', previousRole: 'BUYER' }`

#### TC-I-231: Changed role reflected in next login JWT

- **Priority**: P0
- **Given**: A user whose role was just changed from BUYER to SELLER
- **When**: The user logs in again
- **Then**: The JWT access token payload contains `role: 'SELLER'`

#### TC-I-232: Change SELLER back to BUYER

- **Priority**: P1
- **Given**: A SELLER user with id `userId`
- **When**: `PATCH /api/admin/users/:userId/role` with `{ role: 'BUYER' }`
- **Then**: Returns 200 with `{ role: 'BUYER', previousRole: 'SELLER' }`

---

### 2.5 Admin Suspend/Activate User (`admin.controller.spec.ts`)

#### TC-I-240: Suspend active user

- **Priority**: P0
- **Given**: An active BUYER user with id `userId`
- **When**: `PATCH /api/admin/users/:userId/status` with `{ status: 'SUSP' }` by SUPER_ADMIN
- **Then**: Returns 200 with `{ status: 'SUSP', previousStatus: 'ACTV' }`

#### TC-I-241: Suspended user cannot login

- **Priority**: P0
- **Given**: A user was just suspended
- **When**: The user calls `POST /api/auth/login` with valid credentials
- **Then**: Returns 403 with `{ success: false, error: 'ACCOUNT_SUSPENDED' }`

#### TC-I-242: Suspended user's refresh tokens are revoked

- **Priority**: P0
- **Given**: A user with active refresh tokens is suspended
- **When**: The user calls `POST /api/auth/refresh` with their previous refresh token
- **Then**: Returns 401 (token revoked)

#### TC-I-243: Activate suspended user

- **Priority**: P0
- **Given**: A suspended user with id `userId`
- **When**: `PATCH /api/admin/users/:userId/status` with `{ status: 'ACTV' }`
- **Then**: Returns 200, user can log in again

---

### 2.6 Signup Role Behavior (`auth.controller.spec.ts`)

#### TC-I-250: New signup gets BUYER role in response

- **Priority**: P0
- **Given**: A new user signing up via `POST /api/auth/signup`
- **When**: Signup succeeds
- **Then**: The response `data.user.role` is `'BUYER'`

#### TC-I-251: New signup JWT contains BUYER role

- **Priority**: P0
- **Given**: A new user just signed up
- **When**: The access token is decoded
- **Then**: The payload contains `role: 'BUYER'`

---

### 2.7 Seed Integration (`seed.integration.spec.ts`)

#### TC-I-260: Default admin can login after seed

- **Priority**: P0
- **Given**: The seed script has been executed
- **When**: `POST /api/auth/login` with `{ email: 'admin@astratech.vn', password: 'Admin@123' }`
- **Then**: Returns 200 with `data.user.role: 'SUPER_ADMIN'`

#### TC-I-261: Default admin can access admin endpoints

- **Priority**: P0
- **Given**: Admin logged in with `admin@astratech.vn`
- **When**: `GET /api/admin/users` is called with the admin's access token
- **Then**: Returns 200 with user list

---

## 3. Edge Cases

### 3.1 Role Enforcement (`admin.controller.spec.ts`)

#### TC-E-300: BUYER cannot access admin endpoints

- **Priority**: P0
- **Given**: An authenticated user with role `BUYER`
- **When**: `GET /api/admin/users` is called
- **Then**: Returns 403 with `{ success: false, error: 'FORBIDDEN' }`

#### TC-E-301: SELLER cannot access admin endpoints

- **Priority**: P0
- **Given**: An authenticated user with role `SELLER`
- **When**: `POST /api/admin/users` is called
- **Then**: Returns 403 with `{ success: false, error: 'FORBIDDEN' }`

#### TC-E-302: Unauthenticated request to admin endpoints

- **Priority**: P0
- **Given**: No Authorization header
- **When**: `GET /api/admin/users` is called
- **Then**: Returns 401 with `{ success: false, error: 'UNAUTHORIZED' }`

---

### 3.2 Self-Modification Protection (`admin.service.spec.ts`)

#### TC-E-310: Admin cannot change own role

- **Priority**: P0
- **Given**: SUPER_ADMIN with id `adminId` is authenticated
- **When**: `PATCH /api/admin/users/:adminId/role` with `{ role: 'BUYER' }` by the same admin
- **Then**: Returns 400 with `{ success: false, error: 'CANNOT_CHANGE_OWN_ROLE' }`

#### TC-E-311: Admin cannot suspend themselves

- **Priority**: P0
- **Given**: SUPER_ADMIN with id `adminId` is authenticated
- **When**: `PATCH /api/admin/users/:adminId/status` with `{ status: 'SUSP' }`
- **Then**: Returns 400 with `{ success: false, error: 'CANNOT_SUSPEND_SELF' }`

#### TC-E-312: Cannot suspend another SUPER_ADMIN

- **Priority**: P0
- **Given**: Two SUPER_ADMIN users (admin1, admin2)
- **When**: admin1 calls `PATCH /api/admin/users/:admin2Id/status` with `{ status: 'SUSP' }`
- **Then**: Returns 400 with `{ success: false, error: 'CANNOT_SUSPEND_ADMIN' }`

---

### 3.3 Invalid Operations (`admin.controller.spec.ts`)

#### TC-E-320: Change role of non-existent user

- **Priority**: P1
- **Given**: A non-existent user id `invalidId`
- **When**: `PATCH /api/admin/users/:invalidId/role` with `{ role: 'SELLER' }`
- **Then**: Returns 404 with `{ success: false, error: 'USER_NOT_FOUND' }`

#### TC-E-321: Set invalid role value

- **Priority**: P1
- **Given**: An existing user id
- **When**: `PATCH /api/admin/users/:id/role` with `{ role: 'INVALID_ROLE' }`
- **Then**: Returns 400 with validation error

#### TC-E-322: Set invalid status value

- **Priority**: P1
- **Given**: An existing user id
- **When**: `PATCH /api/admin/users/:id/status` with `{ status: 'DELETED' }`
- **Then**: Returns 400 with validation error

#### TC-E-323: Create user with SUPER_ADMIN role via admin API

- **Priority**: P0
- **Given**: SUPER_ADMIN is authenticated
- **When**: `POST /api/admin/users` with `{ role: 'SUPER_ADMIN', ... }`
- **Then**: Returns 400 with `{ success: false, error: 'INVALID_ROLE' }`

#### TC-E-324: Paginate beyond available pages

- **Priority**: P1
- **Given**: 5 users in the database
- **When**: `GET /api/admin/users?page=100&limit=20`
- **Then**: Returns 200 with empty `users` array, correct `totalPages`

---

## 4. Security Tests

### 4.1 Role Escalation Prevention (`security.spec.ts`)

#### TC-S-400: Cannot escalate role via signup payload

- **Priority**: P0
- **Given**: A signup request body containing `role: 'SUPER_ADMIN'`
- **When**: `POST /api/auth/signup` is called
- **Then**: Returns 201 but user role is `'BUYER'` (role field ignored)

#### TC-S-401: JWT with tampered role is rejected on admin endpoint

- **Priority**: P0
- **Given**: A BUYER user signs a JWT with `role: 'SUPER_ADMIN'` using the correct JWT_SECRET
- **When**: The tampered JWT is used to call `GET /api/admin/users`
- **Then**: Returns 403 (the `role` in the JWT is only set at token generation time from DB, but if someone has the secret they can forge — **note**: in production JWT_SECRET must be secure; this test verifies the guard reads role from the JWT payload correctly)

#### TC-S-402: Stale JWT role after role change

- **Priority**: P1
- **Given**: A user with role `SELLER` has an active access token
- **When**: Admin changes the user's role to `BUYER`, then the user calls a SELLER-only endpoint with the old token
- **Then**: The old token still has `role: 'SELLER'` — access is granted until token expires (max 15 min). **Note**: This is expected behavior with JWT; role changes take effect on next token refresh.

#### TC-S-403: Cannot create SUPER_ADMIN via any public endpoint

- **Priority**: P0
- **Given**: Various API endpoints (signup, admin create user)
- **When**: Each is called with `role: 'SUPER_ADMIN'`
- **Then**: No SUPER_ADMIN user is created via any API call (only seed creates SUPER_ADMIN)

---

## 5. Coverage Summary

| Category | Count | P0 | P1 |
|----------|-------|----|----|
| Unit Tests (1.x) | 28 | 22 | 6 |
| Integration Tests (2.x) | 16 | 12 | 4 |
| Edge Cases (3.x) | 10 | 6 | 4 |
| Security Tests (4.x) | 4 | 3 | 1 |
| **Total** | **58** | **43** | **15** |

### Spec File Mapping

| Spec File | Test IDs |
|-----------|----------|
| `roles.decorator.spec.ts` | TC-U-100, TC-U-101 |
| `roles.guard.spec.ts` | TC-U-110 ~ TC-U-114 |
| `auth.service.spec.ts` | TC-U-120 ~ TC-U-131 |
| `admin.service.spec.ts` | TC-U-140 ~ TC-U-154 |
| `seed.spec.ts` | TC-U-160 ~ TC-U-163 |
| `admin.controller.spec.ts` | TC-I-200 ~ TC-I-261, TC-E-300 ~ TC-E-324 |
| `security.spec.ts` | TC-S-400 ~ TC-S-403 |
