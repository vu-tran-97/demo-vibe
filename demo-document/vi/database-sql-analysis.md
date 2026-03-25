# Cơ sở dữ liệu, SQL JOIN & Phân tích truy vấn

> **Dự án:** Vibe E-Commerce Platform
> **Cơ sở dữ liệu:** PostgreSQL 16
> **ORM:** Prisma
> **Dữ liệu:** 50.000 sản phẩm, 61 người dùng (26 người bán, 25 người mua)

---

## 1. Kết nối DBeaver

### Cài đặt kết nối

| Trường | Giá trị |
|--------|---------|
| Host | `localhost` |
| Port | `5432` |
| Database | `demo_vibe` |
| Username | `postgres` |
| Password | `postgres` |

### Tổng quan các bảng

| Bảng | Loại | Số bản ghi | Mô tả |
|------|------|------------|--------|
| `TB_COMM_USER` | Chung | 61 | Người dùng (người mua + người bán) |
| `TB_PROD_PRD` | Chung | 50.000 | Sản phẩm |
| `TB_COMM_ORDR` | Chung | 0 | Đơn hàng |
| `TB_COMM_ORDR_ITEM` | Chung | 0 | Chi tiết đơn hàng |
| `TB_COMM_BOARD_POST` | Chung | 0 | Bài viết |
| `TB_COMM_BOARD_CMNT` | Chung | 0 | Bình luận |
| `TR_COMM_BOARD_LIKE` | Quan hệ | 0 | Lượt thích bài viết (bảng trung gian) |
| `TC_COMM_CD_GRP` | Mã | — | Nhóm mã |
| `TC_COMM_CD` | Mã | — | Giá trị mã |
| `TL_COMM_LGN_LOG` | Nhật ký | — | Nhật ký đăng nhập |
| `TL_COMM_EML_LOG` | Nhật ký | — | Nhật ký email |

---

## 2. Khóa chính (PK) & Khóa ngoại (FK)

### Khóa chính là gì?

**PK** (Primary Key - Khóa chính) xác định duy nhất mỗi dòng trong bảng. Không được trùng lặp, không được NULL.

```sql
-- Mỗi bảng đều có PK tự tăng
CREATE TABLE "TB_COMM_USER" (
  id SERIAL PRIMARY KEY,    -- PK: số nguyên tự tăng
  ...
);

-- id = 1, 2, 3, 4, ... (duy nhất, không bao giờ lặp lại)
```

### Khóa ngoại là gì?

**FK** (Foreign Key - Khóa ngoại) là một cột tham chiếu đến PK của bảng khác. Nó tạo ra mối quan hệ giữa các bảng.

```sql
CREATE TABLE "TB_PROD_PRD" (
  id       SERIAL PRIMARY KEY,       -- PK của bảng này
  "SLLR_ID" INT REFERENCES "TB_COMM_USER"(id),  -- FK → trỏ đến User.id
  ...
);

-- SLLR_ID = 3 nghĩa là sản phẩm này thuộc về Người dùng #3
```

### Sơ đồ PK/FK của dự án

```
TB_COMM_USER (PK: id)
  │
  ├──< TB_PROD_PRD.SLLR_ID          (1 người bán → N sản phẩm)
  ├──< TB_COMM_ORDR.BYR_ID          (1 người mua → N đơn hàng)
  ├──< TB_COMM_BOARD_POST.USE_ID    (1 người dùng → N bài viết)
  ├──< TB_COMM_BOARD_CMNT.USE_ID    (1 người dùng → N bình luận)
  ├──< TR_COMM_BOARD_LIKE.USE_ID    (1 người dùng → N lượt thích)
  └──< TL_COMM_LGN_LOG.USE_ID       (1 người dùng → N nhật ký đăng nhập)

TB_PROD_PRD (PK: id)
  │
  └──< TB_COMM_ORDR_ITEM.PRD_ID     (1 sản phẩm → N chi tiết đơn hàng)

TB_COMM_ORDR (PK: id)
  │
  ├──< TB_COMM_ORDR_ITEM.ORDR_ID    (1 đơn hàng → N chi tiết)
  └──< TH_COMM_ORDR_STTS.ORDR_ID    (1 đơn hàng → N thay đổi trạng thái)

TB_COMM_BOARD_POST (PK: id)
  │
  ├──< TB_COMM_BOARD_CMNT.POST_ID   (1 bài viết → N bình luận)
  ├──< TR_COMM_BOARD_LIKE.POST_ID   (1 bài viết → N lượt thích)
  └──< TB_COMM_BOARD_ATCH.POST_ID   (1 bài viết → N tệp đính kèm)
```

