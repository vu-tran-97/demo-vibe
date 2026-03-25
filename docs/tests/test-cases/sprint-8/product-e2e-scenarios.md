# Product E2E Test Scenarios (Sprint 8)

## Overview
- **Feature**: Product listing with Load More (50K dataset), filtering/sorting, seller CRUD, status lifecycle, large dataset performance, security
- **Related Modules**: product, search, auth, order
- **API Endpoints**: `POST /api/products`, `GET /api/products`, `GET /api/products/my`, `GET /api/products/:id`, `PATCH /api/products/:id`, `PATCH /api/products/:id/status`, `DELETE /api/products/:id`
- **DB Table**: TB_PROD_PRD (Product)
- **Blueprint**: docs/blueprints/004-product/
- **Tech Stack**: NestJS + Next.js 15 + Firebase Auth + PostgreSQL + Prisma
- **Dataset**: 50,000 products, 4 sellers, 6 categories (CERAMICS, TEXTILES, ART, JEWELRY, HOME, FOOD)

---

## Scenario Group 1: Product Listing with Load More (50K Dataset)

### E2E-001: Initial homepage load displays first 24 products
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: 50,000 products seeded in DB, statuses = ACTV
- **User Journey**:
  1. Navigate to `/`
  2. Verify product grid renders 24 product cards
  3. Verify each card shows: image, name, price, category badge
  4. Verify "Load More" button is visible at bottom
  5. Verify total product count or "showing N of M" indicator
- **Expected Results**:
  - UI: 24 product cards displayed in a responsive grid; "Load More" button visible
  - API: `GET /api/products?page=1&limit=24` returns `{ success: true, data: [...24 items], meta: { total: 50000, page: 1 } }`
  - DB: No write operations; only SELECT query with LIMIT 24
  - Server Log: Response time < 500ms for initial page load
- **Verification Method**: snapshot / network / performance timing
- **Test Data**: Seeded 50,000 products across 6 categories

### E2E-002: Load More fetches next page of products
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Homepage loaded with 24 products displayed
- **User Journey**:
  1. Scroll to bottom of homepage product grid
  2. Click "Load More" button
  3. Verify 24 additional products appended below existing ones
  4. Verify total displayed count is now 48
  5. Verify "Load More" button remains visible (more pages exist)
- **Expected Results**:
  - UI: 48 product cards total; new 24 appended without removing existing ones
  - API: `GET /api/products?page=2&limit=24` returns next 24 items
  - DB: SELECT with OFFSET 24 LIMIT 24
- **Verification Method**: network / DOM element count
- **Test Data**: Default product listing

### E2E-003: Multiple consecutive Load More clicks
- **Type**: Alternative Path
- **Priority**: High
- **Preconditions**: Homepage loaded
- **User Journey**:
  1. Click "Load More" 4 consecutive times (pages 2-5)
  2. Verify products accumulate: 48, 72, 96, 120
  3. Verify no duplicate products across pages
  4. Verify scroll position preserved between loads
- **Expected Results**:
  - UI: 120 unique product cards after 4 loads; no duplicates
  - API: Sequential requests page=2 through page=5, each returning 24 items
  - DB: No duplicate IDs across paginated results
- **Verification Method**: network / DOM inspection for duplicate keys
- **Test Data**: Default product listing

### E2E-004: Load More with active filters applied
- **Type**: Alternative Path
- **Priority**: High
- **Preconditions**: Category filter applied (e.g., CERAMICS)
- **User Journey**:
  1. Navigate to `/`
  2. Select category filter "CERAMICS"
  3. Verify filtered results displayed (24 items)
  4. Click "Load More"
  5. Verify next page also contains only CERAMICS products
- **Expected Results**:
  - UI: All 48 displayed products belong to CERAMICS category
  - API: `GET /api/products?category=CERAMICS&page=2&limit=24`
  - DB: WHERE clause includes `PRD_CTGR_CD = 'CERAMICS'` with correct pagination
- **Verification Method**: network / verify category field on all cards
- **Test Data**: CERAMICS products subset

### E2E-005: Load More reaches end of results
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: Applied filter returning fewer than 48 results (e.g., a narrow price + category combo)
- **User Journey**:
  1. Apply restrictive filters (e.g., category=JEWELRY, minPrice=50000, maxPrice=60000)
  2. First page loads with fewer than 24 results or exactly 24
  3. Click "Load More" until no more results
  4. Verify "Load More" button disappears or shows "No more products"
