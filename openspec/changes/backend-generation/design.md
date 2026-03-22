## Architecture

The backend is a layered TypeScript application:

```
app/web/src/app/api/          Next.js route handlers (HTTP boundary)
  └── intake/route.ts         POST /api/intake
  └── eligibility/route.ts    POST /api/eligibility

app/web/src/server/
  auth/                       JWT extraction, role guards
  services/                   Service interface stubs (pre-built, not replaced)

packages/policies/src/
  eligibility/                Pure rule evaluation (no DB)
  access/                     Principal + resource + operation policy
  workflow/                   DB-touching service functions
    submitProposal.ts         Create submission + version + blinded packet + audit
    runEligibilityCheck.ts    Evaluate eligibility + update submission status + audit

packages/domain/src/
  schemas/                    Zod schemas matching specs/domain-model.md
  entities/                   TypeScript interfaces

prisma/
  schema.prisma               Database models matching domain model
```

## Key design decisions

**Identity separation at the DB level**: `ApplicantIdentity` is a separate Prisma model. The route handler that creates a submission stores identity separately and only returns a `submissionId`.

**BlindedPacket is created eagerly**: On submission, a blinded packet is created immediately (not lazily). The packet JSON strips all identity fields at the mapper level.

**Eligibility is pure + recorded**: `evaluateEligibility()` is a pure function (unit-testable). `runEligibilityCheck()` wraps it, persists the result, and transitions submission status.

**Audit events**: Both `submitProposal` and `runEligibilityCheck` write audit events inside Prisma transactions.

**Access middleware**: All admin routes require `admin` role in JWT. Reviewer routes (P3+) require `reviewer` role and submission assignment check.

## Output location

Write all files at their natural in-tree paths (`prisma/schema.prisma`, `packages/domain/src/schemas/index.ts`, etc.). Existing stubs are replaced in place.

For the Openstrux path: `strux build` emits compiled output to `.openstrux/build/`. The `@openstrux/build` path alias in `tsconfig.json` resolves those files at compile time.
