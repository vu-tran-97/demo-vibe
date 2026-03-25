# Hướng dẫn cài đặt AWS SES — Từng bước

> **Mục tiêu:** Cài đặt AWS SES (Sandbox) để gửi email từ ứng dụng Vibe
> **Thời gian:** ~15 phút
> **Chi phí:** Miễn phí (Sandbox: 200 email/ngày)
> **Yêu cầu tên miền:** Không

---

## Bước 0: Tạo tài khoản AWS (bỏ qua nếu bạn đã có)

1. Truy cập **https://aws.amazon.com**
2. Nhấn **"Create an AWS Account"**
3. Điền thông tin:
   - Địa chỉ email (tài khoản root)
   - Tên tài khoản: `vibe-demo`
4. Xác minh email → Đặt mật khẩu
5. Thông tin liên hệ: Chọn tài khoản **Personal** (Cá nhân) là được
6. Thanh toán: Thêm thẻ tín dụng/ghi nợ (sẽ KHÔNG bị tính phí cho gói miễn phí)
7. Xác minh danh tính: Số điện thoại → Mã SMS
8. Gói hỗ trợ: **Basic (Miễn phí)**
9. Nhấn **"Complete sign up"**

> AWS Free Tier bao gồm SES: 62.000 email/tháng từ EC2, hoặc 200/ngày trong chế độ sandbox.

---

## Bước 1: Mở bảng điều khiển SES & Chọn khu vực

1. Đăng nhập tại **https://console.aws.amazon.com**
2. Ở góc trên bên phải, nhấn vào **bộ chọn khu vực** (ví dụ: "N. Virginia")
3. Chọn: **Asia Pacific (Seoul) — ap-northeast-2**

```
┌──────────────────────────────────────────────┐
│  AWS Console          [Khu vực: Seoul ▼] [?] │
├──────────────────────────────────────────────┤
│                                              │
│  Thanh tìm kiếm: gõ "SES"                   │
│                                              │
│  → Nhấn "Amazon Simple Email Service"        │
│                                              │
└──────────────────────────────────────────────┘
```

4. Trong thanh tìm kiếm ở trên cùng, gõ **"SES"**
5. Nhấn **"Amazon Simple Email Service"**

---

## Bước 2: Xác minh email người gửi

Đây là địa chỉ email sẽ hiển thị trong trường "From" (Người gửi).

1. Trong thanh bên trái của SES, nhấn **"Verified identities"**
2. Nhấn nút **"Create identity"** (màu cam)

```
┌──────────────────────────────────────────────┐
│  Create identity                             │
├──────────────────────────────────────────────┤
│                                              │
│  Loại danh tính:                             │
│    ○ Domain                                  │
│    ● Email address    ← Chọn mục này         │
│                                              │
│  Địa chỉ email:                              │
│  ┌──────────────────────────────────┐        │
│  │ your-real-email@gmail.com        │        │
│  └──────────────────────────────────┘        │
│                                              │
│  [Create identity]                           │
│                                              │
└──────────────────────────────────────────────┘
```

3. Chọn **"Email address"**
4. Nhập email của bạn: ví dụ, `your-email@gmail.com`
5. Nhấn **"Create identity"**
6. **Kiểm tra hộp thư Gmail** → Bạn sẽ nhận được email từ AWS:
   - Tiêu đề: "Amazon Web Services – Email Address Verification Request"
   - Nhấn vào **liên kết xác minh** trong email
7. Quay lại bảng điều khiển SES → **Verified identities**
8. Email của bạn sẽ hiển thị: **Identity status: Verified** (dấu tích xanh)

```
┌──────────────────────────────────────────────────────┐
│  Danh tính đã xác minh                               │
├──────────────────────────────────────────────────────┤
│  Danh tính             │ Loại  │ Trạng thái          │
│  ──────────────────────┼───────┼──────────────────── │
│  your-email@gmail.com  │ Email │ ✅ Đã xác minh       │
└──────────────────────────────────────────────────────┘
```

---

## Bước 3: Xác minh email người nhận (Yêu cầu của chế độ Sandbox)

> **QUAN TRỌNG:** Trong chế độ Sandbox, bạn CHỈ có thể gửi đến các địa chỉ email đã được xác minh.
> Bạn cần xác minh mọi email người nhận mà bạn muốn dùng để kiểm thử.

Lặp lại quy trình tương tự cho các email người nhận thử nghiệm:

1. **"Verified identities"** → **"Create identity"**
2. Thêm: `buyer1@yopmail.com` (hoặc bất kỳ email nào bạn có thể truy cập)
3. Nhấn **"Create identity"**
4. Kiểm tra hộp thư của email đó → Nhấn liên kết xác minh

> **Mẹo với yopmail.com:** Truy cập https://yopmail.com → nhập `buyer1` → kiểm tra hộp thư để tìm email xác minh từ AWS.

Xác minh ít nhất 2-3 email thử nghiệm:
- `buyer1@yopmail.com`
- `seller1@yopmail.com`
- Email cá nhân của bạn để kiểm thử

---

## Bước 4: Tạo thông tin đăng nhập SMTP

Đây là bước quan trọng nhất — bạn sẽ nhận được tên người dùng/mật khẩu để gửi email.

1. Trong thanh bên trái của SES, nhấn **"SMTP settings"**

```
┌──────────────────────────────────────────────────────┐
│  Cài đặt Simple Mail Transfer Protocol (SMTP)        │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Điểm cuối SMTP:                                     │
│  email-smtp.ap-northeast-2.amazonaws.com             │
│                                                      │
│  Cổng STARTTLS: 587                                  │
│  Cổng TLS Wrapper: 465                               │
│                                                      │
│  [Create SMTP credentials]  ← Nhấn vào đây           │
│                                                      │
└──────────────────────────────────────────────────────┘
```

2. Nhấn **"Create SMTP credentials"**
3. Thao tác này sẽ mở **IAM Console** với biểu mẫu đã được điền sẵn:

```
┌──────────────────────────────────────────────────────┐
│  Tạo người dùng cho SMTP                             │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Tên người dùng IAM:                                 │
│  ┌──────────────────────────────────┐                │
│  │ ses-smtp-user.20260324-095500    │  ← Giữ nguyên  │
│  └──────────────────────────────────┘    hoặc đổi    │
│                                         thành        │
│                                         "ses-vibe"   │
│                                                      │
│  [Create user]                                       │
│                                                      │
└──────────────────────────────────────────────────────┘
```

4. Nhấn **"Create user"**
5. **QUAN TRỌNG: Tải xuống/sao chép thông tin đăng nhập NGAY BÂY GIỜ!**

```
┌──────────────────────────────────────────────────────┐
│  ✅ Tạo người dùng thành công                         │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ⚠️  Đây là lần DUY NHẤT bạn có thể xem mật khẩu    │
│                                                      │
│  Tên người dùng SMTP:                                │
│  ┌──────────────────────────────────┐                │
│  │ AKIAIOSFODNN7EXAMPLE             │ ← Sao chép     │
│  └──────────────────────────────────┘                │
│                                                      │
│  Mật khẩu SMTP:                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │ BM+H0bG2Kfiug5F1kVcXYZABCDEFGHIJKLMNOPQR   │ ← Sao chép │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  [Download credentials]  [Đóng]                      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

6. **Sao chép cả hai giá trị** hoặc nhấn **"Download credentials"** (tệp CSV)

> ⚠️ Bạn sẽ KHÔNG BAO GIỜ có thể xem lại mật khẩu SMTP.
> Nếu bạn mất nó, bạn phải tạo thông tin đăng nhập mới.

---

## Bước 5: Cập nhật .env trong dự án

Mở tệp `.env` của bạn và thêm thông tin đăng nhập AWS SES:

```bash
# ── Nhà cung cấp Email ──────────────────────────────────────
MAIL_PROVIDER=ses
MAIL_FROM="Vibe <your-verified-email@gmail.com>"

# AWS SES
AWS_SES_REGION=ap-northeast-2
AWS_SES_SMTP_USER=AKIAIOSFODNN7EXAMPLE          # ← Dán tên người dùng SMTP của bạn
AWS_SES_SMTP_PASSWORD=BM+H0bG2Kfiug5F1kVcXYZ... # ← Dán mật khẩu SMTP của bạn
```

> **MAIL_FROM phải sử dụng email người gửi đã xác minh!**
> Trong chế độ sandbox, địa chỉ "from" phải là một danh tính đã được xác minh.

---

## Bước 6: Khởi động lại Backend & Kiểm thử

### 6.1 Khởi động lại máy chủ NestJS

Máy chủ sẽ tự động tải lại (hot-reload). Kiểm tra nhật ký (log):

```
[MailService] Mail provider: AWS SES SMTP (ap-northeast-2)
```

Nếu bạn thấy `Mail provider: SMTP (smtp.gmail.com)` thay vào đó, các biến môi trường chưa được tải. Hãy thử khởi động lại thủ công.

### 6.2 Kiểm thử qua Đăng ký

1. Mở http://localhost:3000/auth/signup
2. Đăng ký với một **email người nhận đã xác minh** (ví dụ: `buyer1@yopmail.com`)
3. Kiểm tra:
   - Nhật ký backend: `Email sent successfully: provider=ses, template=welcome, to=buyer1@yopmail.com`
   - Hộp thư người nhận: Email chào mừng từ "Vibe"

### 6.3 Kiểm thử qua curl (phương án thay thế)

```bash
# Đăng nhập để lấy token
FIREBASE_API_KEY="AIzaSyAlVpwJ91xzok_uMSdX4a57TrxX3R8nNRw"

