# 004-Product: Product Management Module Blueprint

> Complete product management system — seller product registration (CRUD), public product listing with search/filter/sort/pagination, product detail view, image management, and status lifecycle for the Vibe e-commerce platform.

## 1. Overview

### 1.1 Purpose
Enable sellers to register and manage products on the Vibe e-commerce platform. Buyers and visitors can browse, search, and filter products by category and price. This module replaces the current mock data (`src/lib/products.ts`) with a real backend-powered product system, connecting the existing frontend product pages to API endpoints backed by MongoDB via Prisma.

### 1.2 Scope
- Seller product registration (title, description, price, sale price, category, images, stock, tags)
- Product CRUD operations for sellers (create, read, update, delete own products)
- Product status lifecycle: DRAFT, ACTIVE, SOLD_OUT, HIDDEN
- Product image management (up to 5 images, first image = thumbnail)
- Seller dashboard: manage own products with status toggle
- Public product listing with search, category filter, price sort, pagination
- Product detail page accessible to all users (authenticated or not)
- View count tracking on product detail access
- Role-based access control (SELLER/SUPER_ADMIN can write, all users can read)
- Category management via code table (code group: PRDT_CTGR)

### 1.3 Out of Scope
- Product reviews and ratings system (future sprint)
- Shopping cart and checkout flow (future sprint)
- Product variant management (size, color) (future sprint)
- Inventory management with low-stock alerts (future sprint)
- Product import/export (CSV/Excel) (future sprint)
- Product analytics dashboard (future sprint)
- Image upload to cloud storage (S3/GCS) — this sprint stores URLs only; actual file upload integration is deferred

### 1.4 Tech Stack
| Layer | Technology |
|-------|-----------|
| Backend Framework | NestJS (TypeScript) |
| ORM | Prisma (MongoDB Adapter) |
| Database | MongoDB 7 (replica set) |
| Validation | class-validator, class-transformer |
| Frontend Framework | Next.js 15 (App Router, Server Components) |
| Styling | CSS Modules + Design Tokens (CSS Custom Properties) |
| Forms | React Hook Form + Zod validation |
| Icons | Lucide React |
| Notifications | Sonner (toast library) |

### 1.5 Dependencies
| Module | Dependency |
|--------|-----------|
| 001-auth | JWT authentication, auth context (`useAuth`), JwtAuthGuard, token refresh |
| 002-rbac | RolesGuard, @Roles decorator, role-based route protection |
| Prisma | Product model already defined in `prisma/schema.prisma` (collection: `TB_PROD_PRD`) |
| Code Table | `TC_COMM_CD` — code groups `PRDT_STTS` (product status) and `PRDT_CTGR` (product category) |

---

## 2. Architecture

### 2.1 Backend Module Structure

```
server/src/
├── product/
│   ├── product.module.ts              # Module definition, imports PrismaModule
│   ├── product.controller.ts          # REST endpoints (api/products)
│   ├── product.service.ts             # Business logic, Prisma queries
│   ├── dto/
│   │   ├── create-product.dto.ts      # Create product validation
│   │   ├── update-product.dto.ts      # Update product validation (PartialType)
│   │   ├── product-query.dto.ts       # List query params (search, filter, sort, pagination)
│   │   └── product-response.dto.ts    # Response DTOs (list item, detail)
│   └── product.constants.ts           # Status/category code constants
```

### 2.2 Frontend Structure

```
src/
├── app/
│   └── dashboard/
│       └── products/
│           ├── page.tsx                    # Public product list (refactor from mock to API)
│           ├── products.module.css         # Product list styles (existing, extend)
│           ├── loading.tsx                 # Loading skeleton
│           ├── [id]/
│           │   ├── page.tsx               # Product detail (refactor from mock to API)
│           │   ├── detail.module.css       # Detail styles (existing, extend)
│           │   └── loading.tsx             # Detail loading skeleton
│           └── manage/
│               ├── page.tsx               # Seller product management list
│               ├── manage.module.css       # Management list styles
│               ├── new/
│               │   ├── page.tsx           # Create product form
│               │   └── form.module.css    # Form styles
│               └── [id]/
│                   └── edit/
│                       ├── page.tsx       # Edit product form
│                       └── form.module.css # Form styles (shared with new)
├── components/
│   └── product/
│       ├── product-card.tsx               # Product card (public listing)
│       ├── product-form.tsx               # Shared create/edit form component
│       ├── product-status-badge.tsx       # Status badge (DRAFT/ACTIVE/SOLD_OUT/HIDDEN)
│       ├── product-category-badge.tsx     # Category badge
│       ├── product-image-upload.tsx       # Image URL input with preview (up to 5)
│       ├── product-filters.tsx            # Search + category + sort controls
│       └── product-table.tsx              # Seller management table
├── lib/
│   ├── product-api.ts                     # Product API fetch functions
│   └── product-types.ts                   # TypeScript types
└── hooks/
    └── use-products.ts                    # Custom hook for product list state
```

### 2.3 Module Dependency Diagram

```
┌──────────────────────────────────────┐
│           AppModule                   │
│  ┌──────────┐  ┌──────────────────┐  │
│  │ AuthModule│  │ ProductModule    │  │
│  │          │──▶│  Controller      │  │
│  │ JwtGuard │  │  Service         │  │
│  │ RolesGuard│  │  DTOs           │  │
│  └──────────┘  └────────┬─────────┘  │
│                         │            │
│  ┌──────────────────────▼─────────┐  │
│  │       PrismaModule             │  │
│  │    PrismaService (MongoDB)     │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

---

## 3. API Endpoints

### 3.1 Public Endpoints (No Auth Required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/products` | List products (public, only ACTIVE status) |
| GET | `/api/products/:id` | Get product detail (increments view count) |
| GET | `/api/products/categories` | Get available product categories |

