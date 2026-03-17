# Database Design (SSoT)

> This document is the **Single Source of Truth** for the demo-vibe project.
> All DB schema changes must be made here first, then reflected in code.

## 1. Common Rules

### Collection Naming
- Prefix rules: `TB_` (general), `TC_` (code), `TH_` (history), `TL_` (log), `TR_` (relation)
- All collection names in `UPPER_SNAKE_CASE`

### Field Naming
- All field names in `UPPER_SNAKE_CASE`
- Suffix rules:
  - `_YMD`: Date (YYYYMMDD)
  - `_DT`: DateTime
  - `_AMT`: Amount
  - `_NM`: Name
  - `_CD`: Code
  - `_NO`: Number
  - `_CN`: Content
  - `_YN`: Yes/No flag (Y/N)
  - `_SN`: Sequence number
  - `_ADDR`: Address
  - `_URL`: URL
  - `_ID`: Identifier
  - `_CNT`: Count

### Common Fields (included in all collections)
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| RGST_DT | DateTime | `now()` | Created at |
| RGTR_ID | String | - | Created by |
| MDFCN_DT | DateTime | `now()` | Updated at |
| MDFR_ID | String | - | Updated by |
| DEL_YN | String(1) | `"N"` | Soft delete flag (Y/N) |

### Soft Delete Policy
- All deletions use `DEL_YN = "Y"` (no physical deletes)
- Default query filter: `{ DEL_YN: "N" }`
- Log collections (`TL_`) cannot be deleted (no DEL_YN field)

---

## 2. ERD Overview

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
│  TB_COMM_USER   │────────────→│  TB_COMM_RFRSH_TKN  │
│  (User)         │             │  (Refresh Token)     │
└───────┬─────────┘             └─────────────────────┘
        │
        ├──1:N──→ TL_COMM_LGN_LOG (Login Log)
        │
        ├──1:N──→ TB_COMM_SCL_ACNT (Social Account)
        │
        ├──1:N──→ TB_COMM_BOARD_POST (Board Post)
        │                │
        │                ├──1:N──→ TB_COMM_BOARD_CMNT (Comment)
        │                │
        │                └──1:N──→ TB_COMM_BOARD_ATCH (Attachment)
        │
        ├──1:N──→ TR_COMM_BOARD_LIKE (Like)
        │
        ├──N:M──→ TR_COMM_CHAT_ROOM_MBR ──N:1──→ TB_COMM_CHAT_ROOM (Chat Room)
        │                                              │
        └──1:N──→ TB_COMM_CHAT_MSG ──────────N:1───────┘
                         │
                         └──1:N──→ TB_COMM_CHAT_MSG_ATCH (Message Attachment)

        ├──1:N──→ TB_PROD_PRD (Product — as Seller)
        │                │
        │                └──N:1──→ TB_COMM_ORDR_ITEM (Order Item)
        │
        ├──1:N──→ TB_COMM_ORDR (Order — as Buyer)
        │                │
        │                ├──1:N──→ TB_COMM_ORDR_ITEM (Order Item)
        │                │
        │                └──1:N──→ TH_COMM_ORDR_STTS (Order Status History)
        │
        └──1:N──→ TL_COMM_USE_ACTV (User Activity Log)
