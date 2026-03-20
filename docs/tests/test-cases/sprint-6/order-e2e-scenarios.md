# Order & Payment E2E Test Scenarios (Sprint 6)

## Overview
- **Feature**: Order lifecycle — cart, checkout, payment, buyer history, seller management, per-item status
- **Related Modules**: order, product, auth, cart
- **API Endpoints**: `/api/orders/*`
- **DB Tables**: TB_COMM_ORDR, TB_COMM_ORDR_ITEM, TH_COMM_ORDR_STTS, TB_PROD_PRD
- **Blueprint**: docs/blueprints/005-purchase-history/, docs/blueprints/009-payment-order/

## Scenario Group 1: Cart to Checkout

### E2E-001: Add product to cart and checkout
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as buyer, products available with stock
- **User Journey**:
  1. Navigate to `/products/{id}`
  2. Click "Add to Cart"
  3. Verify cart count updates in header
  4. Navigate to `/cart`
  5. Verify item in cart with correct price/quantity
  6. Click "Proceed to Checkout"
  7. Select payment method (Bank Transfer)
  8. Fill shipping info
  9. Click "Confirm Order"
  10. Verify redirect to `/checkout/success`
  11. Note order number
- **Expected Results**:
  - UI: Cart badge updates, checkout form works, success page with order number
  - API: `POST /api/orders/checkout` returns order with `orderNo`
  - DB: Order + items created, stock decremented
- **Verification Method**: snapshot / network / server-log
- **Test Data**: `buyer@vibe.com` / `Buyer@123`, any active product

### E2E-002: Update cart quantity
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Items in cart
- **User Journey**:
  1. Navigate to `/cart`
  2. Change quantity of an item
  3. Verify subtotal and total update
- **Expected Results**:
  - UI: Prices update correctly based on new quantity
- **Verification Method**: snapshot
- **Test Data**: Existing cart items

### E2E-003: Remove item from cart
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Items in cart
- **User Journey**:
  1. Navigate to `/cart`
  2. Click remove button on an item
  3. Verify item removed, totals updated
- **Expected Results**:
  - UI: Item removed from cart list
- **Verification Method**: snapshot
- **Test Data**: Cart with multiple items

## Scenario Group 2: Buyer Order History

### E2E-004: View purchase history
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Buyer has placed orders
- **User Journey**:
  1. Log in as buyer
  2. Navigate to `/orders`
  3. Verify order list with order numbers, dates, statuses
  4. Click on an order to view details
  5. Verify order detail modal shows items, status timeline, shipping info
- **Expected Results**:
  - API: `GET /api/orders` returns paginated orders
  - UI: Order cards with status badges, detail modal with timeline
- **Verification Method**: snapshot / network
- **Test Data**: Buyer with existing orders

### E2E-005: Filter orders by status
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Buyer has orders in different statuses
- **User Journey**:
  1. Navigate to `/orders`
  2. Click "Processing" tab filter
  3. Verify only PENDING orders shown
  4. Click "Delivered" tab
  5. Verify only DELIVERED orders shown
- **Expected Results**:
  - API: `GET /api/orders?itemStatus=PENDING` returns filtered results
  - UI: Only matching orders displayed
- **Verification Method**: snapshot / network
- **Test Data**: Orders in multiple statuses

### E2E-006: Filter orders by payment status
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Orders with both paid and unpaid status
- **User Journey**:
  1. Navigate to `/orders`
  2. Click "Unpaid" payment filter
  3. Verify only unpaid orders shown
- **Expected Results**:
  - API: `GET /api/orders?paymentStatus=UNPAID`
  - UI: Filtered results
- **Verification Method**: network
- **Test Data**: Mix of paid/unpaid orders

### E2E-007: Cancel pending order
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Buyer has a PENDING order
- **User Journey**:
  1. Navigate to `/orders`
  2. Click on a PENDING order
  3. Click "Cancel Order" in detail modal
  4. Confirm cancellation
  5. Verify order status changes to CANCELLED
- **Expected Results**:
  - API: `PATCH /api/orders/:id/status` with `status: 'CANCELLED'`
  - DB: Order status updated, stock restored
- **Verification Method**: snapshot / network
- **Test Data**: A PENDING order

### E2E-008: Cannot cancel non-pending order
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Order in PAID or SHIPPED status
- **User Journey**:
  1. Attempt to cancel a PAID order via API
  2. Verify rejection
- **Expected Results**:
  - API: Returns `INVALID_STATUS_TRANSITION` error
- **Verification Method**: network
- **Test Data**: PAID order ID

## Scenario Group 3: Seller Order Management

### E2E-009: Seller views sales dashboard
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Seller has received orders
- **User Journey**:
  1. Log in as seller
  2. Navigate to `/dashboard/orders/sales`
  3. Verify sales list shows order items with buyer info
  4. Verify revenue summary is displayed
- **Expected Results**:
  - API: `GET /api/orders/sales`, `GET /api/orders/sales/summary`
  - UI: Sales items with status badges, summary stats
- **Verification Method**: snapshot / network
- **Test Data**: `seller1@yopmail.com` / `Admin@123`

### E2E-010: Seller updates item status through lifecycle
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Seller has PENDING order items
- **User Journey**:
  1. Navigate to `/dashboard/orders/sales`
  2. Find a PENDING item, click "Confirm"
  3. Verify status changes to CONFIRMED
  4. Click "Ship" and enter tracking number
  5. Verify status changes to SHIPPED with tracking number
  6. Click "Deliver"
  7. Verify status changes to DELIVERED
- **Expected Results**:
  - API: `PATCH /api/orders/sales/:orderId/items/:itemId/status` for each transition
  - DB: Item status transitions PENDING → CONFIRMED → SHIPPED → DELIVERED
  - Server Log: Status change logged for each transition
- **Verification Method**: snapshot / network / server-log
- **Test Data**: Order with PENDING items for seller1

### E2E-011: Seller confirms item payment
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Seller has unpaid order items
- **User Journey**:
  1. Navigate to `/dashboard/orders/sales`
  2. Find unpaid item, click "Confirm Payment"
  3. Verify payment status changes to PAID
- **Expected Results**:
  - API: `PATCH /api/orders/sales/:orderId/items/:itemId/payment`
  - DB: Item `payStts` changes to `'PAID'`
- **Verification Method**: network
- **Test Data**: Unpaid order item

### E2E-012: Seller bulk updates item statuses
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Multiple PENDING items from same seller
- **User Journey**:
  1. Navigate to `/dashboard/orders/sales`
  2. Select multiple PENDING items
  3. Click "Bulk Confirm"
  4. Verify all selected items change to CONFIRMED
- **Expected Results**:
  - API: `POST /api/orders/sales/bulk-status` returns `updated: N`
  - DB: All selected items updated
- **Verification Method**: network
- **Test Data**: 2+ PENDING items for seller1

### E2E-013: Seller cannot modify another seller's items
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Order contains items from different sellers
- **User Journey**:
  1. Log in as seller1
  2. Attempt to update status of an item belonging to seller2
  3. Verify access denied
- **Expected Results**:
  - API: Returns `ORDER_ACCESS_DENIED` (403)
- **Verification Method**: network
- **Test Data**: Item ID from seller2's inventory

---

## Summary
| Type | Count |
|------|-------|
| Happy Path | 10 |
| Alternative Path | 0 |
| Edge Case | 0 |
| Error Path | 3 |
| **Total** | **13** |
