# 001-Auth: Authentication Module Blueprint

> Complete authentication system — email signup/login, JWT token management, social login (Google/Kakao/Naver), email verification, and password reset.

## 1. Overview

### 1.1 Purpose
Provide secure user authentication for the Vibe e-commerce platform. This module is the foundation for all subsequent features (Board, Chat) and must be implemented first.

### 1.2 Scope
- Email signup with validation and email verification
- Login with email + password (bcrypt)
- JWT access token (15 min) + refresh token (7 days) with rotation
- Logout (revoke refresh token)
- Password reset flow (forgot password → email link → reset)
- Social login (Google, Kakao, Naver) via OAuth 2.0
- Account linking (social email matches existing account)
- Login audit trail

### 1.3 Out of Scope
- Terms of service management (future sprint)
- Workspace management (future sprint)
- Admin user management (future sprint)
- Two-factor authentication (future sprint)

### 1.4 Tech Stack
| Layer | Technology |
|-------|-----------|
| Framework | NestJS (TypeScript) |
| ORM | Prisma (MongoDB Adapter) |
| Database | MongoDB 7 (replica set) |
| Auth | @nestjs/jwt, @nestjs/passport, passport-jwt |
| Password | bcrypt (12 salt rounds) |
| Validation | class-validator, class-transformer |
| OAuth | passport-google-oauth20, manual Kakao/Naver HTTP flows |
| Email | @nestjs-modules/mailer + nodemailer |

---

## 2. Architecture

### 2.1 Module Structure

```
src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.guard.ts                 # JwtAuthGuard
│   ├── strategies/
│   │   ├── jwt.strategy.ts           # Passport JWT strategy
│   │   └── jwt-refresh.strategy.ts   # Refresh token strategy
│   ├── dto/
│   │   ├── signup.dto.ts
│   │   ├── login.dto.ts
│   │   ├── refresh-token.dto.ts
│   │   ├── forgot-password.dto.ts
│   │   ├── reset-password.dto.ts
│   │   └── verify-email.dto.ts
│   ├── decorators/
│   │   ├── current-user.decorator.ts # Extract user from request
│   │   └── public.decorator.ts       # Mark route as public (no auth)
│   ├── social/
│   │   ├── social-auth.controller.ts
│   │   ├── social-auth.service.ts
│   │   └── providers/
│   │       ├── google.provider.ts
│   │       ├── kakao.provider.ts
│   │       └── naver.provider.ts
│   └── interfaces/
│       ├── jwt-payload.interface.ts
│       └── oauth-profile.interface.ts
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── common/
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── interceptors/
│   │   └── response.interceptor.ts   # Wraps { success, data, error }
│   ├── guards/
│   │   └── throttle.guard.ts
│   └── interfaces/
│       └── api-response.interface.ts
└── mail/
    ├── mail.module.ts
    └── mail.service.ts
```

### 2.2 Dependency Flow

```
AuthController → AuthService → PrismaService
                             → JwtService
                             → MailService (email verification, password reset)
                             → bcrypt (password hashing)

SocialAuthController → SocialAuthService → AuthService (token generation)
                                         → Google/Kakao/Naver providers
                                         → PrismaService
```

### 2.3 Global Middleware & Guards

| Component | Purpose | Scope |
|-----------|---------|-------|
| `JwtAuthGuard` | Validate access token on protected routes | Global (with `@Public()` bypass) |
| `ThrottleGuard` | Rate limiting per endpoint | Global |
| `HttpExceptionFilter` | Standardize error responses | Global |
| `ResponseInterceptor` | Wrap responses in `{ success, data }` format | Global |

---

## 3. Database Schema

> Full schema defined in `docs/database/database-design.md` (SSoT). This section summarizes Auth-relevant collections.

### 3.1 Collections

| Collection | Prisma Model | Purpose |
|-----------|-------------|---------|
| `TB_COMM_USER` | User | User accounts |
| `TB_COMM_SCL_ACNT` | SocialAccount | Linked social accounts |
| `TB_COMM_RFRSH_TKN` | RefreshToken | Refresh token store (hashed) |
| `TL_COMM_LGN_LOG` | LoginLog | Login audit trail |

### 3.2 Key Fields — TB_COMM_USER