### 3.2 Seller Endpoints (SELLER, SUPER_ADMIN)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/products/my` | List seller's own products (all statuses) |
| POST | `/api/products` | Create a new product |
| PATCH | `/api/products/:id` | Update product |
| PATCH | `/api/products/:id/status` | Toggle product status |
| DELETE | `/api/products/:id` | Soft delete product (set status to HIDDEN) |

### 3.3 Endpoint Specifications

#### GET /api/products (Public Listing)

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 12 | Items per page (max: 48) |
| `search` | string | - | Search in product name, description, tags |
| `category` | string | - | Filter by category code (e.g., CERAMICS) |
| `sort` | string | `newest` | Sort: `newest`, `popular`, `price-low`, `price-high`, `rating` |
| `minPrice` | number | - | Minimum price filter |
| `maxPrice` | number | - | Maximum price filter |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "6801...",
        "prdNm": "Handcrafted Ceramic Vase",
        "prdDc": "A beautifully hand-thrown ceramic vase...",
        "prdPrc": 128.00,
        "prdSalePrc": null,
        "prdCtgrCd": "CERAMICS",
        "prdSttsCd": "ACTV",
        "prdImgUrl": "https://...ceramic-vase.jpg",
        "soldCnt": 142,
        "viewCnt": 2840,
        "avgRtng": 4.8,
        "rvwCnt": 56,
        "srchTags": ["ceramic", "vase", "handmade"],
        "seller": {
          "id": "6800...",
          "name": "Minji Kim",
          "nickname": "minji_ceramics"
        },
        "createdAt": "2026-03-01T09:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 48,
      "totalPages": 4
    }
  }
}
```

#### GET /api/products/:id (Product Detail)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "6801...",
    "prdNm": "Handcrafted Ceramic Vase",
    "prdDc": "A beautifully hand-thrown ceramic vase with a unique speckled glaze...",
    "prdPrc": 128.00,
    "prdSalePrc": null,
    "prdCtgrCd": "CERAMICS",
    "prdSttsCd": "ACTV",
    "prdImgUrl": "https://...ceramic-vase.jpg",
    "prdImgUrls": [
      "https://...ceramic-vase.jpg",
      "https://...ceramic-vase-2.jpg",
      "https://...ceramic-vase-3.jpg"
    ],
    "stckQty": 12,
    "soldCnt": 142,
    "viewCnt": 2841,
    "avgRtng": 4.8,
    "rvwCnt": 56,
    "srchTags": ["ceramic", "vase", "handmade", "pottery", "korean"],
    "seller": {
      "id": "6800...",
      "name": "Minji Kim",
      "nickname": "minji_ceramics",
      "profileImageUrl": "https://..."
    },
    "createdAt": "2026-03-01T09:00:00Z",
    "updatedAt": "2026-03-15T14:30:00Z"
  }
}
```

**Error (404):**
```json
{
  "success": false,
  "error": "PRODUCT_NOT_FOUND",
  "message": "Product not found"
}
```

#### GET /api/products/categories

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "code": "CERAMICS", "label": "Ceramics & Pottery" },
    { "code": "TEXTILES", "label": "Textiles & Fabrics" },
    { "code": "ART", "label": "Art & Prints" },
    { "code": "JEWELRY", "label": "Jewelry & Accessories" },
    { "code": "HOME", "label": "Home & Living" },
    { "code": "FOOD", "label": "Food & Beverages" }
  ]
}
```

#### GET /api/products/my (Seller's Products)

**Auth:** Required (SELLER, SUPER_ADMIN)

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page (max: 50) |
| `status` | string | - | Filter by status (DRAFT, ACTV, SOLD_OUT, HIDN) |
| `search` | string | - | Search in product name |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "6801...",
        "prdNm": "Handcrafted Ceramic Vase",
        "prdPrc": 128.00,
        "prdSalePrc": null,
        "prdCtgrCd": "CERAMICS",
        "prdSttsCd": "ACTV",
        "prdImgUrl": "https://...ceramic-vase.jpg",
        "stckQty": 12,
        "soldCnt": 142,
        "viewCnt": 2840,
        "createdAt": "2026-03-01T09:00:00Z",
        "updatedAt": "2026-03-15T14:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 8,
      "totalPages": 1
    }
  }
}
```

#### POST /api/products (Create Product)

**Auth:** Required (SELLER, SUPER_ADMIN)

**Request Body:**
```json
{
  "prdNm": "Handcrafted Ceramic Vase",
  "prdDc": "A beautifully hand-thrown ceramic vase...",
  "prdPrc": 128.00,
  "prdSalePrc": null,
  "prdCtgrCd": "CERAMICS",
  "prdImgUrl": "https://...ceramic-vase.jpg",
  "prdImgUrls": [
    "https://...ceramic-vase.jpg",
    "https://...ceramic-vase-2.jpg"
  ],
  "stckQty": 12,
  "srchTags": ["ceramic", "vase", "handmade"]
}
```

