# Cross-Feature E2E Test Scenarios — Sprint 10

## Overview
- **Feature**: End-to-end user journeys spanning multiple features across the entire platform
- **Related Modules**: Auth (Firebase), Product, Order, Board, Search, Admin, Settings
- **Purpose**: Verify integration between all modules in realistic user workflows that represent real-world usage patterns
- **Production Frontend**: https://demo-vibe-production.up.railway.app
- **Production Backend**: https://demo-vibe-backend-production.up.railway.app
- **Auth Flow**: Firebase client SDK login -> Bearer token -> NestJS Auth Guard -> Firebase Admin SDK verification

### Test Accounts
| Account | Email | Password | Role |
|---------|-------|----------|------|
| Admin | admin@astratech.vn | Admin@123 | SUPER_ADMIN |
| Seller | seller1000@yopmail.com | Seller1000@123 | SELLER |
| Buyer | (create per test run) | TestBuyer@123 | BUYER |

---

## Scenario Group 1: New Seller Onboarding

### E2E-001: Full seller onboarding — signup to product visible on homepage
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Server running, no existing account with test email
- **User Journey**:
  1. Navigate to https://demo-vibe-production.up.railway.app/auth/signup
  2. Fill Full Name: "New Seller Sprint10"
  3. Fill Email: testseller-e2e-{timestamp}@yopmail.com
  4. Fill Password: "TestSeller@123"
  5. Select "Seller" role radio button
  6. Click "Create Account"
  7. Verify redirect to dashboard with seller-specific menu (My Products, Sales)
  8. Navigate to /dashboard/products/create
  9. Fill product form:
     - Name: "Handmade Ceramic Vase"
     - Description: "Beautiful handcrafted ceramic vase"
     - Price: 45000
     - Category: "Ceramics & Pottery"
     - Stock: 50
  10. Upload product image (if supported)
  11. Click "Create Product" / Submit
  12. Verify redirect to /dashboard/products/my with new product in list
  13. Verify product status is ACTIVE (or activate if needed)
  14. Open a new incognito/guest browser tab
  15. Navigate to homepage https://demo-vibe-production.up.railway.app
  16. Browse products or search for "Handmade Ceramic Vase"
  17. Verify the newly created product appears in the listing
  18. Click on the product and verify detail page renders correctly with all entered info
- **Expected Results**:
  - Auth: User created with SELLER role, Firebase UID linked
  - Product: Product created with correct name, price, category, stock
  - Homepage: Product visible to unauthenticated users within the product listing
  - API: POST /api/products returns 201, GET /api/products returns the new product
  - DB: TB_PROD_PRD record created with seller's user ID, DEL_YN="N"
- **Verification Method**: snapshot / network / console

### E2E-002: Seller onboarding — product with DRAFT status not visible to public
- **Type**: Alternative Path
- **Priority**: High
- **Preconditions**: Logged in as seller
- **User Journey**:
  1. Navigate to /dashboard/products/create
  2. Create product with status DRAFT (if status selection available)
  3. Verify product in /dashboard/products/my with DRAFT status
  4. Open guest browser, navigate to homepage
  5. Search for the draft product name
  6. Verify draft product does NOT appear in public results
- **Expected Results**:
  - Product: Draft product only visible to the seller in their dashboard
  - Homepage: Draft products filtered out from public listing
- **Verification Method**: snapshot / network

---

## Scenario Group 2: Full Purchase Flow

