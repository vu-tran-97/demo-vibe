# Database Design Document

> **Project:** Vibe E-Commerce Platform
> **Last Updated:** 2026-03-27
> **Database:** PostgreSQL 16 with Prisma ORM
> **Total Tables:** 19

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│              NestJS + Prisma ORM (TypeScript)                │
├─────────────────────────────────────────────────────────────┤
│                    Prisma Client                             │
│         camelCase fields ──@map()──> UPPER_SNAKE_CASE        │
├─────────────────────────────────────────────────────────────┤
│                    PostgreSQL 16                             │
│            Connection: postgresql://localhost:5432            │
└─────────────────────────────────────────────────────────────┘
```

## 2. Naming Conventions

### Table Prefixes
| Prefix | Type | Example |
|--------|------|---------|
| `TB_` | General table | `TB_COMM_USER` |
| `TC_` | Code table | `TC_COMM_CD` |
| `TH_` | History table | `TH_COMM_ORDR_STTS` |
| `TL_` | Log table | `TL_COMM_LGN_LOG` |
| `TR_` | Relation table | `TR_COMM_BOARD_LIKE` |

### Field Suffixes
| Suffix | Meaning | Example |
|--------|---------|---------|
| `_DT` | DateTime | `RGST_DT`, `LST_LGN_DT` |
| `_NM` | Name | `USE_NM`, `PRD_NM` |
| `_CD` | Code | `USE_ROLE_CD`, `ORDR_STTS_CD` |
| `_YN` | Yes/No flag | `DEL_YN`, `RVKD_YN` |
| `_ID` | Identifier | `USE_ID`, `ORDR_ID` |
| `_CN` | Content | `POST_CN`, `MSSG_CN` |
| `_CNT` | Count | `INQR_CNT`, `LIKE_CNT` |
| `_AMT` | Amount | `ORDR_TOT_AMT`, `SUBTOT_AMT` |
| `_PRC` | Price | `PRD_PRC`, `UNIT_PRC` |
| `_URL` | URL | `PRD_IMG_URL`, `PRFL_IMG_URL` |
| `_NO` | Number | `ORDR_NO` |
| `_ADDR` | Address | `SHIP_ADDR` |
| `_SN` | Sequence | `SORT_NO` |

### Common Fields (all tables)
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `RGST_DT` | DateTime | `now()` | Created at |
| `RGTR_ID` | String | — | Created by |
| `MDFCN_DT` | DateTime | `now()` | Updated at |
| `MDFR_ID` | String | — | Updated by |
| `DEL_YN` | String(1) | `"N"` | Soft delete flag |

> Exception: Log (`TL_`) and History (`TH_`) tables have no `DEL_YN` — records are immutable.

---

## 3. ERD (Entity Relationship Diagram)

```
                              ┌─────────────────┐
                              │  TC_COMM_CD_GRP  │
                              │  (Code Group)    │
                              └───────┬─────────┘
                                      │ 1:N
                              ┌───────┴─────────┐
                              │   TC_COMM_CD     │
                              │   (Code)         │
                              └─────────────────┘

┌─────────────────┐     1:N     ┌─────────────────────┐
│  TB_COMM_USER   │────────────>│  TB_COMM_RFRSH_TKN  │
│  (User)         │             │  (Refresh Token)     │
└───────┬─────────┘             └─────────────────────┘
        │
        ├──1:N──> TL_COMM_LGN_LOG (Login Log)
        ├──1:N──> TB_COMM_SCL_ACNT (Social Account)
        ├──1:N──> TL_COMM_USE_ACTV (User Activity Log)
        │
        ├──1:N──> TB_COMM_BOARD_POST (Board Post)
        │                │
        │                ├──1:N──> TB_COMM_BOARD_CMNT (Comment)
        │                ├──1:N──> TB_COMM_BOARD_ATCH (Attachment)
        │                └──1:N──> TR_COMM_BOARD_LIKE (Like)
        │
        ├──1:N──> TB_COMM_CHAT_ROOM (Chat Room — as Creator)
        │                │
        │                ├──1:N──> TR_COMM_CHAT_ROOM_MBR (Member)
        │                └──1:N──> TB_COMM_CHAT_MSG (Message)
        │                                │
        │                                └──1:N──> TB_COMM_CHAT_MSG_ATCH
        │
        ├──1:N──> TB_PROD_PRD (Product — as Seller)
        │
        └──1:N──> TB_COMM_ORDR (Order — as Buyer)
                         │
                         ├──1:N──> TB_COMM_ORDR_ITEM (Order Item)
                         └──1:N──> TH_COMM_ORDR_STTS (Status History)