| Field | Prisma | Type | Notes |
|-------|--------|------|-------|
| USER_EMAIL | userEmail | String (unique) | Primary login identifier |
| USER_PSWD | userPswd | String? | bcrypt hash. Null for social-only users |
| USER_NM | userNm | String | Display name |
| USER_NCNM | userNcnm | String? (unique) | Nickname |
| USER_STTS_CD | userSttsCd | String | ACTV / INAC / SUSP |
| EMAIL_VRFC_YN | emailVrfcYn | String | Y / N |
| EMAIL_VRFC_TKN | emailVrfcTkn | String? | Verification token (UUID) |
| EMAIL_VRFC_EXPR_DT | emailVrfcExprDt | DateTime? | Token expiry (24 hours) |

### 3.3 Key Fields — TB_COMM_RFRSH_TKN

| Field | Prisma | Type | Notes |
|-------|--------|------|-------|
| TKN_VAL | tknVal | String (unique) | SHA-256 hash of token |
| EXPR_DT | exprDt | DateTime | TTL index — auto-delete on expiry |
| RVKD_YN | rvkdYn | String | Y = revoked |
| CLNT_IP_ADDR | clntIpAddr | String | Client IP for audit |
| USER_AGNT | userAgnt | String? | Browser user-agent |

### 3.4 Password Reset Fields (TB_COMM_USER)

| Field | Prisma | Type | Notes |
|-------|--------|------|-------|
| PSWD_RST_TKN | pswdRstTkn | String? | Password reset token (UUID) |
| PSWD_RST_EXPR_DT | pswdRstExprDt | DateTime? | Reset token expiry (1 hour) |

> Added to `docs/database/database-design.md` in Step 1.2. Prisma schema update pending (Step 1.4).

---

## 4. API Endpoints

### 4.1 Email Authentication

All endpoints prefixed with `/api/auth`.

#### POST /api/auth/signup

Create a new user account with email + password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "P@ssw0rd123",
  "name": "John Doe",
  "nickname": "johndoe"
}
```

**Validation Rules:**
| Field | Rule |
|-------|------|
| email | Required, valid RFC 5322 format, max 100 chars |
| password | Required, min 8 chars, must contain uppercase + lowercase + number + special char |
| name | Required, max 50 chars |
| nickname | Optional, 2~30 chars, Korean/English/numbers/underscore only, unique |

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "665a1b2c3d4e5f6a7b8c9d0e",
      "email": "user@example.com",
      "name": "John Doe",
      "nickname": "johndoe",
      "emailVerified": false
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

**Error Responses:**
| Status | Code | Condition |
|--------|------|-----------|
| 400 | VALIDATION_ERROR | Invalid input fields |
| 409 | EMAIL_ALREADY_EXISTS | Duplicate email |
| 409 | NICKNAME_ALREADY_EXISTS | Duplicate nickname |

**Flow:**
1. Validate input (class-validator)
2. Check email uniqueness
3. Check nickname uniqueness (if provided)
4. Hash password with bcrypt (12 rounds)
5. Create user record (USER_STTS_CD: ACTV, EMAIL_VRFC_YN: N)
6. Generate email verification token (UUID v4, 24-hour expiry)
7. Send verification email asynchronously
8. Generate JWT access + refresh tokens
9. Store refresh token hash in DB
10. Log login event (TL_COMM_LGN_LOG, method: EMAIL, result: SUCC)
11. Return user + tokens

---

#### POST /api/auth/login

Authenticate with email + password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "P@ssw0rd123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "665a1b2c3d4e5f6a7b8c9d0e",
      "email": "user@example.com",
      "name": "John Doe",
      "nickname": "johndoe",
      "emailVerified": true,
      "profileImageUrl": null
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

**Error Responses:**
| Status | Code | Condition |
|--------|------|-----------|
| 401 | INVALID_CREDENTIALS | Wrong email or password |
| 403 | ACCOUNT_SUSPENDED | User status is SUSP |
| 403 | ACCOUNT_INACTIVE | User status is INAC |

**Flow:**
1. Validate input
2. Find user by email (filter: DEL_YN = N)
3. If not found → 401 INVALID_CREDENTIALS
4. If user has no password (social-only) → 401 INVALID_CREDENTIALS
5. Compare password with bcrypt
6. If mismatch → log failed attempt, return 401
7. Check user status (ACTV required)
8. Update LST_LGN_DT
9. Generate JWT access + refresh tokens
10. Store refresh token hash in DB
11. Log login event (SUCC)
12. Return user + tokens

---

#### POST /api/auth/logout

Revoke the current refresh token.

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": null
}
```

