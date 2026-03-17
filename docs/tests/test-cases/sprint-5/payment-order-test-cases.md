# Payment & Seller Order Management — Test Cases (Sprint 5)

## Unit Tests

### OrderService — Checkout & Payment

#### TC-PAY-001: Create order via checkout with Bank Transfer
- **Given**: Buyer with 2 valid cart items, selects BANK_TRANSFER as payment method
- **When**: POST /api/orders/checkout is called
- **Then**: Order created with ordrSttsCd=PENDING, payMthdCd=BANK_TRANSFER, items created, stock deducted

#### TC-PAY-002: Create order via checkout with Email Invoice
- **Given**: Buyer with 1 valid cart item, selects EMAIL_INVOICE as payment method
- **When**: POST /api/orders/checkout is called
- **Then**: Order created with ordrSttsCd=PENDING, payMthdCd=EMAIL_INVOICE

#### TC-PAY-003: Mark order as PAID
- **Given**: Order exists with status PENDING
- **When**: PATCH /api/orders/:id/pay is called by the buyer
- **Then**: Order status changes to PAID, status history recorded with PENDING->PAID transition

#### TC-PAY-004: Reject pay on non-PENDING order
- **Given**: Order exists with status PAID (already paid)
- **When**: PATCH /api/orders/:id/pay is called
- **Then**: Throws INVALID_STATUS_TRANSITION error (400)

#### TC-PAY-005: Reject pay by non-owner
- **Given**: Order belongs to Buyer_A
- **When**: Buyer_B calls PATCH /api/orders/:id/pay
- **Then**: Throws ORDER_ACCESS_DENIED error (403)

#### TC-PAY-006: Checkout with insufficient stock
- **Given**: Product has stckQty=1, buyer requests quantity=5
- **When**: POST /api/orders/checkout
- **Then**: Throws INSUFFICIENT_STOCK error (400)

#### TC-PAY-007: Checkout with empty items array
- **Given**: Buyer sends empty items array
- **When**: POST /api/orders/checkout
- **Then**: Validation error (400) — items must have at least 1 element

#### TC-PAY-008: Order items default to PENDING item status
- **Given**: Order created via checkout
- **When**: Query order items
- **Then**: All items have itemSttsCd=PENDING

### OrderService — Seller Item Status Management

#### TC-SELL-001: Seller confirms an order item
- **Given**: Order item with itemSttsCd=PENDING, belongs to seller
- **When**: PATCH /api/orders/sales/:orderId/items/:itemId/status with status=CONFIRMED
- **Then**: Item status changes to CONFIRMED, status history recorded

#### TC-SELL-002: Seller ships an order item with tracking number
- **Given**: Order item with itemSttsCd=CONFIRMED, belongs to seller
- **When**: PATCH with status=SHIPPED, trackingNumber=TRACK-123
- **Then**: Item status changes to SHIPPED, trckgNo set to TRACK-123

#### TC-SELL-003: Seller marks item as delivered
- **Given**: Order item with itemSttsCd=SHIPPED
- **When**: PATCH with status=DELIVERED
- **Then**: Item status changes to DELIVERED

#### TC-SELL-004: Reject invalid item status transition
- **Given**: Order item with itemSttsCd=PENDING
- **When**: PATCH with status=DELIVERED (skipping CONFIRMED and SHIPPED)
- **Then**: Throws INVALID_STATUS_TRANSITION error (400)

#### TC-SELL-005: Reject status update by non-owner seller
- **Given**: Order item belongs to Seller_A
- **When**: Seller_B calls PATCH
- **Then**: Throws ORDER_ACCESS_DENIED error (403)

#### TC-SELL-006: Seller ships item without tracking number
- **Given**: Order item with itemSttsCd=CONFIRMED
- **When**: PATCH with status=SHIPPED (no trackingNumber)
- **Then**: Item status changes to SHIPPED, trckgNo remains null (tracking number is optional)

### OrderService — Bulk Status Update

#### TC-BULK-001: Bulk confirm multiple items
- **Given**: 3 items with PENDING status, all belonging to seller
- **When**: POST /api/orders/sales/bulk-status with itemIds and status=CONFIRMED
- **Then**: All 3 items updated to CONFIRMED, response shows updated=3, failed=0

#### TC-BULK-002: Bulk ship with tracking number
- **Given**: 2 items with CONFIRMED status
- **When**: POST bulk-status with status=SHIPPED, trackingNumber=BULK-001
- **Then**: Both items updated to SHIPPED with trckgNo=BULK-001

