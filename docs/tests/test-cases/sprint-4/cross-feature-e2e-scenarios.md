# Cross-Feature — E2E Test Scenarios (Sprint 4)

> End-to-end user journey scenarios that span multiple features (Product, Order, Admin) to verify integration between modules and full user workflows.

---

## Scenarios

### E2E-CROSS-001: Buyer full journey — signup to order delivery

- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Fresh browser session; at least 3 active products with stock available; a seller account exists to fulfill orders
- **User Journey**:
  1. Navigate to `/` (homepage)
  2. Click "Sign Up" button in the top bar
  3. Complete signup form with email, name, password; role defaults to BUYER
  4. After signup, observe logged-in state: "Welcome, {name}!" in top bar
  5. Browse products on homepage; use category filter to select "Ceramics & Pottery"
  6. Click on a product card (redirects to `/dashboard/products/:id` since logged in)
  7. On product detail page, click "Add to Cart" button
  8. Navigate to another product, add to cart
  9. Click the cart icon in the header; navigate to `/dashboard/cart`
  10. Verify 2 items in cart with correct quantities and prices
  11. Click "Checkout" button; fill shipping info in checkout modal
  12. Click "Place Order"; observe order created successfully
  13. Cart is cleared; navigate to `/dashboard/orders`
  14. Verify the new order appears with "Pending" status
  15. Click the order card; observe detail modal with items and status timeline
  16. **Seller fulfills**: Seller logs in, navigates to `/dashboard/orders/sales`, marks order as "Shipped"
  17. Buyer returns to `/dashboard/orders`; order now shows "Shipped" status
  18. Seller marks order as "Delivered"
  19. Buyer sees order with "Delivered" status and full progress bar completed
- **Expected Results**:
  - UI: Seamless flow from signup through product browsing, cart, checkout, order tracking, and delivery confirmation
  - API: `POST /api/auth/signup` (201) -> `GET /api/products` (200) -> `GET /api/products/:id` (200) -> `POST /api/orders` (201) -> `GET /api/orders` (200) -> `GET /api/orders/:id` (200) -> `PATCH /api/orders/:id/status` (200, SHIPPED) -> `PATCH /api/orders/:id/status` (200, DELIVERED)
  - DB: User created in `TB_COMM_USER`; order in `TB_COMM_ORDR` progresses through PENDING -> SHIPPED -> DELIVERED; stock decremented in `TB_PROD_PRD`; 3 entries in `TH_COMM_ORDR_STTS`
- **Verification Method**: network + db-query + snapshot
- **Test Data**: New buyer email; seller credentials; 2 active products with stock >= 2

---

### E2E-CROSS-002: Seller full journey — login to product registration to order fulfillment

- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Seller account exists; at least 1 pending order with items from this seller
- **User Journey**:
  1. Navigate to `/` (homepage)
  2. Click "Sign In" in the top bar
  3. Log in with seller credentials
  4. Observe seller-specific UI: "My Products" and "+ Add Product" buttons visible on `/dashboard/products`
  5. Navigate to `/dashboard/products/create`
  6. Fill in product form: name "Artisan Ceramic Mug", price $35, category CERAMICS, stock 50
  7. Click "Create Product"; redirected to `/dashboard/products`
  8. Verify the new product appears in the product listing
  9. Navigate to `/dashboard/products/my`
  10. Verify the new product appears in "My Products" list with "Active" status
  11. Navigate to `/dashboard/orders` (redirects sellers with "Go to Sales Dashboard" link)
  12. Click "Go to Sales Dashboard"; arrive at `/dashboard/orders/sales`
  13. Observe revenue summary cards (Total Revenue, Total Orders)
  14. Find a pending sale card
  15. Click "Mark Shipped" button; status updates to "Shipped"
  16. Click "Mark Delivered" on the now-shipped order; status updates to "Delivered"
  17. Observe revenue summary updates to reflect the delivered order
- **Expected Results**:
  - UI: Seller sees all seller-specific UI elements; product creation flow works; sales dashboard shows accurate data; status updates are reflected immediately
  - API: `POST /api/auth/login` -> `POST /api/products` (201) -> `GET /api/products/my` (200) -> `GET /api/orders/sales` (200) -> `GET /api/orders/sales/summary` (200) -> `PATCH /api/orders/:id/status` (200, SHIPPED) -> `PATCH /api/orders/:id/status` (200, DELIVERED)
  - DB: Product created in `TB_PROD_PRD`; order status progresses in `TB_COMM_ORDR`; history entries added to `TH_COMM_ORDR_STTS`