```

**Total 20 collections**: TB 8 + TC 2 + TL 2 + TH 1 + TR 2 + Chat 3 + Product 1 + Order 1

> Auth module fields updated to support password reset flow (PSWD_RST_TKN, PSWD_RST_EXPR_DT in TB_COMM_USER) per blueprint 001-auth.
> RBAC: USE_ROLE_CD added to TB_COMM_USER, USE_ROLE code group added to TC_COMM_CD per blueprint 002-rbac.

---

## 3. Common Module (Code Tables)

### TC_COMM_CD_GRP (Code Group)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | ObjectId | PK | Code group ID |
| CD_GRP_ID | String | Y | Code group identifier (unique, e.g. `USER_STTS`) |
| CD_GRP_NM | String | Y | Code group name (e.g. `User Status`) |
| CD_GRP_DC | String | N | Code group description |
| USE_YN | String(1) | Y | Active flag (default: `Y`) |

### TC_COMM_CD (Code)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | ObjectId | PK | Code ID |
| CD_GRP_ID | String | FK | Code group identifier |
| CD_VAL | String | Y | Code value (e.g. `ACTV`) |
| CD_NM | String | Y | Code name (e.g. `Active`) |
| CD_DC | String | N | Code description |
| SORT_NO | Number | Y | Sort order |
| USE_YN | String(1) | Y | Active flag (default: `Y`) |

#### Initial Code Data

| Code Group (CD_GRP_ID) | Group Name | Code Value (CD_VAL) | Code Name |
|------------------------|------------|---------------------|-----------|
| `USE_ROLE` | User Role | `SUPER_ADMIN` | Super Admin |
| | | `SELLER` | Seller |
| | | `BUYER` | Buyer |
| `USER_STTS` | User Status | `ACTV` | Active |
| | | `INAC` | Inactive |
| | | `SUSP` | Suspended |
| `LGN_RSLT` | Login Result | `SUCC` | Success |
| | | `FAIL` | Failure |
| `SCL_PRVD` | Social Provider | `GOOGLE` | Google |
| | | `KAKAO` | Kakao |
| | | `NAVER` | Naver |
| `POST_CTGR` | Post Category | `NOTICE` | Notice |
| | | `FREE` | Free Board |
| | | `QNA` | Q&A |
| | | `REVIEW` | Product Review |
| `CHAT_ROOM_TYPE` | Chat Room Type | `DM` | Direct Message |
| | | `GROUP` | Group Chat |
| `MSG_TYPE` | Message Type | `TEXT` | Text |
| | | `IMG` | Image |
| | | `FILE` | File |
| `ATCH_TYPE` | Attachment Type | `IMG` | Image |
| | | `DOC` | Document |
| | | `VIDEO` | Video |
| `PRDT_CTGR` | Product Category | `CERAMICS` | Ceramics & Pottery |
| | | `TEXTILES` | Textiles & Fabrics |
| | | `ART` | Art & Prints |
| | | `JEWELRY` | Jewelry & Accessories |
| | | `HOME` | Home & Living |
| | | `FOOD` | Food & Beverages |
| `PRDT_STTS` | Product Status | `DRAFT` | Draft |
| | | `ACTV` | Active |
| | | `SOLD_OUT` | Sold Out |
| | | `HIDDEN` | Hidden |
| `ORDR_STTS` | Order Status | `PENDING` | Pending |
| | | `PAID` | Paid |
| | | `SHIPPED` | Shipped |
| | | `DELIVERED` | Delivered |
| | | `CANCELLED` | Cancelled |
| | | `REFUNDED` | Refunded |
| `USE_ACTV_TYPE` | User Activity Type | `ROLE_CHANGE` | Role Change |
| | | `STTS_CHANGE` | Status Change |
| | | `PRFL_UPDATE` | Profile Update |
| | | `LGN` | Login |

---

## 4. Auth Module

### TB_COMM_USER (User)
| Field | Type | Required | Constraint | Description |
|-------|------|----------|-----------|-------------|
| _id | ObjectId | PK | | User ID |
| USE_EML | String | Y | unique, max 100 | Email |
| USE_PSWD | String | N | min 60 (bcrypt) | Password (hashed). Null for social-only login |
| USE_NM | String | Y | max 50 | User name |
| USE_NCNM | String | N | unique, max 30 | Nickname |
| PRFL_IMG_URL | String | N | max 500 | Profile image URL |
| USE_ROLE_CD | String | Y | enum: SUPER_ADMIN/SELLER/BUYER | User role code (default: `BUYER`) |
| USE_STTS_CD | String | Y | enum: ACTV/INAC/SUSP | User status code (default: `ACTV`) |
| LST_LGN_DT | DateTime | N | | Last login datetime |
| EML_VRFC_YN | String(1) | Y | | Email verified flag (default: `N`) |
| EML_VRFC_TKN | String | N | | Email verification token |
| EML_VRFC_EXPR_DT | DateTime | N | | Email verification expiry datetime |
| PSWD_RST_TKN | String | N | | Password reset token (UUID v4) |
| PSWD_RST_EXPR_DT | DateTime | N | | Password reset token expiry datetime (1 hour) |

### TB_COMM_SCL_ACNT (Social Account)
| Field | Type | Required | Constraint | Description |
|-------|------|----------|-----------|-------------|
| _id | ObjectId | PK | | Social account ID |
| USE_ID | ObjectId | FK | ref: TB_COMM_USER | User ID |
| SCL_PRVD_CD | String | Y | enum: GOOGLE/KAKAO/NAVER | Social provider code |
| SCL_PRVD_USE_ID | String | Y | | Social provider user ID |
| SCL_EML | String | N | max 100 | Social email |
| SCL_PRFL_IMG_URL | String | N | max 500 | Social profile image URL |
| LNKD_DT | DateTime | Y | | Linked datetime |

> Compound unique: `{ SCL_PRVD_CD, SCL_PRVD_USE_ID }`

### TB_COMM_RFRSH_TKN (Refresh Token)
| Field | Type | Required | Constraint | Description |
|-------|------|----------|-----------|-------------|
| _id | ObjectId | PK | | Token ID |
| USE_ID | ObjectId | FK | ref: TB_COMM_USER | User ID |
| TKN_VAL | String | Y | unique | Token value (hashed) |
| EXPR_DT | DateTime | Y | TTL index | Expiry datetime |
| CLNT_IP_ADDR | String | Y | max 45 | Client IP address |
| USE_AGNT | String | N | max 500 | User-Agent |
| RVKD_YN | String(1) | Y | | Revoked flag (default: `N`) |

> TTL Index: `EXPR_DT` — MongoDB auto-deletes expired tokens

### TL_COMM_LGN_LOG (Login Log)
| Field | Type | Required | Constraint | Description |
|-------|------|----------|-----------|-------------|
| _id | ObjectId | PK | | Log ID |
| USE_ID | ObjectId | FK | ref: TB_COMM_USER | User ID |
| LGN_MTHD_CD | String | Y | enum: EMAIL/GOOGLE/KAKAO/NAVER | Login method code |
| LGN_DT | DateTime | Y | | Login datetime |
| LGN_IP_ADDR | String | Y | max 45 | Login IP address |
| LGN_RSLT_CD | String | Y | enum: SUCC/FAIL | Login result code |
| FAIL_RSN | String | N | max 200 | Failure reason |
| USE_AGNT | String | N | max 500 | User-Agent |

> No DEL_YN (logs cannot be deleted). TTL Index: `LGN_DT` (auto-delete after 90 days)

---

## 5. Board Module

### TB_COMM_BOARD_POST (Board Post)
| Field | Type | Required | Constraint | Description |
|-------|------|----------|-----------|-------------|
| _id | ObjectId | PK | | Post ID |
| USE_ID | ObjectId | FK | ref: TB_COMM_USER | Author ID |
| POST_TTL | String | Y | max 200 | Post title |
| POST_CN | String | Y | max 10000 | Post content |
| POST_CTGR_CD | String | Y | enum: NOTICE/FREE/QNA/REVIEW | Post category code |
| INQR_CNT | Number | Y | default: 0 | View count |
| LIKE_CNT | Number | Y | default: 0 | Like count |
| CMNT_CNT | Number | Y | default: 0 | Comment count |
| PNND_YN | String(1) | Y | default: `N` | Pinned flag |
| SRCH_TAGS | String[] | N | | Search tags array |

### TB_COMM_BOARD_CMNT (Comment)
| Field | Type | Required | Constraint | Description |
|-------|------|----------|-----------|-------------|
| _id | ObjectId | PK | | Comment ID |
| POST_ID | ObjectId | FK | ref: TB_COMM_BOARD_POST | Post ID |
| USE_ID | ObjectId | FK | ref: TB_COMM_USER | Author ID |
| CMNT_CN | String | Y | max 2000 | Comment content |
| PRNT_CMNT_ID | ObjectId | N | ref: self | Parent comment ID (reply, 1 depth only) |
| CMNT_DPTH | Number | Y | 0 or 1 | Comment depth (0: root, 1: reply) |

### TB_COMM_BOARD_ATCH (Post Attachment)
| Field | Type | Required | Constraint | Description |
|-------|------|----------|-----------|-------------|
| _id | ObjectId | PK | | Attachment ID |
| POST_ID | ObjectId | FK | ref: TB_COMM_BOARD_POST | Post ID |
| ATCH_TYPE_CD | String | Y | enum: IMG/DOC/VIDEO | Attachment type code |
| ATCM_NM | String | Y | max 200 | Original file name |
| ATCM_URL | String | Y | max 500 | Storage path (S3 key) |
| ATCM_SIZE | Number | Y | max: 10MB | File size (bytes) |
| ATCM_MIME_TYPE | String | Y | max 100 | MIME type |
| SORT_NO | Number | Y | | Sort order |

### TR_COMM_BOARD_LIKE (Post Like)
| Field | Type | Required | Constraint | Description |
|-------|------|----------|-----------|-------------|
| _id | ObjectId | PK | | Like ID |
| POST_ID | ObjectId | FK | ref: TB_COMM_BOARD_POST | Post ID |
| USE_ID | ObjectId | FK | ref: TB_COMM_USER | User ID |

> Compound unique: `{ POST_ID, USER_ID }` — one like per user. No DEL_YN (unlike = document delete)

---

## 6. Chat Module

### TB_COMM_CHAT_ROOM (Chat Room)
| Field | Type | Required | Constraint | Description |
|-------|------|----------|-----------|-------------|
| _id | ObjectId | PK | | Chat room ID |
| CHAT_ROOM_NM | String | Y | max 100 | Chat room name |
| CHAT_ROOM_TYPE_CD | String | Y | enum: DM/GROUP | Chat room type code |
| MAX_MBR_CNT | Number | Y | DM: 2, GROUP: 100 | Max member count |
| CRTR_ID | ObjectId | FK | ref: TB_COMM_USER | Creator ID |
| LST_MSSG_CN | String | N | max 100 | Last message content (preview) |
| LST_MSSG_DT | DateTime | N | | Last message datetime |

### TR_COMM_CHAT_ROOM_MBR (Chat Room Member)
| Field | Type | Required | Constraint | Description |
|-------|------|----------|-----------|-------------|
| _id | ObjectId | PK | | ID |
| CHAT_ROOM_ID | ObjectId | FK | ref: TB_COMM_CHAT_ROOM | Chat room ID |
| USE_ID | ObjectId | FK | ref: TB_COMM_USER | User ID |
| JOIN_DT | DateTime | Y | | Joined datetime |
| LAST_READ_DT | DateTime | N | | Last read datetime (for unread count) |
| NOTI_YN | String(1) | Y | default: `Y` | Notification enabled flag |

> Compound unique: `{ CHAT_ROOM_ID, USER_ID }`. No DEL_YN (leave = document delete)

### TB_COMM_CHAT_MSG (Chat Message)
| Field | Type | Required | Constraint | Description |
|-------|------|----------|-----------|-------------|
| _id | ObjectId | PK | | Message ID |
| CHAT_ROOM_ID | ObjectId | FK | ref: TB_COMM_CHAT_ROOM | Chat room ID |
| USE_ID | ObjectId | FK | ref: TB_COMM_USER | Sender ID |
| MSSG_CN | String | Y | max 5000 | Message content |
| MSSG_TYPE_CD | String | Y | enum: TEXT/IMG/FILE | Message type code |
| SEND_DT | DateTime | Y | | Sent datetime |

> No DEL_YN (message delete = physical delete). Default sort: SEND_DT descending.

### TB_COMM_CHAT_MSG_ATCH (Chat Message Attachment)
| Field | Type | Required | Constraint | Description |
|-------|------|----------|-----------|-------------|
| _id | ObjectId | PK | | Attachment ID |
| MSSG_ID | ObjectId | FK | ref: TB_COMM_CHAT_MSG | Message ID |
| ATCM_NM | String | Y | max 200 | Original file name |
| ATCM_URL | String | Y | max 500 | Storage path (S3 key) |
| ATCM_SIZE | Number | Y | max: 10MB | File size (bytes) |
| ATCM_MIME_TYPE | String | Y | max 100 | MIME type |
| THMB_URL | String | N | max 500 | Thumbnail path (for images) |

---

## 5. Product Module

### TB_PROD_PRD (Product)
| Field | Type | Required | Constraint | Description |
|-------|------|----------|-----------|-------------|
| _id | ObjectId | PK | | Product ID |
| SLLR_ID | ObjectId | FK | ref: TB_COMM_USER | Seller ID |
| PRD_NM | String | Y | max 200 | Product name |
| PRD_DC | String | Y | max 10000 | Product description |
| PRD_PRC | Float | Y | min: 0 | Product price |
| PRD_SALE_PRC | Float | N | min: 0, < PRD_PRC | Sale price |
| PRD_CTGR_CD | String | Y | enum: CERAMICS/TEXTILES/ART/JEWELRY/HOME/FOOD | Product category code |
| PRD_STTS_CD | String | Y | enum: DRAFT/ACTV/SOLD_OUT/HIDDEN | Product status code (default: `ACTV`) |
| PRD_IMG_URL | String | Y | max 500 | Main product image URL |
| PRD_IMG_URLS | String[] | N | max 5 items | Additional product image URLs |
| STCK_QTY | Number | Y | min: 0, default: 0 | Stock quantity |
| SOLD_CNT | Number | Y | default: 0 | Sold count |
| VIEW_CNT | Number | Y | default: 0 | View count |
| AVG_RTNG | Float | Y | 0~5, default: 0 | Average rating |
| RVW_CNT | Number | Y | default: 0 | Review count |
| SRCH_TAGS | String[] | N | | Search tags array |

> Auto-status: When STCK_QTY reaches 0 and PRD_STTS_CD is ACTV, auto-set to SOLD_OUT

---

## 6. Order Module

### TB_COMM_ORDR (Order)
| Field | Type | Required | Constraint | Description |
|-------|------|----------|-----------|-------------|
| _id | ObjectId | PK | | Order ID |
| ORDR_NO | String | Y | unique, format: VB-YYYY-MMDD-NNN | Order number |
| BYR_ID | ObjectId | FK | ref: TB_COMM_USER | Buyer ID |
| ORDR_TOT_AMT | Float | Y | min: 0 | Order total amount |
| ORDR_STTS_CD | String | Y | enum: PENDING/PAID/SHIPPED/DELIVERED/CANCELLED/REFUNDED | Order status code (default: `PENDING`) |
| SHIP_ADDR | String | N | max 500 | Shipping address |
| SHIP_RCVR_NM | String | N | max 50 | Receiver name |
| SHIP_TELNO | String | N | max 20 | Receiver phone number |
| SHIP_MEMO | String | N | max 200 | Shipping memo |
| TRCKG_NO | String | N | max 100 | Tracking number |

### TB_COMM_ORDR_ITEM (Order Item)
| Field | Type | Required | Constraint | Description |
|-------|------|----------|-----------|-------------|
| _id | ObjectId | PK | | Order item ID |
| ORDR_ID | ObjectId | FK | ref: TB_COMM_ORDR | Order ID |
| PRD_ID | ObjectId | FK | ref: TB_PROD_PRD | Product ID |
| SLLR_ID | ObjectId | FK | ref: TB_COMM_USER | Seller ID |
| PRD_NM | String | Y | max 200 | Product name (snapshot at order time) |
| PRD_IMG_URL | String | Y | max 500 | Product image URL (snapshot) |
| UNIT_PRC | Float | Y | min: 0 | Unit price at order time |
| ORDR_QTY | Number | Y | min: 1 | Order quantity |
| SUBTOT_AMT | Float | Y | min: 0 | Subtotal (UNIT_PRC × ORDR_QTY) |

### TH_COMM_ORDR_STTS (Order Status History)
| Field | Type | Required | Constraint | Description |
|-------|------|----------|-----------|-------------|
| _id | ObjectId | PK | | History ID |
| ORDR_ID | ObjectId | FK | ref: TB_COMM_ORDR | Order ID |
| PREV_STTS_CD | String | Y | | Previous status code |
| NEW_STTS_CD | String | Y | | New status code |
| CHNG_RSN | String | N | max 500 | Change reason |
| CHNGR_ID | ObjectId | FK | ref: TB_COMM_USER | Changed by user ID |
| CHNG_DT | DateTime | Y | | Changed datetime |

> No DEL_YN (history table, TH_ prefix — records are immutable)

---

## 6.5. Admin Enhancement Module

### TL_COMM_USE_ACTV (User Activity Log)
| Field | Type | Required | Constraint | Description |
|-------|------|----------|-----------|-------------|
| _id | ObjectId | PK | | Activity log ID |
| USE_ID | ObjectId | FK | ref: TB_COMM_USER | Target user ID |
| ACTV_TYPE_CD | String | Y | enum: ROLE_CHANGE/STTS_CHANGE/PRFL_UPDATE/LGN | Activity type code |
| PREV_VAL | String | N | max 200 | Previous value |
| NEW_VAL | String | N | max 200 | New value |
| PRFMR_ID | ObjectId | FK | ref: TB_COMM_USER | Performed by user ID |
| CLNT_IP_ADDR | String | N | max 45 | Client IP address |
| ACTV_DT | DateTime | Y | | Activity datetime |

> No DEL_YN (log table, TL_ prefix). TTL Index: `ACTV_DT` (auto-delete after 180 days)

---

## 7. Index Strategy

### Single Indexes
| Collection | Field | Type | Purpose |
|-----------|-------|------|---------|
| TB_COMM_USER | USE_EML | Unique | Email login |
| TB_COMM_USER | USE_NCNM | Unique (sparse) | Nickname uniqueness |
| TB_COMM_USER | USE_ROLE_CD | Single | Admin query filtering by role |
| TB_COMM_BOARD_POST | POST_CTGR_CD | Single | Category filtering |
| TB_COMM_RFRSH_TKN | TKN_VAL | Unique | Token validation |
| TB_COMM_RFRSH_TKN | USE_ID | Single | Revoke all user tokens |
| TB_PROD_PRD | PRD_CTGR_CD | Single | Category filtering |
| TB_PROD_PRD | PRD_STTS_CD | Single | Status filtering |
| TB_COMM_ORDR | ORDR_NO | Unique | Order number lookup |
| TB_COMM_ORDR | ORDR_STTS_CD | Single | Status filtering |

### Compound Indexes
| Collection | Fields | Type | Purpose |
|-----------|--------|------|---------|
| TC_COMM_CD | CD_GRP_ID + CD_VAL | Compound + Unique | Code lookup |
| TB_COMM_SCL_ACNT | SCL_PRVD_CD + SCL_PRVD_USE_ID | Compound + Unique | Social login |
| TB_COMM_SCL_ACNT | USE_ID | Single | User's social accounts |
| TB_COMM_BOARD_POST | DEL_YN + POST_CTGR_CD + RGST_DT(desc) | Compound | Board listing |
| TB_COMM_BOARD_POST | DEL_YN + USE_ID + RGST_DT(desc) | Compound | My posts |
| TB_COMM_BOARD_CMNT | POST_ID + DEL_YN + RGST_DT | Compound | Post comments |
| TR_COMM_BOARD_LIKE | POST_ID + USE_ID | Compound + Unique | Like deduplication |
| TB_COMM_CHAT_MSG | CHAT_ROOM_ID + SEND_DT(desc) | Compound | Chat message listing |
| TR_COMM_CHAT_ROOM_MBR | CHAT_ROOM_ID + USE_ID | Compound + Unique | Member deduplication |
| TR_COMM_CHAT_ROOM_MBR | USE_ID | Single | My chat rooms |
| TB_PROD_PRD | DEL_YN + SLLR_ID + RGST_DT(desc) | Compound | Seller's products |
| TB_PROD_PRD | DEL_YN + PRD_CTGR_CD + PRD_STTS_CD + RGST_DT(desc) | Compound | Public product listing |
| TB_COMM_ORDR | BYR_ID + ORDR_STTS_CD + RGST_DT(desc) | Compound | Buyer order history |
| TB_COMM_ORDR_ITEM | ORDR_ID | Single | Order items lookup |
| TB_COMM_ORDR_ITEM | SLLR_ID + RGST_DT(desc) | Compound | Seller sales history |
| TH_COMM_ORDR_STTS | ORDR_ID + CHNG_DT(desc) | Compound | Order status timeline |
| TL_COMM_USE_ACTV | USE_ID + ACTV_DT(desc) | Compound | User activity history |

### TTL Indexes (Auto-delete)
| Collection | Field | TTL | Purpose |
|-----------|-------|-----|---------|
| TB_COMM_RFRSH_TKN | EXPR_DT | 0s (on expiry) | Auto-delete expired tokens |
| TL_COMM_LGN_LOG | LGN_DT | 90 days | Log retention management |
| TL_COMM_USE_ACTV | ACTV_DT | 180 days | Activity log retention |

### Text Index
| Collection | Fields | Purpose |
|-----------|--------|---------|
| TB_COMM_BOARD_POST | POST_TTL + POST_CN | Full-text post search |
| TB_PROD_PRD | PRD_NM + PRD_DC + SRCH_TAGS | Full-text product search |

---

## 8. Validation Rules

| Rule | Application |
|------|-------------|
| Email format | `USE_EML`: RFC 5322 regex |
| Password strength | Min 8 chars, uppercase + lowercase + number + special char required (API-level validation) |
| Nickname format | 2~30 chars, Korean/English/numbers/_ only |
| Post title | 1~200 chars |
| Post content | 1~10,000 chars |
| Comment content | 1~2,000 chars |
| Chat message | 1~5,000 chars |
| File size | Max 10MB |
| Image formats | jpg, jpeg, png, gif, webp |
| Reply depth | Max 1 depth |
| DM members | Exactly 2 |
| Group chat members | Max 100 |
| Product name | 1~200 chars |
| Product description | 1~10,000 chars |
| Product price | > 0 |
| Product images | Max 5 URLs |
| Stock quantity | >= 0 |
| Order quantity | >= 1 |
| Shipping address | Max 500 chars |
| Receiver name | 1~50 chars |
| Tracking number | Max 100 chars |

---

## 9. Prisma Schema Mapping Reference

```
MongoDB Collection    →  Prisma Model     →  @@map()
─────────────────────────────────────────────────────
TC_COMM_CD_GRP      →  CommonCodeGroup   →  @@map("TC_COMM_CD_GRP")
TC_COMM_CD          →  CommonCode        →  @@map("TC_COMM_CD")
TB_COMM_USER        →  User              →  @@map("TB_COMM_USER")
TB_COMM_SCL_ACNT    →  SocialAccount     →  @@map("TB_COMM_SCL_ACNT")
TB_COMM_RFRSH_TKN   →  RefreshToken      →  @@map("TB_COMM_RFRSH_TKN")
TL_COMM_LGN_LOG     →  LoginLog          →  @@map("TL_COMM_LGN_LOG")
TB_COMM_BOARD_POST  →  BoardPost         →  @@map("TB_COMM_BOARD_POST")
TB_COMM_BOARD_CMNT  →  BoardComment      →  @@map("TB_COMM_BOARD_CMNT")
TB_COMM_BOARD_ATCH  →  BoardAttachment   →  @@map("TB_COMM_BOARD_ATCH")
TR_COMM_BOARD_LIKE  →  BoardLike         →  @@map("TR_COMM_BOARD_LIKE")
TB_COMM_CHAT_ROOM   →  ChatRoom          →  @@map("TB_COMM_CHAT_ROOM")
TR_COMM_CHAT_ROOM_MBR → ChatRoomMember   →  @@map("TR_COMM_CHAT_ROOM_MBR")
TB_COMM_CHAT_MSG    →  ChatMessage       →  @@map("TB_COMM_CHAT_MSG")
TB_COMM_CHAT_MSG_ATCH → ChatMessageAttachment → @@map("TB_COMM_CHAT_MSG_ATCH")
TB_PROD_PRD           →  Product              →  @@map("TB_PROD_PRD")
TB_COMM_ORDR          →  Order                →  @@map("TB_COMM_ORDR")
TB_COMM_ORDR_ITEM     →  OrderItem            →  @@map("TB_COMM_ORDR_ITEM")
TH_COMM_ORDR_STTS     →  OrderStatusHistory   →  @@map("TH_COMM_ORDR_STTS")
TL_COMM_USE_ACTV      →  UserActivity         →  @@map("TL_COMM_USE_ACTV")
```

> Field mapping: Prisma fields use `camelCase`, MongoDB actual fields use `UPPER_SNAKE_CASE` → use `@map()`
> Example: `userEmail String @map("USE_EML")`
