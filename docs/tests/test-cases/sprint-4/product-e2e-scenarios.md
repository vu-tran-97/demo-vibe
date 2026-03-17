# Product Registration — E2E Test Scenarios (Sprint 4)

> End-to-end test scenarios for the product management feature covering seller product registration, public product listing, product detail, and seller product management.

---

## Scenarios

### E2E-PRD-001: Seller registers a new product successfully

- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: User logged in as SELLER role
- **User Journey**:
  1. Navigate to `/dashboard/products`
  2. Click "My Products" link in the header actions area
  3. Arrive at `/dashboard/products/my` page
  4. Click "+ Add Product" link (or navigate from products listing header)
  5. Arrive at `/dashboard/products/create` page
  6. Fill in "Product Name" field with "Handcrafted Ceramic Bowl"
  7. Fill in "Description" field with "A beautiful handcrafted ceramic bowl..."
  8. Fill in "Price ($)" field with "45.00"
  9. Leave "Sale Price ($)" empty
  10. Select "Ceramics & Pottery" from the Category dropdown
  11. Fill in "Stock Quantity" with "25"
  12. Fill in "Main Image URL" with "https://example.com/bowl.jpg"
  13. Fill in "Tags" with "ceramic, handmade, bowl"
  14. Click "Create Product" button
- **Expected Results**:
  - UI: Redirect to `/dashboard/products`, success indication, new product visible in listing
  - API: `POST /api/products` returns 201 with `{ success: true, data: { id, name: "Handcrafted Ceramic Bowl", status: "ACTV" } }`
  - DB: New document in `TB_PROD_PRD` with `SLLR_ID` matching the seller, `PRD_STTS_CD = "ACTV"`, `STCK_QTY = 25`, `DEL_YN = "N"`
- **Verification Method**: network + db-query
- **Test Data**: Seller account credentials, product form values as described above

---

### E2E-PRD-002: Seller registers a product as DRAFT

- **Type**: Alternative Path
- **Priority**: High
- **Preconditions**: User logged in as SELLER role
- **User Journey**:
  1. Navigate to `/dashboard/products/create`
  2. Fill in all required fields (name, description, price=30.00, category=TEXTILES, stock=10)
  3. Observe that product defaults to ACTV status on creation
  4. Click "Create Product" button
  5. Navigate to `/dashboard/products/my`
  6. Find the newly created product in the list
  7. Click the status toggle button ("Hide") to change status to HIDDEN
- **Expected Results**:
  - UI: Product card status badge changes to "Hidden"
  - API: `POST /api/products` returns 201; then `PATCH /api/products/:id/status` with `{ status: "HIDDEN" }` returns 200
  - DB: `PRD_STTS_CD` updated to `"HIDDEN"` in `TB_PROD_PRD`
- **Verification Method**: network + snapshot
- **Test Data**: Product with name "Linen Table Runner", price $30.00, category TEXTILES

---

### E2E-PRD-003: Public user browses product listing with category filter

- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Multiple products exist across categories (CERAMICS, TEXTILES, ART, JEWELRY); user may or may not be logged in
- **User Journey**:
  1. Navigate to `/` (homepage) or `/dashboard/products`
  2. Observe the category filter buttons: All, Ceramics & Pottery, Textiles & Fabrics, etc.
  3. Click the "Ceramics & Pottery" category button
  4. Observe the product grid updates to show only ceramics products
  5. Verify the result count text updates (e.g., "5 products in Ceramics & Pottery")
  6. Click "All" category button
  7. Verify all products are shown again
- **Expected Results**:
  - UI: Product grid filters to show only products matching the selected category; count label updates
  - API: `GET /api/products?category=CERAMICS&page=1&limit=12` returns 200 with filtered results
  - DB: Query filters on `PRD_CTGR_CD = "CERAMICS"` and `PRD_STTS_CD = "ACTV"` and `DEL_YN = "N"`
- **Verification Method**: network + snapshot
- **Test Data**: At least 3 CERAMICS products and 3 non-CERAMICS products in active status

---

### E2E-PRD-004: Product search by keyword

- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Products exist with names containing "Ceramic" and "Linen"
- **User Journey**:
  1. Navigate to `/dashboard/products`
  2. Type "Ceramic" in the search input field
  3. Click the "Search" button (or press Enter)
  4. Observe the product grid filters to matching products
  5. Clear the search field and search for "xyznonexistent"
  6. Observe the empty state: "No products found" message with suggestion text
- **Expected Results**:
  - UI: Step 4 shows matching products; Step 6 shows empty state with "No products found" and "Try selecting a different category or adjusting your search"
  - API: `GET /api/products?search=Ceramic&page=1&limit=12` returns 200; `GET /api/products?search=xyznonexistent&page=1&limit=12` returns 200 with empty items array
  - DB: Text search on `PRD_NM`, `PRD_DC`, `SRCH_TAGS` fields
