# Auth Module Test Cases — Sprint 1

> Based on `docs/blueprints/001-auth/blueprint.md`
> Format: Given-When-Then
> Naming convention: `{module}.{layer}.spec.ts`

---

## 1. Unit Tests

### 1.1 Password Hashing (`auth.service.spec.ts`)

#### TC-U-001: Hash password with bcrypt

- **Priority**: P0
- **Given**: A plain text password `"P@ssw0rd123"`
- **When**: The password is hashed using bcrypt with 12 salt rounds
- **Then**: The result is a string starting with `$2b$12$` and is 60 characters long

#### TC-U-002: Verify correct password matches hash

- **Priority**: P0
- **Given**: A password `"P@ssw0rd123"` and its bcrypt hash
- **When**: bcrypt.compare is called with the correct password
- **Then**: The result is `true`

#### TC-U-003: Verify wrong password does not match hash

- **Priority**: P0
- **Given**: A password hash for `"P@ssw0rd123"`
- **When**: bcrypt.compare is called with `"WrongPassword1!"`
- **Then**: The result is `false`

#### TC-U-004: Different hashes for same password (salt uniqueness)

- **Priority**: P1
- **Given**: A password `"P@ssw0rd123"`
- **When**: The password is hashed twice
- **Then**: The two hashes are different (unique salt per hash)

---

### 1.2 JWT Generation & Validation (`auth.service.spec.ts`)

#### TC-U-010: Generate access token with correct payload

- **Priority**: P0
- **Given**: A user with id `"665a1b2c3d4e5f6a7b8c9d0e"` and email `"user@example.com"`
- **When**: An access token is generated
- **Then**: The decoded payload contains `sub`, `email`, `type: "access"`, `iat`, `exp` and `exp - iat = 900` (15 minutes)

#### TC-U-011: Generate refresh token with correct payload

- **Priority**: P0
- **Given**: A user with id `"665a1b2c3d4e5f6a7b8c9d0e"`
- **When**: A refresh token is generated
- **Then**: The decoded payload contains `sub`, `type: "refresh"`, `iat`, `exp` and `exp - iat = 604800` (7 days)

#### TC-U-012: Verify valid access token

- **Priority**: P0
- **Given**: A valid access token signed with JWT_SECRET
- **When**: The token is verified
- **Then**: The decoded payload is returned with correct `sub` and `email`

#### TC-U-013: Reject expired access token

- **Priority**: P0
- **Given**: An access token with `exp` set to 1 second ago
- **When**: The token is verified
- **Then**: A `TokenExpiredError` is thrown

#### TC-U-014: Reject token with invalid signature

- **Priority**: P0
- **Given**: A token signed with a different secret
- **When**: The token is verified with the correct JWT_SECRET
- **Then**: A `JsonWebTokenError` is thrown

#### TC-U-015: Reject refresh token used as access token

- **Priority**: P1
- **Given**: A valid refresh token (`type: "refresh"`)
- **When**: It is used to authenticate an API request (JwtStrategy checks `type: "access"`)
- **Then**: Authentication fails with 401

---

### 1.3 Email Format Validation (`signup.dto.spec.ts`)

#### TC-U-020: Accept valid email formats

- **Priority**: P0
- **Given**: Emails: `"user@example.com"`, `"test.user+tag@domain.co.kr"`, `"a@b.cd"`
- **When**: Each is validated via the SignupDto
- **Then**: All pass validation

#### TC-U-021: Reject invalid email formats

- **Priority**: P0
- **Given**: Emails: `""`, `"notanemail"`, `"@domain.com"`, `"user@"`, `"user@.com"`, `"user@domain"`, `"a@b.c"`
- **When**: Each is validated via the SignupDto
- **Then**: All fail with VALIDATION_ERROR

#### TC-U-022: Reject email exceeding max length

- **Priority**: P1
- **Given**: An email string of 101 characters (valid format but too long)
- **When**: Validated via the SignupDto
- **Then**: Fails with VALIDATION_ERROR

