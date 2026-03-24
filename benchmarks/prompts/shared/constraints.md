# Generation Constraints

## Hard constraints

- Never merge `ApplicantIdentity` data into a response object meant for reviewers.
- Every route handler must call `verifySession(req)` and return 401/403 before performing any DB operation.
- Eligibility check results must record exact input values and the active rule set at evaluation time.
- All state transitions must produce an `AuditEvent`.
- Generated TypeScript must use strict mode (`"strict": true` in tsconfig).

## Naming conventions

- Types: PascalCase, match `specs/domain-model.md` entity names exactly.
- DB tables: snake_case, match entity names (e.g., `applicant_identity`, `proposal_version`).
- Service functions: camelCase verbs (e.g., `submitProposal`, `evaluateEligibility`).
- Route files: Next.js App Router convention (`app/api/<resource>/route.ts`).

## Code style

- No `any` types.
- Use `zod` for all external input validation.
- Prisma transactions for operations that touch multiple models.
- No raw SQL unless Prisma is insufficient.

## What to skip

- P3-P6 features (review scoring, clarification, validation, audit export) — stub with `501 Not Implemented` if needed.
- UI components — the frontend is pre-built.
- External IdP integration — use role middleware with dev-mode `X-Role` header for testing.
- The `benchmarks/` directory — it contains benchmark tooling and run artefacts, not application code. Do not read or modify anything under `benchmarks/`.
