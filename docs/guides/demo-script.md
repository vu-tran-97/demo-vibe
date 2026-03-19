# Demo Vibe — Demo Script

## Pre-Demo Setup (5 min before)

```bash
# Start Docker MongoDB
npm run docker:up

# Start backend
cd server && npm run dev

# Start frontend (new terminal)
npm run dev

# Seed data (if fresh DB)
npx prisma db push && npm run db:seed
```

Verify: http://localhost:3000 and http://localhost:4000/api/products

---

## Demo Flow (~20 min)

### 1. Database Design (2 min)

Open `docs/database/database-design.md` and show:
- **ERD diagram** — 19 collections, 27 tables documented
- **Table naming convention**: TB_ (general), TC_ (code), TH_ (history), TL_ (log), TR_ (relation)
- **Code tables**: TC_COMM_CD with groups (USER_STTS, PRD_CTGR, ORDR_STTS, PAY_MTHD, etc.)
- **Prisma schema** — `prisma/schema.prisma` with 19 models

> Key point: DB design as Single Source of Truth (SSoT), all code follows this document.

---

### 2. Home Page — Public Store (2 min)

Open http://localhost:3000

- Show product grid with **real images** (Unsplash)
- **Flash Deals** section with sale products
- **Category navigation** — click categories to filter
- **Search bar** — type "ceramic", see results filter
- **Sort options** — Popular, Latest, Price, Rating
- Sign Up / Sign In buttons

---

### 3. Buyer Flow (5 min)

**Login**: Click Sign In → `buyer@vibe.com` / `Buyer@123`

**Dashboard**: Show role-based dashboard
- Total orders, total spent, recent orders
- Active nav highlight, dynamic page title

**Browse Products**: Dashboard → Products
- **Advanced filters**: price range, rating (4+ stars), in-stock toggle
- **Multi-category** checkboxes
- **URL state sync**: copy URL, paste in new tab → same filters

**Product Detail**: Click any product
- Images, price, stock status, seller info, tags
- **Add to Cart** → toast notification
- **Cart badge** updates in sidebar

**Cart & Checkout**:
- Dashboard → Cart → see items with images
- Quantity controls, remove items
- Click **Proceed to Checkout**
- Select **Bank Transfer** → QR code displayed
- Or select **Email Invoice**
- Click Confirm → **Order Success** page with order number

**Order History**: Dashboard → Orders
- See orders with status badges (PENDING → PAID)
- Progress bar visualization

---

### 4. Seller Flow (4 min)

**Login**: `minji@vibe.com` / `Seller@123`

**My Products**: Dashboard → My Products
- See only own products (4 items)
- **Create Product**: click "+ Add Product" → fill form → save
- **Edit/Hide/Delete** product

**Sales Management**: Dashboard → Sales
- See orders containing seller's products
- **Confirm** order item → **Ship** (enter tracking number) → **Deliver**
- Bulk select + bulk action bar

---

### 5. Admin Flow (3 min)

**Login**: `admin@astratech.vn` / `Admin@123`

**Admin Dashboard**: Dashboard → Admin → Dashboard
- Total users, new this week, role distribution chart
- Recent activity timeline

**User Management**: Admin → Users
- Full user table with search, role/status filters
- **Edit** user, **Change role**, **Reset password**, **Suspend/Activate**
- **Export CSV**
- **Create** new user
- On mobile: switches to card layout

**All Products**: Admin → All Products
- Admin sees ALL products (not just own)
- Can edit/delete any product

---

### 6. Board — Community (2 min)

Dashboard → Board
- Post list with category tabs (NOTICE, FREE, QNA, REVIEW)
- Admin can create **NOTICE** posts (pinned)
- Click post → detail with comments
- Add comment, reply to comment
- Edit/delete own posts only

---

### 7. Search (1 min)

- Click search bar in header (or ⌘K)
- Type "art" → see **autocomplete suggestions** dropdown
- Press Enter → **Search results** page with tabs: Products, Posts
- Show **recent searches** in dropdown

---

### 8. Settings (1 min)

Dashboard → Settings
- **Profile**: edit name, nickname, avatar URL
- **Security**: change password (verifies current password)
- **Account**: role badge, member since date
- **Danger Zone**: delete account

---

### 9. Responsive Demo (1 min)

Resize browser to mobile width:
- **Hamburger menu** appears → click to open sidebar overlay
- Nav links close menu on click
- Product grid: 4 cols → 2 cols
- Filters: collapsible panel
- Admin table: switches to card layout
- Search: full-screen mobile overlay

---

### 10. Jenkins CI/CD (2 min)

```bash
npm run jenkins:up
```

Open http://localhost:8080

Show Jenkinsfile pipeline stages:
```
Checkout → Install (parallel FE+BE) → Prisma Generate → Lint → Test (156 tests) → Build (parallel)
```

---

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@astratech.vn | Admin@123 |
| Buyer | buyer@vibe.com | Buyer@123 |
| Seller (Minji) | minji@vibe.com | Seller@123 |
| Seller (Seonwoo) | seonwoo@vibe.com | Seller@123 |
| Seller (Yuna) | yuna@vibe.com | Seller@123 |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, CSS Modules |
| Backend | NestJS, Prisma ORM, JWT Auth |
| Database | MongoDB 7 (Docker, Replica Set) |
| CI/CD | Jenkins LTS (Docker) |
| Design | Luxury Minimal Design System |
| Methodology | ASTRA (6 sprints, 10 blueprints) |

## Quick Commands

```bash
npm run docker:up        # Start MongoDB
npm run dev:server       # Start backend (port 4000)
npm run dev              # Start frontend (port 3000)
npm run jenkins:up       # Start Jenkins (port 8080)
npm run db:seed          # Seed test data
npm run db:reset         # Full DB reset
```
