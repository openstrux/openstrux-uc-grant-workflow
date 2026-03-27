## Context

The repository ships with a complete frontend (session auth, Tailwind UI, 5 dashboards), a typed contract-stub layer, and a full test suite. The tests import exclusively from the contract surfaces — internal implementation structure is unconstrained. The backend must be generated to make those tests pass.

The spec is the source of truth for all generated code: read `openspec/specs/` before generating any file.

## Goals / Non-Goals

**Goals:**
- Implement all contract stubs so `tsc --noEmit`, unit, integration-mock, and integration tests all pass
- Use `openspec/specs/mvp-profile.md` as the authoritative list of enabled eligibility checks (6 checks, including `firstTimeApplicantInProgramme`)
- Update test baseline files to reflect the 6-check rule set before or alongside generation

**Non-Goals:**
- Modifying the frontend, shared components, or auth layer (already implemented)
- Running `prisma migrate dev` or `prisma db push` — the benchmark runner applies the schema
- Adding P3–P6 route logic (stubs returning 501 are correct)

## Decisions

**Contract-first, stubs replaced in place.** All generated files are written at their natural in-tree paths. Existing `@generated-stub` files are replaced wholesale.

**Single policy barrel.** `src/policies/index.ts` exports all pure functions. `packages/policies/src/index.ts` is a re-export barrel only — this satisfies both test import paths without duplication.

**`MVP_DEFAULT_RULES` must include all 6 checks.** `eligibilityService.ts` falls back to these defaults when the DB call lookup fails. The list must match `openspec/specs/mvp-profile.md §Enabled eligibility checks`, currently: `submittedInEnglish`, `alignedWithCall`, `primaryObjectiveIsRd`, `meetsEuropeanDimension`, `requestedBudgetKEur`, `firstTimeApplicantInProgramme`.

**Seed uses placeholder password hash.** The login route uses hardcoded `DEV_USERS` (not the DB). Do not import `bcrypt` in the seed — it's never called against the seeded hash.

**Cascade deletes required.** Integration tests clean up via `prisma.submission.deleteMany()`. All child models (`ProposalVersion`, `ApplicantIdentity`, `BlindedPacket`, `EligibilityRecord`, `AuditEvent`) must use `onDelete: Cascade` on their `Submission` relation.

**Prisma `Json` fields need a cast.** Write `as unknown as Prisma.InputJsonValue` — not `as any` — for `payload`, `content`, and `inputs` columns.

## Risks / Trade-offs

**`tsc --noEmit` scope.** The `tests/` directory has intentional type errors excluded from `tsconfig.json`. Run the check at the project root; do not modify test files to fix type errors in generated source.

**DAL is already implemented.** `src/lib/dal.ts` reads the `session` JWT cookie via `src/lib/session.ts`. Do not revert to `X-Role`/`X-User-Id` header auth.
