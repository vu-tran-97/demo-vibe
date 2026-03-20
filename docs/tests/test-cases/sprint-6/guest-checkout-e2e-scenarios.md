# Guest Checkout E2E Test Scenarios

## Overview
- **Feature**: Guest users can place orders without authentication; they will not have order history
- **Related Modules**: auth, order, product, cart
- **API Endpoints**: `POST /api/orders/checkout` (now @Public), `GET /api/products`
- **DB Tables**: TB_COMM_ORDR, TB_COMM_ORDR_ITEM, TH_COMM_ORDR_STTS, TB_PROD_PRD
- **Blueprint**: docs/blueprints/009-payment-order/blueprint.md (extended with guest checkout)

## Scenario Group 1: Guest Checkout Flow

### E2E-001: Guest completes checkout with Bank Transfer
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Products seeded with stock > 0, user is NOT logged in
- **User Journey**:
  1. Navigate to `/` (homepage)
  2. Click on a product card to go to `/products/{id}`
  3. Click "Add to Cart" button
  4. Navigate to `/cart`
  5. Click "Proceed to Checkout" to go to `/checkout`
  6. Verify guest notice banner is visible: "You are checking out as a guest..."
  7. Select "Bank Transfer" payment method
  8. Fill shipping info: Receiver Name, Phone, Address, Memo
  9. Click "Confirm Order"
  10. Verify redirect to `/checkout/success?orderNo=VB-...`
  11. Verify "Sign in to track your order history" message is shown
  12. Verify "Continue Shopping" is the primary action (no "View My Orders" link)
- **Expected Results**:
  - UI: Success page shows order number, no "View My Orders" link, guest message displayed
  - API: `POST /api/orders/checkout` returns `success: true` with `orderNo`
  - DB: Order created with `byrId: '000000000000000000000000'`, items with `itemSttsCd: 'PENDING'`
  - Server Log: `Checkout order VB-... created by guest with BANK_TRANSFER`
- **Verification Method**: snapshot / network / server-log
- **Test Data**: Any active product with stock, shipping info: "Guest User", "010-0000-0000", "123 Guest St"

### E2E-002: Guest completes checkout with Email Invoice
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Products seeded, user NOT logged in, items in cart
- **User Journey**:
  1. Navigate to `/checkout` with items in cart
  2. Select "Email Invoice" payment method
  3. Fill shipping info
  4. Click "Confirm Order"
  5. Verify redirect to `/checkout/success`
- **Expected Results**:
  - UI: Success page shows order number
  - API: `POST /api/orders/checkout` with `paymentMethod: 'EMAIL_INVOICE'` returns success
  - DB: Order created with `payMthdCd: 'EMAIL_INVOICE'`, `byrId: '000000000000000000000000'`
- **Verification Method**: network / server-log
- **Test Data**: Email Invoice payment, minimal shipping info

### E2E-003: Guest sees notice banner but can still sign in
- **Type**: Alternative Path
- **Priority**: Medium
- **Preconditions**: Items in cart, user NOT logged in
- **User Journey**:
  1. Navigate to `/checkout`
  2. Verify yellow notice banner is visible
  3. Click "Sign in" link within the banner
  4. Verify AuthModal opens (login/signup form)
  5. Log in with valid credentials
  6. Verify notice banner disappears
  7. Complete checkout as authenticated user
  8. Verify success page shows "View My Orders" link
- **Expected Results**:
  - UI: Banner disappears after login, success page shows "View My Orders"
  - API: Checkout request includes Authorization header after login
  - DB: Order created with actual user's `byrId`
- **Verification Method**: snapshot / network
- **Test Data**: Existing buyer account: `buyer@vibe.com` / `Buyer@123`

### E2E-004: Guest checkout with empty cart
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: Cart is empty, user NOT logged in
- **User Journey**:
  1. Navigate to `/checkout` with no items in cart
  2. Verify empty state message: "Your cart is empty"
  3. Verify "Go to Cart" link is displayed
- **Expected Results**:
  - UI: Empty state shown, no checkout form
  - API: No API calls made
- **Verification Method**: snapshot
- **Test Data**: None (empty cart)

### E2E-005: Guest order does not appear in order history
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Guest has placed an order, then signs up/logs in
- **User Journey**:
  1. Complete guest checkout (E2E-001)
  2. Note the order number from success page
  3. Navigate to `/` and sign up or log in
  4. Navigate to `/orders`
  5. Verify the guest order is NOT in the order list
- **Expected Results**:
  - UI: Order history does not contain the guest order
  - API: `GET /api/orders` returns only orders with buyer's actual ID, not `000000000000000000000000`
- **Verification Method**: snapshot / network
- **Test Data**: Guest order number, then login as `buyer@vibe.com`

### E2E-006: Guest checkout with out-of-stock product
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Product in cart has 0 stock (depleted after adding to cart)
- **User Journey**:
  1. Add a product with low stock to cart
  2. (Simulate stock depletion — another user buys remaining stock)
  3. Navigate to `/checkout`
  4. Click "Confirm Order"
  5. Verify error message displayed
- **Expected Results**:
  - UI: Error message: "insufficient stock"
  - API: `POST /api/orders/checkout` returns `success: false`, error `INSUFFICIENT_STOCK`
  - DB: No order created
- **Verification Method**: network
- **Test Data**: Product with `stckQty: 0`

### E2E-007: Guest checkout with invalid/missing product
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: Cart contains a deleted or non-existent product ID
- **User Journey**:
  1. Manipulate localStorage cart to include a non-existent product ID
  2. Navigate to `/checkout`
  3. Click "Confirm Order"
  4. Verify error message displayed
- **Expected Results**:
  - API: `POST /api/orders/checkout` returns `PRODUCT_NOT_FOUND`
  - UI: Error message shown
- **Verification Method**: network
- **Test Data**: Fake product ID: `000000000000000000000001`

## Scenario Group 2: Authenticated vs Guest Checkout Comparison

### E2E-008: Authenticated user checkout (no guest banner)
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: User logged in, items in cart
- **User Journey**:
  1. Log in as buyer
  2. Navigate to `/checkout` with items in cart
  3. Verify NO guest notice banner is shown
  4. Complete checkout
  5. Verify success page shows "View My Orders" link
- **Expected Results**:
  - UI: No yellow banner, "View My Orders" link present on success page
  - API: Authorization header included in checkout request
  - DB: Order created with buyer's actual ID
- **Verification Method**: snapshot / network
- **Test Data**: `buyer@vibe.com` / `Buyer@123`

## Scenario Group 3: Seller Handling of Guest Orders

### E2E-009: Seller sees guest order in sales dashboard
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Guest has placed an order for seller1's product
- **User Journey**:
  1. Complete guest checkout for a seller1 product
  2. Log in as seller1
  3. Navigate to `/dashboard/orders/sales`
  4. Verify the guest order appears in the sales list
  5. Click on the order to view details
  6. Verify buyer info shows guest identifier
- **Expected Results**:
  - UI: Order visible in seller sales dashboard
  - API: `GET /api/orders/sales` includes the guest order
  - DB: Order item has `sllrId` matching seller1
- **Verification Method**: snapshot / network
- **Test Data**: `seller1@yopmail.com` / `Admin@123`

---

## Summary
| Type | Count |
|------|-------|
| Happy Path | 5 |
| Alternative Path | 1 |
| Edge Case | 1 |
| Error Path | 2 |
| **Total** | **9** |
