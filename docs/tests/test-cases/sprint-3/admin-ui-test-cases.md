# Admin User Management UI Test Cases

## Overview
- **Feature**: Admin User Management UI (003-admin-ui)
- **Sprint**: Sprint 3
- **Tech Stack**: Next.js 15 (App Router, Server Components), React, TypeScript, Tailwind CSS, React Hook Form + Zod, Sonner (toast)
- **Route**: `/dashboard/admin/users`
- **Blueprint**: `docs/blueprints/003-admin-ui/blueprint.md`
- **Backend API Reference**: `docs/tests/test-cases/sprint-2/rbac-e2e-scenarios.md`
- **DB Schema**: `docs/database/database-design.md` (TB_COMM_USER, TC_COMM_CD)
- **API Endpoints**: `GET /api/admin/users`, `POST /api/admin/users`, `GET /api/admin/users/:id`, `PATCH /api/admin/users/:id/role`, `PATCH /api/admin/users/:id/status`

---

## 1. Unit Tests (Component-Level)

### TC-U-070: AdminUserTable renders user list with correct columns

- **Priority**: High
- **Component**: `AdminUserTable`
- **Preconditions**: Component rendered with a mock `users[]` array containing 3 users (SUPER_ADMIN, SELLER, BUYER) and `isLoading = false`.

**Given** AdminUserTable is rendered with a list of 3 users
**When** the component mounts
**Then**
- A `<table>` element is present in the DOM
- Table headers include: "Name", "Email", "Role", "Status", "Registered", "Actions"
- Each `<th>` uses `scope="col"` for accessibility
- 3 data rows are rendered (one per user)
- Each row displays the user's name, email, role badge, status badge, and formatted registration date
- Rows are clickable (`role="button"`, `tabIndex={0}`)
- The table body has `aria-busy="false"`

**Verification**: `render()` + `screen.getByRole('table')`, `getAllByRole('row')`, `getByText()`

---

### TC-U-071: AdminUserFilters updates search/role/status filters

- **Priority**: High
- **Component**: `AdminUserFilters`
- **Preconditions**: Component rendered with `onSearch`, `onRoleChange`, `onStatusChange` callbacks and `currentFilters = { search: '', role: '', status: '' }`.

**Given** AdminUserFilters is rendered with empty initial filters
**When** the user types "john" into the search input
**Then**
- The search input value updates to "john"
- After 300ms debounce, `onSearch("john")` is called exactly once
- Typing additional characters within the debounce window does NOT trigger extra calls

**When** the user selects "SELLER" from the Role dropdown
**Then**
- `onRoleChange("SELLER")` is called
- The dropdown displays "SELLER" as the selected value

**When** the user selects "ACTV" from the Status dropdown
**Then**
- `onStatusChange("ACTV")` is called
- The dropdown displays "Active" as the selected value

**When** the user selects "All" from both dropdowns
**Then**
- `onRoleChange("")` and `onStatusChange("")` are called with empty strings

**Verification**: `render()` + `fireEvent.change()` / `userEvent.type()`, `jest.advanceTimersByTime(300)`, assert callback calls

---

### TC-U-072: RoleBadge displays correct color per role

- **Priority**: Medium
- **Component**: `RoleBadge`
- **Preconditions**: None.

**Given** RoleBadge is rendered with `role="SUPER_ADMIN"`
**When** the component mounts
**Then**
- Badge text is "SUPER_ADMIN"
- Badge has purple background styling (`--color-secondary-100` / `#ede9fe` bg, `--color-secondary-700` / `#6d28d9` text)
- Badge uses rounded pill shape and `--font-size-xs`
- `aria-label` is "Role: Super Admin"

**Given** RoleBadge is rendered with `role="SELLER"`
**When** the component mounts
**Then**
- Badge has blue background styling (`--color-primary-100` / `#dbeafe` bg, `--color-primary-700` / `#1d4ed8` text)
- `aria-label` is "Role: Seller"

**Given** RoleBadge is rendered with `role="BUYER"`
**When** the component mounts
**Then**
- Badge has green background styling (`green-100` / `#dcfce7` bg, `green-700` / `#15803d` text)
- `aria-label` is "Role: Buyer"

**Verification**: `render()` + `getByText()`, check `className` or computed styles via `toHaveClass()` / `toHaveStyle()`

---

### TC-U-073: StatusBadge displays correct color per status

