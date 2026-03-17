# Sprint 6 Prompt Map (Final Sprint)

## Sprint Goal
Polish and finalize the marketplace: fix cart flow end-to-end, improve search/filter UX, enhance overall UI consistency, and ensure all user journeys work seamlessly from browse to purchase to seller management.

## Previous Sprint Carryover
None — Sprint 5 completed 100%.

---

## Feature 1: Cart Enhancement

### 1.1 Design Prompt
/feature-dev "Write the design document for Cart Enhancement
to docs/blueprints/011-cart-enhance/blueprint.md.
Requirements:
- Add to cart from product detail page and product cards (home page + products page)
- Cart icon in header shows item count badge
- Cart page: update quantity, remove items, clear cart
- Cart persists in localStorage (already exists via use-cart hook — verify and fix)
- Stock validation: cannot add more than available stock
- Price calculation: use salePrice when available
- Empty cart state with link to products
- Smooth add-to-cart feedback (toast or animation)
- Cart → Checkout flow seamless (pre-fill from cart)
Do not modify any code yet."

### 1.2 Implementation Prompt
/feature-dev "Strictly follow docs/blueprints/011-cart-enhance/blueprint.md.
Fix and enhance the cart system:
- Verify src/hooks/use-cart.ts works correctly with localStorage
- Add cart badge (item count) to dashboard sidebar and header
- Ensure Add to Cart button on /dashboard/products/[id] works
- Add quick Add to Cart on product cards (/dashboard/products and home page)
- Fix /dashboard/cart page: proper quantity controls, remove, clear, subtotals
- Connect cart → /dashboard/checkout seamlessly (pass cart items)
- Add toast notification on add-to-cart
- Stock validation (check against product.stock)
- Responsive for mobile/tablet/desktop"

---

## Feature 2: Search & Filter Improvements

### 2.1 Implementation Prompt
/feature-dev "Improve the search and filter system across the app.
Fixes and enhancements:
- Ensure global search bar (GlobalSearchBar component) works on all dashboard pages
- Fix search results page (/dashboard/search) — verify products and posts tabs load correctly
- Fix product filter panel on /dashboard/products:
  - Price range inputs should trigger re-fetch on Enter key (not just blur)
  - Category checkboxes: show count of products per category if possible
  - Clear individual filters (not just Clear All)
  - Ensure URL state sync works (copy URL → paste → same filters applied)
- Home page search: connect home page search bar to /dashboard/search or show results
- Improve search autocomplete: show product images in suggestions if available
- Responsive: filters should work properly on mobile (collapsible panel)
Do not create new blueprints — this is enhancement of existing feature 010."

---

## Feature 3: UI/UX Enhancement & Polish

### 3.1 Implementation Prompt
/feature-dev "Polish the overall UI/UX across the application.
Fixes:
- Dashboard overview page (/dashboard): show real data instead of static mockups
  - Stats cards: total products (from API), total orders, total spent/revenue
  - Recent orders list (last 5)
  - Quick actions (go to products, cart, orders)
- Navigation: highlight active nav item in sidebar based on current route
- Consistent page titles: update the top bar title dynamically per page (currently always shows 'Overview')
- Home page: ensure login/signup modal works, product links go to correct detail pages
- Loading states: add skeleton loaders where missing
- Error boundaries: graceful error messages on API failures
- 404 page for invalid routes
- Mobile: verify all pages work on mobile, fix any layout breaks
- Footer: ensure footer links work or remove broken ones
Responsive for mobile/tablet/desktop."

---

## Feature 4: Final Integration & End-to-End Polish

### 4.1 Implementation Prompt
/feature-dev "Final integration pass — ensure all user flows work end-to-end.
Test and fix these complete journeys:

BUYER flow:
1. Home page → Browse products → Click product → View detail
2. Add to cart → Go to cart → Adjust quantity → Checkout
3. Select payment (Bank Transfer/Email Invoice) → Confirm → Success page
4. View order history → See order status

SELLER flow:
1. Login as seller → Dashboard → My Products
2. Create new product → View in product list
3. View sales → Confirm order → Ship (with tracking) → Deliver
4. Edit product → Change status (active/hidden)

ADMIN flow:
1. Login as admin → Admin dashboard → Stats
2. User management → Edit/role change/status toggle
3. All Products → Edit any product
4. Board → Create NOTICE post

Fix any broken links, missing redirects, or inconsistent states found during these flows.
Ensure all toast notifications, modals, and error messages display correctly.
Responsive for mobile/tablet/desktop."
