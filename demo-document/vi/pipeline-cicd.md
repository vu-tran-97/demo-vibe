# Tài liệu Pipeline CI/CD

> **Dự án:** Nền tảng Thương mại điện tử Vibe
> **Cập nhật lần cuối:** 2026-03-20
> **Công cụ CI:** Jenkins (Declarative Pipeline)
> **Triển khai:** Railway (nhánh staging)
> **Container hóa:** Docker + Docker Compose

---

## 1. Tổng quan kiến trúc

```
┌──────────┐     push     ┌──────────┐     triển khai  ┌──────────┐
│  GitHub   │ ──────────> │  Jenkins  │ ─────────────> │  Railway  │
│  (repo)   │  webhook    │  (CI/CD)  │  chỉ staging   │  (prod)   │
└──────────┘              └──────────┘                 └──────────┘
                               │
                    ┌──────────┴──────────┐
                    │  Các giai đoạn:      │
                    │  1. Checkout         │
                    │  2. Cài đặt gói     │
                    │  3. Prisma Generate  │
                    │  4. Lint             │
                    │  5. Test             │
                    │  6. Build            │
                    │  7. Deploy           │
                    └─────────────────────┘
```

---

## 2. Jenkins Pipeline (Jenkinsfile)

### Kích hoạt
- **GitHub Push Webhook** — tự động kích hoạt khi push lên bất kỳ nhánh nào

### Biến môi trường
| Biến | Nguồn | Mô tả |
|------|--------|-------|
| `RAILWAY_TOKEN` | Jenkins Credentials | Token triển khai Railway |

### Các giai đoạn Pipeline

#### Giai đoạn 1: Checkout
```groovy
checkout scm
```

#### Giai đoạn 2: Cài đặt Dependencies (Song song)
| Giai đoạn con | Lệnh |
|----------------|-------|
| Frontend | `npm ci` |
| Backend | `cd server && npm ci` |

#### Giai đoạn 3: Tạo Prisma Client
```bash
npx prisma generate
```

#### Giai đoạn 4: Lint (Song song)
| Giai đoạn con | Lệnh | Ghi chú |
|----------------|-------|---------|
| Frontend Lint | `npm run lint \|\| true` | ESLint (không chặn) |
| Backend Lint | `cd server && npx tsc --noEmit \|\| true` | Kiểm tra TypeScript (không chặn) |

#### Giai đoạn 5: Test
```bash
cd server && npm run test -- --passWithNoTests --forceExit
```
- Chỉ chạy unit test phía Backend (Jest)
- `--passWithNoTests`: bỏ qua nếu không có file test nào
- `--forceExit`: buộc Jest thoát sau khi hoàn thành test

#### Giai đoạn 6: Build (Song song)
| Giai đoạn con | Lệnh | Kết quả |
|----------------|-------|---------|
| Backend | `cd server && npm run build` | `server/dist/` |
| Frontend | `npm run build` | `.next/` |

#### Giai đoạn 7: Triển khai lên Railway
- **Điều kiện:** Chỉ chạy trên nhánh `staging`
- **Lệnh:**
```bash
railway up --detach \
  --service 02c5d317-a1d7-4884-970e-d525bb987791 \
  --environment production
```

### Hành động sau Build
| Điều kiện | Hành động |
|-----------|-----------|
| Luôn luôn | Dọn dẹp workspace (node_modules, .next, dist) |
| Thành công | Ghi log "Build & Deploy successful!" |
| Thất bại | Ghi log "Build failed!" |

### Tùy chọn
| Tùy chọn | Giá trị |
|-----------|---------|
| Thời gian chờ tối đa | 30 phút |
| Lưu giữ bản build | Giữ 20 bản build gần nhất |
| Dấu thời gian | Bật |

---

## 3. Docker Compose

### Các dịch vụ

```yaml
services:
  mongodb:        # MongoDB 7 với replica set
  backend:        # NestJS API server
  jenkins:        # Jenkins CI (tùy chọn, profile: ci)
```

#### MongoDB
| Thuộc tính | Giá trị |
|------------|---------|
| Image | `demo-vibe-mongo:latest` (tùy chỉnh với init script) |
| Cổng | `27018:27017` (host:container) |
| Volume | `mongo-data:/data/db` |
| Healthcheck | Kiểm tra trạng thái replica set + tự động khởi tạo |
| Mạng | `demo-vibe-net` |

#### Backend (NestJS)
| Thuộc tính | Giá trị |
|------------|---------|
| Image | `demo-vibe-backend:latest` |
| Dockerfile | `Dockerfile.backend` (multi-stage) |
| Cổng | `3001:4000` (host:container) |
| Phụ thuộc | MongoDB (healthy) |
| Mạng | `demo-vibe-net` |

