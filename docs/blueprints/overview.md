# Project Overview: demo-vibe

## Vision

Build a handcrafted & artisan goods marketplace with authentication, product catalog, order management, bulletin board, and real-time chat features.

## Goals

1. Build a secure authentication system (JWT + social login, role-based access)
2. Enable sellers to list products and manage orders
3. Enable buyers to browse, purchase, and track orders
4. Support product reviews and community interaction via board module
5. Enable instant buyer-seller communication via real-time chat
6. Platform-wide email notifications (welcome, order confirmation, password reset)
7. Design an extensible modular architecture

## Module Structure

```
demo-vibe/
├── Auth Module          ── Signup (email/social), login/logout, JWT, RBAC
├── Admin Module         ── User management, dashboard, role/status control
├── Product Module       ── Product CRUD, catalog, search, filtering
├── Order Module         ── Cart, checkout, order tracking, seller sales
├── Board Module         ── Post CRUD, comments, likes, search
├── Search Module        ── Global search, suggestions, filters
├── Mail Module          ── Email notifications (welcome, order, reset)
├── Chat Module          ── Chat rooms, real-time messaging (WebSocket)
└── Health Module        ── Health check endpoints
```

## Tech Stack Rationale

| Area | Choice | Reason |
|------|--------|--------|
| Backend | **NestJS** | TypeScript-based, modular architecture, built-in WebSocket support |
| Frontend | **Next.js 15** | App Router, SSR/SSG, performance optimization with Server Components |
| Database | **MongoDB 7** | Flexible schema, well-suited for chat message storage, Prisma support |
| ORM | **Prisma** | Type-safe, MongoDB Adapter support, migration management |
| Real-time | **Socket.IO** | NestJS Gateway integration, built-in reconnection/room management |
| Email | **Nodemailer** | SMTP-based, configurable provider, HTML template support |

## Blueprint Directory Structure

Individual feature blueprints are managed as numbered directories under `docs/blueprints/`:

```
docs/blueprints/
├── overview.md                ← This file
├── 001-auth/                  ← Auth module (Sprint 1-3)
├── 002-rbac/                  ← Role-based access control (Sprint 2)
├── 003-admin-ui/              ← Admin dashboard UI (Sprint 2-3)
├── 004-product/               ← Product catalog (Sprint 4)
├── 005-purchase-history/      ← Buyer order history (Sprint 4)
├── 006-admin-enhance/         ← Admin enhancements (Sprint 4)
├── 007-board/                 ← Bulletin board (Sprint 5)
├── 008-user-settings/         ← User settings page (Sprint 5)
├── 009-payment-order/         ← Payment & seller order mgmt (Sprint 5)
├── 010-search-filter/         ← Search & filter (Sprint 5)
├── 011-email-service/         ← Email notifications (Sprint 7)
└── 012-role-signup/           ← Buyer/Seller role signup (Sprint 7)
```

## Sprint-Blueprint Mapping

| Sprint | Blueprints | Focus |
|--------|-----------|-------|
| Sprint 1 | 001-auth | Core auth (email signup, login, JWT) |
| Sprint 2 | 001-auth (social), 002-rbac, 003-admin-ui | Social login, RBAC, admin UI |
| Sprint 3 | 001-auth (carryover), 003-admin-ui (carryover) | Complete auth + admin |
| Sprint 4 | 004-product, 005-purchase-history, 006-admin-enhance | Product catalog, orders, admin |
| Sprint 5 | 007-board, 008-user-settings, 009-payment-order, 010-search-filter | Board, settings, payment, search |
| Sprint 6 | (no new blueprints) | UI polish, cart fixes, E2E testing |
| Sprint 7 | 011-email-service, 012-role-signup | Email notifications, role selection |

## Non-Functional Requirements

| Item | Target |
|------|--------|
| Response time | API p95 < 200ms |
| Concurrency | WebSocket 1,000 simultaneous connections |
| Availability | 99.5% uptime |
| Security | OWASP Top 10 compliance |
