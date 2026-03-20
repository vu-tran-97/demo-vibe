# Frontend Component Documentation

This document catalogs all reusable components and key page components in the demo-vibe frontend.

---

## Reusable Components (`src/components/`)

### 1. AuthModal

**File:** `src/components/auth-modal/AuthModal.tsx`
**Styles:** `src/components/auth-modal/auth-modal.module.css`

A modal dialog that handles both login and signup flows, including social login placeholders (currently commented out). Supports session re-authentication via the `stayOnPage` prop.

#### Props Interface

```typescript
type ModalView = "login" | "signup";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: ModalView;       // Default: "login"
  onSuccess?: () => void;
  /** When true, skips navigation after login/signup (used for session re-auth) */
  stayOnPage?: boolean;           // Default: false
}
```

#### Usage Example

```tsx
import { AuthModal } from '@/components/auth-modal/AuthModal';

<AuthModal
  isOpen={authModalOpen}
  onClose={() => setAuthModalOpen(false)}
  initialView="login"
  onSuccess={refreshAuth}
/>

// Session re-auth usage (stays on current page after login):
<AuthModal
  isOpen={sessionExpired}
  onClose={() => setSessionExpired(false)}
  initialView="login"
  onSuccess={handleReauth}
  stayOnPage
/>
```

#### States

| State | Behavior |
|-------|----------|
| **Closed** | Returns `null`, renders nothing |
| **Login view** | Email/password form with "Remember me" checkbox and "Forgot password" link |
| **Signup view** | Name, nickname, email, password form with validation hints |
| **Loading** | Submit button shows "Signing in..." or "Creating account...", button disabled |
| **Error** | Error banner displayed above form with contextual messages (invalid credentials, account suspended, email already exists, etc.) |
| **Network error** | Shows "Unable to connect to server. Please try again." |

#### Keyboard & Accessibility

- Body scroll locked when open
- Form fields have associated `<label>` elements with `htmlFor`
- `autoComplete` attributes on all inputs

---

### 2. GlobalSearchBar

**File:** `src/components/global-search/GlobalSearchBar.tsx`
**Styles:** `src/components/global-search/global-search.module.css`

A search bar with autocomplete suggestions dropdown, recent search history (persisted in localStorage), and a dedicated mobile overlay experience. Supports keyboard navigation (Cmd+K / Ctrl+K shortcut).

#### Props Interface

```typescript
// No props — self-contained component
export function GlobalSearchBar(): JSX.Element
```

#### Usage Example

```tsx
import { GlobalSearchBar } from '@/components/global-search/GlobalSearchBar';

// Used in the dashboard top bar
<div className={styles.topBarRight}>
  <GlobalSearchBar />
</div>
```

#### States

| State | Behavior |
|-------|----------|
| **Idle** | Search input with keyboard shortcut badge (Cmd+K) |
| **Focused (empty)** | Dropdown shows recent searches if available, with "Clear" button |
| **Typing** | 300ms debounced API call for suggestions |
| **Loading** | Spinner with "Searching..." text in dropdown |
| **Suggestions loaded** | List of product/post suggestions with type icons |
| **No results** | "No suggestions found. Press Enter to search." message |
| **Mobile** | Separate search icon button triggers full-screen overlay |

#### Keyboard Navigation

- `Cmd+K` / `Ctrl+K`: Focus search input
- `Escape`: Close dropdown and blur
- `ArrowUp` / `ArrowDown`: Navigate suggestions
- `Enter`: Execute search (or select active suggestion)

---

### 3. LoadingSpinner

**File:** `src/components/loading-spinner/LoadingSpinner.tsx`
**Styles:** `src/components/loading-spinner/loading-spinner.module.css`

A simple centered loading indicator with a spinner animation and "Loading..." text.

#### Props Interface

```typescript
// No props
export function LoadingSpinner(): JSX.Element
```

#### Usage Example

```tsx
import { LoadingSpinner } from '@/components/loading-spinner/LoadingSpinner';

if (loading) {
  return <LoadingSpinner />;
}
```

#### States

Single state only: displays a centered spinner with "Loading..." text.

---

### 4. Toast / ToastContainer

**File:** `src/components/toast/Toast.tsx`
**Styles:** `src/components/toast/toast.module.css`

A global toast notification system that can be triggered imperatively from anywhere without React context or providers. Uses a pub/sub pattern with a module-level listener set.

#### Props / API Interface

```typescript
export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// Imperative function — call from anywhere
export function showToast(message: string, type?: ToastMessage['type']): void;

// Container component — mount once in layout
export function ToastContainer(): JSX.Element | null;
```

#### Usage Example

