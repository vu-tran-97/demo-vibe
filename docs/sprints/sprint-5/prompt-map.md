# Sprint 5 Prompt Map

## Sprint Goal
Complete the marketplace experience: bulletin board for community, user profile settings, simple payment flow (mail/QR), enhanced seller order management, and advanced product search.

## Previous Sprint Carryover
None — Sprint 4 completed 100% (Product Registration, Purchase History, Admin Enhancement).
Retrospective not conducted.

---

## Feature 1: Bulletin Board

### 1.1 Design Prompt
/feature-dev "Write the design document for the Bulletin Board module
to docs/blueprints/007-board/blueprint.md.
Requirements:
- Post CRUD (create, read, update, delete) with rich text content
- Categories: NOTICE (admin only), FREE, QNA, REVIEW
- Comment system: nested comments (1 level), edit/delete own comments
- Post list with pagination, search by title/content, filter by category
- Author info display (name, avatar)
- Only post owner or SUPER_ADMIN can edit/delete posts
- Sort by newest, most viewed, most commented
- View count tracking
Refer to docs/database/database-design.md for existing DB schema (TB_COMM_PSTNG, TR_COMM_PSTNG_CMT).
Do not modify any code yet."

### 1.2 DB Design Reflection Prompt
/feature-dev "Review and update the Board-related tables in
docs/database/database-design.md:
- TB_COMM_PSTNG (Post) — verify columns: title, content, category, view count, author
- TR_COMM_PSTNG_CMT (Comment) — verify columns: content, parent comment, author
- Add any missing indexes or fields needed for search/filter/sort
- Update the ERD and FK relationship summary. Follow standard terminology dictionary.
Do not modify any code yet."

### 1.3 Test Case Prompt
/feature-dev "Based on docs/blueprints/007-board/blueprint.md,
write test cases to docs/tests/test-cases/sprint-5/board-test-cases.md.
Cover:
- Post CRUD (all roles), category filtering, search, pagination
- Comment CRUD, nested comments
- Permission checks (owner-only edit/delete, admin-only NOTICE)
- Edge cases: empty content, long text, concurrent edits
Use Given-When-Then format.
Do not modify any code yet."

### 1.4 Implementation Prompt
/feature-dev "Strictly follow docs/blueprints/007-board/blueprint.md and
docs/database/database-design.md to implement the Bulletin Board module.
Backend (NestJS):
- BoardModule with Controller/Service/DTOs
- POST/GET/PATCH/DELETE /api/posts, /api/posts/:id/comments
- Search, filter by category, pagination, sort
Frontend (Next.js):
- /dashboard/board — post list with filters and search
- /dashboard/board/[id] — post detail with comments
- /dashboard/board/create — create post form
- /dashboard/board/[id]/edit — edit post form
- Update dashboard sidebar navigation
Write tests referencing docs/tests/test-cases/sprint-5/board-test-cases.md,
run all tests and report results to docs/tests/test-reports/."

---

## Feature 2: User Settings

### 2.1 Design Prompt
/feature-dev "Write the design document for the User Settings module
to docs/blueprints/008-user-settings/blueprint.md.
Requirements:
- Profile edit: name, nickname, profile image URL
- Password change: current password verification + new password
- Account info display: email (read-only), role, registration date
- Delete account (soft delete with confirmation)
- Settings page UI with sections: Profile, Security, Account
Refer to docs/database/database-design.md for TB_COMM_USER schema.
Do not modify any code yet."

### 2.2 DB Design Reflection Prompt
/feature-dev "Review TB_COMM_USER in docs/database/database-design.md.
Verify it has all fields needed for profile edit and settings.
Add any missing fields if needed. Follow standard terminology dictionary.
Do not modify any code yet."

### 2.3 Test Case Prompt
/feature-dev "Based on docs/blueprints/008-user-settings/blueprint.md,
write test cases to docs/tests/test-cases/sprint-5/user-settings-test-cases.md.
Cover:
- Profile update (name, nickname, image)
- Password change (correct old password, wrong old password, weak new password)
- Account deletion flow
- Validation (empty name, invalid image URL, etc.)
Use Given-When-Then format.
Do not modify any code yet."

### 2.4 Implementation Prompt
/feature-dev "Strictly follow docs/blueprints/008-user-settings/blueprint.md and
docs/database/database-design.md to implement User Settings.
Backend (NestJS):
- Add endpoints: PATCH /api/auth/profile, PATCH /api/auth/password, DELETE /api/auth/account
- Current password verification for password change
Frontend (Next.js):
- /dashboard/settings — already has placeholder, replace with full settings page
- Profile section: edit name, nickname, profile image URL
- Security section: change password form
- Account section: email display, role, delete account button
Write tests referencing docs/tests/test-cases/sprint-5/user-settings-test-cases.md,
run all tests and report results to docs/tests/test-reports/."

---

## Feature 3: Simple Payment & Seller Order Management

### 3.1 Design Prompt
/feature-dev "Write the design document for Simple Payment and Seller Order Management
to docs/blueprints/009-payment-order/blueprint.md.
Requirements:
Payment (simple — no real PG integration):
- Checkout page with order summary
- Payment method selection: Bank Transfer (show bank info + QR image), Email Invoice
- Bank Transfer: display static QR code image and bank account details
- Email Invoice: form to send order details to buyer email (mock — just show success)
- After payment method selected, order status changes to PAID
- Payment confirmation page with order number

