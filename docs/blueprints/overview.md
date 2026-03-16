# 프로젝트 오버뷰: demo-vibe

## 비전

온라인 쇼핑 플랫폼으로서, 인증 · 게시판 · 실시간 채팅 기능을 갖춘 이커머스 서비스를 구축한다.

## 목표

1. 안전한 회원 인증 시스템 구축 (JWT 기반)
2. 게시판 기능으로 상품 리뷰 및 커뮤니티 소통 지원
3. 실시간 채팅으로 구매자-판매자 간 즉시 소통 지원
4. 확장 가능한 모듈 아키텍처 설계

## 모듈 구조

```
demo-vibe/
├── Auth Module (인증)
│   ├── 회원가입 (이메일/소셜)
│   ├── 로그인/로그아웃
│   └── 토큰 관리 (JWT)
│
├── Board Module (게시판)
│   ├── 게시글 CRUD
│   ├── 댓글 시스템
│   └── 검색/필터링
│
└── Chat Module (채팅)
    ├── 채팅방 생성/관리
    ├── 실시간 메시지 (WebSocket)
    └── 메시지 이력 조회
```

## 기술 스택 결정 근거

| 영역 | 선택 | 이유 |
|------|------|------|
| Backend | **NestJS** | TypeScript 기반, 모듈 아키텍처, WebSocket 내장 지원 |
| Frontend | **Next.js 15** | App Router, SSR/SSG, Server Components로 성능 최적화 |
| Database | **MongoDB 7** | 유연한 스키마, 채팅 메시지 저장에 적합, Prisma 지원 |
| ORM | **Prisma** | Type-safe, MongoDB Adapter 지원, 마이그레이션 관리 |
| 실시간 통신 | **Socket.IO** | NestJS Gateway 통합, 재연결/룸 관리 내장 |

## 블루프린트 디렉토리 구조

개별 기능 블루프린트는 `docs/blueprints/` 아래 번호 디렉토리로 관리합니다:

```
docs/blueprints/
├── overview.md          ← 이 파일
├── 001-auth/
│   └── blueprint.md     ← 인증 모듈 설계
├── 002-board/
│   └── blueprint.md     ← 게시판 모듈 설계
└── 003-chat/
    └── blueprint.md     ← 채팅 모듈 설계
```

## 비기능 요구사항

| 항목 | 목표 |
|------|------|
| 응답 시간 | API p95 < 200ms |
| 동시 접속 | WebSocket 1,000 동시 연결 |
| 가용성 | 99.5% uptime |
| 보안 | OWASP Top 10 대응 |
