# Tài liệu Thiết kế API

> **Dự án:** Nền tảng Thương mại điện tử Vibe
> **Cập nhật lần cuối:** 2026-03-20
> **URL gốc:** `http://localhost:4000/api`
> **Giao diện Swagger:** `http://localhost:4000/api/docs`
> **Định dạng phản hồi:** `{ success: boolean, data: T, error?: string, message?: string }`

---

## 1. Xác thực (Authentication)

Tất cả các endpoint được bảo vệ đều yêu cầu JWT Bearer token trong header `Authorization`:
```
Authorization: Bearer <access_token>
```

- **Access Token:** Thời gian sống 15 phút
- **Refresh Token:** Thời gian sống 7 ngày, lưu trong DB với cơ chế xoay vòng (rotation)
- **Phân quyền theo vai trò:** `BUYER`, `SELLER`, `SUPER_ADMIN`

---

## 2. Các Endpoint

### 2.1 Xác thực (`/api/auth`)

| Phương thức | Đường dẫn | Xác thực | Mô tả |
|-------------|-----------|----------|-------|
| `POST` | `/auth/signup` | Công khai | Đăng ký tài khoản mới |
| `POST` | `/auth/login` | Công khai | Đăng nhập bằng email/mật khẩu |
| `POST` | `/auth/logout` | Bắt buộc | Vô hiệu hóa refresh token |
| `POST` | `/auth/refresh` | Công khai | Làm mới access token |
| `POST` | `/auth/verify-email` | Công khai | Xác minh email bằng token |
| `POST` | `/auth/forgot-password` | Công khai | Yêu cầu đặt lại mật khẩu |
| `POST` | `/auth/reset-password` | Công khai | Đặt lại mật khẩu bằng token |
| `PATCH` | `/auth/profile` | Bắt buộc | Cập nhật hồ sơ cá nhân |
| `PATCH` | `/auth/password` | Bắt buộc | Thay đổi mật khẩu |
| `DELETE` | `/auth/account` | Bắt buộc | Xóa tài khoản |

#### POST /auth/signup
```json
// Yêu cầu
{
  "email": "user@example.com",
  "password": "MyPass123!",
  "name": "John Doe",
  "nickname": "johndoe"      // tùy chọn, 2-30 ký tự
}
// Phản hồi 201
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
// Yêu cầu
{ "email": "user@example.com", "password": "MyPass123!" }
// Phản hồi 200 — cùng định dạng với signup
```

#### POST /auth/refresh
```json
// Yêu cầu
{ "refreshToken": "eyJ..." }
// Phản hồi 200
{ "success": true, "data": { "accessToken": "eyJ...", "refreshToken": "eyJ...", "expiresIn": 900 } }
```

### 2.2 Xác thực mạng xã hội (`/api/auth/social`)

| Phương thức | Đường dẫn | Xác thực | Mô tả |
|-------------|-----------|----------|-------|
| `GET` | `/social/:provider` | Công khai | Chuyển hướng đến OAuth (google/kakao/naver) |
| `GET` | `/social/:provider/callback` | Công khai | Xử lý callback OAuth |

### 2.3 Sản phẩm (`/api/products`)

| Phương thức | Đường dẫn | Xác thực | Mô tả |
|-------------|-----------|----------|-------|
| `POST` | `/products` | SELLER/ADMIN | Tạo sản phẩm |
| `GET` | `/products` | Công khai | Danh sách sản phẩm |
| `GET` | `/products/my` | SELLER/ADMIN | Danh sách sản phẩm của người bán |
| `GET` | `/products/:id` | Công khai | Chi tiết sản phẩm |
| `PATCH` | `/products/:id` | SELLER/ADMIN | Cập nhật sản phẩm |
| `PATCH` | `/products/:id/status` | SELLER/ADMIN | Thay đổi trạng thái sản phẩm |
| `DELETE` | `/products/:id` | SELLER/ADMIN | Xóa sản phẩm |