- **Expected Results**:
  - UI: "Load More" button hidden or disabled when no more pages
  - API: Final page returns fewer than 24 items; `meta.page * meta.limit >= meta.total`
- **Verification Method**: network / UI state
- **Test Data**: Filtered product subset with known limited count

---

## Scenario Group 2: Product Filtering & Sorting

### E2E-006: Filter by single category
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Products seeded across 6 categories
- **User Journey**:
  1. Navigate to `/`
  2. Click category filter "TEXTILES"
  3. Verify all displayed products have category = TEXTILES
  4. Verify product count updates
- **Expected Results**:
  - UI: Only TEXTILES products shown; category filter visually active
  - API: `GET /api/products?category=TEXTILES&page=1&limit=24`
  - DB: `WHERE PRD_CTGR_CD = 'TEXTILES' AND DEL_YN = 'N' AND PRD_STTS_CD = 'ACTV'`
- **Verification Method**: network / card inspection
- **Test Data**: Category: "TEXTILES"

### E2E-007: Filter by multiple categories
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Products seeded across 6 categories
- **User Journey**:
  1. Navigate to `/`
  2. Select categories "CERAMICS" and "ART"
  3. Verify displayed products belong to either CERAMICS or ART
- **Expected Results**:
  - UI: Products from both selected categories shown
  - API: `GET /api/products?categories=CERAMICS,ART&page=1&limit=24`
  - DB: `WHERE PRD_CTGR_CD IN ('CERAMICS', 'ART')`
- **Verification Method**: network / card category badges
- **Test Data**: Categories: "CERAMICS,ART"

### E2E-008: Filter by price range
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Products with prices ranging from 1,000 to 500,000
- **User Journey**:
  1. Navigate to `/`
  2. Set minimum price = 10000, maximum price = 50000
  3. Apply filter
  4. Verify all displayed products have price within 10,000-50,000 range
- **Expected Results**:
  - UI: All visible product prices between 10,000 and 50,000
  - API: `GET /api/products?minPrice=10000&maxPrice=50000&page=1&limit=24`
  - DB: `WHERE PRD_PRC >= 10000 AND PRD_PRC <= 50000`
- **Verification Method**: network / price value inspection
- **Test Data**: minPrice=10000, maxPrice=50000

### E2E-009: Filter by minimum rating
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Products with varying avgRtng values
- **User Journey**:
  1. Navigate to `/`
  2. Set minimum rating = 4
  3. Apply filter
  4. Verify all displayed products have rating >= 4.0
- **Expected Results**:
  - UI: All visible products show 4+ star rating
  - API: `GET /api/products?minRating=4&page=1&limit=24`
  - DB: `WHERE AVG_RTNG >= 4`
- **Verification Method**: network / rating display inspection
- **Test Data**: minRating=4

### E2E-010: Filter in-stock only
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Mix of in-stock and out-of-stock products
- **User Journey**:
  1. Navigate to `/`
  2. Toggle "In Stock Only" filter
  3. Verify all displayed products have stock > 0
- **Expected Results**:
  - UI: No "Out of Stock" badges visible; all products purchasable
  - API: `GET /api/products?inStock=true&page=1&limit=24`
  - DB: `WHERE STCK_QTY > 0`
- **Verification Method**: network / stock indicator inspection
- **Test Data**: inStock=true

### E2E-011: Text search across product name and tags
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Products with known names and search tags
- **User Journey**:
  1. Navigate to `/`
  2. Enter "handmade ceramic" in search bar
  3. Submit search
  4. Verify results contain products matching "handmade" or "ceramic" in name or tags
- **Expected Results**:
  - UI: Filtered products with search term highlighted or matching
  - API: `GET /api/products?search=handmade+ceramic&page=1&limit=24`
  - DB: Full-text or LIKE search on PRD_NM and SRCH_TAGS
- **Verification Method**: network / result relevance
- **Test Data**: Search term: "handmade ceramic"

### E2E-012: Sort by popular (highest soldCnt)
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Products with varying soldCnt values
- **User Journey**:
  1. Navigate to `/`
  2. Select sort option "Popular"
  3. Verify products ordered by soldCnt descending
- **Expected Results**:
  - UI: First product has highest sales count; order is descending
  - API: `GET /api/products?sort=popular&page=1&limit=24`
  - DB: `ORDER BY SOLD_CNT DESC`
- **Verification Method**: network / compare soldCnt values in response
- **Test Data**: Default listing

### E2E-013: Sort by newest
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Products with varying creation dates
- **User Journey**:
  1. Navigate to `/`
  2. Select sort option "Newest"
  3. Verify products ordered by creation date descending
