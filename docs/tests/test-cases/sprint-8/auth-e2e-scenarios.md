# Auth E2E Test Scenarios (Sprint 8) — Firebase Auth Migration & Token Refresh

## Overview
- **Feature**: Firebase Auth migration (token verification, auto-create profile) and enhanced token refresh (3-day expiry + auto-refresh)
- **Related Modules**: Auth, Firebase, User Profile
- **API Endpoints**: `GET /api/auth/me`, `PATCH /api/auth/profile`, `PATCH /api/auth/role`, `DELETE /api/auth/account`
- **DB Tables**: TB_COMM_USER (firebaseUid, userEmail, userNm, userNcnm, useRoleCd, userSttsCd, delYn)
- **Blueprint**: docs/blueprints/014-db-migration-firebase/blueprint.md
- **Sprint Goal**: Token refresh with 3-day expiry + auto-refresh, Firebase Auth integration
- **Note**: Extends sprint-6/7 auth scenarios. Focuses on Firebase-specific flows and token refresh mechanics.

---

## Scenario Group 1: Firebase Token Verification Flow

### E2E-001: First-time Firebase login auto-creates user profile
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Firebase user exists (email: `newuser@test.com`), no matching record in TB_COMM_USER
- **User Journey**:
  1. Sign up via Firebase Client SDK (`createUserWithEmailAndPassword`)
  2. Frontend calls `GET /api/auth/me` with Firebase ID token in Authorization header
  3. FirebaseAuthGuard verifies token via Google public certs (RS256)
  4. Guard detects no user in DB with matching `firebaseUid`
  5. Guard auto-creates user record in TB_COMM_USER
- **Expected Results**:
  - UI: User profile loads, user menu shows in header with auto-generated nickname
  - API: `GET /api/auth/me` returns `{ success: true, data: { firebaseUid, email, role: "BUYER" } }`
  - DB: New TB_COMM_USER record with `firebaseUid` = Firebase UID, `useRoleCd` = "BUYER", `userSttsCd` = "ACTV", `delYn` = "N", `rgtrId` = "SYSTEM"
  - Server Log: No error logs; welcome email send attempt logged
- **Verification Method**: network / db-query / server-log
- **Test Data**: `{ email: "newuser@test.com", password: "Test1234!" }`

### E2E-002: Returning Firebase user recognized by firebaseUid
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: User already exists in TB_COMM_USER with matching `firebaseUid`
- **User Journey**:
  1. User signs in via Firebase (`signInWithEmailAndPassword`)
  2. Frontend calls `GET /api/auth/me` with fresh ID token
  3. FirebaseAuthGuard verifies token and finds existing user by `firebaseUid`
  4. Profile returned without creating a new record
- **Expected Results**:
  - UI: User profile renders with previously saved name, nickname, role
  - API: `GET /api/auth/me` returns existing user data
  - DB: No new row created; existing record unchanged
- **Verification Method**: network / db-query
- **Test Data**: Existing user `{ email: "buyer@vibe.com" }`

### E2E-003: Firebase UID re-link when user re-registers with same email
- **Type**: Alternative Path
- **Priority**: High
- **Preconditions**: User record exists in TB_COMM_USER with `userEmail` = "relink@test.com" but a different `firebaseUid` (e.g., user deleted Firebase account and re-registered)
- **User Journey**:
  1. User creates new Firebase account with same email "relink@test.com"
  2. Firebase assigns a new UID
  3. Frontend calls `GET /api/auth/me` with new Firebase token
  4. Guard fails to find user by new `firebaseUid`
  5. Guard finds existing user by `userEmail`, updates `firebaseUid` to new UID
- **Expected Results**:
  - UI: User sees their original profile (name, role preserved)
  - API: `GET /api/auth/me` returns user with updated `firebaseUid`
  - DB: TB_COMM_USER.firebaseUid updated to new UID, `mdfrId` = "SYSTEM"
- **Verification Method**: db-query / network
- **Test Data**: `{ email: "relink@test.com", oldFirebaseUid: "old_uid_123", newFirebaseUid: "new_uid_456" }`

### E2E-004: Welcome email sent on first-time auto-create
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: No existing user for `welcome@test.com` in TB_COMM_USER
- **User Journey**:
  1. New user signs up via Firebase and calls any authenticated endpoint
  2. FirebaseAuthGuard auto-creates user profile
  3. `mailService.sendWelcomeEmail()` is called non-blocking
