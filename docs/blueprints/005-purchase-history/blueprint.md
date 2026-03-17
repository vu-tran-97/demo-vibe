# 005-Purchase-History: Order & Purchase History Module Blueprint

> Complete order management system — cart-to-order conversion, buyer purchase history, seller sales dashboard, order status lifecycle, and stock management.

## 1. Overview

### 1.1 Purpose

Replace the hardcoded mock data in the orders page with a fully functional order management system. Enable buyers to place orders from their cart, track purchase history, and allow sellers to manage orders containing their products with revenue insights.

### 1.2 Scope

- Order creation from cart (stock validation, total calculation, order number generation)
- Buyer purchase history with pagination, status filtering, and date range filtering
- Order detail view with item list, status timeline, and shipping info
- Order status lifecycle management (state machine transitions)
- Seller sales history (orders containing their products)
- Seller revenue summary and aggregation
- Stock deduction on order creation, restoration on cancellation
- Order status history audit trail

### 1.3 Out of Scope

- Payment gateway integration (future sprint — orders start as PENDING)
- Shipping provider integration / tracking number auto-generation
- Refund processing (REFUNDED status reserved for future)
- Email/push notifications on status change
- Invoice generation / PDF export
- Product reviews linked to orders
- Coupon / discount code application

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
| Auth Module (001-auth) | TB_COMM_USER, JwtAuthGuard, @CurrentUser | User identification, route protection |
| Product Module | TB_PROD_PRD (stckQty, sellerId) | Stock validation, seller identification, price reference |
| Cart Hook (use-cart.ts) | useCart (localStorage) | Source of items for order creation |
| RBAC Module (002-rbac) | @Roles decorator, RolesGuard | Role-based endpoint access (BUYER, SELLER, ADMIN) |
| Common Code (TC_COMM_CD) | ORDR_STTS code group | Order status code values |

---

## 2. Architecture

### 2.1 Backend Module Structure

```
server/src/
├── orders/
│   ├── orders.module.ts              # Module declaration + imports
│   ├── orders.controller.ts          # Buyer order endpoints
│   ├── orders-seller.controller.ts   # Seller sales endpoints
│   ├── orders.service.ts             # Core order business logic
│   ├── orders-seller.service.ts      # Seller-specific queries and aggregation
│   ├── dto/
│   │   ├── create-order.dto.ts       # Cart items + shipping address
│   │   ├── order-query.dto.ts        # Pagination, status filter, date range
│   │   ├── seller-query.dto.ts       # Seller sales query params
│   │   ├── update-status.dto.ts      # New status + optional note
│   │   └── order-response.dto.ts     # Response shape definitions
│   ├── interfaces/
│   │   ├── order.interface.ts        # Order-related type definitions
│   │   └── order-status.enum.ts      # Status enum + transition map
│   └── helpers/
│       └── order-number.helper.ts    # VB-YYYY-MMDD-NNN generator
```

### 2.2 Frontend Module Structure

```
src/
├── app/dashboard/orders/
│   ├── page.tsx                      # Buyer order history page (refactor existing)
│   ├── orders.module.css             # Existing styles (extend)
│   └── [id]/
│       └── page.tsx                  # Order detail page (optional deep link)
├── app/dashboard/sales/
│   ├── page.tsx                      # Seller sales history page
│   └── sales.module.css              # Seller sales styles
├── components/orders/
│   ├── order-card.tsx                # Reusable order card component
│   ├── order-detail-modal.tsx        # Order detail modal with status timeline
│   ├── order-status-badge.tsx        # Status badge with color coding
│   ├── order-status-timeline.tsx     # Visual step-by-step status timeline
│   ├── order-filters.tsx             # Status tabs + date range picker
│   └── checkout-modal.tsx            # Cart checkout → order creation modal
├── components/sales/
│   ├── sales-summary-card.tsx        # Revenue/order count summary
│   ├── sales-order-card.tsx          # Seller-view order card
│   └── status-update-dropdown.tsx    # Seller status update control
├── hooks/
│   └── use-orders.ts                 # Order API hook (CRUD, queries)
└── lib/
    └── order-types.ts                # Shared TypeScript types
```

---

## 3. Database Design

### 3.1 New Collections

#### TB_COMM_ORDR (Order)

