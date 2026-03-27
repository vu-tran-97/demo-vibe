# Cross-Feature E2E Test Scenarios

## Overview
- **Sprint**: 8
- **Scope**: End-to-end user journeys spanning multiple features
- **Related Modules**: Auth, Product, Order, Board, Search, Email, Admin, Settings
- **Purpose**: Verify seamless integration between features in real user workflows

---

## Scenario Group 1: Complete Buyer Journey

### E2E-001: New buyer signup → browse → purchase → review
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: No existing account, products available in DB
- **User Journey**:
  1. Navigate to `/` (home page)
  2. Click "Sign Up" in top bar
  3. Fill signup form: email `newbuyer-e2e@yopmail.com`, password `Test@1234!`, name `E2E Buyer`
  4. Select role: BUYER
  5. Verify redirect to home page
  6. Browse products, use category filter (CERAMICS)
  7. Click "Load More" to load additional products
  8. Click on a product to view detail at `/products/:id`
  9. Click "Add to Cart"
  10. Navigate to `/cart`, verify item in cart
  11. Click "Checkout", fill shipping address
  12. Complete order creation
  13. Navigate to `/dashboard/orders`, verify order appears
  14. Navigate to `/dashboard/board/create`, write a REVIEW post about the product
  15. Navigate to `/dashboard/board`, verify post appears
- **Expected Results**:
  - UI: Smooth flow through all pages, no errors
  - API: `POST /api/auth/role` (BUYER) → `GET /api/products` → `POST /api/orders` → `POST /api/posts`
  - DB: TB_COMM_USER created (useRoleCd=BUYER), TB_COMM_ORDR created, TB_COMM_ORDR_ITEM created, TB_COMM_BOARD_POST created (postCtgrCd=REVIEW), product stckQty decremented
  - Server Log: Welcome email sent (TL_COMM_EML_LOG), order confirmation email sent
- **Verification Method**: snapshot / network / server-log
- **Test Data**: `newbuyer-e2e@yopmail.com` / `Test@1234!`

### E2E-002: Buyer searches → filters → purchases multiple items from different sellers
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Buyer logged in, multiple sellers with active products
- **User Journey**:
  1. Type "Premium" in search bar on home page
  2. Verify search results show products matching "Premium"
  3. Add product from Seller 1 to cart
  4. Clear search, filter by category JEWELRY
  5. Add product from Seller 2 to cart
  6. Navigate to `/cart`, verify 2 items from different sellers
  7. Proceed to checkout
  8. Complete order
  9. Navigate to `/dashboard/orders`, verify order with 2 items
- **Expected Results**:
  - UI: Cart shows items from multiple sellers, order detail shows grouped items
  - API: `GET /api/search?q=Premium` → `GET /api/products?category=JEWELRY` → `POST /api/orders`
  - DB: Single TB_COMM_ORDR with 2 TB_COMM_ORDR_ITEM records (different sellerId), both product stckQty decremented
  - Server Log: Order confirmation email with both items listed
- **Verification Method**: snapshot / network / db-query
- **Test Data**: Search term "Premium", categories JEWELRY

---

## Scenario Group 2: Complete Seller Journey

### E2E-003: New seller signup → list products → manage sales
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: No existing seller account
- **User Journey**:
  1. Sign up with `newseller-e2e@yopmail.com`, password `Test@1234!`, name `E2E Seller`
  2. Select role: SELLER
  3. Verify redirect to `/dashboard`
  4. Navigate to `/dashboard/products/create`
  5. Create product: name "E2E Test Ceramic Bowl", category CERAMICS, price 25000, stock 10
  6. Verify product appears in `/dashboard/products/my`
  7. Navigate to home page `/`, search for "E2E Test Ceramic Bowl"
  8. Verify product appears in search results
  9. Log out, log in as buyer (`buyer@vibe.com`)
  10. Purchase the product
  11. Log out, log in as seller again
  12. Navigate to `/dashboard/orders/sales`
  13. Verify new order appears in sales list
  14. Update item status to SHIPPED with tracking number
  15. Verify sales summary updated
- **Expected Results**:
  - UI: Full seller workflow from signup to sales management
  - API: Role set → Product created → Order received → Item status updated
  - DB: User (SELLER), Product (ACTV), Order + OrderItem, OrderStatusHistory
  - Server Log: Welcome email for seller, order confirmation for buyer
- **Verification Method**: snapshot / network / server-log
- **Test Data**: `newseller-e2e@yopmail.com`, product "E2E Test Ceramic Bowl"

