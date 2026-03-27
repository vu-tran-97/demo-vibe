# Order E2E Test Scenarios — Sprint 10

## Overview
- **Feature**: Order creation, checkout (guest + authenticated), payment (bank transfer / email invoice), buyer order history, seller sales management, stock deduction, bulk operations
- **Related Modules**: Auth, Product, Email (order confirmation)
- **API Endpoints**: POST /api/orders, POST /api/orders/checkout, PATCH /api/orders/:id/pay, GET /api/orders, GET /api/orders/:id, PATCH /api/orders/:id/status, GET /api/orders/sales, GET /api/orders/sales/summary, GET /api/orders/sales/:id, PATCH /api/orders/sales/:orderId/items/:itemId/payment, PATCH /api/orders/sales/:orderId/items/:itemId/status, POST /api/orders/sales/bulk-status
- **Order Pages**: /cart, /checkout, /checkout/success, /orders, /dashboard/orders, /dashboard/orders/sales
- **DB Tables**: Order, OrderItem, Product, User
- **Blueprint**: docs/blueprints/009-payment-order/blueprint.md
- **Production Frontend**: https://demo-vibe-production.up.railway.app
- **Production Backend**: https://demo-vibe-backend-production.up.railway.app
- **Item Status Flow**: PENDING -> CONFIRMED -> SHIPPED -> DELIVERED (or CANCELLED at any stage before SHIPPED)
- **Payment Methods**: Bank transfer, Email invoice

### Test Accounts
| Account | Email | Password | Role |
|---------|-------|----------|------|
| Buyer | testbuyer-s10@yopmail.com | TestBuyer@123 | BUYER |
| Seller | seller1000@yopmail.com | Seller1000@123 | SELLER |
| Admin | admin@astratech.vn | Admin@123 | SUPER_ADMIN |

---

## Scenario Group 1: Add to Cart and Checkout

### E2E-001: Add product to cart and complete authenticated checkout
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as BUYER, at least one product exists with stock > 0
- **User Journey**:
  1. Navigate to homepage or product listing
  2. Click on a product to view detail
  3. Select quantity (e.g., 2)
  4. Click "Add to Cart"
  5. Verify cart icon badge updates
  6. Navigate to /cart
  7. Verify product appears in cart with correct quantity and price
  8. Click "Checkout" to proceed to /checkout
  9. Fill shipping info (name, address, phone)
  10. Select payment method: "Bank Transfer"
  11. Click "Place Order"
  12. Verify redirect to /checkout/success with order confirmation
- **Expected Results**:
  - UI: Cart badge increments on add; /checkout/success shows order number, items, total
  - API: POST /api/orders returns 201 with order details
  - DB: Order record created with buyerId set, OrderItem records match cart contents, product stock decremented by quantity ordered
- **Verification Method**: snapshot / network
- **Test Data**: Any available product with stock >= 2

### E2E-002: Add multiple products from different sellers to cart
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as BUYER, products from at least 2 different sellers exist
- **User Journey**:
  1. Add product A from Seller 1 to cart
  2. Add product B from Seller 2 to cart
  3. Navigate to /cart
  4. Verify both items displayed with correct seller info
  5. Proceed to checkout and complete order
  6. Verify order confirmation shows all items
- **Expected Results**:
  - UI: Cart displays items grouped or listed with seller attribution
  - API: POST /api/orders returns 201
  - DB: Order created with multiple OrderItem records linked to different seller products
- **Verification Method**: snapshot / network

### E2E-003: Update cart item quantity
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in, at least one item in cart
- **User Journey**:
  1. Navigate to /cart
  2. Change quantity of an item (e.g., from 1 to 3)
  3. Verify subtotal and total update immediately
  4. Remove one item by setting quantity to 0 or clicking remove
  5. Verify item removed and total recalculated
- **Expected Results**:
  - UI: Cart totals update in real time, removed item disappears
  - localStorage: Cart data updated correctly
- **Verification Method**: snapshot

### E2E-004: Cart persists across page navigation (localStorage)
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Not logged in or logged in, product added to cart
- **User Journey**:
  1. Add a product to cart
  2. Navigate to a different page (e.g., /products)
  3. Navigate back to /cart
  4. Verify cart still contains the product
  5. Refresh the browser
  6. Navigate to /cart again
  7. Verify cart contents persist