```tsx
import { ToastContainer, showToast } from '@/components/toast/Toast';

// In layout (mount once):
<ToastContainer />

// From any component or handler:
showToast('Item added to cart');
showToast('Failed to save', 'error');
showToast('New message received', 'info');
```

#### States

| State | Behavior |
|-------|----------|
| **No toasts** | Returns `null`, renders nothing |
| **Success** | Green toast with checkmark icon |
| **Error** | Red toast with X icon |
| **Info** | Blue toast with info icon |
| **Auto-dismiss** | Each toast auto-removes after 3 seconds |
| **Manual dismiss** | Close button on each toast |

---

### 5. UserMenu

**File:** `src/components/user-menu/UserMenu.tsx`
**Styles:** `src/components/user-menu/user-menu.module.css`

A dropdown menu showing user info, avatar, role badge, and role-specific navigation links. Renders different menu sections based on the user's role (BUYER, SELLER, SUPER_ADMIN).

#### Props Interface

```typescript
interface UserMenuProps {
  user: UserInfo;    // from @/lib/auth
  onLogout: () => void;
}
```

#### Usage Example

```tsx
import { UserMenu } from '@/components/user-menu/UserMenu';

{loggedIn && user ? (
  <UserMenu user={user} onLogout={handleLogout} />
) : (
  <button onClick={openLogin}>Sign In</button>
)}
```

#### States

| State | Behavior |
|-------|----------|
| **Closed** | Shows avatar (image or initial) + display name + arrow |
| **Open** | Dropdown with user info section, role badge, and role-specific nav links |

#### Role-Specific Menu Items

| Role | Menu Items |
|------|-----------|
| **BUYER** | My Orders, Cart, Settings, Log Out |
| **SELLER** | Dashboard, My Orders, Cart, My Products, Sales, Settings, Log Out |
| **SUPER_ADMIN** | Dashboard, Admin Management, User Management, My Orders, Cart, Settings, Log Out |

---

### 6. AdminUsersPageClient

**File:** `src/components/admin/AdminUsersPageClient.tsx`
**Styles:** `src/components/admin/admin.module.css`

A full-featured admin user management page client component. Orchestrates filtering, table display, pagination, and multiple modal actions (create, edit, change role, reset password, suspend/activate).

#### Props Interface

```typescript
// No props — self-contained page-level client component
export function AdminUsersPageClient(): JSX.Element
```

#### Usage Example

```tsx
import { AdminUsersPageClient } from '@/components/admin/AdminUsersPageClient';

export default function AdminUsersPage() {
  return <AdminUsersPageClient />;
}
```

#### States

| State | Behavior |
|-------|----------|
| **Loading** | Skeleton rows in table, skeleton cards on mobile |
| **Empty** | "No users found" message with suggestion to adjust filters |
| **Data loaded** | User table (desktop) or card list (mobile) with kebab action menus |
| **Error** | Toast notification with error message |

#### Sub-Modals

- **Create User**: Email, password, name, role selection
- **Edit User**: Name and nickname editing (email read-only)
- **Change Role**: Role selector (Buyer/Seller)
- **Reset Password**: New password + confirmation
- **Suspend/Activate**: Confirmation dialog with danger/warning variant

---

### 7. AdminUserFilters

**File:** `src/components/admin/AdminUserFilters.tsx`

A filter toolbar with debounced search input (300ms) and role/status dropdown selects.

#### Props Interface

```typescript
interface AdminUserFiltersProps {
  search: string;
  role: string;
  status: string;
  onSearchChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}
```

#### Usage Example

```tsx
<AdminUserFilters
  search={search}
  role={roleFilter}
  status={statusFilter}
  onSearchChange={handleSearchChange}
  onRoleChange={handleRoleChange}
  onStatusChange={handleStatusChange}
/>
```

---

### 8. AdminUserTable

**File:** `src/components/admin/AdminUserTable.tsx`

Renders user data as a responsive table (desktop) and card list (mobile). Includes skeleton loading states and a kebab menu per row with action callbacks.

#### Props Interface

```typescript
interface AdminUserTableProps {
  users: AdminUser[];
  loading: boolean;
  onEditUser: (user: AdminUser) => void;
  onChangeRole: (user: AdminUser) => void;
  onResetPassword: (user: AdminUser) => void;
  onChangeStatus: (user: AdminUser) => void;
}
```

#### States

| State | Behavior |
|-------|----------|
| **Loading** | 8 skeleton rows (desktop), 4 skeleton cards (mobile) |
| **Empty** | "No users found" empty state |
| **Data** | Table rows with avatar, name, email, role badge, status badge, date, kebab menu |

---

### 9. AdminCreateUserModal

