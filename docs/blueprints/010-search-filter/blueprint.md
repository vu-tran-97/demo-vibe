# Blueprint 010 — Search & Filtering Enhancement

## 1. Overview

### Purpose
Implement a unified global search system and enhanced product filtering to improve product/content discoverability. The existing dashboard header search bar is a non-functional placeholder — this feature transforms it into a full-featured search experience with autocomplete, recent search history, and a dedicated search results page with tabbed sections.

### Scope
- **Global search bar** in dashboard header (replacing the non-functional placeholder)
- **Search results page** at `/dashboard/search` with tabbed sections (Products, Posts)
- **Search autocomplete/suggestions** dropdown with debounced input (300ms)
- **Recent search history** persisted in localStorage
- **Enhanced product filtering**: price range, rating filter, in-stock toggle, multi-category select
- **Sort options**: relevance, price low/high, rating, newest, most sold
- **URL query param sync** for shareable/bookmarkable filter states

### Out of Scope
- Full-text search engine (Elasticsearch/Meilisearch) — uses MongoDB regex/contains for MVP
- Saved search alerts or notifications
- Search analytics dashboard

## 2. Architecture

### 2.1 Backend API Design

#### Search Endpoints (NestJS — `search/` module)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/search?q=keyword` | Public | Global search across products and posts |
| GET | `/api/search/suggest?q=keyword` | Public | Top 5 autocomplete suggestions |

**GET /api/search**
- Query params: `q` (required, min 2 chars), `page`, `limit`
- Returns: `{ products: { items: [...], total: N }, posts: { items: [...], total: N } }`
- Product search: matches `prdNm` (name), `prdDc` (description), `srchTags` (tags) — case-insensitive
- Post search: matches `postTtl` (title), `postCn` (content) — case-insensitive
- Products limited to `prdSttsCd = 'ACTV'` and `delYn = 'N'`
- Posts limited to `delYn = 'N'`

**GET /api/search/suggest**
- Query params: `q` (required, min 1 char)
- Returns: `{ suggestions: [{ type: 'product'|'post', id, title }] }` — max 5 results
- Product suggestions match `prdNm` prefix — returns up to 3
- Post suggestions match `postTtl` prefix — returns up to 2

#### Enhanced Product Listing (existing `GET /api/products`)

New query params added to `ListProductsQueryDto`:

| Param | Type | Description |
|-------|------|-------------|
| `minPrice` | string (number) | Minimum price filter (already exists) |
| `maxPrice` | string (number) | Maximum price filter (already exists) |
| `minRating` | string (number) | Minimum average rating (e.g., "4" for 4+ stars) |
| `inStock` | string ("true"/"false") | Filter to only in-stock products (`stckQty > 0`) |
| `categories` | string (comma-separated) | Multiple categories (e.g., "CERAMICS,ART,JEWELRY") |
| `sort` | string | Added "rating" option (already exists) |

### 2.2 Frontend Architecture

#### Component Hierarchy

```
dashboard/layout.tsx
  └─ GlobalSearchBar (replaces static search input)
       ├─ SearchInput (debounced 300ms)
       ├─ AutocompleteDropdown
       │    ├─ RecentSearches (from localStorage)
       │    └─ SuggestionResults (from /api/search/suggest)
       └─ Navigate to /dashboard/search?q=...

dashboard/search/page.tsx
  ├─ SearchHeader (query display, result counts)
  ├─ TabBar (Products | Posts)
  ├─ ProductResultsGrid (product cards → /dashboard/products/:id)
  └─ PostResultsGrid (post cards → /dashboard/board/:id)

dashboard/products/page.tsx (enhanced)
  ├─ FilterPanel
  │    ├─ PriceRangeInputs (min/max)
  │    ├─ RatingFilter (star buttons: 4+, 3+, 2+, 1+)
  │    ├─ InStockToggle
  │    └─ MultiCategorySelect (checkboxes)
  ├─ SortSelect (enhanced with relevance option)
  └─ URL query param sync (useSearchParams)
```

#### Search Bar Behavior
1. User focuses on search input → show dropdown with recent searches
2. User types (debounced 300ms) → fetch suggestions from `/api/search/suggest`
3. User selects suggestion or presses Enter → navigate to `/dashboard/search?q=...`
4. Search query saved to localStorage recent history (max 10 entries, FIFO)
5. Keyboard shortcut: Cmd+K (Mac) / Ctrl+K (Windows) opens search

#### Filter State ↔ URL Sync
All filter parameters are synced with URL query params using `useSearchParams`:
- `/dashboard/products?categories=CERAMICS,ART&minPrice=10&maxPrice=100&minRating=4&inStock=true&sort=price-low`
- Enables shareable links and browser back/forward navigation
- Filters initialized from URL on page load

### 2.3 Responsive Design

| Breakpoint | Behavior |
|-----------|----------|
| Desktop (1024px+) | Filters shown in sidebar/inline panel, full search bar in header |
| Tablet (768-1023px) | Filters shown inline, search bar visible |
| Mobile (~767px) | Search bar hidden in header (existing), accessible via Cmd+K overlay; filters collapse into toggle panel |

## 3. Data Model

No new collections required. The feature uses existing models:
- `Product` (TB_PROD_PRD) — search fields: `prdNm`, `prdDc`, `srchTags`
- `BoardPost` (TB_COMM_BOARD_POST) — search fields: `postTtl`, `postCn`

## 4. Error Handling

| Scenario | Handling |
|----------|----------|
| Empty search query | Frontend validation — require min 2 chars for search |
| No results | Show empty state with suggestion to broaden search |
| API error | Show error state with retry button |
| Invalid filter values | Backend validation via class-validator, return 400 |

## 5. Performance Considerations

- **Debounce**: 300ms on autocomplete to reduce API calls
- **Pagination**: Search results paginated (default 12 items per tab)
- **localStorage**: Recent searches capped at 10 entries
- **Query optimization**: MongoDB `$or` with regex for search; indexes recommended for production

## 6. Acceptance Criteria

- [ ] Dashboard header search bar is functional (type → autocomplete → navigate)
- [ ] Search results page shows Products and Posts tabs with correct counts
- [ ] Autocomplete dropdown shows top 5 suggestions within 500ms
- [ ] Recent search history persists across sessions (localStorage)
- [ ] Product filters: price range, rating, in-stock, multi-category all work
- [ ] All filter states reflected in URL query params (shareable)
- [ ] Sort options include: relevance, price low/high, rating, newest, most sold
- [ ] Responsive: mobile/tablet/desktop layouts work correctly
- [ ] Filters collapse into toggle panel on mobile
- [ ] Keyboard shortcut Cmd+K opens search focus
