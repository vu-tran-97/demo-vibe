# 002-RBAC: Role-Based Access Control Blueprint

> Role-based access control with three roles (SUPER_ADMIN, SELLER, BUYER), admin user management API, and seed script for default super admin.

## 1. Overview

### 1.1 Purpose
Add role-based authorization to the Vibe platform. All users get a role that controls what actions they can perform. Admins manage users and create seller accounts. This module builds on the existing Auth module (001-auth).

### 1.2 Scope
- Three roles: SUPER_ADMIN, SELLER, BUYER
- Role field added to TB_COMM_USER (`USE_ROLE_CD`)
- Default super admin seeded on application startup
- Signup defaults to BUYER role
- SELLER accounts created only by SUPER_ADMIN
- Role-based route guards (`@Roles()` decorator + `RolesGuard`)
- Admin user management API (CRUD, role change, status change)
- Role included in JWT payload and auth responses

### 1.3 Out of Scope
- Permission-level granularity (feature-level permissions per role)
- Role hierarchy (e.g., SUPER_ADMIN inherits SELLER permissions)
- Multiple admin levels (only one admin role)
- Admin UI (covered in 003-admin-ui)

### 1.4 Tech Stack
| Layer | Technology |
|-------|-----------|
| Framework | NestJS (TypeScript) |
| ORM | Prisma (MongoDB Adapter) |
| Auth | Existing JWT + Passport from 001-auth |
| Validation | class-validator, class-transformer |
| Seeding | Custom seed script via `prisma db seed` |

---

## 2. Architecture

### 2.1 Module Structure

```
server/src/
├── auth/
│   ├── decorators/
│   │   ├── roles.decorator.ts          # NEW — @Roles('SUPER_ADMIN', 'SELLER')
│   │   ├── public.decorator.ts         # Existing
│   │   └── current-user.decorator.ts   # Existing
│   ├── guards/
│   │   └── roles.guard.ts              # NEW — RolesGuard (checks USE_ROLE_CD)
│   ├── auth.guard.ts                   # Existing — JwtAuthGuard
│   ├── auth.service.ts                 # MODIFIED — add role to signup, generateTokens, formatUserResponse
│   ├── auth.controller.ts              # Existing — no changes
│   ├── interfaces/
│   │   └── jwt-payload.interface.ts    # MODIFIED — add role field
│   └── ...
├── admin/
│   ├── admin.module.ts                 # NEW
│   ├── admin.controller.ts             # NEW — /api/admin/users endpoints
│   ├── admin.service.ts                # NEW — user management business logic
│   └── dto/
│       ├── list-users-query.dto.ts     # NEW — pagination, search, filter
│       ├── create-user.dto.ts          # NEW — admin creates user with role
│       ├── update-role.dto.ts          # NEW — change user role
│       └── update-status.dto.ts        # NEW — activate/suspend user
├── prisma/
│   └── seed.ts                         # NEW — seed default admin + code groups
└── app.module.ts                       # MODIFIED — import AdminModule, register RolesGuard
```

### 2.2 Dependency Flow

```
AdminController → AdminService → PrismaService
                               → AuthService (password hashing reuse)

RolesGuard → Reflector (reads @Roles metadata)
           → ExecutionContext (extracts user from request)
```

### 2.3 Guard Chain

For protected + role-restricted routes, guards execute in order:

```
Request → JwtAuthGuard (validates JWT, attaches user to request)
        → RolesGuard (checks user.role against @Roles metadata)
        → Controller handler
```

- `JwtAuthGuard` is global (APP_GUARD). Routes with `@Public()` bypass it.
- `RolesGuard` is global (APP_GUARD). Routes without `@Roles()` allow any authenticated user.
- Routes with `@Roles('SUPER_ADMIN')` require the user's `USE_ROLE_CD` to be `SUPER_ADMIN`.

---

## 3. Database Changes

> Full schema defined in `docs/database/database-design.md` (SSoT). This section describes changes.

### 3.1 TB_COMM_USER — New Field

