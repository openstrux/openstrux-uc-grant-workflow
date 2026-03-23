## Why

Pre-written tests define the acceptance criteria that both generation paths must satisfy. Writing tests before the backend ensures fair, symmetric comparison: both paths are tested against identical criteria, and neither path can "pass" by working around tests written after the fact.

## What Changes

- `tests/unit/` — contract tests: domain Zod schemas, pure policy functions (from barrel), golden tests
- `tests/integration/` — contract tests: service-layer functions with DB verification
- `tests/e2e/` — end-to-end HTTP tests against running app
- All tests import only from contract surfaces (domain schemas, policies barrel, service interfaces)
- All tests use vitest

## Status: ARCHIVED
