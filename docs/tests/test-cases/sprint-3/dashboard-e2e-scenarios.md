# Dashboard Pages E2E Test Scenarios

## Overview
- **Feature**: Dashboard — Overview, Products, Product Detail, Cart, Board, Chat, Orders, Settings
- **Related Modules**: Auth (route protection), Products, Cart, Board, Chat
- **API Endpoints**: All dashboard pages are frontend-only with mock data (no real API calls except auth)
- **DB Tables**: N/A (mock data)
- **Blueprint**: N/A (frontend-only implementation)

---

## Scenario Group 1: Dashboard Layout & Navigation

### E2E-DB-001: Dashboard layout loads with sidebar
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: User is logged in
- **User Journey**:
  1. Navigate to `http://localhost:3000/dashboard`
  2. Wait for page to render
- **Expected Results**:
  - UI: Sidebar visible with nav items: Overview, Board, Chat, Products, Cart, Orders
  - UI: Settings link at bottom of sidebar
  - UI: User info section in sidebar shows user name and role
  - UI: "Vibe" logo at top of sidebar
  - UI: Main content area shows dashboard overview
- **Verification Method**: snapshot
- **Test Data**: Logged-in user

### E2E-DB-002: Sidebar navigation between pages
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: User is logged in, on dashboard
- **User Journey**:
  1. Click "Board" in sidebar
  2. Verify Board page loads
  3. Click "Chat" in sidebar
  4. Verify Chat page loads
  5. Click "Products" in sidebar
  6. Verify Products page loads
  7. Click "Orders" in sidebar
  8. Verify Orders page loads
  9. Click "Settings" in sidebar
  10. Verify Settings page loads
- **Expected Results**:
  - UI: Each page loads correctly with its own content
  - UI: Active nav item is highlighted in sidebar
  - UI: No full page reload (client-side navigation)
- **Verification Method**: snapshot
- **Test Data**: Logged-in user

### E2E-DB-003: Admin section visible only for SUPER_ADMIN
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: User logged in as SUPER_ADMIN role
- **User Journey**:
  1. Navigate to `/dashboard`
  2. Check sidebar for Admin section
- **Expected Results**:
  - UI: "Admin" section visible in sidebar with "User Management" link
- **Verification Method**: snapshot
- **Test Data**: SUPER_ADMIN user

### E2E-DB-004: Admin section hidden for BUYER role
- **Type**: Edge Case
- **Priority**: High
- **Preconditions**: User logged in as BUYER role
- **User Journey**:
  1. Navigate to `/dashboard`
  2. Check sidebar for Admin section
- **Expected Results**:
  - UI: No "Admin" section visible in sidebar
  - UI: Only standard nav items visible
- **Verification Method**: snapshot
- **Test Data**: BUYER user

### E2E-DB-005: Dashboard redirects unauthenticated user
- **Type**: Error Path
- **Priority**: Critical
- **Preconditions**: No user logged in (no auth tokens)
- **User Journey**:
  1. Navigate directly to `http://localhost:3000/dashboard`
- **Expected Results**:
  - UI: Redirected to homepage or shows loading spinner then redirects
  - UI: Dashboard content is NOT displayed
- **Verification Method**: snapshot / network
- **Test Data**: No auth tokens

### E2E-DB-006: Responsive sidebar — mobile view
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: User logged in
- **User Journey**:
  1. Set viewport to 375x667
  2. Navigate to `/dashboard`
- **Expected Results**:
  - UI: Sidebar collapses or transforms for mobile
  - UI: Content area takes full width
- **Verification Method**: snapshot
- **Test Data**: Logged-in user

---

## Scenario Group 2: Dashboard Overview

### E2E-DB-007: Overview page displays stat cards
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: User logged in, on dashboard overview
- **User Journey**:
  1. Navigate to `/dashboard`
- **Expected Results**:
  - UI: 4 stat cards visible (Total Orders, Active Chats, Wishlist Items, Total Spent)
  - UI: Each card shows a number value and label
  - UI: Cards have fade-up animation
- **Verification Method**: snapshot
- **Test Data**: Mock stat data