- **Expected Results**:
  - UI: Cart contents unchanged after navigation and page refresh
  - localStorage: Cart data persists
- **Verification Method**: snapshot

---

## Scenario Group 2: Guest Checkout

### E2E-005: Guest checkout full flow
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Not logged in, product added to cart
- **User Journey**:
  1. Add product to cart from product page
  2. Navigate to /cart
  3. Click "Checkout" to go to /checkout
  4. Fill guest info: name, email, phone, shipping address
  5. Select payment method: "Email Invoice"
  6. Click "Place Order"
  7. Verify redirect to /checkout/success
  8. Verify confirmation details (order number, email confirmation notice)
- **Expected Results**:
  - UI: /checkout/success displays order summary, message about email invoice
  - API: POST /api/orders/checkout returns 201
  - DB: Order created with buyerId=null (guest), guest email stored
- **Verification Method**: snapshot / network
- **Test Data**: Guest email: guest-s10-{timestamp}@yopmail.com

### E2E-006: Guest checkout with missing required fields
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Not logged in, product in cart, on /checkout page
- **User Journey**:
  1. Navigate to /checkout
  2. Leave name field empty
  3. Fill email but leave address empty
  4. Click "Place Order"
  5. Verify validation errors displayed
- **Expected Results**:
  - UI: Inline validation messages for required fields (name, address)
  - API: No request sent (client-side validation) or 400 Bad Request
  - DB: No order created
- **Verification Method**: snapshot

### E2E-007: Guest checkout with invalid email format
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: Not logged in, product in cart
- **User Journey**:
  1. Navigate to /checkout
  2. Fill all fields but enter invalid email: "not-an-email"
  3. Click "Place Order"
  4. Verify email validation error
- **Expected Results**:
  - UI: Error message on email field
  - API: No request sent or 400 Bad Request
- **Verification Method**: snapshot

---

## Scenario Group 3: Order Payment (Bank Transfer)

### E2E-008: Pay for pending order via bank transfer
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as BUYER, order exists with PENDING payment status
- **User Journey**:
  1. Navigate to /dashboard/orders
  2. Find an order with "Pending Payment" status
  3. Click on the order to view detail
  4. Click "Pay" or "Complete Payment" button
  5. Confirm bank transfer details
  6. Submit payment
  7. Verify order payment status updates
- **Expected Results**:
  - UI: Order status reflects payment submitted, bank transfer instructions displayed
  - API: PATCH /api/orders/:id/pay returns 200
  - DB: Order payment status updated
- **Verification Method**: snapshot / network

### E2E-009: Attempt to pay for already paid order
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: Logged in as BUYER, order already in PAID status
- **User Journey**:
  1. Navigate to /dashboard/orders
  2. Open an already-paid order
  3. Verify no "Pay" button is shown, or attempt direct API call
- **Expected Results**:
  - UI: Pay button hidden or disabled for already-paid orders
  - API: PATCH /api/orders/:id/pay returns 400 or 409 (conflict)
- **Verification Method**: snapshot / network

### E2E-010: Attempt to pay for cancelled order
- **Type**: Error Path
- **Priority**: Low
- **Preconditions**: Logged in as BUYER, order in CANCELLED status
- **User Journey**:
  1. Navigate to order detail of a cancelled order
  2. Verify no payment option available
- **Expected Results**:
  - UI: No pay button; status displayed as "Cancelled"
  - API: PATCH /api/orders/:id/pay returns 400 if called directly
- **Verification Method**: snapshot / network

---

## Scenario Group 4: Buyer Order History and Filtering

### E2E-011: View buyer order list
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as BUYER with multiple past orders
- **User Journey**:
  1. Navigate to /dashboard/orders
  2. Verify order list renders with columns: order number, date, status, total
  3. Verify orders sorted by most recent first
  4. Verify pagination if more than one page of orders
- **Expected Results**:
  - API: GET /api/orders returns 200 with paginated results
  - UI: Order list table/cards with status badges, pagination controls
- **Verification Method**: snapshot / network

### E2E-012: View order detail page
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as BUYER, at least one order exists
- **User Journey**:
  1. Navigate to /dashboard/orders
  2. Click on an order row/card
  3. Verify order detail page shows: items with images, quantities, prices, shipping info, payment method, order status, timestamps
