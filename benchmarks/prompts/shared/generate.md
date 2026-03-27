# Generate Backend — Common Instructions

## Workflow

Use the OpenSpec workflow to implement and close this change:

1. Run `/opsx:apply` — reads `openspec/changes/backend/tasks.md` and drives implementation task by task. Follow the path-specific instructions below for how to approach code generation within each task.
2. After all verification tasks pass, run `/opsx:archive` to mark the change complete.

The design decisions, spec pointers, and technical constraints are in `openspec/changes/backend/design.md` — read it before generating any code.

## Gap log

If any spec or requirement is ambiguous or missing, do not guess. Log the gap at the end of your response:
```
## Gaps
- [GAP-NNN] <what was missing or unclear> — <what you assumed or skipped>
```