**Validation Rules:**
| Field | Rule |
|-------|------|
| `prdNm` | Required, string, 2-200 characters |
| `prdDc` | Required, string, 10-5000 characters |
| `prdPrc` | Required, number, min 0.01 |
| `prdSalePrc` | Optional, number, must be less than `prdPrc` |
| `prdCtgrCd` | Required, must be valid category code |
| `prdImgUrl` | Required, valid URL |
| `prdImgUrls` | Required, array of valid URLs, min 1, max 5 |
| `stckQty` | Required, integer, min 0 |
| `srchTags` | Optional, array of strings, max 10 tags, each max 30 chars |

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "6801...",
    "prdNm": "Handcrafted Ceramic Vase",
    "prdSttsCd": "DRAFT",
    "createdAt": "2026-03-17T10:00:00Z"
  }
}
```

**Notes:**
- New products default to `DRAFT` status
- `sellerId` is extracted from the JWT token (not passed in body)
- `prdImgUrl` should match the first element of `prdImgUrls`

#### PATCH /api/products/:id (Update Product)

**Auth:** Required (SELLER owner or SUPER_ADMIN)

**Request Body:** Partial of create body (all fields optional).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "6801...",
    "prdNm": "Updated Ceramic Vase",
    "updatedAt": "2026-03-17T11:00:00Z"
  }
}
```

**Error (403):**
```json
{
  "success": false,
  "error": "FORBIDDEN",
  "message": "You can only edit your own products"
}
```

#### PATCH /api/products/:id/status (Toggle Status)

**Auth:** Required (SELLER owner or SUPER_ADMIN)

**Request Body:**
```json
{
  "prdSttsCd": "ACTV"
}
```

**Allowed Transitions:**
| From | To |
|------|----|
| DRAFT | ACTV |
| ACTV | HIDN |
| ACTV | SOLD_OUT (auto when stckQty = 0) |
| HIDN | ACTV |
| SOLD_OUT | ACTV (only if stckQty > 0) |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "6801...",
    "prdSttsCd": "ACTV",
    "updatedAt": "2026-03-17T11:30:00Z"
  }
}
```

#### DELETE /api/products/:id (Soft Delete)

**Auth:** Required (SELLER owner or SUPER_ADMIN)

Sets product status to `HIDN` and marks as deleted. Does not physically remove the record.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "6801...",
    "prdSttsCd": "HIDN",
    "deletedAt": "2026-03-17T12:00:00Z"
  }
}
```

---

## 4. Component Design

### 4.1 Component Tree

```
Public Product Listing (/dashboard/products)
└── ProductsPage (Server Component — initial data fetch)
    └── ProductsPageClient (Client Component — interactivity)
        ├── ProductFilters
        │   ├── SearchInput (debounced search)
        │   ├── CategoryFilter (pill buttons)
        │   └── SortSelect (dropdown)
        ├── ProductGrid
        │   └── ProductCard (per item)
        │       ├── ProductImage
        │       ├── ProductCategoryBadge
        │       └── PriceDisplay (with sale indicator)
        ├── Pagination
        └── EmptyState / LoadingSkeleton

Product Detail (/dashboard/products/[id])
└── ProductDetailPage (Server Component)
    └── ProductDetailClient (Client Component)
        ├── ProductImageGallery (main image + thumbnails)
        ├── ProductInfo
        │   ├── ProductCategoryBadge
        │   ├── PriceDisplay
        │   ├── StockIndicator
        │   └── TagList
        ├── SellerInfo (avatar + name + link)
        └── ProductStats (views, sold, rating)

Seller Product Management (/dashboard/products/manage)
└── ManageProductsPage (Server Component)
    └── ManageProductsClient (Client Component)
        ├── ManageProductFilters
        │   ├── SearchInput
        │   └── StatusFilter (dropdown)
        ├── CreateProductButton → navigates to /manage/new
        ├── ProductTable (desktop)
        │   └── ProductRow
        │       ├── ProductStatusBadge
        │       ├── StatusToggleButton
        │       └── ActionMenu (edit, delete)
        ├── ProductCardList (mobile)
        │   └── ManageProductCard
        └── Pagination

Product Form (/dashboard/products/manage/new, /manage/[id]/edit)
└── ProductFormPage (Client Component)
    └── ProductForm (shared create/edit)
        ├── TextInput (name)
        ├── TextArea (description)
        ├── NumberInput (price, sale price, stock)
        ├── CategorySelect (dropdown from code table)
        ├── ProductImageUpload (URL inputs + preview, max 5)
        ├── TagInput (comma-separated or chip input)
        └── FormActions (Save as Draft, Publish, Cancel)
```

### 4.2 Component Specifications

#### ProductCard

| Property | Detail |
|----------|--------|
| Props | `product: ProductListItem` |
| Layout | Vertical card — image top, info bottom |
| Image | 1:1 aspect ratio, `object-fit: cover`, lazy loading |
| Sale indicator | Diagonal ribbon or badge when `prdSalePrc` exists |
| Price | Original price with strikethrough when on sale, sale price in accent color |
| Hover | Subtle scale (1.02) + shadow elevation transition |
| Click | Navigates to `/dashboard/products/{id}` |

#### ProductForm

| Property | Detail |
|----------|--------|
| Props | `mode: 'create' | 'edit'`, `initialData?: Product` |
| Validation | React Hook Form + Zod schema |
| Image upload | Up to 5 URL inputs, drag to reorder, first = thumbnail |
| Tags | Chip input — type and press Enter to add, click X to remove |
| Actions | "Save as Draft" (DRAFT status), "Publish" (ACTV status), "Cancel" |
| On submit | POST (create) or PATCH (edit) via product API |

