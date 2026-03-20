# Search & Filter E2E Test Scenarios (Sprint 6)

## Overview
- **Feature**: Global search, autocomplete, product filtering
- **Related Modules**: search, product, board
- **API Endpoints**: `/api/search`, `/api/search/suggest`, `/api/products`
- **DB Tables**: TB_PROD_PRD, TB_COMM_BOARD_POST
- **Blueprint**: docs/blueprints/010-search-filter/

## Scenario Group 1: Global Search

### E2E-001: Search returns products and posts
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Products and posts seeded with matching content
- **User Journey**:
  1. Navigate to `/` or `/dashboard`
  2. Type "craft" in search bar
  3. Press Enter
  4. Verify results page shows products and posts matching "craft"
- **Expected Results**:
  - API: `GET /api/search?q=craft` returns products and posts
  - UI: Results displayed with tabs or sections
- **Verification Method**: snapshot / network
- **Test Data**: Search: "craft"

### E2E-002: Autocomplete suggestions
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Products with searchable names
- **User Journey**:
  1. Start typing "cer" in search bar
  2. Wait 300ms (debounce)
  3. Verify dropdown with suggestions appears
- **Expected Results**:
  - API: `GET /api/search/suggest?q=cer` returns suggestions
  - UI: Dropdown with matching suggestions
- **Verification Method**: snapshot / network
- **Test Data**: Partial term: "cer"

### E2E-003: Empty search results
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: None
- **User Journey**:
  1. Search for "zzzznonexistent"
  2. Verify empty state message
- **Expected Results**:
  - API: `GET /api/search?q=zzzznonexistent` returns empty arrays
  - UI: "No results found" message
- **Verification Method**: snapshot / network
- **Test Data**: Search: "zzzznonexistent"

### E2E-004: Search with special characters
- **Type**: Edge Case
- **Priority**: Low
- **Preconditions**: None
- **User Journey**:
  1. Search for `<script>alert('xss')</script>`
  2. Verify no XSS, empty results or sanitized input
- **Expected Results**:
  - API: No server error, returns empty or sanitized results
  - UI: No script execution, safe display
- **Verification Method**: snapshot / network / console
- **Test Data**: XSS payload

## Scenario Group 2: Product Filtering

### E2E-005: Filter by price range
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Products with varying prices
- **User Journey**:
  1. Navigate to product listing
  2. Set min price: 10, max price: 50
  3. Verify only products in range shown
- **Expected Results**:
  - API: `GET /api/products?minPrice=10&maxPrice=50`
  - UI: Filtered product grid
- **Verification Method**: network
- **Test Data**: Price range: $10-$50

### E2E-006: Sort by multiple criteria
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Products seeded
- **User Journey**:
  1. Navigate to product listing
  2. Sort by "Newest"
  3. Verify newest products first
  4. Switch to "Price: High to Low"
  5. Verify highest price first
- **Expected Results**:
  - API: `GET /api/products?sort=newest`, then `?sort=price-high`
  - UI: Order changes accordingly
- **Verification Method**: network
- **Test Data**: Default products

---

## Summary
| Type | Count |
|------|-------|
| Happy Path | 4 |
| Alternative Path | 0 |
| Edge Case | 2 |
| Error Path | 0 |
| **Total** | **6** |
