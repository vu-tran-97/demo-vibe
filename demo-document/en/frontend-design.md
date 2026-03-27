# Frontend Design Document

> **Project:** Vibe E-Commerce Platform
> **Last Updated:** 2026-03-27
> **Framework:** Next.js 15 (App Router, React 19)
> **Port:** localhost:3000
> **Production:** `demo-vibe-production.up.railway.app` (frontend), `demo-vibe-backend-production.up.railway.app` (backend)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                       Next.js 15                              │
│                    App Router (RSC)                           │
├──────────────────────────────────────────────────────────────┤
│  Public Pages          │  Dashboard (Auth Required)           │
│  /, /cart, /checkout   │  /dashboard/*, sidebar layout       │
│  /auth/*, /products/*  │  Role-based nav (SELLER/ADMIN)      │
│  /orders, /settings    │  Session management                 │
├──────────────────────────────────────────────────────────────┤
│  Shared: hooks, lib, components                              │
│  Auth (Firebase), Cart (localStorage), API client (fetch)    │
├──────────────────────────────────────────────────────────────┤
│                    NestJS API (port 4000)                     │
└──────────────────────────────────────────────────────────────┘
```

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15.5 (App Router) |
| UI | React 19, Tailwind CSS v4 + PostCSS |
| State | React hooks, localStorage (cart) |
| Auth | Firebase Auth (ID token) |
| API Client | Native `fetch` with wrapper |
| Routing | File-based (App Router) |
| Build | Turbopack (dev), Webpack (prod) |

---

## 3. Route Map

### 3.1 Public Pages (No Authentication)

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `page.tsx` | Homepage — hero banner, product catalog, category filter, sort, pagination, search |
| `/products/[id]` | `page.tsx` | Product detail — images, description, seller info, add-to-cart |
| `/auth/login` | `page.tsx` | Login form — email/password, social login buttons |
| `/auth/signup` | `page.tsx` | Signup form — email, password, name, nickname, validation |
| `/auth/forgot-password` | `page.tsx` | Forgot password — email input |
| `/auth/reset-password` | `page.tsx` | Reset password — token + new password |
| `/auth/social/callback` | `page.tsx` | OAuth callback handler |
| `/cart` | `page.tsx` | Shopping cart — item list, quantity, remove, checkout button |
| `/checkout` | `page.tsx` | Checkout — guest/auth, shipping info, payment method |
| `/checkout/success` | `page.tsx` | Order confirmation |
| `/orders` | `page.tsx` | Order history (standalone with header/footer) |
| `/settings` | `page.tsx` | Account settings (standalone with header/footer) |

### 3.2 Dashboard Pages (Authentication Required)

**Layout:** Sidebar navigation with role-based menu items.
- BUYER: Redirected to `/` (no dashboard access)
- SELLER: Products, Sales, Board, Chat, Settings
- SUPER_ADMIN: All SELLER pages + Admin Dashboard + User Management

| Route | Role | Description |
|-------|------|-------------|
| `/dashboard` | SELLER/ADMIN | Overview dashboard |
| `/dashboard/products` | ADMIN | All products list |
| `/dashboard/products/my` | SELLER | My products list |
| `/dashboard/products/create` | SELLER/ADMIN | Create new product |
| `/dashboard/products/[id]` | SELLER/ADMIN | Product detail view |
| `/dashboard/products/[id]/edit` | SELLER/ADMIN | Edit product form |
| `/dashboard/orders` | ALL | Buyer order history |
| `/dashboard/orders/sales` | SELLER | Sales orders list |
| `/dashboard/cart` | ALL | Shopping cart |
| `/dashboard/checkout` | ALL | Checkout flow |
| `/dashboard/checkout/success` | ALL | Order confirmation |
| `/dashboard/board` | ALL | Bulletin board list |
| `/dashboard/board/create` | ALL | Create post |
| `/dashboard/board/[id]` | ALL | View post + comments |
| `/dashboard/board/[id]/edit` | Owner | Edit post |
| `/dashboard/chat` | ALL | Real-time chat |
| `/dashboard/search` | ALL | Search results |
| `/dashboard/settings` | ALL | Profile & account settings |
| `/dashboard/admin` | ADMIN | Admin dashboard (stats, activity) |
| `/dashboard/admin/users` | ADMIN | User management (CRUD, role, status) |

---

## 4. Key Components

### 4.1 Shared Components

| Component | Path | Purpose |
|-----------|------|---------|
| `AuthModal` | `components/auth-modal/` | Login/signup modal overlay |
| `UserMenu` | `components/user-menu/` | User dropdown (avatar, links, logout) |
| `GlobalSearchBar` | `components/global-search/` | Dashboard search input with suggestions |
| `ToastContainer` | `components/toast/` | Toast notification system |

### 4.2 Custom Hooks

| Hook | Path | Purpose |
|------|------|---------|
| `useAuth` | `hooks/use-auth.ts` | Auth state, login/logout, token refresh, session management |
| `useCart` | `hooks/use-cart.ts` | Cart state (localStorage), add/remove/update items |

### 4.3 Lib Modules

| Module | Path | Purpose |
|--------|------|---------|
| `auth` | `lib/auth.ts` | Token storage, API auth helpers, user info |
| `products` | `lib/products.ts` | Product API client, categories, formatPrice |

---

## 5. Authentication Flow

```
┌─────────┐     Firebase Auth SDK     ┌──────────────┐
│  Login   │ ────────────────────────> │  Firebase    │
│  Form    │ <──────────────────────── │  Auth        │
└─────────┘   { Firebase ID Token }    └──────────────┘
       │
       ▼
  Firebase SDK manages token lifecycle
       │
       ▼
  ┌──────────────┐
  │ API Requests  │──── Authorization: Bearer <firebase_id_token>
  └──────────────┘
       │
       ▼  (token expired)
  ┌──────────────┐
  │ Auto-refresh  │──── Firebase SDK auto-refreshes ID token
  └──────────────┘
       │
       ▼  (auth state lost)
  ┌──────────────┐
  │ Session Modal │──── Re-login without page redirect
  └──────────────┘
```

---

## 6. Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | ~767px | Single column, hamburger menu |
| Tablet | 768~1023px | Adapted grid, collapsible sidebar |
| Desktop | 1024px~ | Full sidebar, multi-column grids |

---

## 7. Homepage Features

| Feature | Description |
|---------|-------------|
| Hero Banner | 3-slide auto-rotating carousel (5s interval) |
| Category Bar | Horizontal chip filter (All, Ceramics, Textiles, Art, Jewelry, Home, Food) |
| Product Grid | 8 items per page, card layout with image, name, price, seller |
| Sort Options | Popular, Latest, Price Low/High, Top Rated |
| Search | Header search bar — filters products in-place, supports `?q=` URL param |
| Pagination | Truncated page numbers with prev/next navigation |
| Auth Modal | Login/signup modal triggered from header buttons |
| Cart | Header cart icon with item count badge |

---

## 8. Design System

| Token | Values |
|-------|--------|
| Colors | CSS Variables (`--color-*`) — no hardcoded values |
| Font Sizes | Token scale (`--font-size-*`) |
| Spacing | 8px grid (`--spacing-*`) |
| Styling | Tailwind CSS v4 utility classes |
| Currency | VND (vi-VN locale, e.g. 123.456₫) |
| Icons | Inline SVG |
