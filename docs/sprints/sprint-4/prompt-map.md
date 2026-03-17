# Sprint 4 Prompt Map

## Sprint Goal
Enable the e-commerce core: sellers can register products, and both buyers and sellers can view purchase history. Enhance existing admin user management with additional capabilities.

## Previous Sprint Carryover
- **Sprint 3**: All 3 features completed (100%) — Social Login, Admin UI, DB Naming Fix
- **Retrospective**: Not conducted (template only) — no specific improvement actions to carry over
- **Note**: Admin User Management UI (003-admin-ui) was fully implemented in Sprint 3. Sprint 4 enhances it with activity logs, bulk operations, and export functionality.

---

## Feature 1: Product Registration (Seller)

### 1.1 Design Prompt
/feature-dev "Write the design document for Product Registration feature
to docs/blueprints/004-product/blueprint.md.

Requirements:
- Sellers can register new products (title, description, price, category, images, stock quantity)
- Product list page for sellers to manage their own products (CRUD)
- Product detail page visible to all users (buyers can view)
- Product image upload (up to 5 images per product)
- Product status management: DRAFT, ACTIVE, SOLD_OUT, HIDDEN
- Product category system using TC_COMM_CD code tables
- Product search and filtering (by category, price range, keyword)
- Pagination for product listings
- Seller dashboard showing their product stats (total products, active, sold out)

Tech stack: NestJS backend + Next.js 15 frontend + MongoDB (Prisma)
Role-based: Only SELLER and SUPER_ADMIN can create/edit products, BUYER can only view
Refer to docs/database/database-design.md for existing schema patterns.
Do not modify any code yet."

### 1.2 DB Design Reflection Prompt
/feature-dev "Add the Product module tables to docs/database/database-design.md:
- TB_COMM_PRDT (Product) — main product table
- TB_COMM_PRDT_IMG (Product Image) — product images (max 5)
- TC_COMM_CD additions: PRDT_CTGR (product category codes), PRDT_STTS (product status codes)
- Add indexes for product listing (seller ID + status, category + status, text search on title)
- Add Prisma Schema Mapping for new collections
- Update ERD and FK relationship summary
- Follow standard terminology dictionary (/lookup-term for Korean→English abbreviations)
Do not modify any code yet."

### 1.3 Test Case Prompt
/feature-dev "Based on the feature requirements in docs/blueprints/004-product/blueprint.md,
write test cases to docs/tests/test-cases/sprint-4/product-test-cases.md.
Use Given-When-Then format, include unit/integration/edge cases.
Cover: product CRUD, image upload, status transitions, role-based access, search/filter, pagination.
Do not modify any code yet."

### 1.4 Implementation Prompt
/feature-dev "Strictly follow the contents of docs/blueprints/004-product/blueprint.md and
docs/database/database-design.md to proceed with development.

Backend (NestJS):
- Product module (module, controller, service, DTOs)
- Product image upload handling
- Role-based guards (SELLER/SUPER_ADMIN for write, all for read)
- Search and filter endpoints with pagination

Frontend (Next.js):
- Seller product management page (/dashboard/products) — list, create, edit, delete
- Product detail page (/dashboard/products/[id]) — public view
- Product registration form with image upload
- Product list with filters and search

Write tests referencing docs/tests/test-cases/sprint-4/product-test-cases.md,
and once implementation is complete, run all tests and
report results to docs/tests/test-reports/."

---

## Feature 2: Purchase History (Buyer & Seller)

### 2.1 Design Prompt
/feature-dev "Write the design document for Purchase History feature
to docs/blueprints/005-purchase-history/blueprint.md.

Requirements:
- Order creation flow: Buyer adds products to cart → checkout → order created
- Order table with status tracking: PENDING, PAID, SHIPPED, DELIVERED, CANCELLED, REFUNDED
- Buyer purchase history page: list of all orders with status, date, total amount, pagination
- Seller sales history page: list of orders containing their products, with buyer info, status, revenue
- Order detail page showing items, quantities, prices, shipping info, status timeline
- Order status updates by seller (PENDING→SHIPPED→DELIVERED)
- Order cancellation by buyer (only when PENDING)
- Revenue summary for sellers (total sales, monthly breakdown)
- Pagination and date range filtering on both buyer/seller views

Tech stack: NestJS backend + Next.js 15 frontend + MongoDB (Prisma)
Role-based: Buyers see their orders, Sellers see orders for their products, SUPER_ADMIN sees all
Refer to docs/database/database-design.md for existing schema patterns.
Do not modify any code yet."

