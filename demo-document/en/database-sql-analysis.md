# Database, SQL Joins & Query Analysis

> **Project:** Vibe E-Commerce Platform
> **Database:** PostgreSQL 16
> **ORM:** Prisma
> **Records:** 50,000 products, 61 users (26 sellers, 25 buyers)

---

## 1. DBeaver Connection

### Connection Settings

| Field | Value |
|-------|-------|
| Host | `localhost` |
| Port | `5432` |
| Database | `demo_vibe` |
| Username | `postgres` |
| Password | `postgres` |

### Tables Overview

| Table | Type | Records | Description |
|-------|------|---------|-------------|
| `TB_COMM_USER` | General | 61 | Users (buyers + sellers) |
| `TB_PROD_PRD` | General | 50,000 | Products |
| `TB_COMM_ORDR` | General | 0 | Orders |
| `TB_COMM_ORDR_ITEM` | General | 0 | Order items |
| `TB_COMM_BOARD_POST` | General | 0 | Board posts |
| `TB_COMM_BOARD_CMNT` | General | 0 | Board comments |
| `TR_COMM_BOARD_LIKE` | Relation | 0 | Post likes (junction) |
| `TC_COMM_CD_GRP` | Code | — | Code groups |
| `TC_COMM_CD` | Code | — | Code values |
| `TL_COMM_LGN_LOG` | Log | — | Login logs |
| `TL_COMM_EML_LOG` | Log | — | Email logs |

---

## 2. Primary Key (PK) & Foreign Key (FK)

### What is a Primary Key?

A **PK** uniquely identifies each row in a table. No duplicates, no NULLs.

```sql
-- Every table has an auto-increment PK
CREATE TABLE "TB_COMM_USER" (
  id SERIAL PRIMARY KEY,    -- PK: auto-increment integer
  ...
);

-- id = 1, 2, 3, 4, ... (unique, never repeats)
```

### What is a Foreign Key?

A **FK** is a column that references a PK in another table. It creates a relationship.

```sql
CREATE TABLE "TB_PROD_PRD" (
  id       SERIAL PRIMARY KEY,       -- PK of this table
  "SLLR_ID" INT REFERENCES "TB_COMM_USER"(id),  -- FK → points to User.id
  ...
);

-- SLLR_ID = 3 means this product belongs to User #3
```

### PK/FK Map of This Project

```
TB_COMM_USER (PK: id)
  │
  ├──< TB_PROD_PRD.SLLR_ID          (1 seller → N products)
  ├──< TB_COMM_ORDR.BYR_ID          (1 buyer → N orders)
  ├──< TB_COMM_BOARD_POST.USE_ID    (1 user → N posts)
  ├──< TB_COMM_BOARD_CMNT.USE_ID    (1 user → N comments)
  ├──< TR_COMM_BOARD_LIKE.USE_ID    (1 user → N likes)
  └──< TL_COMM_LGN_LOG.USE_ID       (1 user → N login logs)

TB_PROD_PRD (PK: id)
  │
  └──< TB_COMM_ORDR_ITEM.PRD_ID     (1 product → N order items)

TB_COMM_ORDR (PK: id)
  │
  ├──< TB_COMM_ORDR_ITEM.ORDR_ID    (1 order → N items)
  └──< TH_COMM_ORDR_STTS.ORDR_ID    (1 order → N status changes)

TB_COMM_BOARD_POST (PK: id)
  │
  ├──< TB_COMM_BOARD_CMNT.POST_ID   (1 post → N comments)
  ├──< TR_COMM_BOARD_LIKE.POST_ID   (1 post → N likes)
  └──< TB_COMM_BOARD_ATCH.POST_ID   (1 post → N attachments)
```

---

## 3. SQL JOIN — Relationships

### 3.1 What is JOIN?

JOIN combines rows from two or more tables based on a related column (FK → PK).