**Flow:**
1. Validate access token (JWT guard)
2. Hash the provided refresh token (SHA-256)
3. Find matching token in DB
4. Set RVKD_YN = Y
5. Return success

---

#### POST /api/auth/refresh

Exchange a valid refresh token for new access + refresh tokens (token rotation).

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Decoration:** `@Public()` — no access token required.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

**Error Responses:**
| Status | Code | Condition |
|--------|------|-----------|
| 401 | INVALID_REFRESH_TOKEN | Token not found, expired, or revoked |
| 401 | TOKEN_REUSE_DETECTED | Already-revoked token used (potential attack) |

**Flow:**
1. Verify refresh token JWT signature + expiry
2. Hash the token (SHA-256), look up in DB
3. If not found or RVKD_YN = Y → check for token reuse attack
4. If token reuse detected: revoke ALL user's refresh tokens (security measure)
5. Revoke current refresh token (RVKD_YN = Y)
6. Generate new access + refresh tokens
7. Store new refresh token hash in DB
8. Return new tokens

> **Token Rotation Security:** If a revoked token is reused, all of the user's sessions are terminated. This prevents replay attacks even if a token is stolen.

---

#### POST /api/auth/verify-email

Verify email address using the token sent via email.

**Request Body:**
```json
{
  "token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Decoration:** `@Public()`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Email verified successfully"
  }
}
```

**Error Responses:**
| Status | Code | Condition |
|--------|------|-----------|
| 400 | INVALID_VERIFICATION_TOKEN | Token not found |
| 400 | VERIFICATION_TOKEN_EXPIRED | Token past expiry |
| 400 | EMAIL_ALREADY_VERIFIED | Already verified |

**Flow:**
1. Find user by EMAIL_VRFC_TKN
2. Check EMAIL_VRFC_EXPR_DT > now
3. Set EMAIL_VRFC_YN = Y
4. Clear EMAIL_VRFC_TKN and EMAIL_VRFC_EXPR_DT
5. Return success

---

#### POST /api/auth/forgot-password

Send a password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Decoration:** `@Public()`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "If an account with that email exists, a reset link has been sent"
  }
}
```

> Always returns success (200) regardless of whether the email exists, to prevent email enumeration.

**Flow:**
1. Find user by email
2. If not found → return success (no leak)
3. If user is social-only (no password) → return success (no leak)
4. Generate reset token (UUID v4, 1-hour expiry)
5. Store PSWD_RST_TKN + PSWD_RST_EXPR_DT
6. Send reset email asynchronously
7. Return success

---

#### POST /api/auth/reset-password

Reset password using the token from the email.

**Request Body:**
```json
{
  "token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "newPassword": "N3wP@ssw0rd!"
}
```

**Decoration:** `@Public()`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Password reset successfully"
  }
}
```

**Error Responses:**
| Status | Code | Condition |
|--------|------|-----------|
| 400 | INVALID_RESET_TOKEN | Token not found |
| 400 | RESET_TOKEN_EXPIRED | Token past expiry |
| 400 | VALIDATION_ERROR | Password doesn't meet requirements |

**Flow:**
1. Find user by PSWD_RST_TKN
2. Check PSWD_RST_EXPR_DT > now
3. Hash new password with bcrypt
4. Update USER_PSWD
5. Clear PSWD_RST_TKN and PSWD_RST_EXPR_DT
6. Revoke ALL existing refresh tokens for this user
7. Return success

---

### 4.2 Social Login

#### GET /api/auth/social/:provider

Redirect user to the OAuth provider's consent screen.

**Path Params:** `provider` — one of `google`, `kakao`, `naver`

**Flow:**
1. Validate provider name
2. Generate OAuth state token (CSRF protection)
3. Build authorization URL with scopes:
   - Google: `openid email profile`
   - Kakao: `profile_nickname profile_image account_email`
   - Naver: `name email profile_image`
4. Redirect (302) to provider authorization URL

---

#### GET /api/auth/social/:provider/callback

Handle OAuth callback after user grants consent.

**Query Params:** `code` (authorization code), `state` (CSRF token)

**Success:** Redirect to frontend with tokens:
```
{frontendUrl}/auth/social/callback?accessToken={token}&refreshToken={token}
```

**Error:** Redirect to frontend with error:
```
{frontendUrl}/auth/social/callback?error={errorCode}
```