- **Verification Method**: network + db-query + snapshot
- **Test Data**: Seller credentials; pending order containing seller's products

---

### E2E-CROSS-003: Admin full journey — dashboard to user management to role change impact

- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: SUPER_ADMIN account; at least 1 BUYER user and 1 SELLER user exist; recent activity in the system
- **User Journey**:
  1. Navigate to `/` and log in as SUPER_ADMIN
  2. Navigate to `/dashboard/admin`
  3. Review dashboard stats: total users, new users this week, role distribution
  4. Click "Manage Users" to go to `/dashboard/admin/users`
  5. Search for a buyer user by name
  6. Change the buyer's role to SELLER
  7. Verify the role badge updates
  8. View the user's activity log; confirm ROLE_CHANGE activity entry appears
  9. Reset the user's password to "TempPassword123!"
  10. Navigate back to `/dashboard/admin`
  11. Verify "Recent Activity" section shows the role change and password reset activities
  12. Log out; log in as the now-SELLER user with the new password
  13. Navigate to `/dashboard/products`; verify seller UI elements are visible (My Products, Add Product)
  14. Navigate to `/dashboard/orders`; verify seller redirect to sales dashboard
- **Expected Results**:
  - UI: Admin dashboard reflects changes in real-time; role change takes effect immediately for the target user; password reset works; seller UI unlocked after role change
  - API: `GET /api/admin/dashboard` -> `GET /api/admin/users?search=...` -> `PATCH /api/admin/users/:id/role` (200) -> `GET /api/admin/users/:id/activity` -> `PATCH /api/admin/users/:id/password` (200) -> `POST /api/auth/login` (200 with new password and SELLER role)
  - DB: `USE_ROLE_CD` changed to SELLER; password hash updated; 2+ activity log entries in `TL_COMM_USE_ACTV`
- **Verification Method**: network + db-query + manual login
- **Test Data**: SUPER_ADMIN credentials; buyer user to be promoted; new temporary password

---

### E2E-CROSS-004: Buyer order cancellation restores product stock for other buyers

- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Product has `STCK_QTY = 5`; Buyer A creates an order for 4 units (stock becomes 1); Buyer B wants to order 3 units
- **User Journey**:
  1. Buyer A logs in and creates an order for 4 units of the product
  2. Verify product stock is now 1 (visible on product detail or via API)
  3. Buyer B logs in and attempts to order 3 units of the same product
  4. Buyer B receives INSUFFICIENT_STOCK error (only 1 available)
  5. Buyer A navigates to `/dashboard/orders`, opens the PENDING order detail
  6. Buyer A clicks "Cancel Order" and confirms
  7. Verify product stock is restored to 5
  8. Buyer B retries the order for 3 units
  9. Order is created successfully; stock is now 2
- **Expected Results**:
  - UI: Buyer B initially gets error; after Buyer A cancels, Buyer B can order successfully
  - API: `POST /api/orders` (201 for A) -> `POST /api/orders` (400 for B) -> `PATCH /api/orders/:id/status` (200, CANCELLED) -> `POST /api/orders` (201 for B)
  - DB: Product stock: 5 -> 1 -> 5 -> 2; Buyer A's order CANCELLED with stock restore; Buyer B's order PENDING
- **Verification Method**: network + db-query
- **Test Data**: Product with stock = 5; two buyer accounts

---

### E2E-CROSS-005: Admin suspends seller and verifies product/order impact

- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: SUPER_ADMIN account; seller has active products and pending orders
- **User Journey**:
  1. Admin logs in and navigates to `/dashboard/admin/users`
  2. Admin finds the seller and clicks "Suspend"
  3. Confirm the suspension
  4. Verify seller's status changes to "Suspended"
  5. Open new browser session; attempt to log in as the suspended seller
  6. Login fails with "Account suspended" error
  7. Navigate to `/dashboard/products` as a buyer
  8. Verify the seller's products are still visible to buyers (products remain active unless explicitly hidden)
  9. Buyer places an order for the seller's product
  10. Order is created successfully (product still available)
  11. Admin reactivates the seller
  12. Seller can now log in again
- **Expected Results**:
  - UI: Seller cannot log in while suspended; products remain visible; orders can still be placed; seller can log in after reactivation
  - API: `PATCH /api/admin/users/:id/status` (200, SUSP) -> `POST /api/auth/login` (401/403 for suspended seller) -> `POST /api/orders` (201, buyer can still order) -> `PATCH /api/admin/users/:id/status` (200, ACTV)
  - DB: `USE_STTS_CD` changes ACTV -> SUSP -> ACTV; activity log entries for both status changes
