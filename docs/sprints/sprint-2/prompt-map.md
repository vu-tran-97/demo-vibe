# Sprint 2 Prompt Map

## Sprint Goal
Implement role-based access control (RBAC) with three roles — SUPER_ADMIN, SELLER, BUYER. Default super admin seeded on startup, new signups default to BUYER, SELLER created only by admin. Admin-only user management UI.

## Previous Sprint Carryover
- **Auth — Social Login** (Sprint 1): Blueprint exists at `docs/blueprints/001-auth/blueprint.md`, DB design done for `TB_COMM_SCL_ACNT`. All pipeline stages remain (test cases, implementation, test report).
- **Retrospective**: Not conducted — template only.

## Feature 1: Auth — Social Login (Carryover from Sprint 1)

### 1.1 Design Prompt
(Already completed — see docs/blueprints/001-auth/blueprint.md, Social Login section)

### 1.2 DB Design Reflection Prompt
(Already completed — TB_COMM_SCL_ACNT reflected in docs/database/database-design.md)

### 1.3 Test Case Prompt
/feature-dev "Extend docs/tests/test-cases/sprint-1/auth-test-cases.md
with social login test cases. Cover:
- Unit tests: OAuth token exchange, profile extraction per provider
- Integration tests: social signup (new user), social login (existing user), account linking
- Edge cases: revoked OAuth token, mismatched email, provider API timeout
Do not modify any code yet."

### 1.4 Implementation Prompt
/feature-dev "Strictly follow docs/blueprints/001-auth/blueprint.md (Social Login section)
and docs/database/database-design.md to implement social login.
Add to the existing server/src/auth/ module:
- OAuth strategies for Google, Kakao, Naver (using passport or manual flow)
- Social account service for TB_COMM_SCL_ACNT operations
- Account linking logic
Write tests referencing docs/tests/test-cases/sprint-1/auth-test-cases.md.
Run all tests and append results to docs/tests/test-reports/sprint-2-social-login-report.md."

## Feature 2: Role-Based Access Control (RBAC)

### 2.1 Design Prompt
/feature-dev "Write the design document for the RBAC module
to docs/blueprints/002-rbac/blueprint.md.
Requirements:
- Three roles: SUPER_ADMIN, SELLER, BUYER
- Role stored in TB_COMM_USER as USE_ROLE_CD field (code group: USE_ROLE)
- Default super admin account seeded on app startup:
  - Email: admin@astratech.vn
  - Password: Admin@123
  - Role: SUPER_ADMIN
- New user signup defaults to BUYER role
- SELLER role can only be assigned by SUPER_ADMIN (not self-registration)
- Role-based route guards: @Roles('SUPER_ADMIN'), @Roles('SELLER'), @Roles('BUYER')
- API endpoints:
  - GET /admin/users — list all users (SUPER_ADMIN only)
  - PATCH /admin/users/:id/role — change user role (SUPER_ADMIN only)
  - POST /admin/users — create user with specific role (SUPER_ADMIN only, used to create SELLER accounts)
  - GET /admin/users/:id — get user detail (SUPER_ADMIN only)
  - PATCH /admin/users/:id/status — activate/suspend user (SUPER_ADMIN only)
- Seed script: create default admin + code group USE_ROLE with values SUPER_ADMIN/SELLER/BUYER
- Refer to docs/database/database-design.md for DB schema.
Do not modify any code yet."

### 2.2 DB Design Reflection Prompt
/feature-dev "Add/update the RBAC-related fields in
docs/database/database-design.md:
- Add USE_ROLE_CD field to TB_COMM_USER (String, default: 'BUYER', enum: SUPER_ADMIN/SELLER/BUYER)
- Add code group USE_ROLE to TC_COMM_CD initial data (SUPER_ADMIN, SELLER, BUYER)
- Update the ERD and index strategy (add index on USE_ROLE_CD for admin queries).
Follow standard terminology dictionary.
Do not modify any code yet."