- **Priority**: Medium
- **Component**: `StatusBadge`
- **Preconditions**: None.

**Given** StatusBadge is rendered with `status="ACTV"`
**When** the component mounts
**Then**
- Badge label text is "Active"
- Dot indicator has green color (`--color-success` / `#22c55e`)
- Text color is `--color-gray-700`
- `aria-label` is "Status: Active"

**Given** StatusBadge is rendered with `status="SUSP"`
**When** the component mounts
**Then**
- Badge label text is "Suspended"
- Dot indicator has red color (`--color-error` / `#ef4444`)
- `aria-label` is "Status: Suspended"

**Given** StatusBadge is rendered with `status="INAC"`
**When** the component mounts
**Then**
- Badge label text is "Inactive"
- Dot indicator has gray color (`--color-gray-400` / `#9ca3af`)
- Text color is `--color-gray-500`
- `aria-label` is "Status: Inactive"

**Verification**: `render()` + `getByText()`, check dot element class/style, `getByLabelText()`

---

### TC-U-074: AdminCreateUserModal validates required fields

- **Priority**: Critical
- **Component**: `AdminCreateUserModal`
- **Preconditions**: Modal rendered with `isOpen = true`.

**Given** AdminCreateUserModal is open with all fields empty
**When** the user clicks the "Create User" submit button without filling any fields
**Then**
- Form is NOT submitted (no API call made)
- Inline error messages appear for all required fields:
  - Email: "Email is required"
  - Password: "Password is required"
  - Name: "Name is required"
  - Role: "Role is required" (or role has a default selection)
- The first invalid field receives focus
- Submit button remains enabled (not in loading state)

**When** the user fills only the email field and submits
**Then**
- Error messages appear for password, name, and role (but NOT email)

**Verification**: `render()` + `userEvent.click(submitButton)`, `findByText()` for error messages, `toHaveBeenCalledTimes(0)` on submit handler

---

### TC-U-075: AdminCreateUserModal validates email format and password strength

- **Priority**: Critical
- **Component**: `AdminCreateUserModal`
- **Preconditions**: Modal rendered with `isOpen = true`.

**Given** AdminCreateUserModal is open
**When** the user enters "invalid-email" in the email field and blurs or submits
**Then**
- Inline error: "Invalid email address"

**When** the user enters "valid@example.com" in the email field
**Then**
- No email validation error is displayed

**When** the user enters "short" (less than 8 chars) in the password field and submits
**Then**
- Inline error: password must be at least 8 characters

**When** the user enters "alllowercase1!" (no uppercase) in the password field and submits
**Then**
- Inline error: password must include uppercase, lowercase, number, and special character

**When** the user enters "NoSpecial1" (no special char) in the password field and submits
**Then**
- Inline error: password must include a special character

**When** the user enters "Valid@123" (meets all requirements: 8+ chars, upper, lower, digit, special)
**Then**
- No password validation error is displayed

**Verification**: `render()` + `userEvent.type()` + `userEvent.click(submit)`, `findByText()` for error messages, Zod schema validation via `z.string().email()` and `z.string().min(8).regex()`

---

### TC-U-076: ConfirmActionModal shows correct warning text for suspend vs role change

- **Priority**: High
- **Component**: `ConfirmActionModal`
- **Preconditions**: None.

**Given** ConfirmActionModal is rendered with `variant="danger"`, `title="Suspend this user?"`, `message="The user will be logged out immediately and unable to sign in."`, `confirmText="Suspend"`
**When** the modal is open
**Then**
- Title text "Suspend this user?" is displayed
- Message "The user will be logged out immediately and unable to sign in." is displayed
- Confirm button text is "Suspend"
- Confirm button has danger styling (red background)
- Cancel button is present

**When** the user clicks the confirm button
**Then**
- `onConfirm()` callback is called exactly once

**When** the user clicks the cancel button
**Then**
- `onClose()` callback is called exactly once
- `onConfirm()` is NOT called

**Given** ConfirmActionModal is rendered with `variant="warning"`, `title="Change role from BUYER to SELLER?"`, `message="This will affect the user's access permissions."`, `confirmText="Change Role"`
**When** the modal is open
**Then**
- Title text includes "Change role from BUYER to SELLER?"
- Confirm button text is "Change Role"
- Confirm button has warning styling (yellow background)

**When** the user presses the Escape key
**Then**
- `onClose()` callback is called (modal closes)

