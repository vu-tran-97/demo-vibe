# 009-Payment-Order: Simple Payment & Seller Order Management Blueprint

> Checkout flow with payment method selection (Bank Transfer / Email Invoice), order confirmation, and enhanced seller order management with per-item status tracking, tracking numbers, and bulk operations.

## 1. Overview

### 1.1 Purpose

Add a checkout page with simple payment method selection (no real PG integration) and enhance the seller order management dashboard with per-item status management, tracking number support, order detail views, and bulk status updates.

### 1.2 Scope

**Payment (Simple, No Real PG)**
- Checkout page with order summary from cart
- Payment method selection: Bank Transfer (QR code + bank details) or Email Invoice (mock send)
- After payment method selection, order status becomes PAID
- Payment confirmation page with order number

**Seller Order Management Enhancement**
- Seller views all orders containing their products
- Status flow per order item: PENDING -> CONFIRMED -> SHIPPED -> DELIVERED
- Seller updates individual order item status (confirm, ship with tracking number, deliver)
- Order detail view for seller: buyer info, items, payment status, status history
- Bulk status update (select multiple items -> confirm/ship)

### 1.3 Out of Scope

- Real payment gateway integration (Toss, Stripe, etc.)
- Refund processing
- Email/push notifications
- Invoice PDF generation
- Automatic tracking number import from shipping providers

### 1.4 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend Framework | NestJS (TypeScript) |
| ORM | Prisma (MongoDB Adapter) |
| Database | MongoDB 7 (replica set) |
| Validation | class-validator, class-transformer |
| Auth | @nestjs/jwt, @nestjs/passport (existing JwtAuthGuard) |
| Frontend Framework | Next.js 15 (App Router) |
| Styling | CSS Modules + Design Tokens |
| State | React hooks (useAuth, useCart — existing) |

### 1.5 Dependencies

| Dependency | Module | Reason |
|-----------|--------|--------|
| Auth Module (001-auth) | TB_COMM_USER, JwtAuthGuard | User identification, route protection |
| Product Module (004) | TB_PROD_PRD | Stock validation, price reference |
| Cart Hook (use-cart.ts) | useCart (localStorage) | Source of items for checkout |
| Order Module (005) | TB_COMM_ORDR, OrderService | Existing order infrastructure |
| RBAC Module (002-rbac) | @Roles decorator | SELLER role enforcement |

---

## 2. Architecture

### 2.1 Backend Enhancements

```
server/src/order/
├── order.controller.ts    # Enhanced: checkout, pay, seller item status, bulk, detail
├── order.service.ts       # Enhanced: checkout flow, item-level status, bulk ops
├── order.module.ts        # No changes
└── dto/
    ├── create-order.dto.ts       # Enhanced: add payMthdCd field
    ├── checkout-order.dto.ts     # NEW: checkout-specific DTO
    ├── update-item-status.dto.ts # NEW: per-item status update
    ├── bulk-status.dto.ts        # NEW: bulk status update
    ├── update-order-status.dto.ts
    └── list-orders-query.dto.ts
```

### 2.2 Frontend Routes

| Route | Page | Description |
|-------|------|-------------|
| `/dashboard/checkout` | Checkout | Order summary + payment method selection |
| `/dashboard/checkout/success` | Success | Order confirmation with order number |
| `/dashboard/orders/sales` | Sales (Enhanced) | Status actions per item, tracking input, bulk ops, detail modal |

### 2.3 Data Flow

```
[Cart Page] --"Proceed to Checkout"--> [Checkout Page]
    |                                       |
    |                                  Show order summary
    |                                  Select payment method
    |                                       |
    |                           POST /api/orders/checkout
    |                           (creates order with payment method)
    |                                       |
    |                           PATCH /api/orders/:id/pay
    |                           (marks order as PAID)
    |                                       |
    |                              [Success Page]
    |                              (order number displayed)

[Seller Sales] -- per item actions -->
    PATCH /api/orders/sales/:orderId/items/:itemId/status
    (PENDING -> CONFIRMED -> SHIPPED -> DELIVERED)

[Seller Sales] -- bulk action -->
    POST /api/orders/sales/bulk-status
    (multiple items at once)

[Seller Sales] -- detail view -->
    GET /api/orders/sales/:id
    (full order detail with buyer info, items, history)
```

---

## 3. API Design

### 3.1 POST /api/orders/checkout

Create order from cart with payment method.

**Request Body:**
```json
{
  "items": [
    { "productId": "abc123", "quantity": 2 }
  ],
  "paymentMethod": "BANK_TRANSFER",
  "shipAddr": "123 Main St",
  "shipRcvrNm": "John Doe",
  "shipTelno": "010-1234-5678",
  "shipMemo": "Leave at door"
}
```

**Response:** `{ success: true, data: Order }`

### 3.2 PATCH /api/orders/:id/pay

Mark order as PAID (simple, no real payment verification).

**Request Body:**
```json
{
  "paymentMethod": "BANK_TRANSFER"
}
```

**Response:** `{ success: true, data: Order }`

### 3.3 PATCH /api/orders/sales/:orderId/items/:itemId/status

Seller updates individual order item status.

**Request Body:**
```json
{
  "status": "SHIPPED",
  "trackingNumber": "TRACK-12345"
}
```