```

---

## 4. Table Definitions

### 4.1 Code Tables

#### TC_COMM_CD_GRP (Code Group)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | PK | |
| `CD_GRP_ID` | String | Y, unique | Group identifier (e.g., `USE_ROLE`) |
| `CD_GRP_NM` | String | Y | Group name |
| `CD_GRP_DC` | String | N | Description |
| `USE_YN` | String(1) | Y | Active flag (default: `Y`) |

#### TC_COMM_CD (Code)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | PK | |
| `CD_GRP_ID` | String | FK | Code group ID |
| `CD_VAL` | String | Y | Code value (e.g., `ACTV`) |
| `CD_NM` | String | Y | Display name |
| `CD_DC` | String | N | Description |
| `SORT_NO` | Number | Y | Sort order |
| `USE_YN` | String(1) | Y | Active flag |

**Unique:** `{ CD_GRP_ID, CD_VAL }`

#### Initial Code Data

| Group | Values |
|-------|--------|
| `USE_ROLE` | SUPER_ADMIN, SELLER, BUYER |
| `USER_STTS` | ACTV, INAC, SUSP |
| `SCL_PRVD` | GOOGLE, KAKAO, NAVER |
| `POST_CTGR` | NOTICE, FREE, QNA, REVIEW |
| `PRDT_CTGR` | CERAMICS, TEXTILES, ART, JEWELRY, HOME, FOOD |
| `PRDT_STTS` | DRAFT, ACTV, SOLD_OUT, HIDDEN |
| `ORDR_STTS` | PENDING, PAID, SHIPPED, DELIVERED, CANCELLED, REFUNDED |
| `ORDR_ITEM_STTS` | PENDING, CONFIRMED, SHIPPED, DELIVERED |
| `PAY_MTHD` | BANK_TRANSFER, EMAIL_INVOICE |
| `CHAT_ROOM_TYPE` | DM, GROUP |
| `MSG_TYPE` | TEXT, IMG, FILE |

### 4.2 Auth Module

#### TB_COMM_USER (User)
| Field | Type | Required | Constraint | Description |
|-------|------|----------|------------|-------------|
| `_id` | ObjectId | PK | | User ID |
| `USE_EML` | String | Y | unique, max 100 | Email |
| `USE_PSWD` | String | N | bcrypt hash | Password (null for social-only) |
| `USE_NM` | String | Y | max 50 | Name |
| `USE_NCNM` | String | N | unique, max 30 | Nickname |
| `PRFL_IMG_URL` | String | N | max 500 | Profile image URL |
| `USE_ROLE_CD` | String | Y | SUPER_ADMIN/SELLER/BUYER | Role (default: `BUYER`) |
| `USE_STTS_CD` | String | Y | ACTV/INAC/SUSP | Status (default: `ACTV`) |
| `LST_LGN_DT` | DateTime | N | | Last login |
| `EML_VRFC_YN` | String(1) | Y | | Email verified (default: `N`) |
| `EML_VRFC_TKN` | String | N | | Verification token |
| `EML_VRFC_EXPR_DT` | DateTime | N | | Token expiry |
| `PSWD_RST_TKN` | String | N | | Password reset token (UUID v4) |
| `PSWD_RST_EXPR_DT` | DateTime | N | | Reset token expiry (1 hour) |

#### TB_COMM_SCL_ACNT (Social Account)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `USE_ID` | ObjectId | FK | User ID |
| `SCL_PRVD_CD` | String | Y | Provider: GOOGLE/KAKAO/NAVER |
| `SCL_PRVD_USE_ID` | String | Y | Provider user ID |
| `SCL_EML` | String | N | Social email |
| `SCL_PRFL_IMG_URL` | String | N | Social profile image |
| `LNKD_DT` | DateTime | Y | Linked datetime |

**Unique:** `{ SCL_PRVD_CD, SCL_PRVD_USE_ID }`

#### TB_COMM_RFRSH_TKN (Refresh Token)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `USE_ID` | ObjectId | FK | User ID |
| `TKN_VAL` | String | Y, unique | Token value (hashed) |
| `EXPR_DT` | DateTime | Y | Expiry (TTL auto-delete) |
| `CLNT_IP_ADDR` | String | Y | Client IP |
| `USE_AGNT` | String | N | User-Agent |
| `RVKD_YN` | String(1) | Y | Revoked flag (default: `N`) |

#### TL_COMM_LGN_LOG (Login Log)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `USE_ID` | ObjectId | FK | User ID |
| `LGN_MTHD_CD` | String | Y | Method: EMAIL/GOOGLE/KAKAO/NAVER |
| `LGN_DT` | DateTime | Y | Login time |
| `LGN_IP_ADDR` | String | Y | IP address |
| `LGN_RSLT_CD` | String | Y | Result: SUCC/FAIL |
| `FAIL_RSN` | String | N | Failure reason |

> No `DEL_YN`. TTL: 90 days on `LGN_DT`.

### 4.3 Board Module

#### TB_COMM_BOARD_POST (Post)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `USE_ID` | ObjectId | FK | Author ID |
| `POST_TTL` | String | Y | Title (max 200) |
| `POST_CN` | String | Y | Content (max 10,000) |
| `POST_CTGR_CD` | String | Y | Category: NOTICE/FREE/QNA/REVIEW |
| `INQR_CNT` | Number | Y | View count (default: 0) |
| `LIKE_CNT` | Number | Y | Like count (default: 0) |
| `CMNT_CNT` | Number | Y | Comment count (default: 0) |
| `PNND_YN` | String(1) | Y | Pinned (default: `N`) |
| `SRCH_TAGS` | String[] | N | Search tags |

#### TB_COMM_BOARD_CMNT (Comment)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `POST_ID` | ObjectId | FK | Post ID |
| `USE_ID` | ObjectId | FK | Author ID |
| `CMNT_CN` | String | Y | Content (max 2,000) |
| `PRNT_CMNT_ID` | ObjectId | N | Parent comment (1-depth reply) |
| `CMNT_DPTH` | Number | Y | Depth: 0 (root) or 1 (reply) |

#### TB_COMM_BOARD_ATCH (Attachment)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `POST_ID` | ObjectId | FK | Post ID |
| `ATCH_TYPE_CD` | String | Y | Type: IMG/DOC/VIDEO |
| `ATCM_NM` | String | Y | File name |
| `ATCM_URL` | String | Y | Storage path |
| `ATCM_SIZE` | Number | Y | File size (max 10MB) |
| `ATCM_MIME_TYPE` | String | Y | MIME type |
| `SORT_NO` | Number | Y | Sort order |

#### TB_COMM_BOARD_BANNER (Banner)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `IMG_URL` | String | Y | Banner image URL |
| `TTL` | String | N | Title |
| `SUB_TTL` | String | N | Subtitle |
| `LNK_URL` | String | N | Link URL |
| `USE_YN` | String(1) | Y | Active flag |

#### TR_COMM_BOARD_LIKE (Like)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `POST_ID` | ObjectId | FK | Post ID |
| `USE_ID` | ObjectId | FK | User ID |

**Unique:** `{ POST_ID, USE_ID }`. Unlike = physical delete.

### 4.4 Product Module

#### TB_PROD_PRD (Product)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `SLLR_ID` | ObjectId | FK | Seller user ID |
| `PRD_NM` | String | Y | Name (max 200) |
| `PRD_DC` | String | Y | Description (max 10,000) |
| `PRD_PRC` | Float | Y | Price (>= 0) |
| `PRD_SALE_PRC` | Float | N | Sale price |
| `PRD_CTGR_CD` | String | Y | Category: CERAMICS/TEXTILES/ART/JEWELRY/HOME/FOOD |
| `PRD_STTS_CD` | String | Y | Status: DRAFT/ACTV/SOLD_OUT/HIDDEN (default: `ACTV`) |
| `PRD_IMG_URL` | String | Y | Main image URL |
| `PRD_IMG_URLS` | String[] | N | Additional images (max 5) |
| `STCK_QTY` | Number | Y | Stock quantity |
| `SOLD_CNT` | Number | Y | Sold count |
| `VIEW_CNT` | Number | Y | View count |
| `AVG_RTNG` | Float | Y | Average rating (0-5) |
| `RVW_CNT` | Number | Y | Review count |
| `SRCH_TAGS` | String[] | N | Search tags |

### 4.5 Order Module

#### TB_COMM_ORDR (Order)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ORDR_NO` | String | Y, unique | Order number (format: `VB-YYYY-MMDD-NNN`) |
| `BYR_ID` | ObjectId | FK | Buyer ID (guest: `000000000000000000000000`) |
| `ORDR_TOT_AMT` | Float | Y | Total amount |
| `ORDR_STTS_CD` | String | Y | Status: PENDING/PAID/SHIPPED/DELIVERED/CANCELLED/REFUNDED |
| `SHIP_ADDR` | String | N | Shipping address (max 500) |
| `SHIP_RCVR_NM` | String | N | Receiver name (max 50) |
| `SHIP_TELNO` | String | N | Receiver phone (max 20) |
| `SHIP_MEMO` | String | N | Shipping memo (max 200) |
| `TRCKG_NO` | String | N | Tracking number |
| `PAY_MTHD_CD` | String | N | Payment: BANK_TRANSFER/EMAIL_INVOICE |