**Verification**: `render()` + `getByText()`, `userEvent.click()`, `fireEvent.keyDown(Escape)`, assert callbacks

---

### TC-U-077: AdminUserDetail displays full user information

- **Priority**: High
- **Component**: `AdminUserDetail`
- **Preconditions**: Component rendered with `isOpen = true` and a mock user detail object fetched successfully.

**Given** AdminUserDetail is open with a user who has:
- name: "John Doe", email: "john@example.com", nickname: "johndoe"
- role: "BUYER", status: "ACTV", emailVerified: true
- registeredAt: "2026-03-10T00:00:00Z", lastLoginAt: "2026-03-16T12:00:00Z"
- socialAccounts: [{ provider: "GOOGLE", email: "john@gmail.com", linkedAt: "..." }]

**When** the detail panel renders
**Then**
- User name "John Doe" is displayed
- Email "john@example.com" is displayed
- Nickname "johndoe" is displayed
- RoleBadge shows "BUYER" with green styling
- StatusBadge shows "Active" with green dot
- Email verified indicator shows "Verified"
- Registration date "2026-03-10" is formatted and displayed
- Last login date "2026-03-16" is formatted and displayed
- Social Accounts section shows "Google: john@gmail.com"
- Actions section contains "Change Role" and "Suspend" buttons
- Panel has `role="dialog"`, `aria-labelledby`, and `aria-modal="true"`
- Close button (X) is present

**When** the user clicks the close button
**Then**
- `onClose()` callback is called

**Verification**: `render()` + `getByText()`, `getByRole('dialog')`, `getByLabelText()`

---

### TC-U-078: Pagination component calculates correct page numbers

- **Priority**: Medium
- **Component**: `Pagination`
- **Preconditions**: None.

**Given** Pagination is rendered with `page=1`, `totalPages=8`, `limit=20`, `total=150`
**When** the component mounts
**Then**
- "Showing 1-20 of 150" text is displayed
- Previous button is disabled (first page)
- Next button is enabled
- Page numbers 1, 2, 3, ..., 8 are visible (with ellipsis for truncation if applicable)
- Page 1 is highlighted as active

**Given** Pagination is rendered with `page=4`, `totalPages=8`
**When** the component mounts
**Then**
- Previous and Next buttons are both enabled
- Page 4 is highlighted as active
- "Showing 61-80 of 150" text is displayed

**When** the user clicks page number 5
**Then**
- `onPageChange(5)` callback is called

**Given** Pagination is rendered with `page=8`, `totalPages=8`
**When** the component mounts
**Then**
- Next button is disabled (last page)
- Previous button is enabled
- "Showing 141-150 of 150" text is displayed

**Given** Pagination is rendered with `page=1`, `totalPages=1`, `total=5`
**When** the component mounts
**Then**
- Both Previous and Next buttons are disabled
- Only page 1 is shown
- "Showing 1-5 of 5" text is displayed

**Verification**: `render()` + `getByText()`, `getByRole('button')`, check `disabled` attribute, `userEvent.click()`

---

## 2. Integration Tests (Page-Level)

### TC-I-070: User list page loads with data from API (SSR)

- **Priority**: Critical
- **Component**: `/dashboard/admin/users` page (Server Component + Client Component)
- **Preconditions**: SUPER_ADMIN session active. Backend API returns 5 users (1 admin, 3 sellers, 1 buyer) for `GET /api/admin/users?page=1&limit=20`.

**Given** a SUPER_ADMIN user is authenticated and navigates to `/dashboard/admin/users`
**When** the page loads via Server Component SSR
**Then**
- The Server Component fetches `GET /api/admin/users?page=1&limit=20` with the JWT from cookies
- The page title "User Management" is rendered in the HTML
- AdminUserTable displays 5 user rows
- Each row shows name, email, RoleBadge, StatusBadge, and registration date
- Pagination shows "Showing 1-5 of 5"
- Search input is empty
- Role and Status filter dropdowns default to "All"
- No loading skeleton is visible (data is SSR-rendered)

**Verification**: Next.js test utilities or Playwright, inspect rendered HTML, mock fetch at server level

---

### TC-I-071: Search filters users by keyword (debounced)

- **Priority**: High
- **Preconditions**: Page loaded with 5 users. API mock configured to return 1 user when `search=minji`.

