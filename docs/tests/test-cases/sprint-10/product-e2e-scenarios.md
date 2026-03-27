# Product E2E Test Scenarios — Sprint 10

## Overview
- **Feature**: Product management — CRUD, status transitions, filtering, search, seller dashboard, category browsing, soft delete
- **Related Modules**: Auth (SELLER/ADMIN roles, JWT), Order (pending order cancellation on delete)
- **API Endpoints**: POST /api/products, GET /api/products, GET /api/products/my, GET /api/products/:id, PATCH /api/products/:id, PATCH /api/products/:id/status, DELETE /api/products/:id
- **Product Pages**: / (home), /products/[id], /dashboard/products, /dashboard/products/my, /dashboard/products/create, /dashboard/products/[id]/edit
- **Categories**: CERAMICS, TEXTILES, ART, JEWELRY, HOME, FOOD
- **Statuses**: DRAFT, ACTV, HIDDEN, SOLD_OUT
- **DB Tables**: Product, User, Order
- **Blueprint**: docs/blueprints/004-product/blueprint.md
- **Production Frontend**: https://demo-vibe-production.up.railway.app
- **Production Backend**: https://demo-vibe-backend-production.up.railway.app

### Test Accounts
| Account | Email | Password | Role |
|---------|-------|----------|------|
| Seller | seller1000@yopmail.com | Seller@123 | SELLER |
| Admin | admin@astratech.vn | Admin@123 | SUPER_ADMIN |

---

## Scenario Group 1: Product Creation

### E2E-001: Seller creates a new product (default DRAFT status)
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as SELLER (seller1000@yopmail.com)
- **User Journey**:
  1. Navigate to https://demo-vibe-production.up.railway.app/dashboard/products/create
  2. Fill product name: "Handmade Ceramic Vase S10"
  3. Fill description: "A beautiful handcrafted ceramic vase for home decor"
  4. Fill price: 45000
  5. Select category: CERAMICS
  6. Upload at least one product image
  7. Fill stock quantity: 20
  8. Click "Create Product" / "Save" button
  9. Verify redirect to /dashboard/products/my or product detail page
- **Expected Results**:
  - UI: Success notification displayed, product appears in seller's product list
  - API: POST /api/products returns 201 with product data, status = "DRAFT"
  - DB: New Product record created with sellerId matching current user, status = DRAFT, deletedAt = null
- **Verification Method**: snapshot / network / console
- **Test Data**: name="Handmade Ceramic Vase S10", price=45000, category=CERAMICS, stock=20

### E2E-002: Seller creates product with minimum required fields
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: Logged in as SELLER
- **User Journey**:
  1. Navigate to /dashboard/products/create
  2. Fill only required fields (name, price, category)
  3. Leave optional fields (description, images, stock) empty or at defaults
  4. Click "Create Product"
- **Expected Results**:
  - UI: Product created successfully with default values for optional fields
  - API: POST /api/products returns 201
  - DB: Product record with default stock = 0, empty description, no images
- **Verification Method**: snapshot / network
- **Test Data**: name="Minimal Product S10", price=10000, category=ART

### E2E-003: Create product with missing required fields
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Logged in as SELLER, on create product page
- **User Journey**:
  1. Navigate to /dashboard/products/create
  2. Leave product name empty
  3. Leave price empty
  4. Click "Create Product"
- **Expected Results**:
  - UI: Validation errors displayed for required fields (name, price, category)
  - API: No request sent (client-side validation blocks), or POST /api/products returns 400
- **Verification Method**: snapshot / console

### E2E-004: Create product with invalid price (negative value)
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: Logged in as SELLER, on create product page
- **User Journey**:
  1. Navigate to /dashboard/products/create
  2. Fill name: "Negative Price Product"
  3. Fill price: -5000
  4. Select category: HOME
  5. Click "Create Product"
- **Expected Results**:
  - UI: Validation error about invalid price
  - API: POST /api/products returns 400 if client validation bypassed
- **Verification Method**: snapshot / network

### E2E-005: Admin creates a product
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as ADMIN (admin@astratech.vn)
- **User Journey**:
  1. Navigate to /dashboard/products/create
  2. Fill product name: "Admin Created Product S10"
  3. Fill price: 30000
  4. Select category: JEWELRY
  5. Fill stock: 10
  6. Click "Create Product"
