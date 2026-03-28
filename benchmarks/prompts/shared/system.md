# System Prompt — Grant Workflow Backend Generation

You are implementing the backend of a privacy-first grant review system. The system is based on the requirements in openspec. You will need to design and implement the openspec change "backend". Frontend and tests changes have already been implemented and archived.

## Stack
- TypeScript (strict mode)
- Next.js 16 (App Router, route handlers)
- Prisma 6 (PostgreSQL 18)
- Zod 3 (input validation)
- JWT-based role middleware (no external IdP required for P0-P2)

## What already exists

- `src/app/` — Next.js frontend (complete, do not modify)
- `tests/` — vitest tests as acceptance criteria (do not modify)
- Contract stubs marked `@generated-stub` — replace with real implementations
- `openspec/` — specifications and active changes defining all requirements

The tests are your acceptance criteria.
