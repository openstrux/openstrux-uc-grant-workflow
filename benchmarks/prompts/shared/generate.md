# Generate Backend — Common Instructions

## Workflow

Use the OpenSpec workflow to plan and implement this change.

### Step 1 — Explore and understand

Run `/opsx:explore backend` to enter explore mode. Use it to:
- Read the proposal (`openspec/changes/backend/proposal.md`) and all specs under `openspec/changes/backend/specs/`
- Search for existing specs with `openspec list --json` and browse `openspec/specs/` for domain context (`domain-model.md`, `workflow-states.md`, `access-policies.md`, `mvp-profile.md`)
- Understand all acceptance criteria (including the path-specific spec under `openspec/changes/backend/specs/`) before designing anything

### Step 2 — Create design

Run `/opsx:continue backend` to create `design.md`. Document:
- Key technical decisions for your path (file structure, patterns, any path-specific choices)
- How you will satisfy each acceptance criterion from the specs

### Step 3 — Generate your task plan

Run `/opsx:continue backend` again to create `tasks.md`. Write your own task checklist covering all acceptance criteria. Use `TodoWrite` to mirror the checklist as active todos.

### Step 4 — Implement

Run `/opsx:apply backend` to get full implementation context. Then execute your task plan:
- Implement each file in order
- Mark tasks complete as you go
- Run `tsc --noEmit` and the test suites after each significant step

### Step 5 — Verify and archive

Once all acceptance criteria pass:
- Run `/opsx:verify backend` to check completeness
- Fix any issues reported
- Run `/opsx:archive backend` to mark the change complete

## Gap log

If any spec or requirement is ambiguous or missing, do not guess. Log the gap at the end of your response:
```
## Gaps
- [GAP-NNN] <what was missing or unclear> — <what you assumed or skipped>
```