| Field | Prisma | Type | Default | Constraint | Description |
|-------|--------|------|---------|-----------|-------------|
| USE_ROLE_CD | useRoleCd | String | `"BUYER"` | enum: SUPER_ADMIN/SELLER/BUYER | User role code |

**Prisma Schema Addition:**
```prisma
useRoleCd    String   @default("BUYER") @map("USE_ROLE_CD")
```

### 3.2 TC_COMM_CD — New Code Group

Add to initial code data:

| Code Group (CD_GRP_ID) | Group Name | Code Value (CD_VAL) | Code Name | SORT_NO |
|------------------------|------------|---------------------|-----------|---------|
| `USE_ROLE` | User Role | `SUPER_ADMIN` | Super Admin | 1 |
| | | `SELLER` | Seller | 2 |
| | | `BUYER` | Buyer | 3 |

### 3.3 Index Addition

| Collection | Field | Type | Purpose |
|-----------|-------|------|---------|
| TB_COMM_USER | USE_ROLE_CD | Single | Admin query filtering by role |

---

## 4. JWT Payload Changes

### 4.1 Current Payload (001-auth)

```typescript
interface JwtPayload {
  sub: string;
  email: string;
  type: 'access' | 'refresh';
}
```

### 4.2 Updated Payload

```typescript
interface JwtPayload {
  sub: string;
  email: string;
  role: string;       // NEW — 'SUPER_ADMIN' | 'SELLER' | 'BUYER'
  type: 'access' | 'refresh';
}
```

The `role` field is included in both access and refresh token payloads. The `role` is read from the database at token generation time, ensuring the latest role is reflected on each login/refresh.

### 4.3 Impact on Existing Code

| File | Change |
|------|--------|
| `jwt-payload.interface.ts` | Add `role: string` |
| `auth.service.ts` → `generateTokens()` | Accept `role` param, include in payload |
| `auth.service.ts` → `signup()` | Set `useRoleCd: 'BUYER'`, pass to `generateTokens` |
| `auth.service.ts` → `login()` | Read `useRoleCd`, pass to `generateTokens` |
| `auth.service.ts` → `refresh()` | Read `useRoleCd` from user, pass to `generateTokens` |
| `auth.service.ts` → `formatUserResponse()` | Add `role` field |
| `jwt.strategy.ts` → `validate()` | Returns payload (role already included) |

---

## 5. API Endpoints

### 5.1 Admin User Management

All endpoints prefixed with `/api/admin`. All require `@Roles('SUPER_ADMIN')`.

---

#### GET /api/admin/users

List all users with pagination, search, and filtering.

**Headers:** `Authorization: Bearer {accessToken}` (SUPER_ADMIN only)

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number (1-based) |
| limit | number | 20 | Items per page (max 100) |
| search | string | - | Search by name, email, or nickname |
| role | string | - | Filter by role (SUPER_ADMIN/SELLER/BUYER) |
| status | string | - | Filter by status (ACTV/INAC/SUSP) |
| sort | string | `rgstDt` | Sort field |
| order | string | `desc` | Sort order (asc/desc) |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "665a1b2c3d4e5f6a7b8c9d0e",
        "email": "user@example.com",
        "name": "John Doe",
        "nickname": "johndoe",
        "role": "BUYER",
        "status": "ACTV",
        "emailVerified": true,
        "profileImageUrl": null,
        "registeredAt": "2026-03-16T10:00:00Z",
        "lastLoginAt": "2026-03-16T14:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

**Error Responses:**
| Status | Code | Condition |
|--------|------|-----------|
| 401 | UNAUTHORIZED | No/invalid JWT |
| 403 | FORBIDDEN | Non-SUPER_ADMIN user |

---

#### GET /api/admin/users/:id

