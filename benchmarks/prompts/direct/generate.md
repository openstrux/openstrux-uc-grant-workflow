# Direct Path

Generate TypeScript files directly. No intermediate representation — all files are hand-written.

## Prisma schema and seed (new files — `prisma/` does not exist yet)

The `prisma/` directory does not exist in the worktree — you must create it:

- **`prisma/schema.prisma`** — create the full schema with models matching `openspec/specs/domain-model.md` entity names (snake_case tables, PascalCase models). Include all fields, relationships, enums, indexes, and defaults.
- **`prisma/seeds/seed.ts`** — create the seed script with dev fixtures. Consult `openspec/specs/access-policies.md` for canonical user records and `openspec/specs/domain-model.md` for the default Call record.

## Remaining files (contract stubs exist — replace `@generated-stub` markers)

The rest of the output files already exist as contract stubs marked `@generated-stub`. Replace each stub with a real implementation:

- **Zod schemas** (`src/domain/schemas/index.ts`)
- **Policy functions** (`src/policies/index.ts`) — all business logic; `packages/policies/src/index.ts` is a re-export barrel only
- **Service layer** (`src/server/services/submissionService.ts`, `eligibilityService.ts`)
- **DAL** (`src/lib/dal.ts`) — `verifySession`
- **Route handlers** (`src/app/api/intake/route.ts`, `src/app/api/eligibility/route.ts`) — full request pipeline inline (session → validate → service → response)
- **Prisma client** (`src/lib/prisma.ts`)