**Given** the user list page is loaded with all 5 users displayed
**When** the admin types "minji" in the search input
**Then**
- No API call is made during the first 299ms of typing
- After 300ms debounce, `GET /api/admin/users?search=minji&page=1&limit=20` is called
- Table displays opacity reduction (0.6) while loading
- After response, table shows 1 user matching "minji"
- URL search params update to include `?search=minji`
- Pagination updates to "Showing 1-1 of 1"

**When** the admin clears the search input
**Then**
- After 300ms debounce, `GET /api/admin/users?page=1&limit=20` is called (no search param)
- All 5 users are displayed again

**Verification**: Mock API, `jest.useFakeTimers()`, assert fetch calls and rendered rows

---

### TC-I-072: Role filter shows only selected role users

- **Priority**: High
- **Preconditions**: Page loaded. API mock: `role=SELLER` returns 3 sellers.

**Given** the user list page is loaded with all users
**When** the admin selects "SELLER" from the Role filter dropdown
**Then**
- `GET /api/admin/users?role=SELLER&page=1&limit=20` is called
- Table displays only 3 SELLER users
- All visible RoleBadge components show "SELLER" (blue)
- URL updates to `?role=SELLER`
- Pagination shows "Showing 1-3 of 3"

**When** the admin selects "All" from the Role filter
**Then**
- `GET /api/admin/users?page=1&limit=20` is called (no role param)
- All users are displayed

**Verification**: Mock API, `userEvent.selectOptions()`, assert rendered badges and row count

---

### TC-I-073: Status filter shows only selected status users

- **Priority**: High
- **Preconditions**: Page loaded. API mock: `status=SUSP` returns 1 suspended user.

**Given** the user list page is loaded with all users
**When** the admin selects "Suspended" from the Status filter dropdown
**Then**
- `GET /api/admin/users?status=SUSP&page=1&limit=20` is called
- Table displays only 1 user with StatusBadge "Suspended" (red dot)
- URL updates to `?status=SUSP`

**When** the admin combines Role=SELLER and Status=ACTV filters
**Then**
- `GET /api/admin/users?role=SELLER&status=ACTV&page=1&limit=20` is called
- Only active sellers are displayed
- URL updates to `?role=SELLER&status=ACTV`

**Verification**: Mock API, assert URL params and fetch call arguments

---

### TC-I-074: Pagination navigates between pages correctly

- **Priority**: High
- **Preconditions**: 45 total users. API returns page 1 (20 users), page 2 (20 users), page 3 (5 users).

**Given** the user list page is loaded with page 1 (20 users, totalPages=3)
**When** the admin clicks page 2
**Then**
- `GET /api/admin/users?page=2&limit=20` is called
- Table displays the second set of 20 users
- Pagination highlights page 2
- "Showing 21-40 of 45" is displayed
- URL updates to `?page=2`

**When** the admin clicks the Next button
**Then**
- `GET /api/admin/users?page=3&limit=20` is called
- Table displays 5 users
- "Showing 41-45 of 45" is displayed
- Next button becomes disabled

**When** the admin clicks the Previous button
**Then**
- Navigates back to page 2
- Previous button remains enabled

**Verification**: Mock API, `userEvent.click()`, assert fetch calls and displayed text

---

### TC-I-075: Create user flow (open modal -> fill form -> submit -> user appears in list)

- **Priority**: Critical
- **Preconditions**: Page loaded. API mock: `POST /api/admin/users` returns 201 with new user data.

**Given** the admin is on the user list page
**When** the admin clicks the "+ New" button
**Then**
- AdminCreateUserModal opens (visible in DOM)
- Modal has focus trapped within it
- Email, Password, Name, and Role fields are empty/default

**When** the admin fills the form:
- Email: "newseller@example.com"
- Password: "Seller@123"
- Name: "New Seller"
- Role: "SELLER"
And clicks "Create User"
**Then**
- Submit button shows loading spinner and is disabled
- `POST /api/admin/users` is called with `{ email: "newseller@example.com", password: "Seller@123", name: "New Seller", role: "SELLER" }`
- On 201 response: modal closes
- Success toast "User created successfully" appears (Sonner)
- User list refreshes (`GET /api/admin/users` called again)
- New user "New Seller" appears in the table

**Verification**: Mock API, `userEvent.type()` + `userEvent.click()`, `waitFor()` for toast and list refresh

---

### TC-I-076: Role change flow (click action -> confirm modal -> API call -> badge updates)

- **Priority**: Critical
- **Preconditions**: Page loaded with a BUYER user. Detail panel open for that user. API mock: `PATCH /api/admin/users/:id/role` returns 200.

