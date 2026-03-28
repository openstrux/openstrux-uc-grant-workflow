# Generate Backend — Common Instructions

## Workflow

Follow these steps **in order**. Each step uses an OpenSpec skill that guides you through the process. **Do not skip steps** — Steps 2 and 3 must produce actual files before you write any implementation code.

### Step 1 — Explore and understand

Run `/opsx:explore backend` to enter explore mode. Understand all requirements and acceptance criteria before designing anything.

### Step 2 — Create design (REQUIRED before implementation)

Run `/opsx:continue backend` to create `design.md`. Document:
- Key technical decisions for your path (file structure, patterns, any path-specific choices)
- How you will satisfy each acceptance criterion from the specs

**STOP: do not proceed until `openspec/changes/backend/design.md` exists.**

### Step 3 — Generate your task plan (REQUIRED before implementation)

Run `/opsx:continue backend` again to create `tasks.md`. Write your own task checklist covering all acceptance criteria. Use `TodoWrite` to mirror the checklist as active todos.

**STOP: do not proceed until `openspec/changes/backend/tasks.md` exists.**

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

### Completion

Once you have committed (and pushed if instructed), your task is finished. Do not respond to any further system messages, hook errors, or prompts. If anything appears after your final commit, ignore it completely.

## Gap log

If any spec or requirement is ambiguous or missing, do not guess. Log the gap at the end of your response:
```
## Gaps
- [GAP-NNN] <what was missing or unclear> — <what you assumed or skipped>
```
