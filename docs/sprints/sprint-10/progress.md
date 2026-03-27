# Sprint 10 Progress Tracker

## Sprint Information
- **Sprint Number**: 10
- **Sprint Goal**: Tailwind CSS v4 Migration + Production Data Seeding + VND Price Format
- **Start Date**: 2026-03-27
- **End Date**: 2026-04-03
- **Status**: In Progress

<!-- PROGRESS_TABLE_START -->
## Feature Progress

| Feature | Blueprint | DB Design | Test Cases | Implementation | Test Report | Status |
|---------|-----------|-----------|------------|----------------|-------------|--------|
| Tailwind CSS v4 Migration | N/A | N/A | Done | Done | Done | Completed |
| Production Data Seeding (50K) | N/A | N/A | N/A | Done | N/A | Completed |
| VND Price Format | N/A | N/A | Done | Done | Done | Completed |
| Firebase Auth ENV Support | N/A | N/A | Done | Done | Done | Completed |
| Railway Postgres Setup | N/A | N/A | N/A | Done | N/A | Completed |

**Legend**: `-` Not Started, `WIP` In Progress, `Done` Completed, `N/A` Not Applicable
<!-- PROGRESS_TABLE_END -->

<!-- SUMMARY_START -->
## Summary
- **Total Features**: 5
- **Completed**: 5
- **In Progress**: 0
- **Overall Progress**: 100%
- **Last Updated**: 2026-03-27 21:00
<!-- SUMMARY_END -->

## Data Sources (Production DB — Railway Postgres)

### Product Data (50,000 total)

| Source | API Endpoint | Products | Category Mapping | Price |
|--------|-------------|----------|-----------------|-------|
| **Tiki.vn** | `tiki.vn/api/personalish/v1/blocks/listings` | 40,986 | 24 Tiki categories → 6 app categories | VND (native) |
| **OpenLibrary** | `openlibrary.org/search.json` | 8,137 | Books → ART, FOOD, HOME, TEXTILES, JEWELRY, CERAMICS | VND (50k-500k₫) |
| **Makeup API** | `makeup-api.herokuapp.com/api/v1/products.json` | 877 | Cosmetics → CERAMICS | VND (USD×25,000) |
| **Total** | | **50,000** | | VND |

#### Tiki Category Mapping

| Tiki Category | App Category | Products |
|--------------|-------------|----------|
| Điện thoại, Máy tính, Điện gia dụng, Nhà cửa, Thể thao, Đồ chơi, Thiết bị số, Xe đạp, Mẹ & Bé | HOME | ~20,000 |
| Thời trang nam/nữ, Giày dép, Túi xách, Balo | TEXTILES | ~8,000 |
| Đồng hồ, Phụ kiện thời trang | JEWELRY | ~4,000 |
| Làm đẹp, Sức khỏe | CERAMICS | ~4,000 |
| Thực phẩm, NGON | FOOD | ~3,500 |
| Sách | ART | ~2,000 |

#### Crawl Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `scripts/crawl-tiki.ts` | Crawl real products from Tiki.vn (primary) | `DATABASE_URL='...' npx tsx scripts/crawl-tiki.ts [seller-email] [count]` |
| `scripts/crawl-products.ts` | Legacy — DummyJSON + FakeStore with variations (deprecated) | `npx tsx scripts/crawl-products.ts` |
| `prisma/seed-mass.ts` | Mass seed users + products (for initial setup) | `DATABASE_URL='...' npx tsx prisma/seed-mass.ts` |

### User Accounts

| Email | Role | Password | Notes |
|-------|------|----------|-------|
| admin@astratech.vn | SUPER_ADMIN | Admin@123 | Platform administrator |
| seller1000@yopmail.com | SELLER | (Firebase) | Owns all 50,000 products |

## Key Changes

### VND Price Format
- `src/lib/products.ts` — `formatPrice()` changed from `$xxx.xx` to `xxx.xxx₫` (vi-VN locale)
- `src/app/dashboard/orders/page.tsx` — replaced hardcoded `$` with `formatPrice()`
- `src/app/orders/page.tsx` — same
- `src/app/dashboard/orders/sales/page.tsx` — same

### Firebase Auth ENV Support
- `server/src/firebase/firebase.service.ts` — added `FIREBASE_SERVICE_ACCOUNT` env var support (JSON string) for Railway deployment
- Railway backend env: `FIREBASE_SERVICE_ACCOUNT` set with service account JSON

### Railway Infrastructure
- **Frontend**: `demo-vibe-production.up.railway.app` (Next.js, deploys from `staging` branch)
- **Backend**: `demo-vibe-backend-production.up.railway.app` (NestJS, deploys from `staging` branch)
- **Database**: PostgreSQL on Railway (`postgres.railway.internal:5432/railway`)
- **TCP Proxy**: `gondola.proxy.rlwy.net:50560` (public access)

## E2E Test Scenarios (Sprint 10)

| Feature | Scenarios | File |
|---------|-----------|------|
| Auth | 48 | `docs/tests/test-cases/sprint-10/auth-e2e-scenarios.md` |
| Product | 48 | `docs/tests/test-cases/sprint-10/product-e2e-scenarios.md` |
| Board | 50 | `docs/tests/test-cases/sprint-10/board-e2e-scenarios.md` |
| Admin | 43 | `docs/tests/test-cases/sprint-10/admin-e2e-scenarios.md` |
| Order | 42 | `docs/tests/test-cases/sprint-10/order-e2e-scenarios.md` |
| Cross-feature | 28 | `docs/tests/test-cases/sprint-10/cross-feature-e2e-scenarios.md` |
| Settings | 20 | `docs/tests/test-cases/sprint-10/settings-e2e-scenarios.md` |
| Search | 19 | `docs/tests/test-cases/sprint-10/search-e2e-scenarios.md` |
| **Total** | **298** | |
