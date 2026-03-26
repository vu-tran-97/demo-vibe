# Cross-Feature E2E Test Scenarios

## Overview
- **Feature**: End-to-end user journeys spanning multiple features
- **Related Modules**: Auth, Product, Order, Board, Search, Admin, Settings
- **Purpose**: Verify integration between modules in realistic user workflows

## Scenario Group 1: Buyer Complete Journey

### E2E-001: Full buyer journey — signup to order
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Server running, DB seeded
- **User Journey**:
  1. Navigate to http://localhost:3000
  2. Click "Sign Up" → fill form as Buyer → Create Account
  3. Verify redirect to dashboard
  4. Navigate to homepage, browse products
  5. Click "Ceramics & Pottery" filter
  6. Click on a product → view detail
  7. Click "Add to Cart"
  8. Navigate to /dashboard/cart
  9. Proceed to checkout
  10. Fill shipping info, select payment method
  11. Submit order
  12. Verify order confirmation page
  13. Navigate to /dashboard/orders → verify order in list
- **Expected Results**:
  - Auth: User created with BUYER role
  - Product: Products browsable with filters
  - Order: Order created and visible in buyer's order history
- **Verification Method**: snapshot / network

### E2E-002: Buyer journey — Google OAuth signup to purchase
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Google OAuth configured in Firebase
- **User Journey**:
  1. Navigate to http://localhost:3000
  2. Click "Sign Up" → verify "Sign up with Google" button visible
  3. (Cannot automate Google popup — verify button exists and is clickable)
  4. After manual Google login, verify dashboard loads
- **Expected Results**:
  - UI: Google OAuth button present and functional
- **Verification Method**: snapshot

## Scenario Group 2: Seller Complete Journey

### E2E-003: Seller journey — signup, create product, manage sales
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Server running
- **User Journey**:
  1. Sign up as Seller
  2. Navigate to /dashboard/products/create
  3. Create a new product (name, price, category, stock)
  4. Verify product in /dashboard/products/my
  5. Navigate to /dashboard/orders/sales
  6. Verify sales dashboard renders (even if empty)
- **Expected Results**:
  - Auth: User with SELLER role
  - Product: New product created and visible in seller's list
  - Order: Sales dashboard accessible
- **Verification Method**: snapshot / network

## Scenario Group 3: Search → Purchase Flow

### E2E-004: Search, find product, add to cart
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in, products exist
- **User Journey**:
  1. Type "wool" in search bar
  2. Submit search
  3. Verify search results contain wool products
  4. Click on a result → product detail page
  5. Click "Add to Cart"
  6. Navigate to cart → verify item present
- **Expected Results**:
  - Search: Results returned for "wool"
  - Product: Detail page loads from search result
  - Cart: Item added successfully
- **Verification Method**: snapshot / network

## Scenario Group 4: Board + Auth Integration

### E2E-005: Authenticated user posts and comments
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in
- **User Journey**:
  1. Navigate to /dashboard/board
  2. Click create new post
  3. Fill title and content, submit
  4. Verify post appears in list
  5. Click on the new post
  6. Add a comment
  7. Verify comment appears
- **Expected Results**:
  - Board: Post created and comment added
  - Auth: Author info displayed correctly on post and comment
- **Verification Method**: snapshot / network

## Scenario Group 5: Admin Oversight

### E2E-006: Admin manages users and views their orders
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in as SUPER_ADMIN
- **User Journey**:
  1. Navigate to /dashboard/admin
  2. View dashboard statistics
  3. Navigate to /dashboard/admin/users
  4. Filter by role=SELLER
  5. Click on a seller → view detail
  6. View user summary statistics
  7. View activity log
  8. Change user role to BUYER
  9. Verify role change reflected
- **Expected Results**:
  - Admin: Dashboard, user management, role change all functional
  - API: Multiple admin endpoints called successfully
- **Verification Method**: snapshot / network

## Scenario Group 6: Responsive Cross-feature

### E2E-007: Mobile user journey — browse to checkout
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Mobile viewport (375x667)
- **User Journey**:
  1. Resize to 375x667
  2. Navigate to homepage → verify mobile layout
  3. Scroll categories horizontally
  4. Click a product → verify detail page mobile layout
  5. Add to cart
  6. Navigate to cart → verify mobile cart layout
- **Expected Results**:
  - UI: All pages render correctly in mobile viewport
  - No layout breakage or overflow
- **Verification Method**: snapshot

---

## Summary
| Type | Count |
|------|-------|
| Happy Path | 7 |
| Alternative Path | 0 |
| Edge Case | 0 |
| Error Path | 0 |
| **Total** | **7** |