### E2E-003: Complete purchase — browse to order fulfillment
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as buyer, seller has active products, seller account available
- **User Journey**:
  1. Login as buyer at /auth/login
  2. Navigate to homepage, verify products are displayed
  3. Browse product listings, click on a product card
  4. Verify product detail page (name, price, description, stock, seller info)
  5. Click "Add to Cart"
  6. Verify toast/notification confirming item added
  7. Navigate to /dashboard/cart
  8. Verify cart shows the added item with correct price and quantity
  9. Adjust quantity to 2
  10. Verify subtotal updates (price x 2)
  11. Click "Proceed to Checkout"
  12. Fill shipping information:
      - Address: "123 Test Street, District 1, HCMC"
      - Phone: "0901234567"
  13. Select payment method
  14. Click "Place Order" / Submit
  15. Verify order confirmation page with order number
  16. Navigate to /dashboard/orders, verify order in list with PENDING status
  17. Logout, login as seller (seller1000@yopmail.com / Seller1000@123)
  18. Navigate to /dashboard/orders/sales
  19. Find the new order, verify buyer info and items
  20. Click "Confirm Payment" (update status to CONFIRMED)
  21. Verify order status changes to CONFIRMED
  22. Click "Ship Order" (update status to SHIPPED)
  23. Verify order status changes to SHIPPED
  24. Logout, login as buyer again
  25. Navigate to /dashboard/orders
  26. Verify order status shows SHIPPED
  27. (If available) Click "Confirm Received" to mark as DELIVERED
- **Expected Results**:
  - Cart: Item added, quantity updated, subtotal calculated correctly
  - Order: Created with PENDING status, progresses through CONFIRMED -> SHIPPED -> DELIVERED
  - Seller: Order appears in sales dashboard with correct details
  - Buyer: Order history reflects all status transitions
  - API: POST /api/orders (201), PATCH /api/orders/:id/status (200) for each transition
  - DB: TB_COMM_ORDR created, TH_COMM_ORDR_STTS entries for each status change
- **Verification Method**: snapshot / network / console

### E2E-004: Purchase flow — empty cart checkout prevention
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Logged in as buyer, cart is empty
- **User Journey**:
  1. Navigate to /dashboard/cart
  2. Verify cart is empty (shows empty state message)
  3. Attempt to navigate directly to checkout URL
  4. Verify system prevents checkout with empty cart (redirect or error)
- **Expected Results**:
  - UI: Empty cart message displayed, no checkout button or checkout blocked
  - No order created in DB
- **Verification Method**: snapshot / network

### E2E-005: Purchase flow — out-of-stock product handling
- **Type**: Edge Case
- **Priority**: High
- **Preconditions**: Product exists with stock = 0 or very low stock
- **User Journey**:
  1. Navigate to a product with 0 stock
  2. Verify "Add to Cart" button is disabled or shows "Out of Stock"
  3. Attempt to add via direct API call: POST /api/cart with the product ID
  4. Verify API returns appropriate error (400 or 409)
- **Expected Results**:
  - UI: Out-of-stock products cannot be added to cart
  - API: Server-side validation prevents adding unavailable items
- **Verification Method**: snapshot / network

---

## Scenario Group 3: Marketplace Discovery

### E2E-006: Search-driven purchase — keyword search to checkout
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as buyer, products exist in DB
- **User Journey**:
  1. Navigate to homepage
  2. Click on search bar, type "ceramic"
  3. Submit search
  4. Verify search results page loads with matching products
  5. Verify result count is displayed
  6. Apply category filter: "Ceramics & Pottery"
  7. Verify results narrow to the selected category
  8. Sort by price (low to high) if available
  9. Verify products reorder by price
  10. Click on the first product in results
  11. Verify product detail page loads with full information
  12. Click "Add to Cart"
  13. Navigate to /dashboard/cart
  14. Proceed to checkout
  15. Complete order with shipping info and payment
  16. Verify order confirmation
- **Expected Results**:
  - Search: Returns relevant products matching "ceramic"
  - Filter: Category filter narrows results correctly
  - Sort: Price sorting works as expected
  - Cart: Product from search results added successfully
  - Order: Checkout completes from search-discovered product
  - API: GET /api/search?q=ceramic returns results, GET /api/products/:id loads detail
- **Verification Method**: snapshot / network

