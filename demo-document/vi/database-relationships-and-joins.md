# Quan hệ Database & Câu lệnh JOIN

> **Dự án:** Nền tảng Thương mại điện tử Vibe
> **Cơ sở dữ liệu:** PostgreSQL 16 với Prisma ORM
> **Cập nhật:** 2026-03-27

---

## 1. Các loại quan hệ (Relationships)

### 1.1. Quan hệ 1:1 (One-to-One)

**Định nghĩa:** Mỗi bản ghi trong bảng A chỉ liên kết với **đúng 1** bản ghi trong bảng B, và ngược lại.

**Đặc điểm:**
- FK thường có constraint `UNIQUE`
- Thường dùng khi muốn tách thông tin nhạy cảm/ít dùng ra bảng riêng

**Ví dụ minh họa:**

Giả sử tách bảng User Profile ra riêng (1 User = 1 Profile):

```sql
-- Bảng User chỉ giữ thông tin đăng nhập
CREATE TABLE TB_COMM_USER (
    USER_ID   BIGINT PRIMARY KEY,
    USE_EML   VARCHAR(100) NOT NULL UNIQUE,
    USE_PSWD  VARCHAR(60)
);

-- Bảng Profile tách riêng thông tin cá nhân
CREATE TABLE TB_COMM_USER_PRFL (
    PRFL_ID      BIGINT PRIMARY KEY,
    USER_ID      BIGINT NOT NULL UNIQUE,  -- UNIQUE đảm bảo 1:1
    USE_NM       VARCHAR(50),
    PRFL_IMG_URL VARCHAR(500),
    FOREIGN KEY (USER_ID) REFERENCES TB_COMM_USER(USER_ID)
);
```

**Khi nào dùng 1:1?**
- Tách dữ liệu nhạy cảm (password, token) khỏi dữ liệu hiển thị
- Tách dữ liệu ít truy vấn để tối ưu hiệu suất
- Mở rộng bảng có sẵn mà không muốn ALTER TABLE

---

### 1.2. Quan hệ 1:N (One-to-Many)

**Định nghĩa:** Mỗi bản ghi trong bảng A có thể liên kết với **nhiều** bản ghi trong bảng B, nhưng mỗi bản ghi trong B chỉ thuộc về **1** bản ghi trong A.

**Đặc điểm:**
- Bảng "nhiều" (N) chứa FK trỏ về bảng "một" (1)
- Là loại quan hệ phổ biến nhất

**Ví dụ trong dự án:**

#### a) User → Refresh Tokens (1 User có nhiều Token)

```
TB_COMM_USER (1) ──────→ TB_COMM_RFRSH_TKN (N)
    _id                      USE_ID (FK → TB_COMM_USER._id)
```

```sql
-- Tạo bảng
CREATE TABLE TB_COMM_RFRSH_TKN (
    _id       BIGINT PRIMARY KEY,
    USE_ID    BIGINT NOT NULL,           -- FK: mỗi token thuộc 1 user
    TKN_VAL   VARCHAR(255) NOT NULL,
    EXPR_DT   TIMESTAMP NOT NULL,
    FOREIGN KEY (USE_ID) REFERENCES TB_COMM_USER(_id)
);

-- Lấy tất cả token của 1 user
SELECT * FROM "TB_COMM_RFRSH_TKN" WHERE "USE_ID" = 'user-id-here';
```

#### b) User → Board Posts (1 User viết nhiều bài)

```
TB_COMM_USER (1) ──────→ TB_COMM_BOARD_POST (N)
    _id                      USE_ID (FK → TB_COMM_USER._id)
```

```sql
SELECT * FROM "TB_COMM_BOARD_POST" WHERE "USE_ID" = 'user-id-here';
```

#### c) Post → Comments (1 bài viết có nhiều comment)

```
TB_COMM_BOARD_POST (1) ──────→ TB_COMM_BOARD_CMNT (N)
    _id                            POST_ID (FK → TB_COMM_BOARD_POST._id)
```

