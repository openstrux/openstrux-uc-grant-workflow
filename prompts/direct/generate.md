# Direct Path

Generate TypeScript files directly. No intermediate representation.

## How to use

Include in this order:
1. `prompts/shared/system.md`
2. `prompts/shared/constraints.md`
3. `prompts/shared/generate.md`
4. **this file**
5. `prompts/shared/task-format.md`

## Output

Write all generated files to `output/direct/`, mirroring the repository tree:
```
output/direct/
  prisma/schema.prisma
  prisma/migrations/<timestamp>_init/migration.sql   (initial migration SQL)
  prisma/seeds/seed.ts
  packages/domain/src/schemas/index.ts
  packages/policies/src/index.ts        (barrel — may also add internal modules)
  app/web/src/lib/dal.ts
  app/web/src/server/services/submissionService.ts
  app/web/src/server/services/eligibilityService.ts
  app/web/src/app/api/intake/route.ts
  app/web/src/app/api/eligibility/route.ts
```

The migration SQL must match `schema.prisma` exactly. Use a timestamp prefix in the format `YYYYMMDDHHMMSS`.