**Given** the admin has the user detail panel open for a BUYER user
**When** the admin clicks "Change Role" and selects "SELLER"
**Then**
- ConfirmActionModal opens with:
  - Title: "Change role from BUYER to SELLER?"
  - Message: "This will affect the user's access permissions."
  - Confirm button with warning styling (yellow)

**When** the admin clicks "Change Role" in the confirmation modal
**Then**
- RoleBadge optimistically updates to "SELLER" (blue) immediately
- `PATCH /api/admin/users/:id/role` is called with `{ role: "SELLER" }`
- Confirmation modal closes
- On 200 response: success toast "Role changed to SELLER" appears
- The user's RoleBadge in the table list also updates to "SELLER" (blue)

**Verification**: Mock API, `userEvent.click()`, `waitFor()` for badge change and toast

---

### TC-I-077: Suspend user flow (click suspend -> confirm -> API call -> status badge updates)

- **Priority**: Critical
- **Preconditions**: Page loaded with an ACTV user. Detail panel open. API mock: `PATCH /api/admin/users/:id/status` returns 200 with `{ status: 'SUSP' }`.

**Given** the admin has the user detail panel open for an Active user
**When** the admin clicks "Suspend"
**Then**
- ConfirmActionModal opens with:
  - Title: "Suspend this user?"
  - Message: "The user will be logged out immediately and unable to sign in."
  - Confirm button with danger styling (red), text "Suspend"

**When** the admin clicks "Suspend" in the confirmation modal
**Then**
- StatusBadge optimistically updates to "Suspended" (red dot) immediately
- `PATCH /api/admin/users/:id/status` is called with `{ status: "SUSP" }`
- Confirmation modal closes
- On 200 response: success toast "User has been suspended" appears
- The user's StatusBadge in the table list also updates to "Suspended"
- The "Suspend" button in the detail panel changes to "Activate"

**Verification**: Mock API, `userEvent.click()`, `waitFor()` for badge and button text change

---

### TC-I-078: Activate user flow (click activate -> confirm -> status changes to ACTV)

- **Priority**: High
- **Preconditions**: Page loaded with a SUSP user. Detail panel open. API mock: `PATCH /api/admin/users/:id/status` returns 200 with `{ status: 'ACTV' }`.

**Given** the admin has the user detail panel open for a Suspended user
**When** the admin clicks "Activate"
**Then**
- ConfirmActionModal opens with:
  - Title: "Reactivate this user?"
  - Message: "The user will be able to sign in again."
  - Confirm button text "Activate"

**When** the admin clicks "Activate" in the confirmation modal
**Then**
- StatusBadge optimistically updates to "Active" (green dot)
- `PATCH /api/admin/users/:id/status` is called with `{ status: "ACTV" }`
- On 200 response: success toast "User has been reactivated" appears
- The "Activate" button changes back to "Suspend"

**Verification**: Mock API, `userEvent.click()`, `waitFor()` for badge and button text change

---

## 3. Edge Cases

### TC-E-070: Empty user list shows "No users found" message

- **Priority**: Medium
- **Preconditions**: API mock returns `{ users: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }`.

**Given** the API returns an empty user list
**When** the page loads
**Then**
- No table rows are rendered
- Empty state is displayed with:
  - Users icon (Lucide) in gray, 48px
  - Title: "No users found"
  - Subtitle: "Try adjusting your search or filter criteria"
- Empty state element has `role="status"` for screen readers
- Pagination is hidden or shows "Showing 0 of 0"
- Search and filter controls remain interactive

**Verification**: Mock empty API response, `getByText("No users found")`, `getByRole("status")`

---

### TC-E-071: Search with no results shows empty state

- **Priority**: Medium
- **Preconditions**: Page loaded with users. API mock: `search=zzzznonexistent` returns empty array.

**Given** the user list page has users displayed
**When** the admin types "zzzznonexistent" in the search input and waits for debounce
**Then**
- API is called with `?search=zzzznonexistent`
- Table is replaced by the empty state ("No users found")
- Search input retains the typed value "zzzznonexistent"
- Filters remain in their current state

**When** the admin clears the search input
**Then**
- Full user list is restored

**Verification**: Mock API, `userEvent.type()`, `waitFor()` for empty state, then clear and verify list returns

---

### TC-E-072: Create user with duplicate email shows error toast