- **Expected Results**:
  - UI: Most recently created products first
  - API: `GET /api/products?sort=newest&page=1&limit=24`
  - DB: `ORDER BY RGST_DT DESC`
- **Verification Method**: network / compare rgstDt values
- **Test Data**: Default listing

### E2E-014: Sort by price low to high
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Products with varying prices
- **User Journey**:
  1. Navigate to `/`
  2. Select sort option "Price: Low to High"
  3. Verify products ordered by price ascending
- **Expected Results**:
  - UI: Cheapest products first
  - API: `GET /api/products?sort=price-low&page=1&limit=24`
  - DB: `ORDER BY PRD_PRC ASC`
- **Verification Method**: network / sequential price comparison
- **Test Data**: Default listing

### E2E-015: Sort by price high to low
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Products with varying prices
- **User Journey**:
  1. Navigate to `/`
  2. Select sort option "Price: High to Low"
  3. Verify products ordered by price descending
- **Expected Results**:
  - UI: Most expensive products first
  - API: `GET /api/products?sort=price-high&page=1&limit=24`
  - DB: `ORDER BY PRD_PRC DESC`
- **Verification Method**: network / sequential price comparison
- **Test Data**: Default listing

### E2E-016: Sort by rating
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Products with varying avgRtng values
- **User Journey**:
  1. Navigate to `/`
  2. Select sort option "Rating"
  3. Verify products ordered by average rating descending
- **Expected Results**:
  - UI: Highest-rated products first
  - API: `GET /api/products?sort=rating&page=1&limit=24`
  - DB: `ORDER BY AVG_RTNG DESC`
- **Verification Method**: network / sequential rating comparison
- **Test Data**: Default listing

### E2E-017: Combined filter + sort + Load More
- **Type**: Alternative Path
- **Priority**: High
- **Preconditions**: Products seeded
- **User Journey**:
  1. Navigate to `/`
  2. Select category "HOME"
  3. Set minPrice=5000, maxPrice=100000
  4. Select sort "Price: Low to High"
  5. Verify 24 filtered and sorted products
  6. Click "Load More"
  7. Verify next 24 products also match filters and sort order
- **Expected Results**:
  - UI: All products are HOME category, price 5,000-100,000, sorted ascending
  - API: `GET /api/products?category=HOME&minPrice=5000&maxPrice=100000&sort=price-low&page=2&limit=24`
  - DB: WHERE + ORDER BY + OFFSET correctly combined
- **Verification Method**: network / card inspection across pages
- **Test Data**: category=HOME, minPrice=5000, maxPrice=100000, sort=price-low

### E2E-018: Clear all filters resets to default listing
- **Type**: Alternative Path
- **Priority**: Medium
- **Preconditions**: Filters currently applied
- **User Journey**:
  1. Apply category filter, price range, and sort
  2. Click "Clear Filters" or reset button
  3. Verify product listing returns to default (no filters, default sort)
- **Expected Results**:
  - UI: All filter controls reset; full product listing displayed
  - API: `GET /api/products?page=1&limit=24` (no filter params)
- **Verification Method**: network / UI state
- **Test Data**: Reset from filtered state

### E2E-019: Search with no matching results
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: Products seeded
- **User Journey**:
  1. Navigate to `/`
  2. Search for "xyznonexistent12345"
  3. Verify empty state displayed
- **Expected Results**:
  - UI: "No products found" empty state message; "Load More" button hidden
  - API: `GET /api/products?search=xyznonexistent12345` returns `{ data: [], meta: { total: 0 } }`
- **Verification Method**: network / UI state
- **Test Data**: Search term: "xyznonexistent12345"

---

## Scenario Group 3: Product CRUD (Seller)

### E2E-020: Seller creates a product with all fields
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as SELLER role
- **User Journey**:
  1. Log in as seller (`seller1@yopmail.com` / `Admin@123`)
  2. Navigate to `/dashboard/products/create`
  3. Fill form: name="Sprint 8 Test Vase", description="Handcrafted ceramic vase", price=35000, category=CERAMICS, imageUrl="https://example.com/vase.jpg", stock=50
  4. Click "Create Product"
  5. Verify redirect to seller's product list
  6. Verify new product appears in the list
- **Expected Results**:
  - UI: Success toast; redirect to product list; new product visible
  - API: `POST /api/products` returns `{ success: true, data: { id: N, prdNm: "Sprint 8 Test Vase", prdSttsCd: "ACTV" } }`
  - DB: New row in TB_PROD_PRD with SLLR_ID matching seller, DEL_YN='N', VIEW_CNT=0, SOLD_CNT=0
  - Server Log: `Product created: id=N, seller=<sellerId>`