---

## 3. SQL JOIN — Các mối quan hệ

### 3.1 JOIN là gì?

JOIN kết hợp các dòng từ hai hoặc nhiều bảng dựa trên một cột liên quan (FK → PK).

```
Bảng A               Bảng B
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

### 3.2 Quan hệ 1:1 — Người dùng ↔ Firebase UID

Mỗi người dùng có đúng MỘT Firebase UID. Một Firebase UID thuộc về đúng MỘT người dùng.

```sql
-- 1:1: Mỗi người dùng có đúng 1 Firebase UID
SELECT
  id,
  "USE_EML" AS email,
  "FIREBASE_UID" AS firebase_uid,
  "USE_ROLE_CD" AS role
FROM "TB_COMM_USER"
WHERE "USE_ROLE_CD" = 'SELLER'
LIMIT 5;
```

**Kết quả:**
```
 id |         email           |         firebase_uid         |  role
----+-------------------------+------------------------------+--------
  8 | test-seller@test.com    | 2nOSw6XjmahRohtyHLX7FdD4kO03 | SELLER
  4 | seller2@yopmail.com     | zJ8soCAMRCfX4ebsA2uX5rMGR8s1 | SELLER
  5 | seller3@yopmail.com     | 1AoD7HnUEqdtcYy9z9CjnfvqnGm1 | SELLER
```

### 3.3 Quan hệ 1:N — 1 Người bán có N Sản phẩm

```sql
-- JOIN 1:N: 1 Người bán → N Sản phẩm
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

**Kết quả:**
```
 seller_id |    seller_name     | product_count | avg_price | total_stock
-----------+--------------------+---------------+-----------+-------------
         4 | Hanok Living       |          1966 |   1297985 |      489519
         5 | Jeju Art Gallery   |          1966 |   1486357 |      490949
         3 | Seoul Craft Studio |          1966 |   1537101 |      482982
         6 | Busan Market       |          1966 |   1375028 |      485310
```

### 3.4 Quan hệ N:1 — N Sản phẩm thuộc về 1 Danh mục

```sql
-- N:1: Nhiều sản phẩm → 1 danh mục
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

**Kết quả:**
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

### 3.5 JOIN nhiều bảng — Người bán + Sản phẩm + Danh mục

```sql
-- JOIN nhiều bảng: Người bán × Sản phẩm × Phân loại theo danh mục
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

## 4. Hiệu năng SQL — Index (Chỉ mục)

### 4.1 Vấn đề: Quét tuần tự (Sequential Scan)

Khi không có index, PostgreSQL phải quét TẤT CẢ 50.000 dòng để tìm kết quả phù hợp:

```
Truy vấn: Tìm sản phẩm JEWELRY sắp xếp theo mới nhất

TRƯỚC KHI có index:
  Seq Scan on TB_PROD_PRD          ← Quét TẤT CẢ 50.000 dòng!
    Filter: category = 'JEWELRY'   ← Loại bỏ 44.135 dòng
    Rows kept: 5.865

  Thời gian thực thi: 52.6ms
```

