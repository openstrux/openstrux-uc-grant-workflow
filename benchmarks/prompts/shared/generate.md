# Generate Backend — Common Instructions

## Change to apply

You are applying the `backend` change. Read these files before generating any code:
- `openspec/changes/backend/design.md` — contract surfaces and output location
- `openspec/changes/backend/tasks.md` — authoritative task checklist with contract surfaces table

## Testing constraints

The integration tests (`tests/integration/`) clean up test data by calling `prisma.submission.deleteMany(...)`. For this to succeed, all Prisma child models that reference `Submission` must use `onDelete: Cascade` in `prisma/schema.prisma`. Missing cascades cause a foreign key violation in `afterAll` even when all tests pass, producing a false exit code 1.

## Specifications (source of truth)

Read these files — they define what to build:
- `openspec/specs/domain-model.md` — entities, fields, relationships
- `openspec/specs/workflow-states.md` — state machine, access rules per state
- `openspec/specs/access-policies.md` — principals, policies, enforcement points
- `openspec/specs/mvp-profile.md` — active phases, enabled checks, default call config

## Tasks

Complete every task in `openspec/changes/backend/tasks.md`. The frontend and tests already exist — you are generating the backend they call. The baseline includes contract stubs (`@generated-stub`) with typed signatures; implement them. The contract surfaces table in `tasks.md` lists every stub that must be replaced. Follow the path-specific instructions below for how to approach generation.

## Verification

After completing all tasks, verify and report the result of each step explicitly:
- `tsc --noEmit` exits 0 at the project root
- All tests in `tests/unit/` pass
- All tests in `tests/integration/` pass (requires `DATABASE_URL`)
- All tests in `tests/integration-mock/` pass (no DB required: `pnpm test:integration:mock`)

## Gap log

If any spec or requirement is ambiguous or missing, do not guess. Log the gap at the end of your output:
```
## Gaps
- [GAP-001] <what was missing or unclear> — <what you assumed or skipped>
```
