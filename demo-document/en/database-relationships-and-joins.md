# Database Relationships & Join Queries

> **Project:** Vibe E-Commerce Platform
> **Database:** PostgreSQL 16 with Prisma ORM
> **Updated:** 2026-03-27

---

## 1. Relationship Types

### 1.1. One-to-One (1:1)

**Definition:** Each record in Table A is linked to **exactly one** record in Table B, and vice versa.

**Characteristics:**
- FK typically has a `UNIQUE` constraint
- Used when splitting sensitive or rarely accessed data into a separate table

**Example:**

Suppose we split User Profile into a separate table (1 User = 1 Profile):

```sql
-- User table keeps only login info
CREATE TABLE TB_COMM_USER (
    USER_ID   BIGINT PRIMARY KEY,
    USE_EML   VARCHAR(100) NOT NULL UNIQUE,
    USE_PSWD  VARCHAR(60)
);

-- Profile table holds personal info separately
CREATE TABLE TB_COMM_USER_PRFL (
    PRFL_ID      BIGINT PRIMARY KEY,
    USER_ID      BIGINT NOT NULL UNIQUE,  -- UNIQUE ensures 1:1
    USE_NM       VARCHAR(50),
    PRFL_IMG_URL VARCHAR(500),
    FOREIGN KEY (USER_ID) REFERENCES TB_COMM_USER(USER_ID)
);
```

**When to use 1:1?**
- Separate sensitive data (password, token) from display data
- Split rarely queried data for performance optimization
- Extend an existing table without ALTER TABLE

---

### 1.2. One-to-Many (1:N)

**Definition:** Each record in Table A can be linked to **many** records in Table B, but each record in B belongs to **only one** record in A.

**Characteristics:**
- The "many" (N) table contains the FK pointing to the "one" (1) table
- The most common relationship type

**Project Examples:**

#### a) User → Refresh Tokens (1 User has many Tokens)

```
TB_COMM_USER (1) ──────→ TB_COMM_RFRSH_TKN (N)
    _id                      USE_ID (FK → TB_COMM_USER._id)
```

```sql
CREATE TABLE TB_COMM_RFRSH_TKN (
    _id       BIGINT PRIMARY KEY,
    USE_ID    BIGINT NOT NULL,           -- FK: each token belongs to 1 user
    TKN_VAL   VARCHAR(255) NOT NULL,
    EXPR_DT   TIMESTAMP NOT NULL,
    FOREIGN KEY (USE_ID) REFERENCES TB_COMM_USER(_id)
);

-- Get all tokens for a user
SELECT * FROM "TB_COMM_RFRSH_TKN" WHERE "USE_ID" = 'user-id-here';
```

#### b) User → Board Posts (1 User writes many posts)

```
TB_COMM_USER (1) ──────→ TB_COMM_BOARD_POST (N)
    _id                      USE_ID (FK → TB_COMM_USER._id)
```

```sql
SELECT * FROM "TB_COMM_BOARD_POST" WHERE "USE_ID" = 'user-id-here';
```

#### c) Post → Comments (1 Post has many comments)

```
TB_COMM_BOARD_POST (1) ──────→ TB_COMM_BOARD_CMNT (N)
    _id                            POST_ID (FK → TB_COMM_BOARD_POST._id)
```

```sql
SELECT * FROM "TB_COMM_BOARD_CMNT" WHERE "POST_ID" = 'post-id-here';
```

#### d) Order → Order Items (1 Order has many items)

```
TB_COMM_ORDR (1) ──────→ TB_COMM_ORDR_ITEM (N)
    _id                      ORDR_ID (FK → TB_COMM_ORDR._id)
```

```sql
SELECT * FROM "TB_COMM_ORDR_ITEM" WHERE "ORDR_ID" = 'order-id-here';
```

**When to use 1:N?**
- When one entity "owns" many child entities
- Log/History: 1 user → many login logs, 1 order → many status history records
- Parent-child: 1 post → many comments, 1 chat room → many messages

---

### 1.3. Many-to-Many (N:M)

**Definition:** Each record in Table A can be linked to **many** records in Table B, and vice versa.

**Characteristics:**
- Requires a **junction table** (pivot table) to hold FK pairs
- Junction tables use the `TR_` (relation) prefix in this project
- Junction tables can hold additional data (join date, role, etc.)

**Project Examples:**

#### a) User ↔ Chat Room (many Users join many Chat Rooms)

