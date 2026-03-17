# Social Login Test Cases — Sprint 3

> Based on `docs/blueprints/001-auth/blueprint.md` — Sections 4.2, 4.3, 10, 13
> DB Schema: `docs/database/database-design.md` (SSoT)
> Format: Given-When-Then
> Naming convention: `{module}.{layer}.spec.ts`

---

## 1. Unit Tests

### 1.1 OAuth Profile Extraction (`social-auth.provider.spec.ts`)

#### TC-U-060: Google OAuth profile extraction

- **Priority**: P0
- **Given**: A raw Google userinfo API response:
  ```json
  {
    "id": "google-uid-123",
    "email": "user@gmail.com",
    "name": "John Doe",
    "picture": "https://lh3.googleusercontent.com/photo.jpg"
  }
  ```
- **When**: `GoogleProvider.extractProfile()` is called with the response
- **Then**:
  - Returns `{ providerUserId: "google-uid-123", email: "user@gmail.com", name: "John Doe", profileImageUrl: "https://lh3.googleusercontent.com/photo.jpg", provider: "GOOGLE" }`
  - Field mapping matches blueprint Section 4.3:
    - `id` → `SCL_PRVD_USE_ID`
    - `email` → `SCL_EML` / `USE_EML`
    - `name` → `USE_NM`
    - `picture` → `SCL_PRFL_IMG_URL`

---

#### TC-U-061: Kakao OAuth profile extraction

- **Priority**: P0
- **Given**: A raw Kakao `/v2/user/me` API response:
  ```json
  {
    "id": 12345678,
    "kakao_account": {
      "email": "user@kakao.com",
      "profile": {
        "nickname": "KakaoUser",
        "profile_image_url": "https://k.kakaocdn.net/photo.jpg"
      }
    }
  }
  ```
- **When**: `KakaoProvider.extractProfile()` is called with the response
- **Then**:
  - Returns `{ providerUserId: "12345678", email: "user@kakao.com", name: "KakaoUser", profileImageUrl: "https://k.kakaocdn.net/photo.jpg", provider: "KAKAO" }`
  - `id` is converted to string
  - Nested `kakao_account.profile.nickname` is correctly extracted as `name`

---

#### TC-U-062: Naver OAuth profile extraction

- **Priority**: P0
- **Given**: A raw Naver `/v1/nid/me` API response:
  ```json
  {
    "resultcode": "00",
    "message": "success",
    "response": {
      "id": "naver-uid-456",
      "email": "user@naver.com",
      "name": "NaverUser",
      "profile_image": "https://phinf.pstatic.net/photo.jpg"
    }
  }
  ```
- **When**: `NaverProvider.extractProfile()` is called with the response
- **Then**:
  - Returns `{ providerUserId: "naver-uid-456", email: "user@naver.com", name: "NaverUser", profileImageUrl: "https://phinf.pstatic.net/photo.jpg", provider: "NAVER" }`
  - Data is extracted from nested `response` object

---

### 1.2 Social Login Service Logic (`social-auth.service.spec.ts`)

#### TC-U-063: socialLogin — existing social account leads to user login

- **Priority**: P0
- **Given**:
  - A user record exists in `TB_COMM_USER` with `_id: "user-001"`, `USE_EML: "user@gmail.com"`, `USE_STTS_CD: "ACTV"`, `DEL_YN: "N"`
  - A social account record exists in `TB_COMM_SCL_ACNT` with `USE_ID: "user-001"`, `SCL_PRVD_CD: "GOOGLE"`, `SCL_PRVD_USE_ID: "google-uid-123"`
  - OAuth profile: `{ provider: "GOOGLE", providerUserId: "google-uid-123", email: "user@gmail.com" }`
- **When**: `SocialAuthService.socialLogin(profile)` is called
- **Then**:
  - Prisma `socialAccount.findUnique({ where: { SCL_PRVD_CD_SCL_PRVD_USE_ID: { SCL_PRVD_CD: "GOOGLE", SCL_PRVD_USE_ID: "google-uid-123" } } })` is called
  - No new user or social account is created
  - `LST_LGN_DT` is updated on the user record
  - A login log is created in `TL_COMM_LGN_LOG` with `LGN_MTHD_CD: "GOOGLE"`, `LGN_RSLT_CD: "SUCC"`
  - JWT access + refresh tokens are generated for user `"user-001"`