### E2E-DB-008: Overview page shows recent orders
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: User logged in
- **User Journey**:
  1. Navigate to `/dashboard`
  2. Scroll to "Recent Orders" section
- **Expected Results**:
  - UI: Table with recent orders showing order number, date, status, total
  - UI: Status badges with color coding
- **Verification Method**: snapshot
- **Test Data**: Mock order data

### E2E-DB-009: Overview page shows recent chats
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: User logged in
- **User Journey**:
  1. Navigate to `/dashboard`
  2. Scroll to "Recent Chats" section
- **Expected Results**:
  - UI: List of recent chat conversations with avatars, names, last messages
- **Verification Method**: snapshot
- **Test Data**: Mock chat data

---

## Scenario Group 3: Products Page

### E2E-DB-010: Products page loads with category filters
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: User logged in
- **User Journey**:
  1. Navigate to `/dashboard/products`
- **Expected Results**:
  - UI: Category filter buttons displayed (All, Ceramics, Textiles, Art Prints, Jewelry, Home Decor, Artisan Foods)
  - UI: Sort dropdown visible
  - UI: Product grid with cards showing image placeholder, name, price, rating
  - UI: "All" category active by default
- **Verification Method**: snapshot
- **Test Data**: 12 mock products

### E2E-DB-011: Filter products by category
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: On products page
- **User Journey**:
  1. Click "Jewelry" category button
- **Expected Results**:
  - UI: Only jewelry products shown
  - UI: "Jewelry" button has active styling
  - UI: Product count updates
- **Verification Method**: snapshot
- **Test Data**: Mock products with JEWELRY category

### E2E-DB-012: Sort products by price
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: On products page
- **User Journey**:
  1. Select "Price: High to Low" from sort dropdown
- **Expected Results**:
  - UI: Products reorder with most expensive first
- **Verification Method**: snapshot
- **Test Data**: Mock products

### E2E-DB-013: Click product card navigates to detail
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: On products page, logged in
- **User Journey**:
  1. Click on "Speckled Ceramic Vase" product card
- **Expected Results**:
  - UI: Navigates to `/dashboard/products/{id}`
  - UI: Product detail page shows name, price, description, add-to-cart button
- **Verification Method**: snapshot
- **Test Data**: Product with known ID

---

## Scenario Group 4: Cart Page

### E2E-DB-014: Empty cart state
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: User logged in, cart is empty
- **User Journey**:
  1. Navigate to `/dashboard/cart`
- **Expected Results**:
  - UI: Empty state message displayed (e.g., "Your cart is empty")
  - UI: "Browse Products" link visible
- **Verification Method**: snapshot
- **Test Data**: Empty cart (clear localStorage)

### E2E-DB-015: Add product to cart and view cart
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: User logged in, cart is empty
- **User Journey**:
  1. Navigate to `/dashboard/products`
  2. Click on a product card
  3. Click "Add to Cart" on product detail page
  4. Navigate to `/dashboard/cart`
- **Expected Results**:
  - UI: Cart shows 1 item with product name, price, quantity = 1
  - UI: Order summary shows subtotal matching product price
  - UI: "Checkout" button visible
- **Verification Method**: snapshot
- **Test Data**: Any mock product

### E2E-DB-016: Increase item quantity in cart
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Cart has 1 item with quantity 1
- **User Journey**:
  1. Navigate to `/dashboard/cart`
  2. Click "+" button to increase quantity
- **Expected Results**:
  - UI: Quantity updates to 2
  - UI: Item subtotal doubles
  - UI: Order summary total updates
- **Verification Method**: snapshot
- **Test Data**: Cart with 1 item

### E2E-DB-017: Decrease item quantity to 0 removes item
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Cart has 1 item with quantity 1
- **User Journey**:
  1. Navigate to `/dashboard/cart`
  2. Click "-" button to decrease quantity
- **Expected Results**:
  - UI: Item removed from cart
  - UI: Empty cart state displayed
- **Verification Method**: snapshot
- **Test Data**: Cart with 1 item at quantity 1