- **Verification Method**: network / DB query / UI snapshot
- **Test Data**: seller1@yopmail.com, product name="Sprint 8 Test Vase"

### E2E-021: Seller views their own product list
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as SELLER with existing products
- **User Journey**:
  1. Log in as seller
  2. Navigate to `/dashboard/products`
  3. Verify product list shows only seller's own products
  4. Verify traditional pagination (not Load More) with page numbers
  5. Navigate to page 2
- **Expected Results**:
  - UI: Product table/list with pagination controls (page numbers); only seller's products shown
  - API: `GET /api/products/my?page=1&limit=12` returns seller's products
  - DB: `WHERE SLLR_ID = <sellerId> AND DEL_YN = 'N'`
- **Verification Method**: network / verify all returned products have same sellerId
- **Test Data**: Seller account with 30+ products

### E2E-022: Seller updates product details
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as SELLER; product exists owned by this seller
- **User Journey**:
  1. Log in as seller
  2. Navigate to `/dashboard/products`
  3. Click "Edit" on an existing product
  4. Change price from 35000 to 29000
  5. Update description to "Updated description for sprint 8"
  6. Click "Save"
  7. Verify updated values displayed
- **Expected Results**:
  - UI: Success toast; updated price and description shown
  - API: `PATCH /api/products/:id` returns updated product
  - DB: PRD_PRC=29000, PRD_DC="Updated description for sprint 8", MDFCN_DT updated
- **Verification Method**: network / DB query / UI snapshot
- **Test Data**: Existing seller product

### E2E-023: Seller deletes a product (soft delete)
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as SELLER; product exists owned by this seller
- **User Journey**:
  1. Log in as seller
  2. Navigate to `/dashboard/products`
  3. Click "Delete" on a product
  4. Confirm deletion in dialog
  5. Verify product removed from seller's list
  6. Navigate to `/products/:id` for deleted product
  7. Verify product not accessible publicly
- **Expected Results**:
  - UI: Product removed from dashboard list; public detail page shows 404 or not found
  - API: `DELETE /api/products/:id` returns success; subsequent `GET /api/products/:id` returns not found
  - DB: DEL_YN changed from 'N' to 'Y'; row NOT physically deleted
- **Verification Method**: network / DB query (DEL_YN='Y')
- **Test Data**: Existing seller product to delete

### E2E-024: Seller creates product with missing required fields
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Logged in as SELLER
- **User Journey**:
  1. Navigate to `/dashboard/products/create`
  2. Leave product name empty
  3. Click "Create Product"
  4. Verify validation error shown
- **Expected Results**:
  - UI: Inline validation error on name field; form not submitted
  - API: If form submits, `POST /api/products` returns 400 with validation errors
- **Verification Method**: UI state / network
- **Test Data**: Empty product name

### E2E-025: Seller creates product with invalid price (negative)
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: Logged in as SELLER
- **User Journey**:
  1. Navigate to `/dashboard/products/create`
  2. Enter price = -1000
  3. Fill all other required fields
  4. Click "Create Product"
  5. Verify error response
- **Expected Results**:
  - UI: Validation error for price field
  - API: `POST /api/products` returns 400 Bad Request with validation message
  - DB: No product created
- **Verification Method**: network / DB query
- **Test Data**: price=-1000

### E2E-026: Seller creates product with zero stock
- **Type**: Edge Case
- **Priority**: Low
- **Preconditions**: Logged in as SELLER
- **User Journey**:
  1. Navigate to `/dashboard/products/create`
  2. Fill all fields with stock = 0
  3. Click "Create Product"
  4. Verify product created successfully
- **Expected Results**:
  - UI: Product created; shows "Out of Stock" indicator
  - API: `POST /api/products` returns 201 with stckQty=0
  - DB: STCK_QTY=0 in new row
- **Verification Method**: network / DB query
- **Test Data**: stock=0

---

## Scenario Group 4: Product Status Lifecycle

### E2E-027: Change product status from ACTV to HIDDEN
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as SELLER; product exists with prdSttsCd='ACTV'
- **User Journey**:
  1. Log in as seller
  2. Navigate to `/dashboard/products`
  3. Select an active product
  4. Change status to "HIDDEN"
  5. Confirm the change
  6. Verify product no longer appears in public listing
  7. Verify product still visible in seller's dashboard