#### TC-BULK-003: Partial bulk update (mixed statuses)
- **Given**: Item_A is PENDING, Item_B is CONFIRMED, bulk request for CONFIRMED
- **When**: POST bulk-status with both IDs and status=CONFIRMED
- **Then**: Item_A updated to CONFIRMED (success), Item_B skipped (already CONFIRMED or invalid), response shows updated=1, failed=1

#### TC-BULK-004: Bulk update with items not belonging to seller
- **Given**: Item_A belongs to Seller_A, Item_B belongs to Seller_B
- **When**: Seller_A calls bulk-status with both IDs
- **Then**: Only Item_A updated, Item_B failed (not owned), response shows updated=1, failed=1

#### TC-BULK-005: Bulk update with empty itemIds array
- **Given**: Empty itemIds array
- **When**: POST bulk-status
- **Then**: Validation error (400)

### OrderService — Seller Order Detail

#### TC-DETAIL-001: Seller views order detail with their items
- **Given**: Order with 3 items, 2 belonging to seller
- **When**: GET /api/orders/sales/:id
- **Then**: Returns full order detail with buyer info, all items (filtered to seller's), payment method, status history

#### TC-DETAIL-002: Seller cannot view order without their items
- **Given**: Order with items belonging to other sellers
- **When**: Seller calls GET /api/orders/sales/:id
- **Then**: Throws ORDER_ACCESS_DENIED error (403)

#### TC-DETAIL-003: Order detail includes status timeline
- **Given**: Order with 3 status changes in history
- **When**: GET /api/orders/sales/:id
- **Then**: statusHistory array contains 3 entries in chronological order

---

## Integration / E2E Tests

### Checkout Flow

#### TC-E2E-001: Full checkout with Bank Transfer
- **Given**: Buyer logged in, 2 items in cart
- **When**: Navigate to /dashboard/checkout, select Bank Transfer, fill shipping info, click Confirm
- **Then**: Order created, redirected to success page, order number displayed, cart cleared

#### TC-E2E-002: Full checkout with Email Invoice
- **Given**: Buyer logged in, 1 item in cart
- **When**: Navigate to /dashboard/checkout, select Email Invoice, click Confirm
- **Then**: Order created and marked PAID, redirected to success page

#### TC-E2E-003: Checkout page shows correct cart summary
- **Given**: Cart has Product_A (qty 2, $50) and Product_B (qty 1, $30)
- **When**: Navigate to /dashboard/checkout
- **Then**: Order summary shows both items, subtotals, and total = $130

#### TC-E2E-004: Empty cart redirects away from checkout
- **Given**: Cart is empty
- **When**: Navigate to /dashboard/checkout
- **Then**: Redirected to cart page or shows empty state

### Seller Order Management

#### TC-E2E-005: Seller confirms order item
- **Given**: Seller logged in, order item with PENDING status visible
- **When**: Click "Confirm" button on the item
- **Then**: Item status updates to CONFIRMED, badge changes

#### TC-E2E-006: Seller ships with tracking number
- **Given**: Seller on sales page, item in CONFIRMED status
- **When**: Click "Ship", enter tracking number, submit
- **Then**: Item status updates to SHIPPED, tracking number displayed

#### TC-E2E-007: Seller marks item delivered
- **Given**: Item in SHIPPED status
- **When**: Click "Deliver" button
- **Then**: Item status updates to DELIVERED

#### TC-E2E-008: Bulk select and confirm
- **Given**: 3 items in PENDING status
- **When**: Select all 3 via checkboxes, click "Bulk Confirm" in action bar
- **Then**: All 3 items updated to CONFIRMED

#### TC-E2E-009: Seller opens order detail modal
- **Given**: Order visible in sales list
- **When**: Click order number
- **Then**: Modal opens showing buyer info, all items, payment method, status history timeline

### Responsive Tests

#### TC-E2E-010: Checkout page responsive - mobile
- **Given**: Viewport width <= 767px
- **When**: View checkout page
- **Then**: Single column layout, payment methods stacked, form fields full width

#### TC-E2E-011: Checkout page responsive - tablet
- **Given**: Viewport width 768-1023px
- **When**: View checkout page
- **Then**: Adjusted layout, still readable and usable

#### TC-E2E-012: Sales page responsive - mobile
- **Given**: Viewport width <= 767px
- **When**: View enhanced sales page
- **Then**: Cards stacked vertically, action buttons full width, bulk bar at bottom

#### TC-E2E-013: Order detail modal responsive
- **Given**: Viewport width <= 767px
- **When**: Open order detail modal
- **Then**: Modal takes full width with proper padding, scrollable content