### E2E-DB-018: Cart persists across page navigation
- **Type**: Edge Case
- **Priority**: High
- **Preconditions**: Cart has items
- **User Journey**:
  1. Add items to cart
  2. Navigate to `/dashboard/board`
  3. Navigate back to `/dashboard/cart`
- **Expected Results**:
  - UI: Cart still shows previously added items
  - UI: Quantities unchanged
- **Verification Method**: snapshot
- **Test Data**: Cart with items (localStorage persistence)

### E2E-DB-019: Cart persists after page refresh
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: Cart has items
- **User Journey**:
  1. Add items to cart
  2. Hard refresh the page (F5)
  3. Navigate to `/dashboard/cart`
- **Expected Results**:
  - UI: Cart items restored from localStorage
- **Verification Method**: snapshot
- **Test Data**: Cart with items

---

## Scenario Group 5: Board Page

### E2E-DB-020: Board page loads with posts
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: User logged in
- **User Journey**:
  1. Navigate to `/dashboard/board`
- **Expected Results**:
  - UI: Page title "Community Board" visible
  - UI: Category tabs (All, General, Question, Review, Tips) visible
  - UI: Search bar visible
  - UI: "New Post" button visible
  - UI: Post list with pinned posts first, then regular posts
  - UI: Each post shows title, excerpt, author, date, likes count, comments count
- **Verification Method**: snapshot
- **Test Data**: 8 mock posts

### E2E-DB-021: Filter board posts by category
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: On board page
- **User Journey**:
  1. Click "Question" category tab
- **Expected Results**:
  - UI: Only posts with category "QUESTION" displayed
  - UI: "Question" tab has active styling
- **Verification Method**: snapshot
- **Test Data**: Mock posts with QUESTION category

### E2E-DB-022: Search board posts
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: On board page
- **User Journey**:
  1. Type "ceramic" in search bar
- **Expected Results**:
  - UI: Posts filtered to show only those matching "ceramic" in title or content
- **Verification Method**: snapshot
- **Test Data**: Mock posts

### E2E-DB-023: Open post detail modal
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: On board page
- **User Journey**:
  1. Click on a post card
- **Expected Results**:
  - UI: Detail modal opens with full post content
  - UI: Author info, date, category badge visible
  - UI: Comments section visible
  - UI: Like button visible
  - UI: Modal overlay with backdrop blur
- **Verification Method**: snapshot
- **Test Data**: Mock post with comments

### E2E-DB-024: Close post detail modal
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Post detail modal is open
- **User Journey**:
  1. Click close button (or click overlay)
- **Expected Results**:
  - UI: Modal closes
  - UI: Post list is visible again
- **Verification Method**: snapshot
- **Test Data**: None

### E2E-DB-025: Open compose new post modal
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: On board page
- **User Journey**:
  1. Click "New Post" button
- **Expected Results**:
  - UI: Compose modal opens with title input, category dropdown, content textarea
  - UI: "Post" submit button visible
- **Verification Method**: snapshot
- **Test Data**: None

### E2E-DB-026: Submit new post
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Compose modal open
- **User Journey**:
  1. Fill in title: "My Test Post"
  2. Select category: "General"
  3. Fill in content: "This is test content for the community board."
  4. Click "Post" button
- **Expected Results**:
  - UI: Modal closes
  - UI: New post appears at top of post list
  - UI: Post shows correct title, category, and author
- **Verification Method**: snapshot
- **Test Data**: Form input values

---

## Scenario Group 6: Chat Page

### E2E-DB-027: Chat page loads with room list
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: User logged in
- **User Journey**:
  1. Navigate to `/dashboard/chat`
- **Expected Results**:
  - UI: Room list sidebar visible (340px width on desktop)
  - UI: 6 chat rooms displayed with avatars, names, last messages, timestamps
  - UI: Unread badges visible on rooms with unread messages
  - UI: Search input at top of room list
  - UI: Empty state in chat area ("Select a conversation")
- **Verification Method**: snapshot
- **Test Data**: 6 mock chat rooms

### E2E-DB-028: Select a chat room and view messages
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: On chat page
- **User Journey**:
  1. Click on first chat room (e.g., "Sarah Chen")