---

### 1.4 Password Strength Validation (`signup.dto.spec.ts`)

#### TC-U-030: Accept strong password

- **Priority**: P0
- **Given**: Password `"P@ssw0rd123"` (uppercase + lowercase + number + special char, 11 chars)
- **When**: Validated via the SignupDto
- **Then**: Passes validation

#### TC-U-031: Reject password without uppercase

- **Priority**: P0
- **Given**: Password `"p@ssw0rd123"` (no uppercase)
- **When**: Validated via the SignupDto
- **Then**: Fails with VALIDATION_ERROR

#### TC-U-032: Reject password without lowercase

- **Priority**: P0
- **Given**: Password `"P@SSW0RD123"` (no lowercase)
- **When**: Validated via the SignupDto
- **Then**: Fails with VALIDATION_ERROR

#### TC-U-033: Reject password without number

- **Priority**: P0
- **Given**: Password `"P@sswordAbc"` (no number)
- **When**: Validated via the SignupDto
- **Then**: Fails with VALIDATION_ERROR

#### TC-U-034: Reject password without special character

- **Priority**: P0
- **Given**: Password `"Passw0rd123"` (no special char)
- **When**: Validated via the SignupDto
- **Then**: Fails with VALIDATION_ERROR

#### TC-U-035: Reject password shorter than 8 characters

- **Priority**: P0
- **Given**: Password `"P@ss1a"` (6 chars)
- **When**: Validated via the SignupDto
- **Then**: Fails with VALIDATION_ERROR

---

### 1.5 Nickname Validation (`signup.dto.spec.ts`)

#### TC-U-040: Accept valid nicknames

- **Priority**: P1
- **Given**: Nicknames: `"johndoe"`, `"user_123"`, `"hello"`, 30-char valid string
- **When**: Validated via the SignupDto
- **Then**: All pass validation

#### TC-U-041: Reject nickname with invalid characters

- **Priority**: P1
- **Given**: Nicknames: `"john doe"` (space), `"john@doe"` (special char), `"john-doe"` (hyphen)
- **When**: Validated via the SignupDto
- **Then**: All fail with VALIDATION_ERROR

#### TC-U-042: Reject nickname shorter than 2 or longer than 30 characters

- **Priority**: P1
- **Given**: Nicknames: `"a"` (1 char), 31-char string
- **When**: Validated via the SignupDto
- **Then**: Both fail with VALIDATION_ERROR

---

### 1.6 Refresh Token Hash (`auth.service.spec.ts`)

#### TC-U-050: SHA-256 hash of refresh token is stored in DB

- **Priority**: P0
- **Given**: A refresh token JWT string
- **When**: The token is hashed with SHA-256
- **Then**: The hash is a 64-character hex string and is deterministic (same input → same hash)

---

## 2. Integration Tests

### 2.1 Signup Flow (`auth.controller.spec.ts`)

#### TC-I-001: Successful signup with email

- **Priority**: P0
- **Given**: No existing user with email `"newuser@example.com"`
- **When**: POST `/api/auth/signup` with `{ email: "newuser@example.com", password: "P@ssw0rd123", name: "New User", nickname: "newuser" }`
- **Then**:
  - Response status is 201
  - Response body has `success: true`
  - `data.user.email` equals `"newuser@example.com"`
  - `data.user.emailVerified` equals `false`
  - `data.accessToken` and `data.refreshToken` are non-empty strings
  - `data.expiresIn` equals 900
  - User record exists in DB with `USER_STTS_CD: "ACTV"`, `EMAIL_VRFC_YN: "N"`
  - Refresh token hash exists in DB (TB_COMM_RFRSH_TKN)
  - Login log exists with `LGN_MTHD_CD: "EMAIL"`, `LGN_RSLT_CD: "SUCC"`

#### TC-I-002: Signup without nickname (optional field)