```sql
SELECT * FROM "TB_COMM_BOARD_CMNT" WHERE "POST_ID" = 'post-id-here';
```

#### d) Order → Order Items (1 đơn hàng có nhiều sản phẩm)

```
TB_COMM_ORDR (1) ──────→ TB_COMM_ORDR_ITEM (N)
    _id                      ORDR_ID (FK → TB_COMM_ORDR._id)
```

```sql
SELECT * FROM "TB_COMM_ORDR_ITEM" WHERE "ORDR_ID" = 'order-id-here';
```

**Khi nào dùng 1:N?**
- Khi một đối tượng "sở hữu" nhiều đối tượng con
- Log/History: 1 user → nhiều login log, 1 order → nhiều status history
- Parent-child: 1 post → nhiều comment, 1 chat room → nhiều message

---

### 1.3. Quan hệ N:M (Many-to-Many)

**Định nghĩa:** Mỗi bản ghi trong bảng A có thể liên kết với **nhiều** bản ghi trong bảng B, và ngược lại.

**Đặc điểm:**
- Cần **bảng trung gian** (junction/pivot table) để chứa cặp FK
- Bảng trung gian có prefix `TR_` (relation) trong dự án này
- Bảng trung gian có thể chứa thêm thông tin (ngày tham gia, vai trò, ...)

**Ví dụ trong dự án:**

#### a) User ↔ Chat Room (nhiều User tham gia nhiều Chat Room)

```
TB_COMM_USER (N) ←──── TR_COMM_CHAT_ROOM_MBR ────→ TB_COMM_CHAT_ROOM (M)
    _id                    USE_ID (FK)                     _id
                           CHAT_ROOM_ID (FK)
                           JOIN_DT
                           LAST_READ_DT
```

```sql
-- Bảng trung gian
CREATE TABLE TR_COMM_CHAT_ROOM_MBR (
    _id           BIGINT PRIMARY KEY,
    CHAT_ROOM_ID  BIGINT NOT NULL,
    USE_ID        BIGINT NOT NULL,
    JOIN_DT       TIMESTAMP NOT NULL,
    LAST_READ_DT  TIMESTAMP,
    NOTI_YN       CHAR(1) DEFAULT 'Y',
    FOREIGN KEY (CHAT_ROOM_ID) REFERENCES TB_COMM_CHAT_ROOM(_id),
    FOREIGN KEY (USE_ID) REFERENCES TB_COMM_USER(_id),
    UNIQUE (CHAT_ROOM_ID, USE_ID)  -- Mỗi user chỉ join 1 lần
);

-- Lấy tất cả chat room mà user tham gia
SELECT cr.*
FROM "TB_COMM_CHAT_ROOM" cr
JOIN "TR_COMM_CHAT_ROOM_MBR" mbr ON cr."_id" = mbr."CHAT_ROOM_ID"
WHERE mbr."USE_ID" = 'user-id-here';

-- Lấy tất cả member của chat room
SELECT u.*
FROM "TB_COMM_USER" u
JOIN "TR_COMM_CHAT_ROOM_MBR" mbr ON u."_id" = mbr."USE_ID"
WHERE mbr."CHAT_ROOM_ID" = 'room-id-here';
```

#### b) User ↔ Post (quan hệ Like — nhiều User like nhiều Post)

```
TB_COMM_USER (N) ←──── TR_COMM_BOARD_LIKE ────→ TB_COMM_BOARD_POST (M)
    _id                    USE_ID (FK)                  _id
                           POST_ID (FK)
```