#### TB_COMM_ORDR_ITEM (Order Item)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ORDR_ID` | ObjectId | FK | Order ID |
| `PRD_ID` | ObjectId | FK | Product ID |
| `SLLR_ID` | ObjectId | FK | Seller ID |
| `PRD_NM` | String | Y | Product name (snapshot) |
| `PRD_IMG_URL` | String | Y | Product image (snapshot) |
| `UNIT_PRC` | Float | Y | Unit price at order time |
| `ORDR_QTY` | Number | Y | Quantity (>= 1) |
| `SUBTOT_AMT` | Float | Y | Subtotal (unit price x qty) |
| `ITEM_STTS_CD` | String | Y | Status: PENDING/CONFIRMED/SHIPPED/DELIVERED |
| `PAY_STTS` | String | Y | Payment: UNPAID/PAID (default: `UNPAID`) |
| `TRCKG_NO` | String | N | Item tracking number |

#### TH_COMM_ORDR_STTS (Order Status History)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ORDR_ID` | ObjectId | FK | Order ID |
| `PREV_STTS_CD` | String | Y | Previous status |
| `NEW_STTS_CD` | String | Y | New status |
| `CHNG_RSN` | String | N | Change reason |
| `CHNGR_ID` | ObjectId | FK | Changed by user |
| `CHNG_DT` | DateTime | Y | Changed at |