```
┌───────────────────────────────────────────────┐
│  TB_PROD_PRD (50.000 dòng)                    │
│                                               │
│  Dòng 1:  HOME     → bỏ qua                  │
│  Dòng 2:  TEXTILES → bỏ qua                  │
│  Dòng 3:  JEWELRY  → KHỚP ✓                  │
│  Dòng 4:  HOME     → bỏ qua                  │
│  ...                                          │
│  Dòng 49.999: FOOD → bỏ qua                  │
│  Dòng 50.000: HOME → bỏ qua                  │
│                                               │
│  Đã quét: 50.000 dòng                        │
│  Tìm thấy: 5.865 kết quả khớp               │
│  Lãng phí: 44.135 lần đọc dòng              │
└───────────────────────────────────────────────┘
```

### 4.2 Giải pháp: Chỉ mục B-tree (B-tree Index)

Chỉ mục giống như một **danh bạ điện thoại được sắp xếp theo họ** — thay vì đọc từng trang, bạn nhảy thẳng đến phần cần tìm.

```sql
-- Tạo index trên các cột được truy vấn thường xuyên
CREATE INDEX idx_product_seller     ON "TB_PROD_PRD"("SLLR_ID");
CREATE INDEX idx_product_category   ON "TB_PROD_PRD"("PRD_CTGR_CD");
CREATE INDEX idx_product_status_del ON "TB_PROD_PRD"("PRD_STTS_CD", "DEL_YN");
CREATE INDEX idx_product_created    ON "TB_PROD_PRD"("RGST_DT" DESC);
CREATE INDEX idx_order_buyer        ON "TB_COMM_ORDR"("BYR_ID");
CREATE INDEX idx_orderitem_order    ON "TB_COMM_ORDR_ITEM"("ORDR_ID");
CREATE INDEX idx_orderitem_seller   ON "TB_COMM_ORDR_ITEM"("SLLR_ID");
```

### 4.3 Kết quả: Nhanh hơn 263 lần

```
SAU KHI có index:
  Index Scan using idx_product_created  ← Chỉ đọc các dòng khớp!
    Filter: category = 'JEWELRY'
    Rows scanned: 136 (không phải 50.000!)

  Thời gian thực thi: 0.197ms
```

| Chỉ số | Trước | Sau | Cải thiện |
|--------|-------|-----|-----------|
| **Thời gian thực thi** | 52.6ms | 0.2ms | **Nhanh hơn 263 lần** |
| **Phương pháp quét** | Seq Scan (50K dòng) | Index Scan (136 dòng) | |
| **Phương pháp JOIN** | Hash Join | Nested Loop + Memoize | |
| **Thời gian lập kế hoạch** | 1.5ms | 0.5ms | Nhanh hơn 3 lần |

### 4.4 Khi nào nên dùng Index

| Nên dùng Index | Không nên dùng Index |
|-----------------|----------------------|
| Cột trong mệnh đề WHERE | Cột hiếm khi được truy vấn |
| Cột trong JOIN ON | Bảng có dưới 1.000 dòng |
| Cột trong ORDER BY | Cột có ít giá trị phân biệt (Y/N) |
| Khóa ngoại (FK) | Cột được cập nhật thường xuyên |

### 4.5 EXPLAIN ANALYZE — Cách đọc kết quả

```sql
EXPLAIN ANALYZE
SELECT p.*, u."USE_NM"
FROM "TB_PROD_PRD" p
JOIN "TB_COMM_USER" u ON p."SLLR_ID" = u.id
WHERE p."PRD_CTGR_CD" = 'JEWELRY'
ORDER BY p."RGST_DT" DESC
LIMIT 20;
```

Cách đọc kết quả:
```
Limit (actual time=0.060..0.152 rows=20)           ← Kết quả: 20 dòng trong 0.15ms
  → Nested Loop (rows=20)                           ← Phương pháp JOIN: hiệu quả cho tập kết quả nhỏ
      → Index Scan using idx_product_created (rows=20)  ← Đã dùng index của chúng ta!
          Filter: PRD_CTGR_CD = 'JEWELRY'           ← Bộ lọc bổ sung sau index
          Rows Removed by Filter: 116                ← Chỉ 116 lần đọc lãng phí (không phải 44K!)
      → Memoize (Hits: 5, Misses: 15)               ← Đã cache tra cứu người bán
          → Index Scan using TB_COMM_USER_pkey       ← Đã dùng PK index cho người bán
```

