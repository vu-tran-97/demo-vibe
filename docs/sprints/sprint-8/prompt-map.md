# Sprint 8 Prompt Map

## Sprint Goal
Enhance token security by shortening refresh token expiry to 3 days with automatic client-side refresh, reducing the attack window from 7-30 days to 3 days while keeping users seamlessly logged in.

## Previous Sprint Carryover
Sprint 7 completed all features (email service + role signup). No carryover.

## Feature 1: Enhanced Token Refresh Strategy

### 1.1 Design Prompt
(Already completed — see docs/blueprints/013-token-refresh/blueprint.md)

### 1.2 DB Design Reflection Prompt
N/A — No schema changes needed. Existing TB_COMM_RFRSH_TKN with TTL index handles expiry.

### 1.3 Test Case Prompt
/feature-dev "Based on docs/blueprints/013-token-refresh/blueprint.md,
write test cases to docs/tests/test-cases/sprint-8/token-refresh-test-cases.md.
Use Given-When-Then format, include:
- Unit tests: default fallback values, token generation expiry
- Integration tests: refresh endpoint with 3-day token, expired token rejection
- Frontend tests: isRefreshNeeded logic, auto-refresh interval behavior, refresh on app load
- Edge cases: refresh during network failure, concurrent refresh calls, logout on refresh failure
Do not modify any code yet."

### 1.4 Implementation Prompt
/feature-dev "Strictly follow docs/blueprints/013-token-refresh/blueprint.md:
Backend:
- Update server/.env: JWT_REFRESH_EXPIRATION=259200
- Update server/.env.example with same value
- Fix auth.service.ts default fallbacks: access=900, refresh=259200
Frontend:
- Add tokenRefreshedAt tracking to saveTokens/clearTokens in src/lib/auth.ts
- Add isRefreshNeeded() function (3 days interval)
- Add auto-refresh check on app load and hourly interval
- Handle refresh failure by logging out user
- Update Railway env var via railway CLI
Run all tests after implementation."