| Field | Prisma Name | DB Column | Type | Description |
|-------|-------------|-----------|------|-------------|
| ID | id | _id | ObjectId | Primary key |
| Order Number | ordrNo | ORDR_NO | String (unique) | VB-YYYY-MMDD-NNN format |
| Buyer ID | buyerId | BUYR_ID | ObjectId (FK → TB_COMM_USER) | Buyer reference |
| Order Status | ordrSttsCd | ORDR_STTS_CD | String | PENDING / PAID / SHIPPED / DELIVERED / CANCELLED |
| Total Amount | totAmt | TOT_AMT | Float | Sum of all item subtotals |
| Item Count | itemCnt | ITEM_CNT | Int | Total number of items |
| Shipping Address | shpngAddr | SHPNG_ADDR | String | Full shipping address |
| Shipping Zip Code | shpngZpcd | SHPNG_ZPCD | String? | Zip/postal code |
| Recipient Name | rcpntNm | RCPNT_NM | String | Recipient name |
| Recipient Phone | rcpntTelno | RCPNT_TELNO | String | Recipient phone |
| Order Note | ordrNote | ORDR_NOTE | String? | Buyer note/memo |
| Registered Date | rgstDt | RGST_DT | DateTime | Created at |
| Registrant ID | rgtrId | RGTR_ID | String? | Created by |
| Modified Date | mdfcnDt | MDFCN_DT | DateTime | Updated at |
| Modifier ID | mdfrId | MDFR_ID | String? | Updated by |
| Delete Flag | delYn | DEL_YN | String | Soft delete (Y/N) |

#### TB_COMM_ORDR_ITEM (Order Item)

| Field | Prisma Name | DB Column | Type | Description |
|-------|-------------|-----------|------|-------------|
| ID | id | _id | ObjectId | Primary key |
| Order ID | orderId | ORDR_ID | ObjectId (FK → TB_COMM_ORDR) | Parent order |
| Product ID | productId | PRD_ID | ObjectId (FK → TB_PROD_PRD) | Product reference |
| Seller ID | sellerId | SLLR_ID | ObjectId (FK → TB_COMM_USER) | Seller reference (denormalized for query performance) |
| Product Name | prdNm | PRD_NM | String | Snapshot at order time |
| Product Image | prdImgUrl | PRD_IMG_URL | String | Snapshot at order time |
| Unit Price | unitPrc | UNIT_PRC | Float | Price at order time (sale price if applicable) |
| Quantity | qty | QTY | Int | Ordered quantity |
| Subtotal | subtotAmt | SUBTOT_AMT | Float | unitPrc * qty |
| Registered Date | rgstDt | RGST_DT | DateTime | Created at |
| Registrant ID | rgtrId | RGTR_ID | String? | Created by |
| Modified Date | mdfcnDt | MDFCN_DT | DateTime | Updated at |
| Modifier ID | mdfrId | MDFR_ID | String? | Updated by |
| Delete Flag | delYn | DEL_YN | String | Soft delete (Y/N) |

#### TH_COMM_ORDR_STTS (Order Status History)

| Field | Prisma Name | DB Column | Type | Description |
|-------|-------------|-----------|------|-------------|
| ID | id | _id | ObjectId | Primary key |
| Order ID | orderId | ORDR_ID | ObjectId (FK → TB_COMM_ORDR) | Order reference |
| Previous Status | prevSttsCd | PREV_STTS_CD | String? | Status before change (null for initial) |
| New Status | newSttsCd | NEW_STTS_CD | String | Status after change |
| Changed By | chgById | CHG_BY_ID | ObjectId (FK → TB_COMM_USER) | User who triggered the change |
| Change Reason | chgRsn | CHG_RSN | String? | Optional reason/note |
| Registered Date | rgstDt | RGST_DT | DateTime | Change timestamp |
| Registrant ID | rgtrId | RGTR_ID | String? | Created by |

> No DEL_YN — history records are immutable audit trail.

### 3.2 Code Group Seed

| Code Group | CD_GRP_ID | CD_VAL | CD_NM | SORT_NO |
|-----------|-----------|--------|-------|---------|
| Order Status | ORDR_STTS | PENDING | Pending | 1 |
| Order Status | ORDR_STTS | PAID | Paid | 2 |
| Order Status | ORDR_STTS | SHIPPED | Shipped | 3 |
| Order Status | ORDR_STTS | DELIVERED | Delivered | 4 |
| Order Status | ORDR_STTS | CANCELLED | Cancelled | 5 |
| Order Status | ORDR_STTS | REFUNDED | Refunded | 6 |

### 3.3 Prisma Schema Addition

