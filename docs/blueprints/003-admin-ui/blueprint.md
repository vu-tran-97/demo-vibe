# 003-Admin-UI: Admin User Management UI Blueprint

> Admin dashboard UI for managing users — list with pagination/search/filtering, user detail panel, create user form, and role/status management with confirmation flows.

## 1. Overview

### 1.1 Purpose
Provide a web-based admin interface for SUPER_ADMIN users to manage platform users. This UI consumes the admin API endpoints built in Sprint 2 (002-rbac) and delivers a complete user management workflow — viewing, searching, creating, and moderating users.

### 1.2 Scope
- User list page with server-side pagination, search, and role/status filters
- User detail slide-over panel with full profile and action buttons
- Create user modal form (SELLER/BUYER accounts)
- Role change with confirmation modal
- Status change (activate/suspend) with confirmation modal
- Role-based navigation — admin section visible only to SUPER_ADMIN
- Route protection — redirect non-admin users away from admin pages
- Responsive layout (desktop table, tablet simplified table, mobile card layout)
- Toast notifications for success/error feedback
- Loading skeletons and empty states

### 1.3 Out of Scope
- Permission-level management UI (future sprint)
- Bulk user operations (multi-select actions)
- User activity log / audit trail viewer
- Export user list (CSV/Excel)
- Admin dashboard analytics (user count charts, growth metrics)

### 1.4 Tech Stack
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, Server Components) |
| Styling | Tailwind CSS + Design Tokens (CSS Custom Properties) |
| State | React Server Components for initial load, `useSearchParams` for filters |
| Data Fetching | `fetch` with JWT from auth context, Server Actions for mutations |
| Forms | React Hook Form + Zod validation |
| Icons | Lucide React |
| Notifications | Sonner (toast library) |

### 1.5 Dependencies
| Module | Dependency |
|--------|-----------|
| 001-auth | JWT authentication, auth context, token refresh |
| 002-rbac | Admin API endpoints, role/status codes, RolesGuard |

---

## 2. Page Structure

### 2.1 Route Map

```
/dashboard/admin/users          — User list page (SSR + client interactivity)
```

All admin routes are nested under `/dashboard/admin/` and protected by SUPER_ADMIN role check.

### 2.2 Layout Hierarchy

```
app/
└── dashboard/
    └── layout.tsx                  # Dashboard layout (sidebar + content)
    └── admin/
        └── layout.tsx              # Admin layout (role guard wrapper)
        └── users/
            └── page.tsx            # User list page (Server Component)
            └── loading.tsx         # Loading skeleton
            └── error.tsx           # Error boundary
```

### 2.3 Page Descriptions

#### User List Page (`/dashboard/admin/users`)

The primary admin page. Displays a paginated table of all users with inline search and filter controls. Clicking a user row opens the detail slide-over panel.

