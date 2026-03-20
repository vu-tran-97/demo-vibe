# Sprint 6 — Buyer Pages, Per-item Payment & Multi-seller Orders

## TC-001: Homepage loads
- **Preconditions**: Server running
- **Test Steps**: GET /
- **Expected Result**: 200 OK
- **Verification Method**: network

## TC-002: Products API returns data
- **Preconditions**: Products seeded
- **Test Steps**: GET /api/products
- **Expected Result**: success=true, items > 0
- **Verification Method**: network

## TC-003: Cart page loads without auth
- **Preconditions**: None (no login required)
- **Test Steps**: GET /cart
- **Expected Result**: 200 OK
- **Verification Method**: network

## TC-004: Orders page loads
- **Preconditions**: Server running
- **Test Steps**: GET /orders
- **Expected Result**: 200 OK
- **Verification Method**: network

## TC-005: Settings page loads
- **Preconditions**: Server running
- **Test Steps**: GET /settings
- **Expected Result**: 200 OK
- **Verification Method**: network

## TC-006: Checkout page loads
- **Preconditions**: Server running
- **Test Steps**: GET /checkout
- **Expected Result**: 200 OK
- **Verification Method**: network

## TC-007: Dashboard page loads
- **Preconditions**: Server running
- **Test Steps**: GET /dashboard
- **Expected Result**: 200 OK
- **Verification Method**: network

## TC-008: Product detail page loads
- **Preconditions**: Products exist
- **Test Steps**: GET /products/{id}
- **Expected Result**: 200 OK
- **Verification Method**: network

## TC-009: Signup with spaces in nickname
- **Preconditions**: None
- **Test Steps**: POST /api/auth/signup with nickname "test nick"
- **Expected Result**: success=true
- **Verification Method**: network

## TC-010: Buyer can list orders
- **Preconditions**: Buyer logged in, has orders
- **Test Steps**: GET /api/orders?page=1&limit=10
- **Expected Result**: success=true, pagination.total > 0
- **Verification Method**: network

## TC-011: Filter orders by itemStatus=DELIVERED
- **Preconditions**: Buyer has delivered orders
- **Test Steps**: GET /api/orders?itemStatus=DELIVERED
- **Expected Result**: Returns only orders with delivered items
- **Verification Method**: network

## TC-012: Filter orders by paymentStatus=PAID
- **Preconditions**: Buyer has paid items
- **Test Steps**: GET /api/orders?paymentStatus=PAID
- **Expected Result**: Returns only orders with paid items
- **Verification Method**: network

## TC-013: Filter orders by paymentStatus=UNPAID
- **Preconditions**: Buyer has unpaid items
- **Test Steps**: GET /api/orders?paymentStatus=UNPAID
- **Expected Result**: Returns only orders with unpaid items
- **Verification Method**: network

## TC-014: Seller can list own products
- **Preconditions**: Seller logged in
- **Test Steps**: GET /api/products/my
- **Expected Result**: success=true, returns seller's products only
- **Verification Method**: network

## TC-015: Seller can search products
- **Preconditions**: Seller has products
- **Test Steps**: GET /api/products/my?search=nike
- **Expected Result**: Returns matching products
- **Verification Method**: network

## TC-016: Seller can list sales
- **Preconditions**: Seller has received orders
- **Test Steps**: GET /api/orders/sales
- **Expected Result**: success=true, returns sale items
- **Verification Method**: network

## TC-017: Seller can create product
- **Preconditions**: Seller logged in
- **Test Steps**: POST /api/products with valid data
- **Expected Result**: success=true, product created with ID
- **Verification Method**: network

## TC-018: Seller can activate product
- **Preconditions**: Product in DRAFT status
- **Test Steps**: PATCH /api/products/{id}/status with {status: "ACTV"}
- **Expected Result**: status changed to ACTV
- **Verification Method**: network

## TC-019: Buyer can checkout
- **Preconditions**: Buyer logged in, product exists with stock
- **Test Steps**: POST /api/orders/checkout
- **Expected Result**: Order created with PENDING status
- **Verification Method**: network

## TC-020: Order detail has paymentStatus per item
- **Preconditions**: Order exists
- **Test Steps**: GET /api/orders/{id}
- **Expected Result**: Each item has paymentStatus field
- **Verification Method**: network

## TC-021: Seller can confirm item payment
- **Preconditions**: Seller has unpaid sale items
- **Test Steps**: PATCH /api/orders/sales/{orderId}/items/{itemId}/payment
- **Expected Result**: success=true
- **Verification Method**: network

## TC-022: Delete product auto-cancels pending orders
- **Preconditions**: Product has pending order items
- **Test Steps**: DELETE /api/products/{id}
- **Expected Result**: Product deleted, cancelledItems > 0
- **Verification Method**: network

## TC-023: 401 on invalid token
- **Preconditions**: None
- **Test Steps**: GET /api/orders with invalid Bearer token
- **Expected Result**: 401 Unauthorized
- **Verification Method**: network

## TC-024: Seller can access /cart page
- **Preconditions**: None
- **Test Steps**: GET /cart
- **Expected Result**: 200 OK (no role restriction)
- **Verification Method**: network

## TC-025: Seller can checkout
- **Preconditions**: Seller logged in
- **Test Steps**: POST /api/orders/checkout as seller
- **Expected Result**: Order created successfully
- **Verification Method**: network

## TC-026: Seller can view own purchase orders
- **Preconditions**: Seller has made purchases
- **Test Steps**: GET /api/orders as seller
- **Expected Result**: Returns seller's orders as buyer
- **Verification Method**: network

## TC-027: Order list includes paymentStatus per item
- **Preconditions**: Orders exist
- **Test Steps**: GET /api/orders?page=1&limit=1
- **Expected Result**: Each item in order has paymentStatus
- **Verification Method**: network

## TC-028: Order detail includes sellerName per item
- **Preconditions**: Order exists
- **Test Steps**: GET /api/orders/{id}
- **Expected Result**: Each item has sellerName field
- **Verification Method**: network
