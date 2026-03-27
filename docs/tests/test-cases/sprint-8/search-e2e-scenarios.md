# Search Feature E2E Test Scenarios

## Overview
- **Feature**: Combined product + post search with autocomplete suggestions
- **Related Modules**: Search, Product, Board
- **API Endpoints**: `GET /api/search?q=&page=&limit=`, `GET /api/search/suggest?q=`
- **DB Tables**: TB_PROD_PRD, TB_COMM_BOARD_POST
- **Frontend Pages**: Header search bar (global), `/search?q=` results page with Products/Posts tabs
- **Blueprint**: docs/blueprints/012-search/blueprint.md

## Summary Table

| ID | Scenario | Type | Priority | Group |
|----|----------|------|----------|-------|
| E2E-001 | Basic keyword search returns products and posts | Happy | Critical | Basic Search |
| E2E-002 | Search with pagination | Happy | High | Basic Search |
| E2E-003 | Search by product description match | Happy | High | Basic Search |
| E2E-004 | Search by product tag match | Happy | Medium | Basic Search |
| E2E-005 | Case-insensitive search | Alternative | High | Basic Search |
| E2E-006 | Autocomplete returns top 3 products + top 2 posts | Happy | Critical | Autocomplete |
| E2E-007 | Autocomplete max 5 suggestions total | Happy | High | Autocomplete |
| E2E-008 | Autocomplete with single character input | Edge | Medium | Autocomplete |
| E2E-009 | Autocomplete only returns active products | Alternative | High | Autocomplete |
| E2E-010 | Products tab displays product results with seller info | Happy | Critical | Multi-tab Results |
| E2E-011 | Posts tab displays post results with author info | Happy | Critical | Multi-tab Results |
| E2E-012 | Tab switching preserves search query | Happy | High | Multi-tab Results |
| E2E-013 | Product results sorted by soldCnt descending | Happy | High | Multi-tab Results |
| E2E-014 | Post results sorted by rgstDt descending | Happy | Medium | Multi-tab Results |
| E2E-015 | Empty search query returns validation error | Error | High | Empty/No Results |
| E2E-016 | Search with no matching results | Happy | High | Empty/No Results |
| E2E-017 | Suggest with no matching results returns empty array | Happy | Medium | Empty/No Results |
| E2E-018 | Search across 50,000 products responds under 2 seconds | Happy | Critical | Large Dataset Performance |
| E2E-019 | Autocomplete responds under 500ms with large dataset | Happy | Critical | Large Dataset Performance |
| E2E-020 | Pagination performance remains stable on later pages | Alternative | High | Large Dataset Performance |
| E2E-021 | Search with special characters (quotes, ampersand) | Edge | High | Special Characters |
| E2E-022 | Search with Korean characters | Happy | High | Special Characters |
| E2E-023 | Search with SQL injection attempt | Security | Critical | Special Characters |
| E2E-024 | Search with XSS payload in query | Security | Critical | Special Characters |
| E2E-025 | URL parameter sync on search | Happy | High | URL Param Sync |
| E2E-026 | Direct URL access with search params | Happy | Medium | URL Param Sync |

---

## Scenario Group 1: Basic Search

### E2E-001: Basic keyword search returns products and posts
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: DB seeded with products containing "Wireless" in name and posts containing "Wireless" in title
- **User Journey**:
  1. Navigate to homepage
  2. Type "Wireless" in the header search bar
  3. Press Enter or click search button
  4. Observe the search results page at `/search?q=Wireless`
- **Expected Results**:
  - UI: Search results page loads with Products and Posts tabs; product cards display name, price, seller; post cards display title, content snippet (max 150 chars), author
  - API: `GET /api/search?q=Wireless&page=1&limit=12` returns `{ success: true, data: { products: { items: [...], total: N }, posts: { items: [...], total: M } } }`
  - DB: Query matches TB_PROD_PRD.PRD_NM `contains` "Wireless" (case-insensitive, DEL_YN='N', PRD_STTS_CD='ACTV') and TB_COMM_BOARD_POST.POST_TTL `contains` "Wireless" (DEL_YN='N')
  - Server Log: `Search "Wireless" -- N products, M posts`
- **Verification Method**: network / ui-inspection / server-log
- **Test Data**: `{ q: "Wireless", page: 1, limit: 12 }`

### E2E-002: Search with pagination
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: At least 25 products matching "headphone" keyword
- **User Journey**:
  1. Search for "headphone"
  2. Observe first page shows 12 results
  3. Click page 2
  4. Observe next set of results
- **Expected Results**:
  - UI: Page 2 shows different products than page 1; pagination controls update
  - API: `GET /api/search?q=headphone&page=2&limit=12` returns items with `skip=12`, products.total remains consistent across pages
  - DB: Prisma query uses `skip: 12, take: 12`
