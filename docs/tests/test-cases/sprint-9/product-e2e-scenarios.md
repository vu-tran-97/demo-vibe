# Product E2E Test Scenarios

## Overview
- **Feature**: Product browsing, filtering, detail view, seller CRUD, cart management
- **Related Modules**: Auth (seller role), Order (add to cart → checkout)
- **API Endpoints**: GET /api/products, GET /api/products/:id, GET /api/products/my, POST /api/products, PATCH /api/products/:id, PATCH /api/products/:id/status, DELETE /api/products/:id
- **DB Tables**: Product, User
- **Blueprint**: docs/blueprints/004-product/blueprint.md

## Scenario Group 1: Product Browsing (Guest)

### E2E-001: Homepage product grid load
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Server running, DB seeded with products
- **User Journey**:
  1. Navigate to http://localhost:3000
  2. Verify product grid renders with images, names, prices
  3. Verify "50000 products" count displayed
  4. Verify default sort is "Popular"
- **Expected Results**:
  - UI: 24 product cards displayed in grid layout
  - API: GET /api/products?page=1&limit=24&sort=popular returns 200
- **Verification Method**: snapshot / network

### E2E-002: Category filtering
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Homepage loaded
- **User Journey**:
  1. Click "Ceramics & Pottery" category
  2. Verify product count changes
  3. Verify only ceramics products shown
  4. Click "All" to reset filter
  5. Verify full product list restored
- **Expected Results**:
  - UI: Product count and grid update for each category
  - API: GET /api/products?category=Ceramics+%26+Pottery returns filtered results
- **Verification Method**: snapshot / network

### E2E-003: Sort by price (low to high)
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Homepage loaded
- **User Journey**:
  1. Click "Price: Low to High" sort button
  2. Verify products reorder by ascending price
- **Expected Results**:
  - UI: First product has lowest price
  - API: GET /api/products?sort=price_asc returns 200
- **Verification Method**: snapshot / network

### E2E-004: Sort by price (high to low)
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Homepage loaded
- **User Journey**:
  1. Click "Price: High to Low" sort button
  2. Verify products reorder by descending price
- **Expected Results**:
  - UI: First product has highest price
  - API: GET /api/products?sort=price_desc returns 200
- **Verification Method**: snapshot / network

### E2E-005: Load more products
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Homepage loaded, showing 24 products
- **User Journey**:
  1. Scroll to bottom
  2. Click "Load More" button
  3. Verify additional products appended
- **Expected Results**:
  - UI: "Showing 48 of 50,000 products" displayed
  - API: GET /api/products?page=2&limit=24 returns 200
- **Verification Method**: snapshot / network

## Scenario Group 2: Product Detail

### E2E-006: View product detail page
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Homepage loaded
- **User Journey**:
  1. Click on a product card
  2. Verify product detail page loads
  3. Check: name, price, description, seller name, stock, rating, tags
  4. Verify "Add to Cart" button present
  5. Verify "Back to Store" link works
- **Expected Results**:
  - UI: Full product information displayed
  - API: GET /api/products/:id returns 200
- **Verification Method**: snapshot / network

### E2E-007: Product not found (404)
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: None
- **User Journey**:
  1. Navigate to /products/999999
  2. Verify error or not-found state
- **Expected Results**:
  - UI: Product not found message or 404 page
  - API: GET /api/products/999999 returns 404
- **Verification Method**: snapshot / network

## Scenario Group 3: Add to Cart

### E2E-008: Add product to cart from homepage
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Homepage loaded
- **User Journey**:
  1. Click "Add to cart" button on a product card
  2. Verify cart icon updates (badge count)
  3. Navigate to /cart
  4. Verify product appears in cart
- **Expected Results**:
  - UI: Cart badge increments, product in cart page
- **Verification Method**: snapshot

### E2E-009: Add product to cart from detail page
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Product detail page loaded
- **User Journey**:
  1. Click "Add to Cart" button
  2. Verify success feedback
  3. Navigate to cart page
  4. Verify product in cart
- **Expected Results**:
  - UI: Success indication, product in cart
- **Verification Method**: snapshot

## Scenario Group 4: Seller Product Management

### E2E-010: Seller creates a new product
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SELLER
- **User Journey**:
  1. Navigate to /dashboard/products/create
  2. Fill product form (name, description, price, category, images, stock)
  3. Submit
  4. Verify redirect to product detail or my products page
- **Expected Results**:
  - API: POST /api/products returns 201
  - DB: New Product record with sellerId
- **Verification Method**: snapshot / network

### E2E-011: Seller edits own product
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in as SELLER with existing product
- **User Journey**:
  1. Navigate to /dashboard/products/my
  2. Click edit on a product
  3. Change price or description
  4. Save
  5. Verify changes reflected
- **Expected Results**:
  - API: PATCH /api/products/:id returns 200
  - DB: Product record updated
- **Verification Method**: snapshot / network

### E2E-012: Seller views own product list
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in as SELLER
- **User Journey**:
  1. Navigate to /dashboard/products/my
  2. Verify only seller's products shown
- **Expected Results**:
  - API: GET /api/products/my returns 200
  - UI: Product list filtered to current seller
- **Verification Method**: snapshot / network

### E2E-013: Buyer cannot access create product page
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Logged in as BUYER
- **User Journey**:
  1. Navigate to /dashboard/products/create
  2. Verify access denied or redirect
- **Expected Results**:
  - UI: Access denied message or redirect
  - API: POST /api/products returns 403
- **Verification Method**: snapshot / network

---

## Summary
| Type | Count |
|------|-------|
| Happy Path | 10 |
| Alternative Path | 0 |
| Edge Case | 0 |
| Error Path | 3 |
| **Total** | **13** |