- **Priority**: High
- **Preconditions**: Modal open. API mock: `POST /api/admin/users` with `admin@astratech.vn` returns 409 `{ success: false, error: "EMAIL_ALREADY_EXISTS", message: "Email already exists" }`.

**Given** the admin opens the create user modal
**When** the admin fills the form with email "admin@astratech.vn" (already exists) and submits
**Then**
- `POST /api/admin/users` is called
- On 409 response: modal remains open (does NOT close)
- Inline error on email field: "Email already exists" OR error toast with "Email already exists"
- Other form fields retain their entered values
- Submit button returns to enabled state

**Verification**: Mock 409 API response, assert modal still visible, `findByText("Email already exists")`

---

### TC-E-073: Rapid filter changes don't cause race conditions

- **Priority**: High
- **Preconditions**: Page loaded. API mock with variable response times.

**Given** the user list page is loaded
**When** the admin rapidly changes filters:
1. Selects Role = "SELLER" (API responds in 500ms)
2. After 100ms, selects Role = "BUYER" (API responds in 200ms)
**Then**
- Both API calls are made: `?role=SELLER` and `?role=BUYER`
- The BUYER response arrives first (200ms), but the table should NOT briefly show BUYER results then flash to SELLER results
- Only the BUYER results (latest request) are displayed in the table
- The SELLER response is discarded (stale request handling via AbortController or request ID comparison)

**Verification**: Mock API with controlled delays, assert final rendered state matches the last filter selection

---

### TC-E-074: Admin cannot suspend themselves (button disabled or error)

- **Priority**: Critical
- **Preconditions**: SUPER_ADMIN logged in. Detail panel open for the admin's own user record.

**Given** the admin opens the detail panel for their own user account
**When** the panel renders
**Then**
- The "Suspend" button is either:
  - Disabled with a tooltip "Cannot suspend your own account", OR
  - Not rendered at all
- If the admin somehow triggers the suspend API for their own ID (e.g., via direct fetch):
  - Backend returns 400 `CANNOT_CHANGE_OWN_STATUS` (per E2E-133)

**Verification**: Render detail with `userId === currentUserId`, assert button is disabled or absent

---

### TC-E-075: Admin cannot change own role (button disabled or error)

- **Priority**: Critical
- **Preconditions**: SUPER_ADMIN logged in. Detail panel open for the admin's own user record.

**Given** the admin opens the detail panel for their own user account
**When** the panel renders
**Then**
- The "Change Role" button/dropdown is either:
  - Disabled with a tooltip "Cannot change your own role", OR
  - Not rendered at all
- If the admin somehow triggers the role change API for their own ID:
  - Backend returns 400 `CANNOT_CHANGE_OWN_ROLE` (per E2E-122)

**Verification**: Render detail with `userId === currentUserId`, assert button is disabled or absent

---

### TC-E-076: Pagination at boundary (first page, last page)

- **Priority**: Medium
- **Preconditions**: 45 total users, 20 per page (3 pages total).

**Given** the admin is on page 1 of the user list
**When** the page loads
**Then**
- Previous button is disabled (`aria-disabled="true"`)
- Clicking Previous does NOT trigger an API call
- Next button is enabled

**Given** the admin is on page 3 (last page)
**When** the page loads
**Then**
- Next button is disabled (`aria-disabled="true"`)
- Clicking Next does NOT trigger an API call
- Previous button is enabled
- "Showing 41-45 of 45" is displayed (not "41-60")

**Given** total=0 (no users)
**When** the page loads
**Then**
- Both Previous and Next are disabled
- No page numbers are shown
- Pagination may be hidden entirely

**Verification**: Render Pagination with boundary props, assert disabled attributes and click behavior

---

## 4. Security Tests

### TC-S-070: Non-admin user accessing /dashboard/admin/users gets redirected

- **Priority**: Critical
- **Preconditions**: BUYER user logged in with valid session.

**Given** a BUYER user is authenticated
**When** the user navigates to `/dashboard/admin/users`
**Then**
- Server Component `AdminLayout` reads JWT from cookies
- JWT role is "BUYER" (not "SUPER_ADMIN")
- `redirect('/dashboard')` is called (Next.js 307 redirect)
- The user lands on `/dashboard` (main dashboard page)
- No admin page content is ever rendered or visible
- The "Admin" section in the sidebar is not visible

**Verification**: Next.js integration test or Playwright, assert redirect and final URL

---