```
TB_COMM_USER (N) ←──── TR_COMM_CHAT_ROOM_MBR ────→ TB_COMM_CHAT_ROOM (M)
    _id                    USE_ID (FK)                     _id
                           CHAT_ROOM_ID (FK)
                           JOIN_DT
                           LAST_READ_DT
```

```sql
-- Junction table
CREATE TABLE TR_COMM_CHAT_ROOM_MBR (
    _id           BIGINT PRIMARY KEY,
    CHAT_ROOM_ID  BIGINT NOT NULL,
    USE_ID        BIGINT NOT NULL,
    JOIN_DT       TIMESTAMP NOT NULL,
    LAST_READ_DT  TIMESTAMP,
    NOTI_YN       CHAR(1) DEFAULT 'Y',
    FOREIGN KEY (CHAT_ROOM_ID) REFERENCES TB_COMM_CHAT_ROOM(_id),
    FOREIGN KEY (USE_ID) REFERENCES TB_COMM_USER(_id),
    UNIQUE (CHAT_ROOM_ID, USE_ID)  -- Each user joins only once
);

-- Get all chat rooms a user belongs to
SELECT cr.*
FROM "TB_COMM_CHAT_ROOM" cr
JOIN "TR_COMM_CHAT_ROOM_MBR" mbr ON cr."_id" = mbr."CHAT_ROOM_ID"
WHERE mbr."USE_ID" = 'user-id-here';

-- Get all members of a chat room
SELECT u.*
FROM "TB_COMM_USER" u
JOIN "TR_COMM_CHAT_ROOM_MBR" mbr ON u."_id" = mbr."USE_ID"
WHERE mbr."CHAT_ROOM_ID" = 'room-id-here';
```

#### b) User ↔ Post (Like relationship — many Users like many Posts)

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
    UNIQUE (POST_ID, USE_ID)  -- Each user can like only once per post
);

-- Count likes for a post
SELECT COUNT(*) AS like_count
FROM "TR_COMM_BOARD_LIKE"
WHERE "POST_ID" = 'post-id-here';

-- Check if a user has liked a post
SELECT COUNT(*) > 0 AS is_liked
FROM "TR_COMM_BOARD_LIKE"
WHERE "POST_ID" = 'post-id' AND "USE_ID" = 'user-id';
```

**When to use N:M?**
- When both sides can link to many records on the other side
- User ↔ Chat Room (many users in many rooms)
- User ↔ Post (like/bookmark — many users like many posts)
- Student ↔ Course, Tag ↔ Article, etc.

---

### 1.4. Project Relationship Summary

| Relationship | Table A | Table B | Type |
|-------------|---------|---------|------|
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

## 2. JOIN Types

### 2.1. INNER JOIN

**Definition:** Returns only records that have matching data in **both tables**. If one side has no match, that record is excluded.

```
Table A       Table B          INNER JOIN Result
┌───┐        ┌───┐            ┌───────┐
│ 1 │───────→│ 1 │            │ 1 - 1 │  ✅ match
│ 2 │───────→│ 2 │            │ 2 - 2 │  ✅ match
│ 3 │        │ 4 │            └───────┘
└───┘        └───┘
  3 has no match in B → excluded
  4 has no match in A → excluded
```

**Example 1:** Get posts with author names

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

> Result: Only returns posts whose author exists. If a user was physically deleted, their posts won't appear.

**Example 2:** Get order details with product info

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

> Uses 2 chained INNER JOINs: Order → Order Item → Product

**Example 3:** Get chat room members

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

**When to use INNER JOIN?**
- When you only need data that matches in both tables
- When FK always has a valid value (NOT NULL + FK constraint)
- Most common and best performing

---

### 2.2. LEFT JOIN (LEFT OUTER JOIN)

**Definition:** Returns **all** records from the left table (A), with matching data from the right table (B). If B has no match, B's columns will be `NULL`.

```
Table A       Table B          LEFT JOIN Result
┌───┐        ┌───┐            ┌────────────┐
│ 1 │───────→│ 1 │            │ 1 - 1      │  ✅ match
│ 2 │───────→│ 2 │            │ 2 - 2      │  ✅ match
│ 3 │        │ 4 │            │ 3 - NULL   │  ✅ A exists, B doesn't → NULL
└───┘        └───┘            └────────────┘
  4 has no match in A → excluded (LEFT prioritizes left table)
