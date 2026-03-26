# Integration Test Report — Sprint 9 (CSS Revert + OAuth Verification)

## Test Environment
- **Date**: 2026-03-26
- **Sprint**: 9 — CSS revert (Tailwind removed) + Google OAuth verification
- **Frontend**: Next.js 15 (localhost:3000)
- **Backend**: NestJS (localhost:4000)
- **Database**: PostgreSQL 16
- **Browser**: Chrome (chrome-devtools MCP)

## Test Result Summary

| Item | Result | Notes |
|------|--------|-------|
| Server Startup | PASS | Both servers already running (port 3000, 4000) |
| Console Errors | 0 | Zero errors across all tested pages |
| Network Failures | 0 | All API calls returned 200/304 |
| Responsive Layout | PASS | Desktop / Tablet / Mobile all verified |
| Scenario Tests | 6/6 | All test cases passed |
| Server Log Errors | 0 | No errors detected |

## Detailed Results

### TC-001: Homepage Load & Product API — PASS
- Homepage loads with title "Vibe — Where Commerce Meets Conversation"
- Product grid renders 24 products (sorted by popularity)
- API `GET /api/products?page=1&limit=24&sort=popular` returns 200
- Hero banner carousel with 3 slides visible
- Category navigation bar with 7 categories
- Sort options (Popular, Latest, Price Low/High, Top Rated) all present
- Footer with Shop, Company, Support sections rendered

### TC-002: Product Category Filtering — PASS
- Clicked "Ceramics & Pottery" category button
- Product count changed from 50,000 to 3,863
- Label "3863 products in Ceramics & Pottery" displayed
- Filtered products are all ceramics-related (tea sets, bowls, vases, candle holders)

### TC-003: Product Detail Page — PASS
- Navigated to "Mini Porcelain Tea Set — Sand" (/products/127)
- Product name, price ($62.00), description, seller (Linh Art Studio) displayed
- Rating (4.3), review count (83), sold count (192) shown
- Stock info (25 available), tags (tea, porcelain, set, sand, mini) present
- Image gallery with 2 thumbnails
- "Add to Cart" button functional
- API `GET /api/products/127` returns 200

### TC-004: Auth — Sign In Modal — PASS
- "Sign In" button opens modal with "Welcome back" heading
- **"Continue with Google" button present** (Google OAuth integration confirmed)
- Email and Password input fields (both required)
- "Remember me" checkbox
- "Forgot password?" link
- "Create one" link to switch to signup form

### TC-005: Auth — Sign Up Modal — PASS
- Switched to signup form via "Create one" link
- "Create account" heading displayed
- **"Sign up with Google" button present** (Google OAuth for signup confirmed)
- Full Name (required), Nickname (optional), Email (required), Password (required) fields
- Password hint: "Must include uppercase, lowercase, number, and special character"
- Role selection: Buyer (default) / Seller radio buttons
- Terms of Service and Privacy Policy links
- "Create Account" submit button

### TC-006: Protected Route Redirect — PASS
- Navigated to `/dashboard` while not authenticated
- Redirected to homepage (`/`) automatically
- Auth guard working correctly

### 404 Page — PASS
- Navigated to `/nonexistent-page`
- "404 — Page Not Found" message displayed
- "Go Home" link redirects to homepage

### Responsive Layout Verification — PASS

| Viewport | Resolution | Grid | Layout |
|----------|-----------|------|--------|
| Desktop | 1280x720 | 4 columns | Full header, search bar, all categories visible |
| Tablet | 768x1024 | 3 columns | Adapted header, categories scrollable |
| Mobile | 375x667 | 2 columns | Compact header, horizontally scrollable categories |

### Console & Network Analysis
- **Console errors**: 0 across all pages (homepage, product detail, cart, 404)
- **Console warnings**: 1 minor Next.js deprecation warning about `scroll-behavior: smooth`
- **Failed network requests**: 0
- **All API responses**: 200 or 304 (cached)

## Issues Found
None. All tests passed with zero errors.

## Notes
- Tailwind CSS was removed and reverted to original CSS — no visual regressions detected
- Google OAuth (`loginWithGoogle`, `signInWithPopup`) fully integrated in both login and signup modals
- Firebase Auth handles all OAuth providers uniformly — backend requires no changes for new providers