- **Verification Method**: network / ui-inspection
- **Test Data**: `{ q: "headphone", page: 2, limit: 12 }`

### E2E-003: Search by product description match
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Product with PRD_NM "Alpha Speaker" and PRD_DC containing "noise cancelling technology"
- **User Journey**:
  1. Search for "noise cancelling"
  2. Observe results
- **Expected Results**:
  - UI: "Alpha Speaker" appears in product results
  - API: Response includes product matched via `prdDc contains "noise cancelling"` (case-insensitive)
  - DB: OR clause matches on PRD_DC field
- **Verification Method**: network / ui-inspection
- **Test Data**: `{ q: "noise cancelling" }`

### E2E-004: Search by product tag match
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Product with SRCH_TAGS containing "bluetooth"
- **User Journey**:
  1. Search for "bluetooth"
  2. Observe product appears in results
- **Expected Results**:
  - UI: Tagged product appears in results
  - API: Response includes product matched via `srchTags hasSome ["bluetooth", "Bluetooth", "BLUETOOTH"]`
  - DB: Array field SRCH_TAGS checked with hasSome for lowercase, original, and uppercase variants
- **Verification Method**: network
- **Test Data**: `{ q: "bluetooth" }`

### E2E-005: Case-insensitive search
- **Type**: Alternative Path
- **Priority**: High
- **Preconditions**: Product named "Premium Headphones" exists
- **User Journey**:
  1. Search for "premium headphones" (all lowercase)
  2. Search for "PREMIUM HEADPHONES" (all uppercase)
  3. Search for "PrEmIuM HeAdPhOnEs" (mixed case)
- **Expected Results**:
  - UI: All three searches return the same product
  - API: All three requests return identical product items
  - DB: Prisma `mode: 'insensitive'` applied on PRD_NM, PRD_DC, POST_TTL, POST_CN
- **Verification Method**: network
- **Test Data**: `{ q: "premium headphones" }, { q: "PREMIUM HEADPHONES" }, { q: "PrEmIuM HeAdPhOnEs" }`

---

## Scenario Group 2: Autocomplete / Suggestions

### E2E-006: Autocomplete returns top 3 products + top 2 posts
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: 10+ products and 5+ posts matching prefix "wire"
- **User Journey**:
  1. Click on header search bar
  2. Type "wire"
  3. Observe dropdown suggestions appear
- **Expected Results**:
  - UI: Dropdown shows up to 3 product suggestions (with type indicator) and up to 2 post suggestions
  - API: `GET /api/search/suggest?q=wire` returns `{ success: true, data: { suggestions: [{ type: "product", id, title }, { type: "post", id, title }] } }`
  - DB: Products ordered by SOLD_CNT desc (top 3), posts ordered by RGST_DT desc (top 2), only DEL_YN='N' and PRD_STTS_CD='ACTV' products
- **Verification Method**: network / ui-inspection
- **Test Data**: `{ q: "wire" }`

### E2E-007: Autocomplete max 5 suggestions total
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: 10+ matching products and 10+ matching posts for query "test"
- **User Journey**:
  1. Type "test" in search bar
  2. Count total suggestions in dropdown
- **Expected Results**:
  - UI: Maximum 5 suggestions displayed (3 products + 2 posts)
  - API: Response `suggestions` array length <= 5, sliced after combining products and posts
- **Verification Method**: network / ui-inspection
- **Test Data**: `{ q: "test" }`

### E2E-008: Autocomplete with single character input
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: Products with names starting with "A"
- **User Journey**:
  1. Type "A" in search bar
  2. Observe suggestions
- **Expected Results**:
  - UI: Suggestions appear for single-character query
  - API: `GET /api/search/suggest?q=A` returns valid suggestions (SuggestQueryDto requires min 1 char via @IsNotEmpty)
- **Verification Method**: network
- **Test Data**: `{ q: "A" }`

### E2E-009: Autocomplete only returns active products
- **Type**: Alternative Path
- **Priority**: High
- **Preconditions**: Product "Sold Out Widget" with PRD_STTS_CD='SOLD_OUT', product "Active Widget" with PRD_STTS_CD='ACTV'
- **User Journey**:
  1. Type "Widget" in search bar
  2. Check suggestions
- **Expected Results**:
  - UI: Only "Active Widget" appears in suggestions, not "Sold Out Widget"
  - API: Suggestions contain only products with `prdSttsCd: 'ACTV'` and `delYn: 'N'`
- **Verification Method**: network
- **Test Data**: `{ q: "Widget" }`

---

## Scenario Group 3: Multi-tab Results

### E2E-010: Products tab displays product results with seller info
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Products matching "camera" with associated seller records
- **User Journey**:
  1. Search for "camera"
  2. Click on Products tab
  3. Inspect product card details
