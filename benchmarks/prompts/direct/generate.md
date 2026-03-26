# Direct Path

Generate TypeScript files directly. No intermediate representation.

## Output

Write all generated files at their **natural in-tree paths** (not under any `output/` directory):

```
prisma/schema.prisma
prisma/seeds/seed.ts
src/domain/schemas/index.ts
src/policies/index.ts        (primary — put all implementations here)
packages/policies/src/index.ts  (re-export barrel — must re-export everything from src/policies/index.ts)
src/lib/dal.ts
src/lib/prisma.ts            (Prisma singleton client)
src/server/services/submissionService.ts
src/server/services/eligibilityService.ts
src/app/api/intake/route.ts
src/app/api/eligibility/route.ts
```

**Dual policy path:** some tests import from `../../src/policies` and others from `packages/policies/src`. Put the real implementations in `src/policies/index.ts` and make `packages/policies/src/index.ts` a re-export barrel:

```typescript
// packages/policies/src/index.ts
export * from "../../../src/policies/index";
```

Replace the stubs in place. Do not run `prisma db push` or `prisma migrate dev` — the benchmark runner applies the schema after generation.
