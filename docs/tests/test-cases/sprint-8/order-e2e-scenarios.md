# Order E2E Test Scenarios (Sprint 8)

## Overview
- **Feature**: Order lifecycle -- creation, checkout, payment, seller management, status transitions, bulk operations, stock management
- **Related Modules**: order, product, auth, mail
- **API Endpoints**: `/api/orders/*`
- **DB Tables**: TB_COMM_ORDR, TB_COMM_ORDR_ITEM, TH_COMM_ORDR_STTS, TB_PROD_PRD
- **Blueprints**: docs/blueprints/005-purchase-history/, docs/blueprints/009-payment-order/

## Test Data

| ID | Role | Email | Notes |
|----|------|-------|-------|
| TD-BUYER-01 | BUYER | buyer@vibe.com | Registered buyer |
| TD-BUYER-02 | BUYER | buyer2@vibe.com | Secondary buyer |
| TD-SELLER-01 | SELLER | seller@vibe.com | Owns products P1, P2, P3 |
| TD-SELLER-02 | SELLER | seller2@vibe.com | Owns product P4 |
| TD-ADMIN-01 | SUPER_ADMIN | admin@vibe.com | Super admin |
| TD-GUEST | -- | (none) | Unauthenticated user |
| TD-PROD-01 | -- | -- | Active product, stckQty=50, prdPrc=10000, seller=TD-SELLER-01 |
| TD-PROD-02 | -- | -- | Active product, stckQty=1, prdPrc=25000, prdSalePrc=20000, seller=TD-SELLER-01 |
| TD-PROD-03 | -- | -- | Active product, stckQty=100, prdPrc=5000, seller=TD-SELLER-01 |
| TD-PROD-04 | -- | -- | Active product, stckQty=10, prdPrc=15000, seller=TD-SELLER-02 |
| TD-PROD-INACTIVE | -- | -- | prdSttsCd=INACTIVE, stckQty=5 |
| TD-PROD-SOLDOUT | -- | -- | prdSttsCd=SOLD_OUT, stckQty=0 |

---

## Scenario Group 1: Order Creation (Buyer Flow)

### E2E-001: Create order with single item
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as TD-BUYER-01; TD-PROD-01 active with stckQty >= 2
- **User Journey**:
  1. Send `POST /api/orders` with Authorization header
  2. Body: `{ "items": [{ "productId": <TD-PROD-01.id>, "quantity": 2 }], "shipAddr": "Seoul, Korea", "shipRcvrNm": "Test User", "shipTelno": "010-1234-5678", "shipMemo": "Leave at door" }`
  3. Receive 201 response
- **Expected Results**:
  - **API**: Response contains `ordrNo` matching `VB-YYYY-MMDD-NNN` pattern, `ordrSttsCd: "PENDING"`, `ordrTotAmt: 20000`, items array with 1 item
  - **DB (TB_COMM_ORDR)**: New row with `byrId = TD-BUYER-01.id`, `ordrTotAmt = 20000`, `shipAddr = "Seoul, Korea"`
  - **DB (TB_COMM_ORDR_ITEM)**: 1 row with `unitPrc = 10000`, `ordrQty = 2`, `subtotAmt = 20000`, `itemSttsCd = "PENDING"`
  - **DB (TH_COMM_ORDR_STTS)**: 1 row with `prevSttsCd = ""`, `newSttsCd = "PENDING"`, `chngRsn = "Order created"`
  - **DB (TB_PROD_PRD)**: TD-PROD-01 `stckQty` decremented by 2, `soldCnt` incremented by 2
  - **Server Log**: `Order VB-YYYY-MMDD-NNN created by buyer <id>`
- **Verification Method**: API response assertion, DB query, server log check
- **Test Data**: TD-BUYER-01, TD-PROD-01

### E2E-002: Create order with multiple items from same seller
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as TD-BUYER-01; TD-PROD-01 and TD-PROD-03 active
- **User Journey**:
  1. Send `POST /api/orders` with `items: [{ productId: TD-PROD-01.id, quantity: 1 }, { productId: TD-PROD-03.id, quantity: 3 }]`
  2. Include shipping info
- **Expected Results**:
  - **API**: `ordrTotAmt = 10000 + 15000 = 25000`, items array with 2 items
  - **DB (TB_COMM_ORDR_ITEM)**: 2 rows created with correct `subtotAmt` per item
  - **DB (TB_PROD_PRD)**: Both products have stock decremented accordingly
- **Verification Method**: API response assertion, DB query
- **Test Data**: TD-BUYER-01, TD-PROD-01, TD-PROD-03

### E2E-003: Create order with multiple items from different sellers
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as TD-BUYER-01; TD-PROD-01 (seller 1) and TD-PROD-04 (seller 2) active
- **User Journey**:
  1. Send `POST /api/orders` with items from two different sellers
- **Expected Results**:
  - **API**: Single order created, `ordrTotAmt` = sum of all items
  - **DB (TB_COMM_ORDR_ITEM)**: Items have different `sllrId` values
