# Frontend Architecture

## Technology Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Styling:** CSS Modules with CSS Custom Properties (design tokens)
- **State Management:** localStorage + custom hooks
- **API Communication:** Fetch API with typed wrapper functions

---

## Next.js 15 App Router Structure

All routes live under `src/app/`. The project uses the App Router's file-system routing with layouts, dynamic segments, and nested route groups.

### Route Map

| Route | File | Component Type | Description |
|-------|------|---------------|-------------|
| `/` | `app/page.tsx` | Client | Public storefront with product grid |
| `/auth/login` | `app/auth/login/page.tsx` | Client | Login page (standalone) |
| `/auth/signup` | `app/auth/signup/page.tsx` | Client | Signup page (standalone) |
| `/auth/forgot-password` | `app/auth/forgot-password/page.tsx` | Client | Password reset request |
| `/auth/reset-password` | `app/auth/reset-password/page.tsx` | Client | Password reset form |
| `/auth/social/callback` | `app/auth/social/callback/page.tsx` | Client | OAuth callback handler |
| `/products/[id]` | `app/products/[id]/page.tsx` | Client | Public product detail |
| `/cart` | `app/cart/page.tsx` | Client | Shopping cart |
| `/checkout` | `app/checkout/page.tsx` | Client | Checkout flow |
| `/checkout/success` | `app/checkout/success/page.tsx` | Client | Order confirmation |
| `/orders` | `app/orders/page.tsx` | Client | Buyer order history |
| `/settings` | `app/settings/page.tsx` | Client | Buyer settings |
| `/dashboard` | `app/dashboard/page.tsx` | Client | Role-based dashboard (Seller/Admin) |
| `/dashboard/products` | `app/dashboard/products/page.tsx` | Client | Product catalog (Admin) |
| `/dashboard/products/my` | `app/dashboard/products/my/page.tsx` | Client | Seller's own products |
| `/dashboard/products/create` | `app/dashboard/products/create/page.tsx` | Client | New product form |
| `/dashboard/products/[id]` | `app/dashboard/products/[id]/page.tsx` | Client | Product detail (dashboard) |
| `/dashboard/products/[id]/edit` | `app/dashboard/products/[id]/edit/page.tsx` | Client | Edit product form |
| `/dashboard/orders` | `app/dashboard/orders/page.tsx` | Client | Buyer orders (dashboard) |
| `/dashboard/orders/sales` | `app/dashboard/orders/sales/page.tsx` | Client | Seller sales management |
| `/dashboard/cart` | `app/dashboard/cart/page.tsx` | Client | Cart (dashboard context) |
| `/dashboard/checkout` | `app/dashboard/checkout/page.tsx` | Client | Checkout (dashboard) |
| `/dashboard/checkout/success` | `app/dashboard/checkout/success/page.tsx` | Client | Success (dashboard) |
| `/dashboard/board` | `app/dashboard/board/page.tsx` | Client | Bulletin board list |
| `/dashboard/board/create` | `app/dashboard/board/create/page.tsx` | Client | Create post |
| `/dashboard/board/[id]` | `app/dashboard/board/[id]/page.tsx` | Client | Post detail + comments |
| `/dashboard/board/[id]/edit` | `app/dashboard/board/[id]/edit/page.tsx` | Client | Edit post |
| `/dashboard/search` | `app/dashboard/search/page.tsx` | Client | Search results (products + posts) |
| `/dashboard/settings` | `app/dashboard/settings/page.tsx` | Client | User settings (dashboard) |
| `/dashboard/chat` | `app/dashboard/chat/page.tsx` | Client | Real-time chat |
| `/dashboard/admin` | `app/dashboard/admin/page.tsx` | Client | Admin dashboard |
| `/dashboard/admin/users` | `app/dashboard/admin/users/page.tsx` | Client | Admin user management |

### Layouts

| Layout | File | Description |
|--------|------|-------------|
| Root | `app/layout.tsx` | Server Component. Sets `<html lang="en">`, imports `globals.css`, defines metadata. |
| Dashboard | `app/dashboard/layout.tsx` | Client Component. Sidebar navigation, top bar with search, role-based access control, session expiration handling. |
| Admin | `app/dashboard/admin/layout.tsx` | Client Component. Additional admin layout wrapper. |

---

## Client vs Server Component Decisions

The project is predominantly client-side rendered. The design decision follows this pattern:

### Server Components (no `'use client'`)

- **`app/layout.tsx`** (Root Layout): Static HTML shell, metadata, global CSS import. No interactivity needed.
- **`app/not-found.tsx`** (404 page): Static content with a simple Link.

### Client Components (`'use client'`)

Nearly all other pages and components use the `'use client'` directive because they require:

1. **Authentication state**: Most pages check `localStorage` for tokens via `useAuth()`
2. **Interactive UI**: Forms, modals, dropdowns, search, filtering, sorting
3. **Browser APIs**: `localStorage`, `window.addEventListener`, `document.body.style`
4. **React hooks**: `useState`, `useEffect`, `useCallback`, `useRef`, `useRouter`