- **Expected Results**:
  - API: Profile creation succeeds regardless of email delivery status
  - Server Log: Welcome email send attempt logged (success or failure)
  - DB: User created; email delivery status does not affect user record
- **Verification Method**: server-log / db-query
- **Test Data**: `{ email: "welcome@test.com", password: "Test1234!" }`

### E2E-005: Google sign-in via Firebase creates profile
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: User has Google account, no existing TB_COMM_USER record
- **User Journey**:
  1. Click "Continue with Google" on login page
  2. Firebase `signInWithPopup(GoogleAuthProvider)` completes
  3. Frontend calls `GET /api/auth/me` with Google-linked Firebase ID token
  4. Guard auto-creates user with Google display name and profile picture
- **Expected Results**:
  - UI: User logged in, profile shows Google display name
  - API: `GET /api/auth/me` returns user with name from Google profile
  - DB: TB_COMM_USER created with `userNm` from Google, `useRoleCd` = "BUYER"
- **Verification Method**: snapshot / network / db-query
- **Test Data**: Google test account

---

## Scenario Group 2: Token Auto-Refresh Mechanism

### E2E-006: Firebase ID token auto-refreshed by SDK before expiry
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: User logged in, Firebase ID token approaching 1-hour expiry (Firebase default)
- **User Journey**:
  1. User is logged in and idle for ~55 minutes
  2. User performs an action that triggers an API call
  3. Firebase SDK `getIdToken()` detects token is near expiry
  4. SDK automatically refreshes token using Firebase refresh token
  5. API call proceeds with fresh token
- **Expected Results**:
  - UI: User experiences no interruption; action completes normally
  - API: Request succeeds with 200 status, new token accepted by FirebaseAuthGuard
  - Server Log: Token verification succeeds with new token
- **Verification Method**: network / server-log
- **Test Data**: Logged-in user, simulated token near-expiry

### E2E-007: `onAuthStateChanged` re-fetches profile on token refresh
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: User logged in, session active
- **User Journey**:
  1. Firebase SDK refreshes the ID token in the background
  2. `onAuthStateChanged` fires with updated `firebaseUser`
  3. `useAuth` hook calls `GET /api/auth/me` with new token
  4. User state updated in React state and localStorage
- **Expected Results**:
  - UI: User remains logged in, no flicker or redirect
  - API: `GET /api/auth/me` called with fresh token, returns profile
  - DB: No changes to user record
- **Verification Method**: network / console-log
- **Test Data**: Active session user

### E2E-008: Force token refresh via `getIdToken(true)`
- **Type**: Alternative Path
- **Priority**: Medium
- **Preconditions**: User logged in with valid session
- **User Journey**:
  1. Application triggers forced refresh (e.g., after role change or profile update)
  2. `getIdToken(true)` called to force Firebase to issue a new token
  3. Subsequent API calls use the new token
- **Expected Results**:
  - UI: No visible change to user
  - API: New token accepted, API calls succeed
  - Server Log: Token with new `iat` (issued-at) verified successfully
- **Verification Method**: network
- **Test Data**: Logged-in user

### E2E-009: App reload restores session via Firebase persistence
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: User previously logged in (Firebase session persisted in IndexedDB)
- **User Journey**:
  1. User closes browser tab
  2. User reopens the app (navigates to `/`)
  3. Firebase `onAuthStateChanged` fires with persisted user
  4. `useAuth` hook fetches profile from backend
  5. User is seamlessly logged in
- **Expected Results**:
  - UI: User menu appears without requiring re-login
  - API: `GET /api/auth/me` returns profile
  - DB: No new records created
- **Verification Method**: snapshot / network
- **Test Data**: Previously logged-in user

### E2E-010: Session survives across multiple tabs
- **Type**: Alternative Path
- **Priority**: Medium
- **Preconditions**: User logged in in Tab A
- **User Journey**:
  1. Open Tab B to same app URL
  2. Firebase detects existing session via IndexedDB
  3. `onAuthStateChanged` fires in Tab B
  4. Both tabs show logged-in state
- **Expected Results**:
  - UI: Both tabs show user menu with profile
  - API: Both tabs can make authenticated API calls
- **Verification Method**: snapshot / network
- **Test Data**: Logged-in user, two browser tabs

