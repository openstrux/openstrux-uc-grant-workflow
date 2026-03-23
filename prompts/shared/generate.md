# Generate Backend — Common Instructions

## Specifications (source of truth)

Read these files — they define what to build:
- `specs/domain-model.md` — entities, fields, relationships
- `specs/workflow-states.md` — state machine, access rules per state
- `specs/access-policies.md` — principals, policies, enforcement points
- `specs/mvp-profile.md` — active phases, enabled checks, default call config

## Tasks

Execute all tasks in `openspec/changes/backend-generation/tasks.md`.

The frontend and tests already exist. You are generating the backend they call. The baseline includes contract stubs (`@generated-stub`) with typed signatures — implement them. See `tasks.md` for the contract surfaces table.

## Verification

- `tsc --noEmit` exits 0
- All tests in `tests/unit/` and `tests/integration/` pass

## Gap log

If any spec or requirement is ambiguous or missing, do not guess. Log the gap at the end of your output:
```
## Gaps
- [GAP-001] <what was missing or unclear> — <what you assumed or skipped>
```
