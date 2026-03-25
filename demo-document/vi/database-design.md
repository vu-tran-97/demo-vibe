# Tài liệu Thiết kế Cơ sở dữ liệu

> **Dự án:** Nền tảng Thương mại điện tử Vibe
> **Cập nhật lần cuối:** 2026-03-20
> **Cơ sở dữ liệu:** MongoDB 7 với Prisma ORM (MongoDB Adapter)
> **Tổng số Collection:** 19

---

## 1. Tổng quan Kiến trúc

```
┌─────────────────────────────────────────────────────────────┐
│                    Tầng Ứng dụng                             │
│              NestJS + Prisma ORM (TypeScript)                │
├─────────────────────────────────────────────────────────────┤
│                    Prisma Client                             │
│         camelCase fields ──@map()──> UPPER_SNAKE_CASE        │
├─────────────────────────────────────────────────────────────┤
│                    MongoDB 7                                 │
│            Replica Set (rs0) cho transactions                │
│            Kết nối: mongodb://localhost:27017                 │
└─────────────────────────────────────────────────────────────┘
```

## 2. Quy tắc Đặt tên

### Tiền tố Collection
| Tiền tố | Loại | Ví dụ |
|---------|------|-------|
| `TB_` | Bảng chung | `TB_COMM_USER` |
| `TC_` | Bảng mã | `TC_COMM_CD` |
| `TH_` | Bảng lịch sử | `TH_COMM_ORDR_STTS` |
| `TL_` | Bảng nhật ký (log) | `TL_COMM_LGN_LOG` |
| `TR_` | Bảng quan hệ | `TR_COMM_BOARD_LIKE` |

### Hậu tố Trường
| Hậu tố | Ý nghĩa | Ví dụ |
|--------|---------|-------|
| `_DT` | Ngày giờ (DateTime) | `RGST_DT`, `LST_LGN_DT` |
| `_NM` | Tên (Name) | `USE_NM`, `PRD_NM` |
| `_CD` | Mã (Code) | `USE_ROLE_CD`, `ORDR_STTS_CD` |
| `_YN` | Cờ Có/Không (Yes/No) | `DEL_YN`, `RVKD_YN` |
| `_ID` | Định danh (Identifier) | `USE_ID`, `ORDR_ID` |
| `_CN` | Nội dung (Content) | `POST_CN`, `MSSG_CN` |
| `_CNT` | Số lượng (Count) | `INQR_CNT`, `LIKE_CNT` |
| `_AMT` | Số tiền (Amount) | `ORDR_TOT_AMT`, `SUBTOT_AMT` |
| `_PRC` | Giá (Price) | `PRD_PRC`, `UNIT_PRC` |
| `_URL` | Đường dẫn URL | `PRD_IMG_URL`, `PRFL_IMG_URL` |
| `_NO` | Số thứ tự (Number) | `ORDR_NO` |
| `_ADDR` | Địa chỉ (Address) | `SHIP_ADDR` |
| `_SN` | Số tuần tự (Sequence) | `SORT_NO` |

### Các trường chung (tất cả collection)
| Trường | Kiểu | Mặc định | Mô tả |
|--------|------|----------|-------|
| `RGST_DT` | DateTime | `now()` | Ngày tạo |
| `RGTR_ID` | String | — | Người tạo |
| `MDFCN_DT` | DateTime | `now()` | Ngày cập nhật |
| `MDFR_ID` | String | — | Người cập nhật |
| `DEL_YN` | String(1) | `"N"` | Cờ xóa mềm |

> Ngoại lệ: Bảng nhật ký (`TL_`) và bảng lịch sử (`TH_`) không có `DEL_YN` — các bản ghi là bất biến (immutable).

---

## 3. ERD (Sơ đồ Quan hệ Thực thể)

