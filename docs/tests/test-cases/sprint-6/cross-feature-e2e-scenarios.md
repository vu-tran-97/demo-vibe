# Cross-Feature E2E Test Scenarios (Sprint 6)

## Overview
- **Feature**: End-to-end user journeys spanning multiple features
- **Related Modules**: All modules (auth, product, cart, order, payment, board, admin, search)
- **Purpose**: Verify integration between features in real user workflows

## Scenario Group 1: Complete Buyer Journey

### E2E-001: Guest browses → signs up → buys → checks history
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Products seeded, no user account
- **User Journey**:
  1. Navigate to `/` as guest
  2. Browse products, search for "craft"
  3. Click on a product to view detail at `/products/{id}`
  4. Click "Add to Cart"
  5. Navigate to `/cart`, verify item
  6. Click "Proceed to Checkout"
  7. Verify guest notice banner
  8. Click "Sign in" in the banner
  9. Sign up with new account in AuthModal
  10. Verify banner disappears, user is logged in
  11. Complete checkout with Bank Transfer
  12. Verify success page with "View My Orders" link
  13. Click "View My Orders"
  14. Verify the order appears in `/orders`
  15. Click on the order to view details
- **Expected Results**:
  - Full journey works end-to-end
  - Guest notice visible before login, hidden after
  - Order created with actual user ID (not guest)
  - Order visible in purchase history
- **Verification Method**: snapshot / network / server-log
- **Test Data**: New user email, any active product

### E2E-002: Guest checkout → no history
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Products seeded
- **User Journey**:
  1. As guest, add product to cart
  2. Go to `/checkout`
  3. Complete checkout without signing in
  4. Verify success page shows "Sign in to track your order history"
  5. Sign up as new user
  6. Navigate to `/orders`
  7. Verify the guest order does NOT appear
- **Expected Results**:
  - Guest order placed successfully
  - Order not associated with subsequently created user account
  - Order history is empty for new user
- **Verification Method**: snapshot / network
- **Test Data**: Guest order + new signup

### E2E-003: Buyer places order → Seller fulfills → Buyer sees delivered
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Buyer and seller accounts, active products from seller
- **User Journey**:
  1. Log in as buyer
  2. Add seller1's product to cart
  3. Complete checkout
  4. Log out buyer, log in as seller1
  5. Navigate to `/dashboard/orders/sales`
  6. Confirm payment for the order item
  7. Update status: PENDING → CONFIRMED → SHIPPED (with tracking) → DELIVERED
  8. Log out seller, log in as buyer
  9. Navigate to `/orders`
  10. Click on the order
  11. Verify status shows DELIVERED with tracking number
- **Expected Results**:
  - Full order lifecycle from creation to delivery
  - Buyer sees status updates and tracking info
  - Seller can manage item-by-item
- **Verification Method**: snapshot / network / server-log
- **Test Data**: `buyer@vibe.com`, `seller1@yopmail.com`

## Scenario Group 2: Multi-Role Workflows

### E2E-004: Admin creates seller → Seller lists product → Buyer purchases
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Admin account
- **User Journey**:
  1. Log in as admin
  2. Navigate to `/dashboard/admin/users`
  3. Create new user with role SELLER
  4. Log out admin, log in as new seller
  5. Navigate to `/dashboard/products/create`
  6. Create a product with stock
  7. Log out seller, log in as buyer
  8. Search for the new product on homepage
  9. Add to cart, checkout
  10. Verify order placed for new seller's product
- **Expected Results**:
  - Admin user creation works
  - New seller can list products
  - Buyer can purchase from new seller
- **Verification Method**: snapshot / network
- **Test Data**: Admin creates seller, seller creates product, buyer purchases

### E2E-005: Seller manages products → Buyer sees changes in real-time
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Seller has products
- **User Journey**:
  1. Log in as seller
  2. Change product price
  3. Log out, browse as guest
  4. Find the product on homepage
  5. Verify new price displayed
  6. Log back in as seller
  7. Set product to INACTV
  8. Browse as guest
  9. Verify product no longer appears in listing
- **Expected Results**:
  - Price change reflected immediately in public listing
  - Inactive product hidden from public
- **Verification Method**: snapshot / network
- **Test Data**: Seller1's product

## Scenario Group 3: Search to Purchase

### E2E-006: Search → Filter → Purchase → Post Review
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Products and board seeded, buyer account
- **User Journey**:
  1. Log in as buyer
  2. Search for "ceramic" on homepage
  3. Filter by price range
  4. Select a product, add to cart
  5. Complete checkout
  6. Navigate to `/dashboard/board/create`
  7. Write a review post about the purchase (category: REVIEW)
  8. Submit
  9. Navigate to `/dashboard/board`
  10. Verify review post appears
- **Expected Results**:
  - Search + filter + purchase + board post all work together
  - Review post visible in board listing
- **Verification Method**: snapshot / network
- **Test Data**: Search: "ceramic", review post

## Scenario Group 4: Security Cross-Feature

### E2E-007: Buyer cannot access seller/admin features
- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: Logged in as buyer
- **User Journey**:
  1. Log in as buyer
  2. Try to access `/dashboard/admin` → verify redirect/denied
  3. Try `POST /api/products` → verify 403
  4. Try `GET /api/orders/sales` → verify empty or 403
  5. Try `GET /api/admin/users` → verify 403
  6. Try `PATCH /api/admin/users/:id/role` → verify 403
- **Expected Results**:
  - All admin/seller-only endpoints return 403 for buyer
  - Admin pages redirect buyer away
- **Verification Method**: network / snapshot
- **Test Data**: Buyer token

### E2E-008: Unauthenticated user access restrictions
- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: Not logged in
- **User Journey**:
  1. Try `GET /api/orders` (buyer orders) → verify 401
  2. Try `POST /api/orders` (create order) → verify 401
  3. Try `GET /api/products/my` → verify 401
  4. Try `POST /api/posts` → verify 401
  5. Try `GET /api/admin/users` → verify 401
  6. Navigate to `/orders` → verify redirect to login
  7. Verify public endpoints work: `GET /api/products`, `GET /api/search`
  8. Verify guest checkout works: `POST /api/orders/checkout` → success (no auth required)
- **Expected Results**:
  - Protected endpoints return 401
  - Public endpoints accessible
  - Guest checkout is the only mutation endpoint accessible without auth
- **Verification Method**: network
- **Test Data**: No auth token

---

## Summary
| Type | Count |
|------|-------|
| Happy Path | 6 |
| Alternative Path | 0 |
| Edge Case | 0 |
| Error Path | 2 |
| **Total** | **8** |