```prisma
// ============================================================
// Order Module
// ============================================================

model Order {
  id           String    @id @default(auto()) @map("_id") @db.ObjectId
  ordrNo       String    @unique @map("ORDR_NO")
  buyerId      String    @map("BUYR_ID") @db.ObjectId
  ordrSttsCd   String    @default("PENDING") @map("ORDR_STTS_CD")
  totAmt       Float     @map("TOT_AMT")
  itemCnt      Int       @map("ITEM_CNT")
  shpngAddr    String    @map("SHPNG_ADDR")
  shpngZpcd    String?   @map("SHPNG_ZPCD")
  rcpntNm      String    @map("RCPNT_NM")
  rcpntTelno   String    @map("RCPNT_TELNO")
  ordrNote     String?   @map("ORDR_NOTE")
  rgstDt       DateTime  @default(now()) @map("RGST_DT")
  rgtrId       String?   @map("RGTR_ID")
  mdfcnDt      DateTime  @default(now()) @updatedAt @map("MDFCN_DT")
  mdfrId       String?   @map("MDFR_ID")
  delYn        String    @default("N") @map("DEL_YN")

  buyer         User               @relation("BuyerOrders", fields: [buyerId], references: [id])
  items         OrderItem[]
  statusHistory OrderStatusHistory[]

  @@map("TB_COMM_ORDR")
}

model OrderItem {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  orderId    String   @map("ORDR_ID") @db.ObjectId
  productId  String   @map("PRD_ID") @db.ObjectId
  sellerId   String   @map("SLLR_ID") @db.ObjectId
  prdNm      String   @map("PRD_NM")
  prdImgUrl  String   @map("PRD_IMG_URL")
  unitPrc    Float    @map("UNIT_PRC")
  qty        Int      @map("QTY")
  subtotAmt  Float    @map("SUBTOT_AMT")
  rgstDt     DateTime @default(now()) @map("RGST_DT")
  rgtrId     String?  @map("RGTR_ID")
  mdfcnDt    DateTime @default(now()) @updatedAt @map("MDFCN_DT")
  mdfrId     String?  @map("MDFR_ID")
  delYn      String   @default("N") @map("DEL_YN")

  order   Order   @relation(fields: [orderId], references: [id])
  product Product @relation(fields: [productId], references: [id])
  seller  User    @relation("SellerOrderItems", fields: [sellerId], references: [id])

  @@map("TB_COMM_ORDR_ITEM")
}

model OrderStatusHistory {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  orderId    String   @map("ORDR_ID") @db.ObjectId
  prevSttsCd String?  @map("PREV_STTS_CD")
  newSttsCd  String   @map("NEW_STTS_CD")
  chgById    String   @map("CHG_BY_ID") @db.ObjectId
  chgRsn     String?  @map("CHG_RSN")
  rgstDt     DateTime @default(now()) @map("RGST_DT")
  rgtrId     String?  @map("RGTR_ID")

  order     Order @relation(fields: [orderId], references: [id])
  changedBy User  @relation("StatusChangedBy", fields: [chgById], references: [id])

  // No DEL_YN — immutable audit trail
  @@map("TH_COMM_ORDR_STTS")
}
```

> **Note**: The User model needs additional relations: `buyerOrders Order[] @relation("BuyerOrders")`, `sellerOrderItems OrderItem[] @relation("SellerOrderItems")`, `statusChanges OrderStatusHistory[] @relation("StatusChangedBy")`. The Product model needs: `orderItems OrderItem[]`.

---

## 4. API Endpoints

### 4.1 Buyer Endpoints — `OrdersController` (`api/orders`)

#### POST /api/orders — Create Order from Cart

```
Auth: Required (BUYER role)
```

**Request Body:**
```json
{
  "items": [
    { "productId": "abc123", "quantity": 2 },
    { "productId": "def456", "quantity": 1 }
  ],
  "shippingAddress": "123 Main St, Seoul, South Korea",
  "zipCode": "06234",
  "recipientName": "John Doe",
  "recipientPhone": "01012345678",
  "note": "Please leave at door"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "order-object-id",
    "orderNumber": "VB-2026-0317-001",
    "status": "PENDING",
    "totalAmount": 223,
    "itemCount": 3,
    "items": [...],
    "createdAt": "2026-03-17T10:30:00Z"
  }
}
```

**Business Rules:**
1. Validate all products exist and are active (prdSttsCd = "ACTV", delYn = "N")
2. Validate stock availability (stckQty >= requested quantity) for each item
3. Calculate unit price using sale price if available, otherwise regular price
4. Calculate subtotal per item and total amount
5. Generate order number: `VB-YYYY-MMDD-NNN` (NNN = sequential within the day, zero-padded)
6. Create order + items + initial status history in a single transaction
7. Deduct stock (decrement stckQty, increment soldCnt) for each product
8. Return created order with all items

**Error Cases:**
- `PRODUCT_NOT_FOUND` (404) — product ID does not exist
- `PRODUCT_UNAVAILABLE` (400) — product is inactive or deleted
- `INSUFFICIENT_STOCK` (400) — requested quantity exceeds available stock
- `EMPTY_CART` (400) — items array is empty
- `INVALID_SHIPPING_INFO` (400) — missing required shipping fields

---

#### GET /api/orders — Buyer Order History

