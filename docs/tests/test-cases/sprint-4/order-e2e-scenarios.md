# Purchase History — E2E Test Scenarios (Sprint 4)

> End-to-end test scenarios for the order and purchase history feature covering buyer checkout flow, order history, order detail, order cancellation, seller sales dashboard, and order status management.

---

## Scenarios

### E2E-ORD-001: Buyer completes checkout from cart

- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Buyer logged in; 2 products added to cart (localStorage) with sufficient stock; cart page at `/dashboard/cart`
- **User Journey**:
  1. Navigate to `/dashboard/cart`
  2. Verify cart items are displayed with product names, quantities, unit prices, and subtotals
  3. Click "Checkout" button to open the checkout modal
  4. Fill in "Recipient Name" with "John Doe"
  5. Fill in "Phone" with "01012345678"
  6. Fill in "Address" with "123 Main St, Seoul, South Korea"
  7. Fill in "Zip Code" with "06234"
  8. Fill in "Note" with "Please leave at door"
  9. Review order summary showing items and total amount
  10. Click "Place Order" button
  11. Observe success state: cart is cleared, redirect to orders page or success message
- **Expected Results**:
  - UI: Checkout modal shows order summary; on success, cart is cleared (localStorage emptied); redirect to `/dashboard/orders` or success toast displayed
  - API: `POST /api/orders` with items, shippingAddress, recipientName, recipientPhone returns 201 with `{ success: true, data: { orderNumber: "VB-2026-MMDD-NNN", status: "PENDING" } }`
  - DB: New `TB_COMM_ORDR` record (PENDING); `TB_COMM_ORDR_ITEM` records for each item; initial `TH_COMM_ORDR_STTS` entry (null -> PENDING); product `STCK_QTY` decremented and `SOLD_CNT` incremented in `TB_PROD_PRD`
- **Verification Method**: network + db-query
- **Test Data**: Buyer credentials; 2 active products with stock >= 3; shipping info as described

---

### E2E-ORD-002: Buyer views order history with status filter

- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Buyer logged in; buyer has orders in PENDING, SHIPPED, and DELIVERED statuses
- **User Journey**:
  1. Navigate to `/dashboard/orders`
  2. Observe "My Orders" page header with total order count
  3. Observe status filter tabs: All, Pending, Confirmed, Shipped, Delivered, Cancelled
  4. Default tab is "All" showing all orders
  5. Click the "Shipped" tab
  6. Observe only shipped orders are displayed
  7. Click the "All" tab to reset
  8. Verify all orders are shown again
- **Expected Results**:
  - UI: Order cards display order number, date, status badge (color-coded), item list, and total amount; filter tabs highlight active selection; count updates
  - API: `GET /api/orders?page=1&limit=10` then `GET /api/orders?page=1&limit=10&status=SHIPPED`; both return 200 with paginated order list
  - DB: Query filters on `BYR_ID = currentUser.id`, `DEL_YN = "N"`, and optionally `ORDR_STTS_CD`
- **Verification Method**: network + snapshot
- **Test Data**: Buyer with at least 5 orders across different statuses

---

### E2E-ORD-003: Buyer views order detail with status timeline

- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Buyer logged in; order exists in SHIPPED status with 2 status history entries (PENDING -> CONFIRMED -> SHIPPED)
- **User Journey**:
  1. Navigate to `/dashboard/orders`
  2. Click on an order card with "Shipped" status badge
  3. Observe the order detail modal opens with loading spinner then content
  4. Verify modal shows:
     - Order number (e.g., "VB-2026-0317-001")
     - Status badge showing "Shipped"
     - Order date
     - Progress bar: Pending (completed) -> Confirmed (completed) -> Shipped (current) -> Delivered (pending)
     - Status History timeline with timestamps and status changes
     - Items list with product images, names, quantities, unit prices, subtotals
     - Shipping information: receiver name, phone, address
     - Total amount
  5. Click the close button (X) or "Close" button
  6. Modal closes, return to orders list