- **Verification Method**: API response assertion, DB query
- **Test Data**: TD-BUYER-01, TD-PROD-01, TD-PROD-04

### E2E-004: Order confirmation email sent on create
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as TD-BUYER-01 (valid email); TD-PROD-01 active
- **User Journey**:
  1. Send `POST /api/orders` with valid items
  2. Check server logs for email dispatch
- **Expected Results**:
  - **Server Log**: No `Failed to send order confirmation email` error
  - **Email**: Order confirmation email sent to buyer's email with correct order number, item list, and total
- **Verification Method**: Server log check, mail service mock/spy verification
- **Test Data**: TD-BUYER-01, TD-PROD-01

### E2E-005: Create order uses sale price when available
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in as TD-BUYER-01; TD-PROD-02 has `prdSalePrc = 20000`
- **User Journey**:
  1. Send `POST /api/orders` with `items: [{ productId: TD-PROD-02.id, quantity: 1 }]`
- **Expected Results**:
  - **API**: `ordrTotAmt = 20000` (sale price used, not `prdPrc = 25000`)
  - **DB (TB_COMM_ORDR_ITEM)**: `unitPrc = 20000`
- **Verification Method**: API response assertion, DB query
- **Test Data**: TD-BUYER-01, TD-PROD-02

### E2E-006: Create order with empty items array
- **Type**: Negative
- **Priority**: High
- **Preconditions**: Logged in as TD-BUYER-01
- **User Journey**:
  1. Send `POST /api/orders` with `{ "items": [] }`
- **Expected Results**:
  - **API**: 400 Bad Request, validation error for `items` (ArrayMinSize)
  - **DB**: No order created
- **Verification Method**: API response status and error body
- **Test Data**: TD-BUYER-01

### E2E-007: Create order for non-existent product
- **Type**: Negative
- **Priority**: High
- **Preconditions**: Logged in as TD-BUYER-01
- **User Journey**:
  1. Send `POST /api/orders` with `items: [{ productId: 999999, quantity: 1 }]`
- **Expected Results**:
  - **API**: 404 Not Found, error code `PRODUCT_NOT_FOUND`
  - **DB**: No order created
- **Verification Method**: API response assertion
- **Test Data**: TD-BUYER-01

### E2E-008: Create order for inactive product
- **Type**: Negative
- **Priority**: High
- **Preconditions**: Logged in as TD-BUYER-01; TD-PROD-INACTIVE exists
- **User Journey**:
  1. Send `POST /api/orders` with `items: [{ productId: TD-PROD-INACTIVE.id, quantity: 1 }]`
- **Expected Results**:
  - **API**: 400 Bad Request, error code `PRODUCT_NOT_ACTIVE`
  - **DB**: No order created, no stock change
- **Verification Method**: API response assertion
- **Test Data**: TD-BUYER-01, TD-PROD-INACTIVE

### E2E-009: Create order without authentication
- **Type**: Negative / Security
- **Priority**: Critical
- **Preconditions**: No auth token
- **User Journey**:
  1. Send `POST /api/orders` without Authorization header
- **Expected Results**:
  - **API**: 401 Unauthorized
  - **DB**: No order created
- **Verification Method**: API response status
- **Test Data**: None

---

## Scenario Group 2: Guest Checkout Flow

### E2E-010: Guest checkout with valid data
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: No authentication; TD-PROD-01 active
- **User Journey**:
  1. Send `POST /api/orders/checkout` without Authorization header
  2. Body: `{ "items": [{ "productId": <TD-PROD-01.id>, "quantity": 1 }], "paymentMethod": "BANK_TRANSFER", "shipAddr": "Busan, Korea", "shipRcvrNm": "Guest User", "shipTelno": "010-9876-5432" }`
- **Expected Results**:
  - **API**: 201, response contains `ordrNo` matching `VB-YYYY-MMDD-NNN`, `ordrSttsCd: "PENDING"`, `payMthdCd: "BANK_TRANSFER"`
  - **DB (TB_COMM_ORDR)**: `byrId = 0` (guest placeholder), `payMthdCd = "BANK_TRANSFER"`
  - **DB (TH_COMM_ORDR_STTS)**: `chngRsn` contains `Guest order created with payment method: BANK_TRANSFER`
  - **DB (TB_PROD_PRD)**: Stock decremented
  - **Server Log**: `Checkout order ... created by guest with BANK_TRANSFER`
- **Verification Method**: API response assertion, DB query, server log check
- **Test Data**: TD-PROD-01

### E2E-011: Authenticated checkout with EMAIL_INVOICE
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as TD-BUYER-01; TD-PROD-01 active
- **User Journey**:
  1. Send `POST /api/orders/checkout` with Authorization header
  2. Body: `{ "items": [{ "productId": <TD-PROD-01.id>, "quantity": 2 }], "paymentMethod": "EMAIL_INVOICE" }`
- **Expected Results**:
  - **API**: 201, `byrId` = TD-BUYER-01.id, `payMthdCd: "EMAIL_INVOICE"`
  - **DB (TB_COMM_ORDR)**: `byrId` is actual user ID (not 0)
  - **Server Log**: Checkout order created by buyer, confirmation email dispatched