```
Auth: Required (BUYER role)
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page (max 50) |
| status | string? | — | Filter by ORDR_STTS_CD (e.g., "PENDING", "SHIPPED") |
| startDate | string? | — | Filter orders from date (ISO 8601) |
| endDate | string? | — | Filter orders until date (ISO 8601) |
| sort | string | "latest" | Sort: "latest" / "oldest" / "amount_high" / "amount_low" |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "order-id",
        "orderNumber": "VB-2026-0317-001",
        "status": "SHIPPED",
        "totalAmount": 223,
        "itemCount": 3,
        "items": [
          {
            "productId": "abc123",
            "productName": "Speckled Ceramic Vase",
            "productImage": "/images/vase.jpg",
            "unitPrice": 89,
            "quantity": 1,
            "subtotal": 89
          }
        ],
        "createdAt": "2026-03-17T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 42,
      "totalPages": 5
    }
  }
}
```

**Business Rules:**
- Only return orders where `buyerId = currentUser.id` and `delYn = "N"`
- Include order items (with product snapshot data)
- Apply status and date range filters
- Support pagination with total count

---

#### GET /api/orders/:id — Order Detail

```
Auth: Required (BUYER role)
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "order-id",
    "orderNumber": "VB-2026-0317-001",
    "status": "SHIPPED",
    "totalAmount": 223,
    "itemCount": 3,
    "shippingAddress": "123 Main St, Seoul, South Korea",
    "zipCode": "06234",
    "recipientName": "John Doe",
    "recipientPhone": "01012345678",
    "note": "Please leave at door",
    "items": [
      {
        "id": "item-id",
        "productId": "abc123",
        "sellerId": "seller-id",
        "productName": "Speckled Ceramic Vase",
        "productImage": "/images/vase.jpg",
        "unitPrice": 89,
        "quantity": 1,
        "subtotal": 89,
        "sellerName": "Artisan Studio"
      }
    ],
    "statusHistory": [
      {
        "status": "PENDING",
        "previousStatus": null,
        "changedAt": "2026-03-17T10:30:00Z",
        "changedBy": "John Doe",
        "reason": null
      },
      {
        "status": "PAID",
        "previousStatus": "PENDING",
        "changedAt": "2026-03-17T10:35:00Z",
        "changedBy": "System",
        "reason": "Payment confirmed"
      }
    ],
    "createdAt": "2026-03-17T10:30:00Z",
    "updatedAt": "2026-03-17T10:35:00Z"
  }
}
```

**Business Rules:**
- Buyer can only view their own orders (`buyerId = currentUser.id`)
- Include full status history (timeline) sorted chronologically
- Include seller name for each item (join via sellerId)

**Error Cases:**
- `ORDER_NOT_FOUND` (404) — order does not exist or belongs to another user

---

#### PATCH /api/orders/:id/status — Update Order Status

```
Auth: Required (BUYER or SELLER role)
```

**Request Body:**
```json
{
  "status": "CANCELLED",
  "reason": "Changed my mind"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "order-id",
    "orderNumber": "VB-2026-0317-001",
    "previousStatus": "PENDING",
    "newStatus": "CANCELLED",
    "updatedAt": "2026-03-17T11:00:00Z"
  }
}
```

**Status Transition Rules:**

| Current Status | Allowed Next Status | Allowed By |
|---------------|-------------------|------------|
| PENDING | PAID | System (future payment integration) |
| PENDING | CANCELLED | Buyer |
| PAID | SHIPPED | Seller |
| SHIPPED | DELIVERED | Seller |
| CANCELLED | — (terminal) | — |
| DELIVERED | — (terminal) | — |

**Business Rules:**
1. Validate the requested transition is allowed (see table above)
2. Buyer can only cancel their own PENDING orders
3. Seller can update status (SHIPPED, DELIVERED) only for orders containing their products
4. Record status change in TH_COMM_ORDR_STTS
5. On CANCELLED: restore stock (increment stckQty, decrement soldCnt) for all order items

**Error Cases:**
- `ORDER_NOT_FOUND` (404) — order does not exist
- `INVALID_STATUS_TRANSITION` (400) — transition not allowed from current status
- `UNAUTHORIZED_STATUS_CHANGE` (403) — user not authorized for this transition

---

### 4.2 Seller Endpoints — `OrdersSellerController` (`api/orders/sales`)

#### GET /api/orders/sales — Seller Sales History

```
Auth: Required (SELLER role)
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page (max 50) |
| status | string? | — | Filter by order status |
| startDate | string? | — | Filter from date |
| endDate | string? | — | Filter until date |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "orderId": "order-id",
        "orderNumber": "VB-2026-0317-001",
        "orderStatus": "SHIPPED",
        "buyerName": "John Doe",
        "orderDate": "2026-03-17T10:30:00Z",
        "sellerItems": [
          {
            "productName": "Speckled Ceramic Vase",
            "productImage": "/images/vase.jpg",
            "unitPrice": 89,
            "quantity": 1,
            "subtotal": 89
          }
        ],
        "sellerSubtotal": 89
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 128,
      "totalPages": 13
    }
  }
}
```