- **Expected Results**:
  - API: GET /api/orders/:id returns 200 with full order data
  - UI: Complete order detail with all fields
- **Verification Method**: snapshot / network

### E2E-013: Filter orders by status
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in as BUYER with orders in different statuses
- **User Journey**:
  1. Navigate to /dashboard/orders
  2. Select status filter (e.g., "Pending")
  3. Verify only pending orders displayed
  4. Change filter to "Delivered"
  5. Verify only delivered orders displayed
  6. Clear filter to see all orders
- **Expected Results**:
  - API: GET /api/orders?status=PENDING returns filtered results
  - UI: Order list updates according to selected filter
- **Verification Method**: snapshot / network

### E2E-014: Access /orders page (public order history route)
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in as BUYER
- **User Journey**:
  1. Navigate to /orders
  2. Verify order history page renders with buyer's orders
- **Expected Results**:
  - UI: Order list displayed, consistent with /dashboard/orders data
- **Verification Method**: snapshot

### E2E-015: Buyer with no orders sees empty state
- **Type**: Edge Case
- **Priority**: Low
- **Preconditions**: Logged in as BUYER with no order history (new account)
- **User Journey**:
  1. Navigate to /dashboard/orders
  2. Verify empty state message
- **Expected Results**:
  - UI: "No orders yet" message with CTA to browse products
  - API: GET /api/orders returns 200 with empty array
- **Verification Method**: snapshot

---

## Scenario Group 5: Order Cancellation

### E2E-016: Buyer cancels a pending order
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as BUYER, order in PENDING status
- **User Journey**:
  1. Navigate to /dashboard/orders
  2. Click on a pending order
  3. Click "Cancel Order" button
  4. Confirm cancellation in dialog/modal
  5. Verify order status changes to CANCELLED
- **Expected Results**:
  - UI: Order status badge updates to "Cancelled"
  - API: PATCH /api/orders/:id/status with status=CANCELLED returns 200
  - DB: Order status updated to CANCELLED, product stock restored
- **Verification Method**: snapshot / network

### E2E-017: Buyer cannot cancel a shipped order
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Logged in as BUYER, order with item status SHIPPED
- **User Journey**:
  1. Navigate to order detail of a shipped order
  2. Verify "Cancel" button is hidden or disabled
  3. Attempt direct API call: PATCH /api/orders/:id/status with CANCELLED
- **Expected Results**:
  - UI: No cancel option for shipped orders
  - API: Returns 400 (cannot cancel after shipping)
- **Verification Method**: snapshot / network

### E2E-018: Buyer cannot cancel a delivered order
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: Logged in as BUYER, order with DELIVERED status
- **User Journey**:
  1. Navigate to order detail of a delivered order
  2. Verify no cancellation option
- **Expected Results**:
  - UI: Cancel button not visible; status shown as "Delivered"
- **Verification Method**: snapshot

### E2E-019: Stock restoration after order cancellation
- **Type**: Edge Case
- **Priority**: High
- **Preconditions**: Logged in as BUYER, pending order exists, note product stock before cancellation
- **User Journey**:
  1. Note current stock of ordered product (via product detail page or API)
  2. Cancel the pending order
  3. Verify product stock is restored to previous value + cancelled quantity
- **Expected Results**:
  - DB: Product stock incremented by the cancelled order item quantities
  - API: Product detail reflects updated stock
- **Verification Method**: network

---

## Scenario Group 6: Seller — View Sales and Confirm Payment

### E2E-020: Seller views sales list
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SELLER with orders containing seller's products
- **User Journey**:
  1. Navigate to /dashboard/orders/sales
  2. Verify sales list renders with order details (order number, buyer info, items, status, date)
  3. Verify only orders containing this seller's products are shown
- **Expected Results**:
  - API: GET /api/orders/sales returns 200
  - UI: Sales table with relevant order data
- **Verification Method**: snapshot / network

### E2E-021: Seller views sales summary
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SELLER with past sales
- **User Journey**:
  1. Navigate to /dashboard/orders/sales
  2. Verify summary section shows: total orders, total revenue, pending count, completed count
