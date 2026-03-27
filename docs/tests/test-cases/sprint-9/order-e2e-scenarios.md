# Order E2E Test Scenarios

## Overview
- **Feature**: Order creation, checkout (guest + authenticated), payment, buyer order history, seller sales management
- **Related Modules**: Auth, Product, Email (order confirmation)
- **API Endpoints**: POST /api/orders, POST /api/orders/checkout, PATCH /api/orders/:id/pay, GET /api/orders, GET /api/orders/:id, PATCH /api/orders/:id/status, GET /api/orders/sales, GET /api/orders/sales/summary, GET /api/orders/sales/:id, PATCH /api/orders/sales/:orderId/items/:itemId/status, PATCH /api/orders/sales/:orderId/items/:itemId/payment, POST /api/orders/sales/bulk-status
- **DB Tables**: Order, OrderItem, Product, User
- **Blueprint**: docs/blueprints/009-payment-order/blueprint.md

## Scenario Group 1: Guest Checkout

### E2E-001: Guest checkout flow
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Not logged in, product in cart
- **User Journey**:
  1. Add products to cart from homepage
  2. Navigate to /cart
  3. Click "Checkout" or proceed to /checkout
  4. Fill shipping info (name, email, address, phone)
  5. Select payment method
  6. Submit order
  7. Verify order confirmation page
- **Expected Results**:
  - UI: Order success page with order number
  - API: POST /api/orders/checkout returns 201
  - DB: Order record created with buyerId=null (guest)
- **Verification Method**: snapshot / network

### E2E-002: Guest checkout with empty cart
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: Not logged in, cart is empty
- **User Journey**:
  1. Navigate to /checkout
  2. Verify empty cart message or redirect
- **Expected Results**:
  - UI: "Your cart is empty" message or redirect to homepage
- **Verification Method**: snapshot

## Scenario Group 2: Authenticated Checkout

### E2E-003: Authenticated buyer checkout
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as BUYER with items in cart
- **User Journey**:
  1. Navigate to /dashboard/cart
  2. Review items
  3. Click checkout
  4. Fill/confirm shipping info
  5. Submit order
  6. Verify success page
- **Expected Results**:
  - UI: Order confirmation with order details
  - API: POST /api/orders returns 201 with auth token
  - DB: Order with buyerId set
- **Verification Method**: snapshot / network

### E2E-004: Pay for an order
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in, order in PENDING status
- **User Journey**:
  1. Navigate to /dashboard/orders
  2. Select a pending order
  3. Click "Pay" or submit payment
  4. Verify order status changes to PAID
- **Expected Results**:
  - API: PATCH /api/orders/:id/pay returns 200
  - DB: Order status updated to PAID
- **Verification Method**: snapshot / network

## Scenario Group 3: Buyer Order History

### E2E-005: View buyer order list
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as BUYER with past orders
- **User Journey**:
  1. Navigate to /dashboard/orders
  2. Verify order list renders with status, date, total
  3. Verify pagination works
- **Expected Results**:
  - API: GET /api/orders returns 200
  - UI: Order cards with status badges
- **Verification Method**: snapshot / network

### E2E-006: View order detail
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in, order exists
- **User Journey**:
  1. Click on an order in order list
  2. Verify order detail: items, quantities, prices, status, shipping info
- **Expected Results**:
  - API: GET /api/orders/:id returns 200
  - UI: Full order detail displayed
- **Verification Method**: snapshot / network

### E2E-007: Cancel an order
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in, order in PENDING status
- **User Journey**:
  1. Navigate to order detail
  2. Click "Cancel" button
  3. Confirm cancellation
  4. Verify status changes to CANCELLED
- **Expected Results**:
  - API: PATCH /api/orders/:id/status with status=CANCELLED returns 200
  - DB: Order status updated
- **Verification Method**: snapshot / network

## Scenario Group 4: Seller Sales Management

### E2E-008: Seller views sales dashboard
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SELLER with sales orders
- **User Journey**:
  1. Navigate to /dashboard/orders/sales
  2. Verify sales list with order details
  3. Verify sales summary statistics
- **Expected Results**:
  - API: GET /api/orders/sales returns 200, GET /api/orders/sales/summary returns 200
  - UI: Sales table with filters, summary cards
- **Verification Method**: snapshot / network

### E2E-009: Seller updates item status (shipping)
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as SELLER, order with PAID items
- **User Journey**:
  1. Navigate to sales order detail
  2. Click "Ship" on an item
  3. Enter tracking number
  4. Confirm
  5. Verify item status changes to SHIPPED
- **Expected Results**:
  - API: PATCH /api/orders/sales/:orderId/items/:itemId/status returns 200
  - DB: OrderItem status updated to SHIPPED
- **Verification Method**: snapshot / network

### E2E-010: Seller confirms item payment
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in as SELLER, order with pending payment items
- **User Journey**:
  1. Navigate to sales order detail
  2. Click "Confirm Payment" on an item
  3. Verify item payment status updated
- **Expected Results**:
  - API: PATCH /api/orders/sales/:orderId/items/:itemId/payment returns 200
- **Verification Method**: snapshot / network

---

## Summary
| Type | Count |
|------|-------|
| Happy Path | 9 |
| Alternative Path | 0 |
| Edge Case | 0 |
| Error Path | 1 |
| **Total** | **10** |