**Biến môi trường:**
| Biến | Giá trị |
|------|---------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `mongodb://mongodb:27017/demo-vibe?replicaSet=rs0&directConnection=true` |
| `JWT_SECRET` | `${JWT_SECRET:-dev-jwt-secret}` |
| `JWT_REFRESH_SECRET` | `${JWT_REFRESH_SECRET:-dev-jwt-refresh-secret}` |

#### Jenkins (Tùy chọn)
| Thuộc tính | Giá trị |
|------------|---------|
| Image | `jenkins/jenkins:lts` |
| Profile | `ci` (chỉ khi dùng `--profile ci`) |
| Cổng | `8080:8080` (giao diện), `50000:50000` (agent) |
| Volumes | `jenkins-data`, Docker socket |

### Lệnh nhanh
```bash
# Khởi động MongoDB + Backend
docker compose up -d

# Khởi động kèm Jenkins
docker compose --profile ci up -d jenkins

# Dừng tất cả
docker compose down

# Đặt lại (xóa dữ liệu)
docker compose down -v && docker compose up -d
```

---

## 4. Dockerfiles

### Backend (Dockerfile.backend) — Multi-stage

```
Stage 1: deps        → npm ci, prisma generate
Stage 2: builder     → npm run build → dist/
Stage 3: runner      → node dist/main (user không phải root, cổng 4000)
```

| Giai đoạn | Base | Kết quả |
|-----------|------|---------|
| deps | `node:20-alpine` | `node_modules/`, `.prisma/client` |
| builder | `node:20-alpine` | `dist/` (JS đã biên dịch) |
| runner | `node:20-alpine` | Image production (~150MB) |

### Frontend (Dockerfile.frontend) — Multi-stage

```
Stage 1: deps        → npm ci, prisma generate
Stage 2: builder     → npm run build (standalone output)
Stage 3: runner      → node server.js (user không phải root, cổng 3000)
```

| Giai đoạn | Base | Kết quả |
|-----------|------|---------|
| deps | `node:20-alpine` | `node_modules/` |
| builder | `node:20-alpine` | `.next/standalone`, `.next/static` |
| runner | `node:20-alpine` | Image production (~200MB) |

> Yêu cầu cấu hình `output: "standalone"` trong `next.config.ts`.

---

## 5. Thiết lập môi trường phát triển

### Yêu cầu tiên quyết
- Node.js 20+
- Docker + Docker Compose
- MongoDB 7 (hoặc sử dụng Docker)

### Phát triển cục bộ (Local)
```bash
# 1. Khởi động MongoDB
docker compose up -d mongodb
# hoặc sử dụng MongoDB cục bộ với replica set

# 2. Cài đặt dependencies
npm ci && cd server && npm ci && cd ..

# 3. Tạo Prisma client
npx prisma generate

# 4. Khởi tạo dữ liệu mẫu
npm run db:push && npm run db:seed

# 5. Khởi động server
npm run dev          # Frontend (cổng 3000)
npm run dev:server   # Backend (cổng 4000)
```

### File cấu hình môi trường
| File | Mục đích |
|------|----------|
| `.env` | Frontend (DATABASE_URL cho Prisma) |
| `server/.env` | Backend (cấu hình DB, JWT, OAuth, SMTP) |

---

## 6. Luồng triển khai

```
Lập trình viên ──push──> GitHub (nhánh feat/*)
                             │
                             ▼
                         Jenkins (tự động kích hoạt)
                             │
                         ┌───┴───┐
                         │ Lint  │ (song song)
                         │ Test  │
                         │ Build │ (song song)
                         └───┬───┘
                             │
                   ┌─────────┴─────────┐
                   │ Nhánh staging?    │
                   │   CÓ  → Triển khai│
                   │   KHÔNG → Xong    │
                   └───────────────────┘
```

### Chiến lược phân nhánh
| Nhánh | Mục đích | Triển khai |
|-------|----------|------------|
| `main` | Mã nguồn sẵn sàng production | Thủ công |
| `staging` | Kiểm thử trước production | Tự động (Railway) |
| `feat/*` | Phát triển tính năng | Chỉ CI (không triển khai) |

---

## 7. Thiết lập Jenkins

### Thiết lập lần đầu
```bash
# Khởi động Jenkins
docker compose --profile ci up -d jenkins

# Lấy mật khẩu admin ban đầu
docker exec demo-vibe-jenkins cat /var/jenkins_home/secrets/initialAdminPassword

# Mở http://localhost:8080 và hoàn tất thiết lập
```

### Plugin cần thiết
- GitHub Integration
- Pipeline
- NodeJS Plugin
- Docker Pipeline

### Credentials cần thiết
| ID | Loại | Mô tả |
|----|------|-------|
| `railway-token` | Secret text | Token triển khai Railway |

### Cấu hình Webhook
1. Trong cài đặt repo GitHub, thêm webhook: `http://<jenkins-url>/github-webhook/`
2. Content type: `application/json`
3. Sự kiện: Push events