---

## 5. Phân tích truy vấn AI — SQL được tạo bởi Prisma

### 5.1 Cách Prisma tạo SQL

Prisma ORM chuyển đổi mã TypeScript thành SQL:

```typescript
// TypeScript (những gì lập trình viên viết)
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
-- SQL (những gì Prisma tạo ra)
SELECT "TB_PROD_PRD"."id", "TB_PROD_PRD"."SLLR_ID", "TB_PROD_PRD"."PRD_NM", ...
FROM "TB_PROD_PRD"
WHERE "TB_PROD_PRD"."PRD_STTS_CD" = 'ACTV'
  AND "TB_PROD_PRD"."DEL_YN" = 'N'
  AND "TB_PROD_PRD"."PRD_CTGR_CD" = 'JEWELRY'
ORDER BY "TB_PROD_PRD"."RGST_DT" DESC
LIMIT 20;

-- SAU ĐÓ một truy vấn riêng cho người bán (vấn đề N+1!):
SELECT "TB_COMM_USER"."id", "TB_COMM_USER"."USE_NM", ...
FROM "TB_COMM_USER"
WHERE "TB_COMM_USER"."id" IN (3, 4, 5, 6, 8, 22, 23, ...);
```

### 5.2 Các vấn đề phát hiện trong truy vấn do AI tạo

#### Vấn đề 1: Vấn đề truy vấn N+1 (N+1 Query Problem)

**Vấn đề:** `include` của Prisma tạo ra 2 truy vấn riêng biệt thay vì một JOIN duy nhất.

```
Truy vấn 1: SELECT products WHERE category = 'JEWELRY' LIMIT 20
Truy vấn 2: SELECT sellers WHERE id IN (danh sách seller_id từ Truy vấn 1)

Tổng cộng: 2 truy vấn thay vì 1 JOIN
```

**Tác động:** Với các trường hợp đơn giản (20 kết quả), điều này chấp nhận được. Với tập kết quả lớn hoặc include lồng nhau, vấn đề sẽ nhân lên.

**Cải thiện:** Sử dụng SQL thô với JOIN khi hiệu năng quan trọng:

```typescript
// Thay vì dùng Prisma include:
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

#### Vấn đề 2: Thiếu Index

**Vấn đề:** Prisma KHÔNG tự động tạo index trên khóa ngoại.

```
Prisma schema:
  sellerId Int @map("SLLR_ID")

SQL được tạo:
  "SLLR_ID" INT NOT NULL
  -- KHÔNG CÓ INDEX! Phải thêm thủ công.
```

**Cách khắc phục:** Thêm `@@index` trong Prisma schema hoặc tạo thủ công:

```prisma
model Product {
  sellerId Int @map("SLLR_ID")

  @@index([sellerId])        // Tạo index trên SLLR_ID
  @@index([prdCtgrCd])       // Tạo index trên PRD_CTGR_CD
  @@index([rgstDt(sort: Desc)])  // Tạo index cho sắp xếp
}
```

#### Vấn đề 3: SELECT * thay vì SELECT các cột cụ thể

**Vấn đề:** Prisma luôn lấy TẤT CẢ các cột, ngay cả khi bạn chỉ cần một vài cột.

```sql
-- Prisma tạo ra:
SELECT "id", "SLLR_ID", "PRD_NM", "PRD_DC", "PRD_PRC", "PRD_SALE_PRC",
       "PRD_CTGR_CD", "PRD_STTS_CD", "PRD_IMG_URL", "PRD_IMG_URLS",
       "STCK_QTY", "SOLD_CNT", "VIEW_CNT", "AVG_RTNG", "RVW_CNT",
       "SRCH_TAGS", "RGST_DT", "RGTR_ID", "MDFCN_DT", "MDFR_ID", "DEL_YN"