---

#### TC-U-064: socialLogin — no social account but email matches existing user leads to auto-link

- **Priority**: P0
- **Given**:
  - A user record exists in `TB_COMM_USER` with `_id: "user-002"`, `USE_EML: "shared@example.com"`, `USE_STTS_CD: "ACTV"`, `DEL_YN: "N"`
  - No social account exists for `SCL_PRVD_CD: "KAKAO"` / `SCL_PRVD_USE_ID: "kakao-uid-789"`
  - OAuth profile: `{ provider: "KAKAO", providerUserId: "kakao-uid-789", email: "shared@example.com", name: "KakaoUser", profileImageUrl: "https://img.kakao.com/photo.jpg" }`
- **When**: `SocialAuthService.socialLogin(profile)` is called
- **Then**:
  - Lookup by `(SCL_PRVD_CD, SCL_PRVD_USE_ID)` returns null
  - Lookup by `USE_EML: "shared@example.com"` finds user `"user-002"`
  - A new `TB_COMM_SCL_ACNT` record is created with:
    - `USE_ID: "user-002"`
    - `SCL_PRVD_CD: "KAKAO"`
    - `SCL_PRVD_USE_ID: "kakao-uid-789"`
    - `SCL_EML: "shared@example.com"`
    - `SCL_PRFL_IMG_URL: "https://img.kakao.com/photo.jpg"`
    - `LNKD_DT` set to current datetime
  - No new user is created
  - Login log: `LGN_MTHD_CD: "KAKAO"`, `LGN_RSLT_CD: "SUCC"`
  - JWT tokens are generated for user `"user-002"`

---

#### TC-U-065: socialLogin — no match at all leads to new user and social account creation

- **Priority**: P0
- **Given**:
  - No social account exists for `SCL_PRVD_CD: "NAVER"` / `SCL_PRVD_USE_ID: "naver-uid-999"`
  - No user exists with `USE_EML: "newuser@naver.com"`
  - OAuth profile: `{ provider: "NAVER", providerUserId: "naver-uid-999", email: "newuser@naver.com", name: "NewNaverUser", profileImageUrl: "https://phinf.pstatic.net/new.jpg" }`
- **When**: `SocialAuthService.socialLogin(profile)` is called
- **Then**:
  - A new `TB_COMM_USER` record is created with:
    - `USE_EML: "newuser@naver.com"`
    - `USE_PSWD: null` (social-only, no password)
    - `USE_NM: "NewNaverUser"`
    - `USE_ROLE_CD: "BUYER"` (default role)
    - `USE_STTS_CD: "ACTV"`
    - `EML_VRFC_YN: "Y"` (social email trusted as verified)
  - A new `TB_COMM_SCL_ACNT` record is created linked to the new user
  - Login log: `LGN_MTHD_CD: "NAVER"`, `LGN_RSLT_CD: "SUCC"`
  - JWT tokens are generated for the new user

---

#### TC-U-066: socialLogin — generate JWT tokens for social user

- **Priority**: P0
- **Given**:
  - A social login completes successfully for user `_id: "user-003"`, `USE_EML: "social@gmail.com"`, `USE_ROLE_CD: "BUYER"`
- **When**: Token generation occurs within `SocialAuthService.socialLogin()`
- **Then**:
  - Access token payload contains `{ sub: "user-003", email: "social@gmail.com", role: "BUYER", type: "access" }`
  - Access token expires in 900 seconds (15 minutes)
  - Refresh token payload contains `{ sub: "user-003", type: "refresh" }`
  - Refresh token expires in 604800 seconds (7 days)
  - Refresh token SHA-256 hash is stored in `TB_COMM_RFRSH_TKN` with `RVKD_YN: "N"`
  - Client IP and User-Agent are recorded in the refresh token record

---

#### TC-U-067: CSRF state token validation

- **Priority**: P0
- **Given**:
  - A state token `"abc123-state"` was generated and stored (in session/cache) during the redirect step (`GET /api/auth/social/google`)
- **When**: The callback `GET /api/auth/social/google/callback?code=authcode&state=abc123-state` is processed
- **Then**:
  - The `state` query parameter is compared against the stored value
  - Validation passes (match found)
  - The stored state token is consumed (one-time use)

---

#### TC-U-068: OAuth code exchange for access token