```
                              ┌─────────────────┐
                              │  TC_COMM_CD_GRP  │
                              │  (Nhóm Mã)      │
                              └───────┬─────────┘
                                      │ 1:N
                              ┌───────┴─────────┐
                              │   TC_COMM_CD     │
                              │   (Mã)           │
                              └─────────────────┘

┌─────────────────┐     1:N     ┌─────────────────────┐
│  TB_COMM_USER   │────────────>│  TB_COMM_RFRSH_TKN  │
│  (Người dùng)   │             │  (Token Làm mới)    │
└───────┬─────────┘             └─────────────────────┘
        │
        ├──1:N──> TL_COMM_LGN_LOG (Nhật ký Đăng nhập)
        ├──1:N──> TB_COMM_SCL_ACNT (Tài khoản Mạng xã hội)
        ├──1:N──> TL_COMM_USE_ACTV (Nhật ký Hoạt động Người dùng)
        │
        ├──1:N──> TB_COMM_BOARD_POST (Bài viết)
        │                │
        │                ├──1:N──> TB_COMM_BOARD_CMNT (Bình luận)
        │                ├──1:N──> TB_COMM_BOARD_ATCH (Tệp đính kèm)
        │                └──1:N──> TR_COMM_BOARD_LIKE (Lượt thích)
        │
        ├──1:N──> TB_COMM_CHAT_ROOM (Phòng Chat — với vai trò Người tạo)
        │                │
        │                ├──1:N──> TR_COMM_CHAT_ROOM_MBR (Thành viên)
        │                └──1:N──> TB_COMM_CHAT_MSG (Tin nhắn)
        │                                │
        │                                └──1:N──> TB_COMM_CHAT_MSG_ATCH
        │
        ├──1:N──> TB_PROD_PRD (Sản phẩm — với vai trò Người bán)
        │
        └──1:N──> TB_COMM_ORDR (Đơn hàng — với vai trò Người mua)
                         │
                         ├──1:N──> TB_COMM_ORDR_ITEM (Mục Đơn hàng)
                         └──1:N──> TH_COMM_ORDR_STTS (Lịch sử Trạng thái)
```

---

## 4. Định nghĩa Collection

### 4.1 Bảng Mã

#### TC_COMM_CD_GRP (Nhóm Mã)
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `_id` | ObjectId | PK | |
| `CD_GRP_ID` | String | Y, duy nhất | Định danh nhóm (ví dụ: `USE_ROLE`) |
| `CD_GRP_NM` | String | Y | Tên nhóm |
| `CD_GRP_DC` | String | N | Mô tả |
| `USE_YN` | String(1) | Y | Cờ hoạt động (mặc định: `Y`) |

#### TC_COMM_CD (Mã)
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `_id` | ObjectId | PK | |
| `CD_GRP_ID` | String | FK | ID nhóm mã |
| `CD_VAL` | String | Y | Giá trị mã (ví dụ: `ACTV`) |
| `CD_NM` | String | Y | Tên hiển thị |
| `CD_DC` | String | N | Mô tả |
| `SORT_NO` | Number | Y | Thứ tự sắp xếp |
| `USE_YN` | String(1) | Y | Cờ hoạt động |

**Ràng buộc duy nhất:** `{ CD_GRP_ID, CD_VAL }`

#### Dữ liệu Mã Khởi tạo

| Nhóm | Giá trị |
|------|---------|
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

### 4.2 Module Xác thực (Auth)

#### TB_COMM_USER (Người dùng)
| Trường | Kiểu | Bắt buộc | Ràng buộc | Mô tả |
|--------|------|----------|-----------|-------|
| `_id` | ObjectId | PK | | ID Người dùng |
| `USE_EML` | String | Y | duy nhất, tối đa 100 | Email |
| `USE_PSWD` | String | N | mã hóa bcrypt | Mật khẩu (null nếu chỉ dùng mạng xã hội) |
| `USE_NM` | String | Y | tối đa 50 | Họ tên |
| `USE_NCNM` | String | N | duy nhất, tối đa 30 | Biệt danh |
| `PRFL_IMG_URL` | String | N | tối đa 500 | URL ảnh đại diện |
| `USE_ROLE_CD` | String | Y | SUPER_ADMIN/SELLER/BUYER | Vai trò (mặc định: `BUYER`) |
| `USE_STTS_CD` | String | Y | ACTV/INAC/SUSP | Trạng thái (mặc định: `ACTV`) |
| `LST_LGN_DT` | DateTime | N | | Lần đăng nhập cuối |
| `EML_VRFC_YN` | String(1) | Y | | Email đã xác minh (mặc định: `N`) |
| `EML_VRFC_TKN` | String | N | | Token xác minh |
| `EML_VRFC_EXPR_DT` | DateTime | N | | Hạn token |
| `PSWD_RST_TKN` | String | N | | Token đặt lại mật khẩu (UUID v4) |
| `PSWD_RST_EXPR_DT` | DateTime | N | | Hạn token đặt lại (1 giờ) |

#### TB_COMM_SCL_ACNT (Tài khoản Mạng xã hội)
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `USE_ID` | ObjectId | FK | ID Người dùng |
| `SCL_PRVD_CD` | String | Y | Nhà cung cấp: GOOGLE/KAKAO/NAVER |
| `SCL_PRVD_USE_ID` | String | Y | ID người dùng từ nhà cung cấp |
| `SCL_EML` | String | N | Email mạng xã hội |
| `SCL_PRFL_IMG_URL` | String | N | Ảnh đại diện mạng xã hội |
| `LNKD_DT` | DateTime | Y | Ngày giờ liên kết |

