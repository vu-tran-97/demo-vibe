# Demo Vibe - Local Development Setup Guide

## Prerequisites

| Tool | Version | Check Command |
|------|---------|---------------|
| Node.js | >= 20 | `node -v` |
| Docker Desktop | >= 24 | `docker --version` |
| Docker Compose | >= 2.0 | `docker compose version` |
| Git | >= 2.0 | `git --version` |

---

## 1. Clone & Install

```bash
git clone git@github.com:vu-tran-97/demo-vibe.git
cd demo-vibe

# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install && cd ..
```

## 2. Environment Configuration

```bash
# Copy the example env file
cp .env.example .env
```

Edit `.env` if needed (defaults work for local Docker setup):

```env
DATABASE_URL="mongodb://localhost:27017/demo-vibe?replicaSet=rs0"
PORT=4000
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-jwt-secret-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-change-in-production
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## 3. Start Docker Services

### Option A: You already have local MongoDB running

If you have MongoDB installed locally (e.g., via Homebrew), just start Jenkins:

```bash
docker compose up -d jenkins
```

Your `.env` stays as-is: `mongodb://localhost:27017/demo-vibe?replicaSet=rs0`

### Option B: Use Docker for everything (no local MongoDB)

```bash
docker compose up -d
```

### Option C: Local MongoDB occupies 27017, use Docker MongoDB on different port

```bash
MONGO_PORT=27018 docker compose up -d
```

Then update `.env`:

```env
DATABASE_URL="mongodb://localhost:27018/demo-vibe?replicaSet=rs0"
```

### Verify

```bash
docker ps
```

Expected output:

| Container | Port | Description |
|-----------|------|-------------|
| `demo-vibe-mongo` | `27017` (or `27018`) | MongoDB 7 with Replica Set |
| `demo-vibe-jenkins` | `8080` | Jenkins CI/CD |

Wait for MongoDB health check (usually ~10s):

```bash
docker inspect --format='{{.State.Health.Status}}' demo-vibe-mongo
# Should output: healthy
```

## 4. Initialize Database

```bash
# Push Prisma schema to MongoDB
npx prisma db push

# Seed with initial data (admin, sellers, buyers, products)
npm run db:seed
```

### Seeded Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@astratech.vn` | `Admin@123` |
| Buyer | `buyer@vibe.com` | `Buyer@123` |
| Seller | `minji@vibe.com` | `Seller@123` |
| Seller | `seonwoo@vibe.com` | `Seller@123` |
| Seller | `yuna@vibe.com` | `Seller@123` |

## 5. Start Development Servers

```bash
# Terminal 1 - Backend (NestJS)
cd server && npm run dev
# Runs on http://localhost:4000

# Terminal 2 - Frontend (Next.js)
npm run dev
# Runs on http://localhost:3000
```

## 6. Verify Everything Works

1. Open http://localhost:3000 - Home page with products
2. Login as admin (`admin@astratech.vn` / `Admin@123`)
3. Navigate to Dashboard > Admin > Users
4. Open http://localhost:4000/api/products - API returns JSON

---

## Jenkins CI/CD Setup

### First-Time Setup

1. Open http://localhost:8080
2. Get the initial admin password:

```bash
docker exec demo-vibe-jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

3. Paste the password and click **Continue**
4. Click **Install suggested plugins** (wait ~2 min)
5. Create your admin user or skip (use admin)
6. Set Jenkins URL to `http://localhost:8080` and click **Save and Finish**

### Configure Node.js Plugin

1. Go to **Manage Jenkins** > **Plugins** > **Available plugins**
2. Search and install **NodeJS Plugin**
3. Go to **Manage Jenkins** > **Tools**
4. Scroll to **NodeJS installations** > **Add NodeJS**
   - Name: `20`
   - Version: `NodeJS 20.x`
   - Click **Save**

### Create Pipeline Job

1. Click **New Item** on the dashboard
2. Enter name: `demo-vibe`
3. Select **Pipeline** > click **OK**
4. In the Pipeline section:
   - **Definition**: Pipeline script from SCM
   - **SCM**: Git
   - **Repository URL**: `https://github.com/vu-tran-97/demo-vibe.git`
   - **Branch**: `*/feat/sprint-1-auth` (or `*/main`)
   - **Script Path**: `Jenkinsfile`