FROM "TB_PROD_PRD" ...

-- Cho danh sách sản phẩm, bạn chỉ cần:
SELECT "id", "PRD_NM", "PRD_PRC", "PRD_SALE_PRC", "PRD_IMG_URL", "PRD_CTGR_CD"
FROM "TB_PROD_PRD" ...
```

**Cách khắc phục:** Sử dụng `select` của Prisma thay vì lấy toàn bộ model:

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

#### Vấn đề 4: Thiếu Composite Index cho các tổ hợp bộ lọc phổ biến

**Vấn đề:** Lọc theo `status + delYn + category` sử dụng 3 lần tra cứu index riêng biệt.

**Cách khắc phục:** Tạo một composite index (chỉ mục kết hợp):

```sql
-- Một index duy nhất cho mẫu WHERE phổ biến nhất
CREATE INDEX idx_product_active_category
  ON "TB_PROD_PRD"("PRD_STTS_CD", "DEL_YN", "PRD_CTGR_CD");
```

### 5.3 Tóm tắt hiệu năng

| Mẫu truy vấn | Trước Index | Sau Index | Cải thiện |
|---------------|-------------|-----------|-----------|
| Danh sách sản phẩm (lọc theo danh mục) | 52.6ms | 0.2ms | **263 lần** |
| Sản phẩm theo người bán | ~50ms (Seq Scan) | <1ms (Index Scan) | **50 lần+** |
| Đơn hàng theo người mua | ~10ms (Seq Scan) | <1ms (Index Scan) | **10 lần+** |

### 5.4 Các Index đã tạo

```sql
-- Bảng sản phẩm (50K dòng — được lợi nhiều nhất)
CREATE INDEX idx_product_seller     ON "TB_PROD_PRD"("SLLR_ID");
CREATE INDEX idx_product_category   ON "TB_PROD_PRD"("PRD_CTGR_CD");
CREATE INDEX idx_product_status_del ON "TB_PROD_PRD"("PRD_STTS_CD", "DEL_YN");
CREATE INDEX idx_product_created    ON "TB_PROD_PRD"("RGST_DT" DESC);

-- Bảng đơn hàng (cho tương lai khi có đơn hàng)
CREATE INDEX idx_order_buyer        ON "TB_COMM_ORDR"("BYR_ID");
CREATE INDEX idx_orderitem_order    ON "TB_COMM_ORDR_ITEM"("ORDR_ID");
CREATE INDEX idx_orderitem_seller   ON "TB_COMM_ORDR_ITEM"("SLLR_ID");
```

---

## 6. Thu thập dữ liệu — 50.000 bản ghi qua Crawling

### Phương pháp

Thu thập dữ liệu sản phẩm từ các API công khai, sau đó nhân bản với các biến thể:

| Nguồn | Sản phẩm | URL |
|--------|----------|-----|
| DummyJSON | 194 | `https://dummyjson.com/products` |
| FakeStoreAPI | 20 | `https://fakestoreapi.com/products` |
| Biến thể | 49.786 | Được tạo với tính từ, màu sắc, kích thước, giá ngẫu nhiên |

### Script

```bash
# Tạo 50 người dùng (25 người bán + 25 người mua)
npx tsx scripts/seed-users.ts

# Thu thập và chèn 50.000 sản phẩm
npx tsx scripts/crawl-products.ts
```

### Kết quả

- **50.000 sản phẩm** được chèn trong **5,4 giây** (~9.300 sản phẩm/giây)
- Phân bổ đều: **~1.923 sản phẩm mỗi người bán**
- 6 danh mục: CERAMICS, TEXTILES, ART, JEWELRY, HOME, FOOD
