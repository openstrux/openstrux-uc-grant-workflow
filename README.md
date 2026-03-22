# openstrux-uc-grant-workflow

Privacy-first grant review workflow — Openstrux use-case starter repository.

This repository is structured for side-by-side comparison of two generation paths over the same baseline:
1. **Direct**: prompt-driven TypeScript generation (Next.js + Prisma) without Openstrux
2. **Openstrux**: `.strux` panel generation compiled to TypeScript

The **baseline** is the initial state of the repo: pre-built frontend, pre-written tests, specs, and prompts — before any generation path is executed.

## Quick start

```bash
git clone https://github.com/openstrux/openstrux-uc-grant-workflow
cd openstrux-uc-grant-workflow

# Install dependencies (frontend + tests already present)
cd app/web && pnpm install && cd ../..

# See docs/overview.md for full setup
```

## Repository structure

```
docs/               Human-facing project documentation
specs/              Structured source-of-truth (domain model, workflow states, policies)
prompts/            Prompt assets
  shared/           LLM context: system prompt, constraints, task format
  direct/           Path-specific: generate TS directly
  openstrux/        Path-specific: generate .strux + compile
openspec/changes/   OpenSpec change packages
  frontend/         Archived: completed Next.js frontend
  backend-generation/  Defined: the backend both paths implement
  tests/            Archived: vitest unit + integration tests
app/web/            Next.js application (frontend pre-built)
packages/domain/    Typed entities and value objects
packages/policies/  Eligibility, access, retention, workflow rules
prisma/             Database schema and migrations
tests/              Unit and integration tests (vitest)
prompts/            Prompt sets for both generation paths
scripts/            Automation: save-result, reset, view-results
output/             Generated artifacts for comparison
  direct/           From direct-TS path (gitignored after generation)
  openstrux/        From .strux path (gitignored after generation)
results/            Benchmark run outputs (JSON + zips)
pipelines/          .strux source files for P0-P2
```

## Generation paths

See [docs/overview.md](docs/overview.md) for a full walkthrough.

### Direct path
Feed `specs/` + `prompts/shared/` + `prompts/direct/` to an LLM → generates TypeScript directly.

### Openstrux path
Feed `specs/` + `prompts/shared/` + `prompts/openstrux/` to an LLM → generates `.strux` panels → `strux build` → TypeScript.

## Scripts

- `scripts/reset.sh` — restore repo to initial state (frontend + tests only)
- `scripts/save-result.sh` — save a benchmark result after generation
- `scripts/view-results.sh` — start the results viewer at `/results`