- **Expected Results**:
  - UI: Product created successfully, status = DRAFT
  - API: POST /api/products returns 201
  - DB: Product created with sellerId = admin user id
- **Verification Method**: snapshot / network
- **Test Data**: name="Admin Created Product S10", price=30000, category=JEWELRY

---

## Scenario Group 2: Product Listing (Public)

### E2E-006: Homepage displays only ACTV products
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: DB contains products in various statuses (DRAFT, ACTV, HIDDEN, SOLD_OUT)
- **User Journey**:
  1. Navigate to https://demo-vibe-production.up.railway.app/
  2. Verify product grid renders with product cards
  3. Verify all displayed products have visible pricing and images
  4. Confirm no DRAFT, HIDDEN, or SOLD_OUT products appear in the listing
- **Expected Results**:
  - UI: Product grid shows only active products with images, names, prices
  - API: GET /api/products?page=1&limit=24 returns 200, all items have status = ACTV
- **Verification Method**: snapshot / network

### E2E-007: Category filtering on homepage
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Homepage loaded, products exist across multiple categories
- **User Journey**:
  1. Navigate to homepage
  2. Click "CERAMICS" category filter
  3. Verify product count updates and only ceramics products shown
  4. Click "TEXTILES" category filter
  5. Verify products change to textiles only
  6. Click "All" to reset filter
  7. Verify full product list restored
- **Expected Results**:
  - UI: Product grid updates per selected category, count label reflects filtered total
  - API: GET /api/products?category=CERAMICS returns filtered results with 200
- **Verification Method**: snapshot / network

### E2E-008: Sort products by price (low to high)
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Homepage loaded with multiple products at different prices
- **User Journey**:
  1. Select "Price: Low to High" sort option
  2. Verify products reorder with cheapest first
  3. Check that first product price <= second product price
- **Expected Results**:
  - UI: Products displayed in ascending price order
  - API: GET /api/products?sort=price_asc returns 200
- **Verification Method**: snapshot / network

### E2E-009: Sort products by price (high to low)
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Homepage loaded
- **User Journey**:
  1. Select "Price: High to Low" sort option
  2. Verify products reorder with most expensive first
- **Expected Results**:
  - UI: Products displayed in descending price order
  - API: GET /api/products?sort=price_desc returns 200
- **Verification Method**: snapshot / network

### E2E-010: Pagination / Load more products
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Homepage loaded, more products exist than initial page size
- **User Journey**:
  1. Scroll to bottom of product grid
  2. Click "Load More" or pagination control
  3. Verify additional products append to the grid
  4. Verify product count label updates
- **Expected Results**:
  - UI: Additional product cards rendered, no duplicates
  - API: GET /api/products?page=2&limit=24 returns 200
- **Verification Method**: snapshot / network

---

## Scenario Group 3: Product Detail View

### E2E-011: View product detail page
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: At least one ACTV product exists
- **User Journey**:
  1. Navigate to homepage
  2. Click on a product card
  3. Verify product detail page loads at /products/[id]
  4. Check displayed fields: name, price, description, seller name, stock, rating, category, tags
  5. Verify product images are rendered (carousel or gallery)
  6. Verify "Add to Cart" button is present
  7. Verify "Back" navigation link works
- **Expected Results**:
  - UI: Full product information rendered correctly
  - API: GET /api/products/:id returns 200 with complete product data
- **Verification Method**: snapshot / network

### E2E-012: View count increments on product detail visit
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Product exists with known view count
- **User Journey**:
  1. Note current view count of a product (via API or UI)
  2. Navigate to /products/[id]
  3. Verify the view count displayed is incremented by 1
  4. Refresh the page
  5. Verify view count increments again
- **Expected Results**:
  - UI: View count displayed and incremented per visit
  - API: GET /api/products/:id returns viewCount = previous + 1
  - DB: Product.viewCount field incremented
- **Verification Method**: network / console

### E2E-013: Product not found (invalid ID)
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: None
- **User Journey**:
  1. Navigate to /products/000000000000000000000000 (non-existent ID)
  2. Verify error state or not-found page
- **Expected Results**:
  - UI: "Product not found" message or 404 page displayed
  - API: GET /api/products/000000000000000000000000 returns 404
- **Verification Method**: snapshot / network