- **Verification Method**: network + snapshot
- **Test Data**: Products with "Ceramic" in their names

---

### E2E-PRD-005: Product listing with sort by price

- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Multiple products with different prices exist
- **User Journey**:
  1. Navigate to `/dashboard/products`
  2. Observe the sort dropdown defaulting to "Most Popular"
  3. Change the sort dropdown to "Price: Low to High"
  4. Verify the product grid reorders with cheapest products first
  5. Change the sort dropdown to "Price: High to Low"
  6. Verify the product grid reorders with most expensive products first
- **Expected Results**:
  - UI: Product cards reorder according to selected sort; page resets to 1
  - API: `GET /api/products?sort=price-low&page=1&limit=12` returns products in ascending price order; `GET /api/products?sort=price-high&page=1&limit=12` returns descending
  - DB: Sort on `PRD_PRC` or `PRD_SALE_PRC` field
- **Verification Method**: network + snapshot
- **Test Data**: Products with prices $10, $45, $89, $150

---

### E2E-PRD-006: Product detail page view count increment

- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: A product exists with `VIEW_CNT = 5`; user logged in
- **User Journey**:
  1. Navigate to `/dashboard/products`
  2. Click on a product card (e.g., "Handcrafted Ceramic Bowl")
  3. Arrive at `/dashboard/products/:id` detail page
  4. Observe product details: name, description, price, category, seller name, images, stock info
  5. Navigate away and return to the same product detail page
- **Expected Results**:
  - UI: Product detail page displays all product information correctly
  - API: `GET /api/products/:id` returns 200 with full product data; view count incremented each visit
  - DB: `VIEW_CNT` incremented from 5 to 6 on first visit, 7 on second visit
- **Verification Method**: network + db-query
- **Test Data**: Product with known `VIEW_CNT` value

---

### E2E-PRD-007: Seller edits own product

- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: SELLER has a product "Old Name" with price $50
- **User Journey**:
  1. Navigate to `/dashboard/products/my`
  2. Find the product "Old Name" in the list
  3. Click the "Edit" link on the product card
  4. Arrive at `/dashboard/products/:id/edit` page
  5. Change "Product Name" to "New Name"
  6. Change "Price ($)" to "55.00"
  7. Click "Save Changes" (or "Update Product") button
- **Expected Results**:
  - UI: Redirect to product detail or my products page; product shows updated name and price
  - API: `PATCH /api/products/:id` with `{ name: "New Name", price: 55 }` returns 200
  - DB: `PRD_NM = "New Name"`, `PRD_PRC = 55` in `TB_PROD_PRD`; `MDFCN_DT` updated
- **Verification Method**: network + db-query
- **Test Data**: Existing product owned by the seller

---

### E2E-PRD-008: Seller deletes own product (soft delete)

- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: SELLER has a product in my products list
- **User Journey**:
  1. Navigate to `/dashboard/products/my`
  2. Find a product in the list
  3. Click the "Delete" button on the product card
  4. Confirm the deletion in the confirmation dialog
  5. Observe the product is removed from the list
  6. Navigate to `/dashboard/products` (public listing)
  7. Verify the deleted product does not appear
- **Expected Results**:
  - UI: Product removed from my products list and public listing
  - API: `DELETE /api/products/:id` returns 200
  - DB: `DEL_YN = "Y"` in `TB_PROD_PRD` (soft delete, not physical)
- **Verification Method**: network + db-query
- **Test Data**: Product owned by the seller

---

### E2E-PRD-009: Buyer cannot access product creation page

- **Type**: Error Path
- **Priority**: High
- **Preconditions**: User logged in as BUYER role
- **User Journey**:
  1. Navigate to `/dashboard/products`
  2. Observe that "+ Add Product" and "My Products" buttons are NOT visible in the header
  3. Manually navigate to `/dashboard/products/create` by entering the URL directly
  4. Observe the "Access Denied" page: "Only sellers and administrators can create products"
- **Expected Results**:
  - UI: No seller action buttons on products page; access denied message on `/dashboard/products/create`
  - API: `POST /api/products` returns 403 Forbidden if attempted
  - DB: No changes
- **Verification Method**: snapshot + network
- **Test Data**: Buyer account credentials

---

### E2E-PRD-010: Non-owner seller cannot edit another seller's product

- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Seller A owns product X; Seller B is logged in
- **User Journey**:
  1. Seller B navigates to `/dashboard/products/:productX_id`
  2. Observe the product detail page (read-only; no edit/delete buttons since not owner)
  3. Seller B manually sends `PATCH /api/products/:productX_id` with updated data