#### ProductStatusBadge

| Property | Detail |
|----------|--------|
| Props | `status: string` |
| Colors | `DRAFT` = gray bg + gray text |
| | `ACTV` = green bg + green text |
| | `SOLD_OUT` = orange bg + orange text |
| | `HIDN` = red bg + red text |
| Style | Rounded pill, `font-size: 0.75rem`, `font-weight: 500` |

#### ProductCategoryBadge

| Property | Detail |
|----------|--------|
| Props | `categoryCode: string` |
| Rendering | Looks up label from category list (e.g., `CERAMICS` -> `Ceramics & Pottery`) |
| Style | Subtle outline badge, category-specific accent color |

#### ProductImageGallery

| Property | Detail |
|----------|--------|
| Props | `images: string[]` |
| Layout | Large main image + horizontal thumbnail strip below |
| Interaction | Click thumbnail to swap main image |
| Mobile | Horizontal swipe carousel for main image |
| Fallback | Placeholder image if URL fails to load |

#### ProductImageUpload

| Property | Detail |
|----------|--------|
| Props | `value: string[]`, `onChange(urls: string[])`, `max: number` |
| Inputs | URL text inputs with image preview |
| Limit | Max 5 images, show "Add image" button until limit reached |
| Reorder | Drag handle to reorder; first image auto-sets as thumbnail |
| Preview | 80x80 thumbnail preview next to each URL input |
| Validation | Must be valid URL format |

---

## 5. Data Flow

### 5.1 Create Product Flow

```
Seller navigates to /dashboard/products/manage/new
    -> ProductForm renders (empty state, mode="create")
    -> Seller fills in all fields
    -> Clicks "Save as Draft" or "Publish"
    -> Client-side Zod validation runs
    -> On valid: POST /api/products with JWT
        -> Backend validates DTO (class-validator)
        -> Backend extracts sellerId from JWT
        -> Backend creates product in MongoDB (status = DRAFT or ACTV)
        -> Returns { success: true, data: { id, prdNm, prdSttsCd } }
    -> On 201: toast "Product created", redirect to /dashboard/products/manage
    -> On 400: show inline validation errors
    -> On 401: redirect to login
    -> On 403: toast "Only sellers can create products"
```

### 5.2 List/Filter Products Flow (Public)

```
User navigates to /dashboard/products
    -> Server Component fetches GET /api/products?page=1&limit=12&sort=newest
    -> Renders initial product grid via SSR
    -> Hydrates ProductsPageClient with initial data
    -> User types search / selects category / changes sort
    -> URL params update (?search=ceramic&category=CERAMICS&sort=price-low&page=1)
    -> useEffect detects param change
    -> Client-side fetch to /api/products with updated params
    -> Loading state shown (skeleton cards or opacity overlay)
    -> Response received, grid re-renders with filtered data
    -> Pagination updates to reflect new total
```

### 5.3 View Product Detail Flow

```
User clicks ProductCard
    -> Navigates to /dashboard/products/[id]
    -> Server Component fetches GET /api/products/:id
        -> Backend increments viewCnt atomically (Prisma update)
        -> Returns full product detail with seller info
    -> Renders product detail page via SSR
    -> Image gallery initializes with first image as main
    -> User can click thumbnails or swipe to view other images
```

### 5.4 Edit Product Flow

```
Seller clicks "Edit" on product row in manage page
    -> Navigates to /dashboard/products/manage/[id]/edit
    -> Page fetches GET /api/products/:id
    -> ProductForm renders with initialData (mode="edit")
    -> Seller modifies fields
    -> Clicks "Save"
    -> PATCH /api/products/:id with changed fields only
        -> Backend verifies sellerId matches JWT user (or SUPER_ADMIN)
        -> Updates product in MongoDB
    -> On 200: toast "Product updated", redirect to manage page
    -> On 403: toast "You can only edit your own products"
```

### 5.5 Delete Product Flow

```
Seller clicks "Delete" on product row
    -> ConfirmActionModal opens: "Delete this product?"
    -> Seller confirms
    -> DELETE /api/products/:id
        -> Backend verifies ownership
        -> Sets prdSttsCd = 'HIDN', sets deletedAt timestamp
    -> On 200: remove from list, toast "Product deleted"
    -> On 403: toast "You can only delete your own products"
```

### 5.6 Status Toggle Flow

```
Seller clicks status toggle button on product row
    -> If DRAFT -> "Publish" action (set to ACTV)
    -> If ACTV -> "Hide" action (set to HIDN)
    -> If HIDN -> "Reactivate" action (set to ACTV)
    -> If SOLD_OUT -> "Restock" prompt (must update stckQty first)
    -> PATCH /api/products/:id/status { prdSttsCd: 'ACTV' }
    -> On 200: update badge inline, toast "Product is now active"
    -> On 400: toast with reason (e.g., "Cannot activate: stock is 0")
```

---

## 6. UI/UX Design

### 6.1 Public Product List Page