### E2E-014: DRAFT product not accessible via public detail page
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: A product exists with status = DRAFT
- **User Journey**:
  1. Obtain the ID of a DRAFT product
  2. Navigate to /products/[draft-product-id] as guest (not logged in)
  3. Verify product is not accessible
- **Expected Results**:
  - UI: "Product not found" or 404 page (DRAFT should not be publicly visible)
  - API: GET /api/products/:id returns 404 for DRAFT products (public endpoint)
- **Verification Method**: snapshot / network

---

## Scenario Group 4: Product Editing

### E2E-015: Seller edits own product
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as SELLER, owns at least one product
- **User Journey**:
  1. Navigate to /dashboard/products/my
  2. Click "Edit" on an existing product
  3. Verify edit form loads at /dashboard/products/[id]/edit with pre-filled data
  4. Change product name to "Updated Ceramic Vase S10"
  5. Change price to 55000
  6. Click "Save" / "Update Product"
  7. Verify redirect to product detail or my products list
- **Expected Results**:
  - UI: Updated values reflected in product detail view
  - API: PATCH /api/products/:id returns 200 with updated data
  - DB: Product record updated (name, price changed, updatedAt refreshed)
- **Verification Method**: snapshot / network
- **Test Data**: Updated name="Updated Ceramic Vase S10", price=55000

### E2E-016: Seller edits product description and images
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in as SELLER with existing product
- **User Journey**:
  1. Navigate to /dashboard/products/[id]/edit
  2. Update description to a longer text
  3. Upload a new image or remove an existing one
  4. Click "Save"
  5. Navigate to product detail page and verify changes
- **Expected Results**:
  - UI: Updated description and images displayed on detail page
  - API: PATCH /api/products/:id returns 200
- **Verification Method**: snapshot / network

### E2E-017: Seller cannot edit another seller's product
- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: Logged in as SELLER (seller1000@yopmail.com), another seller's product exists
- **User Journey**:
  1. Obtain the ID of a product owned by a different seller
  2. Navigate to /dashboard/products/[other-seller-product-id]/edit
  3. Verify access denied
- **Expected Results**:
  - UI: Access denied message, redirect, or edit form does not load
  - API: PATCH /api/products/:id returns 403 (Forbidden) for non-owner
- **Verification Method**: snapshot / network

### E2E-018: Admin edits any seller's product
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as ADMIN (admin@astratech.vn), a seller's product exists
- **User Journey**:
  1. Navigate to /dashboard/products
  2. Find a product owned by seller1000
  3. Click "Edit"
  4. Change the price to 99000
  5. Click "Save"
- **Expected Results**:
  - UI: Product updated successfully (admin has edit access to all products)
  - API: PATCH /api/products/:id returns 200
  - DB: Product price updated
- **Verification Method**: snapshot / network
- **Test Data**: price=99000

---

## Scenario Group 5: Status Transitions

### E2E-019: DRAFT to ACTV (publish product)
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as SELLER, a DRAFT product exists
- **User Journey**:
  1. Navigate to /dashboard/products/my
  2. Find a product with status "DRAFT"
  3. Click "Publish" / "Activate" or change status to ACTV
  4. Verify product status changes to ACTV
  5. Navigate to homepage and verify product now appears in public listing
- **Expected Results**:
  - UI: Product status badge changes to "Active", product visible on homepage
  - API: PATCH /api/products/:id/status with body { status: "ACTV" } returns 200
  - DB: Product.status = ACTV
- **Verification Method**: snapshot / network

### E2E-020: ACTV to HIDDEN (hide product)
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SELLER, an ACTV product exists
- **User Journey**:
  1. Navigate to /dashboard/products/my
  2. Find an ACTV product
  3. Click "Hide" or change status to HIDDEN
  4. Verify product status changes to HIDDEN
  5. Navigate to homepage and verify product no longer appears
- **Expected Results**:
  - UI: Product status badge changes to "Hidden", removed from public listing
  - API: PATCH /api/products/:id/status with body { status: "HIDDEN" } returns 200
  - DB: Product.status = HIDDEN
- **Verification Method**: snapshot / network

### E2E-021: ACTV to SOLD_OUT
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SELLER, an ACTV product exists
- **User Journey**:
  1. Navigate to /dashboard/products/my
  2. Find an ACTV product
  3. Click "Mark as Sold Out" or change status to SOLD_OUT
  4. Verify product status changes
  5. Navigate to homepage and confirm product no longer in public listing
