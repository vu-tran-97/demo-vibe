# Firebase Authentication — Technical Document

> **Project:** Vibe E-Commerce Platform
> **Sprint:** Week 9 (2026-03-24)
> **Stack:** Next.js 15 (Frontend) + NestJS (Backend) + Firebase Auth + PostgreSQL

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Firebase Setup](#2-firebase-setup)
   - 2.1 Firebase Console Configuration
   - 2.2 Frontend Configuration
   - 2.3 Backend — Service Account (what it is, two approaches)
3. [Sign Up Flow](#3-sign-up-flow)
4. [Sign In Flow](#4-sign-in-flow)
5. [Withdrawal (Account Deletion)](#5-withdrawal-account-deletion)
6. [Token Verification — Server Side](#6-token-verification--server-side)
7. [Role-Based Access Control (RBAC)](#7-role-based-access-control-rbac)
8. [Email Service (SMTP / AWS SES)](#8-email-service-smtp--aws-ses)
   - 8.1 Provider Auto-Detection
   - 8.2 Google App Password (SMTP)
   - 8.3 AWS SES (Sandbox)
   - 8.4 Domain, DNS & Cloudflare (A, CNAME, MX, TXT, DKIM, SPF, DMARC)
   - 8.5 Email Templates
   - 8.6 Email Logging
9. [CORS & Proxy](#9-cors--proxy)
   - 9.1 What is CORS?
   - 9.2 CORS Configuration in NestJS
   - 9.3 How CORS Works (Preflight)
   - 9.4 Next.js Proxy (Alternative)
10. [Database Design & Relationships](#10-database-design--relationships)
    - 10.1 User Table (TB_COMM_USER)
    - 10.2 Relationships (1:1, 1:N, N:1, N:N)
    - 10.3 Join Examples (SQL)
    - 10.4 Index Strategy for Performance
    - 10.5 PK and FK Summary
11. [API Reference](#11-api-reference)
12. [File Structure](#12-file-structure)
13. [Test Results](#13-test-results)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Client (Next.js 15)                          │
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────────────────┐  │
│  │  Login Page   │    │  Signup Page  │    │  Settings Page        │  │
│  │  /auth/login  │    │  /auth/signup │    │  /dashboard/settings  │  │
│  └──────┬───────┘    └──────┬───────┘    └───────────┬───────────┘  │
│         │                   │                        │               │
│         ▼                   ▼                        ▼               │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                  src/lib/firebase.ts                         │    │
│  │           Firebase Web SDK (Client-side Auth)                │    │
│  │    createUserWithEmailAndPassword / signInWithEmailAndPassword│   │
│  └──────────────────────────┬──────────────────────────────────┘    │
│                              │ Firebase ID Token                     │
│  ┌──────────────────────────┴──────────────────────────────────┐    │
│  │                  src/lib/auth.ts                             │    │
│  │           apiFetch() — Auto-attach Bearer Token              │    │
│  └──────────────────────────┬──────────────────────────────────┘    │
└──────────────────────────────┼───────────────────────────────────────┘
                               │ HTTP + Authorization: Bearer {idToken}
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        Server (NestJS 4000)                          │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              FirebaseAuthGuard (Global Guard)                │    │
│  │                                                              │    │
│  │  1. Extract Bearer token from Authorization header           │    │
│  │  2. Verify token via Firebase Admin SDK                      │    │
│  │  3. Find user by Firebase UID → fallback by email            │    │
│  │  4. Auto-create user if first login                          │    │
│  │  5. Check account status (ACTV / INAC / SUSP)               │    │
│  │  6. Attach RequestUser to request object                     │    │
│  └──────────────────────────┬──────────────────────────────────┘    │
│                              │                                       │
│  ┌──────────────────────────┴──────────────────────────────────┐    │
│  │                RolesGuard (Global Guard)                     │    │
│  │                                                              │    │
│  │  Check @Roles() decorator → user.role ∈ requiredRoles?       │    │
│  │  Roles: BUYER, SELLER, SUPER_ADMIN                           │    │
│  └──────────────────────────┬──────────────────────────────────┘    │
│                              │                                       │
│  ┌──────────────────────────┴──────────────────────────────────┐    │
│  │              AuthController (/api/auth/*)                    │    │
│  │                                                              │    │
│  │  GET  /me       → Get profile                                │    │
│  │  PATCH /profile → Update name, nickname, image               │    │
│  │  PATCH /role    → Set role (BUYER / SELLER)                  │    │
│  │  DELETE /account → Soft-delete account                       │    │
│  └──────────────────────────┬──────────────────────────────────┘    │
│                              │                                       │
│  ┌──────────────────────────┴──────────────────────────────────┐    │
│  │                   PostgreSQL (Prisma ORM)                    │    │
│  │                                                              │    │
│  │  TB_COMM_USER (id, FIREBASE_UID, USE_EML, USE_ROLE_CD, ...) │    │
│  └─────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    Firebase Auth (Google Cloud)                       │
│                                                                      │
│  - User management (email/password, Google OAuth)                    │
│  - ID Token issuance (JWT, RS256, 1-hour expiry, auto-refresh)      │
│  - Admin SDK for server-side verification                            │
│  - Project: vibe-shop-ecommerce                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Why Firebase Auth instead of custom JWT?

| Criteria | Custom JWT | Firebase Auth |
|----------|-----------|---------------|
| Implementation time | 2-3 days | 2-3 hours |
| Password hashing | Must implement (bcrypt/argon2) | Handled by Google |
| Token refresh | Must implement rotation | SDK auto-refreshes |
| Social login (Google, Kakao) | Each provider = separate implementation | Built-in providers |
| Email verification | Must build | One API call |
| Password reset | Must build email flow | One API call |
| Security (brute force, rate limit) | Must implement | Built-in |
| Scalability | Must manage sessions | Stateless, serverless |

---

## 2. Firebase Setup

### 2.1 Firebase Console Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create project: `vibe-shop-ecommerce`
3. Enable **Authentication** → Sign-in providers:
   - Email/Password: **Enabled**
   - Google: **Enabled** (optional)
4. Get Web App config from Project Settings → General → Your apps

### 2.2 Frontend Configuration

**File: `src/lib/firebase.ts`**

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB6bGyC5pqbou49aqLNuFz4P9OH0eRv9X8",
  authDomain: "vibe-shop-ecommerce.firebaseapp.com",
  projectId: "vibe-shop-ecommerce",
  storageBucket: "vibe-shop-ecommerce.firebasestorage.app",
  messagingSenderId: "953565200792",
  appId: "1:953565200792:web:140b95fcde12cd13426bed",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

> **Note:** `apiKey` is a **public** identifier for the Firebase project. It does NOT grant access to data — Firebase Security Rules control that. It is safe to include in client-side code.

### 2.3 Backend Configuration — Service Account

#### What is a Service Account?

A **Service Account** is a special Google account that belongs to your **application** (not a human). It allows your backend server to call Google/Firebase APIs with its own identity.

```
┌──────────────────────────────────────────────────────────────┐
│                    Firebase Console                            │
│                                                                │
│  Project Settings → Service accounts                          │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Firebase Admin SDK                                   │    │
│  │                                                       │    │
│  │  Admin SDK configuration snippet:                     │    │
│  │    ○ Node.js  ○ Java  ○ Python  ○ Go                  │    │
│  │                                                       │    │
│  │  Service account:                                     │    │
│  │  firebase-adminsdk-xxxxx@vibe-shop-ecommerce.iam...   │    │
│  │                                                       │    │
│  │  [Generate new private key]  ← Downloads JSON file    │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

#### Two approaches to verify Firebase tokens

| Approach | How | Pros | Cons |
|----------|-----|------|------|
| **Firebase Admin SDK** (our approach) | Download service account JSON key → init admin SDK → `admin.auth().verifyIdToken()` | Simple, official, handles key rotation automatically | Extra dependency, need to store secret JSON file |
| **Google Public Certs** | Fetch public certs → verify JWT signature manually | Zero dependency, no secrets to manage | More code, must handle cert rotation |

#### Setup: Firebase Admin SDK (this project's approach)

```
1. Firebase Console → Project Settings → Service accounts
2. Click "Generate new private key" → Downloads firebase-service-account.json
3. Store the JSON file in project root (NEVER commit to git!)
4. Add to .gitignore: firebase-service-account.json
```

**File: `server/src/firebase/firebase.service.ts`**

```typescript
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
  onModuleInit() {
    if (admin.apps.length > 0) return;

    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
      || join(process.cwd(), '..', 'firebase-service-account.json');

    if (existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    } else {
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
    }
  }

  async verifyIdToken(idToken: string): Promise<DecodedFirebaseToken> {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return {
      uid: decoded.uid,
      email: decoded.email as string,
      email_verified: decoded.email_verified ?? false,
      name: decoded.name as string | undefined,
      picture: decoded.picture as string | undefined,
    };
  }
}
```

> The `firebase-service-account.json` contains a **private key** that grants full admin access to your Firebase project. If leaked, an attacker can read/write all data, create/delete users, etc.

**Why Firebase Admin SDK?**
- Official Google-supported approach — handles key rotation, token verification, and revocation checks automatically
- Single line verification: `admin.auth().verifyIdToken(idToken)`
- Access to additional admin features: user management, custom claims, token revocation

---

## 3. Sign Up Flow

```
 User                    Frontend (Next.js)                Firebase              Backend (NestJS)           PostgreSQL
  │                           │                              │                       │                        │
  │  Fill form & submit       │                              │                       │                        │
  │──────────────────────────>│                              │                       │                        │
  │                           │                              │                       │                        │
  │                           │  createUserWithEmailAndPassword                      │                        │
  │                           │─────────────────────────────>│                       │                        │
  │                           │                              │                       │                        │
  │                           │  UserCredential + ID Token   │                       │                        │
  │                           │<─────────────────────────────│                       │                        │
  │                           │                              │                       │                        │
  │                           │  updateProfile(displayName)  │                       │                        │
  │                           │─────────────────────────────>│                       │                        │
  │                           │                              │                       │                        │
  │                           │  PATCH /api/auth/profile     │                       │                        │
  │                           │  Authorization: Bearer {token}                       │                        │
  │                           │─────────────────────────────────────────────────────>│                        │
  │                           │                              │                       │                        │
  │                           │                              │    FirebaseAuthGuard   │                        │
  │                           │                              │    verifyIdToken()     │                        │
  │                           │                              │<──────────────────────│                        │
  │                           │                              │    decoded token       │                        │
  │                           │                              │──────────────────────>│                        │
  │                           │                              │                       │                        │
  │                           │                              │                       │  findUnique(firebaseUid)│
  │                           │                              │                       │───────────────────────>│
  │                           │                              │                       │  null (not found)      │
  │                           │                              │                       │<───────────────────────│
  │                           │                              │                       │                        │
  │                           │                              │                       │  create({              │
  │                           │                              │                       │    firebaseUid,        │
  │                           │                              │                       │    email, name,        │
  │                           │                              │                       │    role: 'BUYER'       │
  │                           │                              │                       │  })                    │
  │                           │                              │                       │───────────────────────>│
  │                           │                              │                       │  user record           │
  │                           │                              │                       │<───────────────────────│
  │                           │                              │                       │                        │
  │                           │  { success: true, data: user profile }               │                        │
  │                           │<─────────────────────────────────────────────────────│                        │
  │                           │                              │                       │                        │
  │                           │  PATCH /api/auth/role        │                       │                        │
  │                           │  { role: "SELLER" }          │                       │                        │
  │                           │─────────────────────────────────────────────────────>│                        │
  │                           │                              │                       │  update(useRoleCd)     │
  │                           │                              │                       │───────────────────────>│
  │                           │                              │                       │<───────────────────────│
  │                           │  { success: true, data: { role: "SELLER" } }         │                        │
  │                           │<─────────────────────────────────────────────────────│                        │
  │                           │                              │                       │                        │
  │                           │  localStorage.setItem('user')│                       │                        │
  │                           │  router.push('/dashboard')   │                       │                        │
  │  Redirect to dashboard    │                              │                       │                        │
  │<──────────────────────────│                              │                       │                        │
```

### Frontend Code (`src/lib/auth.ts`)

```typescript
export async function signup(
  email: string,
  password: string,
  name: string,
  nickname?: string,
  role?: 'BUYER' | 'SELLER',
): Promise<{ user: UserInfo }> {
  // Step 1: Create Firebase user
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  // Step 2: Set display name in Firebase
  await firebaseUpdateProfile(cred.user, { displayName: name });

  // Step 3: Update profile in backend
  // (FirebaseAuthGuard auto-creates DB record on first API call)
  const updateBody: Record<string, unknown> = { name };
  if (nickname) updateBody.nickname = nickname;
  const profile = await apiFetch<UserInfo>('/api/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(updateBody),
  });

  // Step 4: Set role if provided
  if (role) {
    const updatedProfile = await apiFetch<UserInfo>('/api/auth/role', {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
    localStorage.setItem('user', JSON.stringify(updatedProfile));
    return { user: updatedProfile };
  }

  localStorage.setItem('user', JSON.stringify(profile));
  return { user: profile };
}
```

### Key Design Decisions

1. **Firebase creates the user first** → Backend only stores extended profile
2. **Auto-create on first API call** → Guard handles DB user creation (no separate /register endpoint)
3. **Role is set separately** → Default is BUYER, user explicitly selects SELLER
4. **localStorage for session** → Backed by Firebase SDK's `onAuthStateChanged` for persistence

---

## 4. Sign In Flow

```
 User                    Frontend                         Firebase              Backend
  │                           │                              │                       │
  │  Email + Password         │                              │                       │
  │──────────────────────────>│                              │                       │
  │                           │  signInWithEmailAndPassword  │                       │
  │                           │─────────────────────────────>│                       │
  │                           │  ID Token (JWT, RS256)       │                       │
  │                           │<─────────────────────────────│                       │
  │                           │                              │                       │
  │                           │  GET /api/auth/me            │                       │
  │                           │  Bearer {token}              │                       │
  │                           │─────────────────────────────────────────────────────>│
  │                           │                              │                       │
  │                           │            Guard: verify token → find user → attach  │
  │                           │                              │                       │
  │                           │  { id, email, name, role }   │                       │
  │                           │<─────────────────────────────────────────────────────│
  │                           │                              │                       │
  │                           │  localStorage.setItem('user')│                       │
  │                           │  redirect by role            │                       │
  │  BUYER → '/'              │                              │                       │
  │  SELLER → '/dashboard'    │                              │                       │
  │<──────────────────────────│                              │                       │
```

### Frontend Code

```typescript
export async function login(email: string, password: string): Promise<{ user: UserInfo }> {
  // Step 1: Authenticate with Firebase
  await signInWithEmailAndPassword(auth, email, password);

  // Step 2: Fetch profile from backend (guard auto-creates if needed)
  const profile = await apiFetch<UserInfo>('/api/auth/me');
  localStorage.setItem('user', JSON.stringify(profile));
  return { user: profile };
}
```

### Firebase ID Token Structure (JWT)

```json
{
  "header": {
    "alg": "RS256",
    "kid": "abc123...",          // Key ID — matches Google public cert
    "typ": "JWT"
  },
  "payload": {
    "iss": "https://securetoken.google.com/vibe-shop-ecommerce",
    "aud": "vibe-shop-ecommerce", // Must match PROJECT_ID
    "sub": "NQ913ow61XSJ...",   // Firebase UID (unique per user)
    "email": "user@example.com",
    "email_verified": false,
    "name": "Test User",
    "iat": 1711252800,           // Issued at
    "exp": 1711256400,           // Expires in 1 hour
    "auth_time": 1711252800      // Last authentication time
  },
  "signature": "RS256(...)"      // Signed with Google's private key
}
```

### Token Lifecycle

| Event | Duration | Action |
|-------|----------|--------|
| Token issued | 0 min | Fresh token from Firebase |
| Token used | 0-55 min | Valid, no refresh needed |
| Auto-refresh | ~55 min | Firebase SDK silently refreshes |
| Token expires | 60 min | If not refreshed, 401 Unauthorized |
| User signs out | — | Token invalidated client-side |

> Firebase SDK (`getIdToken()`) automatically refreshes the token before expiry. No manual refresh logic is needed.

---

## 5. Withdrawal (Account Deletion)

### Design: Soft Delete

Account deletion uses **soft delete** — the record stays in the database with `delYn='Y'` and `userSttsCd='INAC'`. This allows:
- Data retention for compliance/audit
- Order history preservation
- Potential account recovery

```
 User                    Frontend                         Backend                 PostgreSQL
  │                           │                              │                       │
  │  Click "Delete Account"   │                              │                       │
  │──────────────────────────>│                              │                       │
  │                           │  DELETE /api/auth/account     │                       │
  │                           │  Bearer {token}              │                       │
  │                           │─────────────────────────────>│                       │
  │                           │                              │  UPDATE TB_COMM_USER  │
  │                           │                              │  SET DEL_YN='Y',      │
  │                           │                              │      USE_STTS_CD='INAC'│
  │                           │                              │─────────────────────>│
  │                           │                              │  OK                   │
  │                           │                              │<─────────────────────│
  │                           │  { message: "Account deleted"}                      │
  │                           │<─────────────────────────────│                       │
  │                           │                              │                       │
  │                           │  signOut(auth)               │                       │
  │                           │  localStorage.removeItem     │                       │
  │                           │  redirect to '/'             │                       │
  │  Redirect to home         │                              │                       │
  │<──────────────────────────│                              │                       │
```

### After Deletion — Re-login Attempt

```
  │  Try to sign in again     │                              │                       │
  │──────────────────────────>│                              │                       │
  │                           │  signInWithEmailAndPassword  │                       │
  │                           │─────────────────────────────>│                       │
  │                           │  ID Token (still valid in Firebase)                  │
  │                           │<─────────────────────────────│                       │
  │                           │                              │                       │
  │                           │  GET /api/auth/me            │                       │
  │                           │  Bearer {token}              │                       │
  │                           │─────────────────────────────>│                       │
  │                           │                              │  Guard: finds user    │
  │                           │                              │  delYn='Y' → REJECT   │
  │                           │  401: "Account is inactive or deleted"               │
  │                           │<─────────────────────────────│                       │
  │                           │                              │                       │
  │  Error: Account deleted   │                              │                       │
  │<──────────────────────────│                              │                       │
```

### Backend Code

```typescript
// auth.service.ts
async deleteAccount(userId: number) {
  const user = await this.prisma.user.findFirst({
    where: { id: userId, delYn: 'N' },
  });
  if (!user) throw new BusinessException('USER_NOT_FOUND', 'User not found', 404);

  await this.prisma.user.update({
    where: { id: userId },
    data: {
      delYn: 'Y',           // Soft delete flag
      userSttsCd: 'INAC',   // Status = Inactive
      mdfrId: String(userId),
    },
  });
  return { message: 'Account deleted successfully' };
}

// firebase-auth.guard.ts — blocks deleted/inactive accounts
if (user.delYn === 'Y' || user.userSttsCd === 'INAC') {
  throw new UnauthorizedException('Account is inactive or deleted');
}
```

---

## 6. Token Verification — Server Side

### How the backend verifies Firebase tokens using Firebase Admin SDK

```typescript
// server/src/firebase/firebase.service.ts

@Injectable()
export class FirebaseService implements OnModuleInit {
  onModuleInit() {
    // Initialize Firebase Admin SDK with service account
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
      || join(process.cwd(), '..', 'firebase-service-account.json');

    if (existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }
  }

  async verifyIdToken(idToken: string): Promise<DecodedFirebaseToken> {
    // Firebase Admin SDK handles everything:
    // - Fetches and caches Google public certs automatically
    // - Verifies RS256 signature
    // - Validates audience, issuer, expiry
    // - Checks token revocation (if enabled)
    const decoded = await admin.auth().verifyIdToken(idToken);

    return {
      uid: decoded.uid,
      email: decoded.email as string,
      email_verified: decoded.email_verified ?? false,
      name: decoded.name as string | undefined,
      picture: decoded.picture as string | undefined,
    };
  }
}
```

### What `admin.auth().verifyIdToken()` does internally

1. Fetches Google public certs and caches them (with automatic rotation)
2. Decodes JWT header to find matching `kid` (Key ID)
3. Verifies RS256 signature against the public cert
4. Validates claims: `aud` = project ID, `iss` = `https://securetoken.google.com/{projectId}`
5. Checks expiry (`exp`) and issued-at (`iat`) timestamps
6. Returns decoded token payload

---

## 7. Role-Based Access Control (RBAC)

### Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| `BUYER` | Default role | Browse products, create orders, board posts |
| `SELLER` | Set during signup | All BUYER permissions + create/manage products, manage orders |
| `SUPER_ADMIN` | Set by system | All permissions + user management, admin dashboard |

### Implementation

**Global Guards (app.module.ts):**
```typescript
providers: [
  { provide: APP_GUARD, useClass: FirebaseAuthGuard },  // Runs first
  { provide: APP_GUARD, useClass: RolesGuard },          // Runs second
]
```

**Guard Execution Order:**
```
Request → FirebaseAuthGuard → RolesGuard → Controller
              │                    │
              │ Verify token       │ Check @Roles()
              │ Attach user        │ user.role ∈ requiredRoles?
              │                    │
              ▼                    ▼
         request.user = {     PASS or 403 Forbidden
           id, firebaseUid,
           email, role, name
         }
```

**Decorators:**

```typescript
// Mark route as public (skip both guards)
@Public()
@Get('products')
async list() { ... }

// Restrict to specific roles
@Roles('SELLER', 'SUPER_ADMIN')
@Post('products')
async create() { ... }

// Inject current user
@Get('me')
async getProfile(@CurrentUser() user: RequestUser) { ... }
```

### Role Matrix

| Endpoint | BUYER | SELLER | SUPER_ADMIN | Public |
|----------|-------|--------|-------------|--------|
| `GET /api/products` | - | - | - | Yes |
| `POST /api/products` | No | Yes | Yes | - |
| `PUT /api/products/:id` | No | Yes | Yes | - |
| `DELETE /api/products/:id` | No | Yes | Yes | - |
| `POST /api/orders/checkout` | Yes | Yes | Yes | - |
| `GET /api/orders/seller/*` | No | Yes | Yes | - |
| `GET /api/admin/users` | No | No | Yes | - |
| `DELETE /api/board/posts/:id` (any) | No | No | Yes | - |

---

## 8. Email Service (SMTP / AWS SES)

### 8.1 Provider Auto-Detection

The `MailService` automatically selects the email provider based on environment variables:

```
                    ┌─────────────────────┐
                    │  MAIL_PROVIDER env  │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Explicit value?     │
                    │  "ses" or "smtp"     │
                    └──────────┬──────────┘
                          No   │   Yes → use that
                               │
                    ┌──────────▼──────────┐
                    │ AWS_SES_SMTP_USER   │
                    │    is set?          │
                    └──────────┬──────────┘
                     Yes       │        No
                      │        │         │
                ┌─────▼─────┐  │  ┌──────▼──────┐
                │  AWS SES   │  │  │    SMTP     │
                │  SMTP      │  │  │  (Gmail,    │
                │            │  │  │  Mailtrap)  │
                └────────────┘  │  └─────────────┘
```

**Code: `server/src/mail/mail.service.ts`**
```typescript
private resolveProvider(): MailProvider {
  const explicit = this.configService.get<string>('MAIL_PROVIDER');
  if (explicit === 'ses' || explicit === 'smtp') return explicit;

  // Auto-detect: if AWS SES SMTP credentials are set, use SES
  if (this.configService.get<string>('AWS_SES_SMTP_USER')) return 'ses';
  return 'smtp';
}
```

### 8.2 Option A: Google App Password (SMTP)

```
┌─────────────┐     SMTP (port 587)     ┌────────────────┐
│  NestJS      │────────────────────────>│  Google SMTP   │
│  MailService │     TLS + Auth          │  smtp.gmail.com│
└─────────────┘                          └────────────────┘
```

**Configuration (.env):**
```bash
MAIL_PROVIDER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=abcd efgh ijkl mnop    # Google App Password (16 chars)
MAIL_FROM="Vibe <your-email@gmail.com>"
```

**Google App Password Setup:**
1. Google Account → Security → 2-Step Verification → **Enable**
2. Google Account → Security → App passwords
3. Select app: "Mail", Device: "Other (NestJS)"
4. Copy the 16-character app password

### 8.3 Option B: AWS SES (Sandbox — Free, No Domain Required)

```
┌─────────────┐     SMTP (port 587)     ┌──────────────────────────┐
│  NestJS      │────────────────────────>│  AWS SES SMTP Endpoint   │
│  MailService │     TLS + SMTP Auth     │  email-smtp.ap-northeast │
└─────────────┘                          │  -2.amazonaws.com        │
                                         └──────────────────────────┘
```

#### Step-by-Step AWS SES Sandbox Setup

**Step 1: Create AWS Account**
- Go to https://aws.amazon.com → Create account (free tier)
- SES free tier: 62,000 emails/month (if sending from EC2), or 200/day in sandbox

**Step 2: Open SES Console**
- Go to https://console.aws.amazon.com/ses/
- Select region: **Asia Pacific (Seoul) — ap-northeast-2**

**Step 3: Verify Sender Email (Sandbox Mode)**
```
SES Console → Verified identities → Create identity
  → Identity type: Email address
  → Email address: your-email@gmail.com
  → Click "Create identity"
  → Check inbox → Click verification link
```
> In **Sandbox mode**, you must ALSO verify every **recipient** email address.
> This is enough for development/testing.

**Step 4: Verify Recipient Emails (Sandbox)**
```
SES Console → Verified identities → Create identity
  → Email address: test-recipient@yopmail.com
  → Verify via email link
```

**Step 5: Create SMTP Credentials**
```
SES Console → SMTP settings → Create SMTP credentials
  → IAM User Name: ses-smtp-user-vibe
  → Click "Create user"
  → Download credentials (SMTP username + password)
```

> **IMPORTANT:** SMTP credentials are different from IAM credentials!
> - SMTP username looks like: `AKIAIOSFODNN7EXAMPLE`
> - SMTP password looks like: `BM+H0bG2Kfiug5F1...` (derived from IAM secret)
> - You can only see the password ONCE at creation time

**Step 6: Configure .env**
```bash
MAIL_PROVIDER=ses
AWS_SES_REGION=ap-northeast-2
AWS_SES_SMTP_USER=AKIAIOSFODNN7EXAMPLE
AWS_SES_SMTP_PASSWORD=BM+H0bG2Kfiug5F1kVcXYZABCDEF...
MAIL_FROM="Vibe <your-verified-email@gmail.com>"
```

**Step 7: Test**
```bash
# Restart backend → check logs for:
# [MailService] Mail provider: AWS SES SMTP (ap-northeast-2)

# Test via signup flow or curl
curl -X POST http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer {token}"
# → Should trigger welcome email via SES
```

#### SES Sandbox vs Production

| Feature | Sandbox (Free) | Production |
|---------|---------------|------------|
| Sender | Must be verified email | Verified domain |
| Recipient | Must be verified email | Anyone |
| Daily limit | 200 emails/day | Negotiable (50K+) |
| Rate limit | 1 email/second | Negotiable (14+/sec) |
| Cost | Free | $0.10 per 1,000 emails |
| Domain required | No | Yes |
| Setup time | 5 minutes | 1-3 days (review) |

#### Moving to Production (When you have a domain)

**Step 1: Buy a cheap domain**
- Namecheap: `.xyz` for ~$1/year
- Use Cloudflare for DNS management (free)

**Step 2: Verify Domain in SES**
```
SES Console → Verified identities → Create identity
  → Identity type: Domain
  → Domain: yourdomain.xyz
```

**Step 3: Add DNS Records (Cloudflare)**

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| CNAME | `abc._domainkey` | `abc.dkim.amazonses.com` | DKIM signature (1/3) |
| CNAME | `def._domainkey` | `def.dkim.amazonses.com` | DKIM signature (2/3) |
| CNAME | `ghi._domainkey` | `ghi.dkim.amazonses.com` | DKIM signature (3/3) |
| TXT | `@` | `v=spf1 include:amazonses.com ~all` | SPF — authorize SES to send |
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.xyz` | DMARC policy |
| MX | `@` | `10 inbound-smtp.ap-northeast-2.amazonaws.com` | Receive bounces |

**Step 4: Request Production Access**
```
SES Console → Account dashboard → Request production access
  → Mail type: Transactional
  → Website URL: your app URL
  → Use case: Describe your email usage
  → Wait 1-3 business days for approval
```

**Step 5: Update .env**
```bash
MAIL_FROM="Vibe <noreply@yourdomain.xyz>"
# SMTP credentials remain the same
```

### 8.4 Domain, DNS & Cloudflare — Concepts

#### What is a Domain?

A domain is a **human-readable address** for a server on the internet.

```
IP address:  52.78.123.45      ← Máy hiểu
Domain:      vibe-shop.com     ← Người hiểu

Người gõ "vibe-shop.com" → DNS tra cứu → trả về 52.78.123.45 → Browser kết nối
```

#### What is DNS?

**DNS (Domain Name System)** is the "phonebook of the internet" — translates domain names to IP addresses.

```
Browser                     DNS Server                   Your Server
  │                            │                            │
  │  "vibe-shop.com ở đâu?"   │                            │
  │───────────────────────────>│                            │
  │                            │  Tra cứu DNS records       │
  │  "IP là 52.78.123.45"     │                            │
  │<───────────────────────────│                            │
  │                            │                            │
  │  Kết nối tới 52.78.123.45 │                            │
  │────────────────────────────────────────────────────────>│
  │                            │                            │
  │  Response (HTML/JSON)      │                            │
  │<────────────────────────────────────────────────────────│
```

#### DNS Record Types

| Type | Tên đầy đủ | Chức năng | Ví dụ |
|------|-----------|-----------|-------|
| **A** | Address Record | Domain → IPv4 address | `vibe-shop.com` → `52.78.123.45` |
| **AAAA** | IPv6 Address | Domain → IPv6 address | `vibe-shop.com` → `2001:db8::1` |
| **CNAME** | Canonical Name | Domain → domain khác (alias) | `www.vibe-shop.com` → `vibe-shop.com` |
| **MX** | Mail Exchange | Domain nhận email ở đâu | `vibe-shop.com` → `mail.google.com` (priority 10) |
| **TXT** | Text Record | Lưu text tùy ý (verification, SPF, DKIM) | `v=spf1 include:amazonses.com ~all` |
| **NS** | Name Server | Ai quản lý DNS cho domain này | `vibe-shop.com` → `ns1.cloudflare.com` |

#### Practical Examples

```
vibe-shop.com DNS Records:

Type   Name              Value                                    Purpose
─────  ────────────────  ───────────────────────────────────────  ──────────────────
A      vibe-shop.com     52.78.123.45                             Website server
CNAME  www               vibe-shop.com                            www → root domain
CNAME  api               api-server.vercel.app                    API subdomain
MX     vibe-shop.com     10 inbound-smtp.amazonaws.com            Receive emails
TXT    vibe-shop.com     v=spf1 include:amazonses.com ~all        SPF (email auth)
TXT    _dmarc            v=DMARC1; p=quarantine                   DMARC policy
CNAME  abc._domainkey    abc.dkim.amazonses.com                   DKIM (email sign)
```

#### What is Cloudflare?

**Cloudflare** is a free DNS management service + CDN + security layer.

```
Without Cloudflare:
  User → DNS (registrar) → Your Server

With Cloudflare:
  User → Cloudflare DNS → Cloudflare CDN/WAF → Your Server
                │
                ├── Free DNS management (easy UI)
                ├── Free CDN (cache static files globally)
                ├── Free SSL certificate (HTTPS)
                ├── DDoS protection
                └── Analytics
```

**Setup flow:**
```
1. Buy domain anywhere (Namecheap, GoDaddy, AWS Route 53)
2. Create Cloudflare account (free)
3. Add domain to Cloudflare
4. Cloudflare gives you 2 nameservers:
     ns1.cloudflare.com
     ns2.cloudflare.com
5. Go to domain registrar → change nameservers to Cloudflare's
6. Now manage ALL DNS records in Cloudflare dashboard
```

#### SES + Domain Authentication (Production)

When moving from SES Sandbox to Production, you need to **verify a domain** and add DNS records:

```
┌────────────────┐         ┌──────────────────┐         ┌───────────────┐
│  AWS SES       │         │  Cloudflare DNS  │         │  Email        │
│                │         │                  │         │  Recipient    │
│ "I will send   │         │  DNS records     │         │               │
│  emails from   │────────>│  prove that SES  │────────>│ "I trust this │
│  vibe-shop.com"│  DKIM   │  is authorized"  │  verify │  email is     │
│                │  SPF    │                  │         │  legit"       │
└────────────────┘  DMARC  └──────────────────┘         └───────────────┘
```

**DKIM (DomainKeys Identified Mail):**
- SES signs every email with a private key
- DNS has the public key (CNAME records)
- Recipient's mail server verifies the signature
- Proves: "This email was really sent by the domain owner"

```
SES Console → Verified identities → Create identity → Domain
  → vibe-shop.com
  → SES generates 3 CNAME records:

  CNAME  abc._domainkey.vibe-shop.com  →  abc.dkim.amazonses.com
  CNAME  def._domainkey.vibe-shop.com  →  def.dkim.amazonses.com
  CNAME  ghi._domainkey.vibe-shop.com  →  ghi.dkim.amazonses.com

  → Add these 3 CNAMEs in Cloudflare → Wait 5-10 min → Status: Verified
```

**SPF (Sender Policy Framework):**
- Tells the world: "Only these servers are allowed to send email for my domain"
- One TXT record in DNS

```
TXT  vibe-shop.com  "v=spf1 include:amazonses.com ~all"

Meaning:
  v=spf1                       → SPF version 1
  include:amazonses.com        → Allow AWS SES to send
  ~all                         → Soft-fail others (mark as suspicious)
```

**DMARC (Domain-based Message Authentication):**
- Policy that tells recipients what to do when DKIM/SPF fails
- Also sends reports about email abuse

```
TXT  _dmarc.vibe-shop.com  "v=DMARC1; p=quarantine; rua=mailto:dmarc@vibe-shop.com"

Meaning:
  v=DMARC1                     → DMARC version 1
  p=quarantine                 → If auth fails, put in spam (not reject)
  rua=mailto:...               → Send abuse reports to this email
```

**MX (Mail Exchange):**
- Where to deliver emails sent TO your domain
- Only needed if you want to RECEIVE emails at your domain

```
MX  vibe-shop.com  10 inbound-smtp.ap-southeast-1.amazonaws.com

Meaning:
  10                           → Priority (lower = higher priority)
  inbound-smtp...              → SES will receive bounced emails
```

#### Complete DNS Setup for SES Production

| # | Type | Name | Value | Purpose |
|---|------|------|-------|---------|
| 1 | CNAME | `abc._domainkey` | `abc.dkim.amazonses.com` | DKIM signature 1/3 |
| 2 | CNAME | `def._domainkey` | `def.dkim.amazonses.com` | DKIM signature 2/3 |
| 3 | CNAME | `ghi._domainkey` | `ghi.dkim.amazonses.com` | DKIM signature 3/3 |
| 4 | TXT | `@` | `v=spf1 include:amazonses.com ~all` | SPF — authorize SES |
| 5 | TXT | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:...` | DMARC policy |
| 6 | MX | `@` | `10 inbound-smtp.ap-southeast-1.amazonaws.com` | Bounce handling |

> In Cloudflare, `@` means the root domain (e.g., `vibe-shop.com`).

#### Current Project Status

| Item | Status | Notes |
|------|--------|-------|
| SES Sandbox | Active | Sender: `tranvu221097@gmail.com` verified |
| SMTP Credentials | Created | Region: ap-southeast-1 (Singapore) |
| Domain | Not yet | Need to purchase for production |
| DKIM/SPF/DMARC | Not yet | Need domain first |
| Production access | Not yet | Need domain + request approval |

### 8.5 Email Templates (renumbered from 8.4)

| Template | Trigger | Content |
|----------|---------|---------|
| Welcome | User signup (auto-create in guard) | Welcome message + getting started |
| Order Confirmation | Checkout completed | Order number, items, total |

### 8.6 Email Logging

Every email (success or failure) is logged to `TL_COMM_EML_LOG`:

```sql
SELECT "RCPNT_EML", "SBJ", "TMPLT_NM", "SND_STTS_CD", "ERR_MSG", "SND_DT"
FROM "TL_COMM_EML_LOG"
ORDER BY "SND_DT" DESC
LIMIT 10;
```

| Column | Description |
|--------|-------------|
| `SND_STTS_CD` | `SUCC` = sent, `FAIL` = error |
| `ERR_MSG` | Error details if failed |
| `TMPLT_NM` | `welcome`, `order-confirm` |

---

## 9. CORS & Proxy

### 9.1 What is CORS?

**CORS (Cross-Origin Resource Sharing)** is a security mechanism that prevents a web page from making requests to a different domain than the one serving the page.

```
Problem: Frontend (localhost:3000) → Backend (localhost:4000)
         Different ports = different origins = BLOCKED by browser

Solution: Backend explicitly allows the frontend origin
```

### 9.2 CORS Configuration in NestJS

**File: `server/src/main.ts`**

```typescript
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((u) => u.trim());

app.enableCors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, Postman, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, origin);
    } else {
      callback(null, false);  // Reject unknown origins
    }
  },
  credentials: true,  // Allow cookies and Authorization headers
});
```

### 9.3 How CORS Works (Preflight)

```
Browser                                          Server (NestJS)
  │                                                  │
  │  OPTIONS /api/auth/me                            │  ← Preflight request
  │  Origin: http://localhost:3000                   │
  │  Access-Control-Request-Method: GET              │
  │  Access-Control-Request-Headers: Authorization   │
  │─────────────────────────────────────────────────>│
  │                                                  │
  │  200 OK                                          │
  │  Access-Control-Allow-Origin: http://localhost:3000
  │  Access-Control-Allow-Methods: GET,POST,PATCH,DELETE
  │  Access-Control-Allow-Headers: Authorization,Content-Type
  │  Access-Control-Allow-Credentials: true          │
  │<─────────────────────────────────────────────────│
  │                                                  │
  │  GET /api/auth/me                                │  ← Actual request
  │  Origin: http://localhost:3000                   │
  │  Authorization: Bearer {token}                   │
  │─────────────────────────────────────────────────>│
  │                                                  │
  │  200 OK + Response body                          │
  │<─────────────────────────────────────────────────│
```

### 9.4 Next.js Proxy (Alternative to CORS)

For production, you can use Next.js `rewrites` to proxy API calls through the same origin:

**`next.config.ts`:**
```typescript
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*',
      },
    ];
  },
};
```

```
Before (CORS needed):
  Browser → http://localhost:3000 (page)
  Browser → http://localhost:4000/api/auth/me (API) ← different origin!

After (Proxy, no CORS):
  Browser → http://localhost:3000 (page)
  Browser → http://localhost:3000/api/auth/me (same origin!)
         → Next.js server proxies to http://localhost:4000/api/auth/me
```

| Approach | Development | Production | Pros | Cons |
|----------|------------|------------|------|------|
| CORS | Easy setup | Requires config | Standard, simple | Preflight overhead |
| Proxy | Works out of box | Recommended | No CORS issues, single domain | Extra hop |

---

## 10. Database Design & Relationships

### 10.1 User Table (TB_COMM_USER)

```sql
CREATE TABLE "TB_COMM_USER" (
  "id"           SERIAL       PRIMARY KEY,          -- PK (Auto-increment)
  "FIREBASE_UID" VARCHAR(128) NOT NULL UNIQUE,       -- FK to Firebase Auth
  "USE_EML"      VARCHAR(255) NOT NULL UNIQUE,       -- Email (unique)
  "USE_NM"       VARCHAR(100) NOT NULL,              -- Full name
  "USE_NCNM"     VARCHAR(50)  UNIQUE,                -- Nickname (unique, nullable)
  "PRFL_IMG_URL" TEXT,                               -- Profile image URL
  "USE_ROLE_CD"  VARCHAR(20)  NOT NULL DEFAULT 'BUYER', -- BUYER | SELLER | SUPER_ADMIN
  "USE_STTS_CD"  VARCHAR(20)  NOT NULL DEFAULT 'ACTV',  -- ACTV | INAC | SUSP
  "LST_LGN_DT"  TIMESTAMP,                          -- Last login datetime
  "RGST_DT"      TIMESTAMP    NOT NULL DEFAULT NOW(), -- Created at
  "RGTR_ID"      VARCHAR(50),                        -- Created by
  "MDFCN_DT"     TIMESTAMP    NOT NULL DEFAULT NOW(), -- Updated at
  "MDFR_ID"      VARCHAR(50),                        -- Updated by
  "DEL_YN"       CHAR(1)      NOT NULL DEFAULT 'N'   -- Soft delete flag
);

-- Indexes
CREATE UNIQUE INDEX "idx_user_firebase_uid" ON "TB_COMM_USER"("FIREBASE_UID");
CREATE UNIQUE INDEX "idx_user_email" ON "TB_COMM_USER"("USE_EML");
CREATE UNIQUE INDEX "idx_user_nickname" ON "TB_COMM_USER"("USE_NCNM");
```

### 10.2 Relationships (1:1, 1:N, N:1)

```
TB_COMM_USER (1) ──────< (N) TB_PROD_PRD          -- 1 Seller has N Products
TB_COMM_USER (1) ──────< (N) TB_COMM_ORDR          -- 1 Buyer has N Orders
TB_COMM_USER (1) ──────< (N) TB_COMM_BOARD_POST    -- 1 User has N Board Posts
TB_COMM_USER (1) ──────< (N) TL_COMM_LGN_LOG       -- 1 User has N Login Logs
TB_COMM_USER (1) ──────< (N) TL_COMM_EML_LOG       -- 1 User has N Email Logs (via email)

TB_COMM_ORDR (1) ──────< (N) TB_COMM_ORDR_ITEM     -- 1 Order has N Items
TB_PROD_PRD  (1) ──────< (N) TB_COMM_ORDR_ITEM     -- 1 Product in N OrderItems

TB_COMM_BOARD_POST (1) ──< (N) TB_COMM_BOARD_CMNT  -- 1 Post has N Comments
TB_COMM_BOARD_POST (1) ──< (N) TR_COMM_BOARD_LIKE  -- 1 Post has N Likes
TB_COMM_BOARD_POST (1) ──< (N) TB_COMM_BOARD_ATCH  -- 1 Post has N Attachments

TR_COMM_BOARD_LIKE: TB_COMM_USER (N) ──── (N) TB_COMM_BOARD_POST  -- Many-to-Many via junction
```

### 10.3 Join Examples (SQL)

**1:1 — User ↔ Firebase (conceptual, same table)**
```sql
-- User with their Firebase UID
SELECT id, "USE_EML", "FIREBASE_UID", "USE_ROLE_CD"
FROM "TB_COMM_USER"
WHERE "FIREBASE_UID" = 'NQ913ow61XSJ...';
```

**1:N — Seller → Products**
```sql
-- All products for a specific seller
SELECT u."USE_NM" AS seller_name, p."PRD_NM", p."PRD_PRC", p."STCK_QTY"
FROM "TB_COMM_USER" u
JOIN "TB_PROD_PRD" p ON u.id = p."SLLR_ID"
WHERE u."USE_ROLE_CD" = 'SELLER'
  AND u.id = 22
  AND p."DEL_YN" = 'N'
ORDER BY p."RGST_DT" DESC
LIMIT 20;
```

**N:1 — Order Items → Product + Seller**
```sql
-- Order details with product info and seller info
SELECT
  o."ORDR_NO",
  oi."PRD_NM",
  oi."UNIT_PRC",
  oi."ORDR_QTY",
  oi."SUBTOT_AMT",
  seller."USE_NM" AS seller_name,
  buyer."USE_NM" AS buyer_name
FROM "TB_COMM_ORDR" o
JOIN "TB_COMM_ORDR_ITEM" oi ON o.id = oi."ORDR_ID"
JOIN "TB_COMM_USER" seller ON oi."SLLR_ID" = seller.id
JOIN "TB_COMM_USER" buyer ON o."BYR_ID" = buyer.id
WHERE o."ORDR_NO" = 'ORD-20260324-001';
```

**N:N — Users ↔ Posts (via Likes junction table)**
```sql
-- Posts liked by a specific user
SELECT p."POST_TTL", p."LIKE_CNT", l."RGST_DT" AS liked_at
FROM "TR_COMM_BOARD_LIKE" l
JOIN "TB_COMM_BOARD_POST" p ON l."POST_ID" = p.id
WHERE l."USE_ID" = 43  -- buyer1
  AND p."DEL_YN" = 'N'
ORDER BY l."RGST_DT" DESC;
```

### 10.4 Index Strategy for Performance

```sql
-- PK indexes (auto-created)
-- Already exist: id (PK), FIREBASE_UID (UNIQUE), USE_EML (UNIQUE)

-- Product search performance
CREATE INDEX "idx_product_seller" ON "TB_PROD_PRD"("SLLR_ID");
CREATE INDEX "idx_product_category" ON "TB_PROD_PRD"("PRD_CTGR_CD");
CREATE INDEX "idx_product_status" ON "TB_PROD_PRD"("PRD_STTS_CD");
CREATE INDEX "idx_product_name_search" ON "TB_PROD_PRD"("PRD_NM" varchar_pattern_ops);

-- Order search performance
CREATE INDEX "idx_order_buyer" ON "TB_COMM_ORDR"("BYR_ID");
CREATE INDEX "idx_order_status" ON "TB_COMM_ORDR"("ORDR_STTS_CD");
CREATE INDEX "idx_orderitem_order" ON "TB_COMM_ORDR_ITEM"("ORDR_ID");
CREATE INDEX "idx_orderitem_seller" ON "TB_COMM_ORDR_ITEM"("SLLR_ID");

-- Board performance
CREATE INDEX "idx_post_user" ON "TB_COMM_BOARD_POST"("USE_ID");
CREATE INDEX "idx_post_category" ON "TB_COMM_BOARD_POST"("POST_CTGR_CD");
CREATE INDEX "idx_comment_post" ON "TB_COMM_BOARD_CMNT"("POST_ID");
```

### 10.5 PK and FK Summary

| Table | PK | FK References |
|-------|----|----|
| TB_COMM_USER | `id` (SERIAL) | — |
| TB_PROD_PRD | `id` (SERIAL) | `SLLR_ID` → TB_COMM_USER.id |
| TB_COMM_ORDR | `id` (SERIAL) | `BYR_ID` → TB_COMM_USER.id |
| TB_COMM_ORDR_ITEM | `id` (SERIAL) | `ORDR_ID` → TB_COMM_ORDR.id, `PRD_ID` → TB_PROD_PRD.id, `SLLR_ID` → TB_COMM_USER.id |
| TB_COMM_BOARD_POST | `id` (SERIAL) | `USE_ID` → TB_COMM_USER.id |
| TB_COMM_BOARD_CMNT | `id` (SERIAL) | `POST_ID` → TB_COMM_BOARD_POST.id, `USE_ID` → TB_COMM_USER.id |
| TR_COMM_BOARD_LIKE | `id` (SERIAL) | `POST_ID` → TB_COMM_BOARD_POST.id, `USE_ID` → TB_COMM_USER.id |
| TL_COMM_LGN_LOG | `id` (SERIAL) | `USE_ID` → TB_COMM_USER.id |

---

## 11. API Reference

### Auth Endpoints

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| `GET` | `/api/auth/me` | Required | Any | Get current user profile |
| `PATCH` | `/api/auth/profile` | Required | Any | Update name, nickname, image |
| `PATCH` | `/api/auth/role` | Required | Any | Set role (BUYER/SELLER) |
| `DELETE` | `/api/auth/account` | Required | Any | Soft-delete account |

### Request/Response Format

**All responses follow:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error responses:**
```json
{
  "success": false,
  "data": null,
  "error": "ERROR_CODE",
  "message": "Human-readable message"
}
```

### Example: GET /api/auth/me

**Request:**
```http
GET /api/auth/me HTTP/1.1
Host: localhost:4000
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 7,
    "firebaseUid": "NQ913ow61XSJLlhoMkyrwELMgk22",
    "email": "buyer1@yopmail.com",
    "name": "Anna Kim",
    "nickname": "buyer1",
    "profileImageUrl": null,
    "role": "BUYER"
  }
}
```

**Response (401):**
```json
{
  "success": false,
  "data": null,
  "error": "UNAUTHORIZED",
  "message": "Missing authentication token"
}
```

---

## 12. File Structure

```
src/
├── lib/
│   ├── firebase.ts              # Firebase Web SDK initialization
│   └── auth.ts                  # Auth functions (signup, login, logout, etc.)
├── hooks/
│   └── use-auth.ts              # useAuth() React hook (auth state management)
├── app/auth/
│   ├── login/page.tsx           # Login page (email/password)
│   ├── signup/page.tsx          # Signup page (name, email, password, role)
│   └── reset-password/page.tsx  # Password reset page

server/src/
├── firebase/
│   ├── firebase.module.ts       # Global module
│   ├── firebase.service.ts      # Token verification (Google public certs)
│   └── firebase-auth.guard.ts   # Global auth guard (verify + auto-create user)
├── auth/
│   ├── auth.module.ts           # Auth module
│   ├── auth.controller.ts       # /api/auth/* endpoints
│   ├── auth.service.ts          # User CRUD logic
│   ├── auth.guard.ts            # Re-export of FirebaseAuthGuard
│   ├── guards/
│   │   └── roles.guard.ts       # Role-based access control
│   ├── decorators/
│   │   ├── current-user.decorator.ts  # @CurrentUser()
│   │   ├── public.decorator.ts        # @Public()
│   │   └── roles.decorator.ts         # @Roles()
│   └── dto/
│       ├── update-profile.dto.ts      # { name?, nickname?, profileImageUrl? }
│       └── set-role.dto.ts            # { role: 'BUYER' | 'SELLER' }
├── mail/
│   ├── mail.module.ts           # Mail module
│   ├── mail.service.ts          # Nodemailer transporter + logging
│   ├── mail.constants.ts        # Template names and subjects
│   └── templates/
│       ├── welcome.ts           # Welcome email HTML
│       └── order-confirm.ts     # Order confirmation HTML
└── app.module.ts                # Global guards registration
```

---

## 13. Test Results

### Test Execution (2026-03-24)

| TC | Test Case | Result | Details |
|----|-----------|--------|---------|
| TC-001 | Sign Up as BUYER | **PASS** | Firebase signup + auto-create DB user + profile + role |
| TC-002 | Sign In as BUYER | **PASS** | Firebase login + profile persistence |
| TC-003 | Sign Up as SELLER | **PASS** | Firebase signup + role change to SELLER |
| TC-004a | BUYER → SELLER endpoint | **PASS** | 403 Forbidden |
| TC-004b | SELLER → create product | **PASS** | Authorized correctly |
| TC-004c | BUYER → admin endpoint | **PASS** | 403 Forbidden |
| TC-004d | SELLER → admin endpoint | **PASS** | 403 Forbidden |
| TC-005a | Wrong password | **PASS** | INVALID_LOGIN_CREDENTIALS |
| TC-005b | Non-existent email | **PASS** | INVALID_LOGIN_CREDENTIALS |
| TC-005c | No token | **PASS** | 401 Missing authentication token |
| TC-005d | Invalid token | **PASS** | 401 Invalid or expired token |
| TC-006 | Soft delete + re-login | **PASS** | Account blocked after deletion |

**Result: 12/12 PASS**

### Seeded Data

| Data | Count | Details |
|------|-------|---------|
| Seller accounts | 25 | seller1@yopmail.com → seller25@yopmail.com |
| Buyer accounts | 25 | buyer1@yopmail.com → buyer25@yopmail.com |
| Products | 50,000 | ~1,923 products per seller, 6 categories |

### Bug Found & Fixed

**Issue:** When a Firebase user is deleted and re-created (different UID, same email), the guard crashes with `Unique constraint failed on USE_EML` because it tries to create a new DB record while the old one exists.

**Fix:** Added email fallback lookup in `firebase-auth.guard.ts`:
```typescript
if (!user) {
  // Fallback: find by email and re-link Firebase UID
  const existingByEmail = await this.prisma.user.findUnique({
    where: { userEmail: decoded.email },
  });
  if (existingByEmail) {
    user = await this.prisma.user.update({
      where: { id: existingByEmail.id },
      data: { firebaseUid: decoded.uid },
    });
  } else {
    user = await this.prisma.user.create({ ... });
  }
}
```