### Rationale

The application is an authenticated SPA-style experience where the backend API (NestJS) handles all data fetching. Server-side rendering is not leveraged for data fetching because:

- Auth tokens are stored in `localStorage` (not cookies), making server-side authenticated requests impossible without architectural changes
- The API server is a separate process (`http://localhost:4000`), and the frontend is purely a client that communicates via REST

---

## State Management Patterns

### Authentication (`localStorage` + `useAuth` hook)

**Storage:** Three `localStorage` keys manage auth state:
- `accessToken` — JWT access token
- `refreshToken` — JWT refresh token
- `user` — Serialized `UserInfo` object

**Hook:** `src/hooks/use-auth.ts`

```typescript
export function useAuth(requireAuth = true) {
  // Returns: { user, loading, logout, refresh }
}
```

- On mount, checks `isLoggedIn()` (tests for `accessToken` presence)
- If `requireAuth` is true and user is not logged in, redirects to `/`
- `refresh()` re-reads user from localStorage (used after session re-auth)
- `logout()` calls the API, clears tokens, and redirects to `/`

**Session expiration:** When any API call returns 401:
- `lib/auth.ts`: Clears tokens and redirects to `/` via `window.location.href`
- `lib/admin.ts`: Dispatches a `session-expired` CustomEvent, which the dashboard layout listens for and opens an AuthModal for re-authentication
- `lib/orders.ts`, `lib/products.ts`: Same 401 handling as auth.ts

### Cart (`localStorage` + `useCart` hook)

**Storage:** `localStorage` key `vibe_cart` stores a JSON array of `CartItem[]`.

**Hook:** `src/hooks/use-cart.ts`

```typescript
export function useCart() {
  // Returns: { items, addItem, updateQuantity, removeItem, clearCart, totalItems, totalPrice }
}
```

- Cross-component synchronization via `CustomEvent('vibe-cart-change')`
- `addItem()` performs stock validation and returns `{ success, message }`
- Quantity updates automatically remove items when quantity drops to 0
- `totalItems` and `totalPrice` are computed values (derived state)

### Search History (`localStorage`)

**Storage:** `localStorage` key `vibe_recent_searches` stores up to 10 recent searches.

**Functions:** `src/lib/search.ts` exports `getRecentSearches()`, `addRecentSearch()`, `clearRecentSearches()`.

---

## Styling Approach

### CSS Modules with Design Tokens

Every component and page has a co-located `.module.css` file. Global design tokens are defined in `src/app/globals.css` as CSS Custom Properties on `:root`.

### Design Token Categories

| Category | Prefix | Examples |
|----------|--------|---------|
| Colors | `--` (named) | `--ivory`, `--charcoal`, `--gold`, `--success`, `--error` |
| Typography | `--font-` | `--font-display` (Cormorant Garamond), `--font-body` (Outfit) |
| Spacing | `--space-` | `--space-xs` (0.25rem) through `--space-5xl` (8rem) |
| Border radius | `--radius-` | `--radius-sm` (4px) through `--radius-xl` (16px) |
| Shadows | `--shadow-` | `--shadow-subtle`, `--shadow-soft`, `--shadow-medium`, `--shadow-elevated` |
| Transitions | `--ease-`, `--duration-` | `--ease-out`, `--duration-fast` (200ms), `--duration-normal` (400ms) |

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--ivory` | `#FAFAF7` | Page background |
| `--charcoal` | `#1A1A1A` | Primary text |
| `--gold` | `#C8A96E` | Accent, buttons, badges |
| `--slate` | `#6B6B6B` | Secondary text |
| `--muted` | `#9A9A94` | Tertiary text |
| `--border` | `#E8E6E1` | Borders, dividers |
| `--success` | `#5A8A6A` | Success states |
| `--error` | `#C45B5B` | Error states |

### Typography

- **Display font**: Cormorant Garamond (serif) — headings
- **Body font**: Outfit (sans-serif) — body text, UI elements

### Animation System

Global keyframe animations defined in `globals.css`:
- `fadeUp` — opacity + translateY entrance
- `fadeIn` — opacity entrance
- `slideInLeft` — opacity + translateX entrance
- `shimmer` — skeleton loading effect
- `scaleIn` — opacity + scale entrance

Utility classes: `.animate-fade-up`, `.animate-fade-in`, `.delay-1` through `.delay-8`

---

## API Communication Patterns

All API communication is centralized in `src/lib/` modules. Each module follows the same pattern:

### Common Pattern

1. **Base URL**: `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'`
2. **Auth headers**: Read `accessToken` from `localStorage`, attach as `Bearer` token
3. **Response format**: All endpoints return `{ success: boolean, data: T, error?: string, message?: string }`
4. **401 handling**: Clear tokens + redirect to `/` (or dispatch `session-expired` event)
5. **Data mapping**: Raw API responses are mapped to frontend-friendly interfaces