- **Expected Results**:
  - UI: Product status badge changes to "Sold Out"
  - API: PATCH /api/products/:id/status with body { status: "SOLD_OUT" } returns 200
  - DB: Product.status = SOLD_OUT
- **Verification Method**: snapshot / network

### E2E-022: HIDDEN to ACTV (re-activate hidden product)
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in as SELLER, a HIDDEN product exists
- **User Journey**:
  1. Navigate to /dashboard/products/my
  2. Find a HIDDEN product
  3. Click "Activate" / "Publish" to set status back to ACTV
  4. Verify product reappears on homepage
- **Expected Results**:
  - UI: Status changes to "Active", product visible on homepage
  - API: PATCH /api/products/:id/status with body { status: "ACTV" } returns 200
  - DB: Product.status = ACTV
- **Verification Method**: snapshot / network

### E2E-023: SOLD_OUT to ACTV (re-stock and reactivate)
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in as SELLER, a SOLD_OUT product exists
- **User Journey**:
  1. Navigate to /dashboard/products/my
  2. Find a SOLD_OUT product
  3. Click "Activate" to set status back to ACTV
  4. Verify product status changes and product reappears in public listing
- **Expected Results**:
  - UI: Status changes to "Active"
  - API: PATCH /api/products/:id/status with body { status: "ACTV" } returns 200
  - DB: Product.status = ACTV
- **Verification Method**: snapshot / network

### E2E-024: Invalid status transition (DRAFT to HIDDEN)
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: Logged in as SELLER, a DRAFT product exists
- **User Journey**:
  1. Attempt to change a DRAFT product status directly to HIDDEN (via API)
  2. Send PATCH /api/products/:id/status with body { status: "HIDDEN" }
- **Expected Results**:
  - API: Returns 400 (Bad Request) — DRAFT can only transition to ACTV
  - DB: Product.status remains DRAFT
- **Verification Method**: network / console

### E2E-025: Invalid status transition (DRAFT to SOLD_OUT)
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: Logged in as SELLER, a DRAFT product exists
- **User Journey**:
  1. Attempt to change a DRAFT product status directly to SOLD_OUT (via API)
  2. Send PATCH /api/products/:id/status with body { status: "SOLD_OUT" }
- **Expected Results**:
  - API: Returns 400 (Bad Request) — DRAFT can only transition to ACTV
  - DB: Product.status remains DRAFT
- **Verification Method**: network / console

---

## Scenario Group 6: Product Deletion

### E2E-026: Seller soft-deletes own product (no pending orders)
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as SELLER, owns a product with no pending orders
- **User Journey**:
  1. Navigate to /dashboard/products/my
  2. Click "Delete" on a product
  3. Confirm deletion in the confirmation dialog
  4. Verify product removed from seller's product list
  5. Navigate to homepage and verify product no longer appears
- **Expected Results**:
  - UI: Product disappears from my products list and public listing
  - API: DELETE /api/products/:id returns 200
  - DB: Product.deletedAt set to current timestamp (soft delete), product not physically removed
- **Verification Method**: snapshot / network

### E2E-027: Seller deletes product with pending orders (auto-cancel)
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as SELLER, owns a product that has pending (unfulfilled) orders
- **User Journey**:
  1. Navigate to /dashboard/products/my
  2. Click "Delete" on the product with pending orders
  3. Confirm deletion (UI may show warning about pending orders)
  4. Verify product is soft-deleted
  5. Verify pending orders for this product are auto-cancelled
- **Expected Results**:
  - UI: Product removed from list, warning about pending order cancellation shown
  - API: DELETE /api/products/:id returns 200, pending orders cancelled
  - DB: Product.deletedAt set, related Order records with pending status updated to cancelled
- **Verification Method**: network / console

### E2E-028: Seller cannot delete another seller's product
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Logged in as SELLER, another seller's product exists
- **User Journey**:
  1. Obtain ID of another seller's product
  2. Attempt DELETE /api/products/:id via API
- **Expected Results**:
  - API: Returns 403 (Forbidden)
  - DB: Product remains unchanged
- **Verification Method**: network

### E2E-029: Admin soft-deletes any product
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as ADMIN
- **User Journey**:
  1. Navigate to /dashboard/products
  2. Find any seller's product
  3. Click "Delete" and confirm
  4. Verify product removed from listing
