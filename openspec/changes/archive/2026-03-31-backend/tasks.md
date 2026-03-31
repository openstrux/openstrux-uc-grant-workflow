## 1. Prisma Schema and Seed

- [x] 1.1 Create `prisma/schema.prisma` with all models (User, Call, Submission, ProposalVersion, ApplicantIdentity, BlindedPacket, EligibilityRecord, AuditEvent), enums (ProposalStatus, Principal), relations, and cascade deletes
- [x] 1.2 Create `prisma/seeds/seed.ts` with dev fixtures (5 canonical users, default Call with all 6 enabledEligibilityChecks)

## 2. Prisma Client Singleton

- [x] 2.1 Create `src/lib/prisma.ts` with globalThis-cached PrismaClient singleton

## 3. Policy Functions

- [x] 3.1 Implement `evaluateEligibility` in `src/policies/index.ts` (pure, no DB)
- [x] 3.2 Implement `createBlindedPacket` — strip identity fields, preserve evaluable fields
- [x] 3.3 Implement `isValidTransition` — enforce permitted workflow transitions
- [x] 3.4 Implement `getNextStatus` — event-driven status derivation
- [x] 3.5 Implement `checkAccess` — role-based access policies per access-policies.md
- [x] 3.6 Export `MVP_DEFAULT_RULES` constant with all 6 checks

## 4. Service Layer

- [x] 4.1 Implement `submitProposal` in `src/server/services/submissionService.ts` — sequential writes: Submission → ProposalVersion → BlindedPacket → AuditEvent
- [x] 4.2 Implement `runEligibilityCheck` in `src/server/services/eligibilityService.ts` — evaluate rules, create EligibilityRecord, update Submission.status, create AuditEvent

## 5. Route Handlers

- [x] 5.1 Replace stub in `src/app/api/intake/route.ts` — full pipeline: verifySession → validate → submitProposal → 201
- [x] 5.2 Replace stub in `src/app/api/eligibility/route.ts` — full pipeline: verifySession → validate → runEligibilityCheck → 200

## 6. Verification

- [x] 6.1 Run `tsc --noEmit` — must exit 0
- [x] 6.2 Run `pnpm test:unit` — all unit tests pass
- [x] 6.3 Run `pnpm test:integration:mock` — all mock integration tests pass
