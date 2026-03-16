# 테스트 전략

> demo-vibe 프로젝트의 테스트 전략 문서

## 1. 테스트 레벨

| 레벨 | 범위 | 도구 | 커버리지 목표 |
|------|------|------|-------------|
| 단위 테스트 | 서비스 레이어, 유틸리티 | Jest | 70% |
| 통합 테스트 | API 엔드포인트, DB 연동 | Supertest + Jest | 주요 API 100% |
| E2E 테스트 | 사용자 시나리오 전체 흐름 | Playwright / Chrome MCP | 핵심 시나리오 |

## 2. 테스트 환경

| 환경 | 용도 | DB |
|------|------|-----|
| Local | 개발 중 단위/통합 테스트 | MongoDB (Docker) |
| CI | PR 병합 전 자동 테스트 | MongoDB (GitHub Actions) |
| Staging | E2E 테스트, 사용자 테스트 | MongoDB (Staging) |

## 3. 네이밍 규칙

### 테스트 파일
```
{module}.{layer}.spec.ts
```
예시: `auth.service.spec.ts`, `board.controller.spec.ts`

### 테스트 케이스
```
describe('{대상}', () => {
  it('should {기대 동작} when {조건}', () => {})
})
```

## 4. 테스트 케이스 관리

- 스프린트별 관리: `docs/tests/test-cases/sprint-N/`
- `/test-scenario` 명령으로 E2E 시나리오 자동 생성
- 각 시나리오에 우선순위(P0~P2) 부여

## 5. 테스트 보고서

- 위치: `docs/tests/test-reports/`
- 포함 항목: 커버리지 달성률, 실패 테스트 분석, 개선 사항
- `/test-run` 명령으로 Chrome MCP 통합 테스트 실행 및 보고서 생성

## 6. 자동화 범위

| 항목 | 자동화 | 비고 |
|------|--------|------|
| 단위 테스트 실행 | CI 자동 | PR 시 필수 |
| 통합 테스트 실행 | CI 자동 | PR 시 필수 |
| E2E 테스트 | 수동 트리거 | 스프린트 종료 시 |
| 커버리지 리포트 | CI 자동 | 70% 미달 시 실패 |