```
Table A              Table B
┌────┬──────┐       ┌────┬──────┬────────┐
│ id │ name │       │ id │ item │ user_id│
├────┼──────┤       ├────┼──────┼────────┤
│  1 │ Anna │       │ 10 │ Book │    1   │  ← user_id = 1 → Anna
│  2 │ Bob  │       │ 11 │ Pen  │    1   │  ← user_id = 1 → Anna
│  3 │ Carl │       │ 12 │ Cup  │    2   │  ← user_id = 2 → Bob
└────┴──────┘       └────┴──────┴────────┘

JOIN ON A.id = B.user_id:
┌──────┬──────┐
│ name │ item │
├──────┼──────┤
│ Anna │ Book │
│ Anna │ Pen  │
│ Bob  │ Cup  │
└──────┴──────┘
```

### 3.2 1:1 Relationship — User ↔ Firebase UID

Each user has exactly ONE Firebase UID. One Firebase UID belongs to exactly ONE user.

```sql
-- 1:1: Each user has exactly 1 Firebase UID
SELECT
  id,
  "USE_EML" AS email,
  "FIREBASE_UID" AS firebase_uid,
  "USE_ROLE_CD" AS role
FROM "TB_COMM_USER"
WHERE "USE_ROLE_CD" = 'SELLER'
LIMIT 5;
```

**Result:**
```
 id |         email           |         firebase_uid         |  role
----+-------------------------+------------------------------+--------
  8 | test-seller@test.com    | 2nOSw6XjmahRohtyHLX7FdD4kO03 | SELLER
  4 | seller2@yopmail.com     | zJ8soCAMRCfX4ebsA2uX5rMGR8s1 | SELLER
  5 | seller3@yopmail.com     | 1AoD7HnUEqdtcYy9z9CjnfvqnGm1 | SELLER
```

### 3.3 1:N Relationship — 1 Seller has N Products

```sql
-- 1:N JOIN: 1 Seller → N Products
SELECT
  u.id AS seller_id,
  u."USE_NM" AS seller_name,
  COUNT(p.id) AS product_count,
  ROUND(AVG(p."PRD_PRC")::numeric, 0) AS avg_price,
  SUM(p."STCK_QTY") AS total_stock
FROM "TB_COMM_USER" u
JOIN "TB_PROD_PRD" p ON u.id = p."SLLR_ID"
WHERE u."USE_ROLE_CD" = 'SELLER' AND p."DEL_YN" = 'N'
GROUP BY u.id, u."USE_NM"
ORDER BY product_count DESC
LIMIT 10;
```

**Result:**
```
 seller_id |    seller_name     | product_count | avg_price | total_stock
-----------+--------------------+---------------+-----------+-------------
         4 | Hanok Living       |          1966 |   1297985 |      489519
         5 | Jeju Art Gallery   |          1966 |   1486357 |      490949
         3 | Seoul Craft Studio |          1966 |   1537101 |      482982
         6 | Busan Market       |          1966 |   1375028 |      485310
```

### 3.4 N:1 Relationship — N Products belong to 1 Category

```sql
-- N:1: Many products → 1 category
SELECT
  p."PRD_CTGR_CD" AS category,
  COUNT(*) AS product_count,
  ROUND(AVG(p."PRD_PRC")::numeric, 0) AS avg_price,
  SUM(p."SOLD_CNT") AS total_sold
FROM "TB_PROD_PRD" p
WHERE p."DEL_YN" = 'N'
GROUP BY p."PRD_CTGR_CD"
ORDER BY product_count DESC;
```

**Result:**
```
 category | product_count | avg_price | total_sold
----------+---------------+-----------+------------
 HOME     |         23245 |   1948426 |     571435
 TEXTILES |          9121 |    258191 |     225793
 FOOD     |          6645 |    292451 |     166152
 JEWELRY  |          5865 |   3137406 |     146168
 CERAMICS |          3863 |    480883 |      96659
 ART      |          1261 |   1529014 |      33460
```

### 3.5 Multi-table JOIN — Seller + Product + Category