- **Expected Results**:
  - UI: Modal displays all order details; progress bar highlights completed and current steps; status timeline shows chronological history; shipping info visible
  - API: `GET /api/orders/:id` returns 200 with full order data including `items[]`, `statusHistory[]`, shipping fields
  - DB: Join on `TB_COMM_ORDR`, `TB_COMM_ORDR_ITEM`, `TH_COMM_ORDR_STTS`
- **Verification Method**: network + snapshot
- **Test Data**: Order in SHIPPED status with multiple status history entries

---

### E2E-ORD-004: Buyer cancels a PENDING order

- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Buyer logged in; has an order in PENDING status; order contains 2 items
- **User Journey**:
  1. Navigate to `/dashboard/orders`
  2. Click on a PENDING order card to open the detail modal
  3. Observe the "Cancel Order" button is visible (only shown for PENDING orders)
  4. Click "Cancel Order" button
  5. Confirm the browser `confirm()` dialog ("Are you sure you want to cancel this order?")
  6. Observe the button text changes to "Cancelling..."
  7. Modal closes; orders list refreshes
  8. Verify the order now shows "Cancelled" status badge
- **Expected Results**:
  - UI: Cancel button visible only for PENDING orders; after cancellation, order status badge changes to "Cancelled" (red); modal closes
  - API: `PATCH /api/orders/:id/status` with `{ status: "CANCELLED" }` returns 200 with `{ previousStatus: "PENDING", newStatus: "CANCELLED" }`
  - DB: `ORDR_STTS_CD = "CANCELLED"` in `TB_COMM_ORDR`; new entry in `TH_COMM_ORDR_STTS` (PENDING -> CANCELLED); `STCK_QTY` restored and `SOLD_CNT` decremented for all order items in `TB_PROD_PRD`
- **Verification Method**: network + db-query
- **Test Data**: Buyer with a PENDING order containing 2 items

---

### E2E-ORD-005: Buyer cannot cancel a SHIPPED order

- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Buyer logged in; has an order in SHIPPED status
- **User Journey**:
  1. Navigate to `/dashboard/orders`
  2. Click on a SHIPPED order card to open the detail modal
  3. Observe the "Cancel Order" button is NOT visible
  4. Manually attempt `PATCH /api/orders/:id/status` with `{ status: "CANCELLED" }` via dev tools
- **Expected Results**:
  - UI: No cancel button displayed for SHIPPED orders
  - API: `PATCH /api/orders/:id/status` returns 400 with `INVALID_STATUS_TRANSITION` error
  - DB: No changes to order status
- **Verification Method**: network + snapshot
- **Test Data**: Order in SHIPPED status

---

### E2E-ORD-006: Buyer filters orders by date range

- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Buyer logged in; has orders from different dates spanning multiple weeks
- **User Journey**:
  1. Navigate to `/dashboard/orders`
  2. Observe the date range filter fields: "From" and "To" date inputs
  3. Set "From" date to 7 days ago
  4. Set "To" date to today
  5. Observe the order list filters to show only orders within the date range
  6. Click "Clear dates" button
  7. Observe all orders are shown again
- **Expected Results**:
  - UI: Order list updates when dates are set; "Clear dates" button appears when dates are active; page resets to 1 on filter change
  - API: `GET /api/orders?startDate=2026-03-10&endDate=2026-03-17&page=1&limit=10` returns filtered results
  - DB: Query adds `RGST_DT >= startDate AND RGST_DT <= endDate` filter
- **Verification Method**: network
- **Test Data**: Orders with dates spanning at least 2 weeks

---

### E2E-ORD-007: Seller views sales dashboard with revenue summary

- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Seller logged in; has sold items across multiple orders; some orders in DELIVERED status
- **User Journey**:
  1. Navigate to `/dashboard/orders`
  2. Observe the seller redirect: page shows "As a seller, view your sales history" with a "Go to Sales Dashboard" link
  3. Click "Go to Sales Dashboard" link
  4. Arrive at `/dashboard/orders/sales`
  5. Observe the revenue summary cards: "Total Revenue" and "Total Orders"
  6. Observe the monthly breakdown section (if available)
  7. Observe the sales list showing individual sale items with order number, product name, buyer name, quantity, unit price, total price, and status badge
- **Expected Results**:
  - UI: Revenue summary cards display correct totals; monthly breakdown shows month-by-month data; sales list shows seller's items only
  - API: `GET /api/orders/sales/summary` returns 200 with `{ totalRevenue, totalOrders, monthlyBreakdown[] }`; `GET /api/orders/sales?page=1&limit=10` returns 200 with paginated sales list
  - DB: Aggregation on `TB_COMM_ORDR_ITEM` where `SLLR_ID = currentUser.id`; revenue excludes CANCELLED orders
- **Verification Method**: network + snapshot
- **Test Data**: Seller with 10+ sold items across 5+ orders

---

### E2E-ORD-008: Seller updates order status PENDING to SHIPPED

- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Seller logged in; has a sale item in PENDING status at `/dashboard/orders/sales`
- **User Journey**:
  1. Navigate to `/dashboard/orders/sales`
  2. Find a sale card with "Pending" status
  3. Observe the "Mark Shipped" button is visible
  4. Click "Mark Shipped" button
  5. Observe the button text changes to "Updating..."
  6. After update, observe the status badge changes to "Shipped"
  7. Observe the "Mark Shipped" button is replaced with "Mark Delivered" button
- **Expected Results**:
  - UI: Status badge updates to "Shipped"; action button changes to "Mark Delivered"; revenue summary refreshes
  - API: `PATCH /api/orders/:id/status` with `{ status: "SHIPPED" }` returns 200
  - DB: `ORDR_STTS_CD = "SHIPPED"` in `TB_COMM_ORDR`; new entry in `TH_COMM_ORDR_STTS` (PENDING -> SHIPPED); `CHNGR_ID` set to seller's user ID
- **Verification Method**: network + db-query
- **Test Data**: Order with seller's items in PENDING status

---

### E2E-ORD-009: Seller updates order status SHIPPED to DELIVERED

- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Seller logged in; has a sale item in SHIPPED status
- **User Journey**:
  1. Navigate to `/dashboard/orders/sales`
  2. Filter by "Shipped" status tab
  3. Find a sale card with "Shipped" status
  4. Click "Mark Delivered" button
  5. Observe the status updates to "Delivered"
  6. Observe no more action buttons are shown (DELIVERED is terminal)
- **Expected Results**:
  - UI: Status badge changes to "Delivered" (green); no action buttons for delivered orders
  - API: `PATCH /api/orders/:id/status` with `{ status: "DELIVERED" }` returns 200
  - DB: `ORDR_STTS_CD = "DELIVERED"` in `TB_COMM_ORDR`; new `TH_COMM_ORDR_STTS` entry (SHIPPED -> DELIVERED)
- **Verification Method**: network + db-query
- **Test Data**: Order in SHIPPED status with seller's items

---

### E2E-ORD-010: Seller filters sales by status and date range

- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Seller logged in; has sales across various statuses and dates
- **User Journey**:
  1. Navigate to `/dashboard/orders/sales`
  2. Click the "Delivered" status tab
  3. Observe only delivered sales are shown
  4. Set "From" date to the start of the month
  5. Set "To" date to today
  6. Observe sales list filters by both status and date range
  7. Click "Clear dates" button
  8. Click "All" status tab
  9. Verify all sales are shown
- **Expected Results**:
  - UI: Sales list updates with combined filters; page resets to 1 on filter change
  - API: `GET /api/orders/sales?status=DELIVERED&startDate=2026-03-01&endDate=2026-03-17&page=1&limit=10` returns filtered results
  - DB: Combined query on `ORDR_STTS_CD` and `RGST_DT` range
- **Verification Method**: network
- **Test Data**: Seller with sales across the current month