### E2E-007: Cross-entity search — products and posts
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Products and board posts exist with matching keywords
- **User Journey**:
  1. Login as buyer
  2. Create a board post with title containing "ceramic tips"
  3. Navigate to homepage search
  4. Search for "ceramic"
  5. Verify search results include both products AND board posts (if cross-entity search is supported)
  6. Click on a product result, verify product detail page
  7. Go back to search results
  8. Click on a board post result, verify post detail page
- **Expected Results**:
  - Search: Returns results from multiple entity types
  - Navigation: Clicking results navigates to the correct detail page per entity type
- **Verification Method**: snapshot / network

### E2E-008: Search with no results — graceful handling
- **Type**: Alternative Path
- **Priority**: Medium
- **Preconditions**: Logged in
- **User Journey**:
  1. Search for "xyznonexistent12345"
  2. Verify empty state UI (no results message, possibly suggestions)
  3. Verify no errors in console
  4. Verify search bar retains the query for easy editing
- **Expected Results**:
  - UI: Friendly "no results found" message, no broken layout
  - Console: No errors
- **Verification Method**: snapshot / console

---

## Scenario Group 4: Community Engagement

### E2E-009: Full community workflow — post, comment, search discovery
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Two user accounts (User A: buyer, User B: another buyer or seller)
- **User Journey**:
  1. Login as User A
  2. Navigate to /dashboard/board
  3. Click "Create Post" / "New Post"
  4. Fill title: "Best ceramic care tips for beginners"
  5. Fill content: "Here are my top 5 tips for maintaining ceramic products..."
  6. Submit post
  7. Verify post appears in the board list with correct title and author
  8. Copy the post URL/ID
  9. Logout
  10. Login as User B
  11. Navigate to /dashboard/board
  12. Find User A's post in the list (or navigate directly)
  13. Click on the post to view detail
  14. Verify post content renders correctly with author info
  15. Scroll to comments section
  16. Type comment: "Great tips! I also recommend using a soft cloth."
  17. Submit comment
  18. Verify comment appears with User B's name and timestamp
  19. Navigate to homepage search
  20. Search for "ceramic care tips"
  21. Verify the board post appears in search results
  22. Click search result, verify navigates to the post detail
- **Expected Results**:
  - Board: Post created by User A, visible to User B
  - Comments: User B's comment appears on User A's post
  - Auth: Author names correctly displayed on post and comment
  - Search: Board posts indexed and searchable
  - API: POST /api/board/posts (201), POST /api/board/posts/:id/comments (201), GET /api/search
  - DB: TB_COMM_BOARD_POST record, TB_COMM_BOARD_CMNT linked to post
- **Verification Method**: snapshot / network

### E2E-010: Board post with like interaction
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Board post exists, logged in as different user than post author
- **User Journey**:
  1. Login as User B
  2. Navigate to a post created by User A
  3. Click "Like" button
  4. Verify like count increments
  5. Click "Like" again (unlike)
  6. Verify like count decrements
  7. Refresh page, verify like state persists correctly
- **Expected Results**:
  - Board: Like toggle works, count updates in real-time
  - DB: TR_COMM_BOARD_LIKE record created/deleted
- **Verification Method**: snapshot / network

### E2E-011: Guest user cannot post or comment
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Not logged in (guest)
- **User Journey**:
  1. Navigate to /dashboard/board (without login)
  2. Verify redirect to login page OR board is view-only
  3. Attempt to access /dashboard/board/create directly
  4. Verify redirect to login or access denied
  5. Attempt API: POST /api/board/posts without Bearer token
  6. Verify 401 Unauthorized response
- **Expected Results**:
  - Auth: Unauthenticated users cannot create posts or comments
  - API: Returns 401 for unauthenticated requests
- **Verification Method**: snapshot / network

---

## Scenario Group 5: Admin Platform Management