- **Priority**: P0
- **Given**:
  - A valid authorization code `"auth-code-xyz"` received from Google callback
  - Google token endpoint: `https://oauth2.googleapis.com/token`
  - Environment variables: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` are set
- **When**: `GoogleProvider.exchangeCodeForToken("auth-code-xyz")` is called
- **Then**:
  - An HTTP POST is made to `https://oauth2.googleapis.com/token` with body:
    - `code: "auth-code-xyz"`
    - `client_id: GOOGLE_CLIENT_ID`
    - `client_secret: GOOGLE_CLIENT_SECRET`
    - `redirect_uri: GOOGLE_CALLBACK_URL`
    - `grant_type: "authorization_code"`
  - The provider access token is returned from the response
  - The access token is then used to call the profile endpoint (`https://www.googleapis.com/oauth2/v2/userinfo`)

---

## 2. Integration Tests

### 2.1 Full OAuth Flows (`social-auth.e2e-spec.ts`)

#### TC-I-060: Full Google OAuth flow (redirect → callback → tokens)

- **Priority**: P0
- **Given**:
  - Google OAuth is configured with valid `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
  - No user exists with email `"googleuser@gmail.com"`
- **When**:
  1. `GET /api/auth/social/google` is called
  2. User completes consent on Google (simulated)
  3. `GET /api/auth/social/google/callback?code=valid-google-code&state=valid-state` is called
- **Then**:
  - Step 1: Returns 302 redirect to `https://accounts.google.com/o/oauth2/v2/auth` with scopes `openid email profile` and a state parameter
  - Step 3: A new user is created in `TB_COMM_USER` with `USE_PSWD: null`
  - Step 3: A new social account is created in `TB_COMM_SCL_ACNT` with `SCL_PRVD_CD: "GOOGLE"`
  - Step 3: A login log is created in `TL_COMM_LGN_LOG` with `LGN_MTHD_CD: "GOOGLE"`, `LGN_RSLT_CD: "SUCC"`
  - Step 3: Response redirects to `{FRONTEND_URL}/auth/social/callback?accessToken={jwt}&refreshToken={jwt}`
  - Both tokens are valid JWTs decodable with `JWT_SECRET`

---

#### TC-I-061: Full Kakao OAuth flow

- **Priority**: P0
- **Given**:
  - Kakao OAuth is configured with valid `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`, `KAKAO_CALLBACK_URL`
  - No user exists with email `"kakaouser@kakao.com"`
- **When**:
  1. `GET /api/auth/social/kakao` is called
  2. User completes consent on Kakao (simulated)
  3. `GET /api/auth/social/kakao/callback?code=valid-kakao-code&state=valid-state` is called
- **Then**:
  - Step 1: Returns 302 redirect to `https://kauth.kakao.com/oauth/authorize` with scopes `profile_nickname profile_image account_email`
  - Step 3: A new user is created in `TB_COMM_USER`
  - Step 3: A new social account is created in `TB_COMM_SCL_ACNT` with `SCL_PRVD_CD: "KAKAO"`
  - Step 3: Login log recorded with `LGN_MTHD_CD: "KAKAO"`, `LGN_RSLT_CD: "SUCC"`
  - Step 3: Redirects to frontend with valid tokens

---

#### TC-I-062: Full Naver OAuth flow

- **Priority**: P0
- **Given**:
  - Naver OAuth is configured with valid `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`, `NAVER_CALLBACK_URL`
  - No user exists with email `"naveruser@naver.com"`
- **When**:
  1. `GET /api/auth/social/naver` is called
  2. User completes consent on Naver (simulated)
  3. `GET /api/auth/social/naver/callback?code=valid-naver-code&state=valid-state` is called
- **Then**:
  - Step 1: Returns 302 redirect to `https://nid.naver.com/oauth2.0/authorize`
  - Step 3: A new user is created in `TB_COMM_USER`
  - Step 3: A new social account is created in `TB_COMM_SCL_ACNT` with `SCL_PRVD_CD: "NAVER"`
  - Step 3: Login log recorded with `LGN_MTHD_CD: "NAVER"`, `LGN_RSLT_CD: "SUCC"`
  - Step 3: Redirects to frontend with valid tokens

---

### 2.2 Account Linking (`social-auth.linking.e2e-spec.ts`)

#### TC-I-063: Social login first, then email signup with same email leads to accounts linked

