# Product Registration — Test Cases (Sprint 4)

## Unit Tests

### ProductService

#### TC-PRD-001: Create product successfully
- **Given**: Authenticated SELLER user with valid product data
- **When**: createProduct is called
- **Then**: Product is created with sellerId from JWT, status defaults to ACTV, returns formatted response

#### TC-PRD-002: Create product with DRAFT status
- **Given**: Authenticated SELLER with prdSttsCd = 'DRAFT'
- **When**: createProduct is called
- **Then**: Product is created with DRAFT status

#### TC-PRD-003: Reject product creation with invalid category
- **Given**: Product data with prdCtgrCd = 'INVALID'
- **When**: createProduct is called
- **Then**: Throws validation error (400)

#### TC-PRD-004: Reject product creation with negative price
- **Given**: Product data with prdPrc = -10
- **When**: createProduct is called
- **Then**: Throws validation error (400)

#### TC-PRD-005: List products with category filter
- **Given**: Products exist in categories CERAMICS and TEXTILES
- **When**: listProducts with category=CERAMICS
- **Then**: Returns only CERAMICS products, pagination correct

#### TC-PRD-006: List products with price range filter
- **Given**: Products with prices 10, 50, 100, 200
- **When**: listProducts with minPrice=50, maxPrice=150
- **Then**: Returns products with price 50 and 100 only

#### TC-PRD-007: List products with search query
- **Given**: Products with names containing "Ceramic"
- **When**: listProducts with search="Ceramic"
- **Then**: Returns matching products (case-insensitive)

#### TC-PRD-008: List products sorted by price ascending
- **Given**: Multiple products with different prices
- **When**: listProducts with sort=price-low
- **Then**: Products returned in ascending price order

#### TC-PRD-009: Get my products (seller)
- **Given**: Seller has 5 products (mixed statuses: DRAFT, ACTV, HIDDEN)
- **When**: getMyProducts called with seller's JWT
- **Then**: Returns all 5 products regardless of status

#### TC-PRD-010: Get product by ID increments view count
- **Given**: Product with viewCnt = 10
- **When**: getProductById is called
- **Then**: Returns product, viewCnt updated to 11

#### TC-PRD-011: Update product by owner
- **Given**: SELLER owns a product
- **When**: updateProduct called with new name and price
- **Then**: Product updated successfully

#### TC-PRD-012: Reject update by non-owner
- **Given**: SELLER_A tries to update SELLER_B's product
- **When**: updateProduct is called
- **Then**: Throws FORBIDDEN (403)

#### TC-PRD-013: SUPER_ADMIN can update any product
- **Given**: SUPER_ADMIN updates any seller's product
- **When**: updateProduct is called
- **Then**: Product updated successfully

#### TC-PRD-014: Change product status DRAFT → ACTV
- **Given**: Product in DRAFT status
- **When**: changeStatus to ACTV
- **Then**: Status changed successfully

#### TC-PRD-015: Change product status ACTV → HIDDEN
- **Given**: Product in ACTV status
- **When**: changeStatus to HIDDEN
- **Then**: Status changed successfully

#### TC-PRD-016: Soft delete product
- **Given**: SELLER owns a product
- **When**: deleteProduct is called
- **Then**: Product delYn set to 'Y', not returned in listings

#### TC-PRD-017: Public listing excludes non-ACTV products
- **Given**: Products with statuses DRAFT, ACTV, HIDDEN, SOLD_OUT
- **When**: listProducts (public)
- **Then**: Returns only ACTV products

#### TC-PRD-018: Pagination returns correct metadata
- **Given**: 25 products exist
- **When**: listProducts with page=2, limit=10
- **Then**: Returns items 11-20, pagination shows total=25, totalPages=3

### ProductController

#### TC-PRD-019: Public endpoints accessible without auth
- **Given**: No auth token provided
- **When**: GET /api/products or GET /api/products/:id
- **Then**: Returns 200 with data

#### TC-PRD-020: Protected endpoints require SELLER/SUPER_ADMIN
- **Given**: BUYER auth token
- **When**: POST /api/products
- **Then**: Returns 403 Forbidden

## Integration Tests

#### TC-PRD-INT-001: Full product lifecycle
- **Given**: SELLER account
- **When**: Create product → List my products → Update product → Change status → Delete
- **Then**: All operations succeed, product state transitions correctly

#### TC-PRD-INT-002: Product search and filter combination
- **Given**: Products in multiple categories with different prices
- **When**: Search with category + price range + keyword
- **Then**: Results match all filter criteria

## Edge Cases

#### TC-PRD-EDGE-001: Create product with maximum image URLs (5)
- **Given**: Product data with 5 additional image URLs
- **When**: createProduct
- **Then**: All 5 URLs stored in prdImgUrls

#### TC-PRD-EDGE-002: Create product with more than 5 image URLs
- **Given**: Product data with 6 image URLs
- **When**: createProduct
- **Then**: Validation error (ArrayMaxSize)

#### TC-PRD-EDGE-003: Update product that doesn't exist
- **Given**: Non-existent product ID
- **When**: updateProduct
- **Then**: Returns 404 NOT_FOUND

#### TC-PRD-EDGE-004: Delete already deleted product
- **Given**: Product with delYn = 'Y'
- **When**: deleteProduct
- **Then**: Returns 404 NOT_FOUND