5. Click **Save**
6. Click **Build Now** to test

### Pipeline Stages

The `Jenkinsfile` runs the following stages:

```
Checkout → Install Dependencies → Generate Prisma → Lint → Test → Build
```

| Stage | What it does |
|-------|-------------|
| Install Dependencies | `npm ci` for frontend and backend (parallel) |
| Generate Prisma | `npx prisma generate` |
| Lint | TypeScript check for frontend and backend (parallel) |
| Test | `npm run test` in server (Jest) |
| Build | `npm run build` for both frontend and backend (parallel) |

---

## Docker Commands Reference

### Start/Stop

```bash
# Start all services
docker compose up -d

# Stop all services (keeps data)
docker compose down

# Stop and remove all data (fresh start)
docker compose down -v
```

### MongoDB

```bash
# Connect to MongoDB shell
docker exec -it demo-vibe-mongo mongosh

# Check replica set status
docker exec demo-vibe-mongo mongosh --eval "rs.status()"

# View collections
docker exec demo-vibe-mongo mongosh --eval "db.getSiblingDB('demo-vibe').getCollectionNames()"

# Export database
docker exec demo-vibe-mongo mongodump --db demo-vibe --out /tmp/backup
docker cp demo-vibe-mongo:/tmp/backup ./backup

# Import database
docker cp ./backup demo-vibe-mongo:/tmp/backup
docker exec demo-vibe-mongo mongorestore --db demo-vibe /tmp/backup/demo-vibe
```

### Jenkins

```bash
# View Jenkins logs
docker logs demo-vibe-jenkins

# Get initial admin password
docker exec demo-vibe-jenkins cat /var/jenkins_home/secrets/initialAdminPassword

# Restart Jenkins
docker restart demo-vibe-jenkins
```

### Logs & Debugging

```bash
# View all container logs
docker compose logs -f

# View specific container logs
docker compose logs -f mongodb
docker compose logs -f jenkins

# Check container resource usage
docker stats
```

---

## Project Structure

```
demo-vibe/
├── docker-compose.yml         # Docker services (MongoDB + Jenkins)
├── docker/
│   └── mongo-init.js          # MongoDB initialization script
├── Jenkinsfile                # CI/CD pipeline definition
├── .env                       # Environment variables (not committed)
├── .env.example               # Environment template
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed data script
├── server/                    # NestJS backend (port 4000)
│   └── src/
│       ├── auth/              # Authentication module
│       ├── admin/             # Admin management module
│       ├── product/           # Product module
│       └── order/             # Order module
└── src/                       # Next.js frontend (port 3000)
    ├── app/                   # Pages (App Router)
    ├── components/            # Shared components
    ├── hooks/                 # Custom React hooks
    └── lib/                   # API clients & utilities
```

---

## Troubleshooting

### MongoDB connection refused

```bash
# Check if container is running
docker ps | grep mongo

# Check health status
docker inspect --format='{{.State.Health.Status}}' demo-vibe-mongo

# Restart MongoDB
docker restart demo-vibe-mongo
```

### MongoDB replica set not initialized

```bash
# Manually initialize replica set
docker exec demo-vibe-mongo mongosh --eval "rs.initiate({_id:'rs0',members:[{_id:0,host:'localhost:27017'}]})"
```

### Port already in use

```bash
# Check what's using port 27017
lsof -i :27017

# Check what's using port 8080
lsof -i :8080

# Kill process on a specific port
kill -9 $(lsof -t -i :27017)
```

### Reset everything from scratch

```bash
# Stop containers and remove all volumes
docker compose down -v

# Start fresh
docker compose up -d

# Wait for health check, then re-initialize
npx prisma db push
npm run db:seed
```

### Jenkins build fails with "NodeJS not found"

Make sure you installed the **NodeJS Plugin** and configured a NodeJS installation named `20` in Jenkins Tools settings. See [Configure Node.js Plugin](#configure-nodejs-plugin) above.
