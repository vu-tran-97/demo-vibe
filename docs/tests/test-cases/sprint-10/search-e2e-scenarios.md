# Search E2E Test Scenarios — Sprint 10

## Overview
- **Feature**: Global search across products and posts, autocomplete suggestions, recent searches
- **Related Modules**: Product, Board
- **API Endpoints**: GET /api/search?q=, GET /api/search/suggest?q=
- **Search Pages**: /dashboard/search, / (global search bar in header)
- **DB Tables**: Product, Post
- **Blueprint**: docs/blueprints/010-search-filter/blueprint.md
- **Production Frontend**: https://demo-vibe-production.up.railway.app
- **Production Backend**: https://demo-vibe-backend-production.up.railway.app

### Test Accounts
| Account | Email | Password | Role |
|---------|-------|----------|------|
| Admin | admin@astratech.vn | Admin@123 | SUPER_ADMIN |
| Seller | seller1000@yopmail.com | Seller1000@123 | SELLER |

---

## Scenario Group 1: Keyword Search from Homepage

### E2E-001: Search products by keyword from homepage
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Homepage loaded, products exist in DB with keyword "ceramic"
- **User Journey**:
  1. Navigate to https://demo-vibe-production.up.railway.app/
  2. Click the global search bar in the header
  3. Type "ceramic"
  4. Press Enter or click the search icon
  5. Verify redirect to search results page
  6. Verify product cards containing "ceramic" are displayed
- **Expected Results**:
  - UI: Search results page loads with product cards matching "ceramic"
  - API: GET /api/search?q=ceramic returns 200 with non-empty results array
  - URL: /dashboard/search?q=ceramic
- **Verification Method**: snapshot / network
- **Test Data**: keyword = "ceramic"

### E2E-002: Search posts by keyword from homepage
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Homepage loaded, posts exist in DB with keyword "review"
- **User Journey**:
  1. Navigate to /
  2. Type "review" in the global search bar
  3. Submit search
  4. Verify search results page loads
  5. Switch to Posts tab
  6. Verify post results containing "review" are displayed
- **Expected Results**:
  - UI: Posts tab shows matching post entries
  - API: GET /api/search?q=review returns 200 with post results
- **Verification Method**: snapshot / network
- **Test Data**: keyword = "review"

### E2E-003: Search with no results
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: Homepage loaded
- **User Journey**:
  1. Type "xyznonexistent99999" in the global search bar
  2. Submit search
  3. Verify "no results" empty state is displayed
- **Expected Results**:
  - UI: "No results found" message or empty state illustration
  - API: GET /api/search?q=xyznonexistent99999 returns 200 with empty results array
- **Verification Method**: snapshot / network
- **Test Data**: keyword = "xyznonexistent99999"

### E2E-004: Search with empty query
- **Type**: Edge Case
- **Priority**: Low
- **Preconditions**: Homepage loaded
- **User Journey**:
  1. Click the search bar
  2. Press Enter without typing any text
  3. Verify behavior — no navigation or validation message shown
- **Expected Results**:
  - UI: No navigation occurs, or search is blocked with a hint (e.g., "Please enter a search term")
  - API: No API call made, or GET /api/search?q= returns 200 with empty results
- **Verification Method**: snapshot / network

---

## Scenario Group 2: Autocomplete Suggestions

### E2E-005: Autocomplete dropdown appears while typing
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Homepage loaded, products/posts exist with terms starting with "tea"
- **User Journey**:
  1. Click the global search bar
  2. Type "tea" slowly (character by character)
  3. Verify suggestion dropdown appears after a short debounce
  4. Verify suggestions contain terms matching "tea"
- **Expected Results**:
  - UI: Dropdown list with suggestion items appears below the search bar
  - API: GET /api/search/suggest?q=tea returns 200 with suggestions array
- **Verification Method**: snapshot / network
- **Test Data**: keyword = "tea"

### E2E-006: Select an autocomplete suggestion
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Suggestions dropdown is visible with results
- **User Journey**:
  1. Type "tea" in the search bar
  2. Wait for suggestions to appear
  3. Click on the first suggestion item
  4. Verify search results page loads with the selected suggestion as query
- **Expected Results**:
  - UI: Search results page loads with results for the selected term
  - API: GET /api/search?q={selectedTerm} returns 200
- **Verification Method**: snapshot / network
- **Test Data**: keyword = "tea", select first suggestion

### E2E-007: Autocomplete with no matching suggestions
- **Type**: Edge Case
- **Priority**: Low
- **Preconditions**: Homepage loaded
- **User Journey**:
  1. Type "zzzznosuggestion" in the search bar
  2. Verify suggestion dropdown does not appear or shows empty state
- **Expected Results**:
  - UI: No dropdown, or dropdown with "No suggestions" message
  - API: GET /api/search/suggest?q=zzzznosuggestion returns 200 with empty suggestions
- **Verification Method**: snapshot / network
- **Test Data**: keyword = "zzzznosuggestion"

---

## Scenario Group 3: Special Characters and Edge Cases

### E2E-008: Search with special characters
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: Homepage loaded
- **User Journey**:
  1. Type `<script>alert('xss')</script>` in the search bar
  2. Submit search
  3. Verify no script execution occurs
  4. Verify search results page loads safely (no results or sanitized query)
- **Expected Results**:
  - UI: No XSS — page renders safely with no alert popup
  - API: GET /api/search?q=... returns 200 (query is URL-encoded/sanitized)