### E2E-011: Token refresh fails due to revoked refresh token
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: User logged in, admin revokes Firebase refresh token via Firebase console
- **User Journey**:
  1. User's Firebase refresh token is revoked (e.g., admin action or password change)
  2. Firebase ID token expires (after ~1 hour)
  3. SDK attempts to refresh token using revoked refresh token
  4. Refresh fails — `onAuthStateChanged` fires with `null`
  5. `useAuth` hook clears state and redirects to home
- **Expected Results**:
  - UI: User is logged out, redirected to `/`, "Sign In" button appears
  - API: No further authenticated requests sent
  - DB: No changes (soft logout only)
- **Verification Method**: snapshot / network
- **Test Data**: User with revoked refresh token

---

## Scenario Group 3: Profile Management with Firebase

### E2E-012: Update profile name and nickname
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: User logged in with valid Firebase session
- **User Journey**:
  1. Navigate to `/settings` or `/dashboard/settings`
  2. Change name to "Updated Name" and nickname to "updated_nick"
  3. Click "Save"
  4. Verify success toast appears
- **Expected Results**:
  - UI: Success toast, updated name/nickname displayed
  - API: `PATCH /api/auth/profile` with `{ name: "Updated Name", nickname: "updated_nick" }` returns updated profile
  - DB: TB_COMM_USER.userNm = "Updated Name", TB_COMM_USER.userNcnm = "updated_nick"
- **Verification Method**: snapshot / network / db-query
- **Test Data**: `{ name: "Updated Name", nickname: "updated_nick" }`

### E2E-013: Update profile image URL
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: User logged in
- **User Journey**:
  1. Navigate to settings page
  2. Update profile image URL
  3. Save changes
- **Expected Results**:
  - API: `PATCH /api/auth/profile` with `{ profileImageUrl: "https://example.com/avatar.png" }` returns success
  - DB: TB_COMM_USER.prflImgUrl updated
- **Verification Method**: network / db-query
- **Test Data**: `{ profileImageUrl: "https://example.com/avatar.png" }`

### E2E-014: Set role to SELLER for first-time user
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: User logged in with default role "BUYER", has never changed role
- **User Journey**:
  1. After signup, user is prompted to select role
  2. User selects "Seller"
  3. Frontend calls `PATCH /api/auth/role` with `{ role: "SELLER" }`
  4. Redirected to seller dashboard
- **Expected Results**:
  - UI: Role badge changes to "Seller", redirected to `/dashboard/products/create`
  - API: `PATCH /api/auth/role` returns `{ success: true, data: { role: "SELLER" } }`
  - DB: TB_COMM_USER.useRoleCd = "SELLER"
- **Verification Method**: snapshot / network / db-query
- **Test Data**: `{ role: "SELLER" }`

### E2E-015: Profile update with expired Firebase token triggers re-auth
- **Type**: Edge Case
- **Priority**: High
- **Preconditions**: User logged in, Firebase ID token has expired but refresh token is valid
- **User Journey**:
  1. User has been idle; ID token expired
  2. User navigates to settings and clicks "Save" on profile changes
  3. `apiFetch` calls `getIdToken()` which auto-refreshes the token
  4. `PATCH /api/auth/profile` succeeds with fresh token
- **Expected Results**:
  - UI: Profile update succeeds without user noticing token refresh
  - API: Request succeeds (200), no 401 returned to user
- **Verification Method**: network
- **Test Data**: User with expired ID token

---

## Scenario Group 4: Account Deletion with Firebase

### E2E-016: Soft delete account via settings
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: User logged in as active user
- **User Journey**:
  1. Navigate to `/settings`
  2. Click "Delete Account"
  3. Confirm deletion in dialog
  4. Frontend calls `DELETE /api/auth/account`
  5. Frontend calls `signOut(auth)` and clears localStorage
  6. User redirected to homepage
- **Expected Results**:
  - UI: User logged out, redirected to `/`, "Sign In" button visible
  - API: `DELETE /api/auth/account` returns `{ success: true, data: { message: "Account deleted" } }`
  - DB: TB_COMM_USER.delYn = "Y", TB_COMM_USER.userSttsCd = "INAC"
- **Verification Method**: snapshot / network / db-query
- **Test Data**: Active user account

### E2E-017: Deleted account cannot access authenticated endpoints
- **Type**: Security
- **Priority**: Critical
- **Preconditions**: User's account has been soft-deleted (delYn='Y', userSttsCd='INAC'), but Firebase account still exists
- **User Journey**:
  1. User signs in again via Firebase (Firebase account not deleted)
  2. Frontend calls `GET /api/auth/me` with valid Firebase token
  3. FirebaseAuthGuard finds user by `firebaseUid`
  4. Guard checks `delYn` = "Y" or `userSttsCd` = "INAC"
  5. Guard throws UnauthorizedException