```sql
CREATE TABLE TR_COMM_BOARD_LIKE (
    _id      BIGINT PRIMARY KEY,
    POST_ID  BIGINT NOT NULL,
    USE_ID   BIGINT NOT NULL,
    FOREIGN KEY (POST_ID) REFERENCES TB_COMM_BOARD_POST(_id),
    FOREIGN KEY (USE_ID) REFERENCES TB_COMM_USER(_id),
    UNIQUE (POST_ID, USE_ID)  -- Mỗi user chỉ like 1 lần/bài
);

-- Đếm số like của 1 bài viết
SELECT COUNT(*) AS like_count
FROM "TR_COMM_BOARD_LIKE"
WHERE "POST_ID" = 'post-id-here';

-- Kiểm tra user đã like bài viết chưa
SELECT COUNT(*) > 0 AS is_liked
FROM "TR_COMM_BOARD_LIKE"
WHERE "POST_ID" = 'post-id' AND "USE_ID" = 'user-id';
```

**Khi nào dùng N:M?**
- Khi cả 2 bên đều có thể liên kết với nhiều bản ghi bên kia
- User ↔ Chat Room (nhiều user trong nhiều room)
- User ↔ Post (like/bookmark — nhiều user like nhiều post)
- Student ↔ Course, Tag ↔ Article, ...

---

### 1.4. Tổng hợp quan hệ trong dự án

| Quan hệ | Bảng A | Bảng B | Loại |
|---------|--------|--------|------|
| User → Refresh Token | TB_COMM_USER | TB_COMM_RFRSH_TKN | 1:N |
| User → Login Log | TB_COMM_USER | TL_COMM_LGN_LOG | 1:N |
| User → Email Log | TB_COMM_USER | TL_COMM_EML_LOG | 1:N |
| User → Social Account | TB_COMM_USER | TB_COMM_SCL_ACNT | 1:N |
| User → Board Post | TB_COMM_USER | TB_COMM_BOARD_POST | 1:N |
| Post → Comment | TB_COMM_BOARD_POST | TB_COMM_BOARD_CMNT | 1:N |
| Post → Attachment | TB_COMM_BOARD_POST | TB_COMM_BOARD_ATCH | 1:N |
| User ↔ Post (Like) | TB_COMM_USER | TB_COMM_BOARD_POST | N:M |
| User ↔ Chat Room | TB_COMM_USER | TB_COMM_CHAT_ROOM | N:M |
| Chat Room → Message | TB_COMM_CHAT_ROOM | TB_COMM_CHAT_MSG | 1:N |
| Message → Attachment | TB_COMM_CHAT_MSG | TB_COMM_CHAT_MSG_ATCH | 1:N |
| Seller → Product | TB_COMM_USER | TB_PROD_PRD | 1:N |
| Buyer → Order | TB_COMM_USER | TB_COMM_ORDR | 1:N |
| Order → Order Item | TB_COMM_ORDR | TB_COMM_ORDR_ITEM | 1:N |
| Product → Order Item | TB_PROD_PRD | TB_COMM_ORDR_ITEM | 1:N |
| Order → Status History | TB_COMM_ORDR | TH_COMM_ORDR_STTS | 1:N |
| User → Activity Log | TB_COMM_USER | TL_COMM_USE_ACTV | 1:N |
| Code Group → Code | TC_COMM_CD_GRP | TC_COMM_CD | 1:N |

---

## 2. Các loại JOIN

### 2.1. INNER JOIN

**Định nghĩa:** Chỉ trả về các bản ghi có dữ liệu khớp ở **cả 2 bảng**. Nếu 1 bên không có dữ liệu tương ứng, bản ghi đó bị loại bỏ.

```
Bảng A        Bảng B           Kết quả INNER JOIN
┌───┐        ┌───┐            ┌───────┐
│ 1 │───────→│ 1 │            │ 1 - 1 │  ✅ khớp
│ 2 │───────→│ 2 │            │ 2 - 2 │  ✅ khớp
│ 3 │        │ 4 │            └───────┘
└───┘        └───┘
  3 không có bên B → loại
  4 không có bên A → loại
```

**Ví dụ 1:** Lấy danh sách bài viết kèm tên tác giả