- **Expected Results**:
  - UI: Product removed from catalog
  - API: DELETE /api/products/:id returns 200
  - DB: Product.deletedAt set
- **Verification Method**: snapshot / network

---

## Scenario Group 7: My Products Management

### E2E-030: Seller views own products list
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as SELLER with multiple products in different statuses
- **User Journey**:
  1. Navigate to /dashboard/products/my
  2. Verify page displays only the seller's own products
  3. Verify products show status badges (DRAFT, ACTV, HIDDEN, SOLD_OUT)
  4. Verify product count matches seller's total products
- **Expected Results**:
  - UI: Product list displays with name, price, status, category for each item
  - API: GET /api/products/my returns 200, all items have sellerId matching current user
- **Verification Method**: snapshot / network

### E2E-031: Seller filters own products by status
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in as SELLER, products exist in multiple statuses
- **User Journey**:
  1. Navigate to /dashboard/products/my
  2. Filter by status "DRAFT"
  3. Verify only DRAFT products shown
  4. Filter by status "ACTV"
  5. Verify only ACTV products shown
  6. Clear filters
  7. Verify all products shown
- **Expected Results**:
  - UI: Product list filters correctly by status
  - API: GET /api/products/my?status=DRAFT returns filtered results
- **Verification Method**: snapshot / network

### E2E-032: Buyer cannot access /dashboard/products/my
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Logged in as BUYER
- **User Journey**:
  1. Navigate to /dashboard/products/my
  2. Verify access denied or redirect
- **Expected Results**:
  - UI: Access denied message or redirect to homepage/dashboard
  - API: GET /api/products/my returns 403 for BUYER role
- **Verification Method**: snapshot / network

### E2E-033: Buyer cannot access /dashboard/products/create
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Logged in as BUYER
- **User Journey**:
  1. Navigate to /dashboard/products/create
  2. Verify access denied or redirect
- **Expected Results**:
  - UI: Access denied message or redirect
  - API: POST /api/products returns 403 for BUYER role
- **Verification Method**: snapshot / network

### E2E-034: Guest cannot access seller dashboard pages
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Not logged in (guest)
- **User Journey**:
  1. Navigate to /dashboard/products/my
  2. Verify redirect to login page
  3. Navigate to /dashboard/products/create
  4. Verify redirect to login page
- **Expected Results**:
  - UI: Redirect to /auth/login with return URL
  - API: Returns 401 (Unauthorized)
- **Verification Method**: snapshot / network

---

## Scenario Group 8: Category and Search Filtering

### E2E-035: Filter by each category on homepage
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Homepage loaded, products exist in all 6 categories
- **User Journey**:
  1. Navigate to homepage
  2. Click "CERAMICS" filter — verify only ceramics products shown
  3. Click "TEXTILES" filter — verify only textiles products shown
  4. Click "ART" filter — verify only art products shown
  5. Click "JEWELRY" filter — verify only jewelry products shown
  6. Click "HOME" filter — verify only home products shown
  7. Click "FOOD" filter — verify only food products shown
  8. Click "All" to clear — verify all products shown
- **Expected Results**:
  - UI: Product grid correctly filters for each category
  - API: GET /api/products?category={CATEGORY} returns 200 with matching products
- **Verification Method**: snapshot / network

### E2E-036: Search products by keyword
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Homepage loaded, products with keyword "ceramic" exist
- **User Journey**:
  1. Type "ceramic" in the search input
  2. Submit search or wait for auto-search
  3. Verify search results contain products with "ceramic" in name or description
  4. Clear search input
  5. Verify full product listing restored
- **Expected Results**:
  - UI: Product grid shows filtered results matching search keyword
  - API: GET /api/products?search=ceramic returns relevant products
- **Verification Method**: snapshot / network

### E2E-037: Search with no results
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: Homepage loaded
- **User Journey**:
  1. Type "xyznonexistent12345" in the search input
  2. Submit search
  3. Verify empty state message displayed
- **Expected Results**:
  - UI: "No products found" or similar empty state message
  - API: GET /api/products?search=xyznonexistent12345 returns 200 with empty data array
- **Verification Method**: snapshot / network

### E2E-038: Combined category + search filter
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Homepage loaded
- **User Journey**:
  1. Select "CERAMICS" category
  2. Type "vase" in search input
  3. Verify results are ceramics products containing "vase"
  4. Clear search, verify all ceramics shown
  5. Clear category, verify all products shown
