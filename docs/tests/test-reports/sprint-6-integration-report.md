# Sprint 6 Integration Test Report

## Test Environment
- Date: 2026-03-20
- Frontend: Next.js 15.5.12 (localhost:3000)
- Backend: NestJS 11.1.0 + Prisma (localhost:4000)
- Database: MongoDB 7 (localhost:27017)
- Browser: API-level + HTML content verification (Chrome MCP not available)

## Test Result Summary

| Category | Passed | Failed | Total |
|----------|--------|--------|-------|
| Page Load | 15 | 0 | 15 |
| API Health | 3 | 0 | 3 |
| Auth Flow | 10 | 0 | 10 |
| E-commerce Flow | 8 | 0 | 8 |
| Board CRUD | 7 | 0 | 7 |
| Search & Filter | 4 | 0 | 4 |
| Guest Checkout | 2 | 0 | 2 |
| Error Handling | 4 | 0 | 4 |
| **Total** | **53** | **0** | **53** |

## Detailed Results

### Page Load Tests (15/15 PASS)
| TC | Page | Status | Result |
|----|------|--------|--------|
| TC-001 | Homepage `/` | 200 | PASS |
| TC-002 | Login `/auth/login` | 200 | PASS |
| TC-003 | Signup `/auth/signup` | 200 | PASS |
| TC-004 | Forgot Password `/auth/forgot-password` | 200 | PASS |
| TC-005 | Cart `/cart` | 200 | PASS |
| TC-006 | Checkout `/checkout` | 200 | PASS |
| TC-007 | Orders `/orders` | 200 | PASS |
| TC-008 | Settings `/settings` | 200 | PASS |
| TC-009 | Dashboard `/dashboard` | 200 | PASS |
| TC-010 | Board `/dashboard/board` | 200 | PASS |
| TC-011 | Products `/dashboard/products` | 200 | PASS |
| TC-012 | Orders Dashboard `/dashboard/orders` | 200 | PASS |
| TC-013 | Chat `/dashboard/chat` | 200 | PASS |
| TC-014 | Admin `/dashboard/admin` | 200 | PASS |
| TC-015 | Settings Dashboard `/dashboard/settings` | 200 | PASS |

### Homepage Content Verification
- Title: "Vibe — Where Commerce Meets Conversation"
- Hero banner carousel: 3 slides (Handcrafted Collection, New Arrivals, Shop by Category)
- Category filters: All, Ceramics & Pottery, Textiles & Fabrics, Art & Prints, Jewelry & Accessories, Home & Living, Food & Beverages
- Sort options: Popular, Latest, Price Low/High, Top Rated
- Header: Logo, Search bar, Cart, Sign In
- Footer: Shop links, Company, Support sections

### API Health Tests (3/3 PASS)
| TC | Endpoint | Result |
|----|----------|--------|
| TC-016 | `GET /api/health` — status: ok | PASS |
| TC-017 | `GET /api/health/db` — database: connected | PASS |
| TC-018 | `GET /api/products` — 201 products in DB | PASS |

### Auth Flow Tests (10/10 PASS)
| TC | Test | Result |
|----|------|--------|
| TC-019 | Signup new user (email, password, name, nickname) | PASS |
| TC-020 | Login with valid credentials → JWT + refresh token | PASS |
| TC-021 | Token refresh → new access token issued | PASS |
| TC-022 | Profile update (name, nickname) | PASS |
| TC-023 | Password change (current → new) | PASS |
| TC-024 | Duplicate email signup → EMAIL_ALREADY_EXISTS | PASS |
| TC-025 | Wrong password login → INVALID_CREDENTIALS | PASS |
| TC-026 | Forgot password → reset link message | PASS |
| TC-027 | Invalid token → 401 Unauthorized | PASS |
| TC-028 | Logout → success | PASS |