- **Verification Method**: API response assertion, DB query
- **Test Data**: TD-BUYER-01, TD-PROD-01

### E2E-012: Guest checkout does not send email
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: No authentication; TD-PROD-01 active
- **User Journey**:
  1. Send `POST /api/orders/checkout` as guest
- **Expected Results**:
  - **Server Log**: No email send attempt logged (guest has no email)
- **Verification Method**: Server log check, mail service spy
- **Test Data**: TD-PROD-01

### E2E-013: Checkout with invalid payment method
- **Type**: Negative
- **Priority**: High
- **Preconditions**: None
- **User Journey**:
  1. Send `POST /api/orders/checkout` with `paymentMethod: "CREDIT_CARD"`
- **Expected Results**:
  - **API**: 400 Bad Request, validation error for `paymentMethod` (not in `BANK_TRANSFER | EMAIL_INVOICE`)
- **Verification Method**: API response assertion
- **Test Data**: TD-PROD-01

### E2E-014: Checkout without payment method
- **Type**: Negative
- **Priority**: High
- **Preconditions**: None
- **User Journey**:
  1. Send `POST /api/orders/checkout` without `paymentMethod` field
- **Expected Results**:
  - **API**: 400 Bad Request, validation error
- **Verification Method**: API response assertion
- **Test Data**: TD-PROD-01

---

## Scenario Group 3: Payment Processing

### E2E-015: Pay a pending order
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as TD-BUYER-01; existing PENDING order owned by TD-BUYER-01
- **User Journey**:
  1. Send `PATCH /api/orders/:id/pay` with `{ "paymentMethod": "BANK_TRANSFER" }`
- **Expected Results**:
  - **API**: 200, order `ordrSttsCd: "PAID"`, `payMthdCd: "BANK_TRANSFER"`
  - **DB (TB_COMM_ORDR)**: `ordrSttsCd = "PAID"`, `payMthdCd = "BANK_TRANSFER"`
  - **DB (TB_COMM_ORDR_ITEM)**: All items `payStts = "PAID"`
  - **DB (TH_COMM_ORDR_STTS)**: New row `prevSttsCd = "PENDING"`, `newSttsCd = "PAID"`, `chngRsn` contains `Payment via BANK_TRANSFER`
  - **Server Log**: `Order ... paid by buyer ... via BANK_TRANSFER`
- **Verification Method**: API response assertion, DB query, server log check
- **Test Data**: TD-BUYER-01, pre-created PENDING order

### E2E-016: Pay an already-paid order
- **Type**: Negative
- **Priority**: High
- **Preconditions**: Logged in as TD-BUYER-01; existing PAID order
- **User Journey**:
  1. Send `PATCH /api/orders/:id/pay` on already-paid order
- **Expected Results**:
  - **API**: 400 Bad Request, error code `INVALID_STATUS_TRANSITION`, message contains `Cannot pay an order with status PAID`
- **Verification Method**: API response assertion
- **Test Data**: TD-BUYER-01, pre-created PAID order

### E2E-017: Pay order belonging to another buyer
- **Type**: Negative / Security
- **Priority**: Critical
- **Preconditions**: Logged in as TD-BUYER-02; order belongs to TD-BUYER-01
- **User Journey**:
  1. Send `PATCH /api/orders/:id/pay` on TD-BUYER-01's order
- **Expected Results**:
  - **API**: 403 Forbidden, error code `ORDER_ACCESS_DENIED`
  - **DB**: No changes
- **Verification Method**: API response assertion
- **Test Data**: TD-BUYER-02, TD-BUYER-01's order

### E2E-018: Pay non-existent order
- **Type**: Negative
- **Priority**: Medium
- **Preconditions**: Logged in as TD-BUYER-01
- **User Journey**:
  1. Send `PATCH /api/orders/999999/pay`
- **Expected Results**:
  - **API**: 404 Not Found, error code `ORDER_NOT_FOUND`
- **Verification Method**: API response assertion
- **Test Data**: TD-BUYER-01

### E2E-019: Seller confirms item payment
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as TD-SELLER-01; order with item belonging to TD-SELLER-01, `payStts = "UNPAID"`
- **User Journey**:
  1. Send `PATCH /api/orders/sales/:orderId/items/:itemId/payment`
- **Expected Results**:
  - **API**: 200, `{ success: true, message: "Payment confirmed" }`
  - **DB (TB_COMM_ORDR_ITEM)**: `payStts = "PAID"` for the item
  - **DB (TH_COMM_ORDR_STTS)**: New row with `chngRsn` containing `Payment confirmed by seller`
  - **Server Log**: `Seller ... confirmed payment for item ...`
- **Verification Method**: API response assertion, DB query, server log
- **Test Data**: TD-SELLER-01, order with unpaid item