> Immutable — no `DEL_YN`.

### 4.6 Chat Module

#### TB_COMM_CHAT_ROOM (Chat Room)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `CHAT_ROOM_NM` | String | Y | Room name (max 100) |
| `CHAT_ROOM_TYPE_CD` | String | Y | Type: DM/GROUP |
| `MAX_MBR_CNT` | Number | Y | Max members (DM: 2, GROUP: 100) |
| `CRTR_ID` | ObjectId | FK | Creator ID |
| `LST_MSSG_CN` | String | N | Last message preview |
| `LST_MSSG_DT` | DateTime | N | Last message time |

#### TR_COMM_CHAT_ROOM_MBR (Member)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `CHAT_ROOM_ID` | ObjectId | FK | Chat room ID |
| `USE_ID` | ObjectId | FK | User ID |
| `JOIN_DT` | DateTime | Y | Joined at |
| `LAST_READ_DT` | DateTime | N | Last read time |
| `NOTI_YN` | String(1) | Y | Notifications enabled |

**Unique:** `{ CHAT_ROOM_ID, USE_ID }`. Leave = physical delete.

#### TB_COMM_CHAT_MSG (Message)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `CHAT_ROOM_ID` | ObjectId | FK | Room ID |
| `USE_ID` | ObjectId | FK | Sender ID |
| `MSSG_CN` | String | Y | Content (max 5,000) |
| `MSSG_TYPE_CD` | String | Y | Type: TEXT/IMG/FILE |
| `SEND_DT` | DateTime | Y | Sent at |

### 4.7 Admin Module

#### TL_COMM_USE_ACTV (User Activity Log)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `USE_ID` | ObjectId | FK | Target user ID |
| `ACTV_TYPE_CD` | String | Y | Type: ROLE_CHANGE/STTS_CHANGE/PRFL_UPDATE/LGN |
| `PREV_VAL` | String | N | Previous value |
| `NEW_VAL` | String | N | New value |
| `PRFMR_ID` | ObjectId | FK | Performed by user |
| `CLNT_IP_ADDR` | String | N | Client IP |
| `ACTV_DT` | DateTime | Y | Activity time |

> No `DEL_YN`. TTL: 180 days on `ACTV_DT`.

---

## 5. Index Strategy

### Single Indexes
| Table | Field | Type | Purpose |
|------------|-------|------|---------|
| TB_COMM_USER | USE_EML | Unique | Email login |
| TB_COMM_USER | USE_NCNM | Unique (sparse) | Nickname |
| TB_COMM_USER | USE_ROLE_CD | Single | Role filter |
| TB_PROD_PRD | PRD_CTGR_CD | Single | Category filter |
| TB_COMM_ORDR | ORDR_NO | Unique | Order lookup |
| TB_COMM_RFRSH_TKN | TKN_VAL | Unique | Token validation |