- **Priority**: P0
- **Given**:
  - A user created via Google social login with `USE_EML: "linked@example.com"`, `USE_PSWD: null`
  - A social account exists: `SCL_PRVD_CD: "GOOGLE"`, `SCL_PRVD_USE_ID: "google-001"`
- **When**: Kakao social login callback is processed with profile email `"linked@example.com"` and `SCL_PRVD_USE_ID: "kakao-001"`
- **Then**:
  - No new user is created (existing user is found by email match)
  - A second `TB_COMM_SCL_ACNT` record is created with `SCL_PRVD_CD: "KAKAO"`, linked to the same `USE_ID`
  - User now has 2 social accounts (Google + Kakao) in `TB_COMM_SCL_ACNT`
  - Login log: `LGN_MTHD_CD: "KAKAO"`, `LGN_RSLT_CD: "SUCC"`
  - JWT tokens reference the original user ID

---

#### TC-I-064: Email signup first, then social login with same email leads to auto-link

- **Priority**: P0
- **Given**:
  - A user registered via email signup: `USE_EML: "existing@example.com"`, `USE_PSWD: "$2b$12$hashedpassword"`, `USE_STTS_CD: "ACTV"`, `DEL_YN: "N"`
  - No social accounts linked to this user
- **When**: Google OAuth callback is processed with profile email `"existing@example.com"`, `SCL_PRVD_USE_ID: "google-auto-link-001"`
- **Then**:
  - No new user is created
  - A new `TB_COMM_SCL_ACNT` record is created with `SCL_PRVD_CD: "GOOGLE"` linked to the existing user
  - `LNKD_DT` is set to current datetime
  - The user retains their password (can still login with email + password)
  - Login log: `LGN_MTHD_CD: "GOOGLE"`, `LGN_RSLT_CD: "SUCC"`
  - JWT tokens reference the existing user

---

#### TC-I-065: Social user login produces JWT with correct role

- **Priority**: P0
- **Given**:
  - A user created via social login with `USE_ROLE_CD: "BUYER"` (default)
  - Social account: `SCL_PRVD_CD: "GOOGLE"`, `SCL_PRVD_USE_ID: "google-role-001"`
- **When**: The user logs in via Google social login callback
- **Then**:
  - Decoded access token payload contains `role: "BUYER"`
  - The token can be used to access protected routes requiring `BUYER` role
  - The token is rejected by routes requiring `SUPER_ADMIN` or `SELLER` role

---

## 3. Edge Case Tests

### 3.1 OAuth Callback Failures (`social-auth.edge.spec.ts`)

#### TC-E-060: OAuth callback with invalid state (CSRF) returns 400

- **Priority**: P0
- **Given**:
  - A valid state token `"correct-state-token"` was generated during the redirect step
- **When**: `GET /api/auth/social/google/callback?code=valid-code&state=tampered-state-token` is called
- **Then**:
  - State validation fails (mismatch)
  - Response: redirect to `{FRONTEND_URL}/auth/social/callback?error=INVALID_OAUTH_STATE`
  - No user or social account is created
  - Login log: `LGN_MTHD_CD: "GOOGLE"`, `LGN_RSLT_CD: "FAIL"`, `FAIL_RSN: "Invalid OAuth state"`
  - HTTP status on the error redirect implies 400 semantics (`INVALID_OAUTH_STATE`)

---

#### TC-E-061: OAuth callback with expired/invalid authorization code returns 502

- **Priority**: P0
- **Given**:
  - A valid state token is present
  - The authorization code `"expired-code"` has already been used or has expired
- **When**: `GET /api/auth/social/google/callback?code=expired-code&state=valid-state` is called
- **Then**:
  - Code exchange with Google token endpoint fails (HTTP 400 from Google)
  - Response: redirect to `{FRONTEND_URL}/auth/social/callback?error=OAUTH_PROVIDER_ERROR`
  - No user or social account is created
  - Login log: `LGN_MTHD_CD: "GOOGLE"`, `LGN_RSLT_CD: "FAIL"`, `FAIL_RSN: "OAuth error: invalid_grant"`

---

#### TC-E-062: Social provider returns no email — handle gracefully

- **Priority**: P1
- **Given**:
  - Kakao OAuth callback is processed successfully
  - Kakao profile response has `kakao_account.email` as `null` (user denied email permission)