```

**Example 1:** Get all users with post count (including users with 0 posts)

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

> Users with no posts → `post_count = 0` (not excluded from results)

**Example 2:** Get products with order info (including unsold products)

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

> Unsold products → `order_count = 0`, `total_sold = 0`

**Example 3:** Get posts with latest comment (including posts with no comments)

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

> Uses subquery + ROW_NUMBER() to get the latest comment per post

**When to use LEFT JOIN?**
- When you want all records from the left table, even without right-side matches
- Reports/analytics: count posts per user (including users with 0 posts)
- Displaying lists with optional information

---

### 2.3. RIGHT JOIN (RIGHT OUTER JOIN)

**Definition:** Opposite of LEFT JOIN — returns **all** records from the right table (B), with matching data from the left table (A). If A has no match, A's columns will be `NULL`.

```
Table A       Table B          RIGHT JOIN Result
┌───┐        ┌───┐            ┌────────────┐
│ 1 │───────→│ 1 │            │ 1 - 1      │  ✅ match
│ 2 │───────→│ 2 │            │ 2 - 2      │  ✅ match
│ 3 │        │ 4 │            │ NULL - 4   │  ✅ B exists, A doesn't → NULL
└───┘        └───┘            └────────────┘
  3 has no match in B → excluded
```

**Example:** Get all code groups with code count (including empty groups)

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

> **In practice:** RIGHT JOIN is rarely used because it can always be rewritten as LEFT JOIN by swapping table order:

```sql
-- Rewritten as LEFT JOIN (recommended)
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

**When to use RIGHT JOIN?**
- Rarely used — typically rewrite as LEFT JOIN for readability
- Only when you need to maintain table order logic in complex queries

---

### 2.4. FULL OUTER JOIN

**Definition:** Returns **all** records from both tables. If no match on one side, that side's columns will be `NULL`.

```
Table A       Table B          FULL OUTER JOIN Result
┌───┐        ┌───┐            ┌────────────┐
│ 1 │───────→│ 1 │            │ 1 - 1      │  ✅ match
│ 2 │───────→│ 2 │            │ 2 - 2      │  ✅ match
│ 3 │        │ 4 │            │ 3 - NULL   │  ✅ only in A
└───┘        └───┘            │ NULL - 4   │  ✅ only in B
                              └────────────┘
```

**Example:** Compare sellers with products vs sellers with orders

```sql
SELECT
    COALESCE(p."SLLR_ID", oi."SLLR_ID") AS seller_id,
    COUNT(DISTINCT p."_id")              AS product_count,
    COUNT(DISTINCT oi."_id")             AS order_item_count
FROM "TB_PROD_PRD" p
FULL OUTER JOIN "TB_COMM_ORDR_ITEM" oi ON p."SLLR_ID" = oi."SLLR_ID"
GROUP BY COALESCE(p."SLLR_ID", oi."SLLR_ID");
```

> Returns all sellers: including those with products but no orders, and those with orders but deleted products.

**Note:** MySQL does not support `FULL OUTER JOIN`. PostgreSQL fully supports it.

**When to use FULL OUTER JOIN?**
- When you need complete data from both tables, losing no records
- Comparing/reconciling two datasets
- Rarely used in practice, often replaced with LEFT JOIN + UNION

---

### 2.5. CROSS JOIN

**Definition:** Creates a **Cartesian product** — each record in Table A is paired with **every** record in Table B. No ON condition needed.

```
Table A (3 rows) × Table B (2 rows) = 6 result rows
┌───┐        ┌───┐            ┌───────┐
│ 1 │        │ X │            │ 1 - X │
│ 2 │   ×    │ Y │     =      │ 1 - Y │
│ 3 │        └───┘            │ 2 - X │
└───┘                         │ 2 - Y │
                              │ 3 - X │
                              │ 3 - Y │
                              └───────┘
```

**Example:** Create a pricing table for all product × payment method combinations

```sql
SELECT
    p."PRD_NM"        AS product_name,
    p."PRD_PRC"       AS base_price,
    c."CD_NM"         AS payment_method,
    CASE c."CD_VAL"
        WHEN 'BANK_TRANSFER' THEN p."PRD_PRC" * 0.98  -- 2% discount for bank transfer
        WHEN 'EMAIL_INVOICE' THEN p."PRD_PRC"
    END AS final_price
FROM "TB_PROD_PRD" p
CROSS JOIN "TC_COMM_CD" c
WHERE c."CD_GRP_ID" = 'PAY_MTHD'
  AND p."PRD_STTS_CD" = 'ACTV'
  AND p."DEL_YN" = 'N';
```