- **Expected Results**:
  - UI: Product cards show name, description, price, salePrice (if applicable), imageUrl, soldCount, averageRating, reviewCount, seller name/nickname
  - API: Response `products.items[]` includes formatted fields: `{ id, name, description, price, salePrice, category, imageUrl, stockQuantity, soldCount, averageRating, reviewCount, searchTags, createdAt, seller: { id, name, nickname } }`
- **Verification Method**: network / ui-inspection
- **Test Data**: `{ q: "camera" }`

### E2E-011: Posts tab displays post results with author info
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Board posts matching "review" with associated user records
- **User Journey**:
  1. Search for "review"
  2. Click on Posts tab
  3. Inspect post card details
- **Expected Results**:
  - UI: Post cards show title, content snippet (truncated to 150 chars + "..."), category, views, likes, comments count, pinned status, author name/nickname
  - API: Response `posts.items[]` includes: `{ id, title, content, category, views, likes, comments, pinned, createdAt, author: { id, name, nickname } }`
  - DB: POST_CN truncated to 150 chars in service layer `formatPost()`
- **Verification Method**: network / ui-inspection
- **Test Data**: `{ q: "review" }`

### E2E-012: Tab switching preserves search query
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Search query "laptop" returns both products and posts
- **User Journey**:
  1. Search for "laptop"
  2. View Products tab results
  3. Switch to Posts tab
  4. Switch back to Products tab
- **Expected Results**:
  - UI: Search query "laptop" remains in search bar; URL stays as `/search?q=laptop`; both tabs show correct results without re-fetching
- **Verification Method**: ui-inspection / network
- **Test Data**: `{ q: "laptop" }`

### E2E-013: Product results sorted by soldCnt descending
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Multiple products matching "shirt" with different SOLD_CNT values
- **User Journey**:
  1. Search for "shirt"
  2. Inspect product order in results
- **Expected Results**:
  - API: Products in `products.items[]` are ordered by `soldCnt` descending (best-selling first)
  - DB: Prisma `orderBy: { soldCnt: 'desc' }` applied
- **Verification Method**: network
- **Test Data**: `{ q: "shirt" }`

### E2E-014: Post results sorted by rgstDt descending
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Multiple posts matching "guide" with different RGST_DT values
- **User Journey**:
  1. Search for "guide"
  2. Inspect post order in results
- **Expected Results**:
  - API: Posts in `posts.items[]` are ordered by `rgstDt` descending (newest first)
  - DB: Prisma `orderBy: { rgstDt: 'desc' }` applied
- **Verification Method**: network
- **Test Data**: `{ q: "guide" }`

---

## Scenario Group 4: Empty / No Results

### E2E-015: Empty search query returns validation error
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: None
- **User Journey**:
  1. Call `GET /api/search?q=&page=1&limit=12` directly
- **Expected Results**:
  - API: 400 response with validation error (class-validator @IsNotEmpty on `q` field)
  - UI: Search bar does not submit when empty; button disabled or no-op
- **Verification Method**: network
- **Test Data**: `{ q: "" }`

### E2E-016: Search with no matching results
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: No products or posts matching "zzzznonexistentkeywordxxx"
- **User Journey**:
  1. Search for "zzzznonexistentkeywordxxx"
  2. Observe results page
- **Expected Results**:
  - UI: "No results found" empty state displayed for both tabs
  - API: Response returns `{ products: { items: [], total: 0 }, posts: { items: [], total: 0 } }`
  - Server Log: `Search "zzzznonexistentkeywordxxx" -- 0 products, 0 posts`
- **Verification Method**: network / ui-inspection / server-log
- **Test Data**: `{ q: "zzzznonexistentkeywordxxx" }`

### E2E-017: Suggest with no matching results returns empty array
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: No products or posts matching prefix "zzz999"
- **User Journey**:
  1. Type "zzz999" in search bar
  2. Observe dropdown
- **Expected Results**:
  - UI: No suggestion dropdown shown (or empty state)
  - API: `GET /api/search/suggest?q=zzz999` returns `{ suggestions: [] }`
- **Verification Method**: network
- **Test Data**: `{ q: "zzz999" }`

---

## Scenario Group 5: Large Dataset Performance

### E2E-018: Search across 50,000 products responds under 2 seconds
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: DB seeded with 50,000 products across various categories; PostgreSQL text search indexes on PRD_NM, PRD_DC
- **User Journey**:
  1. Search for "premium" (broad keyword matching ~500 products)
  2. Measure response time
- **Expected Results**:
  - API: Response time < 2000ms for `GET /api/search?q=premium&page=1&limit=12`
  - DB: Query plan uses index scan; only 12 rows returned despite large total
- **Verification Method**: network (response timing) / db-query (EXPLAIN ANALYZE)
- **Test Data**: `{ q: "premium", page: 1, limit: 12 }`

