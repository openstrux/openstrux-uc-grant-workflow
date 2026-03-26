# Task Format

When implementing a phase, produce output in this format:

## File list

Start with a brief file list:
```
Files to create/modify:
- prisma/schema.prisma
- src/domain/src/entities/Proposal.ts
- ...
```

## File contents

For each file, use a fenced code block where **the first line inside the block is a comment containing the relative file path**. The path comment must be the very first line — no blank lines before it.

TypeScript / JavaScript files:
```typescript
// src/lib/dal.ts
export function verifySession() { ... }
```

Prisma schema:
```prisma
// prisma/schema.prisma
model Submission { ... }
```

Do NOT put the file path as a markdown header outside the block (e.g. `**\`src/lib/dal.ts\`**`). The path must be inside the block as the first line comment, exactly as shown above. This is required for automated extraction.

## Verification

After completing all files, confirm:
- [ ] All entities from `openspec/specs/domain-model.md` are implemented
- [ ] Access policies from `openspec/specs/access-policies.md` are enforced
- [ ] `tsc --noEmit` would pass (no type errors)
- [ ] All referenced service interfaces from `` are satisfied

## Benchmark fields

When your implementation is complete, estimate:
- `generatedFileCount`: number of new files created
- `totalLines`: approximate total lines of generated code
- `llm`: the model you used
