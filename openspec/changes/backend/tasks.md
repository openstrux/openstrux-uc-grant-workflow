# Tasks: Backend Implementation (Direct TypeScript Path)

## Checklist

### Phase 1 — Prisma schema & seed

- [x] Create `prisma/schema.prisma` with models: `User`, `Call`, `Submission`, `ProposalVersion`, `ApplicantIdentity`, `BlindedPacket`, `EligibilityRecord`, `AuditEvent`
- [x] Create `prisma/seeds/seed.ts` — upsert 5 DEV_USERS and default Call record (all 6 eligibility checks)

### Phase 2 — Infrastructure

- [x] Create `src/lib/prisma.ts` — singleton `PrismaClient` export

### Phase 3 — Domain schemas

- [x] Remove `@generated-stub` marker from `src/domain/schemas/index.ts` (schemas are already correct)

### Phase 4 — Pure policy functions (`src/policies/index.ts`)

- [x] Implement `evaluateEligibility(inputs, activeRules)` — evaluate 6 rules, return `{ status, failureReasons, inputs, activeRules }`
- [x] Export `MVP_DEFAULT_RULES` constant (all 6 checks)
- [x] Implement `createBlindedPacket(proposalVersion, applicantIdentity)` — return `{ proposalVersionId, content }` with identity stripped
- [x] Implement `isValidTransition(from, to)` — 4 allowed transitions only
- [x] Implement `getNextStatus(currentStatus, event)` — eligibility_pass/fail events
- [x] Implement `checkAccess(principal, resource, action, context?)` — 5 policy rules in priority order

### Phase 5 — Service layer

- [x] Implement `submitProposal` in `src/server/services/submissionService.ts`
  - Creates `Submission` (status: "submitted")
  - Creates `ProposalVersion` (versionNumber: 1, isEffective: true)
  - Optionally creates `ApplicantIdentity` if identity fields provided
  - Creates `BlindedPacket` via `createBlindedPacket`
  - Creates `AuditEvent` (eventType: "submission.created", targetType: "Submission")
  - Returns `{ submissionId, status }`
- [x] Implement `runEligibilityCheck` in `src/server/services/eligibilityService.ts`
  - Looks up `Call` to derive `activeRules` (falls back to `MVP_DEFAULT_RULES`)
  - Calls `evaluateEligibility`
  - Creates `EligibilityRecord`
  - Updates `Submission.status` via `getNextStatus`
  - Creates `AuditEvent` (eventType: "eligibility.checked", targetType: "Submission")
  - Returns `{ status, failureReasons }`

### Phase 6 — Route handlers

- [x] Replace 501 stub in `src/app/api/intake/route.ts` — call `submitProposal`, return 201
- [x] Replace 501 stub in `src/app/api/eligibility/route.ts` — call `runEligibilityCheck`, return 200

### Phase 7 — Verification

- [x] Run `pnpm tsc --noEmit` — must exit 0
- [x] Run `pnpm test:unit` — all unit tests pass (180/180)
- [x] Run `pnpm test:integration:mock` — all mock integration tests pass (7/7)
