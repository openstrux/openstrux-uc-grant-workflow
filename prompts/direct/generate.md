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
  packages/domain/src/...
  packages/policies/src/...
  app/web/src/app/api/...
  app/web/src/server/auth/...
```