- **When**: `SocialAuthService.socialLogin(profile)` is called with `email: null`
- **Then**:
  - One of the following strategies is applied (implementation decision):
    - **Option A**: Reject login and redirect with `error=SOCIAL_EMAIL_REQUIRED`
    - **Option B**: Create user with a placeholder/generated email and prompt email entry later
  - No crash or unhandled exception occurs
  - If rejected: login log with `LGN_RSLT_CD: "FAIL"`, `FAIL_RSN: "Social provider returned no email"`

---

#### TC-E-063: Link multiple providers to same account

- **Priority**: P1
- **Given**:
  - A user exists with `USE_EML: "multi@example.com"`
  - Google social account already linked: `SCL_PRVD_CD: "GOOGLE"`, `USE_ID: "user-multi"`
  - Kakao social account already linked: `SCL_PRVD_CD: "KAKAO"`, `USE_ID: "user-multi"`
- **When**: Naver OAuth callback is processed with profile email `"multi@example.com"`, `SCL_PRVD_USE_ID: "naver-multi-001"`
- **Then**:
  - A third `TB_COMM_SCL_ACNT` record is created with `SCL_PRVD_CD: "NAVER"`, `USE_ID: "user-multi"`
  - User now has 3 social accounts (Google + Kakao + Naver)
  - All three providers can be used for future login
  - Compound unique constraint `{ SCL_PRVD_CD, SCL_PRVD_USE_ID }` is satisfied (different providers)

---

#### TC-E-064: Social login for suspended user returns 403

- **Priority**: P0
- **Given**:
  - A user exists with `USE_STTS_CD: "SUSP"`, `DEL_YN: "N"`
  - A social account exists linked to this user: `SCL_PRVD_CD: "GOOGLE"`, `SCL_PRVD_USE_ID: "google-susp-001"`
- **When**: Google OAuth callback is processed and social account is found
- **Then**:
  - User status check fails (`SUSP` is not `ACTV`)
  - Response: redirect to `{FRONTEND_URL}/auth/social/callback?error=ACCOUNT_SUSPENDED`
  - No tokens are generated
  - Login log: `LGN_MTHD_CD: "GOOGLE"`, `LGN_RSLT_CD: "FAIL"`, `FAIL_RSN: "Account suspended"`

---

#### TC-E-065: Social-only user (no password) cannot email login

- **Priority**: P0
- **Given**:
  - A user created via Google social login: `USE_EML: "socialonly@gmail.com"`, `USE_PSWD: null`
- **When**: `POST /api/auth/login` is called with `{ "email": "socialonly@gmail.com", "password": "anyPassword123!" }`
- **Then**:
  - User is found by email
  - Password check detects `USE_PSWD` is null (social-only account)
  - Response: `401 INVALID_CREDENTIALS`
  - Login log: `LGN_MTHD_CD: "EMAIL"`, `LGN_RSLT_CD: "FAIL"`, `FAIL_RSN: "Invalid credentials"`
  - Error message does not reveal that the account is social-only (prevents enumeration)

---

#### TC-E-066: OAuth provider API timeout returns 502

- **Priority**: P1
- **Given**:
  - A valid authorization code and state token are present
  - The OAuth provider's token endpoint (`https://oauth2.googleapis.com/token`) is unresponsive (timeout > 10s)
- **When**: `GET /api/auth/social/google/callback?code=valid-code&state=valid-state` is called
- **Then**:
  - HTTP request to provider times out
  - Response: redirect to `{FRONTEND_URL}/auth/social/callback?error=OAUTH_PROVIDER_ERROR`
  - No user or social account is created
  - Login log: `LGN_MTHD_CD: "GOOGLE"`, `LGN_RSLT_CD: "FAIL"`, `FAIL_RSN: "OAuth error: provider timeout"`
  - Error is logged at ERROR level with stack trace (system exception)

---

## 4. Security Tests

### 4.1 OAuth Security (`social-auth.security.spec.ts`)

#### TC-S-060: OAuth authorization code replay is rejected

- **Priority**: P0
- **Given**:
  - A valid authorization code `"code-once"` was already used successfully in a previous callback
- **When**: `GET /api/auth/social/google/callback?code=code-once&state=valid-state-2` is called again
- **Then**:
  - The provider's token endpoint rejects the code (authorization codes are single-use per OAuth 2.0 spec)
  - Response: redirect to `{FRONTEND_URL}/auth/social/callback?error=OAUTH_PROVIDER_ERROR`
  - No duplicate user or social account is created
  - Login log: `LGN_RSLT_CD: "FAIL"`, `FAIL_RSN: "OAuth error: invalid_grant"`

