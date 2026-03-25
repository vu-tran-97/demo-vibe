# 014-DB-Migration-Firebase: MongoDB → PostgreSQL + Firebase Auth Blueprint

> Migrate database from MongoDB to PostgreSQL and replace custom JWT auth with Firebase Authentication.

## 1. Overview

### 1.1 Purpose

Replace MongoDB with PostgreSQL for better relational data integrity and migrate authentication to Firebase for managed token handling, built-in social auth, and automatic email verification/password reset.

### 1.2 Scope

**Database Migration (MongoDB → PostgreSQL):**
- Change Prisma provider from `mongodb` to `postgresql`
- Convert all 21 models: ObjectId → Int (autoincrement)
- Update Docker from MongoDB to PostgreSQL
- Update seed scripts
- Prisma migrate to create tables

**Firebase Auth Integration:**
- Firebase Admin SDK (backend) for token verification
- Firebase Client SDK (frontend) for signup/signin/signout
- Firebase handles: email/password auth, email verification, password reset, token management
- Remove: custom JWT generation, RefreshToken table, bcrypt password hashing, custom OAuth providers
- Keep: User profile table (role, status, app-specific fields), LoginLog, EmailLog

**Social Auth:**
- Google/Kakao/Naver → Firebase Authentication providers
- Remove custom OAuth2 implementations

### 1.3 Out of Scope

- Data migration from existing MongoDB (fresh start for dev)
- Firebase Firestore (still using PostgreSQL for app data)
- Firebase Cloud Functions
- Firebase Hosting

### 1.4 Architecture Change

```
BEFORE:
  Client → NestJS (JWT verify) → MongoDB (Prisma)
  Client → NestJS (bcrypt) → Password in MongoDB
  Client → NestJS (custom OAuth) → Google/Kakao/Naver

AFTER:
  Client → Firebase SDK (auth) → Firebase Auth (managed)
  Client → NestJS (Firebase token verify) → PostgreSQL (Prisma)
  Client → Firebase SDK (social) → Google/Kakao/Naver via Firebase
```

## 2. Database Schema Changes

### 2.1 Provider Change
```prisma
// Before
datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

// After
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2.2 ID Type Change (all 21 models)
```prisma
// Before (MongoDB)
id String @id @default(auto()) @map("_id") @db.ObjectId

// After (PostgreSQL)
id Int @id @default(autoincrement())
```

All foreign key fields: `@db.ObjectId` → remove, type `String` → `Int`

### 2.3 Array Fields
- `String[]` (e.g., srchTags, prdImgUrls) → PostgreSQL native array support (works with Prisma)

### 2.4 Json Fields
- `Json?` (e.g., mtdt in EmailLog) → PostgreSQL `jsonb` (works with Prisma)

### 2.5 Models to Remove
- `RefreshToken` (TB_COMM_RFRSH_TKN) — Firebase manages tokens
- `SocialAccount` (TB_COMM_SCL_ACNT) — Firebase manages social linking

### 2.6 Models to Update (User)
- Remove: `userPswd`, `emlVrfcTkn`, `emlVrfcExprDt`, `emailVrfcYn`, `pswdRstTkn`, `pswdRstExprDt`
- Add: `firebaseUid` (String, unique) — links to Firebase Auth user
- Keep: `useRoleCd`, `userSttsCd`, `userNm`, `userNcnm`, `prflImgUrl`, etc.

## 3. Firebase Auth Integration

### 3.1 Backend (NestJS + firebase-admin)
- FirebaseAuthGuard replaces JwtAuthGuard
- Verify Firebase ID token on every request
- Extract user from token, lookup in PostgreSQL by firebaseUid
- Auto-create user profile on first login (if not exists)

### 3.2 Frontend (Next.js + firebase SDK)
- `firebase/auth` for signInWithEmailAndPassword, createUserWithEmailAndPassword
- `onAuthStateChanged` for session management
- `getIdToken()` for API authorization header
- Remove localStorage token management

### 3.3 Social Auth
- Firebase handles Google sign-in natively
- Kakao/Naver: use Firebase custom token (backend generates after OAuth)

## 4. Environment Variables

### New
```env
# PostgreSQL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/demo_vibe

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY=your-private-key
```

### Removed
```env
JWT_SECRET (Firebase manages)
JWT_ACCESS_EXPIRATION (Firebase manages)
JWT_REFRESH_EXPIRATION (Firebase manages)
```

## 5. Implementation Order

1. Docker: MongoDB → PostgreSQL
2. Prisma schema: Convert all models
3. prisma migrate dev — create tables
4. Seed script: Update for PostgreSQL (Int IDs)
5. Install firebase-admin (backend) + firebase (frontend)
6. Create FirebaseAuthGuard + FirebaseService
7. Update AuthService (delegate to Firebase)
8. Update AuthController (simplified endpoints)
9. Remove: JWT strategy, passport-jwt, bcrypt, RefreshToken logic
10. Update frontend auth.ts + use-auth.ts
11. Update all service files (ObjectId string → Int references)
12. Test all endpoints