### 2.3 Test Case Prompt
/feature-dev "Based on docs/blueprints/002-rbac/blueprint.md,
write test cases to docs/tests/test-cases/sprint-2/rbac-test-cases.md.
Use Given-When-Then format. Cover:
- Unit tests: role guard decorator, seed script execution, role validation
- Integration tests: admin create seller, admin list users, admin change role, admin suspend user
- Edge cases: non-admin tries admin endpoints (403), change own role, demote last super admin
- Security: role escalation attempts, JWT token with tampered role
Do not modify any code yet."

### 2.4 Implementation Prompt
/feature-dev "Strictly follow docs/blueprints/002-rbac/blueprint.md and
docs/database/database-design.md to implement RBAC.
Tech stack: NestJS + Prisma (MongoDB adapter) + JWT.
Structure:
- Add USE_ROLE_CD to Prisma schema User model
- server/src/auth/decorators/roles.decorator.ts (@Roles decorator)
- server/src/auth/guards/roles.guard.ts (RolesGuard)
- server/src/admin/ module (controller, service) for user management
- server/prisma/seed.ts — seed default admin (admin@astratech.vn / Admin@123) + code groups
- Include role in JWT payload and auth responses
Write tests referencing docs/tests/test-cases/sprint-2/rbac-test-cases.md.
Once implementation is complete, run all tests and
report results to docs/tests/test-reports/sprint-2-rbac-report.md."

## Feature 3: Admin User Management UI

### 3.1 Design Prompt
/feature-dev "Write the design document for the Admin User Management UI
to docs/blueprints/003-admin-ui/blueprint.md.
Requirements:
- Admin dashboard page at /admin/users (only visible to SUPER_ADMIN)
- User list table with columns: Name, Email, Nickname, Role, Status, Registered Date
- Pagination, search by name/email, filter by role/status
- User detail modal/page: view full profile, change role, activate/suspend
- Create seller account form: name, email, password, nickname
- Role badge display (color-coded: SUPER_ADMIN=red, SELLER=blue, BUYER=green)
- Navigation: add 'Admin' link in sidebar only for SUPER_ADMIN users
- Responsive layout following design tokens from docs/design-system/design-tokens.css
- Frontend auth guard: redirect non-admin users to dashboard
- Refer to docs/blueprints/002-rbac/blueprint.md for API spec.
Do not modify any code yet."

### 3.2 DB Design Reflection Prompt
(N/A — no new DB changes needed, uses existing TB_COMM_USER and admin API endpoints)

### 3.3 Test Case Prompt
/feature-dev "Based on docs/blueprints/003-admin-ui/blueprint.md,
write test cases to docs/tests/test-cases/sprint-2/admin-ui-test-cases.md.
Use Given-When-Then format. Cover:
- UI tests: admin page renders user list, pagination works, search filters
- Access control: non-admin cannot see /admin routes, redirect behavior
- CRUD operations: create seller, change role, suspend/activate user
- Edge cases: empty user list, network error handling, confirm dialogs
Do not modify any code yet."

### 3.4 Implementation Prompt
/feature-dev "Strictly follow docs/blueprints/003-admin-ui/blueprint.md to implement
the Admin User Management UI.
Tech stack: Next.js 15 (App Router, Client Components for interactive pages).
Structure:
- src/app/admin/users/page.tsx — user list with table, search, filters
- src/app/admin/users/[id]/page.tsx — user detail with role/status management
- src/app/admin/layout.tsx — admin layout with SUPER_ADMIN guard
- src/components/admin/ — reusable admin components (UserTable, RoleBadge, CreateSellerForm)
- Update src/app/dashboard/layout.tsx sidebar — show 'Admin' link only for SUPER_ADMIN
- Use src/lib/auth.ts to check user role for conditional rendering
- Follow design tokens from docs/design-system/design-tokens.css
Run manual verification and report to docs/tests/test-reports/sprint-2-admin-ui-report.md."