**Desktop View:**
```
+-------------------------------------------------------------------+
|  Sidebar (240px)  |  Products                                      |
|                   |                                                 |
|  Dashboard        |  [Search products...                        ]  |
|  Products  <      |                                                 |
|  Orders           |  [All] [Ceramics] [Textiles] [Art] [Jewelry]   |
|  ...              |  [Home] [Food]          Sort: [Newest       v]  |
|                   |                                                 |
|                   |  +--------+  +--------+  +--------+  +--------+|
|                   |  |  img   |  |  img   |  |  img   |  |  img   ||
|                   |  |        |  |  SALE  |  |        |  |        ||
|                   |  |--------|  |--------|  |--------|  |--------||
|                   |  |Ceramic |  |Linen   |  |Coffee  |  |Botanic ||
|                   |  |Vase    |  |Runner  |  |Set     |  |Print   ||
|                   |  |$128.00 |  |~$64~$48|  |$96.00  |  |$42.00  ||
|                   |  |*4.8(56)|  |*4.6(38)|  |*4.9(42)|  |*4.7(29)||
|                   |  +--------+  +--------+  +--------+  +--------+|
|                   |  +--------+  +--------+  +--------+  +--------+|
|                   |  |  ...   |  |  ...   |  |  ...   |  |  ...   ||
|                   |  +--------+  +--------+  +--------+  +--------+|
|                   |                                                 |
|                   |       < 1  2  3  4 >    48 products             |
+-------------------------------------------------------------------+
```

**Mobile View:**
```
+---------------------------+
| = Products         [?]    |
+---------------------------+
| [Search products...     ] |
| [All] [Ceramics] [Art] > |
| Sort: [Newest         v]  |
+---------------------------+
| +----------+ +----------+ |
| |   img    | |   img    | |
| |Ceramic   | |Linen     | |
| |Vase      | |Runner    | |
| |$128.00   | |~$64~ $48 | |
| +----------+ +----------+ |
| +----------+ +----------+ |
| |   img    | |   img    | |
| |Coffee Set| |Botanical | |
| |$96.00    | |$42.00    | |
| +----------+ +----------+ |
|                           |
|     < 1 2 3 4 >           |
+---------------------------+
```

### 6.2 Product Detail Page

**Desktop View:**
```
+-------------------------------------------------------------------+
|  Sidebar  |  < Back to Products                                    |
|           |                                                        |
|           |  +------------------+  Product Name Here               |
|           |  |                  |  Ceramics & Pottery              |
|           |  |   Main Image     |                                  |
|           |  |                  |  $128.00                         |
|           |  |                  |  (or ~$64.00~ $48.00 SALE)       |
|           |  +------------------+                                  |
|           |  [thumb1][thumb2][thumb3]                               |
|           |                        In Stock (12 available)         |
|           |                        142 sold  |  2,840 views        |
|           |                        *4.8 (56 reviews)               |
|           |                                                        |
|           |  --- Description ---                                   |
|           |  A beautifully hand-thrown ceramic vase with...         |
|           |                                                        |
|           |  --- Tags ---                                          |
|           |  [ceramic] [vase] [handmade] [pottery] [korean]        |
|           |                                                        |
|           |  --- Seller ---                                        |
|           |  [avatar] Minji Kim (@minji_ceramics)                  |
+-------------------------------------------------------------------+
```

### 6.3 Seller Product Management Page

**Desktop View:**
```
+-------------------------------------------------------------------+
|  Sidebar  |  My Products                          [+ New Product]  |
|           |                                                        |
|           |  [Search...           ]  Status: [All          v]      |
|           |                                                        |
|           |  +------+--------+------+-------+------+------+------+ |
|           |  |Image |Name    |Price |Status |Stock |Sold  |Action| |
|           |  +------+--------+------+-------+------+------+------+ |
|           |  |[img] |Ceramic |$128  | ACTV  | 12   | 142  |[...] | |
|           |  |[img] |Coffee  |$96   | DRAFT | 8    | 0    |[...] | |
|           |  |[img] |Plates  |$156  | HIDN  | 15   | 54   |[...] | |
|           |  +------+--------+------+-------+------+------+------+ |
|           |                                                        |
|           |       < 1 >    3 products                              |
+-------------------------------------------------------------------+
```

### 6.4 Design Token Usage

| Element | Token |
|---------|-------|
| Page background | `--color-surface` |
| Card background | `--color-background` (white) |
| Card border | `--color-border` |
| Card shadow | `--shadow-sm` (default), `--shadow-md` (hover) |
| Page title | `--font-size-2xl`, `--font-weight-bold` |
| Product name (card) | `--font-size-sm`, `--font-weight-medium` |
| Product name (detail) | `--font-size-2xl`, `--font-weight-bold` |
| Price text | `--font-size-lg`, `--font-weight-semibold` |
| Sale price | `--color-error` (red accent) |
| Original price (struck) | `--color-gray-400`, `text-decoration: line-through` |
| Category pill active | `--color-primary-500` bg, `--color-background` text |
| Category pill inactive | `--color-background` bg, `--color-gray-600` text, `--color-border` border |
| Rating star | `--color-warning` (amber/yellow) |
| Search input | Height 40px, `--color-border`, `--radius-md` |
| Grid gap | `--spacing-6` (24px) |
| Card padding | `--spacing-4` (16px) for info section |
| Card border radius | `--radius-lg` |
| Table cell padding | `--spacing-3` vertical, `--spacing-4` horizontal |
| Row hover | `--color-gray-50` |

### 6.5 Responsive Behavior

| Breakpoint | Layout | Details |
|------------|--------|---------|
| Desktop (1024px+) | 4-column product grid | Sidebar visible, full table for manage page |
| Tablet (768-1023px) | 3-column product grid | Sidebar collapsed, simplified manage table |
| Mobile (~767px) | 2-column product grid | No sidebar, card list for manage page |

### 6.6 Product Grid Columns