- **Priority**: P1
- **Given**: No existing user with email `"noname@example.com"`
- **When**: POST `/api/auth/signup` with `{ email: "noname@example.com", password: "P@ssw0rd123", name: "No Name" }` (no nickname)
- **Then**: Response status is 201, `data.user.nickname` is `null`

#### TC-I-003: Signup sends email verification

- **Priority**: P1
- **Given**: A valid signup request
- **When**: POST `/api/auth/signup`
- **Then**: User record has `EMAIL_VRFC_TKN` (non-null UUID) and `EMAIL_VRFC_EXPR_DT` (24 hours from now)

---

### 2.2 Login Flow (`auth.controller.spec.ts`)

#### TC-I-010: Successful login with correct credentials

- **Priority**: P0
- **Given**: An existing user with email `"user@example.com"` and password `"P@ssw0rd123"`
- **When**: POST `/api/auth/login` with `{ email: "user@example.com", password: "P@ssw0rd123" }`
- **Then**:
  - Response status is 200
  - `data.accessToken` and `data.refreshToken` are present
  - `data.user.email` equals `"user@example.com"`
  - User's `LST_LGN_DT` is updated
  - Login log created with `LGN_RSLT_CD: "SUCC"`

#### TC-I-011: Login updates last login datetime

- **Priority**: P1
- **Given**: An existing user with `LST_LGN_DT` of yesterday
- **When**: POST `/api/auth/login` with valid credentials
- **Then**: `LST_LGN_DT` is updated to approximately now

---

### 2.3 Token Refresh (`auth.controller.spec.ts`)

#### TC-I-020: Successful token refresh (rotation)

- **Priority**: P0
- **Given**: A user with a valid refresh token stored in DB
- **When**: POST `/api/auth/refresh` with `{ refreshToken: "{valid_refresh_token}" }`
- **Then**:
  - Response status is 200
  - New `accessToken` and `refreshToken` are returned
  - Old refresh token is revoked in DB (`RVKD_YN: "Y"`)
  - New refresh token hash is stored in DB

#### TC-I-021: Refresh token is a public endpoint (no access token required)

- **Priority**: P1
- **Given**: A valid refresh token
- **When**: POST `/api/auth/refresh` without Authorization header
- **Then**: Response status is 200 (not 401)

---

### 2.4 Logout (`auth.controller.spec.ts`)

#### TC-I-030: Successful logout revokes refresh token

- **Priority**: P0
- **Given**: An authenticated user with a valid refresh token
- **When**: POST `/api/auth/logout` with `{ refreshToken: "{token}" }` and Authorization header
- **Then**:
  - Response status is 200
  - Refresh token in DB has `RVKD_YN: "Y"`

#### TC-I-031: Logout without Authorization header returns 401

- **Priority**: P1
- **Given**: A valid refresh token
- **When**: POST `/api/auth/logout` without Authorization header
- **Then**: Response status is 401

---

### 2.5 Email Verification (`auth.controller.spec.ts`)

#### TC-I-040: Successful email verification

- **Priority**: P0
- **Given**: A user with `EMAIL_VRFC_YN: "N"` and a valid `EMAIL_VRFC_TKN`
- **When**: POST `/api/auth/verify-email` with `{ token: "{verification_token}" }`
- **Then**:
  - Response status is 200
  - User's `EMAIL_VRFC_YN` is `"Y"`
  - `EMAIL_VRFC_TKN` and `EMAIL_VRFC_EXPR_DT` are cleared (null)

---

### 2.6 Password Reset Flow (`auth.controller.spec.ts`)

#### TC-I-050: Forgot password generates reset token

- **Priority**: P0
- **Given**: An existing user with email `"user@example.com"` who has a password
- **When**: POST `/api/auth/forgot-password` with `{ email: "user@example.com" }`
- **Then**:
  - Response status is 200
  - User record has `PSWD_RST_TKN` (non-null UUID)
  - `PSWD_RST_EXPR_DT` is approximately 1 hour from now

#### TC-I-051: Successful password reset

