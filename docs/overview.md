# Grant Workflow — Overview

Privacy-first grant review system inspired by EU open-source grant programmes with public submission and blinded review processes.

## Purpose

Demonstrate that a compact structured source (`.strux` panels) can generate a secure backend, lightweight UI, strong access controls, blinded review workflow, auditability, and benchmarkable outputs — with low token cost.

## Phases

| Phase | Description | v0.6.0 |
|---|---|---|
| P0 | Canonical domain model | ✓ demo |
| P1 | Submission intake + data separation | ✓ demo |
| P2 | Eligibility gate | ✓ demo |
| P3 | Review access + manual scoring | deferred |
| P4 | Clarification + revision | deferred |
| P5 | Independent validation | deferred |
| P6 | Audit + lifecycle controls | deferred |

## Baseline and generation paths

The **baseline** is the initial state of the repository: pre-built frontend, pre-written tests, specs, prompts, and the backend-generation change definition. No backend code is present — it must be generated.

Two generation paths execute against this baseline:

1. **Direct** — feed `openspec/specs/` + `prompts/shared/` + `prompts/direct/` to an LLM → TypeScript output without Openstrux
2. **Openstrux** — feed `openspec/specs/` + `prompts/shared/` + `prompts/openstrux/` to an LLM → `.strux` panels → `strux build` → TypeScript output

Both paths use the same functional specifications from `openspec/specs/` and are validated against the same pre-written tests.

## Prerequisites

- Node.js >= 20
- pnpm >= 9
- PostgreSQL 18 (for integration tests)
- openstrux-core built locally (`cd ../openstrux-core && pnpm build`) for the Openstrux path

## Initial state

The repo ships with:
- Next.js frontend (`app/web/`) — pre-built, archived
- Unit + integration tests (`tests/`) — pre-written, archived
- Backend generation change defined but not executed (`openspec/changes/backend-generation/`)

Run `scripts/reset.sh` to restore to this initial state at any time.