- **Expected Results**:
  - UI: No edit/delete buttons visible for non-owned products
  - API: `PATCH /api/products/:id` returns 403 Forbidden with error message
  - DB: No changes to the product
- **Verification Method**: network
- **Test Data**: Two seller accounts, product owned by Seller A

---

### E2E-PRD-011: Product listing pagination

- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: More than 12 active products exist in the system
- **User Journey**:
  1. Navigate to `/dashboard/products`
  2. Observe 12 products displayed in the grid (limit=12)
  3. Observe pagination at bottom: "Page 1 of N" with Previous/Next buttons
  4. Previous button is disabled on page 1
  5. Click "Next" button
  6. Observe page 2 loads with next set of products
  7. Observe "Page 2 of N" label; Previous button is now enabled
  8. Click "Previous" to return to page 1
- **Expected Results**:
  - UI: Product grid updates per page; pagination info shows correct page/total; button states correct
  - API: `GET /api/products?page=1&limit=12` then `GET /api/products?page=2&limit=12`; response includes `pagination.page`, `pagination.totalPages`, `pagination.total`
  - DB: Correct offset-based query on products
- **Verification Method**: network + snapshot
- **Test Data**: 25+ active products

---

### E2E-PRD-012: Product with sale price displays discount badge

- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Product exists with `PRD_PRC = 100`, `PRD_SALE_PRC = 75`
- **User Journey**:
  1. Navigate to `/dashboard/products` or `/` (homepage)
  2. Find the product with a sale price in the grid
  3. Observe the "Sale" badge on the product card image
  4. Observe the sale price displayed prominently with original price struck through
  5. On homepage, observe the Flash Deals section shows discount percentage (e.g., "25% OFF")
  6. Click the product card to view detail at `/dashboard/products/:id`
  7. Verify both sale price and original price are shown on the detail page
- **Expected Results**:
  - UI: Sale badge visible; sale price shown with original price struck through; discount % on homepage Flash Deals
  - API: Product response includes both `price` and `salePrice` fields
  - DB: `PRD_PRC = 100`, `PRD_SALE_PRC = 75` in `TB_PROD_PRD`
- **Verification Method**: snapshot
- **Test Data**: Product with sale price set

---

### E2E-PRD-013: SUPER_ADMIN can edit any seller's product

- **Type**: Alternative Path
- **Priority**: Medium
- **Preconditions**: SUPER_ADMIN logged in; product owned by a regular seller exists
- **User Journey**:
  1. Navigate to `/dashboard/products/:id/edit` for a product owned by another seller
  2. Change the product name to "Admin-Updated Name"
  3. Click "Save Changes"
- **Expected Results**:
  - UI: Successful update; redirected back with updated product name
  - API: `PATCH /api/products/:id` returns 200 (SUPER_ADMIN bypasses ownership check)
  - DB: `PRD_NM` updated, `MDFR_ID` set to admin's user ID
- **Verification Method**: network + db-query
- **Test Data**: SUPER_ADMIN credentials; product owned by another seller

---

### E2E-PRD-014: Create product with maximum images (5 total)

- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: SELLER logged in
- **User Journey**:
  1. Navigate to `/dashboard/products/create`
  2. Fill in all required fields
  3. Fill in "Main Image URL" with a valid URL
  4. Click "+ Add Image" four times to add 4 additional image fields
  5. Fill in all 4 additional image URLs
  6. Observe "+ Add Image" button is disabled with "(0 remaining)" text
  7. Click "Create Product"
- **Expected Results**:
  - UI: 4 additional image input rows shown; add button disabled at maximum; product created successfully
  - API: `POST /api/products` with `images` array of 4 items returns 201
  - DB: `PRD_IMG_URL` set, `PRD_IMG_URLS` array has 4 entries in `TB_PROD_PRD`
- **Verification Method**: network + db-query
- **Test Data**: 5 valid image URLs

---

### E2E-PRD-015: Create product with empty required fields shows validation

- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: SELLER logged in
- **User Journey**:
  1. Navigate to `/dashboard/products/create`
  2. Leave all fields empty
  3. Click "Create Product"
  4. Observe browser-level HTML5 validation errors on required fields (name, description, price, category, stock)
  5. Fill in name only, click "Create Product" again
  6. Observe next required field validation triggers
- **Expected Results**:
  - UI: HTML5 required field validation prevents form submission; error messages on empty required fields
  - API: No API call made (client-side validation blocks)
  - DB: No changes
- **Verification Method**: snapshot
- **Test Data**: Empty form fields

---

## Summary

| Type | Count |
|------|-------|
| Happy Path | 8 |
| Alternative Path | 2 |
| Edge Case | 1 |
| Error Path | 3 |
| **Total** | **15** |