# Tạo người dùng thử nghiệm mới (kích hoạt email chào mừng)
curl -s -X POST \
  "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=$FIREBASE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"verified-test@yopmail.com","password":"Test@1234","returnSecureToken":true}'

# Auth guard của backend sẽ tự động tạo người dùng và gửi email chào mừng
```

### 6.4 Kiểm tra nhật ký Email trong Cơ sở dữ liệu

```sql
SELECT "RCPNT_EML", "TMPLT_NM", "SND_STTS_CD", "ERR_MSG", "SND_DT"
FROM "TL_COMM_EML_LOG"
ORDER BY "SND_DT" DESC
LIMIT 5;
```

Kết quả mong đợi:
```
 RCPNT_EML              | TMPLT_NM | SND_STTS_CD | ERR_MSG | SND_DT
------------------------+----------+-------------+---------+---------------------
 buyer1@yopmail.com     | welcome  | SUCC        | NULL    | 2026-03-24 09:xx:xx
```

---

## Xử lý sự cố

### Lỗi: "Email address is not verified"

```
MessageRejected: Email address is not verified.
The following identities failed the check in region AP-NORTHEAST-2: buyer1@yopmail.com
```

**Cách khắc phục:** Trong chế độ sandbox, hãy xác minh email người nhận:
- SES Console → Verified identities → Create identity → Thêm email người nhận

### Lỗi: "Credential should be scoped to a valid region"

**Cách khắc phục:** Đảm bảo `AWS_SES_REGION` khớp với khu vực mà bạn đã xác minh danh tính:
```bash
AWS_SES_REGION=ap-northeast-2  # Phải khớp với khu vực trên bảng điều khiển SES
```

### Lỗi: "Invalid login" hoặc "Authentication failed"

**Cách khắc phục:** Bạn có thể đang sử dụng thông tin IAM thay vì thông tin SMTP:
- Vào SES Console → SMTP settings → Tạo thông tin đăng nhập SMTP **mới**
- Thông tin đăng nhập SMTP KHÁC với khóa truy cập IAM (IAM access keys)

### Email bị vào thư mục spam

Trong chế độ sandbox, điều này là bình thường. Để dùng cho production (môi trường thực tế):
1. Xác minh tên miền (không chỉ email)
2. Thiết lập bản ghi DNS cho DKIM, SPF, DMARC
3. Yêu cầu quyền truy cập production

---

## Tóm tắt

```
Những gì bạn đã làm:
  ✅ Tạo tài khoản AWS (miễn phí)
  ✅ Xác minh email người gửi trong SES
  ✅ Xác minh email người nhận (sandbox)
  ✅ Tạo thông tin đăng nhập SMTP
  ✅ Cập nhật .env với cấu hình SES
  ✅ Kiểm thử gửi email

Những gì bạn nhận được:
  📧 200 email/ngày (miễn phí, sandbox)
  🔒 SMTP mã hóa TLS
  📊 Nhật ký email trong cơ sở dữ liệu
  🔄 Tự động phát hiện: xóa biến AWS → tự động chuyển về Gmail SMTP
```

---

## Bước tiếp theo (Khi bạn có tên miền)

| Bước | Hành động |
|------|-----------|
| 1 | Mua tên miền: Namecheap `.xyz` (~$1/năm) |
| 2 | Thêm tên miền vào Cloudflare (DNS miễn phí) |
| 3 | Xác minh tên miền trong SES (không chỉ email) |
| 4 | Thêm bản ghi DKIM CNAME (3 bản ghi) trong Cloudflare |
| 5 | Thêm bản ghi SPF TXT trong Cloudflare |
| 6 | Thêm bản ghi DMARC TXT trong Cloudflare |
| 7 | Yêu cầu quyền truy cập SES production |
| 8 | Cập nhật `MAIL_FROM` để sử dụng email tên miền |
