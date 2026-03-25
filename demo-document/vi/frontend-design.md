# Tài liệu thiết kế Frontend

> **Dự án:** Vibe E-Commerce Platform
> **Cập nhật lần cuối:** 2026-03-20
> **Framework:** Next.js 15 (App Router, React 19)
> **Port:** localhost:3000

---

## 1. Tổng quan kiến trúc

```
┌──────────────────────────────────────────────────────────────┐
│                       Next.js 15                              │
│                    App Router (RSC)                           │
├──────────────────────────────────────────────────────────────┤
│  Trang công khai            │  Dashboard (Yêu cầu xác thực)  │
│  /, /cart, /checkout        │  /dashboard/*, giao diện sidebar│
│  /auth/*, /products/*       │  Menu theo vai trò (SELLER/ADMIN)│
│  /orders, /settings         │  Quản lý phiên đăng nhập        │
├──────────────────────────────────────────────────────────────┤
│  Dùng chung: hooks, lib, components                          │
│  Auth (JWT), Cart (localStorage), API client (fetch)         │
├──────────────────────────────────────────────────────────────┤
│                    NestJS API (port 4000)                     │
└──────────────────────────────────────────────────────────────┘
```

## 2. Công nghệ sử dụng

| Tầng | Công nghệ |
|------|-----------|
| Framework | Next.js 15.5 (App Router) |
| Giao diện | React 19, CSS Modules |
| Trạng thái | React hooks, localStorage (giỏ hàng) |
| Xác thực | JWT (access + refresh tokens lưu trong memory/cookie) |
| API Client | `fetch` gốc với wrapper |
| Định tuyến | Dựa trên file (App Router) |
| Build | Turbopack (dev), Webpack (prod) |

---

## 3. Bản đồ định tuyến (Route Map)

### 3.1 Trang công khai (Không cần xác thực)

| Đường dẫn | Component | Mô tả |
|------------|-----------|-------|
| `/` | `page.tsx` | Trang chủ — banner chính, danh mục sản phẩm, bộ lọc danh mục, sắp xếp, phân trang, tìm kiếm |
| `/products/[id]` | `page.tsx` | Chi tiết sản phẩm — hình ảnh, mô tả, thông tin người bán, thêm vào giỏ |
| `/auth/login` | `page.tsx` | Form đăng nhập — email/mật khẩu, nút đăng nhập mạng xã hội |
| `/auth/signup` | `page.tsx` | Form đăng ký — email, mật khẩu, tên, biệt danh, kiểm tra hợp lệ |
| `/auth/forgot-password` | `page.tsx` | Quên mật khẩu — nhập email |
| `/auth/reset-password` | `page.tsx` | Đặt lại mật khẩu — token + mật khẩu mới |
| `/auth/social/callback` | `page.tsx` | Xử lý callback OAuth |
| `/cart` | `page.tsx` | Giỏ hàng — danh sách sản phẩm, số lượng, xóa, nút thanh toán |
| `/checkout` | `page.tsx` | Thanh toán — khách/đã đăng nhập, thông tin giao hàng, phương thức thanh toán |
| `/checkout/success` | `page.tsx` | Xác nhận đơn hàng |
| `/orders` | `page.tsx` | Lịch sử đơn hàng (trang riêng với header/footer) |
| `/settings` | `page.tsx` | Cài đặt tài khoản (trang riêng với header/footer) |

### 3.2 Trang Dashboard (Yêu cầu xác thực)

**Bố cục:** Thanh điều hướng sidebar với các mục menu theo vai trò.
- BUYER: Chuyển hướng về `/` (không có quyền truy cập dashboard)
- SELLER: Sản phẩm, Doanh số, Bảng tin, Chat, Cài đặt
- SUPER_ADMIN: Tất cả trang SELLER + Bảng điều khiển Admin + Quản lý người dùng

| Đường dẫn | Vai trò | Mô tả |
|------------|---------|-------|
| `/dashboard` | SELLER/ADMIN | Bảng tổng quan |
| `/dashboard/products` | ADMIN | Danh sách tất cả sản phẩm |
| `/dashboard/products/my` | SELLER | Danh sách sản phẩm của tôi |
| `/dashboard/products/create` | SELLER/ADMIN | Tạo sản phẩm mới |
| `/dashboard/products/[id]` | SELLER/ADMIN | Xem chi tiết sản phẩm |
| `/dashboard/products/[id]/edit` | SELLER/ADMIN | Form chỉnh sửa sản phẩm |
| `/dashboard/orders` | ALL | Lịch sử đơn hàng người mua |
| `/dashboard/orders/sales` | SELLER | Danh sách đơn hàng bán ra |
| `/dashboard/cart` | ALL | Giỏ hàng |
| `/dashboard/checkout` | ALL | Luồng thanh toán |
| `/dashboard/checkout/success` | ALL | Xác nhận đơn hàng |
| `/dashboard/board` | ALL | Danh sách bảng tin |
| `/dashboard/board/create` | ALL | Tạo bài viết |
| `/dashboard/board/[id]` | ALL | Xem bài viết + bình luận |
| `/dashboard/board/[id]/edit` | Owner | Chỉnh sửa bài viết |
| `/dashboard/chat` | ALL | Chat thời gian thực |
| `/dashboard/search` | ALL | Kết quả tìm kiếm |
| `/dashboard/settings` | ALL | Hồ sơ & cài đặt tài khoản |
| `/dashboard/admin` | ADMIN | Bảng điều khiển admin (thống kê, hoạt động) |
| `/dashboard/admin/users` | ADMIN | Quản lý người dùng (CRUD, vai trò, trạng thái) |

