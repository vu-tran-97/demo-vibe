# Project: demo-vibe

> 온라인 쇼핑 플랫폼 — 인증, 게시판, 실시간 채팅 기능을 갖춘 이커머스 플랫폼

## Architecture
- Backend: NestJS (TypeScript, Prisma ORM → MongoDB Adapter)
- Frontend: Next.js 15 (App Router, Server Components)
- Database: MongoDB 7

## Key Modules
- 인증 (Auth): 회원가입, 로그인/로그아웃, 토큰 관리
- 게시판 (Board): 게시글 CRUD, 댓글, 검색
- 채팅 (Chat): 실시간 채팅, 채팅방 관리

## ASTRA Methodology

이 프로젝트는 **ASTRA (AI-augmented Sprint Through Rapid Assembly)** 방법론을 따릅니다.

### VIP 원칙
| 원칙 | 핵심 | 실현 도구 |
|------|------|----------|
| **V**ibe-driven Development | 코드를 작성하지 말고, 의도를 전달하라 | `feature-dev`, `frontend-design` |
| **I**nstant Feedback Loop | 피드백 주기를 시간 단위로 단축 | `chrome-devtools` MCP, `code-review` |
| **P**lugin-powered Quality | 품질은 코드에 내장되는 것이다 | `astra-methodology`, `security-guidance`, `hookify` |

### 스프린트 주기
- **1주 단위** 스프린트 (소규모 증분, 빠른 피드백)
- AI가 개발+테스트+리뷰를 병렬 처리하여 짧은 주기로 민첩성 향상

### 팀 역할
| 역할 | 담당 | 주요 활동 |
|------|------|----------|
| **VA** (Vibe Architect) | 1명 (솔로) | 스프린트 관리, AI 워크플로우 설계, 아키텍처 의사결정, 품질 게이트 판단, 프롬프트 작성 |

## Development Workflow

```
[기능 스프린트]
블루프린트 작성 → DB 설계 → 스프린트 작성 → 구현 → 테스트 시나리오 → 테스트 실행 → PR/리뷰
                                                                                          ↓
                                    메인 브랜치 머지 ← 사용자 테스트 ← 스테이징 머지 ←──────┘
```

### 단계별 참조 문서
| 단계 | 참조 경로 | 주요 도구 |
|------|----------|----------|
| 디자인 시스템 | `docs/design-system/` | `/frontend-design` |
| 블루프린트 작성 | `docs/blueprints/{NNN}-{feature-name}/` | `/feature-dev` (아직 코드는 수정하지 마) |
| DB 설계 | `docs/database/database-design.md` | `/feature-dev`, `/lookup-term` |
| 스프린트 계획 | `docs/sprints/sprint-N/prompt-map.md` | `/sprint-plan` |
| 구현 | `src/` | `/feature-dev` (블루프린트+DB 설계 기반) |
| 테스트 시나리오 | `docs/tests/test-cases/sprint-N/` | `/test-scenario` |
| 테스트 실행 | `docs/tests/test-reports/` | `/test-run` |
| PR/리뷰 | - | `/pr-merge`, `/code-review` |

## Quality Gates

### Gate 1: WRITE-TIME (자동 적용 — 코드 작성 시)
| 도구 | 검사 내용 | 동작 |
|------|----------|------|
| `security-guidance` | 9개 보안 패턴 (eval, innerHTML 등) | PreToolUse 훅, **차단** |
| `astra-methodology` | 금칙어 + 네이밍 규칙 | PostToolUse 훅, 경고 |
| `hookify` | 프로젝트별 커스텀 규칙 | PreToolUse/PostToolUse 훅 |
| `coding-convention` 스킬 | TypeScript 컨벤션 | 자동 감지 적용 |
| `data-standard` 스킬 | 공공 데이터 표준 용어 사전 | DB 코드 시 자동 감지 |
| `code-standard` 스킬 | ISO 3166-1/2, ITU-T E.164 | 전화번호/국가/주소 시 자동 감지 |