**Desktop View:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Sidebar (240px)  │  Admin > User Management                    │
│                   │                                              │
│  Dashboard        │  ┌──────────────────────┐ ┌──────┐          │
│  ...              │  │ Search users...       │ │+ New │          │
│  ─────────        │  └──────────────────────┘ └──────┘          │
│  Admin            │  [Role: All ▾] [Status: All ▾]              │
│    Users  ◀       │                                              │
│                   │  ┌─────┬──────────┬──────┬──────┬─────┬───┐ │
│                   │  │Name │Email     │Role  │Status│Date │ ... │ │
│                   │  ├─────┼──────────┼──────┼──────┼─────┼───┤ │
│                   │  │John │john@...  │BUYER │ ACTV │03/10│ ... │ │
│                   │  │Jane │jane@...  │SELLER│ ACTV │03/08│ ... │ │
│                   │  │...  │...       │...   │...   │...  │...│ │
│                   │  └─────┴──────────┴──────┴──────┴─────┴───┘ │
│                   │                                              │
│                   │  ◀ 1 2 3 ... 8 ▶    Showing 1-20 of 150     │
└───────────────────┴──────────────────────────────────────────────┘
```

**Mobile View (Card Layout):**
```
┌─────────────────────────────┐
│ ☰  Admin > Users    [+ New] │
├─────────────────────────────┤
│ [Search users...          ] │
│ [Role ▾] [Status ▾]        │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ John Doe                │ │
│ │ john@example.com        │ │
│ │ BUYER      Active       │ │
│ │ Joined: 2026-03-10      │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Jane Smith              │ │
│ │ jane@example.com        │ │
│ │ SELLER     Active       │ │
│ │ Joined: 2026-03-08      │ │
│ └─────────────────────────┘ │
│                             │
│ ◀ Page 1 of 8 ▶            │
└─────────────────────────────┘
```

#### User Detail Panel (Slide-over)

Opens from the right side when a user row/card is clicked. Displays full user information and action buttons.

```
┌──────────────────────────────┐
│  X  User Detail              │
├──────────────────────────────┤
│                              │
│  [Avatar]                    │
│  John Doe                    │
│  john@example.com            │
│                              │
│  ── Details ──               │
│  Nickname:    johndoe        │
│  Role:        BUYER          │
│  Status:      Active         │
│  Email:       Verified       │
│  Registered:  2026-03-10     │
│  Last Login:  2026-03-16     │
│                              │
│  ── Social Accounts ──       │
│  Google: john@gmail.com      │
│                              │
│  ── Actions ──               │
│  [Change Role ▾]  [Suspend]  │
│                              │
└──────────────────────────────┘
```

#### Create User Modal

Modal dialog for creating a new user (SELLER or BUYER).

```
┌──────────────────────────────┐
│  Create New User         X   │
├──────────────────────────────┤
│                              │
│  Email *                     │
│  [                        ]  │
│                              │
│  Password *                  │
│  [                        ]  │
│                              │
│  Name *                      │
│  [                        ]  │
│                              │
│  Role *                      │
│  [SELLER ▾]                  │
│                              │
│  ┌────────┐  ┌────────────┐  │
│  │ Cancel │  │ Create User│  │
│  └────────┘  └────────────┘  │
└──────────────────────────────┘
```

---

## 3. Component Design

### 3.1 Component Tree

```
app/dashboard/admin/users/page.tsx (Server Component)
└── AdminUsersPageClient (Client Component — handles interactivity)
    ├── AdminUserFilters
    │   ├── SearchInput (debounced search)
    │   ├── RoleFilter (dropdown: All / SUPER_ADMIN / SELLER / BUYER)
    │   └── StatusFilter (dropdown: All / ACTV / SUSP)
    ├── CreateUserButton → AdminCreateUserModal
    │   └── CreateUserForm (React Hook Form + Zod)
    ├── AdminUserTable (desktop/tablet)
    │   └── AdminUserRow (per row, clickable)
    │       ├── RoleBadge
    │       └── StatusBadge
    ├── AdminUserCardList (mobile)
    │   └── AdminUserCard (per card, clickable)
    │       ├── RoleBadge
    │       └── StatusBadge
    ├── Pagination
    ├── AdminUserDetail (slide-over panel)
    │   ├── UserProfileSection
    │   ├── UserSocialAccounts
    │   └── UserActions
    │       ├── ChangeRoleAction → ConfirmActionModal
    │       └── ChangeStatusAction → ConfirmActionModal
    └── ConfirmActionModal (reusable confirmation dialog)