- **Expected Results**:
  - API: GET /api/orders/sales/summary returns 200 with aggregated data
  - UI: Summary cards/widgets with correct figures
- **Verification Method**: snapshot / network

### E2E-022: Seller views individual order detail
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in as SELLER, sales order exists
- **User Journey**:
  1. Navigate to /dashboard/orders/sales
  2. Click on a sales order
  3. Verify detail page shows: buyer info, item list (with per-item status), payment info, shipping info
- **Expected Results**:
  - API: GET /api/orders/sales/:id returns 200
  - UI: Full sales order detail with item-level actions
- **Verification Method**: snapshot / network

### E2E-023: Seller confirms payment for an order item
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as SELLER, order item with pending payment (buyer submitted bank transfer)
- **User Journey**:
  1. Navigate to sales order detail
  2. Find item with "Payment Pending" status
  3. Click "Confirm Payment" button
  4. Confirm in dialog
  5. Verify item payment status updates to confirmed
- **Expected Results**:
  - API: PATCH /api/orders/sales/:orderId/items/:itemId/payment returns 200
  - DB: OrderItem payment status updated
  - UI: Item status badge changes to "Payment Confirmed"
- **Verification Method**: snapshot / network

### E2E-024: Non-seller user cannot access seller sales endpoints
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Logged in as BUYER (not SELLER or ADMIN)
- **User Journey**:
  1. Attempt to navigate to /dashboard/orders/sales
  2. Verify access denied or redirect
  3. Attempt direct API call: GET /api/orders/sales
- **Expected Results**:
  - UI: Access denied page or redirect to buyer dashboard
  - API: Returns 403 Forbidden
- **Verification Method**: snapshot / network

---

## Scenario Group 7: Seller — Update Item Status (Fulfillment Flow)

### E2E-025: Seller confirms order item (PENDING -> CONFIRMED)
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as SELLER, order item in PENDING status with confirmed payment
- **User Journey**:
  1. Navigate to sales order detail
  2. Find item in PENDING status
  3. Click "Confirm" action button
  4. Verify item status changes to CONFIRMED
- **Expected Results**:
  - API: PATCH /api/orders/sales/:orderId/items/:itemId/status with status=CONFIRMED returns 200
  - DB: OrderItem status updated to CONFIRMED
  - UI: Status badge updates
- **Verification Method**: snapshot / network

### E2E-026: Seller ships order item (CONFIRMED -> SHIPPED)
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as SELLER, order item in CONFIRMED status
- **User Journey**:
  1. Navigate to sales order detail
  2. Find item in CONFIRMED status
  3. Click "Ship" action button
  4. Enter tracking number (optional)
  5. Confirm shipping
  6. Verify item status changes to SHIPPED
- **Expected Results**:
  - API: PATCH /api/orders/sales/:orderId/items/:itemId/status with status=SHIPPED returns 200
  - DB: OrderItem status updated to SHIPPED
  - UI: Status badge updates to "Shipped"
- **Verification Method**: snapshot / network

### E2E-027: Seller marks item as delivered (SHIPPED -> DELIVERED)
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SELLER, order item in SHIPPED status
- **User Journey**:
  1. Navigate to sales order detail
  2. Find item in SHIPPED status
  3. Click "Mark Delivered" action
  4. Confirm delivery
  5. Verify item status changes to DELIVERED
- **Expected Results**:
  - API: PATCH /api/orders/sales/:orderId/items/:itemId/status with status=DELIVERED returns 200
  - DB: OrderItem status updated to DELIVERED
  - UI: Status badge updates to "Delivered"
- **Verification Method**: snapshot / network

### E2E-028: Seller cancels order item (PENDING -> CANCELLED)
- **Type**: Alternative Path
- **Priority**: Medium
- **Preconditions**: Logged in as SELLER, order item in PENDING status
- **User Journey**:
  1. Navigate to sales order detail
  2. Find item in PENDING status
  3. Click "Cancel" action
  4. Confirm cancellation
  5. Verify item status changes to CANCELLED
- **Expected Results**:
  - API: PATCH /api/orders/sales/:orderId/items/:itemId/status with status=CANCELLED returns 200
  - DB: OrderItem status updated to CANCELLED, product stock restored
  - UI: Status badge updates to "Cancelled"
- **Verification Method**: snapshot / network

