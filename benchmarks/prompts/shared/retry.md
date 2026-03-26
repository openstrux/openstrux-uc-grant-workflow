Tests are still failing ({{passed}}/{{total}} passing, attempt {{attempt}}/{{maxRetries}}).

## Failing tests

{{failures}}

## Instructions

Before outputting any code, reason briefly about each failure group:
- What is the root cause? (type mismatch, missing export, wrong logic, etc.)
- Which file(s) need to change and why?

Then output only the corrected files. Each file must be a fenced code block where the **first line inside the block** is a comment with the relative file path:

```typescript
// src/lib/dal.ts
export function verifySession() { ... }
```

```prisma
// prisma/schema.prisma
model Submission { ... }
```

Rules:
- Do NOT put the file path as a markdown header outside the block.
- Do NOT modify test files.
- Output complete file content for every file you change.
- If a failure spans multiple files, fix all of them.
