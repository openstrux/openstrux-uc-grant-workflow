# Prompt Contract

Defines the interface between specifications (`specs/`) and prompt sets (`prompts/`).

## Prompt structure

Both paths share the same base, differing only in generation method:

```
prompts/shared/system.md        # role, stack, principles, what exists
prompts/shared/constraints.md   # hard constraints, naming, code style
prompts/shared/generate.md      # specs to read, tasks to execute, verification, gap log
prompts/<path>/generate.md      # path-specific: output format and toolchain (direct or openstrux)
prompts/shared/task-format.md   # output format for generated files
```

## What the shared prompts reference

- `specs/domain-model.md` — entity definitions, field names, types
- `specs/workflow-states.md` — state machine and access rules per state
- `specs/access-policies.md` — principal definitions and enforcement points
- `specs/mvp-profile.md` — active phases, enabled checks
- `openspec/changes/backend-generation/tasks.md` — task checklist

## What differs per path

| Concern | `direct/` | `openstrux/` |
|---|---|---|
| Generation method | LLM writes TypeScript directly | `.strux` → `strux build` → TypeScript |
| Output location | `output/direct/` | `.openstrux/build/` + `output/openstrux/` |
| Extra context | — | Language reference in `../openstrux-spec/` |
| Gap types | GAP (functional) | GAP (functional) + DOC (language docs) |

## Stability

`specs/` content is frozen per version. Prompts may be revised between benchmark runs.