### 2.2 DB Design Reflection Prompt
/feature-dev "Add the Order/Purchase module tables to docs/database/database-design.md:
- TB_COMM_ORDR (Order) — main order table (buyer, total amount, status, shipping info)
- TB_COMM_ORDR_ITEM (Order Item) — order line items (product ref, quantity, unit price, seller ref)
- TH_COMM_ORDR_STTS (Order Status History) — status change log with timestamps
- TC_COMM_CD additions: ORDR_STTS (order status codes: PENDING/PAID/SHIPPED/DELIVERED/CANCELLED/REFUNDED)
- Add indexes for buyer order history, seller sales history, date range queries
- Add Prisma Schema Mapping for new collections
- Update ERD and FK relationship summary
- Follow standard terminology dictionary
Do not modify any code yet."

### 2.3 Test Case Prompt
/feature-dev "Based on the feature requirements in docs/blueprints/005-purchase-history/blueprint.md,
write test cases to docs/tests/test-cases/sprint-4/purchase-history-test-cases.md.
Use Given-When-Then format, include unit/integration/edge cases.
Cover: order creation, status transitions, buyer history, seller sales, cancellation, role-based access, pagination, date filtering.
Do not modify any code yet."

### 2.4 Implementation Prompt
/feature-dev "Strictly follow the contents of docs/blueprints/005-purchase-history/blueprint.md and
docs/database/database-design.md to proceed with development.

Backend (NestJS):
- Order module (module, controller, service, DTOs)
- Order creation from cart
- Order status management with history logging
- Buyer order history endpoint with pagination and date filters
- Seller sales history endpoint with revenue aggregation
- Role-based access control

Frontend (Next.js):
- Buyer purchase history page (/dashboard/orders) — replace current placeholder
- Seller sales history page (/dashboard/orders with seller view)
- Order detail page with status timeline
- Cart → Checkout → Order creation flow
- Date range filters and pagination

Write tests referencing docs/tests/test-cases/sprint-4/purchase-history-test-cases.md,
and once implementation is complete, run all tests and
report results to docs/tests/test-reports/."

---

## Feature 3: Admin User Management Enhancement

### 3.1 Design Prompt
/feature-dev "Write the design document for Admin User Management Enhancement
to docs/blueprints/006-admin-enhance/blueprint.md.

The base admin user management was built in Sprint 3 (see docs/blueprints/003-admin-ui/blueprint.md).
This sprint adds:
- User activity log viewer (login history, role/status changes)
- Bulk user operations (multi-select: suspend, activate, export)
- Export user list to CSV
- Admin dashboard analytics (total users, new users this week, role distribution chart, login activity graph)
- User detail enhancement: show order history summary, product count (for sellers)
- Email notification on user suspension/reactivation

Tech stack: NestJS backend + Next.js 15 frontend + MongoDB (Prisma)
Refer to existing admin implementation in src/components/admin/ and server/src/admin/
Refer to docs/database/database-design.md for existing schema.
Do not modify any code yet."

### 3.2 DB Design Reflection Prompt
/feature-dev "Review and update docs/database/database-design.md for admin enhancements:
- TL_COMM_USE_ACTV (User Activity Log) — tracks role changes, status changes, profile updates
- Add any missing indexes for activity log queries (user ID + date range)
- Update ERD with new collections
- Follow standard terminology dictionary
Do not modify any code yet."

### 3.3 Test Case Prompt
/feature-dev "Based on the feature requirements in docs/blueprints/006-admin-enhance/blueprint.md,
write test cases to docs/tests/test-cases/sprint-4/admin-enhance-test-cases.md.
Use Given-When-Then format, include unit/integration/edge cases.
Cover: activity log, bulk operations, CSV export, dashboard analytics, email notifications.
Do not modify any code yet."

### 3.4 Implementation Prompt
/feature-dev "Strictly follow the contents of docs/blueprints/006-admin-enhance/blueprint.md and
docs/database/database-design.md to proceed with development.

Backend (NestJS):
- Extend admin module with activity log endpoints
- Bulk operations endpoints (multi-user status change)
- CSV export endpoint
- Dashboard analytics aggregation endpoints
- Email notification service for suspension/reactivation

Frontend (Next.js):
- Activity log tab in user detail panel
- Bulk selection UI with action bar
- Export button with CSV download
- Admin dashboard page with charts (user growth, role distribution)
- Enhanced user detail with order/product summary

Write tests referencing docs/tests/test-cases/sprint-4/admin-enhance-test-cases.md,
and once implementation is complete, run all tests and
report results to docs/tests/test-reports/."
