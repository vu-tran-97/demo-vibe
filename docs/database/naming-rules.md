# DB Naming Rules

> Naming conventions based on the Korean Public Data Standard Terminology Dictionary.

## 1. Collection (Table) Name Rules

### Prefixes
| Prefix | Purpose | Example |
|--------|---------|---------|
| `TB_` | General table | TB_COMM_USER |
| `TC_` | Code table | TC_COMM_CD |
| `TH_` | History table | TH_COMM_LGN |
| `TL_` | Log table | TL_COMM_LGN_LOG |
| `TR_` | Relation table | TR_COMM_CHAT_ROOM_MBR |

### Naming Format
```
{PREFIX}_{MODULE_CODE}_{ENTITY_NAME}
```

Examples:
- `TB_COMM_USER` → Common / User
- `TB_COMM_BOARD_POST` → Common / Board / Post
- `TR_COMM_CHAT_ROOM_MBR` → Common / Chat Room / Member

## 2. Field (Column) Name Rules

### Suffix Rules
| Suffix | Domain | Data Type | Example |
|--------|--------|-----------|---------|
| `_NM` | Name | String | USER_NM (user name) |
| `_CD` | Code | String | STTS_CD (status code) |
| `_NO` | Number | String/Number | ORDR_NO (order number) |
| `_CN` | Content | String (Long) | POST_CN (post content) |
| `_YN` | Flag | String(1) | DEL_YN (delete flag) |
| `_DT` | DateTime | DateTime | RGST_DT (created at) |
| `_YMD` | Date | String(8) | STRT_YMD (start date) |
| `_AMT` | Amount | Number | PAY_AMT (payment amount) |
| `_CNT` | Count | Number | INQR_CNT (view count) |
| `_SN` | Sequence | Number | SORT_SN (sort order) |
| `_ADDR` | Address | String | EMAIL_ADDR (email address) |
| `_URL` | URL | String | PRFL_IMG_URL (profile image URL) |
| `_ID` | Identifier | String/ObjectId | USER_ID (user ID) |
| `_PSWD` | Password | String | USER_PSWD (user password) |

### Standard Term Mapping (Key Items)
| Korean Term | English Abbreviation | Full Word |
|-------------|---------------------|-----------|
| User | USER | - |
| Email | EMAIL | - |
| Password | PSWD | password |
| Post | POST | - |
| Comment | CMNT | comment |
| Chat | CHAT | - |
| Message | MSG | message |
| Register | RGST | register |
| Modification | MDFCN | modification |
| Delete | DEL | delete |
| Inquiry | INQR | inquiry |
| Nickname | NCNM | nickname |
| Profile | PRFL | profile |
| Image | IMG | image |
| Title | TTL | title |
| Category | CTGR | category |
| Status | STTS | status |
| Type | TYPE | - |

> Use `/lookup-term [term]` command to look up the full standard terminology dictionary.

## 3. Forbidden Words

Forbidden words defined in the standard dictionary must not be used. Use standard alternatives instead.

| Forbidden | Standard Alternative |
|-----------|---------------------|
| password (direct) | PSWD |
| count (direct) | CNT |
| number (direct) | NO |
| name (direct) | NM |

> See `standard_words.json` field `forbidden_words` for the full forbidden word list.