**Business Rules:**
- Query OrderItem where `sellerId = currentUser.id`, then aggregate by parent order
- Show only the seller's own items within each order (not all items)
- Calculate `sellerSubtotal` as sum of seller's items in that order
- Support pagination, status filter, and date range filter

---

#### GET /api/orders/sales/summary — Seller Revenue Summary

```
Auth: Required (SELLER role)
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| period | string | "month" | "week" / "month" / "year" |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 15420.50,
    "totalOrders": 128,
    "totalItemsSold": 256,
    "averageOrderValue": 120.47,
    "statusBreakdown": {
      "PENDING": 3,
      "PAID": 5,
      "SHIPPED": 12,
      "DELIVERED": 98,
      "CANCELLED": 10
    },
    "period": "month",
    "periodStart": "2026-03-01",
    "periodEnd": "2026-03-31"
  }
}
```

**Business Rules:**
- Aggregate only OrderItems belonging to the current seller
- Revenue calculation excludes CANCELLED orders
- Status breakdown counts orders containing seller's products

---

## 5. Data Flow

### 5.1 Create Order from Cart

```
[Frontend: Cart Page]
  → User clicks "Checkout"
  → Checkout modal opens (shipping address form)
  → User fills shipping info + confirms
  → POST /api/orders { items, shippingAddress, ... }

[Backend: OrdersService.createOrder()]
  1. Validate all product IDs exist + active
  2. Validate stock for each item (stckQty >= qty)
  3. Generate order number: VB-YYYY-MMDD-NNN
  4. Calculate totals (use salePrice if available, else regular price)
  5. Begin pseudo-transaction:
     a. Create Order record (PENDING status)
     b. Create OrderItem records (snapshot product data)
     c. Create initial OrderStatusHistory (null → PENDING)
     d. Decrement stckQty + increment soldCnt for each Product
  6. Return created order

[Frontend: Redirect]
  → Clear cart (localStorage)
  → Redirect to order detail or orders page
  → Show success toast
```

### 5.2 View Purchase History (Buyer)

```
[Frontend: Orders Page]
  → On mount: GET /api/orders?page=1&limit=10
  → Display order cards with status badges
  → User applies status filter → re-fetch with ?status=SHIPPED
  → User applies date range → re-fetch with ?startDate=...&endDate=...
  → User clicks order card → open detail modal
  → Modal: GET /api/orders/:id (full detail + status timeline)
```

### 5.3 Update Order Status

```
[Buyer Cancel]
  → Order detail modal → "Cancel Order" button (visible when PENDING)
  → PATCH /api/orders/:id/status { status: "CANCELLED", reason: "..." }
  → Backend validates: buyer owns order + status is PENDING
  → Update order status + create history record + restore stock
  → Frontend: refresh order detail, update badge

[Seller Ship/Deliver]
  → Sales page → status update dropdown
  → PATCH /api/orders/:id/status { status: "SHIPPED" }
  → Backend validates: seller has items in order + valid transition
  → Update order status + create history record
  → Frontend: refresh sales list
```

### 5.4 Seller Sales View

```
[Frontend: Sales Page]
  → On mount: GET /api/orders/sales?page=1&limit=10
  → Parallel: GET /api/orders/sales/summary?period=month
  → Display revenue summary cards at top
  → Display seller's sales list (filtered to their items)
  → Seller updates status via dropdown → PATCH /api/orders/:id/status
```

---

## 6. Component Design

### 6.1 Buyer: Order History Page (`/dashboard/orders`)

**Layout:**
```
┌──────────────────────────────────────────────────┐
│  My Orders                          (42 orders)  │
├──────────────────────────────────────────────────┤
│  [All] [Pending] [Paid] [Shipped] [Delivered]    │
│  [Cancelled]                                     │
├──────────────────────────────────────────────────┤
│  Date Range: [Start ▼] ~ [End ▼]    [Apply]     │
├──────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────┐  │
│  │ VB-2026-0317-001    2026-03-17   [Shipped] │  │
│  │ 🏺 Speckled Ceramic Vase    x1     $89     │  │
│  │ 🧵 Handwoven Linen Runner   x1     $65     │  │
│  │                        Total: $154          │  │
│  └────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────┐  │
│  │ VB-2026-0316-003    2026-03-16  [Pending]  │  │
│  │ ...                                        │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│        [< Previous]  Page 1 of 5  [Next >]       │
└──────────────────────────────────────────────────┘
```

### 6.2 Order Detail Modal