**Flow:**
1. Validate state token (CSRF check)
2. Exchange authorization code for access token with provider
3. Fetch user profile from provider API
4. Extract: email, name, provider user ID, profile image URL
5. Look up existing social account by (provider, providerUserId)
6. **If social account exists:** → login that user
7. **If no social account but email matches existing user:** → link account
8. **If no match at all:** → create new user + social account
9. Generate JWT access + refresh tokens
10. Store refresh token hash in DB
11. Log login event (method: GOOGLE/KAKAO/NAVER, result: SUCC)
12. Redirect to frontend with tokens

---

### 4.3 OAuth Provider Details

#### Google OAuth 2.0

| Item | Value |
|------|-------|
| Auth URL | `https://accounts.google.com/o/oauth2/v2/auth` |
| Token URL | `https://oauth2.googleapis.com/token` |
| Profile URL | `https://www.googleapis.com/oauth2/v2/userinfo` |
| Scopes | `openid email profile` |
| Grant Type | Authorization Code |

**Profile Response Mapping:**
```
googleId     → SCL_PRVD_USER_ID
email        → SCL_EMAIL, USER_EMAIL (if new user)
name         → USER_NM (if new user)
picture      → SCL_PRFL_IMG_URL
```

#### Kakao OAuth

| Item | Value |
|------|-------|
| Auth URL | `https://kauth.kakao.com/oauth/authorize` |
| Token URL | `https://kauth.kakao.com/oauth/token` |
| Profile URL | `https://kapi.kakao.com/v2/user/me` |
| Scopes | `profile_nickname profile_image account_email` |
| Grant Type | Authorization Code |

**Profile Response Mapping:**
```
id                                    → SCL_PRVD_USER_ID
kakao_account.email                   → SCL_EMAIL, USER_EMAIL
kakao_account.profile.nickname        → USER_NM
kakao_account.profile.profile_image_url → SCL_PRFL_IMG_URL
```

#### Naver OAuth

| Item | Value |
|------|-------|
| Auth URL | `https://nid.naver.com/oauth2.0/authorize` |
| Token URL | `https://nid.naver.com/oauth2.0/token` |
| Profile URL | `https://openapi.naver.com/v1/nid/me` |
| Scopes | (default — name, email, profile image) |
| Grant Type | Authorization Code |

**Profile Response Mapping:**
```
response.id              → SCL_PRVD_USER_ID
response.email           → SCL_EMAIL, USER_EMAIL
response.name            → USER_NM
response.profile_image   → SCL_PRFL_IMG_URL
```

---

## 5. JWT Token Strategy

### 5.1 Token Configuration

| Token | Algorithm | Expiry | Storage |
|-------|-----------|--------|---------|
| Access Token | HS256 | 15 minutes | Client (memory or cookie) |
| Refresh Token | HS256 | 7 days | Client + DB (SHA-256 hash) |

### 5.2 Access Token Payload

```json
{
  "sub": "665a1b2c3d4e5f6a7b8c9d0e",
  "email": "user@example.com",
  "type": "access",
  "iat": 1738828800,
  "exp": 1738829700
}
```

### 5.3 Refresh Token Payload

```json
{
  "sub": "665a1b2c3d4e5f6a7b8c9d0e",
  "type": "refresh",
  "iat": 1738828800,
  "exp": 1739433600
}
```

### 5.4 Token Rotation

Every successful token refresh:
1. Old refresh token is revoked (RVKD_YN = Y)
2. New access + refresh token pair issued
3. New refresh token hash stored in DB
4. If a revoked token is reused → revoke ALL user tokens (breach detection)

### 5.5 Environment Variables

```env
JWT_SECRET=<256-bit-random-secret>
JWT_ACCESS_EXPIRATION=900        # 15 minutes in seconds
JWT_REFRESH_EXPIRATION=604800    # 7 days in seconds
```

---

## 6. Security

### 6.1 Password Security

| Measure | Implementation |
|---------|---------------|
| Hashing | bcrypt, 12 salt rounds |
| Strength | Min 8 chars, upper + lower + number + special |
| Comparison | bcrypt.compare (constant-time) |
| Storage | Only hash stored, never plaintext |

### 6.2 Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /api/auth/login | 5 requests | 15 minutes |
| POST /api/auth/signup | 3 requests | 1 hour |
| POST /api/auth/refresh | 10 requests | 1 minute |
| POST /api/auth/forgot-password | 3 requests | 1 hour |
| POST /api/auth/reset-password | 5 requests | 1 hour |

