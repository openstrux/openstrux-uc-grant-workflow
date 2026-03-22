# Task Format

When implementing a phase, produce output in this format:

## File list

Start with a brief file list:
```
Files to create/modify:
- prisma/schema.prisma
- packages/domain/src/entities/Proposal.ts
- ...
```

## File contents

For each file, use a fenced code block with the file path as a comment on the first line:
```typescript
// prisma/schema.prisma
model Submission { ... }
```

## Verification

After completing all files, confirm:
- [ ] All entities from `specs/domain-model.md` are implemented
- [ ] Access policies from `specs/access-policies.md` are enforced
- [ ] `tsc --noEmit` would pass (no type errors)
- [ ] All referenced service interfaces from `app/web/` are satisfied

## Benchmark fields

When your implementation is complete, estimate:
- `generatedFileCount`: number of new files created
- `totalLines`: approximate total lines of generated code
- `llm`: the model you used