**Layout:**
```
┌──────────────────────────────────────────┐
│  Order Details                     [✕]   │
│  VB-2026-0317-001                        │
├──────────────────────────────────────────┤
│  Status: [Shipped]  Ordered: 2026-03-17  │
├──────────────────────────────────────────┤
│  Status Timeline:                        │
│  ● Pending ──── ● Paid ──── ◉ Shipped   │
│    03-17 10:30    03-17 10:35  03-17 15: │
│                                  ○ Deliv │
├──────────────────────────────────────────┤
│  Items:                                  │
│  🏺 Speckled Ceramic Vase  x1     $89   │
│     Seller: Artisan Studio               │
│  🧵 Handwoven Linen Runner x1     $65   │
│     Seller: Textile Co                   │
├──────────────────────────────────────────┤
│  Shipping:                               │
│  John Doe | 010-1234-5678                │
│  123 Main St, Seoul, South Korea 06234   │
├──────────────────────────────────────────┤
│  Total:                          $154    │
├──────────────────────────────────────────┤
│  [Cancel Order]  [Contact Seller]        │
└──────────────────────────────────────────┘
```

### 6.3 Seller: Sales History Page (`/dashboard/sales`)

**Layout:**
```
┌──────────────────────────────────────────────────┐
│  My Sales                                        │
├──────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │ Revenue  │ │  Orders  │ │  Items   │         │
│  │$15,420   │ │   128    │ │   256    │         │
│  │ This Mo. │ │ This Mo. │ │ This Mo. │         │
│  └──────────┘ └──────────┘ └──────────┘         │
├──────────────────────────────────────────────────┤
│  [All] [Paid] [Shipped] [Delivered]              │
├──────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────┐  │
│  │ VB-2026-0317-001  Buyer: John D. [Paid ▼] │  │
│  │ 🏺 Speckled Ceramic Vase    x1      $89   │  │
│  │                     Subtotal: $89          │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│        [< Previous]  Page 1 of 13  [Next >]      │
└──────────────────────────────────────────────────┘
```

### 6.4 Checkout Modal (from Cart Page)

**Layout:**
```
┌──────────────────────────────────────────┐
│  Checkout                          [✕]   │
├──────────────────────────────────────────┤
│  Order Summary:                          │
│  🏺 Speckled Ceramic Vase  x1     $89   │
│  🧵 Handwoven Linen Runner x1     $65   │
│                            Total: $154   │
├──────────────────────────────────────────┤
│  Shipping Information:                   │
│  Recipient Name: [____________]          │
│  Phone:          [____________]          │
│  Address:        [____________]          │
│  Zip Code:       [____________]          │
│  Note:           [____________]          │
├──────────────────────────────────────────┤
│           [Cancel]  [Place Order]        │
└──────────────────────────────────────────┘
```

---

## 7. UI/UX Design

### 7.1 Design Token Usage

| Element | Token | Example |
|---------|-------|---------|
| Page background | `--color-bg-primary` | Orders page bg |
| Card background | `--color-bg-secondary` | Order cards |
| Primary text | `--color-text-primary` | Order number, item names |
| Secondary text | `--color-text-secondary` | Dates, quantities |
| Status: Pending | `--color-warning` | Yellow/amber badge |
| Status: Paid | `--color-info` | Blue badge |
| Status: Shipped | `--color-primary` | Brand color badge |
| Status: Delivered | `--color-success` | Green badge |
| Status: Cancelled | `--color-error` | Red badge |
| Card border radius | `--radius-lg` | 12px rounded cards |
| Spacing | `--spacing-*` | 8px grid system |
| Font sizes | `--font-size-sm/md/lg` | Hierarchy |
| Card shadow | `--shadow-sm` | Subtle elevation |
| Modal overlay | `rgba(0, 0, 0, 0.5)` | Backdrop |

### 7.2 Responsive Breakpoints

| Breakpoint | Layout |
|-----------|--------|
| Mobile (~767px) | Single column, stacked cards, full-width modal |
| Tablet (768~1023px) | Single column with wider cards, centered modal (600px) |
| Desktop (1024px~) | Single column with max-width container, centered modal (640px) |

### 7.3 Animations

- Order cards: `animate-fade-up` with staggered delays (existing pattern)
- Modal: Fade-in overlay + slide-up content
- Status badge: Subtle pulse on status change
- Status timeline: Progressive reveal on modal open

---

## 8. Security

### 8.1 Access Control Matrix

| Endpoint | BUYER | SELLER | ADMIN |
|---------|-------|--------|-------|
| POST /api/orders | Own orders only | No | No |
| GET /api/orders | Own orders only | No | All orders |
| GET /api/orders/:id | Own orders only | Orders with their products | All orders |
| PATCH /api/orders/:id/status | Cancel own PENDING | Ship/Deliver orders with their products | All transitions |
| GET /api/orders/sales | No | Own sales only | All sales |
| GET /api/orders/sales/summary | No | Own summary only | Global summary |

### 8.2 Security Rules

