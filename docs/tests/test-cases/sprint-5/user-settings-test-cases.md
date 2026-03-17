# User Settings -- Test Cases (Sprint 5)

## Unit Tests

### AuthService — Profile Update

#### TC-SET-001: Update profile name successfully
- **Given**: Authenticated user with name "Old Name"
- **When**: updateProfile is called with { name: "New Name" }
- **Then**: User record updated, returns formatted user response with name "New Name"

#### TC-SET-002: Update profile nickname successfully
- **Given**: Authenticated user, nickname "oldnick" available
- **When**: updateProfile with { nickname: "newnick" }
- **Then**: User record updated, returns user response with nickname "newnick"

#### TC-SET-003: Reject duplicate nickname
- **Given**: Another active user has nickname "taken_nick"
- **When**: updateProfile with { nickname: "taken_nick" }
- **Then**: Throws NICKNAME_ALREADY_EXISTS (409)

#### TC-SET-004: Allow own existing nickname
- **Given**: User currently has nickname "mynick"
- **When**: updateProfile with { nickname: "mynick" }
- **Then**: Update succeeds (no conflict with self)

#### TC-SET-005: Update profile image URL
- **Given**: Authenticated user with no profile image
- **When**: updateProfile with { profileImageUrl: "https://example.com/img.jpg" }
- **Then**: User prflImgUrl updated, returns user response with new URL

#### TC-SET-006: Update multiple fields at once
- **Given**: Authenticated user
- **When**: updateProfile with { name: "New", nickname: "nick", profileImageUrl: "https://img.com/a.png" }
- **Then**: All three fields updated in single Prisma call

#### TC-SET-007: Reject empty name
- **Given**: Authenticated user
- **When**: updateProfile with { name: "" }
- **Then**: Validation error from class-validator (400)

#### TC-SET-008: Ignore soft-deleted users in nickname uniqueness check
- **Given**: Deleted user (delYn='Y') has nickname "ghost_nick"
- **When**: updateProfile with { nickname: "ghost_nick" }
- **Then**: Update succeeds (soft-deleted users excluded from uniqueness check)

### AuthService — Password Change

#### TC-SET-009: Change password successfully
- **Given**: User with hashed password matching "OldP@ss1"
- **When**: changePassword with { currentPassword: "OldP@ss1", newPassword: "NewP@ss2" }
- **Then**: Password updated with bcrypt hash, all refresh tokens revoked, returns success message

#### TC-SET-010: Reject incorrect current password
- **Given**: User with password "OldP@ss1"
- **When**: changePassword with { currentPassword: "WrongPass1!", newPassword: "NewP@ss2" }
- **Then**: Throws INVALID_CURRENT_PASSWORD (400)

#### TC-SET-011: Reject new password same as current
- **Given**: User with password "SameP@ss1"
- **When**: changePassword with { currentPassword: "SameP@ss1", newPassword: "SameP@ss1" }
- **Then**: Throws SAME_PASSWORD (400)

#### TC-SET-012: New password must meet complexity requirements
- **Given**: Authenticated user
- **When**: changePassword with { currentPassword: "OldP@ss1", newPassword: "weak" }
- **Then**: Validation error (min 8 chars, uppercase, lowercase, digit, special char)

#### TC-SET-013: All refresh tokens revoked after password change
- **Given**: User has 3 active refresh tokens
- **When**: changePassword succeeds
- **Then**: All 3 tokens have rvkdYn='Y'

### AuthService — Account Deletion

#### TC-SET-014: Soft delete account successfully
- **Given**: Active user (delYn='N', userSttsCd='ACTV')
- **When**: deleteAccount is called
- **Then**: User updated with delYn='Y', userSttsCd='INAC', all refresh tokens revoked

#### TC-SET-015: Return success message after deletion
- **Given**: Active user
- **When**: deleteAccount
- **Then**: Returns { message: "Account deleted successfully" }

#### TC-SET-016: Already deleted user cannot delete again
- **Given**: User with delYn='Y'
- **When**: deleteAccount (should not reach here due to JWT guard, but service handles gracefully)
- **Then**: User not found (filtered by delYn='N' in JWT strategy)

### AuthController — Endpoint Access

#### TC-SET-017: Profile update requires authentication
- **Given**: No JWT token in request
- **When**: PATCH /api/auth/profile
- **Then**: Returns 401 Unauthorized

#### TC-SET-018: Password change requires authentication
- **Given**: No JWT token in request
- **When**: PATCH /api/auth/password
- **Then**: Returns 401 Unauthorized

#### TC-SET-019: Account delete requires authentication
- **Given**: No JWT token in request
- **When**: DELETE /api/auth/account
- **Then**: Returns 401 Unauthorized

## Integration Tests

### Profile Update Flow

#### TC-SET-020: End-to-end profile update
- **Given**: Logged-in user on settings page
- **When**: Changes name to "Updated Name", clicks "Save Changes"
- **Then**: API call succeeds, toast shows "Profile updated successfully", localStorage user updated

#### TC-SET-021: Nickname conflict shown in UI
- **Given**: User types a taken nickname
- **When**: Clicks "Save Changes"
- **Then**: Error toast shows "Nickname is already taken"

### Password Change Flow

#### TC-SET-022: End-to-end password change
- **Given**: User clicks "Change Password", fills current + new + confirm
- **When**: Clicks "Update Password"
- **Then**: API succeeds, toast shows success, password fields cleared, section collapsed

#### TC-SET-023: Confirm password mismatch
- **Given**: newPassword = "NewP@ss1", confirmPassword = "Different1!"
- **When**: User types in confirm field
- **Then**: "Passwords do not match" error shown, Update button disabled

#### TC-SET-024: Wrong current password error
- **Given**: User enters incorrect current password
- **When**: Clicks "Update Password"
- **Then**: Error toast shows "Current password is incorrect"

### Account Deletion Flow

#### TC-SET-025: Delete account with confirmation
- **Given**: User clicks "Delete Account" button
- **When**: Confirmation modal appears, user clicks "Yes, Delete My Account"
- **Then**: API call succeeds, user logged out, redirected to home page

#### TC-SET-026: Cancel account deletion
- **Given**: Delete confirmation modal is open
- **When**: User clicks "Cancel" or presses Escape
- **Then**: Modal closes, no API call made

### Account Info Display

#### TC-SET-027: Display account information
- **Given**: User with email "test@mail.com", role "BUYER", registered on 2026-01-15
- **When**: Settings page loads
- **Then**: Email shown as read-only, role badge shows "BUYER", registration date formatted

## Responsive Tests

#### TC-SET-028: Mobile layout (< 768px)
- **Given**: Viewport width 375px
- **When**: Settings page renders
- **Then**: Full width sections, stacked form, profile header vertical layout, modal full-width buttons

#### TC-SET-029: Tablet layout (768-1023px)
- **Given**: Viewport width 768px
- **When**: Settings page renders
- **Then**: Max-width 720px container, horizontal profile header

#### TC-SET-030: Desktop layout (1024px+)
- **Given**: Viewport width 1440px
- **When**: Settings page renders
- **Then**: Max-width 720px container, all sections properly spaced