### API Modules

| Module | File | Endpoints |
|--------|------|-----------|
| **Auth** | `lib/auth.ts` | `login`, `signup`, `logout`, `forgotPassword`, `resetPassword`, `updateProfile`, `changePassword`, `deleteAccount`, `refreshTokens` |
| **Products** | `lib/products.ts` | `fetchProducts`, `fetchMyProducts`, `fetchProductById`, `createProduct`, `updateProduct`, `updateProductStatus`, `deleteProduct` |
| **Orders** | `lib/orders.ts` | `fetchBuyerOrders`, `fetchOrderById`, `createOrder`, `checkoutOrder`, `payOrder`, `confirmItemPayment`, `updateOrderStatus`, `fetchSellerSales`, `fetchSellerSummary`, `fetchSellerOrderDetail`, `updateItemStatus`, `bulkUpdateItemStatus` |
| **Board** | `lib/board.ts` | `fetchBanner`, `updateBanner`, `fetchPosts`, `fetchPostById`, `createPost`, `updatePost`, `deletePost`, `fetchComments`, `createComment`, `updateComment`, `deleteComment` |
| **Search** | `lib/search.ts` | `fetchSearchResults`, `fetchSearchSuggestions` |
| **Admin** | `lib/admin.ts` | `fetchAdminUsers`, `createAdminUser`, `updateUser`, `changeUserRole`, `changeUserStatus`, `resetUserPassword`, `fetchUserActivity`, `bulkChangeStatus`, `exportUsersCsv`, `fetchDashboard`, `fetchUserSummary` |

### Custom Error Class

```typescript
// lib/auth.ts
export class AuthError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}
```

Known error codes: `INVALID_CREDENTIALS`, `ACCOUNT_SUSPENDED`, `ACCOUNT_INACTIVE`, `EMAIL_ALREADY_EXISTS`, `NICKNAME_ALREADY_EXISTS`, `SESSION_EXPIRED`, `NO_REFRESH_TOKEN`.

---

## Error Handling

### 401 Auto-Logout Strategy

All API modules implement automatic session cleanup on 401 responses:

1. **`lib/auth.ts`** (`authFetch`): Clears `accessToken`, `refreshToken`, `user` from localStorage. Redirects to `/` via `window.location.href`. Throws `AuthError` with code `SESSION_EXPIRED`. Exception: skips redirect for login/signup endpoints.

2. **`lib/admin.ts`** (`adminFetch`): Dispatches `CustomEvent('session-expired')` instead of hard redirect. Also handles 403 by redirecting to `/dashboard`. The dashboard layout listens for this event and opens the AuthModal for re-authentication.

3. **`lib/products.ts`** and **`lib/orders.ts`**: Clear localStorage and redirect to `/` on 401.

### Error Display Patterns

- **Forms** (AuthModal, AdminCreateUserModal): Inline error banner above the form
- **Field-level validation** (AdminCreateUserModal): Per-field error messages below inputs
- **Page-level errors**: Toast notifications via `showToast(message, 'error')`
- **Empty states**: Contextual empty state messages with suggested actions

### Session Re-Authentication Flow

1. Admin API call returns 401
2. `adminFetch` dispatches `session-expired` event
3. Dashboard layout catches event, sets `sessionExpired = true`
4. AuthModal opens with `stayOnPage` mode
5. User logs in successfully
6. `handleReauth` callback sets `sessionExpired = false`, calls `refresh()`
7. Dispatches `session-restored` event
8. AdminUsersPageClient listens for `session-restored` and reloads data

---

## Responsive Design Approach

### Breakpoints

Defined in the project's CLAUDE.md design rules:

| Breakpoint | Range | Target |
|------------|-------|--------|
| Mobile | up to 767px | Phones |
| Tablet | 768px to 1023px | Tablets |
| Desktop | 1024px and above | Desktops |

### Responsive Patterns Used

1. **Dashboard sidebar**: Collapsible sidebar with hamburger menu button on mobile. Full sidebar on desktop, overlay slide-in on mobile.

2. **Admin user table**: Table view on desktop/tablet, card list on mobile. Both layouts are rendered simultaneously and shown/hidden via CSS.

3. **Global search**: Full input bar on desktop, icon button triggering full-screen overlay on mobile.

4. **Product grid**: Multi-column grid that adjusts column count via CSS Grid and media queries.

5. **Navigation**: Horizontal category bar scrollable on mobile, full display on desktop.

6. **Modals**: Full-width on mobile, max-width constrained on desktop.

### Implementation

Responsive styles are handled entirely through CSS Modules with media queries. No JavaScript-based breakpoint detection is used. The CSS follows a mobile-first approach where base styles target mobile and `@media (min-width: ...)` queries add tablet and desktop enhancements.
