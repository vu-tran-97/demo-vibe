# Product E2E Test Scenarios (Sprint 6)

## Overview
- **Feature**: Product browsing, seller product management, stock management
- **Related Modules**: product, search, cart, order
- **API Endpoints**: `/api/products`, `/api/products/my`, `/api/products/:id`, `/api/search`
- **DB Tables**: TB_PROD_PRD
- **Blueprint**: docs/blueprints/004-product/, docs/blueprints/010-search-filter/

## Scenario Group 1: Public Product Browsing

### E2E-001: Browse products on homepage
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Products seeded
- **User Journey**:
  1. Navigate to `/`
  2. Verify product grid displays product cards
  3. Verify each card shows: image, name, price, category
  4. Verify pagination controls at bottom
- **Expected Results**:
  - UI: Product cards rendered with images, prices, pagination
  - API: `GET /api/products` returns paginated data
- **Verification Method**: snapshot / network
- **Test Data**: Seeded products (200+)

### E2E-002: View product detail
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Products exist
- **User Journey**:
  1. Navigate to `/`
  2. Click on a product card
  3. Navigate to `/products/{id}`
  4. Verify product detail: name, price, description, images, stock status, seller info
- **Expected Results**:
  - UI: Product detail page with full information
  - API: `GET /api/products/:id` returns product data, view count incremented
  - DB: `viewCnt` incremented by 1
- **Verification Method**: snapshot / network
- **Test Data**: Any active product

### E2E-003: Search products
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Products seeded with searchable names
- **User Journey**:
  1. Navigate to `/`
  2. Type search term in search bar
  3. Verify autocomplete suggestions appear
  4. Press Enter or click search
  5. Verify filtered product results
- **Expected Results**:
  - API: `GET /api/search/suggest?q=...` returns suggestions
  - API: `GET /api/products?search=...` returns filtered results
  - UI: Only matching products displayed
- **Verification Method**: snapshot / network
- **Test Data**: Search term: "craft"

### E2E-004: Filter products by category
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Products in multiple categories
- **User Journey**:
  1. Navigate to `/`
  2. Click a category filter tab
  3. Verify only products in that category shown
- **Expected Results**:
  - API: `GET /api/products?category=CERAMICS` returns filtered results
  - UI: Product grid updated with filtered results
- **Verification Method**: snapshot / network
- **Test Data**: Category: "CERAMICS"

### E2E-005: Sort products by price
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Products with varying prices
- **User Journey**:
  1. Navigate to `/`
  2. Select sort option: "Price: Low to High"
  3. Verify products sorted ascending by price
- **Expected Results**:
  - API: `GET /api/products?sort=price-low`
  - UI: Products ordered by price ascending
- **Verification Method**: network
- **Test Data**: Default product listing

### E2E-006: Product not found (invalid ID)
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: None
- **User Journey**:
  1. Navigate to `/products/000000000000000000000099`
  2. Verify 404 or error state displayed
- **Expected Results**:
  - API: `GET /api/products/:id` returns `PRODUCT_NOT_FOUND`
  - UI: Error or not-found page shown
- **Verification Method**: snapshot / network
- **Test Data**: Non-existent product ID

## Scenario Group 2: Seller Product Management

### E2E-007: Seller creates a product
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as SELLER
- **User Journey**:
  1. Log in as seller
  2. Navigate to `/dashboard/products/create`
  3. Fill product form: name, description, price, category, image URL, stock
  4. Click "Create"
  5. Verify redirect to product list or detail
- **Expected Results**:
  - API: `POST /api/products` returns new product
  - DB: Product created with `prdSttsCd: 'DRAFT'` or `'ACTV'`
- **Verification Method**: snapshot / network
- **Test Data**: `seller1@yopmail.com` / `Admin@123`, product: "E2E Test Product"

### E2E-008: Seller edits a product
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Seller has existing products
- **User Journey**:
  1. Navigate to `/dashboard/products/my`
  2. Click edit on a product
  3. Change price and description
  4. Save
  5. Verify changes reflected
- **Expected Results**:
  - API: `PATCH /api/products/:id` returns updated product
  - DB: Product record updated
- **Verification Method**: network
- **Test Data**: Existing seller product

### E2E-009: Seller deletes a product
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Seller has a product
- **User Journey**:
  1. Navigate to `/dashboard/products/my`
  2. Click delete on a product
  3. Confirm deletion
  4. Verify product removed from list
- **Expected Results**:
  - API: `DELETE /api/products/:id` returns success
  - DB: `delYn` set to `'Y'` (soft delete)
- **Verification Method**: network
- **Test Data**: Test product created in E2E-007

### E2E-010: Buyer cannot create products
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Logged in as BUYER
- **User Journey**:
  1. Log in as buyer
  2. Attempt to POST /api/products via API
  3. Verify 403 Forbidden
- **Expected Results**:
  - API: `POST /api/products` returns 403
- **Verification Method**: network
- **Test Data**: Buyer token

---

## Summary
| Type | Count |
|------|-------|
| Happy Path | 8 |
| Alternative Path | 0 |
| Edge Case | 0 |
| Error Path | 2 |
| **Total** | **10** |