1. **Ownership verification**: Every query filters by `buyerId` or `sellerId` to prevent horizontal privilege escalation
2. **Status transition validation**: Server-side state machine — reject invalid transitions regardless of client request
3. **Input validation**: class-validator on all DTOs, sanitize strings
4. **Price integrity**: Server recalculates all prices from Product records at order time — never trust client-submitted prices
5. **Stock race condition**: Use Prisma `$transaction` with optimistic update (check stckQty >= qty in the update where clause) to prevent overselling
6. **Snapshot immutability**: Product name, price, and image are snapshotted in OrderItem — not affected by future product edits
7. **Rate limiting**: Apply rate limit on POST /api/orders to prevent order spam (e.g., max 5 orders per minute per user)

---

## 9. Error Handling

### 9.1 Business Exceptions

| Error Code | HTTP Status | Message | Trigger |
|-----------|-------------|---------|---------|
| PRODUCT_NOT_FOUND | 404 | Product not found | Product ID does not exist |
| PRODUCT_UNAVAILABLE | 400 | Product is no longer available | Product inactive or deleted |
| INSUFFICIENT_STOCK | 400 | Insufficient stock for {productName}. Available: {qty} | Stock < requested qty |
| EMPTY_CART | 400 | Cannot create order with no items | Empty items array |
| INVALID_SHIPPING_INFO | 400 | Missing required shipping information | Required fields empty |
| ORDER_NOT_FOUND | 404 | Order not found | Order ID not found or unauthorized |
| INVALID_STATUS_TRANSITION | 400 | Cannot change status from {current} to {new} | Invalid state machine transition |
| UNAUTHORIZED_STATUS_CHANGE | 403 | You are not authorized to change this order's status | User lacks permission |
| ORDER_ALREADY_CANCELLED | 400 | Order is already cancelled | Attempting action on cancelled order |
| STOCK_CHANGED | 409 | Stock has changed. Please review your cart | Race condition on stock |

### 9.2 System Error Handling

- All service methods wrapped with try-catch, logging via NestJS Logger
- Database errors caught and translated to generic 500 response
- Transaction rollback on any failure during order creation
- Frontend displays user-friendly error messages with retry option

---

## 10. TypeScript Types

### 10.1 Shared Types (`src/lib/order-types.ts`)

```typescript
export type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';

export interface OrderItem {
  id: string;
  productId: string;
  sellerId: string;
  productName: string;
  productImage: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  sellerName?: string;
}

export interface OrderStatusHistoryEntry {
  status: OrderStatus;
  previousStatus: OrderStatus | null;
  changedAt: string;
  changedBy: string;
  reason: string | null;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  itemCount: number;
  items: OrderItem[];
  createdAt: string;
}

export interface OrderDetail extends OrderSummary {
  shippingAddress: string;
  zipCode: string | null;
  recipientName: string;
  recipientPhone: string;
  note: string | null;
  statusHistory: OrderStatusHistoryEntry[];
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface SellerSaleItem {
  orderId: string;
  orderNumber: string;
  orderStatus: OrderStatus;
  buyerName: string;
  orderDate: string;
  sellerItems: Omit<OrderItem, 'sellerId' | 'sellerName'>[];
  sellerSubtotal: number;
}

export interface SellerSalesSummary {
  totalRevenue: number;
  totalOrders: number;
  totalItemsSold: number;
  averageOrderValue: number;
  statusBreakdown: Record<OrderStatus, number>;
  period: 'week' | 'month' | 'year';
  periodStart: string;
  periodEnd: string;
}

export interface CreateOrderPayload {
  items: { productId: string; quantity: number }[];
  shippingAddress: string;
  zipCode?: string;
  recipientName: string;
  recipientPhone: string;
  note?: string;
}

export interface UpdateStatusPayload {
  status: OrderStatus;
  reason?: string;
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  PAID: 'Paid',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

export const STATUS_TRANSITIONS: Record<OrderStatus, { next: OrderStatus; by: string }[]> = {
  PENDING: [
    { next: 'PAID', by: 'SYSTEM' },
    { next: 'CANCELLED', by: 'BUYER' },
  ],
  PAID: [
    { next: 'SHIPPED', by: 'SELLER' },
  ],
  SHIPPED: [
    { next: 'DELIVERED', by: 'SELLER' },
  ],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
};
```

### 10.2 Backend DTOs

```typescript
// create-order.dto.ts
export class CreateOrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  shippingAddress: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  zipCode?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  recipientName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  recipientPhone: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

// update-status.dto.ts
export class UpdateStatusDto {
  @IsEnum(['PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
  status: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

// order-query.dto.ts
export class OrderQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
  status?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(['latest', 'oldest', 'amount_high', 'amount_low'])
  sort?: string = 'latest';
}
```

---

## 11. File Structure (Complete)

