# Role-Based Signup E2E Test Scenarios

## Overview
- **Feature**: Buyer/Seller role selection during signup with role-specific experiences
- **Related Modules**: Auth, Product, Order
- **API Endpoints**: POST /api/auth/signup, POST /api/products, GET /api/products/my
- **DB Tables**: TB_COMM_USER (USE_ROLE_CD field)
- **Blueprint**: docs/blueprints/012-role-signup/blueprint.md

## Scenario Group 1: Buyer Signup Flow

### E2E-001: Signup as Buyer via AuthModal
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Not logged in, on homepage
- **User Journey**:
  1. Navigate to / (homepage)
  2. Click "Sign Up" button in header to open AuthModal
  3. Verify role selector shows two cards: "Buyer" (selected by default) and "Seller"
  4. Keep "Buyer" selected
  5. Fill in name: "Buyer Modal", email: "buyer-modal@test.com", password: "Test1234!"
  6. Accept terms and click "Create Account"
- **Expected Results**:
  - UI: Modal closes, user redirected to "/" (homepage), user menu shows "Buyer" badge
  - API: POST /api/auth/signup body includes role: "BUYER", response has user.role = "BUYER"
  - DB: TB_COMM_USER record with USE_ROLE_CD = "BUYER"
- **Verification Method**: snapshot / network / db-query
- **Test Data**: { email: "buyer-modal@test.com", password: "Test1234!", name: "Buyer Modal", role: "BUYER" }

### E2E-002: Signup as Buyer via standalone signup page
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Not logged in
- **User Journey**:
  1. Navigate to /auth/signup
  2. Verify role selector cards visible, Buyer selected by default
  3. Fill in name, email, password
  4. Submit form
- **Expected Results**:
  - UI: Redirect to "/" (homepage)
  - API: POST /api/auth/signup with role = "BUYER"
  - DB: User created with USE_ROLE_CD = "BUYER"
- **Verification Method**: snapshot / network
- **Test Data**: { email: "buyer-page@test.com", password: "Test1234!", name: "Buyer Page" }

### E2E-003: Buyer role badge displays in UserMenu
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in as BUYER
- **User Journey**:
  1. Click user avatar/menu in header
  2. Observe dropdown menu
- **Expected Results**:
  - UI: "Buyer" badge visible in user menu dropdown
- **Verification Method**: snapshot
- **Test Data**: Logged-in BUYER user

### E2E-004: Buyer role badge displays on settings page
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in as BUYER
- **User Journey**:
  1. Navigate to /settings
  2. Observe account info section
- **Expected Results**:
  - UI: "Buyer" role badge visible in account info
- **Verification Method**: snapshot
- **Test Data**: Logged-in BUYER user

## Scenario Group 2: Seller Signup Flow

### E2E-005: Signup as Seller via AuthModal
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Not logged in, on homepage
- **User Journey**:
  1. Navigate to / (homepage)
  2. Click "Sign Up" in header
  3. Click "Seller" role card (deselects Buyer, selects Seller with checkmark)
  4. Fill in name: "Seller Modal", email: "seller-modal@test.com", password: "Test1234!"
  5. Accept terms and submit
- **Expected Results**:
  - UI: Modal closes, user redirected to "/dashboard/products/create" (product creation page)
  - API: POST /api/auth/signup body includes role: "SELLER", response has user.role = "SELLER"
  - DB: TB_COMM_USER record with USE_ROLE_CD = "SELLER"
- **Verification Method**: snapshot / network / db-query
- **Test Data**: { email: "seller-modal@test.com", password: "Test1234!", name: "Seller Modal", role: "SELLER" }

### E2E-006: Signup as Seller via standalone signup page
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Not logged in
- **User Journey**:
  1. Navigate to /auth/signup
  2. Click "Seller" role card
  3. Fill in form and submit
- **Expected Results**:
  - UI: Redirect to "/dashboard/products/create"
  - API: POST /api/auth/signup with role = "SELLER"
- **Verification Method**: snapshot / network
- **Test Data**: { email: "seller-page@test.com", password: "Test1234!", name: "Seller Page", role: "SELLER" }

### E2E-007: Seller can access product management after signup
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Just signed up as SELLER, on /dashboard/products/create
- **User Journey**:
  1. Verify product creation form is accessible
  2. Navigate to /dashboard/products/my
  3. Verify "My Products" page loads (empty state)
- **Expected Results**:
  - UI: Product creation form renders, My Products page accessible
  - API: GET /api/products/my returns 200 with empty array
- **Verification Method**: snapshot / network
- **Test Data**: SELLER access token

### E2E-008: Seller role badge displays in UserMenu
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in as SELLER
- **User Journey**:
  1. Click user avatar/menu in header
- **Expected Results**:
  - UI: "Seller" badge visible (accent/green color)
- **Verification Method**: snapshot
- **Test Data**: Logged-in SELLER user

## Scenario Group 3: Default and Backward Compatibility

### E2E-009: Signup without role defaults to BUYER
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: None
- **User Journey**:
  1. POST /api/auth/signup with body (no role field): { email, password, name }
- **Expected Results**:
  - API: Response user.role = "BUYER"
  - DB: USE_ROLE_CD = "BUYER"
- **Verification Method**: network / db-query
- **Test Data**: { email: "no-role@test.com", password: "Test1234!", name: "No Role" }

### E2E-010: Existing BUYER users unaffected by role feature
- **Type**: Edge Case
- **Priority**: High
- **Preconditions**: User created before Sprint 7 (without role selection)
- **User Journey**:
  1. Login with existing user credentials
  2. Check user profile / user menu
- **Expected Results**:
  - UI: "Buyer" badge shows correctly
  - API: User data returns role = "BUYER"
- **Verification Method**: network / snapshot
- **Test Data**: Pre-existing user account

## Scenario Group 4: Role Validation and Security

### E2E-011: Signup with ADMIN role is rejected
- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: None
- **User Journey**:
  1. POST /api/auth/signup with role: "ADMIN"
- **Expected Results**:
  - API: 400 response with validation error
  - DB: No user created
- **Verification Method**: network / db-query
- **Test Data**: { email: "admin-hack@test.com", password: "Test1234!", name: "Admin Hack", role: "ADMIN" }

### E2E-012: Signup with SUPER_ADMIN role is rejected
- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: None
- **User Journey**:
  1. POST /api/auth/signup with role: "SUPER_ADMIN"
- **Expected Results**:
  - API: 400 response with validation error
- **Verification Method**: network
- **Test Data**: { email: "super-hack@test.com", password: "Test1234!", name: "Super Hack", role: "SUPER_ADMIN" }

### E2E-013: Signup with invalid role value is rejected
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: None
- **User Journey**:
  1. POST /api/auth/signup with role: "INVALID_ROLE"
- **Expected Results**:
  - API: 400 response with validation error
- **Verification Method**: network
- **Test Data**: { role: "INVALID_ROLE" }

### E2E-014: Social login defaults to BUYER role
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: OAuth provider configured
- **User Journey**:
  1. Click social login button (Google/Kakao/Naver)
  2. Complete OAuth flow
- **Expected Results**:
  - DB: User created with USE_ROLE_CD = "BUYER" (no role selection offered for social login)
- **Verification Method**: db-query
- **Test Data**: Social OAuth credentials

---

## Summary
| Type | Count |
|------|-------|
| Happy Path | 9 |
| Alternative Path | 0 |
| Edge Case | 2 |
| Error Path | 3 |
| **Total** | **14** |