```sql
SELECT
    p."POST_TTL"   AS title,
    p."POST_CN"    AS content,
    u."USE_NM"     AS author_name,
    u."USE_EML"    AS author_email,
    p."RGST_DT"    AS created_at
FROM "TB_COMM_BOARD_POST" p
INNER JOIN "TB_COMM_USER" u ON p."USE_ID" = u."_id"
WHERE p."DEL_YN" = 'N'
ORDER BY p."RGST_DT" DESC;
```

> Kết quả: Chỉ trả về bài viết có tác giả tồn tại. Nếu user bị xóa vật lý, bài viết đó sẽ không xuất hiện.

**Ví dụ 2:** Lấy chi tiết đơn hàng kèm thông tin sản phẩm

```sql
SELECT
    o."ORDR_NO"         AS order_number,
    oi."PRD_NM"         AS product_name,
    oi."UNIT_PRC"       AS unit_price,
    oi."ORDR_QTY"       AS quantity,
    oi."SUBTOT_AMT"     AS subtotal,
    p."PRD_IMG_URL"     AS current_image
FROM "TB_COMM_ORDR" o
INNER JOIN "TB_COMM_ORDR_ITEM" oi ON o."_id" = oi."ORDR_ID"
INNER JOIN "TB_PROD_PRD" p ON oi."PRD_ID" = p."_id"
WHERE o."BYR_ID" = 'buyer-id-here'
ORDER BY o."RGST_DT" DESC;
```

> Dùng 2 INNER JOIN liên tiếp: Order → Order Item → Product

**Ví dụ 3:** Lấy danh sách thành viên chat room

```sql
SELECT
    u."USE_NM"        AS member_name,
    u."PRFL_IMG_URL"  AS avatar,
    mbr."JOIN_DT"     AS joined_at,
    mbr."LAST_READ_DT" AS last_read
FROM "TR_COMM_CHAT_ROOM_MBR" mbr
INNER JOIN "TB_COMM_USER" u ON mbr."USE_ID" = u."_id"
WHERE mbr."CHAT_ROOM_ID" = 'room-id-here';
```

**Khi nào dùng INNER JOIN?**
- Khi chỉ cần dữ liệu khớp ở cả 2 bảng
- Khi FK luôn có giá trị hợp lệ (NOT NULL + FK constraint)
- Phổ biến nhất, hiệu suất tốt nhất

---

### 2.2. LEFT JOIN (LEFT OUTER JOIN)

**Định nghĩa:** Trả về **tất cả** bản ghi bên trái (A), kèm dữ liệu khớp bên phải (B). Nếu B không có dữ liệu khớp, các cột của B sẽ là `NULL`.

```
Bảng A        Bảng B           Kết quả LEFT JOIN
┌───┐        ┌───┐            ┌────────────┐
│ 1 │───────→│ 1 │            │ 1 - 1      │  ✅ khớp
│ 2 │───────→│ 2 │            │ 2 - 2      │  ✅ khớp
│ 3 │        │ 4 │            │ 3 - NULL   │  ✅ A có, B không có → NULL
└───┘        └───┘            └────────────┘
  4 không có bên A → loại (vì LEFT ưu tiên bảng trái)
```

**Ví dụ 1:** Lấy tất cả user kèm số bài viết (kể cả user chưa viết bài nào)

```sql
SELECT
    u."USE_NM"        AS user_name,
    u."USE_EML"       AS email,
    COUNT(p."_id")    AS post_count
FROM "TB_COMM_USER" u
LEFT JOIN "TB_COMM_BOARD_POST" p ON u."_id" = p."USE_ID" AND p."DEL_YN" = 'N'
WHERE u."DEL_YN" = 'N'
GROUP BY u."_id", u."USE_NM", u."USE_EML"
ORDER BY post_count DESC;
```

> User chưa viết bài → `post_count = 0` (không bị loại khỏi kết quả)

**Ví dụ 2:** Lấy sản phẩm kèm thông tin đơn hàng (kể cả sản phẩm chưa ai mua)