---

## 4. Các component chính

### 4.1 Component dùng chung

| Component | Đường dẫn | Mục đích |
|-----------|-----------|----------|
| `AuthModal` | `components/auth-modal/` | Lớp phủ modal đăng nhập/đăng ký |
| `UserMenu` | `components/user-menu/` | Menu dropdown người dùng (avatar, liên kết, đăng xuất) |
| `GlobalSearchBar` | `components/global-search/` | Ô tìm kiếm dashboard với gợi ý |
| `ToastContainer` | `components/toast/` | Hệ thống thông báo toast |

### 4.2 Custom Hooks

| Hook | Đường dẫn | Mục đích |
|------|-----------|----------|
| `useAuth` | `hooks/use-auth.ts` | Trạng thái xác thực, đăng nhập/đăng xuất, làm mới token, quản lý phiên |
| `useCart` | `hooks/use-cart.ts` | Trạng thái giỏ hàng (localStorage), thêm/xóa/cập nhật sản phẩm |

### 4.3 Các module thư viện (Lib Modules)

| Module | Đường dẫn | Mục đích |
|--------|-----------|----------|
| `auth` | `lib/auth.ts` | Lưu trữ token, hàm hỗ trợ xác thực API, thông tin người dùng |
| `products` | `lib/products.ts` | API client sản phẩm, danh mục, formatPrice |

---

## 5. Luồng xác thực (Authentication Flow)

```
┌─────────┐     POST /auth/login     ┌─────────┐
│  Form    │ ───────────────────────> │  Server  │
│  Đăng    │ <─────────────────────── │  (JWT)   │
│  nhập    │   { accessToken,         └─────────┘
└─────────┘   refreshToken }
       │
       ▼
  Lưu tokens trong memory/localStorage
       │
       ▼
  ┌──────────────┐
  │ Gọi API      │──── Authorization: Bearer <token>
  └──────────────┘
       │
       ▼  (token hết hạn)
  ┌──────────────┐     POST /auth/refresh
  │ Tự động làm  │──── { refreshToken }
  │ mới token    │──── Cấp tokens mới
  └──────────────┘
       │
       ▼  (làm mới thất bại)
  ┌──────────────┐
  │ Modal phiên  │──── Đăng nhập lại không cần chuyển trang
  └──────────────┘
```

---

## 6. Điểm ngắt giao diện đáp ứng (Responsive Breakpoints)

| Điểm ngắt | Chiều rộng | Bố cục |
|------------|------------|--------|
| Di động | ~767px | Một cột, menu hamburger |
| Máy tính bảng | 768~1023px | Grid thích ứng, sidebar có thể thu gọn |
| Máy tính | 1024px~ | Sidebar đầy đủ, grid nhiều cột |

---

## 7. Tính năng trang chủ

| Tính năng | Mô tả |
|-----------|-------|
| Banner chính | Carousel tự động xoay 3 slide (chu kỳ 5 giây) |
| Thanh danh mục | Bộ lọc chip ngang (Tất cả, Gốm sứ, Dệt may, Nghệ thuật, Trang sức, Nhà cửa, Thực phẩm) |
| Lưới sản phẩm | 8 sản phẩm mỗi trang, bố cục thẻ với hình ảnh, tên, giá, người bán |
| Tùy chọn sắp xếp | Phổ biến, Mới nhất, Giá Thấp/Cao, Đánh giá cao nhất |
| Tìm kiếm | Thanh tìm kiếm ở header — lọc sản phẩm tại chỗ, hỗ trợ tham số URL `?q=` |
| Phân trang | Số trang được rút gọn với điều hướng trước/sau |
| Modal xác thực | Modal đăng nhập/đăng ký kích hoạt từ nút trên header |
| Giỏ hàng | Biểu tượng giỏ hàng trên header với huy hiệu số lượng |

---

## 8. Hệ thống thiết kế (Design System)

| Token | Giá trị |
|-------|---------|
| Màu sắc | CSS Variables (`--color-*`) — không dùng giá trị cố định |
| Cỡ chữ | Thang token (`--font-size-*`) |
| Khoảng cách | Lưới 8px (`--spacing-*`) |
| Kiểu dáng | CSS Modules (`.module.css`) cho mỗi component |
| Biểu tượng | Inline SVG |
