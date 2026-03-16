# Project Overview: demo-vibe

## Vision

Build an e-commerce service with authentication, bulletin board, and real-time chat features.

## Goals

1. Build a secure authentication system (JWT-based)
2. Support product reviews and community interaction via board module
3. Enable instant buyer-seller communication via real-time chat
4. Design an extensible modular architecture

## Module Structure

```
demo-vibe/
├── Auth Module
│   ├── Signup (email / social)
│   ├── Login / Logout
│   └── Token management (JWT)
│
├── Board Module
│   ├── Post CRUD
│   ├── Comment system
│   └── Search / Filtering
│
└── Chat Module
    ├── Chat room create / manage
    ├── Real-time messaging (WebSocket)
    └── Message history
```

## Tech Stack Rationale

| Area | Choice | Reason |
|------|--------|--------|
| Backend | **NestJS** | TypeScript-based, modular architecture, built-in WebSocket support |
| Frontend | **Next.js 15** | App Router, SSR/SSG, performance optimization with Server Components |
| Database | **MongoDB 7** | Flexible schema, well-suited for chat message storage, Prisma support |
| ORM | **Prisma** | Type-safe, MongoDB Adapter support, migration management |
| Real-time | **Socket.IO** | NestJS Gateway integration, built-in reconnection/room management |

## Blueprint Directory Structure

Individual feature blueprints are managed as numbered directories under `docs/blueprints/`:

```
docs/blueprints/
├── overview.md          ← This file
├── 001-auth/
│   └── blueprint.md     ← Auth module design
├── 002-board/
│   └── blueprint.md     ← Board module design
└── 003-chat/
    └── blueprint.md     ← Chat module design
```

## Non-Functional Requirements

| Item | Target |
|------|--------|
| Response time | API p95 < 200ms |
| Concurrency | WebSocket 1,000 simultaneous connections |
| Availability | 99.5% uptime |
| Security | OWASP Top 10 compliance |
