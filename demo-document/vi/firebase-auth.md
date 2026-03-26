# Xác thực Firebase — Tài liệu kỹ thuật

> **Du an:** Nen tang Thuong mai dien tu Vibe
> **Sprint:** Tuan 9 (2026-03-24)
> **Cong nghe:** Next.js 15 (Frontend) + NestJS (Backend) + Firebase Auth + PostgreSQL

---

## Muc luc

1. [Tong quan kien truc](#1-tong-quan-kien-truc)
2. [Cai dat Firebase](#2-cai-dat-firebase)
   - 2.1 Cau hinh Firebase Console
   - 2.2 Cau hinh Frontend
   - 2.3 Backend — Service Account (khai niem va hai cach tiep can)
3. [Luong Dang ky](#3-luong-dang-ky)
4. [Luong Dang nhap](#4-luong-dang-nhap)
5. [Xoa tai khoan (Rut lui)](#5-xoa-tai-khoan-rut-lui)
6. [Xac minh Token — Phia Server](#6-xac-minh-token--phia-server)
7. [Kiem soat truy cap dua tren vai tro (RBAC)](#7-kiem-soat-truy-cap-dua-tren-vai-tro-rbac)
8. [Dich vu Email (SMTP / AWS SES)](#8-dich-vu-email-smtp--aws-ses)
   - 8.1 Tu dong phat hien nha cung cap
   - 8.2 Google App Password (SMTP)
   - 8.3 AWS SES (Sandbox)
   - 8.4 Ten mien, DNS & Cloudflare (A, CNAME, MX, TXT, DKIM, SPF, DMARC)
   - 8.5 Mau Email
   - 8.6 Ghi nhat ky Email
9. [CORS & Proxy](#9-cors--proxy)
   - 9.1 CORS la gi?
   - 9.2 Cau hinh CORS trong NestJS
   - 9.3 CORS hoat dong nhu the nao (Preflight)
   - 9.4 Next.js Proxy (Phuong phap thay the)
10. [Thiet ke Co so du lieu & Cac moi quan he](#10-thiet-ke-co-so-du-lieu--cac-moi-quan-he)
    - 10.1 Bang Nguoi dung (TB_COMM_USER)
    - 10.2 Cac moi quan he (1:1, 1:N, N:1, N:N)
    - 10.3 Vi du Join (SQL)
    - 10.4 Chien luoc Index de toi uu hieu suat
    - 10.5 Tom tat PK va FK
11. [Tham chieu API](#11-tham-chieu-api)
12. [Cau truc thu muc](#12-cau-truc-thu-muc)
13. [Ket qua Kiem thu](#13-ket-qua-kiem-thu)

---

## 1. Tong quan kien truc

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Client (Next.js 15)                          │
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────────────────┐  │
│  │  Trang Dang   │    │  Trang Dang  │    │  Trang Cai dat        │  │
│  │  nhap         │    │  ky          │    │  /dashboard/settings  │  │
│  │  /auth/login  │    │  /auth/signup │    │                       │  │
│  └──────┬───────┘    └──────┬───────┘    └───────────┬───────────┘  │
│         │                   │                        │               │
│         ▼                   ▼                        ▼               │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                  src/lib/firebase.ts                         │    │
│  │           Firebase Web SDK (Xac thuc phia Client)           │    │
│  │    createUserWithEmailAndPassword / signInWithEmailAndPassword│   │
│  └──────────────────────────┬──────────────────────────────────┘    │
│                              │ Firebase ID Token                     │
│  ┌──────────────────────────┴──────────────────────────────────┐    │
│  │                  src/lib/auth.ts                             │    │
│  │           apiFetch() — Tu dong dinh kem Bearer Token        │    │
│  └──────────────────────────┬──────────────────────────────────┘    │
└──────────────────────────────┼───────────────────────────────────────┘
                               │ HTTP + Authorization: Bearer {idToken}
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        Server (NestJS 4000)                          │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              FirebaseAuthGuard (Guard Toan cuc)              │    │
│  │                                                              │    │
│  │  1. Trich xuat Bearer token tu header Authorization          │    │
│  │  2. Xac minh token qua Firebase Admin SDK                     │    │
│  │  3. Tim nguoi dung theo Firebase UID → du phong theo email   │    │
│  │  4. Tu dong tao nguoi dung neu dang nhap lan dau             │    │
│  │  5. Kiem tra trang thai tai khoan (ACTV / INAC / SUSP)      │    │
│  │  6. Dinh kem RequestUser vao doi tuong request               │    │
│  └──────────────────────────┬──────────────────────────────────┘    │
│                              │                                       │
│  ┌──────────────────────────┴──────────────────────────────────┐    │
│  │                RolesGuard (Guard Toan cuc)                   │    │
│  │                                                              │    │
│  │  Kiem tra decorator @Roles() → user.role ∈ requiredRoles?    │    │
│  │  Vai tro: BUYER, SELLER, SUPER_ADMIN                        │    │
│  └──────────────────────────┬──────────────────────────────────┘    │
│                              │                                       │
│  ┌──────────────────────────┴──────────────────────────────────┐    │
│  │              AuthController (/api/auth/*)                    │    │
│  │                                                              │    │
│  │  GET  /me       → Lay thong tin ca nhan                     │    │
│  │  PATCH /profile → Cap nhat ten, biet danh, anh dai dien     │    │
│  │  PATCH /role    → Dat vai tro (BUYER / SELLER)              │    │
│  │  DELETE /account → Xoa mem tai khoan                        │    │
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
│  - Quan ly nguoi dung (email/mat khau, Google OAuth)                │
│  - Cap phat ID Token (JWT, RS256, het han 1 gio, tu dong lam moi)  │
│  - Admin SDK de xac minh phia server                                │
│  - Du an: vibe-shop-ecommerce                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### Tai sao dung Firebase Auth thay vi JWT tu xay dung?

| Tieu chi | JWT tu xay dung | Firebase Auth |
|----------|----------------|---------------|
| Thoi gian trien khai | 2-3 ngay | 2-3 gio |
| Ma hoa mat khau | Phai tu trien khai (bcrypt/argon2) | Google xu ly |
| Lam moi token | Phai tu trien khai co che xoay vong | SDK tu dong lam moi |
| Dang nhap mang xa hoi (Google, Kakao) | Moi nha cung cap = mot lan trien khai rieng | Cac nha cung cap tich hop san |
| Xac minh email | Phai tu xay dung | Mot loi goi API |
| Dat lai mat khau | Phai xay dung luong gui email | Mot loi goi API |
| Bao mat (chong tan cong brute force, gioi han tan suat) | Phai tu trien khai | Tich hop san |
| Kha nang mo rong | Phai tu quan ly phien | Stateless (khong trang thai), serverless |

---

## 2. Cai dat Firebase

### 2.1 Cau hinh Firebase Console

1. Truy cap [Firebase Console](https://console.firebase.google.com/)
2. Tao du an: `vibe-shop-ecommerce`
3. Kich hoat **Authentication** → Nha cung cap dang nhap:
   - Email/Mat khau: **Da kich hoat**
   - Google: **Da kich hoat** (tuy chon)
4. Lay cau hinh Web App tu Project Settings → General → Your apps

### 2.2 Cau hinh Frontend

**Tep: `src/lib/firebase.ts`**

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

> **Luu y:** `apiKey` la mot dinh danh **cong khai** cho du an Firebase. No KHONG cap quyen truy cap du lieu — Firebase Security Rules kiem soat dieu do. Viec bao gom no trong ma phia client la an toan.

### 2.3 Cau hinh Backend — Service Account

#### Service Account la gi?

Mot **Service Account** (Tai khoan dich vu) la mot tai khoan Google dac biet thuoc ve **ung dung** cua ban (khong phai con nguoi). No cho phep server backend goi cac API Google/Firebase voi danh tinh rieng cua no.

```
┌──────────────────────────────────────────────────────────────┐
│                    Firebase Console                            │
│                                                                │
│  Project Settings → Service accounts                          │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Firebase Admin SDK                                   │    │
│  │                                                       │    │
│  │  Doan ma cau hinh Admin SDK:                          │    │
│  │    ○ Node.js  ○ Java  ○ Python  ○ Go                  │    │
│  │                                                       │    │
│  │  Tai khoan dich vu:                                   │    │
│  │  firebase-adminsdk-xxxxx@vibe-shop-ecommerce.iam...   │    │
│  │                                                       │    │
│  │  [Tao khoa rieng moi]  ← Tai xuong tep JSON          │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

#### Hai cach tiep can de xac minh Firebase token

| Cach tiep can | Cach thuc | Uu diem | Nhuoc diem |
|---------------|-----------|---------|------------|
| **Firebase Admin SDK** (cach cua chung ta) | Tai xuong tep JSON khoa tai khoan dich vu → khoi tao admin SDK → `admin.auth().verifyIdToken()` | Don gian, chinh thuc, tu dong xu ly xoay vong khoa | Phu thuoc them, can luu tru tep JSON bi mat |
| **Google Public Certs** | Lay chung chi cong khai → xac minh chu ky JWT thu cong | Khong phu thuoc, khong bi mat can quan ly | Nhieu ma hon, phai xu ly viec xoay vong chung chi |

#### Cai dat: Firebase Admin SDK (cach tiep can cua du an nay)

```
1. Firebase Console → Project Settings → Service accounts
2. Nhan "Generate new private key" → Tai xuong firebase-service-account.json
3. Luu tru tep JSON tai thu muc goc du an (KHONG BAO GIO commit vao git!)
4. Them vao .gitignore: firebase-service-account.json
```

**Tep: `server/src/firebase/firebase.service.ts`**

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

> Tep `firebase-service-account.json` chua mot **khoa rieng** cap quyen admin day du cho du an Firebase cua ban. Neu bi lo, ke tan cong co the doc/ghi tat ca du lieu, tao/xoa nguoi dung, v.v.

**Tai sao chon Firebase Admin SDK?**
- Cach tiep can chinh thuc duoc Google ho tro — tu dong xu ly xoay vong khoa, xac minh token va kiem tra thu hoi
- Xac minh chi mot dong: `admin.auth().verifyIdToken(idToken)`
- Truy cap cac tinh nang quan tri bo sung: quan ly nguoi dung, custom claims, thu hoi token

---

## 3. Luong Dang ky

```
 Nguoi dung             Frontend (Next.js)                Firebase              Backend (NestJS)           PostgreSQL
  │                           │                              │                       │                        │
  │  Dien form & gui          │                              │                       │                        │
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
  │                           │                              │                       │  null (khong tim thay) │
  │                           │                              │                       │<───────────────────────│
  │                           │                              │                       │                        │
  │                           │                              │                       │  create({              │
  │                           │                              │                       │    firebaseUid,        │
  │                           │                              │                       │    email, name,        │
  │                           │                              │                       │    role: 'BUYER'       │
  │                           │                              │                       │  })                    │
  │                           │                              │                       │───────────────────────>│
  │                           │                              │                       │  ban ghi nguoi dung    │
  │                           │                              │                       │<───────────────────────│
  │                           │                              │                       │                        │
  │                           │  { success: true, data: thong tin nguoi dung }       │                        │
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
  │  Chuyen huong den bang dieu khien                        │                       │                        │
  │<──────────────────────────│                              │                       │                        │
```

### Ma Frontend (`src/lib/auth.ts`)

```typescript
export async function signup(
  email: string,
  password: string,
  name: string,
  nickname?: string,
  role?: 'BUYER' | 'SELLER',
): Promise<{ user: UserInfo }> {
  // Buoc 1: Tao nguoi dung Firebase
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  // Buoc 2: Dat ten hien thi trong Firebase
  await firebaseUpdateProfile(cred.user, { displayName: name });

  // Buoc 3: Cap nhat thong tin ca nhan trong backend
  // (FirebaseAuthGuard tu dong tao ban ghi DB khi goi API lan dau)
  const updateBody: Record<string, unknown> = { name };
  if (nickname) updateBody.nickname = nickname;
  const profile = await apiFetch<UserInfo>('/api/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(updateBody),
  });

  // Buoc 4: Dat vai tro neu duoc cung cap
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

### Cac quyet dinh thiet ke chinh

1. **Firebase tao nguoi dung truoc** → Backend chi luu thong tin mo rong
2. **Tu dong tao khi goi API lan dau** → Guard xu ly viec tao nguoi dung trong DB (khong can endpoint /register rieng)
3. **Vai tro duoc dat rieng** → Mac dinh la BUYER, nguoi dung tu chon SELLER
4. **localStorage cho phien** → Duoc ho tro boi `onAuthStateChanged` cua Firebase SDK de duy tri phien

---

## 4. Luong Dang nhap

```
 Nguoi dung             Frontend                         Firebase              Backend
  │                           │                              │                       │
  │  Email + Mat khau         │                              │                       │
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
  │                           │      Guard: xac minh token → tim nguoi dung → dinh kem│
  │                           │                              │                       │
  │                           │  { id, email, name, role }   │                       │
  │                           │<─────────────────────────────────────────────────────│
  │                           │                              │                       │
  │                           │  localStorage.setItem('user')│                       │
  │                           │  chuyen huong theo vai tro   │                       │
  │  BUYER → '/'              │                              │                       │
  │  SELLER → '/dashboard'    │                              │                       │
  │<──────────────────────────│                              │                       │
```

### Ma Frontend

```typescript
export async function login(email: string, password: string): Promise<{ user: UserInfo }> {
  // Buoc 1: Xac thuc voi Firebase
  await signInWithEmailAndPassword(auth, email, password);

  // Buoc 2: Lay thong tin ca nhan tu backend (guard tu dong tao neu can)
  const profile = await apiFetch<UserInfo>('/api/auth/me');
  localStorage.setItem('user', JSON.stringify(profile));
  return { user: profile };
}
```

### Cau truc Firebase ID Token (JWT)

```json
{
  "header": {
    "alg": "RS256",
    "kid": "abc123...",          // Ma Khoa — khop voi chung chi cong khai cua Google
    "typ": "JWT"
  },
  "payload": {
    "iss": "https://securetoken.google.com/vibe-shop-ecommerce",
    "aud": "vibe-shop-ecommerce", // Phai khop voi PROJECT_ID
    "sub": "NQ913ow61XSJ...",   // Firebase UID (duy nhat cho moi nguoi dung)
    "email": "user@example.com",
    "email_verified": false,
    "name": "Test User",
    "iat": 1711252800,           // Thoi diem cap phat
    "exp": 1711256400,           // Het han sau 1 gio
    "auth_time": 1711252800      // Thoi diem xac thuc cuoi cung
  },
  "signature": "RS256(...)"      // Ky bang khoa rieng cua Google
}
```

### Vong doi Token

| Su kien | Thoi gian | Hanh dong |
|---------|-----------|-----------|
| Token duoc cap phat | 0 phut | Token moi tu Firebase |
| Token duoc su dung | 0-55 phut | Hop le, khong can lam moi |
| Tu dong lam moi | ~55 phut | Firebase SDK tu dong lam moi |
| Token het han | 60 phut | Neu khong duoc lam moi, 401 Unauthorized |
| Nguoi dung dang xuat | — | Token bi vo hieu hoa phia client |

> Firebase SDK (`getIdToken()`) tu dong lam moi token truoc khi het han. Khong can logic lam moi thu cong.

---

## 5. Xoa tai khoan (Rut lui)

### Thiet ke: Xoa mem (Soft Delete)

Viec xoa tai khoan su dung **xoa mem** — ban ghi van con trong co so du lieu voi `delYn='Y'` va `userSttsCd='INAC'`. Dieu nay cho phep:
- Luu tru du lieu de tuan thu quy dinh/kiem toan
- Bao toan lich su don hang
- Kha nang khoi phuc tai khoan

```
 Nguoi dung             Frontend                         Backend                 PostgreSQL
  │                           │                              │                       │
  │  Nhan "Xoa Tai khoan"    │                              │                       │
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
  │                           │  { message: "Tai khoan da bi xoa"}                 │
  │                           │<─────────────────────────────│                       │
  │                           │                              │                       │
  │                           │  signOut(auth)               │                       │
  │                           │  localStorage.removeItem     │                       │
  │                           │  chuyen huong den '/'        │                       │
  │  Chuyen huong den trang chu│                             │                       │
  │<──────────────────────────│                              │                       │
```

### Sau khi Xoa — Thu dang nhap lai

```
  │  Thu dang nhap lai        │                              │                       │
  │──────────────────────────>│                              │                       │
  │                           │  signInWithEmailAndPassword  │                       │
  │                           │─────────────────────────────>│                       │
  │                           │  ID Token (van hop le trong Firebase)               │
  │                           │<─────────────────────────────│                       │
  │                           │                              │                       │
  │                           │  GET /api/auth/me            │                       │
  │                           │  Bearer {token}              │                       │
  │                           │─────────────────────────────>│                       │
  │                           │                              │  Guard: tim nguoi dung│
  │                           │                              │  delYn='Y' → TU CHOI  │
  │                           │  401: "Tai khoan khong hoat dong hoac da bi xoa"    │
  │                           │<─────────────────────────────│                       │
  │                           │                              │                       │
  │  Loi: Tai khoan da bi xoa│                              │                       │
  │<──────────────────────────│                              │                       │
```

### Ma Backend

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
      delYn: 'Y',           // Co xoa mem
      userSttsCd: 'INAC',   // Trang thai = Khong hoat dong
      mdfrId: String(userId),
    },
  });
  return { message: 'Account deleted successfully' };
}

// firebase-auth.guard.ts — chan tai khoan da xoa/khong hoat dong
if (user.delYn === 'Y' || user.userSttsCd === 'INAC') {
  throw new UnauthorizedException('Account is inactive or deleted');
}
```

---

## 6. Xac minh Token — Phia Server

### Cach backend xac minh Firebase token bang Firebase Admin SDK

```typescript
// server/src/firebase/firebase.service.ts

@Injectable()
export class FirebaseService implements OnModuleInit {
  onModuleInit() {
    // Khoi tao Firebase Admin SDK voi tai khoan dich vu
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
      || join(process.cwd(), '..', 'firebase-service-account.json');

    if (existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }
  }

  async verifyIdToken(idToken: string): Promise<DecodedFirebaseToken> {
    // Firebase Admin SDK xu ly moi thu:
    // - Lay va cache chung chi cong khai cua Google tu dong
    // - Xac minh chu ky RS256
    // - Xac thuc audience, issuer, thoi han
    // - Kiem tra thu hoi token (neu duoc kich hoat)
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

### `admin.auth().verifyIdToken()` thuc hien nhung gi ben trong

1. Lay chung chi cong khai cua Google va cache chung (voi xoay vong tu dong)
2. Giai ma header JWT de tim `kid` (Ma Khoa) phu hop
3. Xac minh chu ky RS256 voi chung chi cong khai
4. Xac thuc cac truong claim: `aud` = project ID, `iss` = `https://securetoken.google.com/{projectId}`
5. Kiem tra thoi han het han (`exp`) va thoi diem cap phat (`iat`)
6. Tra ve payload token da giai ma

---

## 7. Kiem soat truy cap dua tren vai tro (RBAC)

### Cac vai tro

| Vai tro | Mo ta | Quyen han |
|---------|-------|-----------|
| `BUYER` | Vai tro mac dinh | Xem san pham, tao don hang, dang bai viet |
| `SELLER` | Dat khi dang ky | Tat ca quyen cua BUYER + tao/quan ly san pham, quan ly don hang |
| `SUPER_ADMIN` | Dat boi he thong | Tat ca quyen + quan ly nguoi dung, bang dieu khien quan tri |

### Trien khai

**Guard Toan cuc (app.module.ts):**
```typescript
providers: [
  { provide: APP_GUARD, useClass: FirebaseAuthGuard },  // Chay truoc
  { provide: APP_GUARD, useClass: RolesGuard },          // Chay sau
]
```

**Thu tu Thuc thi Guard:**
```
Request → FirebaseAuthGuard → RolesGuard → Controller
              │                    │
              │ Xac minh token     │ Kiem tra @Roles()
              │ Dinh kem user      │ user.role ∈ requiredRoles?
              │                    │
              ▼                    ▼
         request.user = {     PASS hoac 403 Forbidden
           id, firebaseUid,
           email, role, name
         }
```

**Decorator:**

```typescript
// Danh dau route la cong khai (bo qua ca hai guard)
@Public()
@Get('products')
async list() { ... }

// Gioi han cho cac vai tro cu the
@Roles('SELLER', 'SUPER_ADMIN')
@Post('products')
async create() { ... }

// Tiem nguoi dung hien tai
@Get('me')
async getProfile(@CurrentUser() user: RequestUser) { ... }
```

### Ma tran Vai tro

| Endpoint | BUYER | SELLER | SUPER_ADMIN | Cong khai |
|----------|-------|--------|-------------|-----------|
| `GET /api/products` | - | - | - | Co |
| `POST /api/products` | Khong | Co | Co | - |
| `PUT /api/products/:id` | Khong | Co | Co | - |
| `DELETE /api/products/:id` | Khong | Co | Co | - |
| `POST /api/orders/checkout` | Co | Co | Co | - |
| `GET /api/orders/seller/*` | Khong | Co | Co | - |
| `GET /api/admin/users` | Khong | Khong | Co | - |
| `DELETE /api/board/posts/:id` (bat ky) | Khong | Khong | Co | - |

---

## 8. Dich vu Email (SMTP / AWS SES)

### 8.1 Tu dong phat hien nha cung cap

`MailService` tu dong chon nha cung cap email dua tren bien moi truong:

```
                    ┌─────────────────────┐
                    │  Bien moi truong     │
                    │  MAIL_PROVIDER       │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Gia tri ro rang?    │
                    │  "ses" hoac "smtp"   │
                    └──────────┬──────────┘
                          Khong│   Co → su dung gia tri do
                               │
                    ┌──────────▼──────────┐
                    │ AWS_SES_SMTP_USER   │
                    │    da duoc dat?     │
                    └──────────┬──────────┘
                     Co        │        Khong
                      │        │         │
                ┌─────▼─────┐  │  ┌──────▼──────┐
                │  AWS SES   │  │  │    SMTP     │
                │  SMTP      │  │  │  (Gmail,    │
                │            │  │  │  Mailtrap)  │
                └────────────┘  │  └─────────────┘
```

**Ma: `server/src/mail/mail.service.ts`**
```typescript
private resolveProvider(): MailProvider {
  const explicit = this.configService.get<string>('MAIL_PROVIDER');
  if (explicit === 'ses' || explicit === 'smtp') return explicit;

  // Tu dong phat hien: neu thong tin xac thuc AWS SES SMTP duoc dat, su dung SES
  if (this.configService.get<string>('AWS_SES_SMTP_USER')) return 'ses';
  return 'smtp';
}
```

### 8.2 Tuy chon A: Google App Password (SMTP)

```
┌─────────────┐     SMTP (cong 587)      ┌────────────────┐
│  NestJS      │────────────────────────>│  Google SMTP   │
│  MailService │     TLS + Xac thuc      │  smtp.gmail.com│
└─────────────┘                          └────────────────┘
```

**Cau hinh (.env):**
```bash
MAIL_PROVIDER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=abcd efgh ijkl mnop    # Google App Password (16 ky tu)
MAIL_FROM="Vibe <your-email@gmail.com>"
```

**Cai dat Google App Password:**
1. Tai khoan Google → Bao mat → Xac minh 2 buoc → **Kich hoat**
2. Tai khoan Google → Bao mat → Mat khau ung dung
3. Chon ung dung: "Mail", Thiet bi: "Khac (NestJS)"
4. Sao chep mat khau ung dung 16 ky tu

### 8.3 Tuy chon B: AWS SES (Sandbox — Mien phi, Khong can Ten mien)

```
┌─────────────┐     SMTP (cong 587)      ┌──────────────────────────┐
│  NestJS      │────────────────────────>│  AWS SES SMTP Endpoint   │
│  MailService │     TLS + SMTP Auth     │  email-smtp.ap-northeast │
└─────────────┘                          │  -2.amazonaws.com        │
                                         └──────────────────────────┘
```

#### Huong dan Cai dat AWS SES Sandbox tung buoc

**Buoc 1: Tao Tai khoan AWS**
- Truy cap https://aws.amazon.com → Tao tai khoan (mien phi)
- SES mien phi: 62.000 email/thang (neu gui tu EC2), hoac 200/ngay trong sandbox

**Buoc 2: Mo SES Console**
- Truy cap https://console.aws.amazon.com/ses/
- Chon khu vuc: **Chau A Thai Binh Duong (Seoul) — ap-northeast-2**

**Buoc 3: Xac minh Email Nguoi gui (Che do Sandbox)**
```
SES Console → Verified identities → Create identity
  → Identity type: Email address
  → Email address: your-email@gmail.com
  → Nhan "Create identity"
  → Kiem tra hop thu → Nhan lien ket xac minh
```
> Trong **che do Sandbox**, ban cung phai xac minh moi dia chi email **nguoi nhan**.
> Day la du cho muc dich phat trien/kiem thu.

**Buoc 4: Xac minh Email Nguoi nhan (Sandbox)**
```
SES Console → Verified identities → Create identity
  → Email address: test-recipient@yopmail.com
  → Xac minh qua lien ket email
```

**Buoc 5: Tao Thong tin Xac thuc SMTP**
```
SES Console → SMTP settings → Create SMTP credentials
  → IAM User Name: ses-smtp-user-vibe
  → Nhan "Create user"
  → Tai xuong thong tin xac thuc (SMTP username + password)
```

> **QUAN TRONG:** Thong tin xac thuc SMTP khac voi thong tin xac thuc IAM!
> - SMTP username co dang: `AKIAIOSFODNN7EXAMPLE`
> - SMTP password co dang: `BM+H0bG2Kfiug5F1...` (duoc tao tu IAM secret)
> - Ban chi co the thay mat khau MOT LAN tai thoi diem tao

**Buoc 6: Cau hinh .env**
```bash
MAIL_PROVIDER=ses
AWS_SES_REGION=ap-northeast-2
AWS_SES_SMTP_USER=AKIAIOSFODNN7EXAMPLE
AWS_SES_SMTP_PASSWORD=BM+H0bG2Kfiug5F1kVcXYZABCDEF...
MAIL_FROM="Vibe <your-verified-email@gmail.com>"
```

**Buoc 7: Kiem thu**
```bash
# Khoi dong lai backend → kiem tra nhat ky:
# [MailService] Mail provider: AWS SES SMTP (ap-northeast-2)

# Kiem thu qua luong dang ky hoac curl
curl -X POST http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer {token}"
# → Se kich hoat email chao mung qua SES
```

#### SES Sandbox vs Production (San xuat)

| Tinh nang | Sandbox (Mien phi) | Production (San xuat) |
|-----------|-------------------|----------------------|
| Nguoi gui | Phai la email da xac minh | Ten mien da xac minh |
| Nguoi nhan | Phai la email da xac minh | Bat ky ai |
| Gioi han hang ngay | 200 email/ngay | Co the thuong luong (50K+) |
| Gioi han tan suat | 1 email/giay | Co the thuong luong (14+/giay) |
| Chi phi | Mien phi | $0,10 cho moi 1.000 email |
| Can ten mien | Khong | Co |
| Thoi gian cai dat | 5 phut | 1-3 ngay (duyet) |

#### Chuyen sang Production (Khi ban co ten mien)

**Buoc 1: Mua ten mien gia re**
- Namecheap: `.xyz` khoang ~$1/nam
- Dung Cloudflare de quan ly DNS (mien phi)

**Buoc 2: Xac minh Ten mien trong SES**
```
SES Console → Verified identities → Create identity
  → Identity type: Domain
  → Domain: yourdomain.xyz
```

**Buoc 3: Them ban ghi DNS (Cloudflare)**

| Loai | Ten | Gia tri | Muc dich |
|------|-----|---------|----------|
| CNAME | `abc._domainkey` | `abc.dkim.amazonses.com` | Chu ky DKIM (1/3) |
| CNAME | `def._domainkey` | `def.dkim.amazonses.com` | Chu ky DKIM (2/3) |
| CNAME | `ghi._domainkey` | `ghi.dkim.amazonses.com` | Chu ky DKIM (3/3) |
| TXT | `@` | `v=spf1 include:amazonses.com ~all` | SPF — uy quyen SES gui email |
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.xyz` | Chinh sach DMARC |
| MX | `@` | `10 inbound-smtp.ap-northeast-2.amazonaws.com` | Nhan email tra lai |

**Buoc 4: Yeu cau Quyen truy cap Production**
```
SES Console → Account dashboard → Request production access
  → Mail type: Transactional
  → Website URL: URL ung dung cua ban
  → Use case: Mo ta cach su dung email
  → Doi 1-3 ngay lam viec de duoc phe duyet
```

**Buoc 5: Cap nhat .env**
```bash
MAIL_FROM="Vibe <noreply@yourdomain.xyz>"
# Thong tin xac thuc SMTP van giu nguyen
```

### 8.4 Ten mien, DNS & Cloudflare — Khai niem

#### Ten mien la gi?

Ten mien la mot **dia chi co the doc duoc** cho mot may chu tren internet.

```
Dia chi IP:  52.78.123.45      ← May hieu
Ten mien:    vibe-shop.com     ← Nguoi hieu

Nguoi go "vibe-shop.com" → DNS tra cuu → tra ve 52.78.123.45 → Trinh duyet ket noi
```

#### DNS la gi?

**DNS (Domain Name System — He thong Ten mien)** la "danh ba dien thoai cua internet" — dich ten mien thanh dia chi IP.

```
Trinh duyet                 May chu DNS                  May chu cua ban
  │                            │                            │
  │  "vibe-shop.com o dau?"    │                            │
  │───────────────────────────>│                            │
  │                            │  Tra cuu ban ghi DNS       │
  │  "IP la 52.78.123.45"     │                            │
  │<───────────────────────────│                            │
  │                            │                            │
  │  Ket noi toi 52.78.123.45 │                            │
  │────────────────────────────────────────────────────────>│
  │                            │                            │
  │  Phan hoi (HTML/JSON)      │                            │
  │<────────────────────────────────────────────────────────│
```

#### Cac loai ban ghi DNS

| Loai | Ten day du | Chuc nang | Vi du |
|------|-----------|-----------|-------|
| **A** | Address Record (Ban ghi Dia chi) | Ten mien → dia chi IPv4 | `vibe-shop.com` → `52.78.123.45` |
| **AAAA** | IPv6 Address (Dia chi IPv6) | Ten mien → dia chi IPv6 | `vibe-shop.com` → `2001:db8::1` |
| **CNAME** | Canonical Name (Ten chuan) | Ten mien → ten mien khac (bi danh) | `www.vibe-shop.com` → `vibe-shop.com` |
| **MX** | Mail Exchange (Trao doi Thu) | Ten mien nhan email o dau | `vibe-shop.com` → `mail.google.com` (uu tien 10) |
| **TXT** | Text Record (Ban ghi Van ban) | Luu van ban tuy y (xac minh, SPF, DKIM) | `v=spf1 include:amazonses.com ~all` |
| **NS** | Name Server (May chu Ten) | Ai quan ly DNS cho ten mien nay | `vibe-shop.com` → `ns1.cloudflare.com` |

#### Vi du Thuc te

```
Ban ghi DNS cua vibe-shop.com:

Loai   Ten               Gia tri                                  Muc dich
─────  ────────────────  ───────────────────────────────────────  ──────────────────
A      vibe-shop.com     52.78.123.45                             May chu website
CNAME  www               vibe-shop.com                            www → ten mien goc
CNAME  api               api-server.vercel.app                    Ten mien phu API
MX     vibe-shop.com     10 inbound-smtp.amazonaws.com            Nhan email
TXT    vibe-shop.com     v=spf1 include:amazonses.com ~all        SPF (xac thuc email)
TXT    _dmarc            v=DMARC1; p=quarantine                   Chinh sach DMARC
CNAME  abc._domainkey    abc.dkim.amazonses.com                   DKIM (ky email)
```

#### Cloudflare la gi?

**Cloudflare** la dich vu quan ly DNS mien phi + CDN (Mang phan phoi noi dung) + lop bao mat.

```
Khong co Cloudflare:
  Nguoi dung → DNS (nha dang ky) → May chu cua ban

Co Cloudflare:
  Nguoi dung → Cloudflare DNS → Cloudflare CDN/WAF → May chu cua ban
                │
                ├── Quan ly DNS mien phi (giao dien de dung)
                ├── CDN mien phi (cache tep tinh toan cau)
                ├── Chung chi SSL mien phi (HTTPS)
                ├── Bao ve chong DDoS
                └── Phan tich
```

**Quy trinh cai dat:**
```
1. Mua ten mien bat ky dau (Namecheap, GoDaddy, AWS Route 53)
2. Tao tai khoan Cloudflare (mien phi)
3. Them ten mien vao Cloudflare
4. Cloudflare cung cap 2 may chu ten:
     ns1.cloudflare.com
     ns2.cloudflare.com
5. Vao nha dang ky ten mien → doi may chu ten sang cua Cloudflare
6. Bay gio quan ly TAT CA ban ghi DNS trong bang dieu khien Cloudflare
```

#### Xac thuc SES + Ten mien (Production)

Khi chuyen tu SES Sandbox sang Production, ban can **xac minh ten mien** va them ban ghi DNS:

```
┌────────────────┐         ┌──────────────────┐         ┌───────────────┐
│  AWS SES       │         │  Cloudflare DNS  │         │  Nguoi nhan   │
│                │         │                  │         │  Email        │
│ "Toi se gui    │         │  Ban ghi DNS     │         │               │
│  email tu      │────────>│  chung minh SES  │────────>│ "Toi tin tuong│
│  vibe-shop.com"│  DKIM   │  duoc uy quyen"  │  xac minh│  email nay la│
│                │  SPF    │                  │         │  hop phap"    │
└────────────────┘  DMARC  └──────────────────┘         └───────────────┘
```

**DKIM (DomainKeys Identified Mail — Thu duoc ky bang Khoa Ten mien):**
- SES ky moi email bang khoa rieng
- DNS co khoa cong khai (ban ghi CNAME)
- May chu thu cua nguoi nhan xac minh chu ky
- Chung minh: "Email nay thuc su duoc gui boi chu so huu ten mien"

```
SES Console → Verified identities → Create identity → Domain
  → vibe-shop.com
  → SES tao 3 ban ghi CNAME:

  CNAME  abc._domainkey.vibe-shop.com  →  abc.dkim.amazonses.com
  CNAME  def._domainkey.vibe-shop.com  →  def.dkim.amazonses.com
  CNAME  ghi._domainkey.vibe-shop.com  →  ghi.dkim.amazonses.com

  → Them 3 CNAME nay trong Cloudflare → Doi 5-10 phut → Trang thai: Da xac minh
```

**SPF (Sender Policy Framework — Khung Chinh sach Nguoi gui):**
- Thong bao cho the gioi: "Chi nhung may chu nay duoc phep gui email cho ten mien cua toi"
- Mot ban ghi TXT trong DNS

```
TXT  vibe-shop.com  "v=spf1 include:amazonses.com ~all"

Y nghia:
  v=spf1                       → SPF phien ban 1
  include:amazonses.com        → Cho phep AWS SES gui
  ~all                         → Tu choi mem cac nguon khac (danh dau la dang nghi)
```

**DMARC (Domain-based Message Authentication — Xac thuc Thu dua tren Ten mien):**
- Chinh sach cho nguoi nhan biet phai lam gi khi DKIM/SPF that bai
- Cung gui bao cao ve viec lam dung email

```
TXT  _dmarc.vibe-shop.com  "v=DMARC1; p=quarantine; rua=mailto:dmarc@vibe-shop.com"

Y nghia:
  v=DMARC1                     → DMARC phien ban 1
  p=quarantine                 → Neu xac thuc that bai, cho vao spam (khong tu choi)
  rua=mailto:...               → Gui bao cao lam dung den email nay
```

**MX (Mail Exchange — Trao doi Thu):**
- Noi nhan email gui DEN ten mien cua ban
- Chi can thiet neu ban muon NHAN email tai ten mien cua ban

```
MX  vibe-shop.com  10 inbound-smtp.ap-southeast-1.amazonaws.com

Y nghia:
  10                           → Do uu tien (thap hon = uu tien cao hon)
  inbound-smtp...              → SES se nhan email tra lai
```

#### Cai dat DNS Day du cho SES Production

| # | Loai | Ten | Gia tri | Muc dich |
|---|------|-----|---------|----------|
| 1 | CNAME | `abc._domainkey` | `abc.dkim.amazonses.com` | Chu ky DKIM 1/3 |
| 2 | CNAME | `def._domainkey` | `def.dkim.amazonses.com` | Chu ky DKIM 2/3 |
| 3 | CNAME | `ghi._domainkey` | `ghi.dkim.amazonses.com` | Chu ky DKIM 3/3 |
| 4 | TXT | `@` | `v=spf1 include:amazonses.com ~all` | SPF — uy quyen SES |
| 5 | TXT | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:...` | Chinh sach DMARC |
| 6 | MX | `@` | `10 inbound-smtp.ap-southeast-1.amazonaws.com` | Xu ly email tra lai |

> Trong Cloudflare, `@` co nghia la ten mien goc (vi du: `vibe-shop.com`).

#### Trang thai Hien tai cua Du an

| Hang muc | Trang thai | Ghi chu |
|----------|-----------|---------|
| SES Sandbox | Dang hoat dong | Nguoi gui: `tranvu221097@gmail.com` da xac minh |
| Thong tin xac thuc SMTP | Da tao | Khu vuc: ap-southeast-1 (Singapore) |
| Ten mien | Chua co | Can mua cho production |
| DKIM/SPF/DMARC | Chua co | Can ten mien truoc |
| Quyen truy cap production | Chua co | Can ten mien + yeu cau phe duyet |

### 8.5 Mau Email

| Mau | Dieu kien kich hoat | Noi dung |
|-----|---------------------|---------|
| Chao mung | Nguoi dung dang ky (tu dong tao trong guard) | Thong diep chao mung + huong dan bat dau |
| Xac nhan Don hang | Hoan tat thanh toan | Ma don hang, san pham, tong tien |

### 8.6 Ghi nhat ky Email

Moi email (thanh cong hoac that bai) deu duoc ghi vao `TL_COMM_EML_LOG`:

```sql
SELECT "RCPNT_EML", "SBJ", "TMPLT_NM", "SND_STTS_CD", "ERR_MSG", "SND_DT"
FROM "TL_COMM_EML_LOG"
ORDER BY "SND_DT" DESC
LIMIT 10;
```

| Cot | Mo ta |
|-----|-------|
| `SND_STTS_CD` | `SUCC` = da gui, `FAIL` = loi |
| `ERR_MSG` | Chi tiet loi neu that bai |
| `TMPLT_NM` | `welcome`, `order-confirm` |

---

## 9. CORS & Proxy

### 9.1 CORS la gi?

**CORS (Cross-Origin Resource Sharing — Chia se tai nguyen giua cac nguon goc khac nhau)** la co che bao mat ngan chan mot trang web gui yeu cau den ten mien khac voi ten mien dang phuc vu trang do.

```
Van de: Frontend (localhost:3000) → Backend (localhost:4000)
        Cong khac nhau = nguon goc khac nhau = BI CHAN boi trinh duyet

Giai phap: Backend cho phep ro rang nguon goc frontend
```

### 9.2 Cau hinh CORS trong NestJS

**Tep: `server/src/main.ts`**

```typescript
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((u) => u.trim());

app.enableCors({
  origin: (origin, callback) => {
    // Cho phep yeu cau khong co origin (server-to-server, Postman, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, origin);
    } else {
      callback(null, false);  // Tu choi nguon goc khong biet
    }
  },
  credentials: true,  // Cho phep cookie va header Authorization
});
```

### 9.3 CORS hoat dong nhu the nao (Preflight)

```
Trinh duyet                                      May chu (NestJS)
  │                                                  │
  │  OPTIONS /api/auth/me                            │  ← Yeu cau preflight
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
  │  GET /api/auth/me                                │  ← Yeu cau thuc te
  │  Origin: http://localhost:3000                   │
  │  Authorization: Bearer {token}                   │
  │─────────────────────────────────────────────────>│
  │                                                  │
  │  200 OK + Noi dung phan hoi                      │
  │<─────────────────────────────────────────────────│
```

### 9.4 Next.js Proxy (Phuong phap thay the cho CORS)

Cho moi truong production, ban co the su dung `rewrites` cua Next.js de proxy cac loi goi API qua cung nguon goc:

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
Truoc (can CORS):
  Trinh duyet → http://localhost:3000 (trang)
  Trinh duyet → http://localhost:4000/api/auth/me (API) ← nguon goc khac!

Sau (Proxy, khong can CORS):
  Trinh duyet → http://localhost:3000 (trang)
  Trinh duyet → http://localhost:3000/api/auth/me (cung nguon goc!)
         → May chu Next.js proxy den http://localhost:4000/api/auth/me
```

| Cach tiep can | Phat trien | Production | Uu diem | Nhuoc diem |
|---------------|-----------|------------|---------|------------|
| CORS | Cai dat de dang | Can cau hinh | Chuan, don gian | Chi phi preflight |
| Proxy | Hoat dong ngay | Khuyen dung | Khong van de CORS, mot ten mien | Them mot buoc trung gian |

---

## 10. Thiet ke Co so du lieu & Cac moi quan he

### 10.1 Bang Nguoi dung (TB_COMM_USER)

```sql
CREATE TABLE "TB_COMM_USER" (
  "id"           SERIAL       PRIMARY KEY,          -- PK (Tu dong tang)
  "FIREBASE_UID" VARCHAR(128) NOT NULL UNIQUE,       -- FK toi Firebase Auth
  "USE_EML"      VARCHAR(255) NOT NULL UNIQUE,       -- Email (duy nhat)
  "USE_NM"       VARCHAR(100) NOT NULL,              -- Ho ten
  "USE_NCNM"     VARCHAR(50)  UNIQUE,                -- Biet danh (duy nhat, co the null)
  "PRFL_IMG_URL" TEXT,                               -- URL anh dai dien
  "USE_ROLE_CD"  VARCHAR(20)  NOT NULL DEFAULT 'BUYER', -- BUYER | SELLER | SUPER_ADMIN
  "USE_STTS_CD"  VARCHAR(20)  NOT NULL DEFAULT 'ACTV',  -- ACTV | INAC | SUSP
  "LST_LGN_DT"  TIMESTAMP,                          -- Thoi diem dang nhap cuoi
  "RGST_DT"      TIMESTAMP    NOT NULL DEFAULT NOW(), -- Thoi diem tao
  "RGTR_ID"      VARCHAR(50),                        -- Nguoi tao
  "MDFCN_DT"     TIMESTAMP    NOT NULL DEFAULT NOW(), -- Thoi diem cap nhat
  "MDFR_ID"      VARCHAR(50),                        -- Nguoi cap nhat
  "DEL_YN"       CHAR(1)      NOT NULL DEFAULT 'N'   -- Co xoa mem
);

-- Chi muc
CREATE UNIQUE INDEX "idx_user_firebase_uid" ON "TB_COMM_USER"("FIREBASE_UID");
CREATE UNIQUE INDEX "idx_user_email" ON "TB_COMM_USER"("USE_EML");
CREATE UNIQUE INDEX "idx_user_nickname" ON "TB_COMM_USER"("USE_NCNM");
```

### 10.2 Cac moi quan he (1:1, 1:N, N:1)

```
TB_COMM_USER (1) ──────< (N) TB_PROD_PRD          -- 1 Nguoi ban co N San pham
TB_COMM_USER (1) ──────< (N) TB_COMM_ORDR          -- 1 Nguoi mua co N Don hang
TB_COMM_USER (1) ──────< (N) TB_COMM_BOARD_POST    -- 1 Nguoi dung co N Bai viet
TB_COMM_USER (1) ──────< (N) TL_COMM_LGN_LOG       -- 1 Nguoi dung co N Nhat ky Dang nhap
TB_COMM_USER (1) ──────< (N) TL_COMM_EML_LOG       -- 1 Nguoi dung co N Nhat ky Email (qua email)

TB_COMM_ORDR (1) ──────< (N) TB_COMM_ORDR_ITEM     -- 1 Don hang co N Muc hang
TB_PROD_PRD  (1) ──────< (N) TB_COMM_ORDR_ITEM     -- 1 San pham trong N Muc don hang

TB_COMM_BOARD_POST (1) ──< (N) TB_COMM_BOARD_CMNT  -- 1 Bai viet co N Binh luan
TB_COMM_BOARD_POST (1) ──< (N) TR_COMM_BOARD_LIKE  -- 1 Bai viet co N Luot thich
TB_COMM_BOARD_POST (1) ──< (N) TB_COMM_BOARD_ATCH  -- 1 Bai viet co N Tep dinh kem

TR_COMM_BOARD_LIKE: TB_COMM_USER (N) ──── (N) TB_COMM_BOARD_POST  -- Nhieu-Nhieu qua bang trung gian
```

### 10.3 Vi du Join (SQL)

**1:1 — Nguoi dung ↔ Firebase (khai niem, cung bang)**
```sql
-- Nguoi dung voi Firebase UID cua ho
SELECT id, "USE_EML", "FIREBASE_UID", "USE_ROLE_CD"
FROM "TB_COMM_USER"
WHERE "FIREBASE_UID" = 'NQ913ow61XSJ...';
```

**1:N — Nguoi ban → San pham**
```sql
-- Tat ca san pham cua mot nguoi ban cu the
SELECT u."USE_NM" AS ten_nguoi_ban, p."PRD_NM", p."PRD_PRC", p."STCK_QTY"
FROM "TB_COMM_USER" u
JOIN "TB_PROD_PRD" p ON u.id = p."SLLR_ID"
WHERE u."USE_ROLE_CD" = 'SELLER'
  AND u.id = 22
  AND p."DEL_YN" = 'N'
ORDER BY p."RGST_DT" DESC
LIMIT 20;
```

**N:1 — Muc don hang → San pham + Nguoi ban**
```sql
-- Chi tiet don hang voi thong tin san pham va nguoi ban
SELECT
  o."ORDR_NO",
  oi."PRD_NM",
  oi."UNIT_PRC",
  oi."ORDR_QTY",
  oi."SUBTOT_AMT",
  seller."USE_NM" AS ten_nguoi_ban,
  buyer."USE_NM" AS ten_nguoi_mua
FROM "TB_COMM_ORDR" o
JOIN "TB_COMM_ORDR_ITEM" oi ON o.id = oi."ORDR_ID"
JOIN "TB_COMM_USER" seller ON oi."SLLR_ID" = seller.id
JOIN "TB_COMM_USER" buyer ON o."BYR_ID" = buyer.id
WHERE o."ORDR_NO" = 'ORD-20260324-001';
```

**N:N — Nguoi dung ↔ Bai viet (qua bang Luot thich trung gian)**
```sql
-- Cac bai viet duoc thich boi mot nguoi dung cu the
SELECT p."POST_TTL", p."LIKE_CNT", l."RGST_DT" AS thoi_diem_thich
FROM "TR_COMM_BOARD_LIKE" l
JOIN "TB_COMM_BOARD_POST" p ON l."POST_ID" = p.id
WHERE l."USE_ID" = 43  -- buyer1
  AND p."DEL_YN" = 'N'
ORDER BY l."RGST_DT" DESC;
```

### 10.4 Chien luoc Index de toi uu hieu suat

```sql
-- Chi muc PK (tu dong tao)
-- Da co san: id (PK), FIREBASE_UID (UNIQUE), USE_EML (UNIQUE)

-- Hieu suat tim kiem san pham
CREATE INDEX "idx_product_seller" ON "TB_PROD_PRD"("SLLR_ID");
CREATE INDEX "idx_product_category" ON "TB_PROD_PRD"("PRD_CTGR_CD");
CREATE INDEX "idx_product_status" ON "TB_PROD_PRD"("PRD_STTS_CD");
CREATE INDEX "idx_product_name_search" ON "TB_PROD_PRD"("PRD_NM" varchar_pattern_ops);

-- Hieu suat tim kiem don hang
CREATE INDEX "idx_order_buyer" ON "TB_COMM_ORDR"("BYR_ID");
CREATE INDEX "idx_order_status" ON "TB_COMM_ORDR"("ORDR_STTS_CD");
CREATE INDEX "idx_orderitem_order" ON "TB_COMM_ORDR_ITEM"("ORDR_ID");
CREATE INDEX "idx_orderitem_seller" ON "TB_COMM_ORDR_ITEM"("SLLR_ID");

-- Hieu suat bang tin
CREATE INDEX "idx_post_user" ON "TB_COMM_BOARD_POST"("USE_ID");
CREATE INDEX "idx_post_category" ON "TB_COMM_BOARD_POST"("POST_CTGR_CD");
CREATE INDEX "idx_comment_post" ON "TB_COMM_BOARD_CMNT"("POST_ID");
```

### 10.5 Tom tat PK va FK

| Bang | PK | Tham chieu FK |
|------|----|----|
| TB_COMM_USER | `id` (SERIAL) | — |
| TB_PROD_PRD | `id` (SERIAL) | `SLLR_ID` → TB_COMM_USER.id |
| TB_COMM_ORDR | `id` (SERIAL) | `BYR_ID` → TB_COMM_USER.id |
| TB_COMM_ORDR_ITEM | `id` (SERIAL) | `ORDR_ID` → TB_COMM_ORDR.id, `PRD_ID` → TB_PROD_PRD.id, `SLLR_ID` → TB_COMM_USER.id |
| TB_COMM_BOARD_POST | `id` (SERIAL) | `USE_ID` → TB_COMM_USER.id |
| TB_COMM_BOARD_CMNT | `id` (SERIAL) | `POST_ID` → TB_COMM_BOARD_POST.id, `USE_ID` → TB_COMM_USER.id |
| TR_COMM_BOARD_LIKE | `id` (SERIAL) | `POST_ID` → TB_COMM_BOARD_POST.id, `USE_ID` → TB_COMM_USER.id |
| TL_COMM_LGN_LOG | `id` (SERIAL) | `USE_ID` → TB_COMM_USER.id |

---

## 11. Tham chieu API

### Cac Endpoint Xac thuc

| Phuong thuc | Endpoint | Xac thuc | Vai tro | Mo ta |
|-------------|----------|----------|---------|-------|
| `GET` | `/api/auth/me` | Bat buoc | Bat ky | Lay thong tin ca nhan nguoi dung hien tai |
| `PATCH` | `/api/auth/profile` | Bat buoc | Bat ky | Cap nhat ten, biet danh, anh dai dien |
| `PATCH` | `/api/auth/role` | Bat buoc | Bat ky | Dat vai tro (BUYER/SELLER) |
| `DELETE` | `/api/auth/account` | Bat buoc | Bat ky | Xoa mem tai khoan |

### Dinh dang Yeu cau/Phan hoi

**Tat ca phan hoi tuan theo:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Phan hoi loi:**
```json
{
  "success": false,
  "data": null,
  "error": "ERROR_CODE",
  "message": "Thong bao co the doc duoc"
}
```

### Vi du: GET /api/auth/me

**Yeu cau:**
```http
GET /api/auth/me HTTP/1.1
Host: localhost:4000
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```

**Phan hoi (200):**
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

**Phan hoi (401):**
```json
{
  "success": false,
  "data": null,
  "error": "UNAUTHORIZED",
  "message": "Missing authentication token"
}
```

---

## 12. Cau truc thu muc

```
src/
├── lib/
│   ├── firebase.ts              # Khoi tao Firebase Web SDK
│   └── auth.ts                  # Cac ham xac thuc (dang ky, dang nhap, dang xuat, v.v.)
├── hooks/
│   └── use-auth.ts              # React hook useAuth() (quan ly trang thai xac thuc)
├── app/auth/
│   ├── login/page.tsx           # Trang dang nhap (email/mat khau)
│   ├── signup/page.tsx          # Trang dang ky (ten, email, mat khau, vai tro)
│   └── reset-password/page.tsx  # Trang dat lai mat khau

server/src/
├── firebase/
│   ├── firebase.module.ts       # Module toan cuc
│   ├── firebase.service.ts      # Xac minh token (chung chi cong khai Google)
│   └── firebase-auth.guard.ts   # Guard xac thuc toan cuc (xac minh + tu dong tao nguoi dung)
├── auth/
│   ├── auth.module.ts           # Module xac thuc
│   ├── auth.controller.ts       # Cac endpoint /api/auth/*
│   ├── auth.service.ts          # Logic CRUD nguoi dung
│   ├── auth.guard.ts            # Tai xuat FirebaseAuthGuard
│   ├── guards/
│   │   └── roles.guard.ts       # Kiem soat truy cap dua tren vai tro
│   ├── decorators/
│   │   ├── current-user.decorator.ts  # @CurrentUser()
│   │   ├── public.decorator.ts        # @Public()
│   │   └── roles.decorator.ts         # @Roles()
│   └── dto/
│       ├── update-profile.dto.ts      # { name?, nickname?, profileImageUrl? }
│       └── set-role.dto.ts            # { role: 'BUYER' | 'SELLER' }
├── mail/
│   ├── mail.module.ts           # Module email
│   ├── mail.service.ts          # Nodemailer transporter + ghi nhat ky
│   ├── mail.constants.ts        # Ten mau va tieu de
│   └── templates/
│       ├── welcome.ts           # HTML email chao mung
│       └── order-confirm.ts     # HTML xac nhan don hang
└── app.module.ts                # Dang ky guard toan cuc
```

---

## 13. Ket qua Kiem thu

### Thuc thi Kiem thu (2026-03-24)

| TC | Truong hop Kiem thu | Ket qua | Chi tiet |
|----|---------------------|---------|----------|
| TC-001 | Dang ky vai tro BUYER | **DAT** | Dang ky Firebase + tu dong tao nguoi dung DB + thong tin ca nhan + vai tro |
| TC-002 | Dang nhap vai tro BUYER | **DAT** | Dang nhap Firebase + duy tri thong tin ca nhan |
| TC-003 | Dang ky vai tro SELLER | **DAT** | Dang ky Firebase + doi vai tro thanh SELLER |
| TC-004a | BUYER → endpoint cua SELLER | **DAT** | 403 Forbidden (Tu choi) |
| TC-004b | SELLER → tao san pham | **DAT** | Duoc uy quyen dung |
| TC-004c | BUYER → endpoint quan tri | **DAT** | 403 Forbidden (Tu choi) |
| TC-004d | SELLER → endpoint quan tri | **DAT** | 403 Forbidden (Tu choi) |
| TC-005a | Sai mat khau | **DAT** | INVALID_LOGIN_CREDENTIALS |
| TC-005b | Email khong ton tai | **DAT** | INVALID_LOGIN_CREDENTIALS |
| TC-005c | Khong co token | **DAT** | 401 Missing authentication token |
| TC-005d | Token khong hop le | **DAT** | 401 Invalid or expired token |
| TC-006 | Xoa mem + dang nhap lai | **DAT** | Tai khoan bi chan sau khi xoa |

**Ket qua: 12/12 DAT**

### Du lieu Seed (Du lieu mau)

| Du lieu | So luong | Chi tiet |
|---------|---------|----------|
| Tai khoan Nguoi ban | 25 | seller1@yopmail.com → seller25@yopmail.com |
| Tai khoan Nguoi mua | 25 | buyer1@yopmail.com → buyer25@yopmail.com |
| San pham | 50.000 | ~1.923 san pham moi nguoi ban, 6 danh muc |

### Loi Phat hien & Da sua

**Van de:** Khi mot nguoi dung Firebase bi xoa va duoc tao lai (UID khac, cung email), guard bi loi voi `Unique constraint failed on USE_EML` vi no co gang tao ban ghi DB moi trong khi ban ghi cu van ton tai.

**Cach sua:** Them tim kiem du phong theo email trong `firebase-auth.guard.ts`:
```typescript
if (!user) {
  // Du phong: tim theo email va lien ket lai Firebase UID
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