### E2E-012: Admin full dashboard — statistics, users, products, data management
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as SUPER_ADMIN (admin@astratech.vn / Admin@123)
- **User Journey**:
  1. Login as admin at /auth/login
  2. Navigate to /dashboard/admin
  3. Verify admin dashboard loads with statistics:
     - Total users count
     - Total products count
     - Total orders count
     - Recent activity summary
  4. Navigate to /dashboard/admin/users
  5. Verify user list loads with columns: name, email, role, status, created date
  6. Filter users by role: SELLER
  7. Verify list shows only sellers
  8. Click on a seller row to view detail
  9. Verify user detail shows: profile info, activity log, associated products
  10. Change user role from SELLER to BUYER
  11. Verify confirmation dialog appears
  12. Confirm role change
  13. Verify role updated in the user detail view
  14. Navigate back to user list, verify the user now shows BUYER role
  15. Navigate to /dashboard/admin/products (if available)
  16. Verify product management list with all products
  17. Filter by status (ACTIVE, DRAFT, etc.)
  18. Click on a product to view/edit
  19. Verify admin can modify product details
  20. Navigate to data export (if available), trigger export
  21. Verify export file downloads or generates
- **Expected Results**:
  - Dashboard: Statistics render with correct counts
  - Users: CRUD operations on users work, role changes persist
  - Products: Admin can view and manage all products across sellers
  - API: GET /api/admin/stats, GET /api/admin/users, PATCH /api/admin/users/:id/role
  - DB: User role updated in TB_COMM_USER, TL_COMM_USE_ACTV logs admin action
- **Verification Method**: snapshot / network / console

### E2E-013: Admin user deactivation and its cascading effects
- **Type**: Alternative Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN, target seller has active products
- **User Journey**:
  1. Navigate to /dashboard/admin/users
  2. Find a seller with active products
  3. Deactivate/soft-delete the seller account (if feature exists)
  4. Navigate to public homepage
  5. Search for the deactivated seller's products
  6. Verify products are no longer visible to public (or marked as unavailable)
  7. Attempt to login as the deactivated seller
  8. Verify login fails or shows account deactivated message
- **Expected Results**:
  - Admin: Seller account deactivated
  - Products: Seller's products hidden from public listing
  - Auth: Deactivated user cannot login
  - DB: TB_COMM_USER.DEL_YN="Y", associated products filtered out
- **Verification Method**: snapshot / network

---

## Scenario Group 6: Seller Business Cycle

### E2E-014: Seller daily operations — product management and order fulfillment
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as seller with existing products and pending orders
- **User Journey**:
  1. Login as seller (seller1000@yopmail.com / Seller1000@123)
  2. Navigate to /dashboard (seller dashboard)
  3. Verify dashboard shows:
     - Total products count
     - Pending orders count
     - Revenue summary (if available)
  4. Navigate to /dashboard/products/my
  5. Verify product list with status, price, stock columns
  6. Click "Edit" on a product
  7. Update price from 45000 to 50000
  8. Save changes
  9. Verify price updated in product list
  10. Navigate to /dashboard/orders/sales
  11. Find a PENDING order
  12. View order details (buyer info, items, total)
  13. Click "Confirm Payment"
  14. Verify status changes to CONFIRMED
  15. Click "Ship Order"
  16. Verify status changes to SHIPPED
  17. Navigate back to dashboard
  18. Verify pending orders count decreased by 1
- **Expected Results**:
  - Dashboard: Statistics reflect current state accurately
  - Product: Price update persists and visible to buyers
  - Order: Status transitions work correctly for seller
  - API: PATCH /api/products/:id (200), PATCH /api/orders/:id/status (200)
- **Verification Method**: snapshot / network

