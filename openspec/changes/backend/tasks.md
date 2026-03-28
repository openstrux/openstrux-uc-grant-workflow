# Backend Tasks

- [ ] Create `prisma/schema.prisma` with all P0-P2 models
- [ ] Create `prisma/seeds/seed.ts` with dev fixtures (5 users + default Call)
- [ ] Remove `@generated-stub` from `src/domain/schemas/index.ts`
- [ ] Implement `src/policies/index.ts` (evaluateEligibility, createBlindedPacket, isValidTransition, getNextStatus, checkAccess)
- [ ] Remove `@generated-stub` from `packages/policies/src/index.ts`
- [ ] Create `src/lib/prisma.ts` (PrismaClient singleton)
- [ ] Implement `src/server/services/submissionService.ts` (submitProposal, listSubmissions, getSubmission)
- [ ] Implement `src/server/services/eligibilityService.ts` (runEligibilityCheck)
- [ ] Implement `src/app/api/intake/route.ts` (replace 501 stub)
- [ ] Implement `src/app/api/eligibility/route.ts` (replace 501 stub)
- [ ] Run `pnpm test:unit` — verify passes
- [ ] Run `pnpm test:integration:mock` — verify passes
- [ ] Run `tsc --noEmit` — verify exits 0