**Allowed transitions:**
- PENDING -> CONFIRMED (seller confirms)
- CONFIRMED -> SHIPPED (seller ships, tracking number optional)
- SHIPPED -> DELIVERED (seller marks delivered)

**Response:** `{ success: true, data: OrderItem }`

### 3.4 POST /api/orders/sales/bulk-status

Bulk update multiple order items.

**Request Body:**
```json
{
  "itemIds": ["id1", "id2", "id3"],
  "status": "CONFIRMED",
  "trackingNumber": "TRACK-BULK-001"
}
```

**Response:** `{ success: true, data: { updated: 3, failed: 0 } }`

### 3.5 GET /api/orders/sales/:id

Get full order detail for seller (buyer info, all items, payment status, status history).

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "orderNo": "VB-2026-0317-001",
    "buyer": { "name": "John", "email": "john@example.com" },
    "totalAmount": 150.00,
    "paymentMethod": "BANK_TRANSFER",
    "status": "PAID",
    "items": [
      {
        "id": "...",
        "productName": "Ceramic Vase",
        "quantity": 2,
        "unitPrice": 75.00,
        "subtotalAmount": 150.00,
        "itemStatus": "CONFIRMED",
        "trackingNumber": null
      }
    ],
    "statusHistory": [...],
    "shippingAddress": "...",
    "receiverName": "...",
    "receiverPhone": "...",
    "createdAt": "..."
  }
}
```

---

## 4. Database Changes

### 4.1 TB_COMM_ORDR — Add Payment Method

| Field | Type | Required | Constraint | Description |
|-------|------|----------|-----------|-------------|
| PAY_MTHD_CD | String | N | enum: BANK_TRANSFER/EMAIL_INVOICE | Payment method code |

### 4.2 TB_COMM_ORDR_ITEM — Add Item Status & Tracking

| Field | Type | Required | Constraint | Description |
|-------|------|----------|-----------|-------------|
| ITEM_STTS_CD | String | Y | enum: PENDING/CONFIRMED/SHIPPED/DELIVERED | Order item status (default: PENDING) |
| TRCKG_NO | String | N | max 100 | Tracking number |

### 4.3 TH_COMM_ORDR_STTS — Already Exists

No changes needed. Used for recording order-level and item-level status changes.

### 4.4 Code Table Addition

| Code Group | Code Value | Code Name |
|-----------|-----------|-----------|
| `PAY_MTHD` | `BANK_TRANSFER` | Bank Transfer |
| | `EMAIL_INVOICE` | Email Invoice |
| `ORDR_ITEM_STTS` | `PENDING` | Pending |
| | `CONFIRMED` | Confirmed |
| | `SHIPPED` | Shipped |
| | `DELIVERED` | Delivered |

---

## 5. Frontend Design

### 5.1 Checkout Page (`/dashboard/checkout`)

**Layout:**
- Left column: Order summary (items from cart with product name, quantity, unit price, subtotal)
- Right column: Payment method selection + shipping info form
- Two payment method cards (radio selection):
  - **Bank Transfer**: Shows QR code image (placeholder from qrserver.com API) + bank account info text
  - **Email Invoice**: Shows "Invoice will be sent to your email" message
- "Confirm Order" button at bottom

**Responsive:**
- Desktop: 2-column layout
- Tablet/Mobile: Single column, summary on top, payment below

### 5.2 Success Page (`/dashboard/checkout/success`)

- Centered confirmation card
- Success icon (checkmark)
- Order number prominently displayed
- "View My Orders" and "Continue Shopping" links
- Auto-generated from order response

### 5.3 Enhanced Sales Page (`/dashboard/orders/sales`)

**Enhancements over current:**
- Per-item status badges and action buttons (Confirm / Ship / Deliver)
- Tracking number input field when shipping
- Bulk select checkboxes on each item
- Floating bulk action bar when items selected
- Order detail modal (click order number to open)
- Detail modal shows: buyer info, all items with statuses, payment method, status timeline

**Responsive:**
- Desktop: Full table-like layout with inline actions
- Tablet: Condensed cards with action buttons below
- Mobile: Stacked cards, full-width action buttons

---

## 6. Status Flow

### 6.1 Order-Level Status
```
PENDING --> PAID --> (derived from item statuses)
   |
   v
CANCELLED
```

### 6.2 Item-Level Status (Seller manages)
```
PENDING --> CONFIRMED --> SHIPPED --> DELIVERED
```

- Order is marked PAID when buyer completes payment method selection
- Individual item statuses are managed by the seller
- Order-level status can derive from item statuses (all DELIVERED = order DELIVERED)

---

## 7. Acceptance Criteria

- [ ] Buyer can proceed from cart to checkout page
- [ ] Checkout shows correct order summary from cart
- [ ] Buyer can select Bank Transfer (sees QR + bank info) or Email Invoice
- [ ] After confirming, order is created and marked PAID
- [ ] Success page shows order number
- [ ] Seller sees all orders with per-item status
- [ ] Seller can confirm, ship (with tracking), and deliver individual items
- [ ] Seller can bulk-select items and apply status changes
- [ ] Seller can view full order detail in modal
- [ ] All pages are responsive (mobile/tablet/desktop)
- [ ] Status history is recorded for all transitions