---

#### TC-S-061: Token tampering (modified JWT) is rejected

- **Priority**: P0
- **Given**:
  - A valid access token was issued after social login: `"eyJhbGciOiJIUzI1NiIs..."`
  - The token payload is decoded, modified (e.g., `sub` changed to another user's ID), and re-encoded without the correct secret
- **When**: The tampered token is used in `Authorization: Bearer {tamperedToken}` on a protected route
- **Then**:
  - `JwtAuthGuard` rejects the token (signature verification fails)
  - Response: `401 Unauthorized`
  - The request does not reach the route handler

---

#### TC-S-062: Social login cannot create SUPER_ADMIN role

- **Priority**: P0
- **Given**:
  - A new user is being created via social login (no existing account)
  - OAuth profile contains any combination of fields
- **When**: `SocialAuthService.socialLogin(profile)` creates the new user
- **Then**:
  - The new user is always created with `USE_ROLE_CD: "BUYER"` (default)
  - `SUPER_ADMIN` role can only be assigned by an existing `SUPER_ADMIN` via admin API
  - No input from the OAuth profile can influence the role assignment
  - Verify that no query parameter, header, or profile field can escalate the role

---

#### TC-S-063: Rate limiting on social login callback

- **Priority**: P1
- **Given**:
  - Rate limiting is configured on social login endpoints
- **When**: More than the allowed number of requests are made to `GET /api/auth/social/google/callback` from the same IP within the rate limit window
- **Then**:
  - Requests exceeding the limit receive `429 RATE_LIMIT_EXCEEDED`
  - Response body: `{ "success": false, "error": "RATE_LIMIT_EXCEEDED", "message": "Too many requests" }`
  - Rate limit is tracked per IP address
  - Legitimate requests after the window resets are processed normally

---

## 5. Test Summary

### By Test Type

| Type | Count | IDs |
|------|-------|-----|
| Unit Tests | 9 | TC-U-060 ~ TC-U-068 |
| Integration Tests | 6 | TC-I-060 ~ TC-I-065 |
| Edge Case Tests | 7 | TC-E-060 ~ TC-E-066 |
| Security Tests | 4 | TC-S-060 ~ TC-S-063 |
| **Total** | **26** | |

### By Priority

| Priority | Count | IDs |
|----------|-------|-----|
| P0 (Must-have) | 20 | TC-U-060~066, TC-U-067~068, TC-I-060~065, TC-E-060~061, TC-E-064~065, TC-S-060~062 |
| P1 (Should-have) | 6 | TC-E-062~063, TC-E-066, TC-S-063 |

### By Feature Area

| Feature Area | Count | IDs |
|-------------|-------|-----|
| OAuth Profile Extraction | 3 | TC-U-060, TC-U-061, TC-U-062 |
| Account Linking Logic | 3 | TC-U-063, TC-U-064, TC-U-065 |
| Token Generation | 2 | TC-U-066, TC-U-068 |
| CSRF / State Validation | 2 | TC-U-067, TC-E-060 |
| Full OAuth Flows | 3 | TC-I-060, TC-I-061, TC-I-062 |
| Cross-method Linking | 3 | TC-I-063, TC-I-064, TC-E-063 |
| Role Verification | 2 | TC-I-065, TC-S-062 |
| Error Handling | 4 | TC-E-061, TC-E-062, TC-E-064, TC-E-066 |
| Social-only Account | 1 | TC-E-065 |
| Security | 3 | TC-S-060, TC-S-061, TC-S-063 |

### DB Collections Covered

| Collection | Prisma Model | Tests Touching |
|-----------|-------------|----------------|
| `TB_COMM_USER` | User | TC-U-063~066, TC-I-060~065, TC-E-062~065 |
| `TB_COMM_SCL_ACNT` | SocialAccount | TC-U-063~065, TC-I-060~064, TC-E-063 |
| `TB_COMM_RFRSH_TKN` | RefreshToken | TC-U-066, TC-I-060~065 |
| `TL_COMM_LGN_LOG` | LoginLog | TC-U-063~065, TC-I-060~065, TC-E-060~061, TC-E-064, TC-E-066 |