Implementation: `@nestjs/throttler` with custom `ThrottleGuard`.

### 6.3 Security Headers

Applied via NestJS middleware or helmet:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 0` (rely on CSP instead)
- `Strict-Transport-Security: max-age=31536000` (production)

### 6.4 Input Validation

- All DTOs validated via `class-validator` decorators
- Email: `@IsEmail()` + max length 100
- Password: custom validator (strength rules)
- Nickname: `@Matches(/^[a-zA-Z0-9가-힣_]{2,30}$/)` (Korean/English/numbers/underscore)
- All string inputs trimmed and sanitized

### 6.5 Protection Against Common Attacks

| Attack | Mitigation |
|--------|-----------|
| Brute force | Rate limiting + login log monitoring |
| Token replay | Refresh token rotation + reuse detection |
| Email enumeration | Forgot-password always returns 200 |
| Timing attack | bcrypt.compare is constant-time |
| NoSQL injection | Prisma parameterized queries (no raw queries) |
| XSS in nickname | Input validation regex, response sanitization |

---

## 7. Error Handling

### 7.1 Standard Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable description"
}
```

### 7.2 Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| VALIDATION_ERROR | 400 | Input validation failed |
| INVALID_CREDENTIALS | 401 | Wrong email or password |
| INVALID_REFRESH_TOKEN | 401 | Refresh token invalid/expired/revoked |
| TOKEN_REUSE_DETECTED | 401 | Revoked refresh token reused (breach) |
| INVALID_VERIFICATION_TOKEN | 400 | Email verification token invalid |
| VERIFICATION_TOKEN_EXPIRED | 400 | Email verification token expired |
| EMAIL_ALREADY_VERIFIED | 400 | Email already verified |
| INVALID_RESET_TOKEN | 400 | Password reset token invalid |
| RESET_TOKEN_EXPIRED | 400 | Password reset token expired |
| ACCOUNT_SUSPENDED | 403 | Account is suspended |
| ACCOUNT_INACTIVE | 403 | Account is inactive |
| EMAIL_ALREADY_EXISTS | 409 | Email already registered |
| NICKNAME_ALREADY_EXISTS | 409 | Nickname already taken |
| INVALID_OAUTH_STATE | 400 | OAuth CSRF state mismatch |
| OAUTH_PROVIDER_ERROR | 502 | OAuth provider API failure |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |

### 7.3 Business vs System Exceptions

| Type | Class | Logging |
|------|-------|---------|
| Business | `BusinessException` (extends HttpException) | Warn level |
| System | Unhandled exceptions caught by filter | Error level + stack trace |

---

## 8. Email Templates

### 8.1 Email Verification

**Subject:** `[Vibe] Verify your email address`

**Content:**
- Welcome message with user's name
- Verification link: `{frontendUrl}/auth/verify-email?token={token}`
- Token validity: 24 hours
- Fallback: text with manual token entry

### 8.2 Password Reset

**Subject:** `[Vibe] Reset your password`

**Content:**
- Reset link: `{frontendUrl}/auth/reset-password?token={token}`
- Token validity: 1 hour
- Security warning: "If you didn't request this, ignore this email"

### 8.3 Email Configuration

```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=noreply@vibe.com
MAIL_PASSWORD=<app-password>
MAIL_FROM="Vibe <noreply@vibe.com>"
FRONTEND_URL=http://localhost:3000
```

---

## 9. Login Audit Trail

Every authentication attempt is logged to `TL_COMM_LGN_LOG`:

| Event | LGN_MTHD_CD | LGN_RSLT_CD | FAIL_RSN |
|-------|-------------|-------------|----------|
| Email login success | EMAIL | SUCC | null |
| Email login failed | EMAIL | FAIL | "Invalid credentials" |
| Google login success | GOOGLE | SUCC | null |
| Kakao login success | KAKAO | SUCC | null |
| Naver login success | NAVER | SUCC | null |
| Social login failed | {provider} | FAIL | "OAuth error: {details}" |
| Suspended account login | EMAIL | FAIL | "Account suspended" |

Logs auto-delete after 90 days (MongoDB TTL index on LGN_DT).

---

## 10. Account Linking Logic

When a social login callback provides an email:

```
1. Find social account by (SCL_PRVD_CD, SCL_PRVD_USER_ID)
   ├── Found → Login as that user
   └── Not Found
       ├── Find user by email (USER_EMAIL)
       │   ├── Found → Create social account linked to existing user
       │   │           (auto-link, user gets social login on next attempt)
       │   └── Not Found → Create new user + social account
       └── Continue with token generation
```