### E2E-020: Seller confirms already-paid item
- **Type**: Negative
- **Priority**: Medium
- **Preconditions**: Logged in as TD-SELLER-01; item already has `payStts = "PAID"`
- **User Journey**:
  1. Send `PATCH /api/orders/sales/:orderId/items/:itemId/payment`
- **Expected Results**:
  - **API**: 400 Bad Request, error code `ALREADY_PAID`
- **Verification Method**: API response assertion
- **Test Data**: TD-SELLER-01, order with already-paid item

### E2E-021: All items paid triggers order status update to PAID
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as TD-SELLER-01; PENDING order with 2 items, 1 already PAID
- **User Journey**:
  1. Confirm payment on the last unpaid item via `PATCH /api/orders/sales/:orderId/items/:itemId/payment`
- **Expected Results**:
  - **DB (TB_COMM_ORDR)**: `ordrSttsCd` updated from `PENDING` to `PAID` automatically
  - **DB (TB_COMM_ORDR_ITEM)**: All items have `payStts = "PAID"`
- **Verification Method**: DB query
- **Test Data**: TD-SELLER-01, order with 2 items (1 paid, 1 unpaid)

---

## Scenario Group 4: Seller Order Management

### E2E-022: List seller sales orders
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as TD-SELLER-01; orders exist containing items from TD-SELLER-01
- **User Journey**:
  1. Send `GET /api/orders/sales`
- **Expected Results**:
  - **API**: 200, paginated list of orders containing items from TD-SELLER-01
  - Only orders with items belonging to this seller are returned
- **Verification Method**: API response assertion
- **Test Data**: TD-SELLER-01

### E2E-023: List seller sales with pagination
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as TD-SELLER-01; 15+ orders exist
- **User Journey**:
  1. Send `GET /api/orders/sales?page=1&limit=10`
  2. Then `GET /api/orders/sales?page=2&limit=10`
- **Expected Results**:
  - **API**: Page 1 returns 10 items, page 2 returns remaining items; no duplicates between pages
- **Verification Method**: API response assertion
- **Test Data**: TD-SELLER-01

### E2E-024: Get seller sales summary
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as TD-SELLER-01; multiple orders in various statuses
- **User Journey**:
  1. Send `GET /api/orders/sales/summary`
- **Expected Results**:
  - **API**: 200, summary object with aggregated totals (total orders, revenue, etc.)
- **Verification Method**: API response assertion, cross-check against DB
- **Test Data**: TD-SELLER-01

### E2E-025: Get seller order detail
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as TD-SELLER-01; order exists with items from TD-SELLER-01
- **User Journey**:
  1. Send `GET /api/orders/sales/:id`
- **Expected Results**:
  - **API**: 200, full order detail including items, buyer shipping info
- **Verification Method**: API response assertion
- **Test Data**: TD-SELLER-01, existing order

### E2E-026: Seller cannot access another seller's order detail
- **Type**: Negative / Security
- **Priority**: Critical
- **Preconditions**: Logged in as TD-SELLER-02; order belongs to TD-SELLER-01
- **User Journey**:
  1. Send `GET /api/orders/sales/:id` with ID of TD-SELLER-01's order
- **Expected Results**:
  - **API**: 404 Not Found or 403 Forbidden
- **Verification Method**: API response assertion
- **Test Data**: TD-SELLER-02, TD-SELLER-01's order

### E2E-027: Buyer cannot access seller sales endpoints
- **Type**: Negative / Security
- **Priority**: Critical
- **Preconditions**: Logged in as TD-BUYER-01
- **User Journey**:
  1. Send `GET /api/orders/sales`
  2. Send `GET /api/orders/sales/summary`
  3. Send `GET /api/orders/sales/:id`
- **Expected Results**:
  - **API**: All return 403 Forbidden (role guard: SELLER or SUPER_ADMIN only)
- **Verification Method**: API response status
- **Test Data**: TD-BUYER-01

### E2E-028: SUPER_ADMIN can access seller endpoints
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in as TD-ADMIN-01
- **User Journey**:
  1. Send `GET /api/orders/sales`
  2. Send `GET /api/orders/sales/summary`
- **Expected Results**:
  - **API**: 200, data returned (admin has SUPER_ADMIN role, allowed by `@Roles('SELLER', 'SUPER_ADMIN')`)
- **Verification Method**: API response assertion
- **Test Data**: TD-ADMIN-01

---

## Scenario Group 5: Order Status Lifecycle

### E2E-029: Update order status PENDING -> PAID -> CONFIRMED -> SHIPPED -> DELIVERED
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Logged in as TD-BUYER-01 (for pay), then TD-SELLER-01 or TD-ADMIN-01 (for subsequent updates); PENDING order exists
- **User Journey**:
  1. Pay order: `PATCH /api/orders/:id/pay` with `paymentMethod: "BANK_TRANSFER"` -- status becomes PAID
  2. Update status: `PATCH /api/orders/:id/status` with `{ "status": "CONFIRMED" }` -- PAID -> CONFIRMED
  3. Update status: `PATCH /api/orders/:id/status` with `{ "status": "SHIPPED", "reason": "Shipped via express" }` -- CONFIRMED -> SHIPPED
  4. Update status: `PATCH /api/orders/:id/status` with `{ "status": "DELIVERED" }` -- SHIPPED -> DELIVERED