#### GET /products (Tham số truy vấn)
| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `page` | number | Số trang (mặc định: 1) |
| `limit` | number | Số mục mỗi trang (mặc định: 20) |
| `category` | string | Lọc: CERAMICS/TEXTILES/ART/JEWELRY/HOME/FOOD |
| `status` | string | Lọc: DRAFT/ACTV/SOLD_OUT/HIDDEN |
| `search` | string | Tìm kiếm toàn văn |
| `sort` | string | Sắp xếp: newest/price-low/price-high/popular/rating |
| `seller` | string | Lọc theo ID người bán |

#### POST /products
```json
// Yêu cầu
{
  "prdNm": "Handcrafted Vase",
  "prdDc": "Beautiful ceramic vase...",
  "prdPrc": 150,
  "prdSalePrc": 120,                // tùy chọn
  "prdCtgrCd": "CERAMICS",
  "prdImgUrl": "https://...",
  "prdImgUrls": ["https://..."],    // tùy chọn, tối đa 5
  "stckQty": 50,
  "srchTags": ["ceramic", "vase"]   // tùy chọn
}
```

### 2.4 Đơn hàng (`/api/orders`)

| Phương thức | Đường dẫn | Xác thực | Mô tả |
|-------------|-----------|----------|-------|
| `POST` | `/orders` | Bắt buộc | Tạo đơn hàng (đã xác thực) |
| `POST` | `/orders/checkout` | Công khai | Thanh toán không cần đăng nhập |
| `PATCH` | `/orders/:id/pay` | Bắt buộc | Thanh toán đơn hàng |
| `GET` | `/orders` | Bắt buộc | Danh sách đơn hàng của người mua |
| `GET` | `/orders/:id` | Bắt buộc | Chi tiết đơn hàng |
| `PATCH` | `/orders/:id/status` | Bắt buộc | Cập nhật trạng thái đơn hàng |

**Endpoint dành cho Người bán:**

| Phương thức | Đường dẫn | Xác thực | Mô tả |
|-------------|-----------|----------|-------|
| `GET` | `/orders/sales` | SELLER/ADMIN | Danh sách đơn bán hàng |
| `GET` | `/orders/sales/summary` | SELLER/ADMIN | Tổng hợp doanh số |
| `GET` | `/orders/sales/:id` | SELLER/ADMIN | Chi tiết đơn bán hàng |
| `PATCH` | `/orders/sales/:orderId/items/:itemId/payment` | SELLER/ADMIN | Xác nhận thanh toán mục hàng |
| `PATCH` | `/orders/sales/:orderId/items/:itemId/status` | SELLER/ADMIN | Cập nhật trạng thái mục hàng |
| `POST` | `/orders/sales/bulk-status` | SELLER/ADMIN | Cập nhật hàng loạt trạng thái mục hàng |