```sql
SELECT
    p."PRD_NM"          AS product_name,
    p."PRD_PRC"         AS price,
    p."STCK_QTY"        AS stock,
    COUNT(oi."_id")     AS order_count,
    COALESCE(SUM(oi."ORDR_QTY"), 0) AS total_sold
FROM "TB_PROD_PRD" p
LEFT JOIN "TB_COMM_ORDR_ITEM" oi ON p."_id" = oi."PRD_ID"
WHERE p."DEL_YN" = 'N'
  AND p."SLLR_ID" = 'seller-id-here'
GROUP BY p."_id", p."PRD_NM", p."PRD_PRC", p."STCK_QTY"
ORDER BY total_sold DESC;
```

> Sản phẩm chưa có đơn → `order_count = 0`, `total_sold = 0`

**Ví dụ 3:** Lấy bài viết kèm comment mới nhất (kể cả bài chưa có comment)

```sql
SELECT
    p."POST_TTL"     AS title,
    p."CMNT_CNT"     AS comment_count,
    c."CMNT_CN"      AS latest_comment,
    cu."USE_NM"      AS commenter_name,
    c."RGST_DT"      AS comment_date
FROM "TB_COMM_BOARD_POST" p
LEFT JOIN (
    SELECT "POST_ID", "CMNT_CN", "USE_ID", "RGST_DT",
           ROW_NUMBER() OVER (PARTITION BY "POST_ID" ORDER BY "RGST_DT" DESC) AS rn
    FROM "TB_COMM_BOARD_CMNT"
    WHERE "DEL_YN" = 'N'
) c ON p."_id" = c."POST_ID" AND c.rn = 1
LEFT JOIN "TB_COMM_USER" cu ON c."USE_ID" = cu."_id"
WHERE p."DEL_YN" = 'N'
ORDER BY p."RGST_DT" DESC;
```

> Dùng subquery + ROW_NUMBER() để lấy comment mới nhất cho mỗi bài

**Khi nào dùng LEFT JOIN?**
- Khi muốn giữ tất cả bản ghi bên trái, dù không có dữ liệu khớp bên phải
- Report/thống kê: đếm bài viết mỗi user (kể cả user 0 bài)
- Hiển thị danh sách với thông tin optional

---

### 2.3. RIGHT JOIN (RIGHT OUTER JOIN)

**Định nghĩa:** Ngược lại với LEFT JOIN — trả về **tất cả** bản ghi bên phải (B), kèm dữ liệu khớp bên trái (A). Nếu A không có dữ liệu khớp, các cột của A sẽ là `NULL`.

```
Bảng A        Bảng B           Kết quả RIGHT JOIN
┌───┐        ┌───┐            ┌────────────┐
│ 1 │───────→│ 1 │            │ 1 - 1      │  ✅ khớp
│ 2 │───────→│ 2 │            │ 2 - 2      │  ✅ khớp
│ 3 │        │ 4 │            │ NULL - 4   │  ✅ B có, A không có → NULL
└───┘        └───┘            └────────────┘
  3 không có bên B → loại
```

**Ví dụ:** Lấy tất cả code group kèm số code (kể cả group chưa có code nào)

```sql
SELECT
    cg."CD_GRP_ID"    AS group_id,
    cg."CD_GRP_NM"    AS group_name,
    COUNT(c."_id")    AS code_count
FROM "TC_COMM_CD" c
RIGHT JOIN "TC_COMM_CD_GRP" cg ON c."CD_GRP_ID" = cg."CD_GRP_ID"
WHERE cg."USE_YN" = 'Y'
GROUP BY cg."CD_GRP_ID", cg."CD_GRP_NM"
ORDER BY group_id;
```

> **Thực tế:** RIGHT JOIN ít dùng vì luôn có thể viết lại thành LEFT JOIN bằng cách đổi thứ tự bảng:

```sql
-- Viết lại bằng LEFT JOIN (khuyến nghị dùng cách này)
SELECT
    cg."CD_GRP_ID"    AS group_id,
    cg."CD_GRP_NM"    AS group_name,
    COUNT(c."_id")    AS code_count
FROM "TC_COMM_CD_GRP" cg
LEFT JOIN "TC_COMM_CD" c ON cg."CD_GRP_ID" = c."CD_GRP_ID"
WHERE cg."USE_YN" = 'Y'
GROUP BY cg."CD_GRP_ID", cg."CD_GRP_NM"
ORDER BY group_id;
```

**Khi nào dùng RIGHT JOIN?**
- Hiếm khi dùng — thường viết lại bằng LEFT JOIN cho dễ đọc
- Chỉ dùng khi cần giữ logic thứ tự bảng trong query phức tạp

---

### 2.4. FULL OUTER JOIN

**Định nghĩa:** Trả về **tất cả** bản ghi từ cả 2 bảng. Nếu không có dữ liệu khớp ở 1 bên, cột bên đó sẽ là `NULL`.

```
Bảng A        Bảng B           Kết quả FULL OUTER JOIN
┌───┐        ┌───┐            ┌────────────┐
│ 1 │───────→│ 1 │            │ 1 - 1      │  ✅ khớp
│ 2 │───────→│ 2 │            │ 2 - 2      │  ✅ khớp
│ 3 │        │ 4 │            │ 3 - NULL   │  ✅ chỉ có bên A
└───┘        └───┘            │ NULL - 4   │  ✅ chỉ có bên B
                              └────────────┘
```

**Ví dụ:** So sánh seller có sản phẩm vs seller có đơn hàng

```sql
SELECT
    COALESCE(p."SLLR_ID", oi."SLLR_ID") AS seller_id,
    COUNT(DISTINCT p."_id")              AS product_count,
    COUNT(DISTINCT oi."_id")             AS order_item_count
FROM "TB_PROD_PRD" p
FULL OUTER JOIN "TB_COMM_ORDR_ITEM" oi ON p."SLLR_ID" = oi."SLLR_ID"
GROUP BY COALESCE(p."SLLR_ID", oi."SLLR_ID");
```

> Trả về tất cả seller: kể cả seller có sản phẩm nhưng chưa có đơn, và seller có đơn nhưng sản phẩm đã bị xóa.

**Lưu ý:** MySQL không hỗ trợ `FULL OUTER JOIN`. PostgreSQL hỗ trợ đầy đủ.

**Khi nào dùng FULL OUTER JOIN?**
- Khi cần dữ liệu đầy đủ từ cả 2 bảng, không muốn mất bản ghi nào
- So sánh/đối chiếu 2 tập dữ liệu
- Hiếm dùng trong thực tế, thường thay bằng LEFT JOIN + UNION

---

### 2.5. CROSS JOIN

**Định nghĩa:** Tạo **tích Descartes** — mỗi bản ghi bảng A ghép với **tất cả** bản ghi bảng B. Không cần điều kiện ON.

```
Bảng A (3 rows) × Bảng B (2 rows) = 6 rows kết quả
┌───┐        ┌───┐            ┌───────┐
│ 1 │        │ X │            │ 1 - X │
│ 2 │   ×    │ Y │     =      │ 1 - Y │
│ 3 │        └───┘            │ 2 - X │
└───┘                         │ 2 - Y │
                              │ 3 - X │
                              │ 3 - Y │
                              └───────┘
```

**Ví dụ:** Tạo bảng giá cho tất cả combo sản phẩm × phương thức thanh toán

```sql
SELECT
    p."PRD_NM"        AS product_name,
    p."PRD_PRC"       AS base_price,
    c."CD_NM"         AS payment_method,
    CASE c."CD_VAL"
        WHEN 'BANK_TRANSFER' THEN p."PRD_PRC" * 0.98  -- giảm 2% cho chuyển khoản
        WHEN 'EMAIL_INVOICE' THEN p."PRD_PRC"
    END AS final_price
FROM "TB_PROD_PRD" p
CROSS JOIN "TC_COMM_CD" c
WHERE c."CD_GRP_ID" = 'PAY_MTHD'
  AND p."PRD_STTS_CD" = 'ACTV'
  AND p."DEL_YN" = 'N';
```