---

### E2E-ORD-011: Order creation with insufficient stock

- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Buyer logged in; product in cart has `STCK_QTY = 2` but cart quantity is 5
- **User Journey**:
  1. Navigate to `/dashboard/cart`
  2. Cart shows the product with quantity 5
  3. Click "Checkout" button
  4. Fill in all shipping information
  5. Click "Place Order"
  6. Observe error message displayed: "Insufficient stock for {productName}. Available: 2"
- **Expected Results**:
  - UI: Error message displayed; cart is NOT cleared; user can adjust quantity
  - API: `POST /api/orders` returns 400 with `{ success: false, error: "INSUFFICIENT_STOCK" }`
  - DB: No order created; no stock changes
- **Verification Method**: network
- **Test Data**: Product with stock = 2; cart quantity = 5

---

### E2E-ORD-012: Order creation with inactive/deleted product

- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Buyer logged in; product in cart was active when added but seller has since hidden it (HIDDEN status)
- **User Journey**:
  1. Navigate to `/dashboard/cart`
  2. Attempt checkout with the now-hidden product
  3. Fill in shipping information
  4. Click "Place Order"
  5. Observe error message about product unavailability
- **Expected Results**:
  - UI: Error message: "Product is no longer available" or similar
  - API: `POST /api/orders` returns 400 with `PRODUCT_UNAVAILABLE` error
  - DB: No order created
- **Verification Method**: network
- **Test Data**: Product that was hidden after being added to cart

---

### E2E-ORD-013: Order pagination on buyer orders page

- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Buyer has more than 10 orders
- **User Journey**:
  1. Navigate to `/dashboard/orders`
  2. Observe 10 orders displayed (limit=10)
  3. Observe pagination controls: "Previous" (disabled), "Page 1 of N", "Next"
  4. Click "Next" button
  5. Page 2 loads with next set of orders
  6. Click "Previous" to return to page 1
- **Expected Results**:
  - UI: Pagination shows correct page info; buttons enable/disable appropriately
  - API: `GET /api/orders?page=2&limit=10` returns second page of results
  - DB: Offset-based pagination query
- **Verification Method**: network + snapshot
- **Test Data**: Buyer with 15+ orders

---

### E2E-ORD-014: Buyer attempts to view another buyer's order

- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Buyer A logged in; Order belongs to Buyer B
- **User Journey**:
  1. Buyer A manually requests `GET /api/orders/:buyerB_orderId` via dev tools or direct URL
- **Expected Results**:
  - UI: Error or 404 response
  - API: `GET /api/orders/:id` returns 403 or 404 (order not found for this buyer)
  - DB: Query enforces `BYR_ID = currentUser.id` filter
- **Verification Method**: network
- **Test Data**: Two buyer accounts; order ID belonging to Buyer B

---

### E2E-ORD-015: Auto SOLD_OUT status when stock reaches zero after order

- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: Product has `STCK_QTY = 3`, `PRD_STTS_CD = "ACTV"`; buyer orders quantity = 3
- **User Journey**:
  1. Navigate to `/dashboard/cart` with 3 units of the product
  2. Complete checkout
  3. Order created successfully
  4. Navigate to `/dashboard/products` and search for the product
  5. Observe the product no longer appears in active listings (or shows "Sold Out" status)
- **Expected Results**:
  - UI: Product no longer visible in public listing (filtered by ACTV only); seller sees "Sold Out" status in my products
  - API: `POST /api/orders` returns 201; product now has `status: "SOLD_OUT"` when fetched
  - DB: `STCK_QTY = 0`, `PRD_STTS_CD = "SOLD_OUT"` in `TB_PROD_PRD`
- **Verification Method**: db-query + network
- **Test Data**: Product with exact stock matching order quantity

---

## Summary

| Type | Count |
|------|-------|
| Happy Path | 9 |
| Alternative Path | 0 |
| Edge Case | 1 |
| Error Path | 5 |
| **Total** | **15** |