- **Expected Results**:
  - UI: Error displayed, user cannot access any authenticated page
  - API: `GET /api/auth/me` returns 401 `"Account is inactive or deleted"`
  - DB: No changes to soft-deleted record
- **Verification Method**: network / db-query
- **Test Data**: Soft-deleted user attempting re-login

### E2E-018: Suspended account blocked by guard
- **Type**: Security
- **Priority**: High
- **Preconditions**: User account has `userSttsCd` = "SUSP" (admin-suspended)
- **User Journey**:
  1. Suspended user signs in via Firebase
  2. Calls `GET /api/auth/me`
  3. Guard finds user, checks status = "SUSP"
  4. Guard throws UnauthorizedException
- **Expected Results**:
  - UI: Error message displayed
  - API: 401 `"Account has been suspended"`
- **Verification Method**: network
- **Test Data**: User with `userSttsCd` = "SUSP"

---

## Scenario Group 5: Security Scenarios

### E2E-019: Request with expired Firebase ID token (no auto-refresh)
- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: User has a manually stored expired Firebase ID token (bypassing SDK auto-refresh, e.g., direct API call with stale token)
- **User Journey**:
  1. Send `GET /api/auth/me` with an expired Firebase ID token in Authorization header
  2. FirebaseAuthGuard calls `firebaseService.verifyIdToken()`
  3. `jwt.verify()` fails due to token expiry
  4. Guard throws UnauthorizedException
- **Expected Results**:
  - API: 401 `"Invalid or expired authentication token"`
  - Server Log: `Firebase token verification failed: jwt expired` warning
- **Verification Method**: network / server-log
- **Test Data**: Expired JWT token string

### E2E-020: Request with completely invalid token
- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: None
- **User Journey**:
  1. Send `GET /api/auth/me` with `Authorization: Bearer invalid_garbage_token`
  2. `jwt.decode()` fails or returns invalid structure
  3. Guard throws UnauthorizedException
- **Expected Results**:
  - API: 401 `"Invalid or expired authentication token"`
  - Server Log: Warning logged with decode error
- **Verification Method**: network / server-log
- **Test Data**: `{ token: "invalid_garbage_token" }`

### E2E-021: Request with missing Authorization header
- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: None
- **User Journey**:
  1. Send `GET /api/auth/me` without Authorization header
  2. Guard extracts null token
  3. Guard throws UnauthorizedException (endpoint is not @Public)
- **Expected Results**:
  - API: 401 `"Missing authentication token"`
- **Verification Method**: network
- **Test Data**: No auth header

### E2E-022: Request with token signed by wrong key (forged token)
- **Type**: Security
- **Priority**: Critical
- **Preconditions**: Attacker crafts a JWT signed with a non-Google private key
- **User Journey**:
  1. Send `GET /api/auth/me` with forged JWT containing valid claims but wrong signature
  2. `jwt.verify()` checks signature against Google public certs
  3. Signature verification fails
  4. Guard throws UnauthorizedException
- **Expected Results**:
  - API: 401 `"Invalid or expired authentication token"`
  - Server Log: Verification failure logged
- **Verification Method**: network / server-log
- **Test Data**: Self-signed JWT with `{ sub: "fake_uid", email: "attacker@evil.com" }`

### E2E-023: Token with unknown `kid` header triggers cert re-fetch
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: Google has rotated signing keys; cached certs do not contain the token's `kid`
- **User Journey**:
  1. User sends request with token signed by newly rotated Google key
  2. FirebaseService checks cached certs — `kid` not found
  3. Service invalidates cache, fetches fresh certs from Google
  4. Second lookup succeeds with fresh certs
  5. Token verified successfully
- **Expected Results**:
  - API: Request succeeds (200)
  - Server Log: "Fetching Google public certs" logged (cache invalidation + re-fetch)
- **Verification Method**: network / server-log
- **Test Data**: Valid Firebase token after Google key rotation

### E2E-024: Public endpoint accessible without token
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Endpoint decorated with `@Public()`
- **User Journey**:
  1. Send request to a public endpoint (e.g., `GET /api/products`) without Authorization header
  2. Guard detects `@Public()` decorator via reflector
  3. Guard returns `true` without token verification
- **Expected Results**:
  - API: 200 with data returned