### Gate 2: REVIEW-TIME (PR/리뷰 시)
| 도구 | 검사 내용 |
|------|----------|
| `feature-dev` (내장 code-reviewer) | 코드 품질/버그/컨벤션 (3개 병렬 에이전트) |
| `/code-review` | CLAUDE.md 준수, 버그, 이력 분석 (80점+ 필터링) |
| `blueprint-reviewer` 에이전트 | 설계 문서 품질/일관성 검증 |
| `test-coverage-analyzer` 에이전트 | 테스트 전략/커버리지 분석 |
| `convention-validator` 에이전트 | 코딩 컨벤션 검증 |

### Gate 2.5: DESIGN-TIME (DSA 디자인 검수)
| 검수 항목 | 확인 방법 |
|----------|----------|
| 디자인 토큰 준수 | `chrome-devtools` + `design-token-validator` 에이전트 |
| 컴포넌트 일관성 | 화면별 비교 |
| 반응형 레이아웃 | `chrome-devtools` 뷰포트 전환 |
| 접근성 기본 확인 | 컬러 대비, 포커스 확인 |

### Gate 3: BRIDGE-TIME (릴리스 시 최종 품질 게이트)
- `quality-gate-runner` 에이전트가 Gate 1~3 통합 실행
- convention/naming 위반 0건, 콘솔 에러 0건 필수

### 품질 게이트 통과 기준 요약
| 게이트 | 통과 기준 | 차단 시 조치 |
|--------|----------|-------------|
| Gate 1 | security-guidance 경고 0건, 금칙어 0건 | 즉시 수정 후 재작성 |
| Gate 2 | code-review 고신뢰 이슈 0건, 커버리지 70%+ | fix now / fix later 결정 |
| Gate 2.5 | DSA 디자인 검수 승인 | 프롬프트 수정 → 재생성 → 재검수 |
| Gate 3 | convention/naming 위반 0건, 콘솔 에러 0건 | 일괄 수정 후 배포 |

## Coding Rules
- 모든 API 엔드포인트에 인증 미들웨어 필수
- DB 스키마는 docs/database/database-design.md를 단일 진실 원천(SSoT)으로 관리
- DB 엔티티는 공공 데이터 표준 용어 사전을 준수할 것 (`/lookup-term` 활용)
- 컬렉션명 접두사: TB_ (일반), TC_ (코드), TH_ (이력), TL_ (로그), TR_ (관계)
- REST API 응답 형식: `{ success: boolean, data: T, error?: string }`
- 에러 처리: 비즈니스 예외와 시스템 예외를 구분할 것
- 언어별 코딩 컨벤션은 `coding-convention` 스킬이 자동 적용 (TypeScript)
- `/check-convention src/` 으로 컨벤션 준수 여부를 수동 검사 가능

### NestJS 규칙
- `ExceptionFilter` 전역 예외 처리
- `class-validator` DTO 검증
- Prisma ORM (MongoDB Adapter)
- 모듈 기반 아키텍처 (Module → Controller → Service → Repository 패턴)

### Next.js 규칙
- App Router 기본
- Server Components 우선
- Server Actions 활용
- 함수형 컴포넌트만 사용, 커스텀 훅 패턴

## Design Rules (DSA 정의)
- 디자인 토큰: docs/design-system/design-tokens.css를 반드시 참조할 것
- 컬러는 CSS Variables (--color-*) 사용 필수, 하드코딩 금지
- 폰트 크기는 토큰 스케일 (--font-size-*) 사용 필수
- 스페이싱은 8px 그리드 시스템 (--spacing-*) 준수
- 반응형 브레이크포인트: 모바일(~767px), 태블릿(768~1023px), 데스크톱(1024px~)
- 디자인 시스템 프리뷰 페이지로 토큰/컴포넌트를 시각적으로 검증
- `design-token-validator` 에이전트로 자동 검증 (Gate 2.5)

