# API Design Document

> **Project:** Vibe E-Commerce Platform
> **Last Updated:** 2026-03-20
> **Base URL:** `http://localhost:4000/api`
> **Swagger UI:** `http://localhost:4000/api/docs`
> **Response Format:** `{ success: boolean, data: T, error?: string, message?: string }`

---

## 1. Authentication

All protected endpoints require a JWT Bearer token in the `Authorization` header:
```
Authorization: Bearer <access_token>
```

- **Access Token:** 15 minutes TTL
- **Refresh Token:** 7 days TTL, stored in DB with rotation
- **Role-based access:** `BUYER`, `SELLER`, `SUPER_ADMIN`

---

## 2. Endpoints

### 2.1 Auth (`/api/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/signup` | Public | Register new account |
| `POST` | `/auth/login` | Public | Login with email/password |
| `POST` | `/auth/logout` | Required | Invalidate refresh token |
| `POST` | `/auth/refresh` | Public | Refresh access token |
| `POST` | `/auth/verify-email` | Public | Verify email with token |
| `POST` | `/auth/forgot-password` | Public | Request password reset |
| `POST` | `/auth/reset-password` | Public | Reset password with token |
| `PATCH` | `/auth/profile` | Required | Update profile |
| `PATCH` | `/auth/password` | Required | Change password |
| `DELETE` | `/auth/account` | Required | Delete account |

#### POST /auth/signup
```json
// Request
{
  "email": "user@example.com",
  "password": "MyPass123!",
  "name": "John Doe",
  "nickname": "johndoe"      // optional, 2-30 chars
}
// Response 201
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "name": "...", "role": "BUYER" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 900
  }
}
```

#### POST /auth/login
```json
// Request
{ "email": "user@example.com", "password": "MyPass123!" }
// Response 200 — same shape as signup
```

#### POST /auth/refresh
```json
// Request
{ "refreshToken": "eyJ..." }
// Response 200
{ "success": true, "data": { "accessToken": "eyJ...", "refreshToken": "eyJ...", "expiresIn": 900 } }
```

### 2.2 Social Auth (`/api/auth/social`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/social/:provider` | Public | Redirect to OAuth (google/kakao/naver) |
| `GET` | `/social/:provider/callback` | Public | OAuth callback handler |

### 2.3 Products (`/api/products`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/products` | SELLER/ADMIN | Create product |
| `GET` | `/products` | Public | List products |
| `GET` | `/products/my` | SELLER/ADMIN | List seller's own products |
| `GET` | `/products/:id` | Public | Get product detail |
| `PATCH` | `/products/:id` | SELLER/ADMIN | Update product |
| `PATCH` | `/products/:id/status` | SELLER/ADMIN | Change product status |
| `DELETE` | `/products/:id` | SELLER/ADMIN | Delete product |

#### GET /products (Query Parameters)
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |
| `category` | string | Filter: CERAMICS/TEXTILES/ART/JEWELRY/HOME/FOOD |
| `status` | string | Filter: DRAFT/ACTV/SOLD_OUT/HIDDEN |
| `search` | string | Full-text search |
| `sort` | string | Sort: newest/price-low/price-high/popular/rating |
| `seller` | string | Filter by seller ID |

#### POST /products
```json
// Request
{
  "prdNm": "Handcrafted Vase",
  "prdDc": "Beautiful ceramic vase...",
  "prdPrc": 150,
  "prdSalePrc": 120,                // optional
  "prdCtgrCd": "CERAMICS",
  "prdImgUrl": "https://...",
  "prdImgUrls": ["https://..."],    // optional, max 5
  "stckQty": 50,
  "srchTags": ["ceramic", "vase"]   // optional
}
```

### 2.4 Orders (`/api/orders`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/orders` | Required | Create order (authenticated) |
| `POST` | `/orders/checkout` | Public | Guest checkout |
| `PATCH` | `/orders/:id/pay` | Required | Pay order |
| `GET` | `/orders` | Required | List buyer's orders |
| `GET` | `/orders/:id` | Required | Get order detail |
| `PATCH` | `/orders/:id/status` | Required | Update order status |