- **Expected Results**:
  - **API**: Each step returns 200 with updated order
  - **DB (TB_COMM_ORDR)**: `ordrSttsCd` reflects final status after each step
  - **DB (TH_COMM_ORDR_STTS)**: 4 history rows total (PENDING->PAID, PAID->CONFIRMED, CONFIRMED->SHIPPED, SHIPPED->DELIVERED)
- **Verification Method**: API response assertion, DB query for status history
- **Test Data**: TD-BUYER-01, TD-SELLER-01

### E2E-030: Cancel an order with reason
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as TD-BUYER-01; PENDING order exists
- **User Journey**:
  1. Send `PATCH /api/orders/:id/status` with `{ "status": "CANCELLED", "reason": "Changed my mind" }`
- **Expected Results**:
  - **API**: 200, `ordrSttsCd: "CANCELLED"`
  - **DB (TH_COMM_ORDR_STTS)**: New row with `chngRsn = "Changed my mind"`
- **Verification Method**: API response assertion, DB query
- **Test Data**: TD-BUYER-01

### E2E-031: Refund an order
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in; PAID or CONFIRMED order exists
- **User Journey**:
  1. Send `PATCH /api/orders/:id/status` with `{ "status": "REFUNDED", "reason": "Defective product" }`
- **Expected Results**:
  - **API**: 200, `ordrSttsCd: "REFUNDED"`
  - **DB (TH_COMM_ORDR_STTS)**: History recorded with reason
- **Verification Method**: API response assertion, DB query
- **Test Data**: Pre-created PAID order

### E2E-032: Update status with invalid transition value
- **Type**: Negative
- **Priority**: Medium
- **Preconditions**: Logged in
- **User Journey**:
  1. Send `PATCH /api/orders/:id/status` with `{ "status": "INVALID_STATUS" }`
- **Expected Results**:
  - **API**: 400 Bad Request, validation error (status not in `PAID | CONFIRMED | SHIPPED | DELIVERED | CANCELLED | REFUNDED`)
- **Verification Method**: API response assertion
- **Test Data**: Any existing order

### E2E-033: Seller updates item status with tracking number
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as TD-SELLER-01; order item with `itemSttsCd = "CONFIRMED"`
- **User Journey**:
  1. Send `PATCH /api/orders/sales/:orderId/items/:itemId/status` with `{ "status": "SHIPPED", "trackingNumber": "CJ1234567890" }`
- **Expected Results**:
  - **API**: 200, item updated
  - **DB (TB_COMM_ORDR_ITEM)**: `itemSttsCd = "SHIPPED"`, tracking number stored
- **Verification Method**: API response assertion, DB query
- **Test Data**: TD-SELLER-01, order with CONFIRMED item

### E2E-034: Seller updates item status for item not belonging to them
- **Type**: Negative / Security
- **Priority**: Critical
- **Preconditions**: Logged in as TD-SELLER-02; order item belongs to TD-SELLER-01
- **User Journey**:
  1. Send `PATCH /api/orders/sales/:orderId/items/:itemId/status` with `{ "status": "SHIPPED" }`
- **Expected Results**:
  - **API**: 403 Forbidden, error code `ORDER_ACCESS_DENIED`
  - **DB**: No changes
- **Verification Method**: API response assertion
- **Test Data**: TD-SELLER-02, TD-SELLER-01's item

---

## Scenario Group 6: Bulk Operations

### E2E-035: Bulk update item statuses to SHIPPED
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Logged in as TD-SELLER-01; multiple order items in CONFIRMED status
- **User Journey**:
  1. Send `POST /api/orders/sales/bulk-status` with `{ "itemIds": ["<id1>", "<id2>", "<id3>"], "status": "SHIPPED", "trackingNumber": "BULK-TRK-001" }`
- **Expected Results**:
  - **API**: 201, all items updated
  - **DB (TB_COMM_ORDR_ITEM)**: All specified items have `itemSttsCd = "SHIPPED"`
  - **Server Log**: Bulk operation logged
- **Verification Method**: API response assertion, DB query
- **Test Data**: TD-SELLER-01, 3+ CONFIRMED items

### E2E-036: Bulk update with empty item IDs
- **Type**: Negative
- **Priority**: Medium
- **Preconditions**: Logged in as TD-SELLER-01
- **User Journey**:
  1. Send `POST /api/orders/sales/bulk-status` with `{ "itemIds": [], "status": "SHIPPED" }`
- **Expected Results**:
  - **API**: 400 Bad Request, validation error (ArrayMinSize)
- **Verification Method**: API response assertion
- **Test Data**: TD-SELLER-01

### E2E-037: Bulk update with invalid status
- **Type**: Negative
- **Priority**: Medium
- **Preconditions**: Logged in as TD-SELLER-01
- **User Journey**:
  1. Send `POST /api/orders/sales/bulk-status` with `{ "itemIds": ["<id1>"], "status": "INVALID" }`
