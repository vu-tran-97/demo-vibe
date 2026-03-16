# Project: demo-vibe

> E-commerce platform with authentication, bulletin board, and real-time chat features

## Architecture
- Backend: NestJS (TypeScript, Prisma ORM → MongoDB Adapter)
- Frontend: Next.js 15 (App Router, Server Components)
- Database: MongoDB 7

## Key Modules
- Auth: Signup, login/logout, token management (JWT)
- Board: Post CRUD, comments, search/filtering
- Chat: Real-time messaging, chat room management

## ASTRA Methodology

This project follows the **ASTRA (AI-augmented Sprint Through Rapid Assembly)** methodology.

### VIP Principles
| Principle | Core Idea | Tools |
|-----------|-----------|-------|
| **V**ibe-driven Development | Don't write code, convey intent | `feature-dev`, `frontend-design` |
| **I**nstant Feedback Loop | Shorten feedback cycles to hours | `chrome-devtools` MCP, `code-review` |
| **P**lugin-powered Quality | Quality is built into the code | `astra-methodology`, `security-guidance`, `hookify` |

### Sprint Cycle
- **1-week** sprints (small increments, fast feedback)
- AI parallelizes development + testing + review for agility

### Team Roles
| Role | Assigned | Key Activities |
|------|----------|----------------|
| **VA** (Vibe Architect) | 1 person (solo) | Sprint management, AI workflow design, architecture decisions, quality gate judgment, prompt writing |

## Development Workflow

```
[Feature Sprint]
Blueprint → DB Design → Sprint Plan → Implementation → Test Scenario → Test Run → PR/Review
                                                                                        ↓
                                  Main Branch Merge ← User Testing ← Staging Merge ←───┘
```

### Step-by-Step Reference
| Step | Reference Path | Tools |
|------|---------------|-------|
| Design System | `docs/design-system/` | `/frontend-design` |
| Blueprint | `docs/blueprints/{NNN}-{feature-name}/` | `/feature-dev` (no code changes yet) |
| DB Design | `docs/database/database-design.md` | `/feature-dev`, `/lookup-term` |
| Sprint Plan | `docs/sprints/sprint-N/prompt-map.md` | `/sprint-plan` |
| Implementation | `src/` | `/feature-dev` (based on blueprint + DB design) |
| Test Scenario | `docs/tests/test-cases/sprint-N/` | `/test-scenario` |
| Test Run | `docs/tests/test-reports/` | `/test-run` |
| PR/Review | - | `/pr-merge`, `/code-review` |

## Quality Gates

### Gate 1: WRITE-TIME (Auto-applied during code writing)
| Tool | Check | Behavior |
|------|-------|----------|
| `security-guidance` | 9 security patterns (eval, innerHTML, etc.) | PreToolUse hook, **blocks** |
| `astra-methodology` | Forbidden words + naming rules | PostToolUse hook, warning |
| `hookify` | Project-specific custom rules | PreToolUse/PostToolUse hooks |
| `coding-convention` skill | TypeScript convention | Auto-detected |
| `data-standard` skill | Public data standard terminology | Auto-detected for DB code |
| `code-standard` skill | ISO 3166-1/2, ITU-T E.164 | Auto-detected for phone/country/address |

### Gate 2: REVIEW-TIME (During PR/review)
| Tool | Check |
|------|-------|
| `feature-dev` (built-in code-reviewer) | Code quality/bugs/convention (3 parallel agents) |
| `/code-review` | CLAUDE.md compliance, bugs, history analysis (80+ score filter) |
| `blueprint-reviewer` agent | Design document quality/consistency |
| `test-coverage-analyzer` agent | Test strategy/coverage analysis |
| `convention-validator` agent | Coding convention validation |

### Gate 2.5: DESIGN-TIME (DSA design review)
| Review Item | Method |
|------------|--------|
| Design token compliance | `chrome-devtools` + `design-token-validator` agent |
| Component consistency | Screen-by-screen comparison |
| Responsive layout | `chrome-devtools` viewport switching |
| Basic accessibility | Color contrast, focus check |

### Gate 3: BRIDGE-TIME (Final quality gate at release)
- `quality-gate-runner` agent runs Gates 1~3 integrated
- Zero convention/naming violations, zero console errors required

### Quality Gate Pass Criteria Summary
| Gate | Pass Criteria | Action on Failure |
|------|--------------|-------------------|
| Gate 1 | 0 security-guidance warnings, 0 forbidden words | Fix immediately and rewrite |
| Gate 2 | 0 high-confidence issues, 70%+ coverage | Decide fix now / fix later |
| Gate 2.5 | DSA design review approved | Modify prompt → regenerate → re-review |
| Gate 3 | 0 convention/naming violations, 0 console errors | Batch fix before deploy |