### TC-S-071: SELLER accessing admin page gets redirected to /dashboard

- **Priority**: Critical
- **Preconditions**: SELLER user logged in with valid session.

**Given** a SELLER user is authenticated
**When** the user navigates to `/dashboard/admin/users`
**Then**
- Server Component `AdminLayout` reads JWT from cookies
- JWT role is "SELLER" (not "SUPER_ADMIN")
- `redirect('/dashboard')` is called
- The user lands on `/dashboard`
- The "Admin" section in the sidebar is not visible for SELLER users

**When** the SELLER user directly calls `GET /api/admin/users` via browser fetch
**Then**
- Backend RolesGuard returns 403 Forbidden (per E2E-141)

**Verification**: Next.js integration test or Playwright, assert redirect; separate API test for 403

---

### TC-S-072: Unauthenticated user gets redirected to login

- **Priority**: Critical
- **Preconditions**: No active session (no JWT cookie).

**Given** no user is authenticated (no accessToken cookie)
**When** the user navigates to `/dashboard/admin/users`
**Then**
- Next.js middleware detects no token in cookies
- `redirect('/auth/login')` is called
- The user lands on the login page
- No admin or dashboard content is rendered

**When** the unauthenticated user calls `GET /api/admin/users` directly
**Then**
- Backend returns 401 Unauthorized (per E2E-142)

**Verification**: Playwright or Next.js test, assert redirect to `/auth/login`

---

### TC-S-073: Expired token triggers re-authentication flow

- **Priority**: High
- **Preconditions**: User had a valid session, but the access token has expired. Refresh token may or may not be valid.

**Given** the admin has an expired access token stored in cookies
**When** the page attempts to load `/dashboard/admin/users`
**Then**
- Server Component fetch to `/api/admin/users` returns 401
- Client-side `adminFetch` interceptor attempts token refresh via `POST /api/auth/refresh`
- **If refresh succeeds**: new access token is stored, original API call is retried, page loads normally
- **If refresh fails** (refresh token also expired/revoked): user is redirected to `/auth/login`

**When** the admin is on the page and the token expires mid-session (e.g., during a filter change)
**Then**
- The API call returns 401
- Token refresh is attempted automatically
- On success: the filter request is retried transparently
- On failure: redirect to login with a toast "Session expired. Please log in again."

**Verification**: Mock 401 response + mock refresh endpoint, assert retry logic or redirect

---

## 5. Responsive/UI Tests

### TC-R-070: Desktop viewport (1280px) shows full table layout

- **Priority**: Medium
- **Preconditions**: Page loaded with 5 users.

**Given** the viewport is set to 1280px width (desktop)
**When** the page renders
**Then**
- Sidebar is visible (240px width)
- AdminUserTable (`<table>`) is visible
- AdminUserCardList is hidden (`md:hidden` class)
- All 6 columns are visible: Name, Email, Role, Status, Registered, Actions
- Table cell padding follows `--spacing-3` vertical, `--spacing-4` horizontal
- Row hover effect applies `--color-gray-50` background
- Search input and filters are on the same row as the "+ New" button

**When** a user row is clicked and AdminUserDetail opens
**Then**
- Slide-over panel is 480px wide (from right)
- Backdrop overlay covers the rest of the page
- Panel has `--shadow-xl` shadow

**Verification**: Playwright with viewport 1280x800, visual assertions, `isVisible()` checks

---

### TC-R-071: Tablet viewport (768px) shows simplified table

- **Priority**: Medium
- **Preconditions**: Page loaded with 5 users.

**Given** the viewport is set to 768px width (tablet)
**When** the page renders
**Then**
- AdminUserTable is still visible
- AdminUserCardList is hidden
- "Registered" column is hidden (not in DOM or `display: none`)
- "Actions" column (kebab menu) is still visible
- Remaining columns (Name, Email, Role, Status) are visible
- Table is not horizontally scrollable (fits within viewport)

**When** AdminUserDetail opens
**Then**
- Slide-over panel takes full viewport width (not 480px)

**Verification**: Playwright with viewport 768x1024, assert column visibility

---

### TC-R-072: Mobile viewport (375px) shows card layout instead of table

- **Priority**: Medium
- **Preconditions**: Page loaded with 5 users.