- **Expected Results**:
  - **API**: 400 Bad Request, validation error (IsIn constraint)
- **Verification Method**: API response assertion
- **Test Data**: TD-SELLER-01

### E2E-038: Bulk update items from different sellers (partial ownership)
- **Type**: Negative / Security
- **Priority**: High
- **Preconditions**: Logged in as TD-SELLER-01; item list includes an item belonging to TD-SELLER-02
- **User Journey**:
  1. Send `POST /api/orders/sales/bulk-status` with mixed-seller item IDs
- **Expected Results**:
  - **API**: 403 Forbidden or partial failure (only seller's own items should be updatable)
  - **DB**: Items belonging to other sellers remain unchanged
- **Verification Method**: API response assertion, DB query
- **Test Data**: TD-SELLER-01, items from TD-SELLER-01 and TD-SELLER-02

---

## Scenario Group 7: Stock Management Edge Cases

### E2E-039: Order depletes stock to zero triggers SOLD_OUT
- **Type**: Edge Case
- **Priority**: Critical
- **Preconditions**: Logged in as TD-BUYER-01; TD-PROD-02 has `stckQty = 1`
- **User Journey**:
  1. Send `POST /api/orders` with `items: [{ productId: TD-PROD-02.id, quantity: 1 }]`
- **Expected Results**:
  - **API**: 201, order created successfully
  - **DB (TB_PROD_PRD)**: TD-PROD-02 `stckQty = 0`, `prdSttsCd = "SOLD_OUT"`
- **Verification Method**: API response assertion, DB query
- **Test Data**: TD-BUYER-01, TD-PROD-02 (stckQty=1)

### E2E-040: Order with quantity exceeding stock
- **Type**: Negative
- **Priority**: Critical
- **Preconditions**: Logged in as TD-BUYER-01; TD-PROD-02 has `stckQty = 1`
- **User Journey**:
  1. Send `POST /api/orders` with `items: [{ productId: TD-PROD-02.id, quantity: 5 }]`
- **Expected Results**:
  - **API**: 400 Bad Request, error code `INSUFFICIENT_STOCK`, message contains `available: 1, requested: 5`
  - **DB**: No order created, no stock change
- **Verification Method**: API response assertion, DB query
- **Test Data**: TD-BUYER-01, TD-PROD-02 (stckQty=1)

### E2E-041: Order for SOLD_OUT product
- **Type**: Negative
- **Priority**: High
- **Preconditions**: Logged in as TD-BUYER-01; TD-PROD-SOLDOUT has `prdSttsCd = "SOLD_OUT"`, `stckQty = 0`
- **User Journey**:
  1. Send `POST /api/orders` with `items: [{ productId: TD-PROD-SOLDOUT.id, quantity: 1 }]`
- **Expected Results**:
  - **API**: 400 Bad Request, error code `PRODUCT_NOT_ACTIVE`
  - **DB**: No order created
- **Verification Method**: API response assertion
- **Test Data**: TD-BUYER-01, TD-PROD-SOLDOUT

### E2E-042: Concurrent orders deplete stock (race condition)
- **Type**: Edge Case
- **Priority**: High
- **Preconditions**: TD-PROD-02 has `stckQty = 1`; two authenticated buyers
- **User Journey**:
  1. Simultaneously send `POST /api/orders` from TD-BUYER-01 and TD-BUYER-02 each requesting quantity 1 of TD-PROD-02
- **Expected Results**:
  - **API**: One order succeeds (201), the other fails with `INSUFFICIENT_STOCK` (400)
  - **DB**: Exactly 1 order created, `stckQty = 0`, product set to `SOLD_OUT`
  - Note: If no DB-level locking exists, both may succeed, resulting in negative stock -- this test documents actual behavior
- **Verification Method**: Concurrent API requests (Promise.all), DB query
- **Test Data**: TD-BUYER-01, TD-BUYER-02, TD-PROD-02 (stckQty=1)

### E2E-043: Order with quantity zero
- **Type**: Negative
- **Priority**: Medium
- **Preconditions**: Logged in as TD-BUYER-01
- **User Journey**:
  1. Send `POST /api/orders` with `items: [{ productId: TD-PROD-01.id, quantity: 0 }]`
- **Expected Results**:
  - **API**: 400 Bad Request, validation error (Min(1) constraint)
- **Verification Method**: API response assertion
- **Test Data**: TD-BUYER-01, TD-PROD-01

### E2E-044: Order with negative quantity
- **Type**: Negative
- **Priority**: Medium
- **Preconditions**: Logged in as TD-BUYER-01
- **User Journey**:
  1. Send `POST /api/orders` with `items: [{ productId: TD-PROD-01.id, quantity: -1 }]`
- **Expected Results**:
  - **API**: 400 Bad Request, validation error (Min(1) constraint)
- **Verification Method**: API response assertion
- **Test Data**: TD-BUYER-01, TD-PROD-01

---

## Scenario Group 8: Security Scenarios

### E2E-045: Buyer views own orders only
- **Type**: Security
- **Priority**: Critical
- **Preconditions**: Logged in as TD-BUYER-01; orders exist for TD-BUYER-01 and TD-BUYER-02
- **User Journey**:
  1. Send `GET /api/orders`
- **Expected Results**:
  - **API**: Only orders where `byrId = TD-BUYER-01.id` are returned; no orders from TD-BUYER-02
- **Verification Method**: API response assertion, verify all returned order IDs belong to buyer
- **Test Data**: TD-BUYER-01, TD-BUYER-02

### E2E-046: Buyer views order detail of another buyer
- **Type**: Negative / Security
- **Priority**: Critical
- **Preconditions**: Logged in as TD-BUYER-02; order belongs to TD-BUYER-01
- **User Journey**:
  1. Send `GET /api/orders/:id` with TD-BUYER-01's order ID
- **Expected Results**:
  - **API**: 403 Forbidden or 404 Not Found (role-based access denies cross-buyer access)
- **Verification Method**: API response assertion
- **Test Data**: TD-BUYER-02, TD-BUYER-01's order

### E2E-047: Unauthenticated access to buyer order list
- **Type**: Security
- **Priority**: Critical
- **Preconditions**: No auth token
- **User Journey**:
  1. Send `GET /api/orders` without Authorization header
- **Expected Results**:
  - **API**: 401 Unauthorized
- **Verification Method**: API response status
- **Test Data**: None

### E2E-048: Unauthenticated access to seller endpoints
- **Type**: Security
- **Priority**: Critical
- **Preconditions**: No auth token
- **User Journey**:
  1. Send `GET /api/orders/sales` without Authorization header
  2. Send `GET /api/orders/sales/summary` without Authorization header
  3. Send `POST /api/orders/sales/bulk-status` without Authorization header
- **Expected Results**:
  - **API**: All return 401 Unauthorized
- **Verification Method**: API response status
- **Test Data**: None

### E2E-049: Expired/invalid token on order creation
- **Type**: Security
- **Priority**: High
- **Preconditions**: Expired or malformed Firebase token
- **User Journey**:
  1. Send `POST /api/orders` with expired/invalid Authorization bearer token
- **Expected Results**:
  - **API**: 401 Unauthorized
  - **DB**: No order created
- **Verification Method**: API response status
- **Test Data**: Expired JWT token

### E2E-050: SQL injection in order status reason field
- **Type**: Security
- **Priority**: High
- **Preconditions**: Logged in as TD-BUYER-01; existing order
- **User Journey**:
  1. Send `PATCH /api/orders/:id/status` with `{ "status": "CANCELLED", "reason": "'; DROP TABLE TB_COMM_ORDR; --" }`
- **Expected Results**:
  - **API**: 200 (Prisma ORM parameterizes queries, injection is harmless)
  - **DB**: Reason stored as literal string, no SQL execution; TB_COMM_ORDR table intact
- **Verification Method**: API response assertion, DB query to verify table integrity
- **Test Data**: TD-BUYER-01

### E2E-051: XSS payload in shipping address
- **Type**: Security
- **Priority**: Medium
- **Preconditions**: Logged in as TD-BUYER-01; TD-PROD-01 active
- **User Journey**:
  1. Send `POST /api/orders` with `shipAddr: "<script>alert('xss')</script>"`
- **Expected Results**:
  - **API**: 201 (value stored as-is in DB)
  - **UI**: When order detail is rendered, address must be escaped/sanitized (no script execution)
- **Verification Method**: API response assertion, UI rendering check
- **Test Data**: TD-BUYER-01, TD-PROD-01

### E2E-052: Order number format validation
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Logged in as TD-BUYER-01; TD-PROD-01 active
- **User Journey**:
  1. Send `POST /api/orders` with valid data
  2. Extract `ordrNo` from response
- **Expected Results**:
  - **API**: `ordrNo` matches regex `^VB-\d{4}-\d{4}-\d{3}$` (e.g., `VB-2026-0325-001`)
- **Verification Method**: Regex assertion on response
- **Test Data**: TD-BUYER-01, TD-PROD-01

### E2E-053: Oversized shipping memo exceeds MaxLength
- **Type**: Negative
- **Priority**: Low
- **Preconditions**: Logged in as TD-BUYER-01
- **User Journey**:
  1. Send `POST /api/orders` with `shipMemo` containing 201+ characters
- **Expected Results**:
  - **API**: 400 Bad Request, validation error (MaxLength 200)
- **Verification Method**: API response assertion
- **Test Data**: TD-BUYER-01, TD-PROD-01

---

## Summary

| ID | Scenario | Group | Type | Priority |
|----|----------|-------|------|----------|
| E2E-001 | Create order with single item | 1. Order Creation | Happy Path | Critical |
| E2E-002 | Create order with multiple items (same seller) | 1. Order Creation | Happy Path | High |
| E2E-003 | Create order with multiple items (different sellers) | 1. Order Creation | Happy Path | High |
| E2E-004 | Order confirmation email sent on create | 1. Order Creation | Happy Path | High |
| E2E-005 | Sale price used when available | 1. Order Creation | Happy Path | Medium |
| E2E-006 | Create order with empty items array | 1. Order Creation | Negative | High |
| E2E-007 | Create order for non-existent product | 1. Order Creation | Negative | High |
| E2E-008 | Create order for inactive product | 1. Order Creation | Negative | High |
| E2E-009 | Create order without authentication | 1. Order Creation | Negative / Security | Critical |
| E2E-010 | Guest checkout with valid data | 2. Guest Checkout | Happy Path | Critical |
| E2E-011 | Authenticated checkout with EMAIL_INVOICE | 2. Guest Checkout | Happy Path | High |
| E2E-012 | Guest checkout does not send email | 2. Guest Checkout | Edge Case | Medium |
| E2E-013 | Checkout with invalid payment method | 2. Guest Checkout | Negative | High |
| E2E-014 | Checkout without payment method | 2. Guest Checkout | Negative | High |
| E2E-015 | Pay a pending order | 3. Payment | Happy Path | Critical |
| E2E-016 | Pay an already-paid order | 3. Payment | Negative | High |
| E2E-017 | Pay order belonging to another buyer | 3. Payment | Negative / Security | Critical |
| E2E-018 | Pay non-existent order | 3. Payment | Negative | Medium |
| E2E-019 | Seller confirms item payment | 3. Payment | Happy Path | High |
| E2E-020 | Seller confirms already-paid item | 3. Payment | Negative | Medium |
| E2E-021 | All items paid triggers order PAID | 3. Payment | Happy Path | High |
| E2E-022 | List seller sales orders | 4. Seller Management | Happy Path | Critical |
| E2E-023 | List seller sales with pagination | 4. Seller Management | Happy Path | High |
| E2E-024 | Get seller sales summary | 4. Seller Management | Happy Path | High |
| E2E-025 | Get seller order detail | 4. Seller Management | Happy Path | High |
| E2E-026 | Seller cannot access another seller's order | 4. Seller Management | Negative / Security | Critical |
| E2E-027 | Buyer cannot access seller endpoints | 4. Seller Management | Negative / Security | Critical |
| E2E-028 | SUPER_ADMIN can access seller endpoints | 4. Seller Management | Happy Path | Medium |
| E2E-029 | Full status lifecycle PENDING->DELIVERED | 5. Status Lifecycle | Happy Path | Critical |
| E2E-030 | Cancel order with reason | 5. Status Lifecycle | Happy Path | High |
| E2E-031 | Refund an order | 5. Status Lifecycle | Happy Path | High |
| E2E-032 | Invalid status transition value | 5. Status Lifecycle | Negative | Medium |
| E2E-033 | Seller updates item status with tracking | 5. Status Lifecycle | Happy Path | High |
| E2E-034 | Seller updates item not belonging to them | 5. Status Lifecycle | Negative / Security | Critical |
| E2E-035 | Bulk update items to SHIPPED | 6. Bulk Operations | Happy Path | High |
| E2E-036 | Bulk update with empty item IDs | 6. Bulk Operations | Negative | Medium |
| E2E-037 | Bulk update with invalid status | 6. Bulk Operations | Negative | Medium |
| E2E-038 | Bulk update items from different sellers | 6. Bulk Operations | Negative / Security | High |
| E2E-039 | Stock depletion triggers SOLD_OUT | 7. Stock Edge Cases | Edge Case | Critical |
| E2E-040 | Order quantity exceeds stock | 7. Stock Edge Cases | Negative | Critical |
| E2E-041 | Order for SOLD_OUT product | 7. Stock Edge Cases | Negative | High |
| E2E-042 | Concurrent orders race condition | 7. Stock Edge Cases | Edge Case | High |
| E2E-043 | Order with quantity zero | 7. Stock Edge Cases | Negative | Medium |
| E2E-044 | Order with negative quantity | 7. Stock Edge Cases | Negative | Medium |
| E2E-045 | Buyer views own orders only | 8. Security | Security | Critical |
| E2E-046 | Buyer views another buyer's order detail | 8. Security | Negative / Security | Critical |
| E2E-047 | Unauthenticated buyer order list | 8. Security | Security | Critical |
| E2E-048 | Unauthenticated seller endpoints | 8. Security | Security | Critical |
| E2E-049 | Expired/invalid token on order creation | 8. Security | Security | High |
| E2E-050 | SQL injection in status reason | 8. Security | Security | High |
| E2E-051 | XSS payload in shipping address | 8. Security | Security | Medium |
| E2E-052 | Order number format validation | 8. Security | Happy Path | Medium |
| E2E-053 | Oversized shipping memo | 8. Security | Negative | Low |

### Statistics
- **Total scenarios**: 53
- **Critical**: 16
- **High**: 24
- **Medium**: 11
- **Low**: 2
- **Happy Path**: 22
- **Negative**: 17
- **Edge Case**: 4
- **Security / Negative-Security**: 10
