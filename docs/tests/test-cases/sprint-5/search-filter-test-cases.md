# Test Cases — Search & Filtering Enhancement (Sprint 5, Feature 4)

Reference: `docs/blueprints/010-search-filter/blueprint.md`

---

## 1. Global Search API

### TC-SF-001: Search returns products and posts matching keyword
- **Given** active products with name "Ceramic Vase" and posts with title "Ceramic Care Guide" exist
- **When** GET `/api/search?q=ceramic`
- **Then** response contains `products.items` with the matching product and `posts.items` with the matching post
- **And** response includes `products.total` and `posts.total` counts

### TC-SF-002: Search is case-insensitive
- **Given** a product named "Handmade Pottery" exists
- **When** GET `/api/search?q=handmade`
- **Then** the product appears in `products.items`

### TC-SF-003: Search matches product description
- **Given** a product with description "Beautiful handcrafted ceramic bowl"
- **When** GET `/api/search?q=handcrafted`
- **Then** the product appears in `products.items`

### TC-SF-004: Search matches product tags
- **Given** a product with `srchTags: ["vintage", "pottery"]`
- **When** GET `/api/search?q=vintage`
- **Then** the product appears in `products.items`

### TC-SF-005: Search matches post content
- **Given** a post with content "Tips for caring for your ceramic pieces"
- **When** GET `/api/search?q=caring`
- **Then** the post appears in `posts.items`

### TC-SF-006: Search excludes deleted products
- **Given** a product with name "Deleted Item" and `delYn = 'Y'`
- **When** GET `/api/search?q=Deleted`
- **Then** the product does NOT appear in results

### TC-SF-007: Search excludes non-active products
- **Given** a product with name "Draft Product" and `prdSttsCd = 'DRAFT'`
- **When** GET `/api/search?q=Draft`
- **Then** the product does NOT appear in results

### TC-SF-008: Search with no results returns empty arrays
- **Given** no products or posts matching "xyznonexistent123"
- **When** GET `/api/search?q=xyznonexistent123`
- **Then** response contains `products: { items: [], total: 0 }` and `posts: { items: [], total: 0 }`

### TC-SF-009: Search requires minimum 2 characters
- **When** GET `/api/search?q=a`
- **Then** response returns 400 Bad Request with validation error

### TC-SF-010: Search without query param returns 400
- **When** GET `/api/search`
- **Then** response returns 400 Bad Request

---

## 2. Search Suggestions API

### TC-SF-011: Suggest returns top 5 results
- **Given** 10 products with names starting with "Art"
- **When** GET `/api/search/suggest?q=art`
- **Then** response contains at most 5 suggestions

### TC-SF-012: Suggest returns product and post suggestions
- **Given** products with name "Artisan Bowl" and posts with title "Artisan Tips"
- **When** GET `/api/search/suggest?q=artisan`
- **Then** response contains suggestions with `type: 'product'` and `type: 'post'`

### TC-SF-013: Suggest works with single character
- **When** GET `/api/search/suggest?q=c`
- **Then** response returns suggestions matching names starting with "c"

### TC-SF-014: Suggest excludes deleted and inactive items
- **Given** a deleted product with name "Ceramics Set" (`delYn = 'Y'`)
- **When** GET `/api/search/suggest?q=ceramics`
- **Then** the deleted product does NOT appear in suggestions

---

## 3. Enhanced Product Filters API

### TC-SF-015: Filter by minimum rating
- **Given** products with ratings 2.0, 3.5, 4.2, 4.8
- **When** GET `/api/products?minRating=4`
- **Then** only products with `avgRtng >= 4` are returned (4.2, 4.8)

### TC-SF-016: Filter by in-stock only
- **Given** products with stock quantities 0, 5, 10
- **When** GET `/api/products?inStock=true`
- **Then** only products with `stckQty > 0` are returned

### TC-SF-017: Filter by multiple categories
- **Given** products in categories CERAMICS, ART, JEWELRY, HOME
- **When** GET `/api/products?categories=CERAMICS,ART`
- **Then** only CERAMICS and ART products are returned

### TC-SF-018: Combined filters work together
- **Given** various products
- **When** GET `/api/products?categories=CERAMICS&minPrice=10&maxPrice=50&minRating=3&inStock=true`
- **Then** only products matching ALL criteria are returned

### TC-SF-019: Price range filter
- **Given** products priced at 5, 15, 25, 50, 100
- **When** GET `/api/products?minPrice=10&maxPrice=50`
- **Then** only products priced 15, 25, 50 are returned

### TC-SF-020: Sort by rating
- **Given** products with ratings 3.0, 4.5, 2.1
- **When** GET `/api/products?sort=rating`
- **Then** products are ordered by `avgRtng` descending: 4.5, 3.0, 2.1

---

## 4. Frontend — Global Search Bar

### TC-SF-021: Search bar shows autocomplete on type
- **Given** user is on any dashboard page
- **When** user types "cer" in the header search bar
- **Then** after 300ms debounce, an autocomplete dropdown appears with suggestions

### TC-SF-022: Search bar shows recent searches on focus
- **Given** user has previous searches stored in localStorage
- **When** user focuses on the search bar (empty input)
- **Then** recent searches are displayed in the dropdown

### TC-SF-023: Enter key navigates to search results page
- **Given** user has typed "ceramic" in the search bar
- **When** user presses Enter
- **Then** browser navigates to `/dashboard/search?q=ceramic`