- **Priority**: P0
- **Given**: A user with a valid `PSWD_RST_TKN` (not expired)
- **When**: POST `/api/auth/reset-password` with `{ token: "{reset_token}", newPassword: "N3wP@ss!" }`
- **Then**:
  - Response status is 200
  - User can login with new password
  - User cannot login with old password
  - `PSWD_RST_TKN` and `PSWD_RST_EXPR_DT` are cleared
  - All existing refresh tokens for this user are revoked

#### TC-I-052: Login with new password after reset

- **Priority**: P0
- **Given**: A user who just completed password reset to `"N3wP@ss!"`
- **When**: POST `/api/auth/login` with the new password
- **Then**: Response status is 200 with valid tokens

---

### 2.7 Full End-to-End Flows (`auth.e2e.spec.ts`)

#### TC-I-060: Complete signup → verify → login → refresh → logout

- **Priority**: P0
- **Given**: No existing user
- **When**:
  1. POST `/api/auth/signup` → get tokens + verification token from DB
  2. POST `/api/auth/verify-email` with the token
  3. POST `/api/auth/login` with credentials
  4. POST `/api/auth/refresh` with refresh token
  5. POST `/api/auth/logout` with new refresh token
- **Then**: Each step succeeds, final refresh token is revoked

#### TC-I-061: Forgot password → reset → login with new password

- **Priority**: P0
- **Given**: An existing user with password
- **When**:
  1. POST `/api/auth/forgot-password`
  2. Read PSWD_RST_TKN from DB
  3. POST `/api/auth/reset-password` with token + new password
  4. POST `/api/auth/login` with new password
- **Then**: Each step succeeds, user is logged in with new password

---

## 3. Edge Cases

### 3.1 Signup Edge Cases

#### TC-E-001: Duplicate email returns 409

- **Priority**: P0
- **Given**: A user with email `"existing@example.com"` already exists
- **When**: POST `/api/auth/signup` with same email
- **Then**: Response status is 409, error code is `EMAIL_ALREADY_EXISTS`

#### TC-E-002: Duplicate nickname returns 409

- **Priority**: P1
- **Given**: A user with nickname `"taken_name"` already exists
- **When**: POST `/api/auth/signup` with same nickname
- **Then**: Response status is 409, error code is `NICKNAME_ALREADY_EXISTS`

#### TC-E-003: Signup with missing required fields returns 400

- **Priority**: P0
- **Given**: An incomplete request body (missing email or password or name)
- **When**: POST `/api/auth/signup`
- **Then**: Response status is 400, error code is `VALIDATION_ERROR`

---

### 3.2 Login Edge Cases

#### TC-E-010: Wrong password returns 401

- **Priority**: P0
- **Given**: An existing user with email `"user@example.com"`
- **When**: POST `/api/auth/login` with `{ email: "user@example.com", password: "WrongPass1!" }`
- **Then**:
  - Response status is 401, error code is `INVALID_CREDENTIALS`
  - Login log created with `LGN_RSLT_CD: "FAIL"`, `FAIL_RSN: "Invalid credentials"`

#### TC-E-011: Nonexistent email returns 401

- **Priority**: P0
- **Given**: No user with email `"nobody@example.com"`
- **When**: POST `/api/auth/login` with that email
- **Then**: Response status is 401, error code is `INVALID_CREDENTIALS` (same as wrong password — no email enumeration)

#### TC-E-012: Login to suspended account returns 403

- **Priority**: P0
- **Given**: A user with `USER_STTS_CD: "SUSP"`
- **When**: POST `/api/auth/login` with correct credentials
- **Then**: Response status is 403, error code is `ACCOUNT_SUSPENDED`

#### TC-E-013: Login to inactive account returns 403

- **Priority**: P1
- **Given**: A user with `USER_STTS_CD: "INAC"`
- **When**: POST `/api/auth/login` with correct credentials
- **Then**: Response status is 403, error code is `ACCOUNT_INACTIVE`

#### TC-E-014: Login with social-only account (no password) returns 401