**Given** the viewport is set to 375px width (mobile)
**When** the page renders
**Then**
- AdminUserTable is hidden (`hidden md:table`)
- AdminUserCardList is visible
- 5 user cards are displayed in a stacked layout
- Each card shows: user name (title), email (subtitle), RoleBadge, StatusBadge, registration date (footer)
- No kebab menu (cards are tappable to open detail)
- Sidebar is hidden (hamburger menu present)
- Search input and filters stack vertically

**When** a card is tapped
**Then**
- AdminUserDetail opens as full-screen panel (not 480px slide-over)

**When** the "+ New" button is tapped
**Then**
- AdminCreateUserModal opens as full-screen modal

**Verification**: Playwright with viewport 375x812, assert card visibility, assert table hidden

---

### TC-R-073: Modals are properly centered and scrollable on small screens

- **Priority**: Medium
- **Preconditions**: None.

**Given** the viewport is 375px width (mobile)
**When** AdminCreateUserModal is opened
**Then**
- Modal covers the full screen (or nearly full, with safe margins)
- All form fields are accessible without horizontal scrolling
- If content exceeds viewport height, the modal body is vertically scrollable
- Submit and Cancel buttons remain visible (sticky footer or within scroll)
- Backdrop overlay is present behind the modal

**When** ConfirmActionModal is opened on a 375px viewport
**Then**
- Modal is centered on screen
- Title, message, and buttons are fully visible without horizontal overflow
- Buttons are tappable (adequate touch target size, minimum 44px height)

**When** the user rotates the device to landscape (667x375)
**Then**
- Modals adjust layout and remain usable
- Content does not overflow the viewport

**Verification**: Playwright with mobile viewport, scroll assertions, visual snapshot comparison

---

## Summary

| Category | Test ID Range | Count | Critical | High | Medium |
|----------|--------------|-------|----------|------|--------|
| Unit Tests | TC-U-070 ~ TC-U-078 | 9 | 2 | 4 | 3 |
| Integration Tests | TC-I-070 ~ TC-I-078 | 9 | 3 | 5 | 1 |
| Edge Cases | TC-E-070 ~ TC-E-076 | 7 | 2 | 2 | 3 |
| Security Tests | TC-S-070 ~ TC-S-073 | 4 | 3 | 1 | 0 |
| Responsive/UI Tests | TC-R-070 ~ TC-R-073 | 4 | 0 | 0 | 4 |
| **Total** | | **33** | **10** | **12** | **11** |

### Coverage Matrix

| Component / Area | Unit | Integration | Edge | Security | Responsive |
|-----------------|------|-------------|------|----------|------------|
| AdminUserTable | TC-U-070 | TC-I-070 | TC-E-070 | | TC-R-070, TC-R-071 |
| AdminUserFilters | TC-U-071 | TC-I-071, TC-I-072, TC-I-073 | TC-E-071, TC-E-073 | | |
| RoleBadge | TC-U-072 | TC-I-076 | | | |
| StatusBadge | TC-U-073 | TC-I-077, TC-I-078 | | | |
| AdminCreateUserModal | TC-U-074, TC-U-075 | TC-I-075 | TC-E-072 | | TC-R-073 |
| ConfirmActionModal | TC-U-076 | TC-I-076, TC-I-077 | | | TC-R-073 |
| AdminUserDetail | TC-U-077 | TC-I-076, TC-I-077, TC-I-078 | TC-E-074, TC-E-075 | | TC-R-070, TC-R-072 |
| Pagination | TC-U-078 | TC-I-074 | TC-E-076 | | |
| AdminUserCardList | | | | | TC-R-072 |
| Route Protection | | | | TC-S-070, TC-S-071, TC-S-072 | |
| Auth / Token | | | | TC-S-073 | |

### Backend API Cross-Reference (from RBAC E2E Scenarios)

| UI Test Case | Related Backend E2E Scenario |
|-------------|------------------------------|
| TC-I-075 (Create user) | E2E-100, E2E-101 |
| TC-I-076 (Role change) | E2E-120, E2E-121 |
| TC-I-077 (Suspend user) | E2E-130 |
| TC-I-078 (Activate user) | E2E-132 |
| TC-E-072 (Duplicate email) | E2E-103 |
| TC-E-074 (Suspend self) | E2E-133 |
| TC-E-075 (Change own role) | E2E-122 |
| TC-S-070 (BUYER redirect) | E2E-140 |
| TC-S-071 (SELLER redirect) | E2E-141 |
| TC-S-072 (Unauthenticated) | E2E-142 |
| TC-S-073 (Expired token) | E2E-143 |
