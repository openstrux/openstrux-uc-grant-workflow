# Prompt Contract

This document defines the interface between the specification (`specs/`) and the prompt sets (`prompts/`).

## What the prompts reference

Both generation paths reference the same specifications in `specs/`:

- `specs/domain-model.md` — entity definitions, field names, types
- `specs/workflow-states.md` — state machine and access rules per state
- `specs/access-policies.md` — principal definitions and enforcement points

## What the prompts differ on

| Concern | direct/ | openstrux/ |
|---|---|---|
| Target | TypeScript files directly | `.strux` panels → `strux build` |
| Output dir | `output/direct/` | `.openstrux/build/` |
| Format | Prose instructions for LLM | Prose + structured panel authoring |

## Stability guarantee

`specs/` content is stable once a phase is frozen. Prompts may be revised between benchmark runs, but the spec content they reference does not change within a version.

## Phase-to-file mapping

| Phase | Spec sections | Prompt files |
|---|---|---|
| P0 | Domain model — all entities | p0-domain-model.md |
| P1 | FR-P1-* (intake, data separation, blinded packet) | p1-intake.md |
| P2 | FR-P2-* (eligibility gate, inputs, rule logic) | p2-eligibility.md |