- **Expected Results**:
  - UI: Status badge updated to "HIDDEN" in dashboard; product absent from homepage
  - API: `PATCH /api/products/:id/status` with `{ status: "HIDDEN" }` returns success
  - API: `GET /api/products` (public) does not include hidden product
  - DB: PRD_STTS_CD='HIDDEN', MDFCN_DT updated
- **Verification Method**: network / public listing verification / DB query
- **Test Data**: Active product owned by seller

### E2E-028: Change product status from ACTV to SOLD_OUT
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SELLER; product exists with prdSttsCd='ACTV'
- **User Journey**:
  1. Log in as seller
  2. Navigate to product management
  3. Change status to "SOLD_OUT"
  4. Verify product visible in public listing but marked as sold out
- **Expected Results**:
  - UI: "Sold Out" badge on product card; "Add to Cart" button disabled on detail page
  - API: `PATCH /api/products/:id/status` with `{ status: "SOLD_OUT" }` returns success
  - DB: PRD_STTS_CD='SOLD_OUT'
- **Verification Method**: network / public detail page UI state
- **Test Data**: Active product

### E2E-029: Change product status from HIDDEN to ACTV (re-activate)
- **Type**: Alternative Path
- **Priority**: High
- **Preconditions**: Logged in as SELLER; product exists with prdSttsCd='HIDDEN'
- **User Journey**:
  1. Log in as seller
  2. Navigate to dashboard; find hidden product
  3. Change status to "ACTV"
  4. Verify product now appears in public listing
- **Expected Results**:
  - UI: Product reappears in public homepage/search results
  - API: `PATCH /api/products/:id/status` with `{ status: "ACTV" }` returns success
  - DB: PRD_STTS_CD='ACTV', MDFCN_DT updated
- **Verification Method**: network / public listing search
- **Test Data**: Hidden product

### E2E-030: Change product status to DRAFT
- **Type**: Alternative Path
- **Priority**: Medium
- **Preconditions**: Logged in as SELLER; product with prdSttsCd='ACTV'
- **User Journey**:
  1. Log in as seller
  2. Change product status to "DRAFT"
  3. Verify product not shown in public listing
  4. Verify product editable in dashboard with "DRAFT" badge
- **Expected Results**:
  - UI: "Draft" badge in dashboard; product excluded from public API
  - API: `PATCH /api/products/:id/status` with `{ status: "DRAFT" }` returns success
  - DB: PRD_STTS_CD='DRAFT'
- **Verification Method**: network / public listing absence / DB query
- **Test Data**: Active product

### E2E-031: Invalid status transition value
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: Logged in as SELLER; product exists
- **User Journey**:
  1. Send API request: `PATCH /api/products/:id/status` with `{ status: "INVALID_STATUS" }`
  2. Verify 400 Bad Request
- **Expected Results**:
  - API: Returns 400 with validation error; status must be one of DRAFT/ACTV/SOLD_OUT/HIDDEN
  - DB: Product status unchanged
- **Verification Method**: API response / DB query
- **Test Data**: status="INVALID_STATUS"

---

## Scenario Group 5: Large Dataset Performance

### E2E-032: Initial page load under 50K products — response time
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: 50,000 products seeded; database indexed on PRD_STTS_CD, PRD_CTGR_CD, RGST_DT
- **User Journey**:
  1. Clear browser cache
  2. Navigate to `/`
  3. Measure Time to First Byte (TTFB) and full page load
  4. Verify product grid renders within acceptable time
- **Expected Results**:
  - API: `GET /api/products?page=1&limit=24` responds in < 300ms (server-side)
  - UI: First Contentful Paint < 1.5s; product grid visible < 2.5s
  - DB: Query uses index scan, not sequential scan
- **Verification Method**: Chrome DevTools Performance tab / server-side timing header
- **Test Data**: 50,000 seeded products

### E2E-033: Category filter query performance on 50K dataset
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: 50,000 products; index on PRD_CTGR_CD
- **User Journey**:
  1. Navigate to `/`
  2. Apply category filter "FOOD"
  3. Measure API response time
- **Expected Results**:
  - API: Response time < 300ms for filtered query
  - DB: Index on PRD_CTGR_CD utilized; EXPLAIN shows Index Scan
- **Verification Method**: network timing / EXPLAIN ANALYZE
- **Test Data**: category=FOOD (~8,333 products per category)

### E2E-034: Text search performance on 50K dataset
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: 50,000 products with searchable names and tags
- **User Journey**:
  1. Navigate to `/`
  2. Search for "handmade"
  3. Measure API response time