- **Expected Results**:
  - UI: Chat area shows conversation header with room name
  - UI: Message bubbles displayed — own messages aligned right (charcoal), other messages aligned left (white)
  - UI: Message input bar visible at bottom
  - UI: Selected room highlighted in room list
- **Verification Method**: snapshot
- **Test Data**: Mock messages for room 1

### E2E-DB-029: Send a message in chat
- **Type**: Happy Path
- **Priority**: Critical
- **Preconditions**: Chat room selected
- **User Journey**:
  1. Select a chat room
  2. Type "Hello, this is a test message" in input
  3. Click send button (or press Enter)
- **Expected Results**:
  - UI: New message bubble appears at bottom of chat (own message, right-aligned, charcoal)
  - UI: Input field clears
  - UI: Chat scrolls to bottom
- **Verification Method**: snapshot
- **Test Data**: Message text

### E2E-DB-030: Search chat rooms
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: On chat page
- **User Journey**:
  1. Type "Sarah" in room search input
- **Expected Results**:
  - UI: Room list filters to show only rooms matching "Sarah"
  - UI: Non-matching rooms hidden
- **Verification Method**: snapshot
- **Test Data**: Search term

### E2E-DB-031: Chat responsive — mobile view
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: User logged in
- **User Journey**:
  1. Set viewport to 375x667
  2. Navigate to `/dashboard/chat`
- **Expected Results**:
  - UI: Room list takes full width
  - UI: Chat area hidden until a room is selected
- **Verification Method**: snapshot
- **Test Data**: None

### E2E-DB-032: Chat responsive — select room on mobile
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Mobile viewport, on chat page
- **User Journey**:
  1. Set viewport to 375x667
  2. Click on a chat room
- **Expected Results**:
  - UI: Room list hides
  - UI: Chat area takes full width with messages
  - UI: Back button appears in chat header
- **Verification Method**: snapshot
- **Test Data**: None

### E2E-DB-033: Chat room with no messages
- **Type**: Edge Case
- **Priority**: Low
- **Preconditions**: On chat page
- **User Journey**:
  1. Click on a room that has no messages (rooms 3, 5, 6 in mock data)
- **Expected Results**:
  - UI: Chat area shows empty state or just the input bar
  - UI: No errors in console
- **Verification Method**: snapshot / console
- **Test Data**: Room without messages

---

## Scenario Group 7: Orders Page

### E2E-DB-034: Orders page loads with order list
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: User logged in
- **User Journey**:
  1. Navigate to `/dashboard/orders`
- **Expected Results**:
  - UI: "My Orders" title visible
  - UI: Status filter tabs: All, Pending, Confirmed, Shipped, Delivered, Cancelled
  - UI: "All" tab active by default
  - UI: 5 order cards displayed with order numbers, dates, status badges, items, totals
  - UI: Order cards have fade-up animation with staggered delays
- **Verification Method**: snapshot
- **Test Data**: 5 mock orders

### E2E-DB-035: Filter orders by status
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: On orders page
- **User Journey**:
  1. Click "Delivered" status tab
- **Expected Results**:
  - UI: Only orders with DELIVERED status shown (2 orders)
  - UI: "Delivered" tab has active styling
  - UI: Subtitle updates to show "2 orders"
- **Verification Method**: snapshot
- **Test Data**: Mock orders

### E2E-DB-036: Filter orders — empty result
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: On orders page
- **User Journey**:
  1. Click "Confirmed" status tab
- **Expected Results**:
  - UI: Empty state shown — "No orders found" with package icon
  - UI: "Orders matching this filter will appear here." message
- **Verification Method**: snapshot
- **Test Data**: No CONFIRMED orders in mock data

### E2E-DB-037: Open order detail modal
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: On orders page
- **User Journey**:
  1. Click on the first order card (SHIPPED order)
- **Expected Results**:
  - UI: Order detail modal opens with backdrop blur
  - UI: Modal shows: order number, status badge, order date
  - UI: Progress bar with 4 steps (Pending, Confirmed, Shipped, Delivered) — Shipped step highlighted
  - UI: Items list with emoji, name, quantity, price
  - UI: Summary section with tracking number, estimated delivery, total
  - UI: "Contact Seller" button visible