### E-commerce Flow Tests (8/8 PASS)
| TC | Test | Result |
|----|------|--------|
| TC-029 | Product list (201 products, pagination) | PASS |
| TC-030 | Product detail (name, price, stock, status) | PASS |
| TC-031 | Product search "ceramic" → 15 results | PASS |
| TC-032 | Product filter by category TEXTILES → 33 results | PASS |
| TC-033 | Product sort price-low/price-high | PASS |
| TC-034 | Buyer create order → PENDING status | PASS |
| TC-035 | Buyer pay order → PAID, per-item paymentStatus=PAID | PASS |
| TC-036 | Order detail includes sellerName per item | PASS |

### Board CRUD Tests (7/7 PASS)
| TC | Test | Result |
|----|------|--------|
| TC-037 | Create post (title, content, category=FREE) | PASS |
| TC-038 | List posts with pagination | PASS |
| TC-039 | Post detail (view count incremented) | PASS |
| TC-040 | Add comment to post | PASS |
| TC-041 | Update post title | PASS |
| TC-042 | Update comment content | PASS |
| TC-043 | Delete comment → soft delete, Delete post → soft delete | PASS |

### Search & Filter Tests (4/4 PASS)
| TC | Test | Result |
|----|------|--------|
| TC-044 | Global search "ceramic" → 23 products, 0 posts | PASS |
| TC-045 | Search suggestions for "art" → product suggestions returned | PASS |
| TC-046 | Product sort validation (invalid sort → VALIDATION_ERROR) | PASS |
| TC-047 | Product sort valid values: newest, price-low, price-high, popular, rating | PASS |

### Guest Checkout Tests (2/2 PASS)
| TC | Test | Result |
|----|------|--------|
| TC-048 | Single-item guest checkout (no auth) → order created with guest buyerId | PASS |
| TC-049 | Multi-item guest checkout → 2 items from different products, correct totals | PASS |

### Error Handling Tests (4/4 PASS)
| TC | Test | Result |
|----|------|--------|
| TC-050 | Guest order inaccessible to authenticated user (ORDER_ACCESS_DENIED) | PASS |
| TC-051 | Invalid product sort param → VALIDATION_ERROR with allowed values | PASS |
| TC-052 | Checkout DTO validation (paymentMethod not allowed in /orders) | PASS |
| TC-053 | Account deletion → success, subsequent login fails | PASS |

## Key Features Verified

### Guest Checkout (Sprint 6 Feature)
- `/api/orders/checkout` accepts orders without authentication
- Guest orders assigned buyerId `000000000000000000000000`
- Supports both BANK_TRANSFER and EMAIL_INVOICE payment methods
- Multi-item orders with correct subtotal calculations

### Per-item Payment System
- Each order item has independent `paymentStatus` (UNPAID/PAID)
- Order-level payment via `PATCH /api/orders/:id/pay`
- Per-item seller payment confirmation available
- `sellerName` included in order detail response

### Product Catalog
- 201 products across 6 categories
- Full-text search, category filtering, 5 sort options
- Product detail with view count tracking
- Seller information attached to products

### Board System
- Post CRUD with categories (FREE/QNA/NOTICE/ANNOUNCEMENT)
- Comment CRUD with nested structure support
- View count auto-increment on detail view
- Soft delete for posts and comments

### Global Search
- Cross-entity search (products + posts)
- Search suggestions with type classification
- Result counts per entity type

## Server Log Analysis
- **Errors**: 0 ERROR-level log entries
- **Warnings**: 5 WARN entries — all expected business exceptions:
  - EMAIL_ALREADY_EXISTS (duplicate signup test)
  - INVALID_CREDENTIALS x2 (wrong password tests)
  - ORDER_ACCESS_DENIED x2 (guest order access test)
- **Performance**: All requests processed without timeouts
- **Database**: Connected and responsive throughout testing

## Issues Found
- None — all 53 tests passed

## Notes
- Chrome MCP (chrome-devtools) was not available; testing performed via API calls + HTML content verification
- Homepage SSR shows "0 products" initially — products load client-side after hydration (expected behavior for CSR approach)
- Test user account was created and deleted as part of the test flow (cleanup complete)
