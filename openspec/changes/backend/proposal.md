## Why

The grant workflow use case has a complete frontend and test suite but no backend implementation. Route handlers return 501 stubs, no service layer exists, and the database schema is unmigratable. This change implements the full backend so the benchmark can measure how well each generation path (direct TypeScript vs. openstrux) produces correct, spec-compliant code.

## What Changes

- `packages/policies/src` — implement `evaluateEligibility`, `createBlindedPacket`, `isValidTransition`, `getNextStatus` (barrel exports only)
- `src/server/services/submitProposal.ts` — implement proposal intake service (atomic write: Submission + ProposalVersion + BlindedPacket + AuditEvent)
- `src/server/services/runEligibilityCheck.ts` — implement eligibility check service (evaluate rules, persist EligibilityRecord, transition submission status)
- `src/app/api/intake/route.ts` — replace 501 stub with real handler calling `submitProposal`
- `src/app/api/eligibility/route.ts` — replace 501 stub with real handler calling `runEligibilityCheck`
- `prisma/schema.prisma` — add all missing models (Submission, ProposalVersion, BlindedPacket, EligibilityRecord, AuditEvent) with correct relations and cascade deletes
- `prisma/seed.ts` — seed DEV_USERS into the database

## Capabilities

### New Capabilities

- `eligibility-evaluation`: Pure policy functions for evaluating grant eligibility against a configurable active rule set; blinded packet creation stripping applicant identity
- `proposal-intake`: Atomic service that persists a new submission with proposal version, blinded packet, and audit event in a single transaction
- `workflow-state-machine`: Permitted status transitions and event-to-status mapping for the grant review workflow
- `generation-direct`: Constraints and acceptance criteria specific to the direct TypeScript generation path
- `generation-openstrux`: Constraints and acceptance criteria specific to the openstrux generation path (`.strux` files first, then `strux build`, then thin route wrappers)

### Modified Capabilities

- `grant-workflow-tests`: No requirement changes — tests are already written and passing against the stub layer; backend implementation must make the integration and e2e suites pass

## Impact

- `packages/policies/src` — new implementations (currently empty barrel)
- `src/server/services/` — two new service files
- `src/app/api/intake/route.ts`, `src/app/api/eligibility/route.ts` — replace stubs
- `prisma/schema.prisma` — new models; requires `prisma migrate dev`
- `prisma/seed.ts` — new seed script
- All integration and e2e tests currently fail (no DB schema, no service logic); this change makes them pass