| Breakpoint | Grid Columns | Card Width |
|------------|-------------|------------|
| 1024px+ | 4 | ~220px |
| 768-1023px | 3 | ~230px |
| ~767px | 2 | ~165px |

---

## 7. Security

### 7.1 Authentication

| Measure | Implementation |
|---------|---------------|
| Public endpoints | GET `/api/products` and GET `/api/products/:id` require no auth |
| Protected endpoints | All write operations require valid JWT via `JwtAuthGuard` |
| Token handling | Frontend sends `Authorization: Bearer {token}` header |
| Token refresh | Auto-refresh on 401 via existing auth interceptor |

### 7.2 Authorization

| Measure | Implementation |
|---------|---------------|
| Role guard | `@Roles('SELLER', 'SUPER_ADMIN')` on create/update/delete endpoints |
| Ownership check | Service verifies `product.sellerId === currentUser.id` on update/delete |
| SUPER_ADMIN bypass | SUPER_ADMIN can edit/delete any product (for moderation) |
| Frontend guard | "My Products" and product form pages check role from auth context |

### 7.3 Input Validation

| Field | Client-Side (Zod) | Server-Side (class-validator) |
|-------|-------------------|-------------------------------|
| prdNm | `z.string().min(2).max(200)` | `@IsString()`, `@MinLength(2)`, `@MaxLength(200)` |
| prdDc | `z.string().min(10).max(5000)` | `@IsString()`, `@MinLength(10)`, `@MaxLength(5000)` |
| prdPrc | `z.number().min(0.01)` | `@IsNumber()`, `@Min(0.01)` |
| prdSalePrc | `z.number().min(0.01).optional()` | `@IsOptional()`, `@IsNumber()`, `@Min(0.01)` |
| prdCtgrCd | `z.enum([...categories])` | `@IsIn([...categories])` |
| prdImgUrl | `z.string().url()` | `@IsUrl()` |
| prdImgUrls | `z.array(z.string().url()).min(1).max(5)` | `@IsArray()`, `@ArrayMinSize(1)`, `@ArrayMaxSize(5)`, `@IsUrl({}, { each: true })` |
| stckQty | `z.number().int().min(0)` | `@IsInt()`, `@Min(0)` |
| srchTags | `z.array(z.string().max(30)).max(10).optional()` | `@IsOptional()`, `@IsArray()`, `@ArrayMaxSize(10)`, `@MaxLength(30, { each: true })` |

### 7.4 Additional Security Measures

| Measure | Implementation |
|---------|---------------|
| XSS | All user content rendered via React JSX (auto-escaped) |
| SQL/NoSQL injection | Prisma parameterized queries prevent injection |
| Rate limiting | Consider rate limiting on POST/PATCH endpoints (future enhancement) |
| Image URLs | Validate URL format; display via `<img>` tag (no script execution risk) |

---

## 8. Error Handling

### 8.1 Business Exceptions

| Error Code | HTTP Status | Condition |
|------------|-------------|-----------|
| `PRODUCT_NOT_FOUND` | 404 | Product ID does not exist |
| `FORBIDDEN` | 403 | User tries to edit/delete another seller's product |
| `INVALID_STATUS_TRANSITION` | 400 | Invalid status change (e.g., DRAFT -> SOLD_OUT) |
| `CANNOT_ACTIVATE_NO_STOCK` | 400 | Cannot set ACTV when stckQty = 0 |
| `INVALID_CATEGORY` | 400 | Category code not in allowed values |
| `SALE_PRICE_EXCEEDS_PRICE` | 400 | Sale price >= regular price |
| `MAX_IMAGES_EXCEEDED` | 400 | More than 5 images provided |

### 8.2 Error Response Format

All errors follow the standard response format:

```json
{
  "success": false,
  "error": "PRODUCT_NOT_FOUND",
  "message": "Product not found"
}
```

### 8.3 Frontend Error Display

| Error Type | Display Method |
|------------|---------------|
| Network error | Toast: "Network error. Please check your connection." |
| 401 Unauthorized | Redirect to login page (auto token refresh first) |
| 403 Forbidden | Toast: "You don't have permission to perform this action" |
| 404 Not Found | Toast: "Product not found" + redirect to product list |
| 400 Validation | Inline field errors mapped from API response |
| 500+ Server Error | Toast: "Something went wrong. Please try again." |

### 8.4 Toast Messages

| Action | Success Message | Error Message |
|--------|----------------|---------------|
| Create product | "Product created successfully" | "Failed to create product: {reason}" |
| Update product | "Product updated successfully" | "Failed to update product: {reason}" |
| Delete product | "Product has been deleted" | "Failed to delete product: {reason}" |
| Status change | "Product is now {status}" | "Failed to update status: {reason}" |

### 8.5 Loading States

| Component | Loading Indicator |
|-----------|------------------|
| Product list (initial) | `loading.tsx` skeleton (grid of placeholder cards) |
| Product list (filter) | Grid opacity reduced (0.6) + spinner overlay |
| Product detail (initial) | `loading.tsx` skeleton (image + text blocks) |
| Product form submit | Button disabled + spinner icon |
| Status toggle | Badge shows spinner, optimistic update |

---

## 9. File Structure

### 9.1 Backend