### TC-SF-024: Selecting autocomplete suggestion navigates
- **Given** autocomplete dropdown shows "Ceramic Vase" suggestion
- **When** user clicks on the suggestion
- **Then** browser navigates to `/dashboard/search?q=Ceramic Vase`

### TC-SF-025: Recent search is saved to localStorage
- **Given** user searches for "pottery"
- **When** search is submitted
- **Then** "pottery" is added to localStorage recent search list

### TC-SF-026: Recent search list is capped at 10 entries
- **Given** 10 recent searches already exist in localStorage
- **When** user performs a new search for "new item"
- **Then** the oldest search is removed and "new item" is added

### TC-SF-027: Cmd+K keyboard shortcut focuses search bar
- **Given** user is on any dashboard page
- **When** user presses Cmd+K (Mac) or Ctrl+K (Windows)
- **Then** the search bar input is focused

### TC-SF-028: Clear recent search history
- **Given** recent searches exist in dropdown
- **When** user clicks "Clear" button in recent searches section
- **Then** localStorage is cleared and dropdown shows empty recent section

---

## 5. Frontend — Search Results Page

### TC-SF-029: Search results page displays tabs
- **Given** user navigates to `/dashboard/search?q=ceramic`
- **When** page loads
- **Then** two tabs are displayed: "Products (N)" and "Posts (N)" with counts

### TC-SF-030: Products tab shows product cards
- **Given** search for "ceramic" returns 3 products
- **When** user is on the Products tab
- **Then** 3 product cards are displayed with name, price, image, rating

### TC-SF-031: Product card links to product detail
- **Given** product card for product with id "abc123" is displayed
- **When** user clicks the card
- **Then** browser navigates to `/dashboard/products/abc123`

### TC-SF-032: Posts tab shows post cards
- **Given** search for "ceramic" returns 2 posts
- **When** user clicks the Posts tab
- **Then** 2 post cards are displayed with title, excerpt, author, date

### TC-SF-033: Post card links to board detail
- **Given** post card for post with id "post123" is displayed
- **When** user clicks the card
- **Then** browser navigates to `/dashboard/board/post123`

### TC-SF-034: Empty search results show helpful message
- **Given** search for "xyznonexistent" returns 0 results
- **When** page loads
- **Then** an empty state message is displayed suggesting to broaden the search

---

## 6. Frontend — Enhanced Product Filters

### TC-SF-035: Price range inputs filter products
- **Given** user is on `/dashboard/products`
- **When** user enters "10" in min price and "50" in max price
- **Then** product list updates to show only products priced $10-$50
- **And** URL updates to include `minPrice=10&maxPrice=50`

### TC-SF-036: Rating filter buttons work
- **Given** user is on `/dashboard/products`
- **When** user clicks the "4+" rating filter button
- **Then** only products with 4+ star rating are shown
- **And** URL updates to include `minRating=4`

### TC-SF-037: In-stock toggle filters out-of-stock products
- **Given** user is on `/dashboard/products`
- **When** user toggles the "In Stock" switch on
- **Then** only products with stock > 0 are shown
- **And** URL updates to include `inStock=true`

### TC-SF-038: Multi-category checkboxes work
- **Given** user is on `/dashboard/products`
- **When** user checks "Ceramics" and "Art" category checkboxes
- **Then** only CERAMICS and ART products are shown
- **And** URL updates to include `categories=CERAMICS,ART`

### TC-SF-039: Filters persist via URL on page refresh
- **Given** URL is `/dashboard/products?minRating=3&inStock=true&categories=CERAMICS`
- **When** user refreshes the page
- **Then** filters are restored from URL: rating 3+, in-stock toggle on, CERAMICS checked

### TC-SF-040: Clear all filters resets to default state
- **Given** multiple filters are active
- **When** user clicks "Clear Filters" button
- **Then** all filters are reset and URL query params are cleared

---

## 7. Responsive Design

### TC-SF-041: Filters collapse on mobile
- **Given** viewport width is less than 768px
- **When** user is on `/dashboard/products`
- **Then** filters are hidden behind a "Filters" toggle button

### TC-SF-042: Filter panel opens on mobile toggle
- **Given** mobile viewport, filters are collapsed
- **When** user taps the "Filters" toggle button
- **Then** filter panel slides open showing all filter options

### TC-SF-043: Search results page is responsive
- **Given** viewport width is less than 768px
- **When** user views search results
- **Then** product cards display in a single column grid
- **And** tab bar is fully visible

### TC-SF-044: Search bar hidden on mobile uses overlay
- **Given** viewport width is less than 768px
- **When** user presses Cmd+K or taps the search icon
- **Then** a full-screen search overlay appears

---

## 8. Sort Options

### TC-SF-045: Sort by relevance on search results
- **Given** user searches for "ceramic vase"
- **When** sort is set to "Relevance" (default on search)
- **Then** products matching the name exactly appear first

### TC-SF-046: Sort by price low to high
- **Given** products priced at 50, 10, 30
- **When** user selects "Price: Low to High"
- **Then** products are displayed in order: 10, 30, 50

### TC-SF-047: Sort by newest
- **Given** products created on different dates
- **When** user selects "Newest"
- **Then** most recently created products appear first

### TC-SF-048: Sort by most sold
- **Given** products with sold counts 5, 100, 20
- **When** user selects "Most Popular"
- **Then** products are displayed in order: 100, 20, 5