- **Verification Method**: snapshot / console
- **Test Data**: keyword = `<script>alert('xss')</script>`

### E2E-009: Search with Korean characters
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Homepage loaded, products or posts with Korean text exist
- **User Journey**:
  1. Type a Korean keyword in the search bar
  2. Submit search
  3. Verify results containing the Korean keyword are displayed
- **Expected Results**:
  - UI: Matching results displayed correctly with Korean text
  - API: GET /api/search?q={encodedKorean} returns 200
- **Verification Method**: snapshot / network
- **Test Data**: keyword = Korean product/post title

### E2E-010: Search with very long query string
- **Type**: Edge Case
- **Priority**: Low
- **Preconditions**: Homepage loaded
- **User Journey**:
  1. Paste a 500-character string into the search bar
  2. Submit search
  3. Verify no crash — either results or empty state shown
- **Expected Results**:
  - UI: Page does not crash; shows results or empty state
  - API: Returns 200 or 400 (query too long) gracefully
- **Verification Method**: snapshot / network / console
- **Test Data**: 500-character random string

---

## Scenario Group 4: Product/Post Tabs on Search Results Page

### E2E-011: Switch between Products and Posts tabs
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in, search results page loaded with results in both categories
- **User Journey**:
  1. Navigate to /dashboard/search?q=test
  2. Verify Products tab is active by default
  3. Click Posts tab
  4. Verify post results are displayed
  5. Click Products tab
  6. Verify product results are displayed again
- **Expected Results**:
  - UI: Tab switching works — content updates to show the correct category
  - API: Same search API called; results filtered by tab on the frontend
- **Verification Method**: snapshot / network

### E2E-012: Products tab shows product cards with correct info
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Search results page with product results
- **User Journey**:
  1. Search for a known product keyword
  2. Verify Products tab shows product cards with image, name, price
  3. Click on a product card
  4. Verify redirect to product detail page
- **Expected Results**:
  - UI: Product cards display name, image, price; clicking navigates to /products/{id}
- **Verification Method**: snapshot / network

### E2E-013: Posts tab shows post entries with correct info
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Search results page with post results
- **User Journey**:
  1. Search for a known post keyword
  2. Switch to Posts tab
  3. Verify post entries display title, author, date
  4. Click on a post entry
  5. Verify redirect to post detail page
- **Expected Results**:
  - UI: Post entries display title, author, date; clicking navigates to /board/{id}
- **Verification Method**: snapshot / network

---

## Scenario Group 5: Search + Filter Combo

### E2E-014: Search with category filter applied
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in, on dashboard search page, category filter available
- **User Journey**:
  1. Navigate to /dashboard/search?q=bag
  2. Apply a category filter (e.g., "Accessories")
  3. Verify results are narrowed to products in the selected category
- **Expected Results**:
  - UI: Only products matching both "bag" keyword and "Accessories" category are shown
  - API: GET /api/search?q=bag with additional filter params returns filtered results
- **Verification Method**: snapshot / network
- **Test Data**: keyword = "bag", category = "Accessories"

### E2E-015: Search with price range filter
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Search results page loaded with product results
- **User Journey**:
  1. Search for a broad keyword (e.g., "product")
  2. Set price range filter (e.g., min=10, max=100)
  3. Verify displayed products fall within the price range
- **Expected Results**:
  - UI: Product prices are all within the specified range
  - API: Filtered results returned with price constraints
- **Verification Method**: snapshot / network
- **Test Data**: keyword = "product", minPrice = 10, maxPrice = 100

### E2E-016: Clear all filters resets search results
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Search results page with active filters
- **User Journey**:
  1. Search with keyword and apply a filter
  2. Click "Clear Filters" or remove all filter chips
  3. Verify results reset to unfiltered keyword search
- **Expected Results**:
  - UI: All filters cleared, full search results for the keyword displayed
- **Verification Method**: snapshot / network

---

## Scenario Group 6: Recent Searches

### E2E-017: Recent searches appear when focusing search bar
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: User has performed at least one previous search
- **User Journey**:
  1. Perform a search for "ceramic"
  2. Navigate back to the homepage
  3. Click the search bar
  4. Verify "Recent Searches" section appears with "ceramic" listed
- **Expected Results**:
  - UI: Recent searches dropdown shows previously searched terms
- **Verification Method**: snapshot
- **Test Data**: Previous search = "ceramic"

### E2E-018: Click a recent search to re-execute
- **Type**: Happy Path
- **Priority**: Low
- **Preconditions**: Recent searches visible in dropdown
- **User Journey**:
  1. Click the search bar to show recent searches
  2. Click on a recent search term
  3. Verify search results page loads with that term
- **Expected Results**:
  - UI: Search results page loads for the clicked recent term
  - API: GET /api/search?q={recentTerm} returns 200
- **Verification Method**: snapshot / network

### E2E-019: Clear recent searches
- **Type**: Alternative Path
- **Priority**: Low
- **Preconditions**: Recent searches exist
- **User Journey**:
  1. Click the search bar
  2. Click "Clear" or "Clear All" in the recent searches section
  3. Verify recent searches are removed
  4. Click search bar again — verify empty
- **Expected Results**:
  - UI: Recent searches section is empty or hidden
- **Verification Method**: snapshot

---

## Summary
| Type | Count |
|------|-------|
| Happy Path | 13 |
| Alternative Path | 1 |
| Edge Case | 5 |
| Error Path | 0 |
| **Total** | **19** |