## Coding Rules
- Auth middleware required on all API endpoints
- DB schema managed as Single Source of Truth (SSoT) in docs/database/database-design.md
- DB entities must follow public data standard terminology dictionary (`/lookup-term`)
- Collection name prefixes: TB_ (general), TC_ (code), TH_ (history), TL_ (log), TR_ (relation)
- REST API response format: `{ success: boolean, data: T, error?: string }`
- Error handling: Separate business exceptions from system exceptions
- Language-specific coding conventions auto-applied by `coding-convention` skill (TypeScript)
- Run `/check-convention src/` for manual convention check

### NestJS Rules
- `ExceptionFilter` for global exception handling
- `class-validator` for DTO validation
- Prisma ORM (MongoDB Adapter)
- Module-based architecture (Module → Controller → Service → Repository pattern)

### Next.js Rules
- App Router by default
- Server Components first
- Server Actions where applicable
- Functional components only, custom hook pattern

## Design Rules (Defined by DSA)
- Design tokens: Always reference docs/design-system/design-tokens.css
- Colors: CSS Variables (--color-*) required, no hardcoding
- Font sizes: Token scale (--font-size-*) required
- Spacing: Follow 8px grid system (--spacing-*)
- Responsive breakpoints: Mobile (~767px), Tablet (768~1023px), Desktop (1024px~)
- Visually verify tokens/components via design system preview page
- Auto-validated by `design-token-validator` agent (Gate 2.5)

## Prohibited Practices
- No console.log (use logger)
- No `any` type
- No raw queries (use Prisma ORM)
- No .env file commits

## Testing Rules
- Unit tests required for all service layers
- Minimum test coverage: 70%
- Test strategy: `docs/tests/test-strategy.md`
- Test cases: `docs/tests/test-cases/sprint-N/` (per sprint)
- Test reports: `docs/tests/test-reports/` (includes coverage stats)
- `/test-scenario` for auto-generating E2E scenarios, `/test-run` for Chrome MCP integration testing

## Commit Convention
- Conventional Commits (feat:, fix:, refactor:, docs:, test:)
- `/commit` — auto-generate commit message
- `/commit-push-pr` — commit + push + PR in one step
- `/pr-merge` — full cycle: commit → PR → review → fix → merge

## Design Document Rules
- Feature design docs organized as docs/blueprints/{NNN}-{feature-name}/ (e.g., 001-auth/, 002-board/)
- Main file in each blueprint directory is blueprint.md; related files (diagrams, API specs, etc.) in same directory
- DB design centrally managed in docs/database/database-design.md
- Design docs must be written and approved before implementation
- Blueprint workflow: Write blueprint → Approve → Reflect in DB design → Write sprint prompt map → Implement
- Design doc quality validated by `blueprint-reviewer` agent (Gate 2)

## Quick Command Reference

| Situation | Command |
|-----------|---------|
| Project initial setup | `/project-init` |
| Sprint 0 checklist | `/project-checklist` |
| Sprint initialization | `/sprint-plan [N]` |
| Feature design/implementation | `/feature-dev [description]` |
| Standard term lookup | `/lookup-term [term]` |
| International code lookup | `/lookup-code [code]` |
| DB entity generation | `/generate-entity [definition]` |
| E2E test scenario | `/test-scenario` |
| Integration test run | `/test-run` |
| Coding convention check | `/check-convention [target]` |
| DB naming check | `/check-naming [target]` |
| Commit | `/commit` |
| Commit + push + PR | `/commit-push-pr` |
| PR → review → merge automation | `/pr-merge` |
| Code review | `/code-review` |
| Hook rule creation | `/hookify [description]` |
| Quick reference guide | `/astra-guide` |

## Prompt Writing Guide

5 elements of a good prompt:

1. **What**: Clear description of the feature to build
2. **Why**: Business purpose and user value
3. **Constraint**: Technical constraints and performance requirements
4. **Reference**: Related design doc paths (docs/blueprints/{NNN}-{feature-name}/, docs/database/)
5. **Acceptance**: Completion criteria and verification method

    BAD: "Build a chat feature"

    GOOD:
    /feature-dev "Implement real-time chat module.
    - WebSocket-based real-time message send/receive
    - Chat room create/join/leave
    - Message history with pagination
    - Follow design in docs/blueprints/003-chat/blueprint.md
    - Reference DB schema in docs/database/database-design.md
    - Write both unit tests and integration tests"