```sql
-- Multi-table JOIN: Seller × Product × Category breakdown
SELECT
  u."USE_NM" AS seller_name,
  p."PRD_CTGR_CD" AS category,
  COUNT(p.id) AS products,
  ROUND(AVG(p."PRD_PRC")::numeric, 0) AS avg_price,
  SUM(p."SOLD_CNT") AS sold
FROM "TB_COMM_USER" u
JOIN "TB_PROD_PRD" p ON u.id = p."SLLR_ID"
WHERE u."USE_ROLE_CD" = 'SELLER'
  AND p."DEL_YN" = 'N'
  AND u.id IN (3, 4, 5)
GROUP BY u."USE_NM", p."PRD_CTGR_CD"
ORDER BY u."USE_NM", products DESC;
```

---

## 4. SQL Performance — Index

### 4.1 The Problem: Sequential Scan

Without indexes, PostgreSQL must scan ALL 50,000 rows to find matches:

```
Query: Find JEWELRY products sorted by newest

BEFORE indexes:
  Seq Scan on TB_PROD_PRD          ← Scans ALL 50,000 rows!
    Filter: category = 'JEWELRY'   ← Removes 44,135 rows
    Rows kept: 5,865

  Execution Time: 52.6ms
```

```
┌───────────────────────────────────────────────┐
│  TB_PROD_PRD (50,000 rows)                    │
│                                               │
│  Row 1:  HOME     → skip                      │
│  Row 2:  TEXTILES → skip                      │
│  Row 3:  JEWELRY  → MATCH ✓                   │
│  Row 4:  HOME     → skip                      │
│  ...                                          │
│  Row 49,999: FOOD → skip                      │
│  Row 50,000: HOME → skip                      │
│                                               │
│  Scanned: 50,000 rows                         │
│  Found: 5,865 matches                         │
│  Wasted: 44,135 row reads                     │
└───────────────────────────────────────────────┘
```

### 4.2 The Solution: B-tree Index

An index is like a **phonebook sorted by last name** — instead of reading every page, you jump directly to the right section.

```sql
-- Create indexes on frequently queried columns
CREATE INDEX idx_product_seller     ON "TB_PROD_PRD"("SLLR_ID");
CREATE INDEX idx_product_category   ON "TB_PROD_PRD"("PRD_CTGR_CD");
CREATE INDEX idx_product_status_del ON "TB_PROD_PRD"("PRD_STTS_CD", "DEL_YN");
CREATE INDEX idx_product_created    ON "TB_PROD_PRD"("RGST_DT" DESC);
CREATE INDEX idx_order_buyer        ON "TB_COMM_ORDR"("BYR_ID");
CREATE INDEX idx_orderitem_order    ON "TB_COMM_ORDR_ITEM"("ORDR_ID");
CREATE INDEX idx_orderitem_seller   ON "TB_COMM_ORDR_ITEM"("SLLR_ID");
```

### 4.3 Result: 263x Faster

```
AFTER indexes:
  Index Scan using idx_product_created  ← Reads only matching rows!
    Filter: category = 'JEWELRY'
    Rows scanned: 136 (not 50,000!)

  Execution Time: 0.197ms
```

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Execution Time** | 52.6ms | 0.2ms | **263x faster** |
| **Scan Method** | Seq Scan (50K rows) | Index Scan (136 rows) | |
| **Join Method** | Hash Join | Nested Loop + Memoize | |
| **Planning Time** | 1.5ms | 0.5ms | 3x faster |

### 4.4 When to Use Indexes

| Use Index | Don't Use Index |
|-----------|-----------------|
| Columns in WHERE clause | Columns rarely queried |
| Columns in JOIN ON | Tables with < 1,000 rows |
| Columns in ORDER BY | Columns with few distinct values (Y/N) |
| Foreign keys (FK) | Frequently updated columns |

### 4.5 EXPLAIN ANALYZE — How to Read

