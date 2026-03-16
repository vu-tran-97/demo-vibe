# Test Strategy

> Test strategy document for the demo-vibe project

## 1. Test Levels

| Level | Scope | Tool | Coverage Target |
|-------|-------|------|-----------------|
| Unit Tests | Service layer, utilities | Jest | 70% |
| Integration Tests | API endpoints, DB integration | Supertest + Jest | 100% of key APIs |
| E2E Tests | Full user scenario flows | Playwright / Chrome MCP | Critical scenarios |

## 2. Test Environments

| Environment | Purpose | DB |
|------------|---------|-----|
| Local | Unit/integration tests during development | MongoDB (Docker) |
| CI | Automated tests before PR merge | MongoDB (GitHub Actions) |
| Staging | E2E tests, user acceptance testing | MongoDB (Staging) |

## 3. Naming Conventions

### Test Files
```
{module}.{layer}.spec.ts
```
Examples: `auth.service.spec.ts`, `board.controller.spec.ts`

### Test Cases
```
describe('{Subject}', () => {
  it('should {expected behavior} when {condition}', () => {})
})
```

## 4. Test Case Management

- Managed per sprint: `docs/tests/test-cases/sprint-N/`
- Use `/test-scenario` command for auto-generating E2E scenarios
- Each scenario assigned a priority (P0~P2)

## 5. Test Reports

- Location: `docs/tests/test-reports/`
- Includes: Coverage achievement rate, failed test analysis, improvement items
- Use `/test-run` command for Chrome MCP integration test execution and report generation

## 6. Test Data Management

### Seeding
- Use a shared `test/fixtures/` directory for reusable seed data (JSON files)
- Each test module has its own seed function (e.g., `seedUsers()`, `seedPosts()`)
- Seed data is loaded in `beforeAll()` hooks

### Isolation
- Each integration test suite uses a dedicated MongoDB database (`demo_vibe_test_{suite}`)
- Unit tests use in-memory mocks — no real DB connection
- E2E tests use a dedicated staging database, reset before each run

### Cleanup
- `afterAll()` drops the test database after each integration suite
- No shared state between test files — each suite is self-contained
- CI pipeline creates a fresh MongoDB container per workflow run

### Sensitive Data
- No real user data in test fixtures — use faker/generated data only
- Passwords in fixtures are pre-hashed bcrypt strings
- API tokens in tests use dedicated test-only secrets from CI env vars

## 7. Automation Scope

| Item | Automation | Notes |
|------|-----------|-------|
| Unit test execution | CI auto | Required on PR |
| Integration test execution | CI auto | Required on PR |
| E2E tests | Manual trigger | At sprint end |
| Coverage report | CI auto | Fails if below 70% |