Get detailed user information.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "665a1b2c3d4e5f6a7b8c9d0e",
    "email": "seller@example.com",
    "name": "Jane Smith",
    "nickname": "janesmith",
    "role": "SELLER",
    "status": "ACTV",
    "emailVerified": true,
    "profileImageUrl": null,
    "registeredAt": "2026-03-10T09:00:00Z",
    "lastLoginAt": "2026-03-16T12:00:00Z",
    "socialAccounts": [
      {
        "provider": "GOOGLE",
        "email": "jane@gmail.com",
        "linkedAt": "2026-03-10T09:30:00Z"
      }
    ]
  }
}
```

**Error Responses:**
| Status | Code | Condition |
|--------|------|-----------|
| 404 | USER_NOT_FOUND | User does not exist or is deleted |

---

#### POST /api/admin/users

Create a new user with a specific role (used to create SELLER accounts).

**Request Body:**
```json
{
  "email": "seller@vibe.com",
  "password": "S3ller@Pass!",
  "name": "New Seller",
  "nickname": "newseller",
  "role": "SELLER"
}
```

**Validation Rules:**
| Field | Rule |
|-------|------|
| email | Required, valid email, max 100 chars, unique |
| password | Required, min 8 chars, strength rules |
| name | Required, max 50 chars |
| nickname | Optional, 2~30 chars, unique |
| role | Required, one of: `SELLER`, `BUYER` (cannot create SUPER_ADMIN) |

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "665a1b2c3d4e5f6a7b8c9d0e",
    "email": "seller@vibe.com",
    "name": "New Seller",
    "nickname": "newseller",
    "role": "SELLER",
    "status": "ACTV"
  }
}
```

**Error Responses:**
| Status | Code | Condition |
|--------|------|-----------|
| 400 | VALIDATION_ERROR | Invalid input |
| 400 | INVALID_ROLE | Attempted to create SUPER_ADMIN |
| 409 | EMAIL_ALREADY_EXISTS | Duplicate email |
| 409 | NICKNAME_ALREADY_EXISTS | Duplicate nickname |

**Flow:**
1. Validate input (class-validator)
2. Reject if role = SUPER_ADMIN (only seeded, never created via API)
3. Check email uniqueness
4. Check nickname uniqueness (if provided)
5. Hash password with bcrypt (12 rounds)
6. Create user with specified role, status ACTV, EMAIL_VRFC_YN = Y (admin-created users are pre-verified)
7. Return created user

---

#### PATCH /api/admin/users/:id/role

Change a user's role.

**Request Body:**
```json
{
  "role": "SELLER"
}
```

**Validation Rules:**
| Rule | Description |
|------|-------------|
| Cannot change own role | Admin cannot demote themselves |
| Cannot set SUPER_ADMIN | Only seed can create SUPER_ADMIN |
| Target must exist | User not deleted |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "665a1b2c3d4e5f6a7b8c9d0e",
    "email": "user@example.com",
    "role": "SELLER",
    "previousRole": "BUYER"
  }
}
```

**Error Responses:**
| Status | Code | Condition |
|--------|------|-----------|
| 400 | CANNOT_CHANGE_OWN_ROLE | Trying to change own role |
| 400 | INVALID_ROLE | Role is SUPER_ADMIN or invalid |
| 404 | USER_NOT_FOUND | User doesn't exist |

---

#### PATCH /api/admin/users/:id/status

Activate or suspend a user.

**Request Body:**
```json
{
  "status": "SUSP"
}
```

**Validation Rules:**
| Rule | Description |
|------|-------------|
| Valid status | Must be ACTV or SUSP (not INAC — that's for self-deactivation) |
| Cannot suspend self | Admin cannot suspend themselves |
| Cannot suspend SUPER_ADMIN | Other admins cannot be suspended |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "665a1b2c3d4e5f6a7b8c9d0e",
    "email": "user@example.com",
    "status": "SUSP",
    "previousStatus": "ACTV"
  }
}
```

**Error Responses:**
| Status | Code | Condition |
|--------|------|-----------|
| 400 | CANNOT_SUSPEND_SELF | Trying to suspend own account |
| 400 | CANNOT_SUSPEND_ADMIN | Trying to suspend a SUPER_ADMIN |
| 400 | INVALID_STATUS | Status not ACTV or SUSP |
| 404 | USER_NOT_FOUND | User doesn't exist |

**Side Effect:** When a user is suspended (SUSP), all their active refresh tokens are revoked immediately.

---

## 6. Roles Guard Implementation

### 6.1 @Roles Decorator