- **Priority**: P1
- **Given**: A user created via social login with `USER_PSWD: null`
- **When**: POST `/api/auth/login` with any password
- **Then**: Response status is 401, error code is `INVALID_CREDENTIALS`

#### TC-E-015: Login to soft-deleted account returns 401

- **Priority**: P1
- **Given**: A user with `DEL_YN: "Y"`
- **When**: POST `/api/auth/login` with correct credentials
- **Then**: Response status is 401, error code is `INVALID_CREDENTIALS` (user not found, DEL_YN filter)

---

### 3.3 Token Edge Cases

#### TC-E-020: Expired refresh token returns 401

- **Priority**: P0
- **Given**: A refresh token with `EXPR_DT` in the past
- **When**: POST `/api/auth/refresh` with that token
- **Then**: Response status is 401, error code is `INVALID_REFRESH_TOKEN`

#### TC-E-021: Revoked refresh token returns 401

- **Priority**: P0
- **Given**: A refresh token with `RVKD_YN: "Y"` in DB
- **When**: POST `/api/auth/refresh` with that token
- **Then**: Response status is 401, error code is `INVALID_REFRESH_TOKEN`

#### TC-E-022: Reuse of revoked token triggers breach detection

- **Priority**: P0
- **Given**: User has 3 active refresh tokens. Token A is revoked via rotation.
- **When**: POST `/api/auth/refresh` with Token A (already revoked)
- **Then**:
  - Response status is 401, error code is `TOKEN_REUSE_DETECTED`
  - ALL of the user's refresh tokens are revoked in DB (`RVKD_YN: "Y"`)

#### TC-E-023: Refresh with completely invalid token string returns 401

- **Priority**: P1
- **Given**: A random invalid string `"not-a-jwt-token"`
- **When**: POST `/api/auth/refresh` with that string
- **Then**: Response status is 401, error code is `INVALID_REFRESH_TOKEN`

#### TC-E-024: Access protected route with expired access token returns 401

- **Priority**: P0
- **Given**: An expired access token
- **When**: GET any protected endpoint with `Authorization: Bearer {expired_token}`
- **Then**: Response status is 401

---

### 3.4 Email Verification Edge Cases

#### TC-E-030: Expired verification token returns 400

- **Priority**: P0
- **Given**: A user with `EMAIL_VRFC_EXPR_DT` in the past
- **When**: POST `/api/auth/verify-email` with the expired token
- **Then**: Response status is 400, error code is `VERIFICATION_TOKEN_EXPIRED`

#### TC-E-031: Invalid verification token returns 400

- **Priority**: P0
- **Given**: A random UUID that doesn't match any user's `EMAIL_VRFC_TKN`
- **When**: POST `/api/auth/verify-email` with that token
- **Then**: Response status is 400, error code is `INVALID_VERIFICATION_TOKEN`

#### TC-E-032: Already verified email returns 400

- **Priority**: P1
- **Given**: A user with `EMAIL_VRFC_YN: "Y"` (already verified)
- **When**: POST `/api/auth/verify-email` with any token
- **Then**: Response status is 400, error code is `EMAIL_ALREADY_VERIFIED`

---

### 3.5 Password Reset Edge Cases

#### TC-E-040: Forgot password with nonexistent email returns 200

- **Priority**: P0
- **Given**: No user with email `"nobody@example.com"`
- **When**: POST `/api/auth/forgot-password` with that email
- **Then**: Response status is 200 (prevents email enumeration — no error)

#### TC-E-041: Forgot password for social-only user returns 200

- **Priority**: P1
- **Given**: A social-only user (USER_PSWD = null)
- **When**: POST `/api/auth/forgot-password` with their email
- **Then**: Response status is 200 (no reset email sent, no error)

#### TC-E-042: Expired reset token returns 400

- **Priority**: P0
- **Given**: A user with `PSWD_RST_EXPR_DT` in the past
- **When**: POST `/api/auth/reset-password` with the expired token
- **Then**: Response status is 400, error code is `RESET_TOKEN_EXPIRED`