- **Verification Method**: snapshot
- **Test Data**: SHIPPED mock order with tracking number

### E2E-DB-038: Order detail modal — PENDING order shows cancel button
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: On orders page
- **User Journey**:
  1. Click on the PENDING order card
- **Expected Results**:
  - UI: Modal shows "Cancel Order" button (red outline)
  - UI: Progress bar shows Pending step as current
- **Verification Method**: snapshot
- **Test Data**: PENDING mock order

### E2E-DB-039: Order detail modal — DELIVERED order shows reorder button
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: On orders page
- **User Journey**:
  1. Click on a DELIVERED order card
- **Expected Results**:
  - UI: Modal shows "Reorder" button (charcoal/primary)
  - UI: Progress bar fully completed (all 4 dots filled)
- **Verification Method**: snapshot
- **Test Data**: DELIVERED mock order

### E2E-DB-040: Order detail modal — CANCELLED order hides progress bar
- **Type**: Edge Case
- **Priority**: Medium
- **Preconditions**: On orders page
- **User Journey**:
  1. Click on the CANCELLED order card
- **Expected Results**:
  - UI: Progress bar NOT displayed
  - UI: Cancelled status badge shown
  - UI: "Contact Seller" button visible
- **Verification Method**: snapshot
- **Test Data**: CANCELLED mock order

### E2E-DB-041: Close order detail modal
- **Type**: Happy Path
- **Priority**: Low
- **Preconditions**: Order detail modal open
- **User Journey**:
  1. Click close button (X)
  2. OR click on modal overlay
- **Expected Results**:
  - UI: Modal closes
  - UI: Order list visible again
- **Verification Method**: snapshot
- **Test Data**: None

---

## Scenario Group 8: Settings Page

### E2E-DB-042: Settings page loads with user profile
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: User logged in
- **User Journey**:
  1. Navigate to `/dashboard/settings`
- **Expected Results**:
  - UI: "Settings" title with subtitle "Manage your account and preferences"
  - UI: Profile section with avatar (first letter of name), name, role badge
  - UI: Form fields: Full Name (editable), Nickname (editable), Email (disabled)
  - UI: "Contact support to change your email" hint under email
  - UI: Password section with "Change Password" button
  - UI: Notifications section with 5 toggle switches
  - UI: Danger Zone section with "Log Out All" and "Delete Account" buttons
- **Verification Method**: snapshot
- **Test Data**: Logged-in user

### E2E-DB-043: Edit and save profile
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: On settings page
- **User Journey**:
  1. Clear "Full Name" field
  2. Type "Updated Name"
  3. Click "Save Changes" button
- **Expected Results**:
  - UI: Green toast appears: "Profile updated successfully"
  - UI: Toast disappears after 3 seconds
- **Verification Method**: snapshot
- **Test Data**: New name value

### E2E-DB-044: Save profile with empty name
- **Type**: Error Path
- **Priority**: Medium
- **Preconditions**: On settings page
- **User Journey**:
  1. Clear "Full Name" field (leave empty)
  2. Click "Save Changes"
- **Expected Results**:
  - UI: No toast appears (validation prevents save)
  - UI: Form stays as-is
- **Verification Method**: snapshot
- **Test Data**: Empty name

### E2E-DB-045: Expand password change form
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: On settings page
- **User Journey**:
  1. Click "Change Password" button
- **Expected Results**:
  - UI: Password form expands with 3 fields: Current Password, New Password, Confirm New Password
  - UI: "Cancel" and "Update Password" buttons visible
  - UI: "Change Password" button disappears
- **Verification Method**: snapshot
- **Test Data**: None

### E2E-DB-046: Submit password change with matching passwords
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: Password form expanded
- **User Journey**:
  1. Fill in Current Password: "oldpass123"
  2. Fill in New Password: "newpass456!"
  3. Fill in Confirm New Password: "newpass456!"
  4. Click "Update Password"
- **Expected Results**:
  - UI: Password form collapses
  - UI: Green toast: "Password changed successfully"
  - UI: All password fields cleared