### E2E-029: Seller cannot skip status steps (PENDING -> SHIPPED)
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: Logged in as SELLER, order item in PENDING status
- **User Journey**:
  1. Attempt direct API call: PATCH /api/orders/sales/:orderId/items/:itemId/status with status=SHIPPED
  2. Verify rejection
- **Expected Results**:
  - API: Returns 400 (invalid status transition)
  - DB: OrderItem status unchanged
- **Verification Method**: network

### E2E-030: Seller cannot revert delivered item status
- **Type**: Error Path
- **Priority**: Low
- **Preconditions**: Logged in as SELLER, order item in DELIVERED status
- **User Journey**:
  1. Attempt direct API call: PATCH /api/orders/sales/:orderId/items/:itemId/status with status=CONFIRMED
  2. Verify rejection
- **Expected Results**:
  - API: Returns 400 (cannot revert status)
  - UI: No status change action buttons for DELIVERED items
- **Verification Method**: network

---

## Scenario Group 8: Seller — Bulk Status Update

### E2E-031: Seller bulk updates multiple items to CONFIRMED
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SELLER, multiple order items in PENDING status
- **User Journey**:
  1. Navigate to /dashboard/orders/sales
  2. Select multiple order items via checkboxes
  3. Choose "Confirm" from bulk action dropdown
  4. Click "Apply" or "Update"
  5. Verify all selected items status change to CONFIRMED
- **Expected Results**:
  - API: POST /api/orders/sales/bulk-status returns 200 with success count
  - DB: All selected OrderItems updated to CONFIRMED
  - UI: All selected rows show updated status
- **Verification Method**: snapshot / network

### E2E-032: Seller bulk updates items to SHIPPED
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in as SELLER, multiple order items in CONFIRMED status
- **User Journey**:
  1. Select multiple confirmed items
  2. Choose "Ship" from bulk action
  3. Confirm bulk update
  4. Verify all selected items move to SHIPPED
- **Expected Results**:
  - API: POST /api/orders/sales/bulk-status returns 200
  - DB: All selected items updated to SHIPPED
- **Verification Method**: snapshot / network

### E2E-033: Bulk update with mixed statuses (partial failure)
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: Logged in as SELLER, selected items in different statuses (some PENDING, some CONFIRMED)
- **User Journey**:
  1. Select items with mixed statuses
  2. Choose "Ship" from bulk action (valid only for CONFIRMED)
  3. Submit bulk update
  4. Verify partial success — CONFIRMED items updated, PENDING items rejected
- **Expected Results**:
  - API: POST /api/orders/sales/bulk-status returns 200 with partial success details (or 207 Multi-Status)
  - UI: Success/failure summary displayed
- **Verification Method**: network

### E2E-034: Bulk update with no items selected
- **Type**: Edge Case
- **Priority**: Low
- **Preconditions**: Logged in as SELLER, on sales page
- **User Journey**:
  1. Do not select any items
  2. Attempt bulk action
  3. Verify validation message
- **Expected Results**:
  - UI: "Please select at least one item" message; bulk action button disabled or shows warning
- **Verification Method**: snapshot

---

## Scenario Group 9: Stock Deduction on Order

### E2E-035: Stock decrements when order is placed
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as BUYER, product with known stock (e.g., stock=10)
- **User Journey**:
  1. Note product stock via product detail page
  2. Add product to cart with quantity 3
  3. Complete checkout
  4. Navigate back to product detail page
  5. Verify stock decreased by 3
- **Expected Results**:
  - DB: Product stock = original stock - 3
  - UI: Product page shows updated stock
  - API: Product detail returns updated stock count
- **Verification Method**: network

### E2E-036: Order rejected when quantity exceeds available stock
- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: Logged in as BUYER, product with low stock (e.g., stock=2)
- **User Journey**:
  1. Add product to cart with quantity 5 (exceeds stock of 2)
  2. Proceed to checkout
  3. Submit order
  4. Verify error message about insufficient stock
- **Expected Results**:
  - UI: Error message: "Insufficient stock" or similar
  - API: POST /api/orders returns 400 with stock error
  - DB: No order created, stock unchanged
- **Verification Method**: snapshot / network