#### POST /orders/checkout (Khách vãng lai)
```json
// Yêu cầu
{
  "items": [
    { "productId": "abc123", "quantity": 2 }
  ],
  "paymentMethod": "BANK_TRANSFER",
  "shipAddr": "123 Main St, Seoul",
  "shipRcvrNm": "Guest Buyer",
  "shipTelno": "010-1234-5678",
  "shipMemo": "Leave at door"     // tùy chọn
}
// Phản hồi 201
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

#### GET /orders (Tham số truy vấn)
| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `page` | number | Số trang |
| `limit` | number | Số mục mỗi trang |
| `status` | string | Lọc theo trạng thái đơn hàng |
| `itemStatus` | string | Lọc: PENDING/CONFIRMED/SHIPPED/DELIVERED |
| `paymentStatus` | string | Lọc: UNPAID/PAID |

### 2.5 Bảng tin (`/api/posts`)

| Phương thức | Đường dẫn | Xác thực | Mô tả |
|-------------|-----------|----------|-------|
| `GET` | `/posts/banner` | Công khai | Lấy cấu hình banner |
| `PUT` | `/posts/banner` | ADMIN | Cập nhật banner |
| `POST` | `/posts` | Bắt buộc | Tạo bài viết |
| `GET` | `/posts` | Công khai | Danh sách bài viết |
| `GET` | `/posts/:id` | Công khai | Chi tiết bài viết |
| `PATCH` | `/posts/:id` | Chủ sở hữu/Admin | Cập nhật bài viết |
| `DELETE` | `/posts/:id` | Chủ sở hữu/Admin | Xóa bài viết |
| `GET` | `/posts/:id/comments` | Công khai | Danh sách bình luận |
| `POST` | `/posts/:id/comments` | Bắt buộc | Tạo bình luận |
| `PATCH` | `/posts/:postId/comments/:commentId` | Chủ sở hữu/Admin | Cập nhật bình luận |
| `DELETE` | `/posts/:postId/comments/:commentId` | Chủ sở hữu/Admin | Xóa bình luận |

#### GET /posts (Tham số truy vấn)
| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `page` | number | Số trang |
| `limit` | number | Số mục mỗi trang |
| `category` | string | Lọc: NOTICE/FREE/QNA/REVIEW |
| `search` | string | Tìm kiếm trong tiêu đề/nội dung |
| `sort` | string | Sắp xếp: newest/views/comments |

### 2.6 Tìm kiếm (`/api/search`)

| Phương thức | Đường dẫn | Xác thực | Mô tả |
|-------------|-----------|----------|-------|
| `GET` | `/search?q=keyword` | Công khai | Tìm kiếm toàn cục (sản phẩm + bài viết) |
| `GET` | `/search/suggest?q=keyword` | Công khai | Gợi ý tìm kiếm |

#### GET /search
```json
// Phản hồi
{
  "success": true,
  "data": {
    "products": { "items": [...], "total": 15 },
    "posts": { "items": [...], "total": 3 }
  }
}
```

### 2.7 Quản trị (`/api/admin`)

Tất cả các endpoint quản trị đều yêu cầu vai trò `SUPER_ADMIN`.

| Phương thức | Đường dẫn | Mô tả |
|-------------|-----------|-------|
| `GET` | `/admin/dashboard` | Thống kê bảng điều khiển (người dùng, vai trò, hoạt động) |
| `POST` | `/admin/users` | Tạo người dùng |
| `GET` | `/admin/users` | Danh sách người dùng (có bộ lọc) |
| `GET` | `/admin/users/export` | Xuất danh sách người dùng CSV |
| `POST` | `/admin/users/bulk/status` | Thay đổi trạng thái hàng loạt |
| `GET` | `/admin/users/:id` | Chi tiết người dùng |
| `GET` | `/admin/users/:id/activity` | Nhật ký hoạt động người dùng |
| `GET` | `/admin/users/:id/summary` | Tóm tắt người dùng |
| `PATCH` | `/admin/users/:id` | Cập nhật người dùng |
| `PATCH` | `/admin/users/:id/role` | Thay đổi vai trò |
| `PATCH` | `/admin/users/:id/status` | Thay đổi trạng thái |
| `PATCH` | `/admin/users/:id/password` | Đặt lại mật khẩu |

### 2.8 Kiểm tra sức khỏe hệ thống (`/api/health`)

| Phương thức | Đường dẫn | Xác thực | Mô tả |
|-------------|-----------|----------|-------|
| `GET` | `/health` | Công khai | Trạng thái máy chủ |
| `GET` | `/health/db` | Công khai | Kết nối cơ sở dữ liệu |

---

## 3. Định dạng phản hồi lỗi

```json
{
  "success": false,
  "data": null,
  "error": "ERROR_CODE",
  "message": "Human-readable message"
}
```

### Các mã lỗi phổ biến
| Mã lỗi | HTTP | Mô tả |
|---------|------|-------|
| `UNAUTHORIZED` | 401 | Token không hợp lệ hoặc thiếu |
| `FORBIDDEN` | 403 | Không đủ quyền |
| `NOT_FOUND` | 404 | Không tìm thấy tài nguyên |
| `VALIDATION_ERROR` | 400 | Dữ liệu đầu vào không hợp lệ |
| `EMAIL_ALREADY_EXISTS` | 409 | Email đã tồn tại |
| `INVALID_CREDENTIALS` | 401 | Sai email/mật khẩu |
| `ORDER_ACCESS_DENIED` | 403 | Không phải chủ đơn hàng |

---

## 4. Định dạng phản hồi phân trang

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

Giao diện Swagger UI có sẵn tại **`http://localhost:4000/api/docs`** khi máy chủ đang chạy.

Đặc tả OpenAPI được tự động tạo từ các controller và DTO của NestJS sử dụng `@nestjs/swagger`.