```

### 3.2 Component Specifications

#### AdminUsersPageClient

| Property | Detail |
|----------|--------|
| Type | Client Component (`"use client"`) |
| Purpose | Orchestrates all user management interactions |
| State | `searchParams` (URL-driven), `selectedUserId`, `isCreateModalOpen`, `isDetailOpen` |
| Data | Receives initial data from Server Component parent via props |

#### AdminUserFilters

| Property | Detail |
|----------|--------|
| Props | `onSearch(query)`, `onRoleChange(role)`, `onStatusChange(status)`, `currentFilters` |
| Search | Debounced (300ms) text input, updates URL search params |
| Filters | Dropdown selects that update URL search params |
| URL Sync | All filter state stored in URL (`?search=keyword&role=SELLER&status=ACTV&page=1`) |

#### AdminUserTable

| Property | Detail |
|----------|--------|
| Props | `users[]`, `onSelectUser(id)`, `isLoading` |
| Columns | Name, Email, Role (badge), Status (badge), Registered, Actions |
| Responsive | Hidden on mobile (`hidden md:table`), tablet hides Registered column |
| Loading | Skeleton rows (8 rows) when `isLoading` |
| Empty | "No users found" with illustration when list is empty |
| Sort | Column header click for Name, Email, Registered (visual indicator) |

#### AdminUserCardList

| Property | Detail |
|----------|--------|
| Props | `users[]`, `onSelectUser(id)` |
| Responsive | Visible only on mobile (`md:hidden`) |
| Layout | Stacked cards with user summary |

#### RoleBadge

| Property | Detail |
|----------|--------|
| Props | `role: string` |
| Colors | `SUPER_ADMIN` = `--color-secondary-500` (purple) bg + white text |
| | `SELLER` = `--color-primary-500` (blue) bg + white text |
| | `BUYER` = `--color-success` (green) bg + white text |
| Style | Rounded pill (`--radius-full`), font `--font-size-xs`, `--font-weight-medium` |

#### StatusBadge

| Property | Detail |
|----------|--------|
| Props | `status: string` |
| Colors | `ACTV` = `--color-success` (green) dot + text |
| | `SUSP` = `--color-error` (red) dot + text |
| | `INAC` = `--color-gray-400` (gray) dot + text |
| Style | Dot indicator (8px circle) + label text |

#### AdminUserDetail

| Property | Detail |
|----------|--------|
| Props | `userId: string`, `isOpen: boolean`, `onClose()` |
| Type | Slide-over panel from right (480px width on desktop, full-width on mobile) |
| Data | Fetches user detail via `GET /api/admin/users/:id` on open |
| Sections | Profile info, social accounts list, action buttons |
| Transition | Slide-in from right with backdrop overlay (`--transition-normal`) |
| Z-Index | `--z-modal` for panel, `--z-modal-backdrop` for overlay |

#### AdminCreateUserModal

| Property | Detail |
|----------|--------|
| Props | `isOpen: boolean`, `onClose()`, `onSuccess()` |
| Form | React Hook Form with Zod schema validation |
| Fields | email (required), password (required), name (required), role (required, select: SELLER/BUYER) |
| Submit | `POST /api/admin/users` |
| On Success | Close modal, show success toast, refresh user list |
| On Error | Display inline field errors or toast for server errors |

#### ConfirmActionModal

| Property | Detail |
|----------|--------|
| Props | `isOpen`, `onClose()`, `onConfirm()`, `title`, `message`, `confirmText`, `variant: 'danger' | 'warning'` |
| Purpose | Reusable confirmation for destructive/significant actions |
| Variants | `danger` = red confirm button (suspend), `warning` = yellow confirm button (role change) |
| Content | Clear description of the action and its consequences |

---

## 4. Data Flow

### 4.1 Initial Page Load (Server Component)

```
Browser Request → Next.js Server
    → /dashboard/admin/users?page=1&limit=20
    → Server Component reads cookies (JWT token)
    → fetch('http://localhost:4000/api/admin/users?page=1&limit=20', {
        headers: { Authorization: 'Bearer {token}' }
      })
    → Render HTML with initial data
    → Hydrate AdminUsersPageClient with data as props
```

### 4.2 Client-Side Filter/Search/Pagination

```
User types in search / changes filter / clicks page
    → Update URL search params (useRouter.push with shallow)
    → useEffect detects param change
    → Client-side fetch to /api/admin/users with updated params
    → Update local state with response
    → Re-render table/cards
```

### 4.3 Create User Flow

```
User clicks "+ New User"
    → AdminCreateUserModal opens
    → User fills form, submits
    → POST /api/admin/users (client-side fetch with JWT)
    → On 201: close modal, toast "User created successfully", refresh list
    → On 400/409: show inline validation errors
    → On 401/403: redirect to login / show unauthorized toast
```

### 4.4 Role Change Flow

```
User opens detail panel → clicks "Change Role"
    → Role dropdown appears (SELLER / BUYER)
    → User selects new role
    → ConfirmActionModal opens:
        "Change role from BUYER to SELLER?"
        "This will affect the user's access permissions."
    → User confirms
    → PATCH /api/admin/users/:id/role { role: 'SELLER' }
    → On 200: update detail panel, toast "Role updated", refresh list row
    → On error: toast error message
```

### 4.5 Status Change Flow

```
User opens detail panel → clicks "Suspend" or "Activate"
    → ConfirmActionModal opens:
        Suspend: "Suspend this user?"
                 "The user will be logged out immediately and unable to sign in."
        Activate: "Reactivate this user?"
                  "The user will be able to sign in again."
    → User confirms
    → PATCH /api/admin/users/:id/status { status: 'SUSP' | 'ACTV' }
    → On 200: update detail panel + badge, toast message, refresh list row
    → On error: toast error message