**When to use CROSS JOIN?**
- Generate all possible combinations (combos, schedules, matrices)
- Create test data
- **Caution**: If A has 1000 rows and B has 1000 rows → result is 1,000,000 rows!

---

### 2.6. SELF JOIN

**Definition:** A table JOINs with itself. Used when a table has a recursive (self-referencing) relationship.

**Example 1:** Get replies with their parent comments (reply system)

```sql
SELECT
    child."CMNT_CN"       AS reply_content,
    child."RGST_DT"       AS reply_date,
    parent."CMNT_CN"      AS original_comment,
    parent."RGST_DT"      AS original_date
FROM "TB_COMM_BOARD_CMNT" child
INNER JOIN "TB_COMM_BOARD_CMNT" parent ON child."PRNT_CMNT_ID" = parent."_id"
WHERE child."CMNT_DPTH" = 1     -- only replies
  AND child."DEL_YN" = 'N'
  AND parent."DEL_YN" = 'N';
```

> `TB_COMM_BOARD_CMNT` has `PRNT_CMNT_ID` referencing itself (reply depth 1)

**Example 2:** Find users who signed up on the same day

```sql
SELECT
    u1."USE_NM" AS user_1,
    u2."USE_NM" AS user_2,
    DATE(u1."RGST_DT") AS signup_date
FROM "TB_COMM_USER" u1
INNER JOIN "TB_COMM_USER" u2
    ON DATE(u1."RGST_DT") = DATE(u2."RGST_DT")
    AND u1."_id" < u2."_id"   -- avoid duplicate pairs (A,B) and (B,A)
WHERE u1."DEL_YN" = 'N' AND u2."DEL_YN" = 'N';
```

**When to use SELF JOIN?**
- Tree/hierarchy structures: comment replies, parent-child categories, org charts
- Comparing records within the same table

---

## 3. JOIN Comparison Table

| JOIN Type | Left Table (A) | Right Table (B) | When No Match |
|-----------|:---:|:---:|---|
| **INNER JOIN** | matched only | matched only | Both sides excluded |
| **LEFT JOIN** | all | matched only | B = NULL |
| **RIGHT JOIN** | matched only | all | A = NULL |
| **FULL OUTER JOIN** | all | all | Unmatched side = NULL |
| **CROSS JOIN** | all | all | Cartesian product (all combinations) |
| **SELF JOIN** | itself | itself | Depends on JOIN type used |

---

## 4. Advanced Real-World Examples

### 4.1. Multi-table JOIN — Seller Dashboard Stats

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

> INNER JOIN with Product (only sellers with products), LEFT JOIN with Order Item (including products with no orders)

### 4.2. Subquery + JOIN — Trending Posts (most likes + comments)

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

### 4.3. LEFT JOIN + IS NULL — Find Inactive Users (no login in 30 days)

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
  AND l."_id" IS NULL              -- no login records in the last 30 days
ORDER BY u."LST_LGN_DT" ASC;
```

> The `LEFT JOIN ... WHERE B.id IS NULL` pattern finds records that **do not exist** in Table B

### 4.4. JOINs in Prisma ORM (used in demo-vibe project)

Prisma doesn't use JOIN directly. Instead, it uses `include` and `select`:

```typescript
// Equivalent to INNER JOIN: Get posts with author
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

// Equivalent to LEFT JOIN: Get users with post count
const usersWithPostCount = await prisma.user.findMany({
  where: { delYn: 'N' },
  include: {
    _count: {
      select: { boardPosts: true }
    }
  }
});

// Equivalent to N:M JOIN via junction table
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

1. **Prefer INNER JOIN** when you're sure both tables have matching data
2. **Use LEFT JOIN** when you need to keep left-side data even without right-side matches
3. **Avoid RIGHT JOIN** — rewrite as LEFT JOIN for readability
4. **FULL OUTER JOIN** is rarely needed — consider UNION instead
5. **CROSS JOIN** with caution on large row counts (Cartesian product)
6. **Always put filter conditions** in ON (not WHERE) when using LEFT JOIN
7. **Index** FK columns for faster JOINs
8. **Use short aliases** (u, p, oi) for readable queries
