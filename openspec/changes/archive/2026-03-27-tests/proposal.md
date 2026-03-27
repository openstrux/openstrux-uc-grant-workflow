## Why

Pre-written tests define the acceptance criteria both generation paths must satisfy. Tests are written before the backend to ensure fair, symmetric comparison: neither path can "pass" by working around tests written after the fact. The initial test baseline has been expanded to cover the full frontend auth layer, all route handlers, access control, and the complete policy function set.

## What Changes

- `tests/unit/` — 14 contract test files covering: domain entity schemas, pure policy functions (`evaluateEligibility`, `createBlindedPacket`, `isValidTransition`, `getNextStatus`), blinded packet golden test, eligibility fixture-driven tests, access control, DAL session verification, all route handlers (intake, eligibility, auth, proposals, audit, benchmarks, proposal actions)
- `tests/integration-mock/` — mock-based integration suite using `vitest-mock-extended`; covers `submitProposal` and `runEligibilityCheck` against mocked Prisma (no DB required)
- `tests/integration/` — real-DB integration suite covering `submitProposal` and `runEligibilityCheck` with Prisma and `DATABASE_URL`
- `tests/e2e/` — end-to-end HTTP suite covering intake-to-eligibility workflow and auth + dashboard workflow
- All tests import only from contract surfaces (domain schemas barrel, policies barrel, service interfaces, DAL)
- All tests use vitest

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `grant-workflow-tests`: Expanded from 5 unit test files covering schemas and policies to 14 unit test files also covering all route handlers, access control, DAL, and fixture-driven eligibility tests; e2e suite extended with `authAndWorkflow.test.ts`

## Impact

- `tests/unit/` — 14 files (was ~5)
- `tests/integration-mock/` — 2 files (unchanged count, content updated)
- `tests/integration/` — 2 files (unchanged count)
- `tests/e2e/` — 2 files (was 1)
- Test runner config (`vitest.config.ts`) — unchanged
- No production code changes