**Khi nào dùng CROSS JOIN?**
- Tạo tất cả tổ hợp có thể (combo, schedule, matrix)
- Tạo dữ liệu test
- **Cẩn thận**: Nếu A có 1000 rows, B có 1000 rows → kết quả 1,000,000 rows!

---

### 2.6. SELF JOIN

**Định nghĩa:** Bảng tự JOIN với chính nó. Dùng khi bảng có quan hệ đệ quy (self-referencing).

**Ví dụ 1:** Lấy comment kèm thông tin comment cha (reply system)

```sql
SELECT
    child."CMNT_CN"       AS reply_content,
    child."RGST_DT"       AS reply_date,
    parent."CMNT_CN"      AS original_comment,
    parent."RGST_DT"      AS original_date
FROM "TB_COMM_BOARD_CMNT" child
INNER JOIN "TB_COMM_BOARD_CMNT" parent ON child."PRNT_CMNT_ID" = parent."_id"
WHERE child."CMNT_DPTH" = 1     -- chỉ lấy reply
  AND child."DEL_YN" = 'N'
  AND parent."DEL_YN" = 'N';
```

> `TB_COMM_BOARD_CMNT` có `PRNT_CMNT_ID` trỏ về chính nó (reply depth 1)

**Ví dụ 2:** Tìm user đăng ký cùng ngày

```sql
SELECT
    u1."USE_NM" AS user_1,
    u2."USE_NM" AS user_2,
    DATE(u1."RGST_DT") AS signup_date
FROM "TB_COMM_USER" u1
INNER JOIN "TB_COMM_USER" u2
    ON DATE(u1."RGST_DT") = DATE(u2."RGST_DT")
    AND u1."_id" < u2."_id"   -- tránh trùng cặp (A,B) và (B,A)
WHERE u1."DEL_YN" = 'N' AND u2."DEL_YN" = 'N';
```

**Khi nào dùng SELF JOIN?**
- Cấu trúc cây/phân cấp: comment reply, danh mục cha-con, org chart
- So sánh bản ghi trong cùng 1 bảng

---

## 3. Bảng so sánh các loại JOIN

| Loại JOIN | Bảng trái (A) | Bảng phải (B) | Kết quả khi không khớp |
|-----------|:---:|:---:|---|
| **INNER JOIN** | chỉ khớp | chỉ khớp | Loại bỏ cả 2 bên |
| **LEFT JOIN** | tất cả | chỉ khớp | B = NULL |
| **RIGHT JOIN** | chỉ khớp | tất cả | A = NULL |
| **FULL OUTER JOIN** | tất cả | tất cả | Bên không khớp = NULL |
| **CROSS JOIN** | tất cả | tất cả | Tích Descartes (mọi tổ hợp) |
| **SELF JOIN** | chính nó | chính nó | Tùy loại JOIN sử dụng |

---

## 4. Ví dụ thực tế nâng cao

### 4.1. Multi-table JOIN — Dashboard thống kê seller

```sql
SELECT
    u."USE_NM"                           AS seller_name,
    COUNT(DISTINCT p."_id")              AS total_products,
    COUNT(DISTINCT oi."_id")             AS total_orders,
    COALESCE(SUM(oi."SUBTOT_AMT"), 0)   AS total_revenue,
    COALESCE(AVG(p."AVG_RTNG"), 0)      AS avg_rating
FROM "TB_COMM_USER" u
INNER JOIN "TB_PROD_PRD" p ON u."_id" = p."SLLR_ID" AND p."DEL_YN" = 'N'
LEFT JOIN "TB_COMM_ORDR_ITEM" oi ON p."_id" = oi."PRD_ID"
WHERE u."USE_ROLE_CD" = 'SELLER'
  AND u."DEL_YN" = 'N'
GROUP BY u."_id", u."USE_NM"
ORDER BY total_revenue DESC;
```

