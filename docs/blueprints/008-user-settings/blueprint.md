# 008-User-Settings: User Settings Module Blueprint

> User account settings page -- profile editing, password change, account info display, and account deletion (soft delete).

## 1. Overview

### 1.1 Purpose

Replace the placeholder settings page with a fully functional user settings module. Enable users to manage their profile information, change passwords securely, view account details, and delete their account with a soft-delete mechanism.

### 1.2 Scope

- Profile editing: name, nickname, profile image URL
- Password change: verify current password, set new password
- Account info display: email (read-only), role badge, registration date
- Account deletion: soft delete (set delYn='Y') with confirmation modal
- Toast notifications for success/error feedback
- Responsive layout: mobile / tablet / desktop

### 1.3 Out of Scope

- Profile image file upload (URL input only for this sprint)
- Email change (requires verification flow -- future sprint)
- Two-factor authentication settings
- Notification preference persistence (backend)
- Session management UI (view/revoke individual sessions)

### 1.4 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend Framework | NestJS (TypeScript) |
| ORM | Prisma (MongoDB Adapter) |
| Database | MongoDB 7 (replica set) |
| Validation | class-validator, class-transformer |
| Auth | @nestjs/jwt, @nestjs/passport (existing JwtAuthGuard) |
| Frontend Framework | Next.js 15 (App Router) |
| Styling | CSS Modules + Design Tokens |
| State | React hooks (useAuth -- existing) |

### 1.5 Dependencies

| Dependency | Module | Reason |
|-----------|--------|--------|
| Auth Module (001-auth) | TB_COMM_USER, JwtAuthGuard, @CurrentUser | User identification, route protection |
| RBAC Module (002-rbac) | @Roles decorator, RolesGuard | Role-based endpoint access |

---

## 2. Architecture

### 2.1 Backend Endpoints

All endpoints require authentication (JwtAuthGuard). Added to the existing AuthController/AuthService.

| Method | Path | Description |
|--------|------|-------------|
| PATCH | /api/auth/profile | Update profile (name, nickname, profileImageUrl) |
| PATCH | /api/auth/password | Change password (verify current, set new) |
| DELETE | /api/auth/account | Soft delete account (set delYn='Y') |

### 2.2 Data Flow

```
Frontend (Settings Page)
  |
  |-- PATCH /api/auth/profile --> AuthService.updateProfile()
  |     --> Prisma: User.update(userNm, userNcnm, prflImgUrl)
  |     --> Return formatted user response
  |
  |-- PATCH /api/auth/password --> AuthService.changePassword()
  |     --> bcrypt.compare(currentPassword, user.userPswd)
  |     --> bcrypt.hash(newPassword) --> User.update(userPswd)
  |     --> Revoke all refresh tokens for security
  |
  |-- DELETE /api/auth/account --> AuthService.deleteAccount()
  |     --> User.update(delYn='Y', userSttsCd='INAC')
  |     --> Revoke all refresh tokens
  |     --> Return success message
```

---

## 3. API Specification

### 3.1 PATCH /api/auth/profile

**Request Body (UpdateProfileDto)**:
```json
{
  "name": "John Doe",
  "nickname": "johnd",
  "profileImageUrl": "https://example.com/avatar.jpg"
}
```
All fields are optional. At least one field must be provided.

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "john@example.com",
    "name": "John Doe",
    "nickname": "johnd",
    "emailVerified": true,
    "profileImageUrl": "https://example.com/avatar.jpg",
    "role": "BUYER"
  }
}
```

**Errors**:
- 401: Unauthorized (no/invalid token)
- 409: NICKNAME_ALREADY_EXISTS (nickname taken by another user)

### 3.2 PATCH /api/auth/password

**Request Body (ChangePasswordDto)**:
```json
{
  "currentPassword": "OldP@ss1",
  "newPassword": "NewP@ss2"
}
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "message": "Password changed successfully"
  }
}
```

**Errors**:
- 400: INVALID_CURRENT_PASSWORD (current password mismatch)
- 400: SAME_PASSWORD (new password same as current)
- 401: Unauthorized

### 3.3 DELETE /api/auth/account

**Request Body**: None

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "message": "Account deleted successfully"
  }
}
```

**Errors**:
- 401: Unauthorized

---

## 4. Frontend Design

### 4.1 Page Layout (Settings)

The settings page is organized into sections:

1. **Profile Section**: Avatar display, name/nickname/profile image URL inputs, save button
2. **Security Section**: Password change form (current + new + confirm), collapsible
3. **Account Section**: Email (read-only), role badge, registration date, delete button with confirmation modal

### 4.2 Responsive Breakpoints

| Breakpoint | Layout |
|-----------|--------|
| Mobile (< 768px) | Single column, full width, stacked form elements |
| Tablet (768-1023px) | Single column, max-width 720px |
| Desktop (1024px+) | Single column, max-width 720px |

### 4.3 UI Components

- Toast notification (success/error variants)
- Delete account confirmation modal with warning icon
- Role badge component (inline)
- Form inputs with validation feedback

---

## 5. Validation Rules

### 5.1 Profile Update
- **name**: Required (1-50 chars), non-empty after trim
- **nickname**: Optional (2-30 chars), alphanumeric + Korean + underscore, unique
- **profileImageUrl**: Optional, valid URL format

### 5.2 Password Change
- **currentPassword**: Required
- **newPassword**: Required, min 8 chars, must contain uppercase + lowercase + digit + special char
- **confirmPassword**: Frontend-only validation (must match newPassword)

---

## 6. Security Considerations

- All endpoints require valid JWT access token
- Current password verification before allowing password change
- All refresh tokens revoked after password change (force re-login on other devices)
- All refresh tokens revoked after account deletion
- Soft delete preserves data for audit trail (delYn='Y', userSttsCd='INAC')
- Nickname uniqueness checked excluding soft-deleted users
