# Sprint 1 Prompt Map

## Sprint Goal
Build a complete authentication module — signup (email + social), login/logout, JWT token management, and email verification. This forms the foundation for all subsequent features (Board, Chat).

## Feature 1: Auth — Email Signup & Login

### 1.1 Design Prompt
/feature-dev "Write the design document for the Auth module
to docs/blueprints/001-auth/blueprint.md.
Requirements:
- Email signup with validation (email format, password strength, nickname uniqueness)
- Email verification flow (send token, verify link, expiry handling)
- Login with email + password (bcrypt comparison)
- JWT access token (15min) + refresh token (7 days) with rotation
- Logout (revoke refresh token)
- Password reset flow (forgot password → email link → reset)
- API endpoints: POST /auth/signup, POST /auth/login, POST /auth/logout, POST /auth/refresh, POST /auth/verify-email, POST /auth/forgot-password, POST /auth/reset-password
- Error handling: duplicate email, invalid credentials, expired token, rate limiting
- Refer to docs/database/database-design.md for DB schema (TB_COMM_USER, TB_COMM_RFRSH_TKN, TL_COMM_LGN_LOG).
Do not modify any code yet."

### 1.2 DB Design Reflection Prompt
/feature-dev "Review and update the Auth module tables in
docs/database/database-design.md:
- TB_COMM_USER (verify all fields match blueprint requirements)
- TB_COMM_RFRSH_TKN (token rotation fields)
- TL_COMM_LGN_LOG (login audit trail)
- Add password reset fields if needed (reset token, expiry)
- Update the ERD and index strategy accordingly.
Follow standard terminology dictionary.
Do not modify any code yet."

### 1.3 Test Case Prompt
/feature-dev "Based on docs/blueprints/001-auth/blueprint.md,
write test cases to docs/tests/test-cases/sprint-1/auth-test-cases.md.
Use Given-When-Then format. Cover:
- Unit tests: password hashing, JWT generation/validation, email format validation
- Integration tests: signup flow, login flow, token refresh, logout
- Edge cases: duplicate email, wrong password, expired token, invalid refresh token, rate limit exceeded
- Security: SQL injection in email field, XSS in nickname, brute force login
Do not modify any code yet."

### 1.4 Implementation Prompt
/feature-dev "Strictly follow docs/blueprints/001-auth/blueprint.md and
docs/database/database-design.md to implement the Auth module.
Tech stack: NestJS + Prisma (MongoDB adapter) + JWT (@nestjs/jwt).
Structure:
- src/auth/ module (controller, service, guard, strategy, dto)
- src/prisma/ module (PrismaService)
- src/common/ (filters, interceptors, decorators)
Write tests referencing docs/tests/test-cases/sprint-1/auth-test-cases.md.
Once implementation is complete, run all tests and
report results to docs/tests/test-reports/sprint-1-auth-report.md."

## Feature 2: Auth — Social Login (Google, Kakao, Naver)

### 2.1 Design Prompt
/feature-dev "Extend the Auth blueprint at docs/blueprints/001-auth/blueprint.md
with a Social Login section. Requirements:
- Google OAuth 2.0 login (authorization code flow)
- Kakao OAuth login
- Naver OAuth login
- Account linking: if social email matches existing account, link automatically
- First-time social login: auto-create user with social profile data
- API endpoints: GET /auth/social/{provider}, GET /auth/social/{provider}/callback
- Store social accounts in TB_COMM_SCL_ACNT
- Refer to docs/database/database-design.md for schema.
Do not modify any code yet."

### 2.2 DB Design Reflection Prompt
/feature-dev "Verify TB_COMM_SCL_ACNT in docs/database/database-design.md
covers all fields needed for Google/Kakao/Naver social login.
Check the compound unique index on (SCL_PRVD_CD, SCL_PRVD_USER_ID).
Do not modify any code yet."

### 2.3 Test Case Prompt
/feature-dev "Extend docs/tests/test-cases/sprint-1/auth-test-cases.md
with social login test cases. Cover:
- Unit tests: OAuth token exchange, profile extraction per provider
- Integration tests: social signup (new user), social login (existing user), account linking
- Edge cases: revoked OAuth token, mismatched email, provider API timeout
Do not modify any code yet."

### 2.4 Implementation Prompt
/feature-dev "Strictly follow docs/blueprints/001-auth/blueprint.md (Social Login section)
and docs/database/database-design.md to implement social login.
Add to the existing src/auth/ module:
- OAuth strategies for Google, Kakao, Naver (using passport or manual flow)
- Social account service for TB_COMM_SCL_ACNT operations
- Account linking logic
Write tests referencing docs/tests/test-cases/sprint-1/auth-test-cases.md.
Run all tests and append results to docs/tests/test-reports/sprint-1-auth-report.md."