### E2E-019: Autocomplete responds under 500ms with large dataset
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: DB seeded with 50,000 products
- **User Journey**:
  1. Type "cam" in search bar
  2. Measure time until suggestions appear
- **Expected Results**:
  - API: `GET /api/search/suggest?q=cam` responds in < 500ms
  - DB: Suggest query uses `take: 3` for products and `take: 2` for posts, limiting scan
- **Verification Method**: network (response timing)
- **Test Data**: `{ q: "cam" }`

### E2E-020: Pagination performance remains stable on later pages
- **Type**: Alternative Path
- **Priority**: High
- **Preconditions**: 50,000 products; query "product" matches 10,000+ results
- **User Journey**:
  1. Search for "product" page 1
  2. Search for "product" page 100
  3. Compare response times
- **Expected Results**:
  - API: Page 100 (`skip: 1188, take: 12`) response time < 3000ms; no exponential slowdown
  - DB: Offset pagination performance within acceptable bounds
- **Verification Method**: network (response timing)
- **Test Data**: `{ q: "product", page: 100, limit: 12 }`

---

## Scenario Group 6: Special Characters

### E2E-021: Search with special characters (quotes, ampersand)
- **Type**: Edge Case
- **Priority**: High
- **Preconditions**: Product named `Rock & Roll T-Shirt` exists
- **User Journey**:
  1. Search for `Rock & Roll`
  2. Search for `"wireless"`
  3. Search for `headphones (over-ear)`
- **Expected Results**:
  - UI: Results display correctly without rendering errors
  - API: Special characters properly URL-encoded; Prisma `contains` handles them safely
  - DB: No SQL injection; query treated as literal string match
- **Verification Method**: network / ui-inspection
- **Test Data**: `{ q: "Rock & Roll" }, { q: "\"wireless\"" }, { q: "headphones (over-ear)" }`

### E2E-022: Search with Korean characters
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Product named "무선 이어폰" exists, post titled "무선 이어폰 리뷰" exists
- **User Journey**:
  1. Search for "무선 이어폰"
  2. Observe results
- **Expected Results**:
  - UI: Korean product and post appear in respective tabs
  - API: UTF-8 encoded query processed correctly; case-insensitive mode works with Korean
- **Verification Method**: network / ui-inspection
- **Test Data**: `{ q: "무선 이어폰" }`

### E2E-023: Search with SQL injection attempt
- **Type**: Security
- **Priority**: Critical
- **Preconditions**: Standard DB state
- **User Journey**:
  1. Search for `'; DROP TABLE "TB_PROD_PRD"; --`
  2. Search for `" OR 1=1 --`
- **Expected Results**:
  - UI: No results or empty state shown; no error page
  - API: Returns normal response `{ products: { items: [], total: 0 }, posts: { items: [], total: 0 } }` (Prisma parameterized queries prevent injection)
  - DB: Tables remain intact; no data loss
- **Verification Method**: network / db-query (verify table exists)
- **Test Data**: `{ q: "'; DROP TABLE \"TB_PROD_PRD\"; --" }`

### E2E-024: Search with XSS payload in query
- **Type**: Security
- **Priority**: Critical
- **Preconditions**: Standard DB state
- **User Journey**:
  1. Search for `<script>alert('xss')</script>`
  2. Observe search results page
- **Expected Results**:
  - UI: XSS payload rendered as plain text in search bar and URL, not executed; no JavaScript alert
  - API: Query string treated as literal text; no HTML interpretation
- **Verification Method**: ui-inspection / network
- **Test Data**: `{ q: "<script>alert('xss')</script>" }`

---

## Scenario Group 7: URL Parameter Sync

### E2E-025: URL parameter sync on search
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: None
- **User Journey**:
  1. Type "shoes" in header search bar and press Enter
  2. Verify URL changes to `/search?q=shoes`
  3. Modify search to "boots" and press Enter
  4. Verify URL updates to `/search?q=boots`
  5. Click browser back button
  6. Verify URL returns to `/search?q=shoes` and results refresh
- **Expected Results**:
  - UI: Search bar text matches URL `q` param at all times; back/forward navigation works correctly
  - API: New API calls triggered on each URL change
- **Verification Method**: ui-inspection / network
- **Test Data**: `{ q: "shoes" }, { q: "boots" }`

### E2E-026: Direct URL access with search params
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Products matching "jacket" exist
- **User Journey**:
  1. Navigate directly to `/search?q=jacket&page=2&limit=12`
  2. Observe page state
- **Expected Results**:
  - UI: Search bar pre-filled with "jacket"; results page shows page 2; pagination control highlights page 2
  - API: `GET /api/search?q=jacket&page=2&limit=12` called on page load
- **Verification Method**: ui-inspection / network
- **Test Data**: `{ q: "jacket", page: 2, limit: 12 }`
