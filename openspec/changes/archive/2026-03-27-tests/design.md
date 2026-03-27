## Context

Tests are written before the backend is implemented. They define the acceptance criteria both generation paths must satisfy and import exclusively from contract surfaces — domain schemas, the policies barrel, and service interfaces. Internal implementation details are never imported.

Four test suites: unit (pure functions, schemas, route handlers), integration-mock (service layer with `vitest-mock-extended`, no DB), integration (real DB), and e2e (live app over HTTP).

## Goals / Non-Goals

**Goals:**
- Define acceptance criteria for P0–P2 via runnable tests
- Import only from contract surfaces so tests are implementation-agnostic
- Cover all route handlers, access control, DAL, and policy functions at unit level
- Provide mock-based integration suite that runs without a database
- Provide real-DB integration suite and e2e suite for full verification

**Non-Goals:**
- Testing frontend UI components
- Testing internal implementation details within packages
- Performance or load testing

## Decisions

**Contract-surface-only imports**: Tests import from `src/domain/schemas`, `packages/policies/src` (barrel), `src/server/services/*`, `src/lib/dal`, and `src/app/api/*/route`. No imports from internal modules. Rationale: tests remain valid regardless of internal structure.

**Four-tier test structure**:
- `tests/unit/` — pure functions, schema tests, route handler unit tests; no real I/O
- `tests/integration-mock/` — service-layer scenarios with `vitest-mock-extended`; no DB required
- `tests/integration/` — service-layer tests with real Prisma + PostgreSQL
- `tests/e2e/` — HTTP tests against a running app instance

**Route handler unit tests use mocked services**: Route tests in `tests/unit/` mock the service layer and `verifySession` to test auth checks, input validation, and response shapes in isolation.

**Vitest throughout**: Single runner, consistent config, native TypeScript support.

**Test isolation**: Integration tests clean up by deleting rows with a `test-` alias prefix in `beforeAll`/`afterAll`. E2e tests depend on `APP_URL` (defaults to `localhost:3000`) and fail fast with a clear error if unreachable.

**Fixture-driven eligibility tests**: `tests/unit/eligibilityFixtures.test.ts` drives `evaluateEligibility` against JSON fixtures in `tests/fixtures/eligibility/`. Adding a new fixture automatically adds a test case — no code change required.

## Risks / Trade-offs

**Mock drift**: `integration-mock` mocks must stay consistent with real DB behaviour. Mitigation: real integration suite is the authoritative gate; mock suite is a fast-iteration convenience.

**E2e brittleness**: E2e tests require both a running database and a running app. Mitigation: fail-fast in `beforeAll` with a clear error message.

## Open Questions

None — implementation is complete.