## Prohibited Practices
- console.log 금지 (logger 사용)
- any 타입 금지
- 직접 쿼리 금지 (Prisma ORM 사용)
- .env 파일 커밋 금지

## Testing Rules
- 모든 서비스 레이어에 단위 테스트 작성
- 최소 테스트 커버리지 70%
- 테스트 전략: `docs/tests/test-strategy.md`
- 테스트 케이스: `docs/tests/test-cases/sprint-N/` (스프린트별 관리)
- 테스트 보고서: `docs/tests/test-reports/` (커버리지 달성률 포함)
- `/test-scenario`로 E2E 시나리오 자동 생성, `/test-run`으로 Chrome MCP 통합 테스트

## Commit Convention
- Conventional Commits (feat:, fix:, refactor:, docs:, test:)
- `/commit` — 자동 커밋 메시지 생성
- `/commit-push-pr` — 커밋+푸시+PR 일괄 생성
- `/pr-merge` — 커밋→PR→리뷰→수정→머지 전체 사이클

## Design Document Rules
- 기능별 설계 문서는 docs/blueprints/{NNN}-{feature-name}/ 디렉토리로 구성 (예: 001-auth/, 002-board/)
- 각 블루프린트 디렉토리의 메인 파일은 blueprint.md, 관련 보조 파일(다이어그램, API 스펙 등)도 같은 디렉토리에 배치
- DB 설계는 docs/database/database-design.md에서 중앙 관리
- 설계 문서는 기능 구현 전에 반드시 작성 및 승인 완료
- 블루프린트 기반 워크플로우: 블루프린트 작성 → 승인 → DB 설계 반영 → 스프린트 프롬프트 맵 작성 → 구현
- 설계 문서 품질은 `blueprint-reviewer` 에이전트가 검증 (Gate 2)

## Quick Command Reference

| 상황 | 커맨드 |
|------|--------|
| 프로젝트 초기 셋업 | `/project-init` |
| Sprint 0 체크리스트 | `/project-checklist` |
| 스프린트 초기화 | `/sprint-plan [N]` |
| 기능 설계/구현 | `/feature-dev [설명]` |
| 표준 용어 확인 | `/lookup-term [한글 용어]` |
| 국제 코드 조회 | `/lookup-code [코드]` |
| DB 엔티티 생성 | `/generate-entity [한글 정의]` |
| E2E 테스트 시나리오 | `/test-scenario` |
| 통합 테스트 실행 | `/test-run` |
| 코딩 컨벤션 검사 | `/check-convention [대상]` |
| DB 네이밍 검사 | `/check-naming [대상]` |
| 커밋 | `/commit` |
| 커밋+푸시+PR 일괄 | `/commit-push-pr` |
| PR→리뷰→머지 자동화 | `/pr-merge` |
| 코드 리뷰 | `/code-review` |
| 훅 규칙 생성 | `/hookify [설명]` |
| 빠른 참조 가이드 | `/astra-guide` |

## Prompt Writing Guide

좋은 프롬프트의 5요소:

1. **What** (무엇을): 만들어야 할 기능의 명확한 설명
2. **Why** (왜): 비즈니스 목적과 사용자 가치
3. **Constraint** (제약): 기술적 제약사항과 성능 요구사항
4. **Reference** (참조): 관련 설계 문서 경로 (docs/blueprints/{NNN}-{feature-name}/, docs/database/)
5. **Acceptance** (기준): 완료 조건과 검증 방법

    BAD: "채팅 기능을 만들어줘"

    GOOD:
    /feature-dev "실시간 채팅 모듈을 구현해줘.
    - WebSocket 기반 실시간 메시지 송수신
    - 채팅방 생성/참여/퇴장
    - 메시지 이력 조회 (페이지네이션)
    - docs/blueprints/003-chat/blueprint.md의 설계를 따를 것
    - DB 스키마는 docs/database/database-design.md를 참조할 것
    - 단위 테스트와 통합 테스트를 모두 작성할 것"