- **Verification Method**: network
- **Test Data**: No auth header, public endpoint URL

### E2E-025: Public endpoint with invalid token still accessible
- **Type**: Alternative Path
- **Priority**: Medium
- **Preconditions**: Endpoint decorated with `@Public()`, request includes an invalid token
- **User Journey**:
  1. Send request to a public endpoint with `Authorization: Bearer expired_token`
  2. Guard attempts token verification, fails
  3. Since endpoint is `@Public()`, guard returns `true` (silently fails)
  4. `request.user` is not set
- **Expected Results**:
  - API: 200 with data returned (user context not available)
- **Verification Method**: network
- **Test Data**: `{ token: "expired_token", endpoint: "GET /api/products" }`

### E2E-026: Concurrent API calls with same token
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: User logged in, multiple UI components trigger API calls simultaneously
- **User Journey**:
  1. Page load triggers 3 parallel API calls (`GET /api/auth/me`, `GET /api/products`, `GET /api/orders/my`)
  2. All use same Firebase ID token from `getIdToken()`
  3. All calls reach FirebaseAuthGuard concurrently
- **Expected Results**:
  - API: All 3 requests succeed (200)
  - Server Log: Google cert cache hit for 2nd and 3rd requests (fetched once)
  - DB: No race conditions on user lookup
- **Verification Method**: network / server-log
- **Test Data**: Valid token, 3 concurrent requests

### E2E-027: Token replay after account deletion
- **Type**: Security
- **Priority**: Critical
- **Preconditions**: User soft-deleted their account, still holds a valid (not yet expired) Firebase ID token
- **User Journey**:
  1. User deletes account (`DELETE /api/auth/account`)
  2. Without signing out of Firebase, user replays the still-valid token
  3. Calls `GET /api/auth/me`
  4. Guard finds user by `firebaseUid`, checks `delYn` = "Y"
  5. Guard throws UnauthorizedException
- **Expected Results**:
  - API: 401 `"Account is inactive or deleted"`
  - DB: Soft-deleted record unchanged
- **Verification Method**: network / db-query
- **Test Data**: Soft-deleted user with valid Firebase token

### E2E-028: Google cert fetch failure handled gracefully
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: Google cert endpoint (`googleapis.com`) is unreachable (network issue), cert cache is empty or expired
- **User Journey**:
  1. User sends authenticated request
  2. FirebaseService attempts to fetch Google public certs
  3. Fetch fails (network error or non-200 status)
  4. `verifyIdToken` throws error
  5. Guard catches and returns 401
- **Expected Results**:
  - API: 401 `"Invalid or expired authentication token"`
  - Server Log: Error logged: `Failed to fetch Google certs: ...`
- **Verification Method**: network / server-log
- **Test Data**: Simulated network failure (mock Google cert endpoint)

---

## Summary

| Type | Count | Scenario IDs |
|------|-------|-------------|
| Happy Path | 12 | E2E-001, E2E-002, E2E-004, E2E-005, E2E-006, E2E-007, E2E-008, E2E-009, E2E-012, E2E-013, E2E-014, E2E-024 |
| Alternative Path | 4 | E2E-003, E2E-010, E2E-015, E2E-025 |
| Edge Case | 3 | E2E-023, E2E-026, E2E-028 |
| Error Path | 5 | E2E-011, E2E-019, E2E-020, E2E-021, E2E-028 |
| Security | 4 | E2E-017, E2E-018, E2E-022, E2E-027 |
| **Total** | **28** | |

### Priority Breakdown

| Priority | Count |
|----------|-------|
| Critical | 11 |
| High | 9 |
| Medium | 8 |
| Low | 0 |

### Coverage by Scenario Group

| Group | Scenarios | Focus |
|-------|-----------|-------|
| 1. Firebase Token Verification Flow | E2E-001 ~ E2E-005 | Auto-create profile, UID re-link, welcome email, Google sign-in |
| 2. Token Auto-Refresh Mechanism | E2E-006 ~ E2E-011 | SDK auto-refresh, session persistence, multi-tab, revoked token |
| 3. Profile Management with Firebase | E2E-012 ~ E2E-015 | Name/nickname/image update, role setting, expired token re-auth |
| 4. Account Deletion with Firebase | E2E-016 ~ E2E-018 | Soft delete, deleted account blocked, suspended account blocked |
| 5. Security Scenarios | E2E-019 ~ E2E-028 | Expired/invalid/missing/forged tokens, cert rotation, replay attack, concurrent calls |