Seller Order Management Enhancement:
- Seller can view all orders containing their products
- Status flow: PENDING → CONFIRMED → SHIPPED → DELIVERED
- Seller can update order item status (confirm, mark shipped with tracking, mark delivered)
- Shipping info: tracking number input when marking as shipped
- Order detail view for seller: buyer info, items, payment status, status history
- Bulk status update (select multiple orders → confirm/ship)

Refer to docs/database/database-design.md for TB_COMM_ORDR, TB_COMM_ORDR_ITEM, TH_COMM_ORDR_STTS.
Do not modify any code yet."

### 3.2 DB Design Reflection Prompt
/feature-dev "Update order-related tables in docs/database/database-design.md:
- TB_COMM_ORDR — add payment method field (PAY_MTHD_CD: BANK_TRANSFER, EMAIL_INVOICE)
- TB_COMM_ORDR_ITEM — add tracking number field (TRCK_NO)
- TH_COMM_ORDR_STTS — verify status history has actor (who changed), reason
- Add PAY_MTHD code group to TC_COMM_CD
- Update ERD. Follow standard terminology dictionary.
Do not modify any code yet."

### 3.3 Test Case Prompt
/feature-dev "Based on docs/blueprints/009-payment-order/blueprint.md,
write test cases to docs/tests/test-cases/sprint-5/payment-order-test-cases.md.
Cover:
- Checkout flow: cart → checkout → payment method → confirmation
- Bank transfer: QR display, bank info display
- Email invoice: form submission
- Seller order list with filters (status, date)
- Seller status updates: confirm, ship (with tracking), deliver
- Bulk status update
- Permission checks: seller can only manage own product orders
Use Given-When-Then format.
Do not modify any code yet."

### 3.4 Implementation Prompt
/feature-dev "Strictly follow docs/blueprints/009-payment-order/blueprint.md and
docs/database/database-design.md to implement Payment and Seller Order Management.
Backend (NestJS):
- Add checkout endpoint: POST /api/orders/checkout
- Add payment method to order creation
- Enhance seller sales endpoints: PATCH /api/orders/:id/items/:itemId/status
- Add bulk status update: POST /api/orders/sales/bulk-status
- Add tracking number support
Frontend (Next.js):
- /dashboard/checkout — checkout page with payment method selection
- Bank Transfer view: static QR image + bank details
- Email Invoice view: confirmation form
- Payment success page
- Enhance /dashboard/orders/sales — add status change buttons, tracking input, bulk actions
- Order detail modal for sellers with full status history
Write tests referencing docs/tests/test-cases/sprint-5/payment-order-test-cases.md,
run all tests and report results to docs/tests/test-reports/."

---

## Feature 4: Search & Filtering Enhancement

### 4.1 Design Prompt
/feature-dev "Write the design document for Search & Filtering Enhancement
to docs/blueprints/010-search-filter/blueprint.md.
Requirements:
- Global search bar in dashboard header (currently non-functional)
- Search across products (name, description, tags), posts (title, content), users (admin only)
- Search results page with tabbed sections: Products, Posts, Users
- Product filtering enhancement:
  - Price range slider (min/max)
  - Rating filter (4+ stars, 3+ stars, etc.)
  - Stock status (in stock only)
  - Multiple category select
- Sort options: relevance (for search), price, rating, newest, most sold
- Search suggestions/autocomplete (debounced, top 5 results)
- Recent search history (localStorage)
- URL query params for shareable filter state
Refer to existing product list and dashboard layout.
Do not modify any code yet."

### 4.2 DB Design Reflection Prompt
/feature-dev "Review docs/database/database-design.md for search optimization.
- Verify text search indexes on TB_PROD_PRD (prdNm, prdDc, srchTags)
- Verify text search indexes on TB_COMM_PSTNG (title, content)
- Add any needed indexes for efficient filtering.
Do not modify any code yet."

### 4.3 Test Case Prompt
/feature-dev "Based on docs/blueprints/010-search-filter/blueprint.md,
write test cases to docs/tests/test-cases/sprint-5/search-filter-test-cases.md.
Cover:
- Global search: products, posts, users results
- Product filters: price range, rating, stock, multi-category
- Sort options across all views
- Search suggestions/autocomplete
- URL state persistence
- Edge cases: empty results, special characters, very long queries
Use Given-When-Then format.
Do not modify any code yet."

### 4.4 Implementation Prompt
/feature-dev "Strictly follow docs/blueprints/010-search-filter/blueprint.md and
docs/database/database-design.md to implement Search & Filtering Enhancement.
Backend (NestJS):
- Add GET /api/search?q=keyword — returns products, posts, users (admin)
- Enhance GET /api/products with: minPrice, maxPrice, minRating, inStock, categories[] params
- Add search suggestions endpoint: GET /api/search/suggest?q=keyword (top 5)
Frontend (Next.js):
- Make dashboard header search bar functional (currently placeholder)
- /dashboard/search?q=keyword — search results page with tabs
- Enhance /dashboard/products filter panel: price range inputs, rating buttons, stock toggle
- Search autocomplete dropdown with debounce (300ms)
- Recent searches in localStorage
- Sync filter state with URL query params
Write tests referencing docs/tests/test-cases/sprint-5/search-filter-test-cases.md,
run all tests and report results to docs/tests/test-reports/."