#### TC-E-043: Invalid reset token returns 400

- **Priority**: P0
- **Given**: A random UUID that doesn't match any user's `PSWD_RST_TKN`
- **When**: POST `/api/auth/reset-password` with that token
- **Then**: Response status is 400, error code is `INVALID_RESET_TOKEN`

#### TC-E-044: Reset password with weak new password returns 400

- **Priority**: P1
- **Given**: A valid reset token
- **When**: POST `/api/auth/reset-password` with `newPassword: "weak"`
- **Then**: Response status is 400, error code is `VALIDATION_ERROR`

---

### 3.6 Rate Limiting

#### TC-E-050: Login rate limit exceeded returns 429

- **Priority**: P0
- **Given**: 5 login attempts in the last 15 minutes from the same IP
- **When**: POST `/api/auth/login` (6th attempt)
- **Then**: Response status is 429, error code is `RATE_LIMIT_EXCEEDED`

#### TC-E-051: Signup rate limit exceeded returns 429

- **Priority**: P1
- **Given**: 3 signup attempts in the last 1 hour from the same IP
- **When**: POST `/api/auth/signup` (4th attempt)
- **Then**: Response status is 429, error code is `RATE_LIMIT_EXCEEDED`

#### TC-E-052: Forgot password rate limit exceeded returns 429

- **Priority**: P1
- **Given**: 3 forgot-password requests in the last 1 hour from the same IP
- **When**: POST `/api/auth/forgot-password` (4th attempt)
- **Then**: Response status is 429, error code is `RATE_LIMIT_EXCEEDED`

#### TC-E-053: Refresh token rate limit exceeded returns 429

- **Priority**: P1
- **Given**: 10 refresh requests in the last 1 minute from the same IP
- **When**: POST `/api/auth/refresh` (11th attempt)
- **Then**: Response status is 429, error code is `RATE_LIMIT_EXCEEDED`

---

## 4. Security Tests

### 4.1 NoSQL Injection Prevention

#### TC-S-001: NoSQL injection in email field (login)

- **Priority**: P0
- **Given**: A malicious email payload `{ "email": { "$gt": "" }, "password": "P@ssw0rd123" }`
- **When**: POST `/api/auth/login`
- **Then**: Response status is 400 (validation rejects non-string email), NOT a successful login

#### TC-S-002: NoSQL injection in email field (signup)

- **Priority**: P0
- **Given**: A signup request with `email: { "$ne": null }`
- **When**: POST `/api/auth/signup`
- **Then**: Response status is 400, email must be a string

#### TC-S-003: NoSQL injection in token field (verify-email)

- **Priority**: P1
- **Given**: A request with `token: { "$exists": true }`
- **When**: POST `/api/auth/verify-email`
- **Then**: Response status is 400, token must be a string

---

### 4.2 XSS Prevention

#### TC-S-010: XSS in nickname field (signup)

- **Priority**: P0
- **Given**: A signup request with `nickname: "<script>alert('xss')</script>"`
- **When**: POST `/api/auth/signup`
- **Then**: Response status is 400 (regex validation rejects `<`, `>`, `'`, `(`, `)`)

#### TC-S-011: XSS in name field (signup)

- **Priority**: P1
- **Given**: A signup request with `name: "<img onerror=alert(1) src=x>"`
- **When**: POST `/api/auth/signup`
- **Then**: Response status is 400 or the stored name is sanitized (no HTML tags in response)

#### TC-S-012: HTML in email field

- **Priority**: P1
- **Given**: A signup request with `email: "<script>@evil.com"`
- **When**: POST `/api/auth/signup`
- **Then**: Response status is 400 (invalid email format)

---

### 4.3 Brute Force Protection

#### TC-S-020: Brute force login blocked by rate limiter

- **Priority**: P0
- **Given**: An existing user account
- **When**: 6 rapid login attempts with wrong passwords in under 15 minutes
- **Then**: 6th attempt returns 429 (rate limit exceeded), previous 5 returned 401