```typescript
// server/src/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

### 6.2 RolesGuard

```typescript
// server/src/auth/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles decorator → allow any authenticated user
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    // user is JwtPayload attached by JwtAuthGuard → JwtStrategy.validate()
    return requiredRoles.includes(user.role);
  }
}
```

### 6.3 Guard Registration (app.module.ts)

```typescript
providers: [
  { provide: APP_GUARD, useClass: JwtAuthGuard },
  { provide: APP_GUARD, useClass: RolesGuard },    // NEW — after JwtAuthGuard
],
```

**Order matters:** JwtAuthGuard runs first (authenticates), then RolesGuard (authorizes).

### 6.4 Usage Examples

```typescript
// Only SUPER_ADMIN can access
@Roles('SUPER_ADMIN')
@Get('users')
listUsers() { ... }

// SUPER_ADMIN or SELLER can access
@Roles('SUPER_ADMIN', 'SELLER')
@Get('products')
listProducts() { ... }

// Any authenticated user (no @Roles)
@Get('profile')
getProfile() { ... }

// Public route (no auth required)
@Public()
@Post('signup')
signup() { ... }
```

---

## 7. Seed Script

### 7.1 Purpose
Run on application startup to ensure the default super admin account and role code group exist.

### 7.2 Seed Data

**Default Super Admin:**
| Field | Value |
|-------|-------|
| USE_EMAIL | `admin@astratech.vn` |
| USE_PSWD | bcrypt hash of `Admin@123` |
| USE_NM | `System Admin` |
| USE_NCNM | `admin` |
| USE_ROLE_CD | `SUPER_ADMIN` |
| USE_STTS_CD | `ACTV` |
| EMAIL_VRFC_YN | `Y` |
| RGTR_ID | `SYSTEM` |

**Code Group — USE_ROLE:**
| CD_GRP_ID | CD_VAL | CD_NM | SORT_NO |
|-----------|--------|-------|---------|
| USE_ROLE | SUPER_ADMIN | Super Admin | 1 |
| USE_ROLE | SELLER | Seller | 2 |
| USE_ROLE | BUYER | Buyer | 3 |

### 7.3 Idempotency

The seed script is idempotent — it uses `upsert` operations:
- If admin account already exists (by email), skip creation
- If code group already exists (by CD_GRP_ID), skip creation
- Safe to run multiple times on app restart

### 7.4 Seed File Location

`server/prisma/seed.ts` — configured in `package.json`:

```json
{
  "prisma": {
    "seed": "ts-node server/prisma/seed.ts"
  }
}
```

### 7.5 Startup Integration

The seed runs as part of application bootstrap in `main.ts`:

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // ... existing setup ...

  // Run seed on startup
  const seedService = app.get(SeedService);
  await seedService.run();

  await app.listen(port);
}
```

Alternative: Create a `SeedService` in the Prisma module that runs `onModuleInit()`.

---

## 8. Auth Response Changes

### 8.1 Current Response (001-auth)

```json
{
  "user": {
    "id": "...",
    "email": "...",
    "name": "...",
    "nickname": "...",
    "emailVerified": true,
    "profileImageUrl": null
  }
}
```

### 8.2 Updated Response

```json
{
  "user": {
    "id": "...",
    "email": "...",
    "name": "...",
    "nickname": "...",
    "role": "BUYER",
    "emailVerified": true,
    "profileImageUrl": null
  }
}
```

### 8.3 Frontend Impact

Update `src/lib/auth.ts`:

```typescript
export interface UserInfo {
  id: string;
  email: string;
  name: string;
  nickname: string | null;
  role: string;              // NEW
  emailVerified: boolean;
  profileImageUrl: string | null;
}
```

The `role` field stored in localStorage enables frontend conditional rendering (e.g., show admin link in sidebar only for `SUPER_ADMIN`).

---

## 9. Error Handling