### E2E-037: Order for out-of-stock product
- **Type**: Edge Case
- **Priority**: High
- **Preconditions**: Product with stock=0
- **User Journey**:
  1. Navigate to product detail page
  2. Verify "Add to Cart" button is disabled or shows "Out of Stock"
  3. Attempt to add to cart (if possible via URL manipulation or API)
  4. Verify rejection
- **Expected Results**:
  - UI: "Out of Stock" label, disabled add to cart button
  - API: POST /api/orders returns 400 if attempted directly
- **Verification Method**: snapshot / network

### E2E-038: Concurrent orders for last stock item (race condition)
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: Product with stock=1, two authenticated sessions
- **User Journey**:
  1. Both users add product (quantity 1) to cart
  2. Both users submit orders near-simultaneously
  3. Verify only one order succeeds; the other receives insufficient stock error
- **Expected Results**:
  - DB: Only one Order created, product stock=0
  - API: One returns 201, the other returns 400
- **Verification Method**: network

---

## Scenario Group 10: Empty Cart Edge Cases

### E2E-039: Navigate to /checkout with empty cart
- **Type**: Edge Case
- **Priority**: High
- **Preconditions**: Logged in or guest, cart is empty (localStorage cleared)
- **User Journey**:
  1. Clear cart or start with fresh session
  2. Navigate directly to /checkout
  3. Verify redirect or empty cart message
- **Expected Results**:
  - UI: "Your cart is empty" message or redirect to /cart with empty state
  - No API call to create order
- **Verification Method**: snapshot

### E2E-040: View empty /cart page
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: Cart is empty
- **User Journey**:
  1. Navigate to /cart
  2. Verify empty state UI
  3. Verify "Continue Shopping" or similar CTA button
- **Expected Results**:
  - UI: Empty cart illustration/message, CTA to browse products
  - Checkout button disabled or hidden
- **Verification Method**: snapshot

### E2E-041: Remove all items from cart then attempt checkout
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: Items in cart
- **User Journey**:
  1. Navigate to /cart
  2. Remove all items one by one
  3. Verify cart shows empty state after last removal
  4. Verify checkout button becomes disabled
  5. Attempt to navigate to /checkout directly
  6. Verify redirect or empty cart handling
- **Expected Results**:
  - UI: Empty cart state after all removals; checkout blocked
  - localStorage: Cart data empty
- **Verification Method**: snapshot

### E2E-042: Cart with product that was deleted by seller
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: Product added to cart, then seller deletes or deactivates the product
- **User Journey**:
  1. Add product to cart
  2. Seller deletes or deactivates the product (simulate via DB or API)
  3. Navigate to /cart
  4. Verify stale product is handled (removed from cart or marked unavailable)
  5. Attempt checkout
  6. Verify order creation fails gracefully for unavailable product
- **Expected Results**:
  - UI: Cart shows "Product unavailable" or auto-removes the item
  - API: POST /api/orders returns 400 if stale product is included
- **Verification Method**: snapshot / network

---

## Summary

| Scenario Group | Scenario IDs | Count |
|---------------|-------------|-------|
| Add to Cart and Checkout | E2E-001 ~ E2E-004 | 4 |
| Guest Checkout | E2E-005 ~ E2E-007 | 3 |
| Order Payment (Bank Transfer) | E2E-008 ~ E2E-010 | 3 |
| Buyer Order History and Filtering | E2E-011 ~ E2E-015 | 5 |
| Order Cancellation | E2E-016 ~ E2E-019 | 4 |
| Seller — View Sales and Confirm Payment | E2E-020 ~ E2E-024 | 5 |
| Seller — Update Item Status (Fulfillment) | E2E-025 ~ E2E-030 | 6 |
| Seller — Bulk Status Update | E2E-031 ~ E2E-034 | 4 |
| Stock Deduction on Order | E2E-035 ~ E2E-038 | 4 |
| Empty Cart Edge Cases | E2E-039 ~ E2E-042 | 4 |
| **Total** | | **42** |

| Type | Count |
|------|-------|
| Happy Path | 21 |
| Alternative Path | 1 |
| Edge Case | 10 |
| Error Path | 10 |
| **Total** | **42** |

| Priority | Count |
|----------|-------|
| Critical | 7 |
| High | 14 |
| Medium | 15 |
| Low | 6 |
| **Total** | **42** |