- **Expected Results**:
  - API: Response time < 500ms for text search query
  - DB: Text search uses appropriate index or optimized query
- **Verification Method**: network timing
- **Test Data**: search="handmade"

### E2E-035: Pagination to deep page (page 100) on 50K dataset
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: 50,000 products; requesting page 100 (offset 2376)
- **User Journey**:
  1. Send API request: `GET /api/products?page=100&limit=24`
  2. Measure response time
  3. Verify correct 24 products returned for page 100
- **Expected Results**:
  - API: Response time < 500ms even at deep offset
  - API: Returns correct 24 products with proper offset calculation
  - DB: OFFSET 2376 LIMIT 24 executes efficiently
- **Verification Method**: API response timing / data correctness
- **Test Data**: page=100, limit=24

### E2E-036: Combined filters + sort on 50K dataset
- **Type**: Alternative Path
- **Priority**: High
- **Preconditions**: 50,000 products; multiple indexes
- **User Journey**:
  1. Apply: categories=CERAMICS,ART, minPrice=10000, maxPrice=80000, sort=price-low, inStock=true
  2. Measure response time
  3. Verify results are correctly filtered and sorted
- **Expected Results**:
  - API: Response time < 500ms for multi-filter query
  - API: All returned products match all filter criteria and are sorted by price ascending
- **Verification Method**: network timing / response data validation
- **Test Data**: Multi-filter combination

### E2E-037: View count increment under concurrent access
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: Product with known viewCnt; 50K dataset
- **User Journey**:
  1. Record current viewCnt for product ID=1
  2. Open product detail page `/products/1` in 3 browser tabs simultaneously
  3. Verify viewCnt incremented by 3
- **Expected Results**:
  - DB: viewCnt = original + 3 (atomic increment, no lost updates)
  - API: Each `GET /api/products/1` triggers viewCnt increment
- **Verification Method**: DB query before and after
- **Test Data**: Product ID=1, 3 concurrent requests

---

## Scenario Group 6: Security (Unauthorized Create/Edit/Delete)

### E2E-038: Unauthenticated user cannot create product
- **Type**: Security
- **Priority**: Critical
- **Preconditions**: Not logged in (no auth token)
- **User Journey**:
  1. Send `POST /api/products` without Authorization header
  2. Include valid product body
  3. Verify request rejected
- **Expected Results**:
  - API: Returns 401 Unauthorized
  - DB: No product created
  - Server Log: Unauthorized access attempt logged
- **Verification Method**: API response status code / DB query
- **Test Data**: Valid product body, no auth token

### E2E-039: BUYER role cannot create product
- **Type**: Security
- **Priority**: Critical
- **Preconditions**: Logged in as BUYER role
- **User Journey**:
  1. Log in as buyer (`buyer1@yopmail.com` / `Admin@123`)
  2. Send `POST /api/products` with valid product body
  3. Verify request rejected
- **Expected Results**:
  - API: Returns 403 Forbidden
  - DB: No product created
  - Server Log: Forbidden access attempt from BUYER role
- **Verification Method**: API response / DB query
- **Test Data**: buyer1@yopmail.com with BUYER role

### E2E-040: BUYER role cannot access seller dashboard products page
- **Type**: Security
- **Priority**: High
- **Preconditions**: Logged in as BUYER
- **User Journey**:
  1. Log in as buyer
  2. Navigate to `/dashboard/products`
  3. Verify access denied or redirect
- **Expected Results**:
  - UI: Redirect to homepage or "Access Denied" message
  - API: `GET /api/products/my` returns 403 Forbidden
- **Verification Method**: URL redirect / network
- **Test Data**: buyer1@yopmail.com

### E2E-041: Seller cannot edit another seller's product
- **Type**: Security
- **Priority**: Critical
- **Preconditions**: seller1 and seller2 both logged in; product belongs to seller2
- **User Journey**:
  1. Log in as seller1
  2. Send `PATCH /api/products/:id` for a product owned by seller2
  3. Verify request rejected
- **Expected Results**:
  - API: Returns 403 Forbidden or 404 Not Found (ownership check)
  - DB: Product unchanged
- **Verification Method**: API response / DB query
- **Test Data**: seller1 token + seller2's product ID

### E2E-042: Seller cannot delete another seller's product
- **Type**: Security
- **Priority**: Critical
- **Preconditions**: seller1 logged in; product belongs to seller2
- **User Journey**:
  1. Log in as seller1
  2. Send `DELETE /api/products/:id` for seller2's product
  3. Verify request rejected
