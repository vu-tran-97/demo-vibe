# Sprint 3 Prompt Map

## Sprint Goal
Complete authentication with social login (Google/Kakao/Naver), build admin user management UI for SUPER_ADMIN, and fix DB naming standard violations (EMAIL→EML).

## Previous Sprint Carryover
- **Social Login** (from Sprint 1→2→3): Blueprint and DB design already completed in Sprint 1. Implementation not started.
- **Admin User Management UI** (from Sprint 2): Not started in Sprint 2. Backend RBAC API already completed — this feature builds the frontend admin dashboard.
- **DB Naming Fix**: 5 forbidden word violations found in Sprint 2 `/check-naming` — EMAIL should be EML per public data standard.
- **Retrospective**: Sprint 2 retrospective was not conducted. No improvement actions to carry over.

---

## Feature 1: Auth — Social Login (Carryover from Sprint 1)

### 1.1 Design Prompt
(Already completed — see docs/blueprints/001-auth/blueprint.md, Social Login section)

### 1.2 DB Design Reflection Prompt
(Already completed — TB_COMM_SCL_ACNT defined in docs/database/database-design.md)

### 1.3 Test Case Prompt
/feature-dev "Based on docs/blueprints/001-auth/blueprint.md (Social Login section),
write test cases to docs/tests/test-cases/sprint-3/social-login-test-cases.md.
Use Given-When-Then format. Cover:
- Unit tests: OAuth callback handler, social account linking, token generation for social users
- Integration tests: Google OAuth flow, Kakao OAuth flow, Naver OAuth flow
- Edge cases: existing email with different provider, link multiple providers, revoke social account
- Security: CSRF state parameter validation, OAuth code replay attack, token tampering
Refer to docs/database/database-design.md for TB_COMM_SCL_ACNT schema.
Do not modify any code yet."

### 1.4 Implementation Prompt
/feature-dev "Strictly follow docs/blueprints/001-auth/blueprint.md (Social Login section) and
docs/database/database-design.md to implement social login.
- Implement OAuth2 flows for Google, Kakao, Naver
- Use Passport.js strategies (passport-google-oauth20, passport-kakao, passport-naver-v2)
- Link social accounts to existing users via TB_COMM_SCL_ACNT
- Handle first-time social login (auto-create user with BUYER role)
- Handle existing email conflict (prompt to link accounts)
- Frontend: Add social login buttons to AuthModal component
Write tests referencing docs/tests/test-cases/sprint-3/social-login-test-cases.md,
and once implementation is complete, run all tests and
report results to docs/tests/test-reports/."

---

## Feature 2: Admin User Management UI (Carryover from Sprint 2)

### 2.1 Design Prompt
/feature-dev "Write the design document for Admin User Management UI
to docs/blueprints/003-admin-ui/blueprint.md.
- SUPER_ADMIN-only dashboard page at /dashboard/admin/users
- User list table with pagination, search, and role/status filters
- User detail view with role change and suspend/activate actions
- Confirmation modals for destructive actions (suspend, role change)
- Responsive design (desktop table → mobile card layout)
- Uses existing backend API: GET/POST /api/admin/users, PATCH /api/admin/users/:id/role, PATCH /api/admin/users/:id/status
- Role-based navigation: show Admin menu only for SUPER_ADMIN
Refer to docs/database/database-design.md for data model.
Refer to docs/design-system/design-tokens.css for design tokens.
Do not modify any code yet."

### 2.2 DB Design Reflection Prompt
(N/A — No new tables required. Uses existing TB_COMM_USER and admin API.)

### 2.3 Test Case Prompt
/feature-dev "Based on docs/blueprints/003-admin-ui/blueprint.md,
write test cases to docs/tests/test-cases/sprint-3/admin-ui-test-cases.md.
Use Given-When-Then format. Cover:
- Unit tests: AdminUserList component, AdminUserDetail component, role/status filter logic
- Integration tests: user list loads from API, role change updates UI, suspend/activate flow
- Edge cases: empty user list, pagination boundary, search with no results
- Security: non-admin user cannot access /dashboard/admin (redirect to home)
- UI: responsive layout at mobile/tablet/desktop breakpoints, confirmation modal behavior
Do not modify any code yet."

### 2.4 Implementation Prompt
/feature-dev "Strictly follow docs/blueprints/003-admin-ui/blueprint.md and
docs/database/database-design.md to implement admin user management UI.
- Create /dashboard/admin/users page (Next.js App Router)
- Implement user list table with pagination, search, role/status filter
- Implement user detail panel with role change and suspend/activate
- Add confirmation modals for destructive actions
- Add Admin menu item to dashboard sidebar (visible only for SUPER_ADMIN)
- Use design tokens from docs/design-system/design-tokens.css
- Follow responsive breakpoints from docs/design-system/layout-grid.md
Write tests referencing docs/tests/test-cases/sprint-3/admin-ui-test-cases.md,
and once implementation is complete, run all tests and
report results to docs/tests/test-reports/."

---

## Feature 3: DB Naming Standard Fix (EMAIL→EML)

### 3.1 Design Prompt
(N/A — This is a tech debt fix, no blueprint needed.)

### 3.2 DB Design Reflection Prompt
/feature-dev "Update docs/database/database-design.md to fix 5 naming violations:
- TB_COMM_USER: USE_EMAIL → USE_EML
- TB_COMM_USER: EMAIL_VRFC_YN → EML_VRFC_YN
- TB_COMM_USER: EMAIL_VRFC_TKN → EML_VRFC_TKN
- TB_COMM_USER: EMAIL_VRFC_EXPR_DT → EML_VRFC_EXPR_DT
- TB_COMM_SCL_ACNT: SCL_EMAIL → SCL_EML
Follow public data standard terminology dictionary (금칙어: EMAIL → EML).
Do not modify any code yet."

### 3.3 Test Case Prompt
(N/A — Covered by existing auth test cases. Run existing tests after rename to verify.)

### 3.4 Implementation Prompt
/feature-dev "Rename all EMAIL occurrences to EML across the codebase to fix
public data standard naming violations:
- prisma/schema.prisma: Update @map() values (USE_EMAIL→USE_EML, EMAIL_VRFC_YN→EML_VRFC_YN, etc.)
- server/src/auth/auth.service.ts: Update Prisma field references (userEmail→useEml or update map only)
- server/src/admin/admin.service.ts: Update Prisma field references
- All DTOs and test files referencing email DB fields
- Keep Prisma model field names in camelCase (userEmail is fine as app-level name),
  only change the @map() DB column names
After renaming, run all existing tests (unit + E2E) to verify nothing breaks.
Report results to docs/tests/test-reports/."