**Seller Endpoints:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/orders/sales` | SELLER/ADMIN | List seller sales |
| `GET` | `/orders/sales/summary` | SELLER/ADMIN | Sales summary |
| `GET` | `/orders/sales/:id` | SELLER/ADMIN | Sale detail |
| `PATCH` | `/orders/sales/:orderId/items/:itemId/payment` | SELLER/ADMIN | Confirm item payment |
| `PATCH` | `/orders/sales/:orderId/items/:itemId/status` | SELLER/ADMIN | Update item status |
| `POST` | `/orders/sales/bulk-status` | SELLER/ADMIN | Bulk update items |

#### POST /orders/checkout (Guest)
```json
// Request
{
  "items": [
    { "productId": "abc123", "quantity": 2 }
  ],
  "paymentMethod": "BANK_TRANSFER",
  "shipAddr": "123 Main St, Seoul",
  "shipRcvrNm": "Guest Buyer",
  "shipTelno": "010-1234-5678",
  "shipMemo": "Leave at door"     // optional
}
// Response 201
{
  "success": true,
  "data": {
    "id": "...",
    "orderNo": "VB-2026-0320-001",
    "totalAmount": 300,
    "status": "PENDING",
    "items": [
      { "productName": "...", "quantity": 2, "paymentStatus": "UNPAID", "itemStatus": "PENDING" }
    ]
  }
}
```

#### GET /orders (Query Parameters)
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `status` | string | Filter by order status |
| `itemStatus` | string | Filter: PENDING/CONFIRMED/SHIPPED/DELIVERED |
| `paymentStatus` | string | Filter: UNPAID/PAID |

### 2.5 Board (`/api/posts`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/posts/banner` | Public | Get banner config |
| `PUT` | `/posts/banner` | ADMIN | Update banner |
| `POST` | `/posts` | Required | Create post |
| `GET` | `/posts` | Public | List posts |
| `GET` | `/posts/:id` | Public | Get post detail |
| `PATCH` | `/posts/:id` | Owner/Admin | Update post |
| `DELETE` | `/posts/:id` | Owner/Admin | Delete post |
| `GET` | `/posts/:id/comments` | Public | List comments |
| `POST` | `/posts/:id/comments` | Required | Create comment |
| `PATCH` | `/posts/:postId/comments/:commentId` | Owner/Admin | Update comment |
| `DELETE` | `/posts/:postId/comments/:commentId` | Owner/Admin | Delete comment |

#### GET /posts (Query Parameters)
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `category` | string | Filter: NOTICE/FREE/QNA/REVIEW |
| `search` | string | Search in title/content |
| `sort` | string | Sort: newest/views/comments |

### 2.6 Search (`/api/search`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/search?q=keyword` | Public | Global search (products + posts) |
| `GET` | `/search/suggest?q=keyword` | Public | Search suggestions |

#### GET /search
```json
// Response
{
  "success": true,
  "data": {
    "products": { "items": [...], "total": 15 },
    "posts": { "items": [...], "total": 3 }
  }
}
```

### 2.7 Admin (`/api/admin`)

All admin endpoints require `SUPER_ADMIN` role.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/dashboard` | Dashboard stats (users, roles, activity) |
| `POST` | `/admin/users` | Create user |
| `GET` | `/admin/users` | List users (with filters) |
| `GET` | `/admin/users/export` | Export users CSV |
| `POST` | `/admin/users/bulk/status` | Bulk status change |
| `GET` | `/admin/users/:id` | Get user detail |
| `GET` | `/admin/users/:id/activity` | User activity log |
| `GET` | `/admin/users/:id/summary` | User summary |
| `PATCH` | `/admin/users/:id` | Update user |
| `PATCH` | `/admin/users/:id/role` | Change role |
| `PATCH` | `/admin/users/:id/status` | Change status |
| `PATCH` | `/admin/users/:id/password` | Reset password |

### 2.8 Health (`/api/health`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | Public | Server status |
| `GET` | `/health/db` | Public | Database connection |

---

## 3. Error Response Format

```json
{
  "success": false,
  "data": null,
  "error": "ERROR_CODE",
  "message": "Human-readable message"
}
```

### Common Error Codes
| Code | HTTP | Description |
|------|------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing token |
| `FORBIDDEN` | 403 | Insufficient role |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input |
| `EMAIL_ALREADY_EXISTS` | 409 | Duplicate email |
| `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `ORDER_ACCESS_DENIED` | 403 | Not the order owner |

---

## 4. Pagination Response Format

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 201,
      "totalPages": 11
    }
  }
}
```

---

## 5. Swagger

Swagger UI is available at **`http://localhost:4000/api/docs`** when the server is running.

The OpenAPI spec is auto-generated from NestJS controllers and DTOs using `@nestjs/swagger`.