- **Expected Results**:
  - UI: Filters work in combination, results narrow correctly
  - API: GET /api/products?category=CERAMICS&search=vase returns filtered results
- **Verification Method**: snapshot / network

---

## Scenario Group 9: Ownership Verification

### E2E-039: Seller A cannot edit Seller B's product via direct URL
- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: Logged in as seller1000@yopmail.com, another seller's product ID known
- **User Journey**:
  1. Copy the product ID of a product owned by a different seller
  2. Navigate directly to /dashboard/products/[other-seller-id]/edit
  3. Verify access is denied
- **Expected Results**:
  - UI: Access denied, error page, or redirect to own products list
  - API: PATCH /api/products/:id returns 403 if form submission attempted
- **Verification Method**: snapshot / network

### E2E-040: Seller A cannot change status of Seller B's product
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Logged in as SELLER, another seller's product ID known
- **User Journey**:
  1. Attempt PATCH /api/products/[other-seller-id]/status with body { status: "ACTV" }
- **Expected Results**:
  - API: Returns 403 (Forbidden)
  - DB: Product status unchanged
- **Verification Method**: network

### E2E-041: Seller A cannot delete Seller B's product
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Logged in as SELLER, another seller's product ID known
- **User Journey**:
  1. Attempt DELETE /api/products/[other-seller-id] via API
- **Expected Results**:
  - API: Returns 403 (Forbidden)
  - DB: Product not deleted
- **Verification Method**: network

### E2E-042: Admin can edit, change status, and delete any product
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as ADMIN
- **User Journey**:
  1. Navigate to /dashboard/products
  2. Edit a seller's product — verify PATCH returns 200
  3. Change a seller's product status — verify PATCH /status returns 200
  4. Delete a seller's product — verify DELETE returns 200
- **Expected Results**:
  - UI: All operations succeed for ADMIN role
  - API: All endpoints return 200 for ADMIN regardless of product ownership
- **Verification Method**: snapshot / network

---

## Scenario Group 10: Price Range and Rating Filters

### E2E-043: Filter by price range (min and max)
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Homepage loaded, products exist at various price points
- **User Journey**:
  1. Set minimum price filter to 10000
  2. Set maximum price filter to 50000
  3. Apply filter
  4. Verify all displayed products have prices between 10000 and 50000
- **Expected Results**:
  - UI: Only products within price range displayed
  - API: GET /api/products?minPrice=10000&maxPrice=50000 returns filtered results
- **Verification Method**: snapshot / network

### E2E-044: Filter by minimum price only
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Homepage loaded
- **User Journey**:
  1. Set minimum price filter to 100000
  2. Apply filter
  3. Verify all displayed products have price >= 100000
- **Expected Results**:
  - UI: Only expensive products displayed
  - API: GET /api/products?minPrice=100000 returns filtered results
- **Verification Method**: snapshot / network

### E2E-045: Filter by maximum price only
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Homepage loaded
- **User Journey**:
  1. Set maximum price filter to 20000
  2. Apply filter
  3. Verify all displayed products have price <= 20000
- **Expected Results**:
  - UI: Only budget products displayed
  - API: GET /api/products?maxPrice=20000 returns filtered results
- **Verification Method**: snapshot / network

### E2E-046: Filter by rating (minimum stars)
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Homepage loaded, products have various ratings
- **User Journey**:
  1. Select "4 stars & up" rating filter
  2. Verify all displayed products have rating >= 4.0
  3. Select "3 stars & up"
  4. Verify products with rating >= 3.0 displayed (more results)
- **Expected Results**:
  - UI: Product grid filtered by minimum rating
  - API: GET /api/products?minRating=4 returns filtered results
- **Verification Method**: snapshot / network

### E2E-047: Combined price range + category + sort
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Homepage loaded
- **User Journey**:
  1. Select category: JEWELRY
  2. Set price range: 20000 to 80000
  3. Sort by "Price: Low to High"
  4. Verify results are JEWELRY products in price range, sorted ascending
- **Expected Results**:
  - UI: Filtered, sorted product list
  - API: GET /api/products?category=JEWELRY&minPrice=20000&maxPrice=80000&sort=price_asc returns 200
- **Verification Method**: snapshot / network