> INNER JOIN với Product (chỉ seller có sản phẩm), LEFT JOIN với Order Item (kể cả sản phẩm chưa có đơn)

### 4.2. Subquery + JOIN — Bài viết hot (nhiều like + comment)

```sql
SELECT
    p."POST_TTL"      AS title,
    u."USE_NM"        AS author,
    p."INQR_CNT"      AS views,
    p."LIKE_CNT"      AS likes,
    p."CMNT_CNT"      AS comments,
    (p."LIKE_CNT" * 3 + p."CMNT_CNT" * 2 + p."INQR_CNT") AS hot_score
FROM "TB_COMM_BOARD_POST" p
INNER JOIN "TB_COMM_USER" u ON p."USE_ID" = u."_id"
WHERE p."DEL_YN" = 'N'
  AND p."RGST_DT" >= NOW() - INTERVAL '7 days'
ORDER BY hot_score DESC
LIMIT 10;
```

### 4.3. LEFT JOIN + IS NULL — Tìm user chưa đăng nhập 30 ngày

```sql
SELECT
    u."USE_NM"     AS user_name,
    u."USE_EML"    AS email,
    u."LST_LGN_DT" AS last_login
FROM "TB_COMM_USER" u
LEFT JOIN "TL_COMM_LGN_LOG" l
    ON u."_id" = l."USE_ID"
    AND l."LGN_DT" >= NOW() - INTERVAL '30 days'
    AND l."LGN_RSLT_CD" = 'SUCC'
WHERE u."DEL_YN" = 'N'
  AND u."USE_STTS_CD" = 'ACTV'
  AND l."_id" IS NULL              -- không có login record trong 30 ngày
ORDER BY u."LST_LGN_DT" ASC;
```

> Pattern `LEFT JOIN ... WHERE B.id IS NULL` dùng để tìm bản ghi **không tồn tại** ở bảng B

### 4.4. JOIN trong Prisma ORM (dự án demo-vibe dùng Prisma)

Prisma không dùng JOIN trực tiếp, thay vào đó dùng `include` và `select`:

```typescript
// Tương đương INNER JOIN: Lấy post kèm author
const posts = await prisma.boardPost.findMany({
  where: { delYn: 'N' },
  include: {
    user: {
      select: { useNm: true, useEml: true, prflImgUrl: true }
    },
    comments: {
      where: { delYn: 'N' },
      orderBy: { rgstDt: 'desc' },
      take: 5
    }
  },
  orderBy: { rgstDt: 'desc' }
});

// Tương đương LEFT JOIN: Lấy user kèm số post
const usersWithPostCount = await prisma.user.findMany({
  where: { delYn: 'N' },
  include: {
    _count: {
      select: { boardPosts: true }
    }
  }
});

// Tương đương N:M JOIN qua bảng trung gian
const chatRoomsWithMembers = await prisma.chatRoom.findMany({
  include: {
    members: {
      include: {
        user: {
          select: { useNm: true, prflImgUrl: true }
        }
      }
    }
  }
});
```

---

## 5. Tips & Best Practices

1. **Ưu tiên INNER JOIN** khi chắc chắn cả 2 bảng đều có dữ liệu khớp
2. **Dùng LEFT JOIN** khi cần giữ dữ liệu bên trái dù bên phải không có
3. **Tránh RIGHT JOIN** — viết lại bằng LEFT JOIN cho dễ đọc
4. **FULL OUTER JOIN** rất hiếm dùng — cân nhắc dùng UNION thay thế
5. **CROSS JOIN** cẩn thận với số lượng row lớn (tích Descartes)
6. **Luôn đặt điều kiện filter** trong ON (không phải WHERE) khi dùng LEFT JOIN
7. **Index** các cột FK để JOIN nhanh hơn
8. **Dùng alias** ngắn gọn (u, p, oi) để query dễ đọc