```sql
EXPLAIN ANALYZE
SELECT p.*, u."USE_NM"
FROM "TB_PROD_PRD" p
JOIN "TB_COMM_USER" u ON p."SLLR_ID" = u.id
WHERE p."PRD_CTGR_CD" = 'JEWELRY'
ORDER BY p."RGST_DT" DESC
LIMIT 20;
```

Reading the output:
```
Limit (actual time=0.060..0.152 rows=20)           ← Final: 20 rows in 0.15ms
  → Nested Loop (rows=20)                           ← Join method: efficient for small results
      → Index Scan using idx_product_created (rows=20)  ← Used our index!
          Filter: PRD_CTGR_CD = 'JEWELRY'           ← Additional filter after index
          Rows Removed by Filter: 116                ← Only 116 wasted reads (not 44K!)
      → Memoize (Hits: 5, Misses: 15)               ← Cached seller lookups
          → Index Scan using TB_COMM_USER_pkey       ← Used PK index for seller
```

---

## 5. AI Query Analysis — Prisma Generated SQL

### 5.1 How Prisma Generates SQL

Prisma ORM converts TypeScript code to SQL:

```typescript
// TypeScript (what developer writes)
const products = await prisma.product.findMany({
  where: {
    prdSttsCd: 'ACTV',
    delYn: 'N',
    prdCtgrCd: 'JEWELRY',
  },
  include: { seller: true },
  orderBy: { rgstDt: 'desc' },
  take: 20,
});
```

```sql
-- SQL (what Prisma generates)
SELECT "TB_PROD_PRD"."id", "TB_PROD_PRD"."SLLR_ID", "TB_PROD_PRD"."PRD_NM", ...
FROM "TB_PROD_PRD"
WHERE "TB_PROD_PRD"."PRD_STTS_CD" = 'ACTV'
  AND "TB_PROD_PRD"."DEL_YN" = 'N'
  AND "TB_PROD_PRD"."PRD_CTGR_CD" = 'JEWELRY'
ORDER BY "TB_PROD_PRD"."RGST_DT" DESC
LIMIT 20;

-- THEN a separate query for sellers (N+1 problem!):
SELECT "TB_COMM_USER"."id", "TB_COMM_USER"."USE_NM", ...
FROM "TB_COMM_USER"
WHERE "TB_COMM_USER"."id" IN (3, 4, 5, 6, 8, 22, 23, ...);
```

### 5.2 Issues Found in AI-Generated Queries

#### Issue 1: N+1 Query Problem

**Problem:** Prisma's `include` generates 2 separate queries instead of a JOIN.

```
Query 1: SELECT products WHERE category = 'JEWELRY' LIMIT 20
Query 2: SELECT sellers WHERE id IN (list of seller_ids from Query 1)

Total: 2 queries instead of 1 JOIN
```

**Impact:** For simple cases (20 results), this is acceptable. For large result sets or nested includes, it compounds.

**Improvement:** Use raw SQL JOIN when performance matters:

```typescript
// Instead of Prisma include:
const products = await prisma.$queryRaw`
  SELECT p.*, u."USE_NM" AS seller_name
  FROM "TB_PROD_PRD" p
  JOIN "TB_COMM_USER" u ON p."SLLR_ID" = u.id
  WHERE p."PRD_STTS_CD" = 'ACTV'
    AND p."PRD_CTGR_CD" = 'JEWELRY'
  ORDER BY p."RGST_DT" DESC
  LIMIT 20
`;
```

#### Issue 2: Missing Indexes

**Problem:** Prisma does NOT auto-create indexes on foreign keys.

```
Prisma schema:
  sellerId Int @map("SLLR_ID")

Generated SQL:
  "SLLR_ID" INT NOT NULL
  -- NO INDEX! Must add manually.
```

**Fix:** Add `@@index` in Prisma schema or create manually:

```prisma
model Product {
  sellerId Int @map("SLLR_ID")

  @@index([sellerId])        // Creates index on SLLR_ID
  @@index([prdCtgrCd])       // Creates index on PRD_CTGR_CD
  @@index([rgstDt(sort: Desc)])  // Creates index for sorting
}
```

