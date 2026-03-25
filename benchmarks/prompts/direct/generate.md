# Direct Path

Generate TypeScript files directly. No intermediate representation.

## Output

Write all generated files at their **natural in-tree paths** (not under any `output/` directory):

```
prisma/schema.prisma
prisma/seeds/seed.ts
src/domain/schemas/index.ts
src/policies/index.ts        (barrel — may also add internal modules)
src/lib/dal.ts
src/lib/prisma.ts            (Prisma singleton client)
src/server/services/submissionService.ts
src/server/services/eligibilityService.ts
src/app/api/intake/route.ts
src/app/api/eligibility/route.ts
```

Replace the stubs in place. Do not create migration SQL — run `prisma db push` or `prisma migrate dev` instead.
