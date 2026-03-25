## Context

Tests are written before the backend is implemented. Pre-written tests define the acceptance criteria both generation paths must satisfy, and they import exclusively from contract surfaces — domain schemas, the policies barrel, and service interfaces. Internal implementation details are never imported.

There are three test suites: unit, integration (real DB), and end-to-end (live app). An additional `integration-mock` suite provides the same integration coverage without a database, using `vitest-mock-extended`.

## Goals / Non-Goals

**Goals:**
- Define acceptance criteria for P0–P2 via runnable tests
- Import only from contract surfaces so tests are implementation-agnostic
- Provide a mock-based integration suite that runs without a database (for fast CI)
- Provide a real-DB integration suite and an e2e suite for full verification

**Non-Goals:**
- Testing frontend UI components
- Testing internal implementation details within packages
- Performance or load testing

## Decisions

**Contract-surface-only imports**: Tests import from `src/domain/schemas`, `packages/policies/src` (barrel), `src/server/services/*`, and `src/lib/dal`. No imports from internal modules. Rationale: tests remain valid regardless of how the backend is structured internally.

**Three-tier test structure**:
- `tests/unit/` — pure function and schema tests, no I/O
- `tests/integration/` — service-layer tests with real Prisma + PostgreSQL
- `tests/e2e/` — HTTP tests against a running app instance
- `tests/integration-mock/` — same scenarios as integration but with `vitest-mock-extended` mocks; no DB required

**Vitest throughout**: All suites use vitest. Rationale: single test runner, consistent config, native TypeScript support.

**Test isolation**: Integration tests clean up by deleting rows with a `test-` alias prefix in `beforeAll`/`afterAll`. E2e tests depend on the app being available at `APP_URL` (defaults to `localhost:3000`).

## Risks / Trade-offs

**Mock drift**: `integration-mock` mocks must stay consistent with real DB behaviour. Mitigation: the real integration suite is the authoritative gate; mock suite is a convenience for fast iteration.

**E2e brittleness**: E2e tests require both a running database and a running app. Mitigation: tests fail fast with a clear error if the app is not reachable.

## Migration Plan

No migration needed. Tests are greenfield and run against the stub baseline until backend implementation is applied.

## Open Questions

None — implementation is complete.
