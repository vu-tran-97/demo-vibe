# 012-Role-Signup: Role-Based Signup (Buyer/Seller) Blueprint

> Allow users to choose between Buyer and Seller roles during signup, enabling role-differentiated experiences across the platform.

## 1. Overview

### 1.1 Purpose

Currently, all users are hardcoded as `BUYER` on signup (`auth.service.ts` line 56: `useRoleCd: 'BUYER'`). This feature adds a role selection step so users can register as either a Buyer or Seller, unlocking the existing seller features (product listing, sales dashboard) from the moment of account creation.

### 1.2 Scope

- Role selection UI on signup (Buyer / Seller cards)
- Update signup DTO to accept optional `role` field
- Update AuthService to set role on user creation
- Role-appropriate welcome email (different content for Buyer vs Seller)
- Seller onboarding redirect (to product creation page after signup)
- Role badge display in UserMenu and settings page
- Update both AuthModal signup form and standalone signup page
- Backward compatible -- existing users remain BUYER

### 1.3 Out of Scope

- Role change after signup (admin-only operation, already exists)
- Seller verification / approval workflow
- Seller-specific profile fields (business name, tax ID)
- Role-based pricing or commission settings

### 1.4 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS, Prisma |
| Frontend | Next.js 15, React |
| Validation | class-validator |

## 2. Architecture

### 2.1 Changes Overview

```
Backend:
  server/src/auth/dto/signup.dto.ts    -- add role field
  server/src/auth/auth.service.ts      -- use role from DTO
  server/src/auth/auth.controller.ts   -- no changes needed

Frontend:
  src/components/auth-modal/AuthModal.tsx -- add role selector
  src/app/auth/signup/page.tsx           -- add role selector
  src/components/user-menu/UserMenu.tsx  -- show role badge
  src/app/settings/page.tsx              -- show role badge
  src/lib/auth.ts                        -- update UserInfo type
```

### 2.2 Flow Diagram

```
[Signup Form]
     |
[Step 1: Role Selection]  -->  Buyer (default) / Seller
     |
[Step 2: Account Details]  -->  Name, Email, Password, Nickname
     |
[Submit] --> POST /api/auth/signup { ...fields, role: 'BUYER'|'SELLER' }
     |
[Backend] --> Create user with useRoleCd --> Send welcome email
     |
[Redirect] --> Buyer: / (homepage)
            --> Seller: /dashboard/products/create (start selling)
```

## 3. Database Design

### 3.1 No Schema Changes Required

The `TB_COMM_USER` model already has:

```prisma
useRoleCd  String @default("BUYER") @map("USE_ROLE_CD")
```

Supported values: `'BUYER'` | `'SELLER'` | `'ADMIN'`

No migration needed -- only the signup logic needs to pass the role value instead of hardcoding `'BUYER'`.

## 4. API Changes

### 4.1 POST /api/auth/signup (Updated)

**Current Request Body**:
```json
{
  "email": "user@example.com",
  "password": "Password1!",
  "name": "John Doe",
  "nickname": "john_doe"
}
```

**Updated Request Body**:
```json
{
  "email": "user@example.com",
  "password": "Password1!",
  "name": "John Doe",
  "nickname": "john_doe",
  "role": "SELLER"
}
```

- `role` is **optional**, defaults to `'BUYER'` if omitted
- Accepted values: `'BUYER'` | `'SELLER'`
- `'ADMIN'` role cannot be set via signup (admin-only assignment)

**Response** (unchanged structure, role already included):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "user@example.com",
      "name": "John Doe",
      "nickname": "john_doe",
      "role": "SELLER",
      "emailVerified": false
    },
    "accessToken": "...",
    "refreshToken": "...",
    "expiresIn": 2592000
  }
}
```

## 5. Frontend Design

### 5.1 Role Selection UI

Display as two selectable cards before the account details form:

```
┌─────────────────────┐  ┌─────────────────────┐
│   🛒  Buyer         │  │   🏪  Seller        │
│                     │  │                     │
│   Browse & purchase │  │   List products &   │
│   handcrafted goods │  │   manage your shop  │
│                     │  │                     │
│   [  Selected  ✓ ]  │  │   [   Select    ]   │
└─────────────────────┘  └─────────────────────┘
```

- Buyer is selected by default
- Cards use existing design tokens (--charcoal, --ivory, --border-light)
- Selected card has solid border + checkmark
- Compact version for AuthModal (smaller cards, side by side)

### 5.2 Role Badge

Display in UserMenu dropdown and settings page:

- Buyer: gray badge "Buyer"
- Seller: accent badge "Seller"
- Admin: red badge "Admin" (existing)

### 5.3 Post-Signup Redirect

| Role | Redirect | Welcome Message |
|------|----------|-----------------|
| Buyer | `/` (homepage) | "Welcome! Start exploring handcrafted goods." |
| Seller | `/dashboard/products/create` | "Welcome! Let's list your first product." |

### 5.4 AuthModal Changes

The signup tab in AuthModal needs:
1. Role selector cards at the top (before name field)
2. State: `signupRole` defaulting to `'BUYER'`
3. Pass role to `signup()` API call
4. Redirect based on role after success

### 5.5 Standalone Signup Page Changes

Same as AuthModal:
1. Role selector between "Create Account" header and name field
2. Pass role in form submission
3. Role-based redirect

## 6. Implementation Notes

- **Backward compatibility**: The `role` field is optional in the DTO with `@IsOptional()` and `@IsIn(['BUYER', 'SELLER'])`. Omitting it defaults to `'BUYER'`.
- **Security**: Validate that only `'BUYER'` or `'SELLER'` can be set via signup. Block `'ADMIN'` role assignment.
- **lib/auth.ts**: The `signup()` function signature needs a new `role` parameter. The `UserInfo` type already includes `role` field.
- **Email integration**: If Feature 1 (011-email-service) is implemented, send role-specific welcome email content.
- **Existing redirect logic**: `AuthModal.tsx` already has role-based redirect logic (line ~120: routes to `/dashboard` for SELLER). Verify this works with the new role selection.