```
server/src/product/
├── product.module.ts                  # Module: imports PrismaModule, provides Service
├── product.controller.ts             # 7 endpoints (3 public + 4 seller)
├── product.service.ts                # Business logic, Prisma queries, ownership checks
├── product.constants.ts              # PRODUCT_STATUS, PRODUCT_CATEGORY enums/maps
└── dto/
    ├── create-product.dto.ts         # CreateProductDto with class-validator decorators
    ├── update-product.dto.ts         # UpdateProductDto (PartialType of Create)
    ├── update-product-status.dto.ts  # UpdateProductStatusDto
    ├── product-query.dto.ts          # ProductQueryDto (pagination, search, filter, sort)
    └── product-response.dto.ts       # ProductListItemDto, ProductDetailDto
```

### 9.2 Frontend

```
src/
├── app/
│   └── dashboard/
│       └── products/
│           ├── page.tsx                        # Public product listing (refactored)
│           ├── products.module.css             # Product list styles (extend existing)
│           ├── loading.tsx                     # Grid skeleton
│           ├── [id]/
│           │   ├── page.tsx                   # Product detail (refactored)
│           │   ├── detail.module.css          # Detail styles (extend existing)
│           │   └── loading.tsx                # Detail skeleton
│           └── manage/
│               ├── page.tsx                   # Seller management list
│               ├── manage.module.css          # Management styles
│               ├── loading.tsx                # Management skeleton
│               ├── new/
│               │   └── page.tsx              # Create product page
│               └── [id]/
│                   └── edit/
│                       └── page.tsx          # Edit product page
├── components/
│   └── product/
│       ├── product-card.tsx                   # Product card for public grid
│       ├── product-card.module.css            # Card styles
│       ├── product-form.tsx                   # Shared create/edit form
│       ├── product-form.module.css            # Form styles
│       ├── product-status-badge.tsx           # Status badge component
│       ├── product-category-badge.tsx         # Category badge component
│       ├── product-image-gallery.tsx          # Image gallery with thumbnails
│       ├── product-image-gallery.module.css   # Gallery styles
│       ├── product-image-upload.tsx           # Image URL input with previews
│       ├── product-image-upload.module.css    # Upload styles
│       ├── product-filters.tsx                # Search + category + sort
│       ├── product-filters.module.css         # Filter styles
│       ├── product-table.tsx                  # Seller management table
│       ├── product-table.module.css           # Table styles
│       └── tag-input.tsx                      # Reusable tag/chip input
├── lib/
│   ├── products.ts                            # Keep for fallback/types, mark as deprecated
│   ├── product-api.ts                         # API fetch functions
│   └── product-types.ts                       # TypeScript types
└── hooks/
    └── use-products.ts                        # Custom hook for product list state management
```

---

## 10. TypeScript Types

```typescript
// lib/product-types.ts

/** Product status codes (code group: PRDT_STTS) */
export type ProductStatus = 'DRAFT' | 'ACTV' | 'SOLD_OUT' | 'HIDN';

/** Product category codes (code group: PRDT_CTGR) */
export type ProductCategory = 'CERAMICS' | 'TEXTILES' | 'ART' | 'JEWELRY' | 'HOME' | 'FOOD';

/** Category display info */
export interface CategoryInfo {
  code: ProductCategory;
  label: string;
}

/** Product list item (used in public listing and seller management) */
export interface ProductListItem {
  id: string;
  prdNm: string;
  prdDc: string;
  prdPrc: number;
  prdSalePrc: number | null;
  prdCtgrCd: ProductCategory;
  prdSttsCd: ProductStatus;
  prdImgUrl: string;
  stckQty: number;
  soldCnt: number;
  viewCnt: number;
  avgRtng: number;
  rvwCnt: number;
  srchTags: string[];
  seller: {
    id: string;
    name: string;
    nickname: string;
  };
  createdAt: string;
  updatedAt: string;
}

/** Product detail (full information) */
export interface ProductDetail extends ProductListItem {
  prdImgUrls: string[];
  seller: {
    id: string;
    name: string;
    nickname: string;
    profileImageUrl: string | null;
  };
}

/** Seller's own product (management view) */
export interface SellerProduct {
  id: string;
  prdNm: string;
  prdPrc: number;
  prdSalePrc: number | null;
  prdCtgrCd: ProductCategory;
  prdSttsCd: ProductStatus;
  prdImgUrl: string;
  stckQty: number;
  soldCnt: number;
  viewCnt: number;
  createdAt: string;
  updatedAt: string;
}

/** Create product input */
export interface CreateProductInput {
  prdNm: string;
  prdDc: string;
  prdPrc: number;
  prdSalePrc?: number | null;
  prdCtgrCd: ProductCategory;
  prdImgUrl: string;
  prdImgUrls: string[];
  stckQty: number;
  srchTags?: string[];
}

/** Update product input (all fields optional) */
export type UpdateProductInput = Partial<CreateProductInput>;

/** Update product status input */
export interface UpdateProductStatusInput {
  prdSttsCd: ProductStatus;
}

/** Product query params (public listing) */
export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: ProductCategory;
  sort?: 'newest' | 'popular' | 'price-low' | 'price-high' | 'rating';
  minPrice?: number;
  maxPrice?: number;
}

/** Seller product query params */
export interface SellerProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProductStatus;
}

/** Pagination info */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Paginated response wrapper */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationInfo;
}

/** Standard API response */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

/** Status display configuration */
export const PRODUCT_STATUS_CONFIG: Record<ProductStatus, { label: string; color: string }> = {
  DRAFT: { label: 'Draft', color: 'gray' },
  ACTV: { label: 'Active', color: 'green' },
  SOLD_OUT: { label: 'Sold Out', color: 'orange' },
  HIDN: { label: 'Hidden', color: 'red' },
};

/** Category display configuration */
export const PRODUCT_CATEGORY_CONFIG: Record<ProductCategory, { label: string }> = {
  CERAMICS: { label: 'Ceramics & Pottery' },
  TEXTILES: { label: 'Textiles & Fabrics' },
  ART: { label: 'Art & Prints' },
  JEWELRY: { label: 'Jewelry & Accessories' },
  HOME: { label: 'Home & Living' },
  FOOD: { label: 'Food & Beverages' },
};
```