**Ràng buộc duy nhất:** `{ SCL_PRVD_CD, SCL_PRVD_USE_ID }`

#### TB_COMM_RFRSH_TKN (Token Làm mới)
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `USE_ID` | ObjectId | FK | ID Người dùng |
| `TKN_VAL` | String | Y, duy nhất | Giá trị token (đã mã hóa) |
| `EXPR_DT` | DateTime | Y | Hạn sử dụng (TTL tự động xóa) |
| `CLNT_IP_ADDR` | String | Y | Địa chỉ IP máy khách |
| `USE_AGNT` | String | N | User-Agent |
| `RVKD_YN` | String(1) | Y | Cờ thu hồi (mặc định: `N`) |

#### TL_COMM_LGN_LOG (Nhật ký Đăng nhập)
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `USE_ID` | ObjectId | FK | ID Người dùng |
| `LGN_MTHD_CD` | String | Y | Phương thức: EMAIL/GOOGLE/KAKAO/NAVER |
| `LGN_DT` | DateTime | Y | Thời gian đăng nhập |
| `LGN_IP_ADDR` | String | Y | Địa chỉ IP |
| `LGN_RSLT_CD` | String | Y | Kết quả: SUCC/FAIL |
| `FAIL_RSN` | String | N | Lý do thất bại |

> Không có `DEL_YN`. TTL: 90 ngày dựa trên `LGN_DT`.

### 4.3 Module Bảng tin (Board)

#### TB_COMM_BOARD_POST (Bài viết)
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `USE_ID` | ObjectId | FK | ID Tác giả |
| `POST_TTL` | String | Y | Tiêu đề (tối đa 200) |
| `POST_CN` | String | Y | Nội dung (tối đa 10.000) |
| `POST_CTGR_CD` | String | Y | Danh mục: NOTICE/FREE/QNA/REVIEW |
| `INQR_CNT` | Number | Y | Lượt xem (mặc định: 0) |
| `LIKE_CNT` | Number | Y | Lượt thích (mặc định: 0) |
| `CMNT_CNT` | Number | Y | Số bình luận (mặc định: 0) |
| `PNND_YN` | String(1) | Y | Ghim bài viết (mặc định: `N`) |
| `SRCH_TAGS` | String[] | N | Thẻ tìm kiếm |

#### TB_COMM_BOARD_CMNT (Bình luận)
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `POST_ID` | ObjectId | FK | ID Bài viết |
| `USE_ID` | ObjectId | FK | ID Tác giả |
| `CMNT_CN` | String | Y | Nội dung (tối đa 2.000) |
| `PRNT_CMNT_ID` | ObjectId | N | Bình luận cha (trả lời 1 cấp) |
| `CMNT_DPTH` | Number | Y | Độ sâu: 0 (gốc) hoặc 1 (trả lời) |

#### TB_COMM_BOARD_ATCH (Tệp đính kèm)
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `POST_ID` | ObjectId | FK | ID Bài viết |
| `ATCH_TYPE_CD` | String | Y | Loại: IMG/DOC/VIDEO |
| `ATCM_NM` | String | Y | Tên tệp |
| `ATCM_URL` | String | Y | Đường dẫn lưu trữ |
| `ATCM_SIZE` | Number | Y | Kích thước tệp (tối đa 10MB) |
| `ATCM_MIME_TYPE` | String | Y | Kiểu MIME |
| `SORT_NO` | Number | Y | Thứ tự sắp xếp |

#### TB_COMM_BOARD_BANNER (Banner)
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `IMG_URL` | String | Y | URL hình ảnh banner |
| `TTL` | String | N | Tiêu đề |
| `SUB_TTL` | String | N | Phụ đề |
| `LNK_URL` | String | N | URL liên kết |
| `USE_YN` | String(1) | Y | Cờ hoạt động |

#### TR_COMM_BOARD_LIKE (Lượt thích)
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `POST_ID` | ObjectId | FK | ID Bài viết |
| `USE_ID` | ObjectId | FK | ID Người dùng |

**Ràng buộc duy nhất:** `{ POST_ID, USE_ID }`. Bỏ thích = xóa vật lý.

### 4.4 Module Sản phẩm

