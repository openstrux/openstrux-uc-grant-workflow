## Why

Pre-written tests define the acceptance criteria that both generation paths must satisfy. Writing tests before the backend ensures fair, symmetric comparison: both paths are tested against identical criteria, and neither path can "pass" by working around tests written after the fact.

## What Changes

- `tests/unit/` — unit tests for domain entities, policy modules, eligibility rules
- `tests/integration/` — integration tests for DB + service layer interactions
- All tests use vitest

## Status: ARCHIVED