---

## 11. Implementation Sequence

| Step | Task | Dependencies | Estimated Effort |
|------|------|-------------|-----------------|
| 1 | Add `PRDT_STTS` and `PRDT_CTGR` code groups to `TC_COMM_CD` seed data | None | 0.5h |
| 2 | Create TypeScript types (`product-types.ts`) | None | 0.5h |
| 3 | Create backend product module scaffolding (module, controller, service, DTOs) | Prisma Product model | 1h |
| 4 | Implement product service — CRUD operations with Prisma | Step 3 | 2h |
| 5 | Implement product controller — public endpoints (list, detail, categories) | Step 4 | 1h |
| 6 | Implement product controller — seller endpoints (my, create, update, status, delete) | Step 4 | 1.5h |
| 7 | Add ownership validation and status transition logic in service | Step 4 | 1h |
| 8 | Register ProductModule in AppModule | Steps 3-7 | 0.1h |
| 9 | Create frontend API wrapper (`product-api.ts`) | Step 2 | 0.5h |
| 10 | Create shared UI components (StatusBadge, CategoryBadge, TagInput) | Step 2 | 1h |
| 11 | Refactor public product list page — replace mock data with API calls | Steps 5, 9 | 2h |
| 12 | Refactor product detail page — replace mock data with API calls | Steps 5, 9 | 1.5h |
| 13 | Create ProductImageGallery component | Step 10 | 1h |
| 14 | Create ProductFilters component (search, category pills, sort) | Steps 9, 10 | 1h |
| 15 | Create Pagination component (if not already shared) | None | 0.5h |
| 16 | Create ProductForm component (shared create/edit with Zod validation) | Steps 9, 10 | 2h |
| 17 | Create ProductImageUpload component (URL inputs, previews, reorder) | Step 10 | 1h |
| 18 | Create seller management list page (`/dashboard/products/manage`) | Steps 9, 10, 15 | 1.5h |
| 19 | Create product create page (`/manage/new`) | Step 16 | 1h |
| 20 | Create product edit page (`/manage/[id]/edit`) | Step 16 | 1h |
| 21 | Add "My Products" to seller dashboard sidebar navigation | Auth context | 0.5h |
| 22 | Add route protection for manage pages (SELLER/SUPER_ADMIN only) | Auth module | 0.5h |
| 23 | Write unit tests (service layer, DTOs, components) | Steps 1-22 | 2h |
| 24 | Write integration tests (API endpoints, page flows) | Steps 1-22 | 2h |
| 25 | Write E2E tests (full create-list-edit-delete cycle) | Steps 1-22 | 1.5h |
| 26 | Run all tests + generate test report | Steps 23-25 | 0.5h |

**Total estimated effort: ~24 hours (~3 sprint days)**

---

## 12. Testing Strategy

### 12.1 Unit Tests

| Target | Test Cases |
|--------|-----------|
| ProductService.create | Valid input creates product with DRAFT status, sellerId from JWT, validation errors |
| ProductService.findAll | Pagination, search filter, category filter, sort orders, price range filter |
| ProductService.findById | Returns product, increments viewCnt, 404 for missing ID |
| ProductService.update | Updates fields, ownership check, SUPER_ADMIN bypass, 403 for wrong seller |
| ProductService.updateStatus | Valid transitions, invalid transitions rejected, stock check for ACTV |
| ProductService.delete | Soft delete (sets HIDN), ownership check |
| CreateProductDto | Valid/invalid inputs, sale price < regular price, URL validation, tag limits |
| ProductStatusBadge | Correct color/label for each status |
| ProductCategoryBadge | Correct label for each category code |
| ProductForm | Zod validation, submit handler, mode=create vs mode=edit |
| ProductFilters | Search debounce, category selection, sort change, URL param sync |

### 12.2 Integration Tests

| Flow | Test Cases |
|------|-----------|
| Public listing | GET /api/products returns paginated ACTIVE products only |
| Search | GET /api/products?search=ceramic returns matching products |
| Category filter | GET /api/products?category=CERAMICS returns filtered results |
| Create product | POST /api/products as SELLER creates product, returns 201 |
| Unauthorized create | POST /api/products as BUYER returns 403 |
| Edit own product | PATCH /api/products/:id as product owner succeeds |
| Edit other's product | PATCH /api/products/:id as different seller returns 403 |
| Status toggle | PATCH /api/products/:id/status with valid transition succeeds |
| Invalid status | PATCH /api/products/:id/status with invalid transition returns 400 |
| View count | GET /api/products/:id increments viewCnt |

### 12.3 E2E Tests

| Scenario | Steps |
|----------|-------|
| Full seller flow | Login as seller -> create product (DRAFT) -> publish (ACTV) -> verify in public list -> edit -> hide -> delete |
| Public browsing | Visit products page -> search -> filter by category -> sort by price -> paginate -> view detail |
| Role guard | Login as BUYER -> navigate to /dashboard/products/manage -> verify redirect |
| Empty state | Filter with no results -> verify empty state message displayed |
