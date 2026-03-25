# CI/CD Pipeline Document

> **Project:** Vibe E-Commerce Platform
> **Last Updated:** 2026-03-20
> **CI Tool:** Jenkins (Declarative Pipeline)
> **Deployment:** Railway (staging branch)
> **Containerization:** Docker + Docker Compose

---

## 1. Architecture Overview

```
┌──────────┐     push     ┌──────────┐     deploy     ┌──────────┐
│  GitHub   │ ──────────> │  Jenkins  │ ─────────────> │  Railway  │
│  (repo)   │  webhook    │  (CI/CD)  │  staging only  │  (prod)   │
└──────────┘              └──────────┘                 └──────────┘
                               │
                    ┌──────────┴──────────┐
                    │  Pipeline Stages:    │
                    │  1. Checkout         │
                    │  2. Install Deps     │
                    │  3. Prisma Generate  │
                    │  4. Lint             │
                    │  5. Test             │
                    │  6. Build            │
                    │  7. Deploy           │
                    └─────────────────────┘
```

---

## 2. Jenkins Pipeline (Jenkinsfile)

### Trigger
- **GitHub Push Webhook** — auto-triggers on push to any branch

### Environment
| Variable | Source | Description |
|----------|--------|-------------|
| `RAILWAY_TOKEN` | Jenkins Credentials | Railway deployment token |

### Pipeline Stages

#### Stage 1: Checkout
```groovy
checkout scm
```

#### Stage 2: Install Dependencies (Parallel)
| Sub-stage | Command |
|-----------|---------|
| Frontend | `npm ci` |
| Backend | `cd server && npm ci` |

#### Stage 3: Generate Prisma Client
```bash
npx prisma generate
```

#### Stage 4: Lint (Parallel)
| Sub-stage | Command | Notes |
|-----------|---------|-------|
| Frontend Lint | `npm run lint \|\| true` | ESLint (non-blocking) |
| Backend Lint | `cd server && npx tsc --noEmit \|\| true` | TypeScript check (non-blocking) |

#### Stage 5: Test
```bash
cd server && npm run test -- --passWithNoTests --forceExit
```
- Backend unit tests only (Jest)
- `--passWithNoTests`: pass if no test files exist
- `--forceExit`: force Jest exit after tests complete

#### Stage 6: Build (Parallel)
| Sub-stage | Command | Output |
|-----------|---------|--------|
| Backend | `cd server && npm run build` | `server/dist/` |
| Frontend | `npm run build` | `.next/` |

#### Stage 7: Deploy to Railway
- **Condition:** Only runs on `staging` branch
- **Command:**
```bash
railway up --detach \
  --service 02c5d317-a1d7-4884-970e-d525bb987791 \
  --environment production
```

### Post-Build Actions
| Condition | Action |
|-----------|--------|
| Always | Clean workspace (node_modules, .next, dist) |
| Success | Log "Build & Deploy successful!" |
| Failure | Log "Build failed!" |

### Options
| Option | Value |
|--------|-------|
| Timeout | 30 minutes |
| Build retention | Keep last 20 builds |
| Timestamps | Enabled |

---

## 3. Docker Compose

### Services

```yaml
services:
  mongodb:        # MongoDB 7 with replica set
  backend:        # NestJS API server
  jenkins:        # Jenkins CI (optional, profile: ci)
```

#### MongoDB
| Property | Value |
|----------|-------|
| Image | `demo-vibe-mongo:latest` (custom with init script) |
| Port | `27018:27017` (host:container) |
| Volume | `mongo-data:/data/db` |
| Healthcheck | Replica set status + auto-init |
| Network | `demo-vibe-net` |

#### Backend (NestJS)
| Property | Value |
|----------|-------|
| Image | `demo-vibe-backend:latest` |
| Dockerfile | `Dockerfile.backend` (multi-stage) |
| Port | `3001:4000` (host:container) |
| Depends on | MongoDB (healthy) |
| Network | `demo-vibe-net` |