### E2E-004: Seller product goes SOLD_OUT → buyer sees out of stock
- **Type**: Edge Case
- **Priority**: High
- **Preconditions**: Seller with product (stckQty = 1)
- **User Journey**:
  1. Login as seller, create product with stock = 1
  2. Login as buyer, purchase the product (qty = 1)
  3. Verify order created successfully
  4. Navigate to product detail page
  5. Verify "Add to Cart" button is disabled or shows "Sold Out"
  6. Try to purchase again via API
  7. Verify rejection due to insufficient stock
  8. Login as seller, navigate to product list
  9. Verify product status shows SOLD_OUT
- **Expected Results**:
  - UI: Product shows sold out state after last item purchased
  - API: First order succeeds, second attempt returns stock error
  - DB: Product stckQty = 0, prdSttsCd = 'SOLD_OUT'
  - Server Log: No errors, stock deduction logged
- **Verification Method**: snapshot / network / db-query
- **Test Data**: Product with stckQty = 1

---

## Scenario Group 3: Admin Oversight Journey

### E2E-005: Admin monitors new signups → manages users → reviews activity
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Admin logged in (`admin@astratech.vn`), recent user signups
- **User Journey**:
  1. Login as admin
  2. Navigate to `/dashboard/admin`
  3. Verify dashboard shows total users, new users this week
  4. Navigate to `/dashboard/admin/users`
  5. Search for a recently created test user
  6. Click user to view detail
  7. View user summary (orders, products, revenue)
  8. View activity log
  9. Change user role from BUYER to SELLER
  10. Verify activity log shows ROLE_CHANGE entry
  11. Navigate back to user list
  12. Select multiple users, bulk change status to INAC (suspend)
  13. Verify bulk operation success
  14. Export users as CSV
  15. Verify CSV download contains expected data
- **Expected Results**:
  - UI: Dashboard stats accurate, user management smooth
  - API: Full admin API flow: dashboard → list → detail → summary → activity → role → bulk → export
  - DB: User roles updated, TL_COMM_USE_ACTV entries created for each change
  - Server Log: Admin actions logged
- **Verification Method**: snapshot / network / db-query
- **Test Data**: Admin `admin@astratech.vn`