### 9.1 New Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| FORBIDDEN | 403 | User does not have required role |
| USER_NOT_FOUND | 404 | Target user not found or deleted |
| INVALID_ROLE | 400 | Invalid role value (or attempted SUPER_ADMIN creation) |
| INVALID_STATUS | 400 | Invalid status value |
| CANNOT_CHANGE_OWN_ROLE | 400 | Admin tried to change own role |
| CANNOT_SUSPEND_SELF | 400 | Admin tried to suspend own account |
| CANNOT_SUSPEND_ADMIN | 400 | Tried to suspend a SUPER_ADMIN |

### 9.2 RolesGuard Rejection

When `RolesGuard` rejects a request, it throws `ForbiddenException`. The existing `HttpExceptionFilter` catches this and returns:

```json
{
  "success": false,
  "error": "FORBIDDEN",
  "message": "You do not have permission to access this resource"
}
```

---

## 10. Security Considerations

### 10.1 Role Escalation Prevention

| Attack | Mitigation |
|--------|-----------|
| Set role to SUPER_ADMIN via signup | Signup always sets BUYER, ignores any role field |
| Create SUPER_ADMIN via admin API | API rejects role=SUPER_ADMIN in create endpoint |
| Tamper JWT role claim | Role is read from DB on each token generation, not trusted from client |
| Self-promotion | Admin cannot change own role |

### 10.2 Admin Account Protection

- Default admin (admin@astratech.vn) cannot be suspended
- SUPER_ADMIN role cannot be assigned via API (only via seed)
- Suspending a user immediately revokes all their refresh tokens

### 10.3 Seed Password

The default admin password `Admin@123` should be changed after first login in production. The seed script logs a warning if the default password is still in use.

---

## 11. Implementation Sequence

| Step | Task | Dependencies |
|------|------|-------------|
| 1 | Add `useRoleCd` to Prisma schema + regenerate client | None |
| 2 | Update `JwtPayload` interface — add `role` field | None |
| 3 | Create `@Roles()` decorator | None |
| 4 | Create `RolesGuard` | Step 3 |
| 5 | Update `AuthService` — add role to `generateTokens`, `formatUserResponse`, `signup` | Steps 1, 2 |
| 6 | Register `RolesGuard` as global guard in `AppModule` | Step 4 |
| 7 | Create `AdminModule` (service + controller + DTOs) | Steps 1-6 |
| 8 | Create seed script (`prisma/seed.ts`) | Step 1 |
| 9 | Integrate seed into app bootstrap | Step 8 |
| 10 | Update frontend `UserInfo` type and conditional rendering | Step 5 |
| 11 | Write unit tests (RolesGuard, AdminService, seed) | Steps 1-9 |
| 12 | Write integration tests (admin endpoints, role enforcement) | Steps 1-9 |
| 13 | Run all tests + generate report | Steps 11-12 |

---

## 12. Testing Strategy

### 12.1 Unit Tests

| Target | Test Cases |
|--------|-----------|
| RolesGuard | No @Roles → allow, matching role → allow, wrong role → deny, @Public bypass |
| AdminService.listUsers | Pagination, search, role filter, status filter, empty results |
| AdminService.createUser | Valid SELLER creation, reject SUPER_ADMIN, duplicate email, duplicate nickname |
| AdminService.updateRole | Valid change, self-change blocked, SUPER_ADMIN target blocked, invalid role |
| AdminService.updateStatus | Suspend user + token revocation, activate user, self-suspend blocked, admin-suspend blocked |
| Seed script | Creates admin if not exists, skips if exists, creates code groups |

### 12.2 Integration Tests

| Flow | Test Cases |
|------|-----------|
| Role enforcement | BUYER → admin endpoint → 403, SUPER_ADMIN → admin endpoint → 200 |
| Signup role | New signup → role is BUYER in response and JWT |
| Admin create seller | Create SELLER → login as seller → verify role in JWT |
| Role change | Change BUYER→SELLER → next login has SELLER in JWT |
| Suspend flow | Suspend user → user's refresh tokens revoked → user cannot login |
| Seed idempotency | Run seed twice → no duplicate admin or code groups |

### 12.3 Edge Cases

- Login as suspended user → 403 ACCOUNT_SUSPENDED
- Admin creates user with same email as existing → 409
- Change role of deleted user → 404
- Concurrent role change requests
- JWT with old role after role change (stale token — resolves on next refresh)
