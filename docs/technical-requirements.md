# Technical Requirements

The authoritative technical requirements are in `benchmarks/prompts/shared/system.md` (stack, principles, what exists) and `benchmarks/prompts/shared/constraints.md` (hard constraints, naming, code style).

## Stack

TypeScript (strict), Next.js 16, Prisma 6, PostgreSQL 18, Zod 3, JWT-based role middleware.

## Local development

```bash
podman compose up   # start PostgreSQL 18
pnpm dev            # start Next.js dev server
```

Secrets are externalized from source control via `.env`.
