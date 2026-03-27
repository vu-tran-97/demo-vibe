# 013-Token-Refresh: Enhanced Token Refresh Strategy Blueprint

> Improve JWT token lifecycle — shorten refresh token expiry to 3 days with automatic client-side refresh interval, replacing the current 30-day static approach.

## 1. Overview

### 1.1 Purpose

The current system sets refresh tokens to 30 days (default fallback in code) or 7 days (`.env` config). This is too long — a stolen refresh token gives an attacker access for days. This feature shortens the refresh token expiry to **3 days** and adds a **client-side auto-refresh mechanism** that refreshes tokens every 3 days automatically, keeping the user logged in seamlessly while improving security.

### 1.2 Current State

| Setting | Current Value | Location |
|---------|--------------|----------|
| Access token expiry | 900s (15 min) | `JWT_ACCESS_EXPIRATION=900` |
| Refresh token expiry | 604800s (7 days) | `JWT_REFRESH_EXPIRATION=604800` |
| Default fallback | 2592000s (30 days) | `auth.service.ts` hardcoded |
| Token storage | localStorage | `src/lib/auth.ts` |
| Auto-refresh | None | No client-side refresh logic |

### 1.3 Target State

| Setting | New Value | Rationale |
|---------|-----------|-----------|
| Access token expiry | 900s (15 min) | Keep as-is — short-lived |
| Refresh token expiry | 259200s (3 days) | Reduce attack window |
| Default fallback | 259200s (3 days) | Match .env config |
| Token storage | localStorage (unchanged) | No change this sprint |
| Auto-refresh | Every 3 days on client | Keep user logged in seamlessly |

### 1.4 Scope

**Backend:**
- Update `JWT_REFRESH_EXPIRATION` to 259200 (3 days)
- Update default fallback in `auth.service.ts` from 2592000 to 259200
- Update access token default fallback from 2592000 to 900

**Frontend:**
- Add auto-refresh interval that checks token age and refreshes every 3 days
- Add token expiry timestamp tracking in localStorage
- Refresh on app load if token is older than 3 days
- Handle refresh failure gracefully (logout user)

### 1.5 Out of Scope

- Moving tokens from localStorage to httpOnly cookies (future sprint)
- Sliding window refresh (refresh on every API call)
- Multi-device session management

## 2. Technical Design

### 2.1 Backend Changes

#### server/.env
```env
JWT_ACCESS_EXPIRATION=900        # 15 minutes (unchanged)
JWT_REFRESH_EXPIRATION=259200    # 3 days (was 604800 = 7 days)
```

#### server/src/auth/auth.service.ts
```typescript
// Update default fallbacks
private getAccessExpiration(): number {
  return Number(this.configService.get('JWT_ACCESS_EXPIRATION') || 900); // 15 min
}

private getRefreshExpiration(): number {
  return Number(this.configService.get('JWT_REFRESH_EXPIRATION') || 259200); // 3 days
}
```

### 2.2 Frontend Changes

#### src/lib/auth.ts — Token lifecycle management

```typescript
// Save refresh timestamp when tokens are saved
function saveTokens(data: AuthResponse): void {
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('user', JSON.stringify(data.user));
  localStorage.setItem('tokenRefreshedAt', Date.now().toString());
}

// Check if refresh is needed (3 days = 259200000 ms)
const REFRESH_INTERVAL_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

export function isRefreshNeeded(): boolean {
  const refreshedAt = localStorage.getItem('tokenRefreshedAt');
  if (!refreshedAt) return true;
  return Date.now() - Number(refreshedAt) > REFRESH_INTERVAL_MS;
}
```

#### src/hooks/use-auth.ts or App-level component — Auto-refresh setup

```typescript
// On app mount, check if refresh is needed
useEffect(() => {
  if (isLoggedIn() && isRefreshNeeded()) {
    refreshTokens().catch(() => logout());
  }

  // Set interval to check every hour
  const interval = setInterval(() => {
    if (isLoggedIn() && isRefreshNeeded()) {
      refreshTokens().catch(() => logout());
    }
  }, 60 * 60 * 1000); // check every 1 hour

  return () => clearInterval(interval);
}, []);
```

### 2.3 Flow Diagram

```
[User logs in]
     |
[Backend: Generate access (15min) + refresh (3 days)]
     |
[Frontend: Save tokens + tokenRefreshedAt timestamp]
     |
     ├── [Every 1 hour] → Check if 3 days passed
     │      |
     │      ├── Yes → POST /api/auth/refresh → New tokens + reset timer
     │      └── No  → Skip
     |
     ├── [On app load] → Check if 3 days passed
     │      |
     │      ├── Yes → POST /api/auth/refresh → New tokens
     │      └── No  → Use existing tokens
     |
     └── [Refresh fails] → Logout user (token expired/revoked)
```

## 3. Implementation Notes

- The 1-hour check interval is a lightweight poll — it only calls the API when 3 days have actually passed
- Token rotation is already implemented (old refresh token is revoked on refresh)
- Token reuse detection is already implemented (revokes all tokens if reuse detected)
- `expiresIn` in API response should reflect the actual access token expiry (900s), not refresh
- Railway env vars need to be updated: `JWT_REFRESH_EXPIRATION=259200`