### E2E-006: Admin suspends seller → seller products hidden → buyer cannot purchase
- **Type**: Alternative Path
- **Priority**: High
- **Preconditions**: Active seller with products, admin logged in
- **User Journey**:
  1. Login as admin
  2. Navigate to admin users, find seller account
  3. Change seller status to INAC (suspended)
  4. Log out admin, attempt login as suspended seller
  5. Verify access denied (FirebaseAuthGuard blocks INAC users)
  6. Login as buyer
  7. Navigate to home, search for the seller's product
  8. Verify product is still visible (product status unchanged)
  9. Attempt to purchase → order should still work (seller status doesn't block purchases of existing active products)
- **Expected Results**:
  - UI: Seller cannot login, buyer can still see/buy existing products
  - API: Seller login blocked at guard level, buyer flows work normally
  - DB: User userSttsCd = 'INAC', products remain prdSttsCd = 'ACTV'
  - Server Log: Guard rejection logged for seller
- **Verification Method**: snapshot / network / server-log
- **Test Data**: Seller `seller1@yopmail.com`, admin `admin@astratech.vn`

---

## Scenario Group 4: Search → Purchase → Email Integration

### E2E-007: Search product → purchase → verify order confirmation email
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Buyer logged in, AWS SES configured
- **User Journey**:
  1. Login as buyer
  2. Type "Deluxe" in search bar
  3. Verify autocomplete suggestions appear (`GET /api/search/suggest`)
  4. Submit search
  5. Verify results page shows products tab with matches
  6. Click first product, navigate to detail
  7. Add to cart, proceed to checkout
  8. Complete order
  9. Verify order success page shows order number (VB-YYYY-MMDD-NNN format)
  10. Check server logs for email send
- **Expected Results**:
  - UI: Search → product detail → cart → checkout → success page flow
  - API: `GET /api/search/suggest` → `GET /api/search` → `POST /api/orders`
  - DB: Order created, email log entry in TL_COMM_EML_LOG with sndSttsCd='SUCC'
  - Server Log: `[MailService]` order confirmation sent, no errors
- **Verification Method**: snapshot / network / server-log
- **Test Data**: Search term "Deluxe"

### E2E-008: Guest checkout → no welcome email → order confirmation email only
- **Type**: Alternative Path
- **Priority**: High
- **Preconditions**: Not logged in, products available
- **User Journey**:
  1. Browse home page as guest (not logged in)
  2. Add product to cart
  3. Navigate to checkout
  4. Fill guest checkout form (name, email, address)
  5. Complete checkout via `POST /api/orders/checkout`
  6. Verify success page
  7. Check email logs — should have order confirmation but NOT welcome email
- **Expected Results**:
  - UI: Guest checkout flow works without login
  - API: `POST /api/orders/checkout` (no auth header)
  - DB: Order created without buyerId (guest), 1 email log entry (order confirmation only)
  - Server Log: No welcome email trigger for guest
- **Verification Method**: snapshot / network / db-query
- **Test Data**: Guest email `guest-e2e@yopmail.com`

---

## Scenario Group 5: Account Lifecycle

### E2E-009: Signup → use app → change settings → delete account → verify cleanup
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: No existing account
- **User Journey**:
  1. Sign up as buyer with `lifecycle-e2e@yopmail.com`
  2. Update profile: set nickname "LifecycleUser"
  3. Create a board post (category: FREE)
  4. Purchase a product
  5. Navigate to `/settings`
  6. Change display name to "Updated Name"
  7. Navigate to Danger Zone, click "Delete Account"
  8. Confirm deletion in modal
  9. Verify logged out and redirected to home
  10. Attempt login with same credentials
  11. Verify login blocked (account deleted)
- **Expected Results**:
  - UI: Full lifecycle from signup to deletion
  - API: Signup → profile → post → order → settings update → delete → login blocked
  - DB: User delYn='Y', userSttsCd='INAC', posts and orders remain (soft delete user only)
  - Server Log: Account deletion logged, subsequent login attempt blocked by guard
- **Verification Method**: snapshot / network / server-log
- **Test Data**: `lifecycle-e2e@yopmail.com` / `Test@1234!`

### E2E-010: Token expires during active session → auto-refresh → seamless continuation
- **Type**: Edge Case
- **Priority**: High
- **Preconditions**: User logged in, Firebase token approaching expiry
- **User Journey**:
  1. Login as buyer
  2. Browse products, add to cart
  3. Wait for Firebase ID token to approach expiry (simulate via `getIdToken(true)`)
  4. Firebase SDK auto-refreshes token via `onIdTokenChanged`
  5. Continue browsing — click "Load More" on product list
  6. Navigate to `/dashboard/orders`
  7. Verify all API calls succeed with refreshed token
  8. No login prompt or session interruption
- **Expected Results**:
  - UI: No visible interruption, no login redirect
  - API: All requests succeed, Authorization header contains refreshed token
  - DB: No changes to user record
  - Server Log: Token verification succeeds with new token
- **Verification Method**: network / server-log
- **Test Data**: Any authenticated user

---

## Scenario Group 6: Board + Product Integration

### E2E-011: Write product review → verify in board → search finds it
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Buyer logged in, has purchased a product
- **User Journey**:
  1. Login as buyer
  2. Navigate to `/dashboard/board/create`
  3. Create post: category REVIEW, title "Amazing Ceramic Bowl - Must Buy!", content with product reference
  4. Verify post appears in board list
  5. Navigate to home page search bar
  6. Search for "Amazing Ceramic Bowl"
  7. Verify search results show the review post in Posts tab
  8. Click on the post from search results
  9. Verify post detail page loads correctly
- **Expected Results**:
  - UI: Post created and findable via global search
  - API: `POST /api/posts` → `GET /api/search?q=Amazing Ceramic Bowl`
  - DB: TB_COMM_BOARD_POST created, search returns post via title/content matching
  - Server Log: No errors
- **Verification Method**: snapshot / network
- **Test Data**: Post title "Amazing Ceramic Bowl - Must Buy!"

### E2E-012: Admin manages board + user simultaneously
- **Type**: Alternative Path
- **Priority**: Medium
- **Preconditions**: Admin logged in, posts and users exist
- **User Journey**:
  1. Login as admin
  2. Navigate to board, create a NOTICE post (admin-only category)
  3. Verify NOTICE post appears at top (pinned first)
  4. Navigate to `/dashboard/admin/users`
  5. Find a user who created posts
  6. View user detail and summary
  7. Navigate back to board, delete an inappropriate post (admin override)
  8. Verify post soft-deleted
- **Expected Results**:
  - UI: Admin can switch between board management and user management
  - API: `POST /api/posts` (NOTICE) → `GET /api/admin/users` → `DELETE /api/posts/:id`
  - DB: NOTICE post created, target post delYn='Y'
  - Server Log: No errors
- **Verification Method**: snapshot / network
- **Test Data**: Admin `admin@astratech.vn`

---

## Summary

| Type | Count |
|------|-------|
| Happy Path | 7 |
| Alternative Path | 3 |
| Edge Case | 2 |
| Error Path | 0 |
| **Total** | **12** |

### Priority Distribution

| Priority | Count |
|----------|-------|
| Critical | 3 |
| High | 6 |
| Medium | 3 |
| **Total** | **12** |
