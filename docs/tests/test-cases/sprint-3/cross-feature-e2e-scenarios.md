# Cross-Feature E2E Test Scenarios

## Overview
- **Feature**: End-to-end user journeys spanning multiple frontend pages
- **Related Modules**: Auth, Products, Cart, Board, Chat, Orders, Settings
- **Blueprint**: N/A (integration scenarios across features)

---

## Scenario Group 1: Complete Shopping Journey

### E2E-CF-001: Full shopping flow — signup to checkout
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Fresh browser session, no auth tokens
- **User Journey**:
  1. Navigate to `http://localhost:3000` (homepage)
  2. Click "Sign Up" button
  3. Create account (name, email, password)
  4. After successful signup, click on a product card
  5. Verify navigation to `/dashboard/products/{id}`
  6. Click "Add to Cart"
  7. Navigate to `/dashboard/cart`
  8. Verify item in cart with correct price
  9. Adjust quantity to 2
  10. Verify total updates
  11. Click "Checkout"
- **Expected Results**:
  - API: signup → login flow completes
  - UI: Seamless flow from homepage to dashboard without manual login step
  - UI: Cart accurately reflects added items and quantities
  - UI: Order summary calculates correctly
- **Verification Method**: snapshot / network
- **Test Data**: Unique user credentials, product with known price

### E2E-CF-002: Browse products → add multiple items → review cart
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: User logged in
- **User Journey**:
  1. Navigate to `/dashboard/products`
  2. Click on "Speckled Ceramic Vase" → add to cart
  3. Go back to products
  4. Filter by "Textiles" category
  5. Click on a textile product → add to cart
  6. Navigate to `/dashboard/cart`
- **Expected Results**:
  - UI: Cart shows 2 different items
  - UI: Subtotal = sum of both items
  - UI: Both items show quantity 1
- **Verification Method**: snapshot
- **Test Data**: 2 different products

---

## Scenario Group 2: Auth State Persistence Across Pages

### E2E-CF-003: Auth persists across all dashboard pages
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: User logged in
- **User Journey**:
  1. Login and navigate to `/dashboard`
  2. Navigate to `/dashboard/board`
  3. Navigate to `/dashboard/chat`
  4. Navigate to `/dashboard/orders`
  5. Navigate to `/dashboard/settings`
  6. Navigate to `/dashboard/products`
  7. Navigate to `/dashboard/cart`
- **Expected Results**:
  - UI: All pages load without redirect to login
  - UI: User info consistent across sidebar on all pages
  - UI: No auth-related errors in console
- **Verification Method**: snapshot / console
- **Test Data**: Logged-in user

### E2E-CF-004: Logout from settings redirects and blocks dashboard access
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: User logged in, on settings page
- **User Journey**:
  1. Navigate to `/dashboard/settings`
  2. Click "Log Out All" in Danger Zone
  3. Try navigating directly to `/dashboard/products`
- **Expected Results**:
  - UI: After logout, redirected to homepage
  - UI: Direct dashboard URL access blocked — redirected or shows auth prompt
  - UI: Homepage shows "Sign In" / "Sign Up" buttons (not welcome message)
- **Verification Method**: snapshot / network
- **Test Data**: None

---

## Scenario Group 3: Navigation Flow

### E2E-CF-005: Homepage → signup → dashboard → all pages → logout → homepage
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Fresh browser session
- **User Journey**:
  1. Navigate to homepage
  2. Sign up with new account
  3. Verify redirect to dashboard or product page
  4. Use sidebar to visit: Board → Chat → Products → Cart → Orders → Settings
  5. Click "Log Out All" on Settings page
  6. Verify redirect to homepage
  7. Verify "Sign In" / "Sign Up" buttons are back
- **Expected Results**:
  - UI: Complete lifecycle works without errors
  - Console: No JavaScript errors throughout the flow
- **Verification Method**: snapshot / console
- **Test Data**: Unique user credentials

### E2E-CF-006: Product detail → add to cart → cart badge updates in nav
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: User logged in, empty cart
- **User Journey**:
  1. Navigate to `/dashboard/products`
  2. Click a product
  3. Add to cart
  4. Check sidebar "Cart" nav item for item count indicator
- **Expected Results**:
  - UI: Cart nav item shows count badge (if implemented) or cart page shows 1 item
- **Verification Method**: snapshot
- **Test Data**: Any product

---

## Scenario Group 4: Role-Based UI Differences

### E2E-CF-007: BUYER sees standard dashboard, no admin
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: User logged in as BUYER
- **User Journey**:
  1. Navigate to `/dashboard`
  2. Check sidebar navigation
  3. Navigate to `/dashboard/settings`
  4. Check role badge in profile section
- **Expected Results**:
  - UI: Sidebar has NO "Admin" section
  - UI: Settings page shows role badge "BUYER"
  - UI: All standard pages accessible
- **Verification Method**: snapshot
- **Test Data**: BUYER user

### E2E-CF-008: SUPER_ADMIN sees admin section and correct role
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: User logged in as SUPER_ADMIN
- **User Journey**:
  1. Navigate to `/dashboard`
  2. Verify "Admin" section in sidebar with "User Management"
  3. Navigate to `/dashboard/settings`
  4. Verify role badge shows "SUPER_ADMIN"
- **Expected Results**:
  - UI: Admin section visible in sidebar
  - UI: Settings shows SUPER_ADMIN role
- **Verification Method**: snapshot
- **Test Data**: SUPER_ADMIN user

---

## Scenario Group 5: Error Recovery

### E2E-CF-009: Expired token — dashboard page refresh
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: User was logged in but token has expired
- **User Journey**:
  1. Login and navigate to dashboard
  2. Manually clear/expire auth tokens (simulate expiry)
  3. Refresh the page
- **Expected Results**:
  - UI: Redirected to homepage or shows re-auth prompt
  - UI: No crash or blank page
  - Console: No unhandled errors
- **Verification Method**: snapshot / console
- **Test Data**: Manipulate localStorage/cookies

### E2E-CF-010: Navigate to non-existent dashboard route
- **Type**: Error Path
- **Priority**: Low
- **Preconditions**: User logged in
- **User Journey**:
  1. Navigate to `/dashboard/nonexistent`
- **Expected Results**:
  - UI: 404 page or redirect to dashboard overview
  - UI: No white screen / crash
- **Verification Method**: snapshot
- **Test Data**: None

---

## Summary
| Type | Count |
|------|-------|
| Happy Path | 8 |
| Alternative Path | 0 |
| Edge Case | 0 |
| Error Path | 2 |
| **Total** | **10** |