```
server/src/orders/
├── orders.module.ts
├── orders.controller.ts
├── orders-seller.controller.ts
├── orders.service.ts
├── orders-seller.service.ts
├── dto/
│   ├── create-order.dto.ts
│   ├── order-query.dto.ts
│   ├── seller-query.dto.ts
│   ├── update-status.dto.ts
│   └── order-response.dto.ts
├── interfaces/
│   ├── order.interface.ts
│   └── order-status.enum.ts
└── helpers/
    └── order-number.helper.ts

src/app/dashboard/orders/
├── page.tsx                          # Refactored: real API, remove mock data
├── orders.module.css                 # Extended with new styles
└── [id]/
    └── page.tsx                      # Deep link to order detail (optional)

src/app/dashboard/sales/
├── page.tsx                          # Seller sales page
└── sales.module.css                  # Sales page styles

src/components/orders/
├── order-card.tsx
├── order-detail-modal.tsx
├── order-status-badge.tsx
├── order-status-timeline.tsx
├── order-filters.tsx
└── checkout-modal.tsx

src/components/sales/
├── sales-summary-card.tsx
├── sales-order-card.tsx
└── status-update-dropdown.tsx

src/hooks/
└── use-orders.ts

src/lib/
└── order-types.ts

prisma/
└── schema.prisma                     # Add Order, OrderItem, OrderStatusHistory models
```

---

## 12. Implementation Sequence

### Phase 1: Database & Backend Core

| Step | Task | Files |
|------|------|-------|
| 1.1 | Add Order models to Prisma schema | `prisma/schema.prisma` |
| 1.2 | Add User/Product relation updates | `prisma/schema.prisma` |
| 1.3 | Run `prisma generate` | — |
| 1.4 | Seed ORDR_STTS code group | `prisma/seed.ts` |
| 1.5 | Create order number helper | `server/src/orders/helpers/order-number.helper.ts` |
| 1.6 | Create DTOs with validation | `server/src/orders/dto/*.ts` |
| 1.7 | Create interfaces and status enum | `server/src/orders/interfaces/*.ts` |

### Phase 2: Backend Services

| Step | Task | Files |
|------|------|-------|
| 2.1 | Implement OrdersService (create, findAll, findOne, updateStatus) | `server/src/orders/orders.service.ts` |
| 2.2 | Implement order creation with stock management | `server/src/orders/orders.service.ts` |
| 2.3 | Implement OrdersSellerService (sales, summary) | `server/src/orders/orders-seller.service.ts` |
| 2.4 | Create OrdersController (buyer endpoints) | `server/src/orders/orders.controller.ts` |
| 2.5 | Create OrdersSellerController (seller endpoints) | `server/src/orders/orders-seller.controller.ts` |
| 2.6 | Create OrdersModule and register in AppModule | `server/src/orders/orders.module.ts`, `server/src/app.module.ts` |

### Phase 3: Frontend Types & Hooks

| Step | Task | Files |
|------|------|-------|
| 3.1 | Create shared order types | `src/lib/order-types.ts` |
| 3.2 | Create useOrders hook (API calls) | `src/hooks/use-orders.ts` |

### Phase 4: Frontend Components

| Step | Task | Files |
|------|------|-------|
| 4.1 | Build order-status-badge component | `src/components/orders/order-status-badge.tsx` |
| 4.2 | Build order-status-timeline component | `src/components/orders/order-status-timeline.tsx` |
| 4.3 | Build order-card component | `src/components/orders/order-card.tsx` |
| 4.4 | Build order-filters component (status tabs + date range) | `src/components/orders/order-filters.tsx` |
| 4.5 | Build order-detail-modal component | `src/components/orders/order-detail-modal.tsx` |
| 4.6 | Build checkout-modal component | `src/components/orders/checkout-modal.tsx` |

### Phase 5: Frontend Pages

| Step | Task | Files |
|------|------|-------|
| 5.1 | Refactor orders page (remove mock data, use real API) | `src/app/dashboard/orders/page.tsx` |
| 5.2 | Extend orders.module.css with new styles | `src/app/dashboard/orders/orders.module.css` |
| 5.3 | Build seller sales page | `src/app/dashboard/sales/page.tsx` |
| 5.4 | Build sales summary and order management components | `src/components/sales/*.tsx` |
| 5.5 | Integrate checkout modal into cart page | `src/app/dashboard/cart/page.tsx` (or equivalent) |

### Phase 6: Integration & Polish

| Step | Task | Files |
|------|------|-------|
| 6.1 | Add sidebar navigation link for Sales (SELLER role) | Dashboard layout |
| 6.2 | Wire checkout flow: cart → checkout modal → order created → clear cart → redirect | Cart + Orders pages |
| 6.3 | Add loading states, error boundaries, empty states | All components |
| 6.4 | Add pagination component integration | Orders + Sales pages |
| 6.5 | Test end-to-end flows (buyer order, seller management) | Manual + test scenarios |