### Compound Indexes
| Collection | Fields | Purpose |
|------------|--------|---------|
| TB_COMM_BOARD_POST | DEL_YN + POST_CTGR_CD + RGST_DT(desc) | Board listing |
| TB_COMM_BOARD_CMNT | POST_ID + DEL_YN + RGST_DT | Post comments |
| TB_PROD_PRD | DEL_YN + PRD_CTGR_CD + PRD_STTS_CD + RGST_DT(desc) | Product listing |
| TB_COMM_ORDR | BYR_ID + ORDR_STTS_CD + RGST_DT(desc) | Buyer orders |
| TB_COMM_ORDR_ITEM | SLLR_ID + ITEM_STTS_CD + RGST_DT(desc) | Seller sales |
| TB_COMM_CHAT_MSG | CHAT_ROOM_ID + SEND_DT(desc) | Chat messages |

### TTL Indexes (Auto-delete)
| Collection | Field | TTL |
|------------|-------|-----|
| TB_COMM_RFRSH_TKN | EXPR_DT | On expiry |
| TL_COMM_LGN_LOG | LGN_DT | 90 days |
| TL_COMM_USE_ACTV | ACTV_DT | 180 days |

### Text Indexes (Full-text search)
| Collection | Fields |
|------------|--------|
| TB_COMM_BOARD_POST | POST_TTL + POST_CN |
| TB_PROD_PRD | PRD_NM + PRD_DC + SRCH_TAGS |

---

## 6. Prisma Schema Mapping

```
PostgreSQL Table           Prisma Model              @@map()
───────────────────────────────────────────────────────────────
TC_COMM_CD_GRP           CommonCodeGroup            TC_COMM_CD_GRP
TC_COMM_CD               CommonCode                 TC_COMM_CD
TB_COMM_USER             User                       TB_COMM_USER
TB_COMM_SCL_ACNT         SocialAccount              TB_COMM_SCL_ACNT
TB_COMM_RFRSH_TKN        RefreshToken               TB_COMM_RFRSH_TKN
TL_COMM_LGN_LOG          LoginLog                   TL_COMM_LGN_LOG
TB_COMM_BOARD_POST       BoardPost                  TB_COMM_BOARD_POST
TB_COMM_BOARD_CMNT       BoardComment               TB_COMM_BOARD_CMNT
TB_COMM_BOARD_ATCH       BoardAttachment            TB_COMM_BOARD_ATCH
TB_COMM_BOARD_BANNER     BoardBanner                TB_COMM_BOARD_BANNER
TR_COMM_BOARD_LIKE       BoardLike                  TR_COMM_BOARD_LIKE
TB_COMM_CHAT_ROOM        ChatRoom                   TB_COMM_CHAT_ROOM
TR_COMM_CHAT_ROOM_MBR    ChatRoomMember             TR_COMM_CHAT_ROOM_MBR
TB_COMM_CHAT_MSG         ChatMessage                TB_COMM_CHAT_MSG
TB_COMM_CHAT_MSG_ATCH    ChatMessageAttachment      TB_COMM_CHAT_MSG_ATCH
TB_PROD_PRD              Product                    TB_PROD_PRD
TB_COMM_ORDR             Order                      TB_COMM_ORDR
TB_COMM_ORDR_ITEM        OrderItem                  TB_COMM_ORDR_ITEM
TH_COMM_ORDR_STTS        OrderStatusHistory         TH_COMM_ORDR_STTS
TL_COMM_USE_ACTV         UserActivity               TL_COMM_USE_ACTV
```

> Field mapping: Prisma uses `camelCase`, PostgreSQL uses `UPPER_SNAKE_CASE` via `@map()`.

---

## 7. Production Deployment

- **Database hosting:** Railway PostgreSQL
- **Connection:** Railway-provided `DATABASE_URL` environment variable

---

## 8. Production Data Sources

The platform is seeded with **50,000 products** from 3 real sources, all prices in VND:

| Source | Products | Details |
|--------|----------|---------|
| Tiki.vn API | 40,986 | 24 categories, VND native prices |
| OpenLibrary API | 8,137 | Books with covers, VND 50k-500k |
| Makeup API | 877 | Cosmetics, VND converted from USD |

- **Crawl script:** `scripts/crawl-tiki.ts`
- **Currency:** VND (all prices stored and displayed in Vietnamese Dong)