**Auto-link rules:**
- Social email must exactly match USER_EMAIL
- User must have DEL_YN = N
- Social account record created with LNKD_DT = now
- No password required for social-only users (USER_PSWD = null)

---

## 11. Environment Variables Summary

```env
# Database
DATABASE_URL="mongodb://localhost:27017/demo-vibe?replicaSet=rs0"

# JWT
JWT_SECRET=<256-bit-random-secret>
JWT_ACCESS_EXPIRATION=900
JWT_REFRESH_EXPIRATION=604800

# OAuth — Google
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/social/google/callback

# OAuth — Kakao
KAKAO_CLIENT_ID=<kakao-rest-api-key>
KAKAO_CLIENT_SECRET=<kakao-client-secret>
KAKAO_CALLBACK_URL=http://localhost:4000/api/auth/social/kakao/callback

# OAuth — Naver
NAVER_CLIENT_ID=<naver-client-id>
NAVER_CLIENT_SECRET=<naver-client-secret>
NAVER_CALLBACK_URL=http://localhost:4000/api/auth/social/naver/callback

# Email
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=<email>
MAIL_PASSWORD=<app-password>
MAIL_FROM="Vibe <noreply@vibe.com>"

# Frontend
FRONTEND_URL=http://localhost:3000
```

---

## 12. Non-Functional Requirements

| Requirement | Target |
|------------|--------|
| Login API response time | < 200ms (p95) |
| Token refresh response time | < 100ms (p95) |
| Password hashing time | ~250ms (bcrypt 12 rounds) |
| Concurrent logins supported | 1,000+ |
| Refresh token cleanup | Automatic via MongoDB TTL index |
| Login log retention | 90 days (TTL index) |

---

## 13. Testing Strategy

Reference: `docs/tests/test-strategy.md`

### 13.1 Unit Tests

| Target | Test Cases |
|--------|-----------|
| AuthService.signup | Valid input, duplicate email, duplicate nickname, password hashing |
| AuthService.login | Valid credentials, wrong password, nonexistent email, suspended account |
| AuthService.refreshToken | Valid refresh, expired token, revoked token, token reuse detection |
| AuthService.verifyEmail | Valid token, expired token, already verified |
| AuthService.forgotPassword | Existing email, nonexistent email (no leak), social-only user |
| AuthService.resetPassword | Valid reset, expired token, password validation |
| SocialAuthService | Profile extraction per provider, account linking logic |
| JWT generation | Correct payload, correct expiry |
| Password validation | Strength rules |

### 13.2 Integration Tests

| Flow | Test Cases |
|------|-----------|
| Full signup flow | Signup → verify email → login → access protected route |
| Login flow | Login → get tokens → refresh → logout |
| Social login | OAuth callback → new user creation → subsequent login |
| Account linking | Email signup → Google login with same email → accounts linked |
| Token rotation | Refresh → old token revoked → reuse old token → all tokens revoked |
| Password reset | Forgot password → reset → login with new password |

### 13.3 Edge Cases

- Login with social-only account using email/password → 401
- Signup with email that has a linked social account → 409
- Multiple rapid refresh requests (race condition)
- Expired email verification → request new verification
- OAuth provider API timeout → 502
- Rate limit exceeded → 429

---

## 14. Implementation Sequence

| Step | Task | Dependencies |
|------|------|-------------|
| 1 | Set up PrismaModule + PrismaService | None |
| 2 | Create global exception filter + response interceptor | None |
| 3 | Implement AuthService (signup, login, token generation) | PrismaModule |
| 4 | Implement JwtStrategy + JwtAuthGuard | AuthService |
| 5 | Implement AuthController (signup, login, logout, refresh) | AuthService, Guards |
| 6 | Implement MailService + email verification | AuthService |
| 7 | Implement password reset flow | AuthService, MailService |
| 8 | Implement rate limiting (ThrottlerModule) | None |
| 9 | Implement social OAuth providers (Google, Kakao, Naver) | None |
| 10 | Implement SocialAuthService + Controller | OAuth Providers, AuthService |
| 11 | Implement account linking logic | SocialAuthService |
| 12 | Write unit tests | Steps 1-11 |
| 13 | Write integration tests | Steps 1-11 |
| 14 | Run all tests + generate report | Steps 12-13 |
