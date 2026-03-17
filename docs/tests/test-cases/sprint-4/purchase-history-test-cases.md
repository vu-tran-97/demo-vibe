# Purchase History — Test Cases (Sprint 4)

## Unit Tests

### OrderService

#### TC-ORD-001: Create order from cart successfully
- **Given**: Buyer with 2 valid products in cart, sufficient stock
- **When**: createOrder is called
- **Then**: Order created with PENDING status, OrderItems created, stock deducted, order number generated (VB-YYYY-MMDD-NNN format)

#### TC-ORD-002: Order number generation format
- **Given**: Order created on 2026-03-17
- **When**: createOrder
- **Then**: Order number matches VB-2026-0317-001 pattern

#### TC-ORD-003: Reject order with insufficient stock
- **Given**: Product has stckQty = 2, buyer requests quantity = 5
- **When**: createOrder
- **Then**: Throws INSUFFICIENT_STOCK error (400)

#### TC-ORD-004: Reject order with inactive product
- **Given**: Product has status DRAFT or HIDDEN
- **When**: createOrder with that product
- **Then**: Throws PRODUCT_NOT_AVAILABLE error (400)

#### TC-ORD-005: Order uses sale price when available
- **Given**: Product with prdPrc=100, prdSalePrc=80
- **When**: createOrder
- **Then**: OrderItem.unitPrc = 80, subtotAmt calculated from sale price

#### TC-ORD-006: Auto-set product SOLD_OUT when stock reaches 0
- **Given**: Product with stckQty=3, order quantity=3
- **When**: createOrder
- **Then**: Product status auto-changed to SOLD_OUT

#### TC-ORD-007: Initial status history recorded
- **Given**: Order created successfully
- **When**: Check OrderStatusHistory
- **Then**: Entry exists with prevSttsCd='', newSttsCd='PENDING'

#### TC-ORD-008: List buyer orders with status filter
- **Given**: Buyer has orders in PENDING, SHIPPED, DELIVERED statuses
- **When**: listBuyerOrders with status=DELIVERED
- **Then**: Returns only DELIVERED orders

#### TC-ORD-009: List buyer orders with date range
- **Given**: Orders created on different dates
- **When**: listBuyerOrders with startDate and endDate
- **Then**: Returns only orders within range

#### TC-ORD-010: Get order detail with items and history
- **Given**: Order with 3 items and 2 status changes
- **When**: getOrderById
- **Then**: Returns order with items array and statusHistory array

#### TC-ORD-011: Buyer can only view own orders
- **Given**: Buyer_A tries to view Buyer_B's order
- **When**: getOrderById
- **Then**: Throws FORBIDDEN (403)

#### TC-ORD-012: Seller can view order containing their products
- **Given**: Order has items from Seller_A
- **When**: Seller_A calls getOrderById
- **Then**: Returns order successfully

#### TC-ORD-013: Buyer cancels PENDING order
- **Given**: Order in PENDING status
- **When**: Buyer calls updateOrderStatus with CANCELLED
- **Then**: Status changed, stock restored for all items

#### TC-ORD-014: Buyer cannot cancel SHIPPED order
- **Given**: Order in SHIPPED status
- **When**: Buyer calls updateOrderStatus with CANCELLED
- **Then**: Throws INVALID_STATUS_TRANSITION (400)

#### TC-ORD-015: Seller updates PENDING → SHIPPED
- **Given**: Order with seller's items in PENDING status
- **When**: Seller calls updateOrderStatus with SHIPPED
- **Then**: Status changed, tracking number can be added

#### TC-ORD-016: Seller updates SHIPPED → DELIVERED
- **Given**: Order in SHIPPED status
- **When**: Seller calls updateOrderStatus with DELIVERED
- **Then**: Status changed to DELIVERED

#### TC-ORD-017: Status history recorded on every change
- **Given**: Order status changed from PENDING to SHIPPED
- **When**: Check OrderStatusHistory
- **Then**: New entry with prevSttsCd=PENDING, newSttsCd=SHIPPED, chngrId set

#### TC-ORD-018: Seller sales list shows only their items
- **Given**: Orders with items from multiple sellers
- **When**: Seller_A calls listSellerSales
- **Then**: Returns only order items where sllrId matches Seller_A

#### TC-ORD-019: Seller revenue summary
- **Given**: Seller has items in DELIVERED orders totaling $500
- **When**: getSellerSummary
- **Then**: Returns totalRevenue=$500, correct orderCount, monthly breakdown

#### TC-ORD-020: Stock restoration on cancellation
- **Given**: Product had stckQty=10, order took 3, stckQty=7
- **When**: Order cancelled
- **Then**: Product stckQty restored to 10, soldCnt decremented

## Integration Tests

#### TC-ORD-INT-001: Full order lifecycle
- **Given**: Buyer with products in cart
- **When**: Create order → Seller ships → Seller delivers
- **Then**: All status transitions succeed, history recorded

#### TC-ORD-INT-002: Order cancellation with stock restore
- **Given**: Order with 2 different products
- **When**: Buyer cancels PENDING order
- **Then**: Both products' stock restored

#### TC-ORD-INT-003: Seller sales dashboard accuracy
- **Given**: Multiple orders with items from the seller
- **When**: View sales summary
- **Then**: Revenue matches sum of DELIVERED order items

## Edge Cases

#### TC-ORD-EDGE-001: Order with empty cart
- **Given**: Empty items array
- **When**: createOrder
- **Then**: Validation error (ArrayMinSize)

#### TC-ORD-EDGE-002: Order with non-existent product
- **Given**: productId that doesn't exist
- **When**: createOrder
- **Then**: PRODUCT_NOT_FOUND error

#### TC-ORD-EDGE-003: Concurrent stock deduction
- **Given**: Product with stckQty=1, two buyers order simultaneously
- **When**: Both createOrder at the same time
- **Then**: Only one succeeds, other gets INSUFFICIENT_STOCK

#### TC-ORD-EDGE-004: SUPER_ADMIN can view any order
- **Given**: Any order in the system
- **When**: SUPER_ADMIN calls getOrderById
- **Then**: Returns order successfully