- **Verification Method**: snapshot
- **Test Data**: Password values

### E2E-DB-047: Password mismatch validation
- **Type**: Error Path
- **Priority**: High
- **Preconditions**: Password form expanded
- **User Journey**:
  1. Fill in Current Password: "oldpass"
  2. Fill in New Password: "newpass1"
  3. Fill in Confirm New Password: "newpass2"
- **Expected Results**:
  - UI: "Passwords do not match" error shown below confirm field
  - UI: "Update Password" button is disabled
- **Verification Method**: snapshot
- **Test Data**: Mismatched passwords

### E2E-DB-048: Cancel password change
- **Type**: Happy Path
- **Priority**: Low
- **Preconditions**: Password form expanded with some fields filled
- **User Journey**:
  1. Fill in some password fields
  2. Click "Cancel" button
- **Expected Results**:
  - UI: Password form collapses
  - UI: "Change Password" button reappears
  - UI: All password fields cleared
- **Verification Method**: snapshot
- **Test Data**: None

### E2E-DB-049: Toggle notification settings
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: On settings page
- **User Journey**:
  1. Find "Promotions & Offers" toggle (initially OFF)
  2. Click the toggle
- **Expected Results**:
  - UI: Toggle switches to ON state (charcoal background, knob slides right)
  - UI: "Promotions & Offers" is now enabled
- **Verification Method**: snapshot
- **Test Data**: None

### E2E-DB-050: Toggle notification OFF
- **Type**: Happy Path
- **Priority**: Low
- **Preconditions**: On settings page
- **User Journey**:
  1. Find "Order Updates" toggle (initially ON)
  2. Click the toggle
- **Expected Results**:
  - UI: Toggle switches to OFF state (grey background, knob slides left)
- **Verification Method**: snapshot
- **Test Data**: None

### E2E-DB-051: Delete account confirmation modal
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: On settings page
- **User Journey**:
  1. Click "Delete Account" button in Danger Zone
- **Expected Results**:
  - UI: Confirmation modal appears with warning icon
  - UI: "Delete your account?" title
  - UI: Warning text about permanent deletion
  - UI: "Cancel" and "Yes, Delete My Account" buttons
- **Verification Method**: snapshot
- **Test Data**: None

### E2E-DB-052: Cancel delete account
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: Delete confirmation modal open
- **User Journey**:
  1. Click "Cancel" button in modal
- **Expected Results**:
  - UI: Modal closes
  - UI: Settings page visible again
- **Verification Method**: snapshot
- **Test Data**: None

### E2E-DB-053: Close delete modal by clicking overlay
- **Type**: Alternative Path
- **Priority**: Low
- **Preconditions**: Delete confirmation modal open
- **User Journey**:
  1. Click on dark overlay outside the modal
- **Expected Results**:
  - UI: Modal closes
- **Verification Method**: snapshot
- **Test Data**: None

### E2E-DB-054: Log Out All button triggers logout
- **Type**: Happy Path
- **Priority**: High
- **Preconditions**: On settings page, logged in
- **User Journey**:
  1. Click "Log Out All" button in Danger Zone
- **Expected Results**:
  - API: POST /api/auth/logout called
  - UI: User redirected to homepage
  - UI: Auth state cleared
- **Verification Method**: snapshot / network
- **Test Data**: Logged-in user

### E2E-DB-055: Settings responsive — mobile view
- **Type**: Happy Path
- **Priority**: Medium
- **Preconditions**: User logged in
- **User Journey**:
  1. Set viewport to 375x667
  2. Navigate to `/dashboard/settings`
- **Expected Results**:
  - UI: Settings takes full width
  - UI: Profile header stacks vertically
  - UI: Section header stacks vertically
  - UI: Danger items stack vertically
  - UI: Modal actions stack vertically
- **Verification Method**: snapshot
- **Test Data**: None

---

## Summary
| Type | Count |
|------|-------|
| Happy Path | 40 |
| Alternative Path | 1 |
| Edge Case | 6 |
| Error Path | 3 |
| **Total** | **50** |