**File:** `src/components/admin/AdminCreateUserModal.tsx`

A modal form for creating new users with client-side validation (email format, password strength, required name).

#### Props Interface

```typescript
interface AdminCreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
```

#### Validation Rules

- **Email**: Required, valid email format
- **Password**: Required, min 8 chars, must include uppercase + lowercase + number + special character
- **Name**: Required
- **Role**: Required selection (Buyer or Seller)

---

### 10. ConfirmActionModal

**File:** `src/components/admin/ConfirmActionModal.tsx`

A generic confirmation dialog with configurable title, message, button label, and visual variant (danger/warning).

#### Props Interface

```typescript
interface ConfirmActionModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  variant?: 'danger' | 'warning';  // Default: 'warning'
  loading?: boolean;                // Default: false
  onConfirm: () => void;
  onCancel: () => void;
}
```

#### Usage Example

```tsx
<ConfirmActionModal
  isOpen={confirmModal.isOpen}
  title="Suspend User"
  message="Suspend John? The user will be logged out immediately."
  confirmLabel="Suspend"
  variant="danger"
  loading={confirmLoading}
  onConfirm={handleConfirm}
  onCancel={handleCancel}
/>
```

#### Accessibility

- `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- Escape key to cancel
- Auto-focuses confirm button on open
- Body scroll locked when open

---

### 11. Pagination

**File:** `src/components/admin/Pagination.tsx`

A page navigation component with ellipsis truncation for large page counts. Hidden when total pages is 1 or less.

#### Props Interface

```typescript
interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}
```

#### Usage Example

```tsx
<Pagination
  page={pagination.page}
  totalPages={pagination.totalPages}
  total={pagination.total}
  onPageChange={setPage}
/>
```

#### Accessibility

- `aria-label` on all page buttons ("Previous page", "Next page", "Page N")
- `aria-current="page"` on active page button

---

### 12. RoleBadge

**File:** `src/components/admin/RoleBadge.tsx`

A colored badge displaying a user role label.

#### Props Interface

```typescript
interface RoleBadgeProps {
  role: string;  // 'SUPER_ADMIN' | 'SELLER' | 'BUYER'
}
```

#### Visual Mapping

| Role | Label | Color |
|------|-------|-------|
| `SUPER_ADMIN` | Admin | Purple |
| `SELLER` | Seller | Blue |
| `BUYER` | Buyer | Green |

---

### 13. StatusBadge

**File:** `src/components/admin/StatusBadge.tsx`

A status indicator with a colored dot and label.

#### Props Interface

```typescript
interface StatusBadgeProps {
  status: string;  // 'ACTV' | 'SUSP' | 'INAC'
}
```

#### Visual Mapping

| Status | Label | Dot Color |
|--------|-------|-----------|
| `ACTV` | Active | Green |
| `SUSP` | Suspended | Red |
| `INAC` | Inactive | Gray |

---

## Key Page Components

### HomePage (`src/app/page.tsx`)

The public-facing storefront page. A `'use client'` component that serves as the main landing page with product browsing, category filtering, sorting, and a flash deals section.

**Key Features:**
- Top bar with sign up/sign in buttons (or welcome message when logged in)
- Header with logo, search bar, cart icon with badge, and UserMenu
- Category navigation bar (All, Ceramics, Textiles, Art, Jewelry, Home, Food)
- Flash Deals section (products with sale prices)
- Product grid with pagination, sorting (Popular, Latest, Price Low/High, Top Rated)
- Quick "Add to Cart" button per product card
- Footer with navigation links

**States:** Loading (products fetching), Empty (no products found with "Clear Filters" button), Data loaded

---

### DashboardLayout (`src/app/dashboard/layout.tsx`)

The authenticated dashboard shell with a collapsible sidebar, top bar, and role-based navigation. Blocks BUYER role and redirects to home.

**Key Features:**
- Sidebar with role-filtered navigation items
- Admin section in sidebar (SUPER_ADMIN only)
- Mobile hamburger menu with overlay
- GlobalSearchBar in top bar
- Cart badge in top bar
- Session expiration detection and re-auth via AuthModal
- ToastContainer mounted globally

---

### DashboardPage (`src/app/dashboard/page.tsx`)

Renders a role-specific dashboard view:
- **BuyerDashboard**: Stats (total orders, spent, pending, delivered), quick actions, recent orders table
- **SellerDashboard**: Stats (products, sales, revenue, monthly), recent sales table, product list
- **AdminDashboard**: Stats (users, new this week, sellers, buyers), quick actions, recent activity timeline

---

### NotFound (`src/app/not-found.tsx`)

A Server Component (no `'use client'` directive) showing a minimal 404 page with a "Go Home" link.