- **Verification Method**: network + db-query + manual login
- **Test Data**: Admin credentials; seller credentials; seller's active products; buyer credentials

---

### E2E-CROSS-006: Product visibility across homepage and dashboard

- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Multiple active products exist; user is not logged in initially
- **User Journey**:
  1. Navigate to `/` (homepage) without logging in
  2. Observe products displayed in the product grid
  3. Browse categories using the category navigation bar
  4. Observe Flash Deals section showing sale products (if any)
  5. Click on a product card; since not logged in, login modal opens
  6. Complete login as a buyer
  7. Click the same product card; now navigates to `/dashboard/products/:id`
  8. View product detail page
  9. Navigate to `/dashboard/products` via dashboard sidebar
  10. Verify the same products appear in the dashboard product listing
  11. Search for a product by name on both homepage and dashboard listing
  12. Verify search results are consistent between both pages
- **Expected Results**:
  - UI: Homepage and dashboard product listing show the same active products; unauthenticated users see login modal on product click; authenticated users navigate to detail page
  - API: `GET /api/products` (public, no auth) returns same products as authenticated requests (both filter on ACTV status)
  - DB: Same query on `TB_PROD_PRD` with `PRD_STTS_CD = "ACTV"` and `DEL_YN = "N"`
- **Verification Method**: snapshot + network
- **Test Data**: Active products; buyer credentials

---

### E2E-CROSS-007: Seller manages products and tracks revenue impact from orders

- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Seller has 3 active products; buyer exists
- **User Journey**:
  1. Seller logs in and checks revenue summary at `/dashboard/orders/sales` (note initial revenue)
  2. Buyer logs in and places an order containing 2 of the seller's products (total $150)
  3. Seller navigates to `/dashboard/orders/sales`
  4. Verify a new pending sale appears in the list
  5. Seller marks the order as "Shipped" then "Delivered"
  6. Revenue summary updates: total revenue increases by $150; total orders increments
  7. Seller navigates to `/dashboard/products/my`
  8. Verify stock quantities have decreased for the 2 ordered products
  9. Seller edits one product, changing its price
  10. Buyer views the same product; sees the updated price
  11. Buyer places a new order; order uses the NEW price (not the old price)
  12. The previous order's items still show the OLD price (snapshot immutability)
- **Expected Results**:
  - UI: Revenue updates after delivery; stock decreases after order; price change reflects in new orders but not old ones
  - API: Order items store snapshot prices (`UNIT_PRC` at order time)
  - DB: `TB_COMM_ORDR_ITEM.UNIT_PRC` is immutable per order; new orders use current `TB_PROD_PRD.PRD_PRC`
- **Verification Method**: network + db-query
- **Test Data**: Seller with products; buyer placing multiple orders; price change between orders

---

### E2E-CROSS-008: Admin bulk export after role changes and user management

- **Type**: Alternative Path
- **Priority**: Medium
- **Preconditions**: SUPER_ADMIN logged in; users exist with various roles; some recent role changes have been made
- **User Journey**:
  1. Admin navigates to `/dashboard/admin/users`
  2. Admin changes 2 buyers to sellers
  3. Admin suspends 1 user
  4. Admin filters by "SELLER" role
  5. Admin clicks "Export CSV"
  6. Verify downloaded CSV includes the 2 newly promoted sellers
  7. Admin filters by "Suspended" status
  8. Admin clicks "Export CSV"
  9. Verify CSV includes the suspended user
  10. Admin navigates to `/dashboard/admin`
  11. Dashboard stats reflect: role distribution updated; recent activity shows role changes and status change
- **Expected Results**:
  - UI: CSV downloads reflect current filters; dashboard analytics are up-to-date with recent changes
  - API: Role/status changes -> `GET /api/admin/users/export?role=SELLER` returns updated CSV -> `GET /api/admin/dashboard` reflects changes
  - DB: All changes reflected in `TB_COMM_USER` and `TL_COMM_USE_ACTV`; CSV generated from same query as list endpoint
- **Verification Method**: network + file inspection + snapshot
- **Test Data**: Users to promote/suspend; admin credentials

---

## Summary

| Type | Count |
|------|-------|
| Happy Path | 7 |
| Alternative Path | 1 |
| Edge Case | 0 |
| Error Path | 0 |
| **Total** | **8** |