#### TB_PROD_PRD (Sản phẩm)
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `SLLR_ID` | ObjectId | FK | ID Người bán |
| `PRD_NM` | String | Y | Tên (tối đa 200) |
| `PRD_DC` | String | Y | Mô tả (tối đa 10.000) |
| `PRD_PRC` | Float | Y | Giá (>= 0) |
| `PRD_SALE_PRC` | Float | N | Giá khuyến mãi |
| `PRD_CTGR_CD` | String | Y | Danh mục: CERAMICS/TEXTILES/ART/JEWELRY/HOME/FOOD |
| `PRD_STTS_CD` | String | Y | Trạng thái: DRAFT/ACTV/SOLD_OUT/HIDDEN (mặc định: `ACTV`) |
| `PRD_IMG_URL` | String | Y | URL hình ảnh chính |
| `PRD_IMG_URLS` | String[] | N | Hình ảnh bổ sung (tối đa 5) |
| `STCK_QTY` | Number | Y | Số lượng tồn kho |
| `SOLD_CNT` | Number | Y | Số lượng đã bán |
| `VIEW_CNT` | Number | Y | Lượt xem |
| `AVG_RTNG` | Float | Y | Đánh giá trung bình (0-5) |
| `RVW_CNT` | Number | Y | Số lượt đánh giá |
| `SRCH_TAGS` | String[] | N | Thẻ tìm kiếm |

### 4.5 Module Đơn hàng

#### TB_COMM_ORDR (Đơn hàng)
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `ORDR_NO` | String | Y, duy nhất | Mã đơn hàng (định dạng: `VB-YYYY-MMDD-NNN`) |
| `BYR_ID` | ObjectId | FK | ID Người mua (khách: `000000000000000000000000`) |
| `ORDR_TOT_AMT` | Float | Y | Tổng tiền |
| `ORDR_STTS_CD` | String | Y | Trạng thái: PENDING/PAID/SHIPPED/DELIVERED/CANCELLED/REFUNDED |
| `SHIP_ADDR` | String | N | Địa chỉ giao hàng (tối đa 500) |
| `SHIP_RCVR_NM` | String | N | Tên người nhận (tối đa 50) |
| `SHIP_TELNO` | String | N | Số điện thoại người nhận (tối đa 20) |
| `SHIP_MEMO` | String | N | Ghi chú giao hàng (tối đa 200) |
| `TRCKG_NO` | String | N | Mã vận đơn |
| `PAY_MTHD_CD` | String | N | Thanh toán: BANK_TRANSFER/EMAIL_INVOICE |

#### TB_COMM_ORDR_ITEM (Mục Đơn hàng)
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `ORDR_ID` | ObjectId | FK | ID Đơn hàng |
| `PRD_ID` | ObjectId | FK | ID Sản phẩm |
| `SLLR_ID` | ObjectId | FK | ID Người bán |
| `PRD_NM` | String | Y | Tên sản phẩm (bản chụp) |
| `PRD_IMG_URL` | String | Y | Hình ảnh sản phẩm (bản chụp) |
| `UNIT_PRC` | Float | Y | Đơn giá tại thời điểm đặt hàng |
| `ORDR_QTY` | Number | Y | Số lượng (>= 1) |
| `SUBTOT_AMT` | Float | Y | Thành tiền (đơn giá x số lượng) |
| `ITEM_STTS_CD` | String | Y | Trạng thái: PENDING/CONFIRMED/SHIPPED/DELIVERED |
| `PAY_STTS` | String | Y | Thanh toán: UNPAID/PAID (mặc định: `UNPAID`) |
| `TRCKG_NO` | String | N | Mã vận đơn của mục |

#### TH_COMM_ORDR_STTS (Lịch sử Trạng thái Đơn hàng)
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `ORDR_ID` | ObjectId | FK | ID Đơn hàng |
| `PREV_STTS_CD` | String | Y | Trạng thái trước |
| `NEW_STTS_CD` | String | Y | Trạng thái mới |
| `CHNG_RSN` | String | N | Lý do thay đổi |
| `CHNGR_ID` | ObjectId | FK | Người thay đổi |
| `CHNG_DT` | DateTime | Y | Thời gian thay đổi |

> Bất biến (immutable) — không có `DEL_YN`.

### 4.6 Module Chat

#### TB_COMM_CHAT_ROOM (Phòng Chat)
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `CHAT_ROOM_NM` | String | Y | Tên phòng (tối đa 100) |
| `CHAT_ROOM_TYPE_CD` | String | Y | Loại: DM/GROUP |
| `MAX_MBR_CNT` | Number | Y | Số thành viên tối đa (DM: 2, GROUP: 100) |
| `CRTR_ID` | ObjectId | FK | ID Người tạo |
| `LST_MSSG_CN` | String | N | Xem trước tin nhắn cuối |
| `LST_MSSG_DT` | DateTime | N | Thời gian tin nhắn cuối |