- **Expected Results**:
  - API: Returns 403 Forbidden or 404 Not Found
  - DB: Product DEL_YN remains 'N'
- **Verification Method**: API response / DB query
- **Test Data**: seller1 token + seller2's product ID

### E2E-043: Seller cannot change status of another seller's product
- **Type**: Security
- **Priority**: Critical
- **Preconditions**: seller1 logged in; product belongs to seller2
- **User Journey**:
  1. Log in as seller1
  2. Send `PATCH /api/products/:id/status` with `{ status: "HIDDEN" }` for seller2's product
  3. Verify request rejected
- **Expected Results**:
  - API: Returns 403 Forbidden or 404 Not Found
  - DB: Product status unchanged
- **Verification Method**: API response / DB query
- **Test Data**: seller1 token + seller2's product ID

### E2E-044: SUPER_ADMIN can create product on behalf of system
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN
- **User Journey**:
  1. Log in as SUPER_ADMIN
  2. Send `POST /api/products` with valid product body
  3. Verify product created successfully
- **Expected Results**:
  - API: Returns 201 with created product
  - DB: Product created with SLLR_ID = admin's user ID
- **Verification Method**: API response / DB query
- **Test Data**: SUPER_ADMIN account

### E2E-045: SUPER_ADMIN can edit any seller's product
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN; product belongs to seller1
- **User Journey**:
  1. Log in as SUPER_ADMIN
  2. Send `PATCH /api/products/:id` for seller1's product
  3. Verify product updated
- **Expected Results**:
  - API: Returns 200 with updated product
  - DB: Product fields updated; MDFR_ID = admin's ID
- **Verification Method**: API response / DB query
- **Test Data**: SUPER_ADMIN token + any seller's product

### E2E-046: SUPER_ADMIN can delete any seller's product
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SUPER_ADMIN; product belongs to seller2
- **User Journey**:
  1. Log in as SUPER_ADMIN
  2. Send `DELETE /api/products/:id` for seller2's product
  3. Verify product soft-deleted
- **Expected Results**:
  - API: Returns 200 success
  - DB: DEL_YN='Y' on seller2's product
- **Verification Method**: API response / DB query
- **Test Data**: SUPER_ADMIN token + seller2's product

### E2E-047: Expired/invalid Firebase token rejected
- **Type**: Security
- **Priority**: Critical
- **Preconditions**: Expired or malformed Firebase ID token
- **User Journey**:
  1. Send `POST /api/products` with expired/malformed Bearer token
  2. Verify request rejected
- **Expected Results**:
  - API: Returns 401 Unauthorized with "Invalid or expired token" message
  - DB: No product created
- **Verification Method**: API response
- **Test Data**: Expired Firebase ID token string

### E2E-048: SQL injection attempt in search parameter
- **Type**: Security
- **Priority**: High
- **Preconditions**: Public access
- **User Journey**:
  1. Send `GET /api/products?search='; DROP TABLE "TB_PROD_PRD"; --`
  2. Verify no data loss; request handled safely
- **Expected Results**:
  - API: Returns 200 with empty results or sanitized search (no SQL execution)
  - DB: TB_PROD_PRD table intact; no data loss
- **Verification Method**: API response / DB table verification
- **Test Data**: Malicious search string

### E2E-049: XSS attempt in product name field
- **Type**: Security
- **Priority**: High
- **Preconditions**: Logged in as SELLER
- **User Journey**:
  1. Log in as seller
  2. Create product with name: `<script>alert('xss')</script>`
  3. View the product detail page
  4. Verify script not executed
- **Expected Results**:
  - UI: Script tag rendered as text or stripped; no alert dialog
  - API: Product created but name sanitized or escaped on output
  - DB: Raw value stored (output encoding preferred over input sanitization)
- **Verification Method**: DOM inspection / no script execution
- **Test Data**: Product name with script tag

---

## Summary