### E2E-015: Seller creates product with all optional fields
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in as seller
- **User Journey**:
  1. Navigate to /dashboard/products/create
  2. Fill all fields:
     - Name: "Premium Handwoven Basket"
     - Description: "Artisan basket with intricate patterns"
     - Price: 75000
     - Category: select appropriate category
     - Stock: 25
     - Images: upload multiple images (if supported)
     - Tags/keywords (if supported)
  3. Submit product
  4. Navigate to the product detail page
  5. Verify all fields display correctly
  6. Open guest browser and navigate to the product
  7. Verify all information renders on public product page
- **Expected Results**:
  - Product: All fields saved and displayed correctly
  - Images: Multiple images render in gallery/carousel
  - Public: Full product detail visible to guests
- **Verification Method**: snapshot / network

### E2E-016: Seller cannot access buyer-only or admin pages
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Logged in as SELLER
- **User Journey**:
  1. Login as seller
  2. Attempt to navigate to /dashboard/admin
  3. Verify redirect to dashboard or 403 Forbidden page
  4. Attempt to navigate to /dashboard/admin/users
  5. Verify access denied
  6. Attempt API: GET /api/admin/users with seller's token
  7. Verify 403 response
- **Expected Results**:
  - UI: Seller cannot access admin pages
  - API: Admin endpoints return 403 for non-admin roles
  - Navigation: Admin menu items not visible in seller sidebar
- **Verification Method**: snapshot / network

---

## Scenario Group 7: Account Lifecycle

### E2E-017: Full account lifecycle — signup to deletion with data cleanup
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Server running
- **User Journey**:
  1. Navigate to /auth/signup
  2. Create new buyer account: lifecycle-test-{timestamp}@yopmail.com / LifeCycle@123
  3. Verify login successful, dashboard loads
  4. Create a board post: "Lifecycle test post"
  5. Navigate to homepage, add a product to cart
  6. Navigate to /settings (or /dashboard/settings)
  7. Update display name to "Updated Lifecycle User"
  8. Verify name change reflected in UI (top bar, settings page)
  9. Verify API: GET /api/auth/me returns updated name
  10. Navigate to account deletion section in settings
  11. Click "Delete Account"
  12. Verify confirmation dialog with warning about data loss
  13. Confirm deletion
  14. Verify redirect to homepage or login page
  15. Attempt to login with the deleted account's email
  16. Verify login fails (account not found or deactivated)
  17. Verify API: GET /api/auth/me with old token returns 401 or 404
  18. Search for the user's board post
  19. Verify post is either removed or shows "[Deleted User]" as author
- **Expected Results**:
  - Auth: Account created, settings updated, then soft-deleted
  - Board: User's posts handled appropriately after deletion
  - Cart: Cart data cleaned up
  - DB: TB_COMM_USER.DEL_YN="Y", associated data soft-deleted or anonymized
  - Firebase: User record deleted or disabled
- **Verification Method**: snapshot / network / console

### E2E-018: Account settings — profile update persists across sessions
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in as buyer
- **User Journey**:
  1. Navigate to /settings
  2. Update display name to "Profile Test User"
  3. Save changes
  4. Verify success toast/notification
  5. Logout
  6. Login again with same credentials
  7. Navigate to /settings
  8. Verify display name still shows "Profile Test User"
  9. Navigate to /dashboard/board, create a post
  10. Verify post author shows "Profile Test User"
- **Expected Results**:
  - Settings: Profile changes persist across sessions
  - Auth: Updated profile reflected everywhere the user's name appears
  - DB: TB_COMM_USER updated, MDFCN_DT reflects change time
- **Verification Method**: snapshot / network

### E2E-019: Account reactivation attempt after deletion
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: Previously deleted account
- **User Journey**:
  1. Attempt to sign up with the same email as a deleted account
  2. Verify behavior:
     - Option A: System allows re-signup (new account)
     - Option B: System blocks with "email already exists" from Firebase
  3. Document actual behavior for product decision
- **Expected Results**:
  - System handles re-signup of deleted email gracefully
  - No server errors (500) regardless of outcome
  - Console: No unhandled exceptions