```

### 4.6 Optimistic UI Updates

For role and status changes, apply optimistic updates:
1. Immediately update the UI with the expected new value
2. Send the API request in the background
3. On success: keep the optimistic update, show success toast
4. On failure: revert to the previous value, show error toast

---

## 5. UI/UX Design

### 5.1 Design Token Usage

| Element | Token |
|---------|-------|
| Page background | `--color-surface` (#f9fafb) |
| Table background | `--color-background` (#ffffff) |
| Table border | `--color-border` (#e5e7eb) |
| Table header text | `--color-gray-600` |
| Table body text | `--color-gray-800` |
| Page title | `--font-size-2xl`, `--font-weight-bold` |
| Table header | `--font-size-xs`, `--font-weight-semibold`, uppercase |
| Table body | `--font-size-sm`, `--font-weight-regular` |
| Card shadow | `--shadow-sm` (default), `--shadow-md` (hover) |
| Slide-over shadow | `--shadow-xl` |
| Modal backdrop | `--z-modal-backdrop`, bg black/50 |
| Button padding | `--spacing-2` vertical, `--spacing-4` horizontal |
| Table cell padding | `--spacing-3` vertical, `--spacing-4` horizontal |
| Search input height | 40px (2.5rem) |
| Row hover | `--color-gray-50` |

### 5.2 Responsive Behavior

| Breakpoint | Layout | Details |
|------------|--------|---------|
| Desktop (1024px+) | Full table | All columns visible. Sidebar 240px + content. Slide-over 480px. |
| Tablet (768-1023px) | Simplified table | Hide "Registered" and "Last Login" columns. Slide-over full width. |
| Mobile (~767px) | Card layout | Table hidden, card list shown. Modals full-screen. No sidebar (hamburger menu). |

### 5.3 Table Columns

| Column | Desktop | Tablet | Mobile (Card) |
|--------|---------|--------|---------------|
| Name (+ avatar) | Visible | Visible | Visible (card title) |
| Email | Visible | Visible | Visible (card subtitle) |
| Role | Visible (badge) | Visible (badge) | Visible (badge) |
| Status | Visible (badge) | Visible (badge) | Visible (badge) |
| Registered | Visible | Hidden | Visible (card footer) |
| Actions (kebab menu) | Visible | Visible | Hidden (tap card to open detail) |

### 5.4 Badge Design

**Role Badges:**
| Role | Background | Text | Border |
|------|-----------|------|--------|
| SUPER_ADMIN | `--color-secondary-100` (#ede9fe) | `--color-secondary-700` (#6d28d9) | none |
| SELLER | `--color-primary-100` (#dbeafe) | `--color-primary-700` (#1d4ed8) | none |
| BUYER | green-100 (#dcfce7) | green-700 (#15803d) | none |

**Status Badges:**
| Status | Dot Color | Text Color | Label |
|--------|----------|-----------|-------|
| ACTV | `--color-success` (#22c55e) | `--color-gray-700` | Active |
| SUSP | `--color-error` (#ef4444) | `--color-gray-700` | Suspended |
| INAC | `--color-gray-400` (#9ca3af) | `--color-gray-500` | Inactive |

### 5.5 Empty & Loading States

**Loading (Skeleton):**
- Table: 8 skeleton rows with animated pulse on each cell
- Cards: 4 skeleton cards with pulse animation
- Detail panel: skeleton blocks for each field

**Empty State:**
- Icon: `Users` icon (Lucide) in `--color-gray-300`, 48px
- Title: "No users found" in `--font-size-lg`, `--color-gray-500`
- Subtitle: "Try adjusting your search or filter criteria" in `--font-size-sm`, `--color-gray-400`

**Error State:**
- Icon: `AlertCircle` icon (Lucide) in `--color-error`, 48px
- Title: "Failed to load users"
- Action: "Try again" button

---

## 6. Role-Based Navigation

### 6.1 Dashboard Sidebar

The dashboard sidebar renders navigation items conditionally based on the user's role from auth context.

```typescript
// Sidebar navigation structure
const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: Home, roles: ['*'] },
  { label: 'Products', href: '/dashboard/products', icon: Package, roles: ['SELLER', 'SUPER_ADMIN'] },
  { label: 'Orders', href: '/dashboard/orders', icon: ShoppingCart, roles: ['*'] },
  // ... other items
];