#### TC-S-021: Failed login attempts are logged

- **Priority**: P0
- **Given**: 3 failed login attempts for the same email
- **When**: Querying TL_COMM_LGN_LOG for that user
- **Then**: 3 log entries exist with `LGN_RSLT_CD: "FAIL"` and accurate `FAIL_RSN`

#### TC-S-022: Rate limiter is per-IP, not per-account

- **Priority**: P1
- **Given**: 5 failed login attempts from IP 1.2.3.4
- **When**: A login attempt from IP 5.6.7.8 for the same account
- **Then**: The attempt from the new IP is NOT rate limited

---

### 4.4 Token Security

#### TC-S-030: Refresh token stored as SHA-256 hash (not plaintext)

- **Priority**: P0
- **Given**: A user who just logged in and received a refresh token
- **When**: Querying TB_COMM_RFRSH_TKN for that user
- **Then**: `TKN_VAL` is a 64-char hex string (SHA-256 hash), NOT the actual JWT string

#### TC-S-031: Password reset revokes all sessions

- **Priority**: P0
- **Given**: A user logged in on 3 devices (3 refresh tokens in DB)
- **When**: Password is reset via `/api/auth/reset-password`
- **Then**: All 3 refresh tokens have `RVKD_YN: "Y"`

#### TC-S-032: Access token does not contain password or sensitive data

- **Priority**: P1
- **Given**: A valid access token
- **When**: The JWT payload is decoded (base64)
- **Then**: Payload only contains `sub`, `email`, `type`, `iat`, `exp` — no password, no internal IDs beyond user ID

---

### 4.5 Email Enumeration Prevention

#### TC-S-040: Forgot password does not reveal account existence

- **Priority**: P0
- **Given**: Two requests — one with existing email, one with nonexistent email
- **When**: Both POST `/api/auth/forgot-password`
- **Then**: Both return identical 200 responses with the same message

#### TC-S-041: Login error message does not distinguish email vs password

- **Priority**: P0
- **Given**: A wrong-password attempt and a nonexistent-email attempt
- **When**: Both POST `/api/auth/login`
- **Then**: Both return 401 with the same error code `INVALID_CREDENTIALS` (no "email not found" vs "wrong password" distinction)

---

## 5. Test Coverage Summary

| Category | Test Count | P0 | P1 |
|----------|-----------|----|----|
| Unit — Password Hashing | 4 | 3 | 1 |
| Unit — JWT | 6 | 4 | 2 |
| Unit — Email Validation | 3 | 2 | 1 |
| Unit — Password Validation | 6 | 5 | 1 |
| Unit — Nickname Validation | 3 | 0 | 3 |
| Unit — Token Hash | 1 | 1 | 0 |
| Integration — Signup | 3 | 1 | 2 |
| Integration — Login | 2 | 1 | 1 |
| Integration — Refresh | 2 | 1 | 1 |
| Integration — Logout | 2 | 1 | 1 |
| Integration — Verify Email | 1 | 1 | 0 |
| Integration — Password Reset | 3 | 3 | 0 |
| Integration — E2E Flows | 2 | 2 | 0 |
| Edge Cases — Signup | 3 | 2 | 1 |
| Edge Cases — Login | 6 | 3 | 3 |
| Edge Cases — Token | 5 | 3 | 2 |
| Edge Cases — Email Verify | 3 | 2 | 1 |
| Edge Cases — Password Reset | 5 | 3 | 2 |
| Edge Cases — Rate Limiting | 4 | 1 | 3 |
| Security — NoSQL Injection | 3 | 2 | 1 |
| Security — XSS | 3 | 1 | 2 |
| Security — Brute Force | 3 | 2 | 1 |
| Security — Token Security | 3 | 2 | 1 |
| Security — Email Enumeration | 2 | 2 | 0 |
| **Total** | **78** | **47** | **31** |