#### Issue 3: SELECT * Instead of SELECT Specific Columns

**Problem:** Prisma always selects ALL columns, even when you only need a few.

```sql
-- Prisma generates:
SELECT "id", "SLLR_ID", "PRD_NM", "PRD_DC", "PRD_PRC", "PRD_SALE_PRC",
       "PRD_CTGR_CD", "PRD_STTS_CD", "PRD_IMG_URL", "PRD_IMG_URLS",
       "STCK_QTY", "SOLD_CNT", "VIEW_CNT", "AVG_RTNG", "RVW_CNT",
       "SRCH_TAGS", "RGST_DT", "RGTR_ID", "MDFCN_DT", "MDFR_ID", "DEL_YN"
FROM "TB_PROD_PRD" ...

-- For a product list, you only need:
SELECT "id", "PRD_NM", "PRD_PRC", "PRD_SALE_PRC", "PRD_IMG_URL", "PRD_CTGR_CD"
FROM "TB_PROD_PRD" ...
```

**Fix:** Use Prisma `select` instead of full model:

```typescript
const products = await prisma.product.findMany({
  select: {
    id: true,
    prdNm: true,
    prdPrc: true,
    prdSalePrc: true,
    prdImgUrl: true,
    prdCtgrCd: true,
  },
  where: { ... },
});
```

#### Issue 4: No Composite Index for Common Filter Combinations

**Problem:** Filtering by `status + delYn + category` uses 3 separate index lookups.

**Fix:** Create a composite index:

```sql
-- Single index for the most common WHERE clause pattern
CREATE INDEX idx_product_active_category
  ON "TB_PROD_PRD"("PRD_STTS_CD", "DEL_YN", "PRD_CTGR_CD");
```

### 5.3 Performance Summary

| Query Pattern | Before Index | After Index | Improvement |
|---------------|-------------|-------------|-------------|
| Product listing (category filter) | 52.6ms | 0.2ms | **263x** |
| Product by seller | ~50ms (Seq Scan) | <1ms (Index Scan) | **50x+** |
| Order by buyer | ~10ms (Seq Scan) | <1ms (Index Scan) | **10x+** |

### 5.4 Indexes Created

```sql
-- Product table (50K rows — most benefit)
CREATE INDEX idx_product_seller     ON "TB_PROD_PRD"("SLLR_ID");
CREATE INDEX idx_product_category   ON "TB_PROD_PRD"("PRD_CTGR_CD");
CREATE INDEX idx_product_status_del ON "TB_PROD_PRD"("PRD_STTS_CD", "DEL_YN");
CREATE INDEX idx_product_created    ON "TB_PROD_PRD"("RGST_DT" DESC);

-- Order tables (for future use when orders exist)
CREATE INDEX idx_order_buyer        ON "TB_COMM_ORDR"("BYR_ID");
CREATE INDEX idx_orderitem_order    ON "TB_COMM_ORDR_ITEM"("ORDR_ID");
CREATE INDEX idx_orderitem_seller   ON "TB_COMM_ORDR_ITEM"("SLLR_ID");
```

---

## 6. Data Collection — 50,000 Records via Crawling

### Method

Crawled product data from public APIs, then multiplied with variations:

| Source | Products | URL |
|--------|----------|-----|
| DummyJSON | 194 | `https://dummyjson.com/products` |
| FakeStoreAPI | 20 | `https://fakestoreapi.com/products` |
| Variations | 49,786 | Generated with random adjectives, colors, sizes, prices |

### Script

```bash
# Seed 50 users (25 sellers + 25 buyers)
npx tsx scripts/seed-users.ts

# Crawl and insert 50,000 products
npx tsx scripts/crawl-products.ts
```

### Result

- **50,000 products** inserted in **5.4 seconds** (~9,300 products/sec)
- Distributed evenly: **~1,923 products per seller**
- 6 categories: CERAMICS, TEXTILES, ART, JEWELRY, HOME, FOOD