- **Verification Method**: snapshot / network / console

---

## Scenario Group 8: Role-based Access Control

### E2E-020: Guest (unauthenticated) access control
- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: Not logged in
- **User Journey**:
  1. Navigate to homepage — verify accessible (public)
  2. Browse product listing — verify accessible (public)
  3. View product detail — verify accessible (public)
  4. Navigate to /dashboard — verify redirect to /auth/login
  5. Navigate to /dashboard/cart — verify redirect to /auth/login
  6. Navigate to /dashboard/orders — verify redirect to /auth/login
  7. Navigate to /dashboard/board — verify redirect to /auth/login or read-only
  8. Navigate to /dashboard/admin — verify redirect to /auth/login
  9. Navigate to /settings — verify redirect to /auth/login
  10. Attempt API: GET /api/auth/me (no token) — verify 401
  11. Attempt API: POST /api/orders (no token) — verify 401
  12. Attempt API: POST /api/products (no token) — verify 401
  13. Attempt API: POST /api/board/posts (no token) — verify 401
- **Expected Results**:
  - Public pages: Homepage, product listing, product detail accessible
  - Protected pages: All /dashboard/* and /settings redirected to login
  - API: All mutation endpoints return 401 without token
- **Verification Method**: snapshot / network

### E2E-021: Buyer accessing seller-only pages
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Logged in as BUYER
- **User Journey**:
  1. Login as buyer
  2. Navigate to /dashboard/products/create — verify access denied or redirect
  3. Navigate to /dashboard/products/my — verify access denied or redirect
  4. Navigate to /dashboard/orders/sales — verify access denied or redirect
  5. Navigate to /dashboard/admin — verify access denied or redirect
  6. Attempt API: POST /api/products with buyer's token — verify 403
  7. Attempt API: GET /api/admin/users with buyer's token — verify 403
  8. Verify buyer CAN access: /dashboard, /dashboard/cart, /dashboard/orders, /dashboard/board
- **Expected Results**:
  - Seller pages: Buyer cannot access product creation or sales management
  - Admin pages: Buyer cannot access admin dashboard
  - Buyer pages: Cart, orders (purchase), board all accessible
  - API: Returns 403 Forbidden for role-restricted endpoints
  - UI: Seller/admin menu items not visible in buyer's sidebar navigation
- **Verification Method**: snapshot / network

### E2E-022: Seller accessing admin-only pages
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Logged in as SELLER
- **User Journey**:
  1. Login as seller
  2. Navigate to /dashboard/admin — verify access denied or redirect
  3. Navigate to /dashboard/admin/users — verify access denied or redirect
  4. Navigate to /dashboard/admin/products — verify access denied or redirect
  5. Attempt API: GET /api/admin/stats with seller's token — verify 403
  6. Attempt API: PATCH /api/admin/users/:id/role with seller's token — verify 403
  7. Verify seller CAN access: /dashboard, /dashboard/products/my, /dashboard/products/create, /dashboard/orders/sales
- **Expected Results**:
  - Admin pages: Seller cannot access any admin endpoints or pages
  - Seller pages: Product management and sales accessible
  - API: Admin endpoints return 403 for SELLER role
- **Verification Method**: snapshot / network

### E2E-023: Role escalation via direct API manipulation
- **Type**: Security / Edge Case
- **Priority**: Critical
- **Preconditions**: Logged in as BUYER
- **User Journey**:
  1. Login as buyer, capture Bearer token
  2. Attempt API: PATCH /api/auth/role with body { role: "SUPER_ADMIN" }
  3. Verify response: should reject escalation to SUPER_ADMIN (403 or validation error)
  4. Attempt API: PATCH /api/auth/role with body { role: "SELLER" }
  5. Verify behavior: either allowed (role change via settings) or restricted based on business rules
  6. If SUPER_ADMIN role change was somehow accepted, verify by calling GET /api/admin/stats
  7. Confirm admin endpoints still return 403 (role change to admin should be impossible via self-service)
- **Expected Results**:
  - Security: Users cannot self-escalate to SUPER_ADMIN
  - API: Role change to SUPER_ADMIN blocked server-side
  - Validation: Only valid role transitions permitted
- **Verification Method**: network / console

### E2E-024: Expired/invalid token handling across features
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Valid user account, manipulated/expired token
- **User Journey**:
  1. Login as buyer, capture valid Bearer token
  2. Logout (clearing session)
  3. Attempt API calls with the old token:
     - GET /api/auth/me
     - POST /api/orders
     - POST /api/board/posts
  4. If token is still valid (Firebase tokens expire after 1 hour):
     - Wait for expiry or use a manually crafted expired token
  5. Verify all endpoints return 401 Unauthorized
  6. Navigate to /dashboard with expired session
  7. Verify redirect to /auth/login
  8. Login again, verify new token works for all endpoints
- **Expected Results**:
  - Auth: Expired tokens consistently rejected across all endpoints
  - UI: Expired session redirects to login without errors
  - Recovery: Re-login restores full access
- **Verification Method**: network / console

---

## Scenario Group 9: Cross-Feature Data Integrity

### E2E-025: Order references correct product data after product update
- **Type**: Edge Case
- **Priority**: High
- **Preconditions**: Seller has a product, buyer has ordered that product
- **User Journey**:
  1. Login as buyer, add a product (price: 45000) to cart, complete checkout
  2. Note the order total and product price in order details
  3. Logout, login as seller
  4. Update the product price to 60000
  5. Logout, login as buyer
  6. Navigate to /dashboard/orders
  7. View the existing order
  8. Verify order still shows the original price (45000), not the updated price (60000)
- **Expected Results**:
  - Order: Historical order preserves the price at time of purchase
  - DB: TB_COMM_ORDR_ITEM stores the price at order time, independent of current product price
- **Verification Method**: network

### E2E-026: Concurrent user actions — two buyers ordering last item
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: Product with stock = 1
- **User Journey**:
  1. Set up a product with stock = 1
  2. Login as Buyer A in browser 1, add product to cart
  3. Login as Buyer B in browser 2, add same product to cart
  4. Buyer A proceeds to checkout and places order
  5. Buyer B proceeds to checkout and places order
  6. Verify one order succeeds and the other fails with "out of stock" or similar
  7. Verify stock count is 0 (not negative)
- **Expected Results**:
  - Concurrency: Only one order should succeed for the last item
  - Stock: Never goes negative
  - Error: Second buyer receives appropriate error message
- **Verification Method**: network / console

---

## Scenario Group 10: Responsive Cross-Feature

### E2E-027: Mobile user journey — browse, search, purchase
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Mobile viewport (375x667), logged in as buyer
- **User Journey**:
  1. Resize viewport to 375x667 (iPhone SE)
  2. Navigate to homepage
  3. Verify mobile layout: hamburger menu, stacked product cards, horizontal category scroll
  4. Open hamburger menu, verify navigation links
  5. Use search bar, search for a product
  6. Verify search results in mobile layout (single column)
  7. Click on a product, verify mobile product detail layout
  8. Add to cart
  9. Navigate to cart via mobile menu
  10. Verify cart layout on mobile (no overflow, readable)
  11. Proceed to checkout
  12. Verify checkout form is usable on mobile (inputs not clipped, buttons tappable)
  13. Complete order
  14. Verify confirmation page renders correctly on mobile
- **Expected Results**:
  - UI: All pages render correctly without horizontal overflow
  - Navigation: Hamburger menu functional
  - Forms: All inputs accessible and usable on small screens
  - Layout: No text truncation that hides critical info
- **Verification Method**: snapshot

### E2E-028: Tablet layout — admin dashboard usability
- **Type**: Happy Path
- **Priority**: Low
- **Preconditions**: Tablet viewport (768x1024), logged in as SUPER_ADMIN
- **User Journey**:
  1. Resize viewport to 768x1024 (iPad)
  2. Navigate to /dashboard/admin
  3. Verify dashboard statistics cards layout
  4. Navigate to /dashboard/admin/users
  5. Verify table is readable (no overlapping columns)
  6. Click on a user, verify detail panel/page layout
  7. Navigate to /dashboard/admin/products
  8. Verify product management table layout
- **Expected Results**:
  - UI: Admin dashboard usable on tablet without layout issues
  - Tables: Columns visible without horizontal scrolling or with smooth scroll
- **Verification Method**: snapshot

---

## Summary

| ID | Scenario | Group | Type | Priority |
|----|----------|-------|------|----------|
| E2E-001 | Seller onboarding — signup to product on homepage | New Seller Onboarding | Happy Path | Critical |
| E2E-002 | Draft product not visible to public | New Seller Onboarding | Alternative Path | High |
| E2E-003 | Complete purchase — browse to fulfillment | Full Purchase Flow | Happy Path | Critical |
| E2E-004 | Empty cart checkout prevention | Full Purchase Flow | Error Path | High |
| E2E-005 | Out-of-stock product handling | Full Purchase Flow | Edge Case | High |
| E2E-006 | Search-driven purchase — keyword to checkout | Marketplace Discovery | Happy Path | Critical |
| E2E-007 | Cross-entity search — products and posts | Marketplace Discovery | Happy Path | High |
| E2E-008 | Search with no results — graceful handling | Marketplace Discovery | Alternative Path | Medium |
| E2E-009 | Community workflow — post, comment, search | Community Engagement | Happy Path | High |
| E2E-010 | Board post like interaction | Community Engagement | Happy Path | Medium |
| E2E-011 | Guest cannot post or comment | Community Engagement | Error Path | High |
| E2E-012 | Admin full dashboard management | Admin Platform Management | Happy Path | Critical |
| E2E-013 | Admin user deactivation cascading effects | Admin Platform Management | Alternative Path | High |
| E2E-014 | Seller daily operations — products and orders | Seller Business Cycle | Happy Path | Critical |
| E2E-015 | Seller creates product with all fields | Seller Business Cycle | Happy Path | Medium |
| E2E-016 | Seller cannot access admin pages | Seller Business Cycle | Error Path | High |
| E2E-017 | Full account lifecycle — signup to deletion | Account Lifecycle | Happy Path | Critical |
| E2E-018 | Profile update persists across sessions | Account Lifecycle | Happy Path | Medium |
| E2E-019 | Re-signup after account deletion | Account Lifecycle | Edge Case | Medium |
| E2E-020 | Guest access control — all routes | Role-based Access Control | Error Path | Critical |
| E2E-021 | Buyer accessing seller-only pages | Role-based Access Control | Error Path | High |
| E2E-022 | Seller accessing admin-only pages | Role-based Access Control | Error Path | High |
| E2E-023 | Role escalation via API manipulation | Role-based Access Control | Security | Critical |
| E2E-024 | Expired/invalid token handling | Role-based Access Control | Error Path | High |
| E2E-025 | Order preserves product price at purchase time | Cross-Feature Data Integrity | Edge Case | High |
| E2E-026 | Concurrent buyers ordering last item | Cross-Feature Data Integrity | Edge Case | Medium |
| E2E-027 | Mobile user journey — browse to purchase | Responsive Cross-Feature | Happy Path | Medium |
| E2E-028 | Tablet admin dashboard usability | Responsive Cross-Feature | Happy Path | Low |

| Type | Count |
|------|-------|
| Happy Path | 13 |
| Alternative Path | 3 |
| Edge Case | 4 |
| Error Path | 7 |
| Security | 1 |
| **Total** | **28** |