**Environment Variables:**
| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `mongodb://mongodb:27017/demo-vibe?replicaSet=rs0&directConnection=true` |
| `JWT_SECRET` | `${JWT_SECRET:-dev-jwt-secret}` |
| `JWT_REFRESH_SECRET` | `${JWT_REFRESH_SECRET:-dev-jwt-refresh-secret}` |

#### Jenkins (Optional)
| Property | Value |
|----------|-------|
| Image | `jenkins/jenkins:lts` |
| Profile | `ci` (only with `--profile ci`) |
| Ports | `8080:8080` (UI), `50000:50000` (agent) |
| Volumes | `jenkins-data`, Docker socket |

### Quick Commands
```bash
# Start MongoDB + Backend
docker compose up -d

# Start with Jenkins
docker compose --profile ci up -d jenkins

# Stop all
docker compose down

# Reset (delete data)
docker compose down -v && docker compose up -d
```

---

## 4. Dockerfiles

### Backend (Dockerfile.backend) — Multi-stage

```
Stage 1: deps        → npm ci, prisma generate
Stage 2: builder     → npm run build → dist/
Stage 3: runner      → node dist/main (non-root user, port 4000)
```

| Stage | Base | Output |
|-------|------|--------|
| deps | `node:20-alpine` | `node_modules/`, `.prisma/client` |
| builder | `node:20-alpine` | `dist/` (compiled JS) |
| runner | `node:20-alpine` | Production image (~150MB) |

### Frontend (Dockerfile.frontend) — Multi-stage

```
Stage 1: deps        → npm ci, prisma generate
Stage 2: builder     → npm run build (standalone output)
Stage 3: runner      → node server.js (non-root user, port 3000)
```

| Stage | Base | Output |
|-------|------|--------|
| deps | `node:20-alpine` | `node_modules/` |
| builder | `node:20-alpine` | `.next/standalone`, `.next/static` |
| runner | `node:20-alpine` | Production image (~200MB) |

> Requires `output: "standalone"` in `next.config.ts`.

---

## 5. Development Setup

### Prerequisites
- Node.js 20+
- Docker + Docker Compose
- MongoDB 7 (or use Docker)

### Local Development
```bash
# 1. Start MongoDB
docker compose up -d mongodb
# or use local MongoDB with replica set

# 2. Install dependencies
npm ci && cd server && npm ci && cd ..

# 3. Generate Prisma client
npx prisma generate

# 4. Seed database
npm run db:push && npm run db:seed

# 5. Start servers
npm run dev          # Frontend (port 3000)
npm run dev:server   # Backend (port 4000)
```

### Environment Files
| File | Purpose |
|------|---------|
| `.env` | Frontend (DATABASE_URL for Prisma) |
| `server/.env` | Backend (DB, JWT, OAuth, SMTP config) |

---

## 6. Deployment Flow

```
Developer ──push──> GitHub (feat/* branch)
                        │
                        ▼
                    Jenkins (auto-trigger)
                        │
                    ┌───┴───┐
                    │ Lint  │ (parallel)
                    │ Test  │
                    │ Build │ (parallel)
                    └───┬───┘
                        │
              ┌─────────┴─────────┐
              │ staging branch?   │
              │   YES → Deploy    │
              │   NO  → Done     │
              └───────────────────┘
```

### Branch Strategy
| Branch | Purpose | Deploy |
|--------|---------|--------|
| `main` | Production-ready code | Manual |
| `staging` | Pre-production testing | Auto (Railway) |
| `feat/*` | Feature development | CI only (no deploy) |

---

## 7. Jenkins Setup

### First-time Setup
```bash
# Start Jenkins
docker compose --profile ci up -d jenkins

# Get initial admin password
docker exec demo-vibe-jenkins cat /var/jenkins_home/secrets/initialAdminPassword

# Open http://localhost:8080 and complete setup
```

### Required Plugins
- GitHub Integration
- Pipeline
- NodeJS Plugin
- Docker Pipeline

### Required Credentials
| ID | Type | Description |
|----|------|-------------|
| `railway-token` | Secret text | Railway deployment token |

### Webhook Configuration
1. In GitHub repo settings, add webhook: `http://<jenkins-url>/github-webhook/`
2. Content type: `application/json`
3. Events: Push events