### E2E-048: Price range with no results
- **Type**: Edge Case
- **Priority**: Low
- **Preconditions**: Homepage loaded
- **User Journey**:
  1. Set minimum price to 99999999
  2. Apply filter
  3. Verify empty state shown
- **Expected Results**:
  - UI: "No products found" empty state
  - API: GET /api/products?minPrice=99999999 returns 200 with empty data
- **Verification Method**: snapshot / network

---

## Summary

| ID | Scenario | Type | Priority |
|----|----------|------|----------|
| E2E-001 | Seller creates product (default DRAFT) | Happy Path | Critical |
| E2E-002 | Create product with minimum fields | Edge Case | Medium |
| E2E-003 | Create product missing required fields | Error Path | High |
| E2E-004 | Create product with invalid price | Error Path | Medium |
| E2E-005 | Admin creates a product | Happy Path | High |
| E2E-006 | Homepage displays only ACTV products | Happy Path | Critical |
| E2E-007 | Category filtering on homepage | Happy Path | High |
| E2E-008 | Sort by price (low to high) | Happy Path | Medium |
| E2E-009 | Sort by price (high to low) | Happy Path | Medium |
| E2E-010 | Pagination / Load more | Happy Path | Medium |
| E2E-011 | View product detail page | Happy Path | Critical |
| E2E-012 | View count increments | Happy Path | Medium |
| E2E-013 | Product not found (invalid ID) | Error Path | Medium |
| E2E-014 | DRAFT product not publicly accessible | Error Path | High |
| E2E-015 | Seller edits own product | Happy Path | Critical |
| E2E-016 | Edit product description and images | Happy Path | Medium |
| E2E-017 | Cannot edit another seller's product | Error Path | Critical |
| E2E-018 | Admin edits any seller's product | Happy Path | High |
| E2E-019 | DRAFT to ACTV (publish) | Happy Path | Critical |
| E2E-020 | ACTV to HIDDEN | Happy Path | High |
| E2E-021 | ACTV to SOLD_OUT | Happy Path | High |
| E2E-022 | HIDDEN to ACTV (re-activate) | Happy Path | Medium |
| E2E-023 | SOLD_OUT to ACTV (re-stock) | Happy Path | Medium |
| E2E-024 | Invalid transition DRAFT to HIDDEN | Error Path | Medium |
| E2E-025 | Invalid transition DRAFT to SOLD_OUT | Error Path | Medium |
| E2E-026 | Seller soft-deletes product (no orders) | Happy Path | Critical |
| E2E-027 | Delete product with pending orders (auto-cancel) | Happy Path | Critical |
| E2E-028 | Cannot delete another seller's product | Error Path | High |
| E2E-029 | Admin deletes any product | Happy Path | High |
| E2E-030 | Seller views own products list | Happy Path | Critical |
| E2E-031 | Seller filters by status | Happy Path | Medium |
| E2E-032 | Buyer cannot access my products | Error Path | High |
| E2E-033 | Buyer cannot access create product | Error Path | High |
| E2E-034 | Guest cannot access seller pages | Error Path | High |
| E2E-035 | Filter by each category | Happy Path | High |
| E2E-036 | Search products by keyword | Happy Path | High |
| E2E-037 | Search with no results | Edge Case | Medium |
| E2E-038 | Combined category + search | Happy Path | Medium |
| E2E-039 | Seller A cannot edit Seller B's product (URL) | Error Path | Critical |
| E2E-040 | Seller A cannot change Seller B's status | Error Path | High |
| E2E-041 | Seller A cannot delete Seller B's product | Error Path | High |
| E2E-042 | Admin can manage any product | Happy Path | High |
| E2E-043 | Filter by price range (min + max) | Happy Path | High |
| E2E-044 | Filter by minimum price only | Happy Path | Medium |
| E2E-045 | Filter by maximum price only | Happy Path | Medium |
| E2E-046 | Filter by rating | Happy Path | Medium |
| E2E-047 | Combined price + category + sort | Happy Path | Medium |
| E2E-048 | Price range with no results | Edge Case | Low |

### Coverage Statistics
| Type | Count |
|------|-------|
| Happy Path | 29 |
| Edge Case | 3 |
| Error Path | 16 |
| **Total** | **48** |

### Priority Distribution
| Priority | Count |
|----------|-------|
| Critical | 8 |
| High | 19 |
| Medium | 20 |
| Low | 1 |
| **Total** | **48** |
