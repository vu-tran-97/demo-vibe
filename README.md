# demo-vibe

A handcrafted & artisan goods marketplace built with Next.js 15 and NestJS.

**Live:** https://vibeoppshop.store/

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router, Server Components), React 19, Tailwind CSS v4 |
| Backend | NestJS (TypeScript), Prisma ORM |
| Database | PostgreSQL 16 |
| Auth | Firebase Auth (email + social login) |
| Real-time | Socket.IO (WebSocket) |
| Email | Nodemailer (AWS SES / SMTP) |
| CI/CD | Jenkins, Docker Compose |

## Features

- **Auth** — Email/social signup, login/logout, JWT token management, Firebase Auth
- **Admin** — User management dashboard, role & status control (RBAC)
- **Products** — Product CRUD, catalog browsing, search & filtering
- **Orders** — Cart, checkout, order tracking, purchase history, seller sales management
- **Board** — Post CRUD, comments, likes, search
- **Search** — Global search with suggestions and filters
- **Email** — Welcome, order confirmation, password reset notifications
- **Settings** — User profile and preferences

## Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose

### Setup

```bash
# 1. Clone the repository
git clone <repo-url> && cd demo-vibe

# 2. Install dependencies
npm install
cd server && npm install && cd ..

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# 4. Start the database
npm run docker:up

# 5. Push schema & seed data
npm run db:push
npm run db:seed

# 6. Generate Prisma client (server)
cd server && npm run db:generate && cd ..
```

### Development

```bash
# Frontend (http://localhost:3000)
npm run dev

# Backend (http://localhost:4000)
npm run dev:server
```

### Docker (Production)

```bash
docker compose up -d
```

## Project Structure

```
demo-vibe/
├── src/                  # Next.js frontend
│   └── app/
│       ├── auth/         # Login, signup pages
│       ├── products/     # Product catalog
│       ├── cart/         # Shopping cart
│       ├── checkout/     # Checkout flow
│       ├── orders/       # Order history
│       ├── dashboard/    # Admin dashboard
│       ├── settings/     # User settings
│       └── ...
├── server/               # NestJS backend
│   └── src/
│       ├── auth/         # Auth module
│       ├── product/      # Product module
│       ├── order/        # Order module
│       ├── board/        # Board module
│       ├── admin/        # Admin module
│       ├── mail/         # Email module
│       ├── search/       # Search module
│       ├── firebase/     # Firebase integration
│       └── prisma/       # Prisma service
├── prisma/               # Prisma schema & seeds
├── docs/                 # Design docs, blueprints, sprint plans
└── docker-compose.yml    # PostgreSQL + Backend + Jenkins
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend dev server |
| `npm run dev:server` | Start backend dev server |
| `npm run build` | Build frontend for production |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:reset` | Reset database (destroy + recreate + seed) |
| `npm run docker:up` | Start Docker services |
| `npm run docker:down` | Stop Docker services |

## Methodology

This project is built using the [ASTRA methodology](https://github.com/anthropics/claude-code-plugins) (AI-augmented Sprint Through Rapid Assembly) with 1-week sprint cycles and AI-assisted development workflows.

## License

Private