const adminNavItems = [
  { label: 'Users', href: '/dashboard/admin/users', icon: Users, roles: ['SUPER_ADMIN'] },
];
```

**Visual Separation:**
- Admin section separated by a divider line (`--color-border`)
- "Admin" section label in `--font-size-xs`, `--color-gray-400`, uppercase

### 6.2 AdminNav Component

| Property | Detail |
|----------|--------|
| Placement | Bottom of sidebar, before user profile section |
| Visibility | Only renders when `user.role === 'SUPER_ADMIN'` |
| Active State | Background `--color-primary-50`, text `--color-primary-700`, left border 3px `--color-primary-500` |
| Items | "Users" with Users icon |

---

## 7. Route Protection

### 7.1 Admin Layout Guard

The `/dashboard/admin/layout.tsx` Server Component checks the user's role before rendering children.

```
Request to /dashboard/admin/*
    → Read JWT from cookies (Server Component)
    → Decode token, extract role
    → If role !== 'SUPER_ADMIN':
        → redirect('/dashboard')  (Next.js redirect, returns 307)
    → If role === 'SUPER_ADMIN':
        → Render children
```

### 7.2 Client-Side Guard

As a secondary protection layer, the client-side auth context also checks the role:

```typescript
// app/dashboard/admin/layout.tsx (Server Component)
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth-server';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
```

### 7.3 Middleware Protection

Add admin route check to existing Next.js middleware:

```typescript
// middleware.ts — add to existing matcher
export function middleware(request: NextRequest) {
  // ... existing auth logic ...

  // Admin route protection
  if (request.nextUrl.pathname.startsWith('/dashboard/admin')) {
    const token = request.cookies.get('accessToken');
    if (!token) return NextResponse.redirect(new URL('/auth/login', request.url));

    const payload = decodeJwt(token.value);
    if (payload.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
}
```

---

## 8. Security

### 8.1 Authentication

| Measure | Implementation |
|---------|---------------|
| JWT token | Sent via `Authorization: Bearer` header on all admin API calls |
| Token refresh | Auto-refresh when 401 received (existing auth interceptor) |
| Cookie storage | `httpOnly`, `secure`, `sameSite: strict` for tokens |
| Session check | Server Component reads token from cookies on initial load |

### 8.2 Authorization

| Measure | Implementation |
|---------|---------------|
| Server-side role check | Admin layout Server Component validates role before render |
| Middleware role check | Next.js middleware redirects non-admin users |
| Client-side role check | Auth context hides admin nav items for non-admin |
| API-level enforcement | Backend RolesGuard rejects non-SUPER_ADMIN (403) |

### 8.3 CSRF Protection

| Measure | Implementation |
|---------|---------------|
| SameSite cookies | `sameSite: strict` prevents cross-origin cookie sending |
| Origin header check | Backend validates Origin/Referer header on mutations |
| Server Actions | Next.js Server Actions include automatic CSRF tokens |

### 8.4 Input Validation

| Field | Client-Side (Zod) | Server-Side (class-validator) |
|-------|-------------------|-------------------------------|
| Email | `z.string().email().max(100)` | `@IsEmail()`, `@MaxLength(100)` |
| Password | `z.string().min(8).regex(strengthPattern)` | Custom validator (strength rules) |
| Name | `z.string().min(1).max(50)` | `@IsNotEmpty()`, `@MaxLength(50)` |
| Role | `z.enum(['SELLER', 'BUYER'])` | `@IsIn(['SELLER', 'BUYER'])` |
| Status | `z.enum(['ACTV', 'SUSP'])` | `@IsIn(['ACTV', 'SUSP'])` |

### 8.5 XSS Prevention

- All user input rendered via React JSX (auto-escaped by default)
- No direct HTML injection — all content goes through React's virtual DOM
- Search query parameter sanitized before display
- Content Security Policy headers applied

---

## 9. Error Handling

### 9.1 API Error Handling

All API calls use a shared `adminFetch` wrapper that handles common error patterns:

```typescript
async function adminFetch<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const token = getAccessToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });

  if (res.status === 401) {
    // Attempt token refresh, retry once
    const refreshed = await refreshToken();
    if (!refreshed) {
      redirect('/auth/login');
    }
    return adminFetch(url, options); // retry
  }

  if (res.status === 403) {
    toast.error('You do not have permission to perform this action');
    redirect('/dashboard');
  }

  const data = await res.json();
  if (!data.success) {
    throw new ApiError(data.error, data.message, res.status);
  }

  return data;
}
```

### 9.2 Error Display Patterns

| Error Type | Display Method |
|------------|---------------|
| Network error | Toast: "Network error. Please check your connection." |
| 401 Unauthorized | Redirect to login page |
| 403 Forbidden | Redirect to dashboard + toast |
| 404 Not Found | Toast: "User not found" + close detail panel |
| 409 Conflict | Inline field error: "Email already exists" |
| 400 Validation | Inline field errors mapped from API response |
| 429 Rate Limited | Toast: "Too many requests. Please wait." |
| 500+ Server Error | Toast: "Something went wrong. Please try again." |

### 9.3 Toast Notifications

| Action | Success Message | Error Message |
|--------|----------------|---------------|
| Create user | "User created successfully" | "Failed to create user: {reason}" |
| Change role | "Role changed to {role}" | "Failed to change role: {reason}" |
| Suspend user | "User has been suspended" | "Failed to suspend user: {reason}" |
| Activate user | "User has been reactivated" | "Failed to activate user: {reason}" |

### 9.4 Loading States

| Component | Loading Indicator |
|-----------|------------------|
| User list (initial) | `loading.tsx` skeleton (full page) |
| User list (filter change) | Table opacity reduced (0.6) + spinner overlay |
| User detail panel | Skeleton blocks for each field |
| Create user submit | Button disabled + spinner icon |
| Role/status change | Button disabled + spinner, optimistic badge update |

---

## 10. File Structure

```
client/src/
├── app/
│   └── dashboard/
│       └── admin/
│           ├── layout.tsx                          # Admin route guard (Server Component)
│           └── users/
│               ├── page.tsx                        # User list page (Server Component)
│               ├── loading.tsx                     # Loading skeleton
│               └── error.tsx                       # Error boundary
├── components/
│   └── admin/
│       ├── admin-users-page-client.tsx             # Main client orchestrator
│       ├── admin-user-filters.tsx                  # Search + role/status filters
│       ├── admin-user-table.tsx                    # Desktop/tablet table view
│       ├── admin-user-card-list.tsx                # Mobile card view
│       ├── admin-user-detail.tsx                   # Slide-over detail panel
│       ├── admin-create-user-modal.tsx             # Create user form modal
│       ├── confirm-action-modal.tsx                # Reusable confirmation dialog
│       ├── role-badge.tsx                          # Color-coded role badge
│       ├── status-badge.tsx                        # Status indicator badge
│       └── pagination.tsx                          # Pagination controls
├── lib/
│   ├── admin-api.ts                               # Admin API fetch wrapper
│   └── admin-types.ts                             # TypeScript types for admin
└── hooks/
    └── use-admin-users.ts                         # Custom hook for user list state
```

---

## 11. TypeScript Types

```typescript
// lib/admin-types.ts

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  nickname: string | null;
  role: 'SUPER_ADMIN' | 'SELLER' | 'BUYER';
  status: 'ACTV' | 'INAC' | 'SUSP';
  emailVerified: boolean;
  profileImageUrl: string | null;
  registeredAt: string;
  lastLoginAt: string | null;
}

export interface AdminUserDetail extends AdminUser {
  socialAccounts: SocialAccountInfo[];
}

export interface SocialAccountInfo {
  provider: 'GOOGLE' | 'KAKAO' | 'NAVER';
  email: string | null;
  linkedAt: string;
}

export interface UserListParams {
  page: number;
  limit: number;
  search?: string;
  role?: 'SUPER_ADMIN' | 'SELLER' | 'BUYER';
  status?: 'ACTV' | 'INAC' | 'SUSP';
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UserListResponse {
  users: AdminUser[];
  pagination: PaginationInfo;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role: 'SELLER' | 'BUYER';
}

export interface UpdateRoleInput {
  role: 'SELLER' | 'BUYER';
}

export interface UpdateStatusInput {
  status: 'ACTV' | 'SUSP';
}
```

---

## 12. Non-Functional Requirements

| Requirement | Target |
|------------|--------|
| Initial page load (SSR) | < 1s (p95) |
| Filter/search response | < 500ms (p95) |
| Detail panel open | < 300ms (p95) |
| Modal open/close animation | 250ms (`--transition-normal`) |
| Slide-over animation | 250ms (`--transition-normal`) |
| Search debounce | 300ms |
| Pagination limit options | 10, 20, 50, 100 |
| Default page size | 20 |
| Lighthouse accessibility score | 90+ |
| Keyboard navigation | Full tab order through table, modals trap focus |

---

## 13. Accessibility

| Feature | Implementation |
|---------|---------------|
| Table semantics | `<table>`, `<thead>`, `<tbody>`, `<th scope="col">` |
| Row interaction | `role="button"`, `tabIndex={0}`, `onKeyDown` for Enter/Space |
| Modal focus trap | Focus trapped within modal when open, restored on close |
| Slide-over | `role="dialog"`, `aria-labelledby`, `aria-modal="true"` |
| Badges | `aria-label` with full text (e.g., "Role: Seller", "Status: Active") |
| Loading | `aria-busy="true"`, `aria-live="polite"` on table body |
| Empty state | `role="status"` for screen reader announcement |
| Color contrast | All badge text meets WCAG 2.1 AA (4.5:1 ratio minimum) |
| Escape key | Closes modal/slide-over |
| Skip links | "Skip to main content" on admin layout |

---

## 14. Testing Strategy

### 14.1 Unit Tests

| Target | Test Cases |
|--------|-----------|
| RoleBadge | Renders correct color for each role, correct label text |
| StatusBadge | Renders correct color/dot for each status |
| AdminUserFilters | Search debounce behavior, filter dropdown changes, URL param sync |
| Pagination | Page navigation, boundary conditions (first/last page), page size change |
| ConfirmActionModal | Opens/closes, calls onConfirm, danger/warning variants |
| CreateUserForm | Zod validation (invalid email, weak password, missing fields), submit handler |
| adminFetch | 401 retry logic, 403 redirect, error parsing |

### 14.2 Integration Tests

| Flow | Test Cases |
|------|-----------|
| Page load | Server Component fetches users, renders table, pagination correct |
| Search | Type query → debounce → API call → table updates |
| Filter | Select role → API call with role param → table updates |
| Create user | Open modal → fill form → submit → success toast → list refreshed |
| View detail | Click row → slide-over opens → detail data displayed |
| Change role | Open detail → change role → confirm → API call → badge updated |
| Suspend user | Open detail → suspend → confirm → API call → status badge updated |
| Route guard | Non-admin access /dashboard/admin/users → redirected to /dashboard |
| Empty state | No users match filter → empty state displayed |
| Error state | API returns 500 → error boundary displayed with retry |

### 14.3 E2E Tests

| Scenario | Steps |
|----------|-------|
| Full CRUD cycle | Login as admin → view list → create seller → search for seller → change role → suspend → activate |
| Responsive | Verify table on desktop, card layout on mobile viewport |
| Role guard | Login as BUYER → navigate to admin URL → verify redirect |
| Pagination | Navigate through multiple pages, verify data changes |

---

## 15. Implementation Sequence

| Step | Task | Dependencies |
|------|------|-------------|
| 1 | Create TypeScript types (`admin-types.ts`) | None |
| 2 | Create admin API wrapper (`admin-api.ts`) | Step 1 |
| 3 | Create shared UI components (RoleBadge, StatusBadge, Pagination, ConfirmActionModal) | None |
| 4 | Create admin layout with route guard (`admin/layout.tsx`) | Auth module |
| 5 | Create user list page Server Component + loading/error states | Steps 1-4 |
| 6 | Create AdminUserFilters (search + dropdowns + URL sync) | Step 2 |
| 7 | Create AdminUserTable (desktop/tablet) + AdminUserCardList (mobile) | Steps 2, 3 |
| 8 | Create AdminUsersPageClient (orchestrator with state management) | Steps 5-7 |
| 9 | Create AdminUserDetail slide-over panel | Steps 2, 3 |
| 10 | Create AdminCreateUserModal with form validation | Steps 2, 3 |
| 11 | Implement role change flow with confirmation | Steps 2, 3, 9 |
| 12 | Implement status change flow with confirmation | Steps 2, 3, 9 |
| 13 | Add admin section to dashboard sidebar (AdminNav) | Auth context |
| 14 | Add admin route to Next.js middleware | Existing middleware |
| 15 | Write unit tests | Steps 1-14 |
| 16 | Write integration tests | Steps 1-14 |
| 17 | Write E2E tests | Steps 1-14 |
| 18 | Run all tests + generate report | Steps 15-17 |
