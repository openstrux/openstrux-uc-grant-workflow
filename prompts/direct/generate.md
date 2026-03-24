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
  src/domain/schemas/index.ts
  src/policies/index.ts        (barrel — may also add internal modules)
  src/lib/dal.ts
  src/server/services/submissionService.ts
  src/server/services/eligibilityService.ts
  src/app/api/intake/route.ts
  src/app/api/eligibility/route.ts
```

The migration SQL must match `schema.prisma` exactly. Use a timestamp prefix in the format `YYYYMMDDHHMMSS`.