| ID | Scenario | Type | Priority | Group |
|---|---|---|---|---|
| E2E-001 | Initial homepage load — 24 products | Happy Path | Critical | 1. Listing + Load More |
| E2E-002 | Load More fetches next page | Happy Path | Critical | 1. Listing + Load More |
| E2E-003 | Multiple consecutive Load More | Alternative Path | High | 1. Listing + Load More |
| E2E-004 | Load More with active filters | Alternative Path | High | 1. Listing + Load More |
| E2E-005 | Load More reaches end of results | Edge Case | Medium | 1. Listing + Load More |
| E2E-006 | Filter by single category | Happy Path | Critical | 2. Filtering & Sorting |
| E2E-007 | Filter by multiple categories | Happy Path | High | 2. Filtering & Sorting |
| E2E-008 | Filter by price range | Happy Path | High | 2. Filtering & Sorting |
| E2E-009 | Filter by minimum rating | Happy Path | Medium | 2. Filtering & Sorting |
| E2E-010 | Filter in-stock only | Happy Path | High | 2. Filtering & Sorting |
| E2E-011 | Text search products | Happy Path | Critical | 2. Filtering & Sorting |
| E2E-012 | Sort by popular | Happy Path | High | 2. Filtering & Sorting |
| E2E-013 | Sort by newest | Happy Path | High | 2. Filtering & Sorting |
| E2E-014 | Sort by price low to high | Happy Path | Medium | 2. Filtering & Sorting |
| E2E-015 | Sort by price high to low | Happy Path | Medium | 2. Filtering & Sorting |
| E2E-016 | Sort by rating | Happy Path | Medium | 2. Filtering & Sorting |
| E2E-017 | Combined filter + sort + Load More | Alternative Path | High | 2. Filtering & Sorting |
| E2E-018 | Clear all filters resets listing | Alternative Path | Medium | 2. Filtering & Sorting |
| E2E-019 | Search with no results | Edge Case | Medium | 2. Filtering & Sorting |
| E2E-020 | Seller creates product | Happy Path | Critical | 3. CRUD (Seller) |
| E2E-021 | Seller views own product list | Happy Path | Critical | 3. CRUD (Seller) |
| E2E-022 | Seller updates product | Happy Path | Critical | 3. CRUD (Seller) |
| E2E-023 | Seller deletes product (soft) | Happy Path | Critical | 3. CRUD (Seller) |
| E2E-024 | Create with missing required fields | Error Path | High | 3. CRUD (Seller) |
| E2E-025 | Create with negative price | Edge Case | Medium | 3. CRUD (Seller) |
| E2E-026 | Create with zero stock | Edge Case | Low | 3. CRUD (Seller) |
| E2E-027 | Status ACTV to HIDDEN | Happy Path | Critical | 4. Status Lifecycle |
| E2E-028 | Status ACTV to SOLD_OUT | Happy Path | High | 4. Status Lifecycle |
| E2E-029 | Status HIDDEN to ACTV | Alternative Path | High | 4. Status Lifecycle |
| E2E-030 | Status ACTV to DRAFT | Alternative Path | Medium | 4. Status Lifecycle |
| E2E-031 | Invalid status value | Error Path | Medium | 4. Status Lifecycle |
| E2E-032 | Initial load response time (50K) | Happy Path | Critical | 5. Performance |
| E2E-033 | Category filter performance (50K) | Happy Path | High | 5. Performance |
| E2E-034 | Text search performance (50K) | Happy Path | High | 5. Performance |
| E2E-035 | Deep pagination (page 100) | Edge Case | Medium | 5. Performance |
| E2E-036 | Multi-filter + sort performance | Alternative Path | High | 5. Performance |
| E2E-037 | Concurrent viewCnt increment | Edge Case | Medium | 5. Performance |
| E2E-038 | Unauthenticated create blocked | Security | Critical | 6. Security |
| E2E-039 | BUYER cannot create product | Security | Critical | 6. Security |
| E2E-040 | BUYER cannot access seller dashboard | Security | High | 6. Security |
| E2E-041 | Seller cannot edit other's product | Security | Critical | 6. Security |
| E2E-042 | Seller cannot delete other's product | Security | Critical | 6. Security |
| E2E-043 | Seller cannot change other's status | Security | Critical | 6. Security |
| E2E-044 | SUPER_ADMIN can create product | Happy Path | High | 6. Security |
| E2E-045 | SUPER_ADMIN can edit any product | Happy Path | High | 6. Security |
| E2E-046 | SUPER_ADMIN can delete any product | Happy Path | High | 6. Security |
| E2E-047 | Expired/invalid token rejected | Security | Critical | 6. Security |
| E2E-048 | SQL injection in search | Security | High | 6. Security |
| E2E-049 | XSS in product name | Security | High | 6. Security |

### Priority Distribution
| Priority | Count |
|---|---|
| Critical | 16 |
| High | 22 |
| Medium | 10 |
| Low | 1 |
| **Total** | **49** |

### Type Distribution
| Type | Count |
|---|---|
| Happy Path | 23 |
| Alternative Path | 8 |
| Edge Case | 7 |
| Error Path | 2 |
| Security | 9 |
| **Total** | **49** |