#### TR_COMM_CHAT_ROOM_MBR (Thành viên)
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `CHAT_ROOM_ID` | ObjectId | FK | ID Phòng chat |
| `USE_ID` | ObjectId | FK | ID Người dùng |
| `JOIN_DT` | DateTime | Y | Ngày tham gia |
| `LAST_READ_DT` | DateTime | N | Thời gian đọc cuối |
| `NOTI_YN` | String(1) | Y | Bật thông báo |

**Ràng buộc duy nhất:** `{ CHAT_ROOM_ID, USE_ID }`. Rời phòng = xóa vật lý.

#### TB_COMM_CHAT_MSG (Tin nhắn)
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `CHAT_ROOM_ID` | ObjectId | FK | ID Phòng |
| `USE_ID` | ObjectId | FK | ID Người gửi |
| `MSSG_CN` | String | Y | Nội dung (tối đa 5.000) |
| `MSSG_TYPE_CD` | String | Y | Loại: TEXT/IMG/FILE |
| `SEND_DT` | DateTime | Y | Thời gian gửi |

### 4.7 Module Quản trị

#### TL_COMM_USE_ACTV (Nhật ký Hoạt động Người dùng)
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `USE_ID` | ObjectId | FK | ID Người dùng mục tiêu |
| `ACTV_TYPE_CD` | String | Y | Loại: ROLE_CHANGE/STTS_CHANGE/PRFL_UPDATE/LGN |
| `PREV_VAL` | String | N | Giá trị trước |
| `NEW_VAL` | String | N | Giá trị mới |
| `PRFMR_ID` | ObjectId | FK | Người thực hiện |
| `CLNT_IP_ADDR` | String | N | Địa chỉ IP máy khách |
| `ACTV_DT` | DateTime | Y | Thời gian hoạt động |

> Không có `DEL_YN`. TTL: 180 ngày dựa trên `ACTV_DT`.

---

## 5. Chiến lược Chỉ mục (Index)

### Chỉ mục Đơn
| Collection | Trường | Loại | Mục đích |
|------------|--------|------|----------|
| TB_COMM_USER | USE_EML | Duy nhất (Unique) | Đăng nhập bằng email |
| TB_COMM_USER | USE_NCNM | Duy nhất (sparse) | Biệt danh |
| TB_COMM_USER | USE_ROLE_CD | Đơn | Lọc theo vai trò |
| TB_PROD_PRD | PRD_CTGR_CD | Đơn | Lọc theo danh mục |
| TB_COMM_ORDR | ORDR_NO | Duy nhất (Unique) | Tra cứu đơn hàng |
| TB_COMM_RFRSH_TKN | TKN_VAL | Duy nhất (Unique) | Xác thực token |

### Chỉ mục Kết hợp
| Collection | Các trường | Mục đích |
|------------|-----------|----------|
| TB_COMM_BOARD_POST | DEL_YN + POST_CTGR_CD + RGST_DT(desc) | Danh sách bảng tin |
| TB_COMM_BOARD_CMNT | POST_ID + DEL_YN + RGST_DT | Bình luận bài viết |
| TB_PROD_PRD | DEL_YN + PRD_CTGR_CD + PRD_STTS_CD + RGST_DT(desc) | Danh sách sản phẩm |
| TB_COMM_ORDR | BYR_ID + ORDR_STTS_CD + RGST_DT(desc) | Đơn hàng của người mua |
| TB_COMM_ORDR_ITEM | SLLR_ID + ITEM_STTS_CD + RGST_DT(desc) | Doanh số người bán |
| TB_COMM_CHAT_MSG | CHAT_ROOM_ID + SEND_DT(desc) | Tin nhắn chat |

### Chỉ mục TTL (Tự động xóa)
| Collection | Trường | TTL |
|------------|--------|-----|
| TB_COMM_RFRSH_TKN | EXPR_DT | Khi hết hạn |
| TL_COMM_LGN_LOG | LGN_DT | 90 ngày |
| TL_COMM_USE_ACTV | ACTV_DT | 180 ngày |

### Chỉ mục Văn bản (Tìm kiếm toàn văn)
| Collection | Các trường |
|------------|-----------|
| TB_COMM_BOARD_POST | POST_TTL + POST_CN |
| TB_PROD_PRD | PRD_NM + PRD_DC + SRCH_TAGS |

---

## 6. Ánh xạ Prisma Schema

```
MongoDB Collection         Prisma Model              @@map()
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

> Ánh xạ trường: Prisma sử dụng `camelCase`, MongoDB sử dụng `UPPER_SNAKE_CASE` thông qua `@map()`.
