## Why

The initial `save-result.sh` requires manual operator input and does not isolate the generation environment. Running both paths against the same baseline should be reproducible and automated: a single command assembles the prompts, calls the Anthropic API with a clean context, writes generated files in-tree in a git worktree, runs unit tests, and archives the result — without operator intervention.

The runner and viewer are generic infrastructure that applies to any use-case repo, so they live in the `openstrux` hub repo, not here. This repo exposes only a thin config file.

## What Changes

### `benchmark.config.json` (this repo)

Machine-readable description of the benchmark task: which generation paths are supported, which spec files to include in the prompt, where the task list lives, and what test commands to run. Read by the runner in `openstrux/benchmarks/runner/`.

### `openstrux/benchmarks/runner/generate-api.ts`

Node script (Node >= 24, no SDK). Reads `benchmark.config.json` from the worktree, assembles prompts and spec files, calls the Anthropic API via native `fetch`, parses fenced-block response, writes files at their natural in-tree paths.

### `openstrux/benchmarks/runner/run-benchmark.sh`

Orchestrator: `--uc <uc-repo> --path <direct|openstrux> [--model] [--with-db]`. Creates a git worktree in the uc repo, calls `generate-api.ts`, runs unit tests, calls `save-result.sh`, removes the worktree.

### `openstrux/benchmarks/runner/save-result.sh`

Non-interactive. Detects generated files via `git diff --name-only HEAD` in the worktree, copies to `output/<path>/` in the uc repo as reference, zips to `results/<slug>/generated.zip`, writes `benchmark.json`. No manual prompts.

### `openstrux/benchmarks/viewer/generate-report.ts` + `scripts/view-results.sh`

Static HTML generator. Reads `benchmarks/viewer.config.json` (listing all uc repos), aggregates `results/*/benchmark.json`, writes a self-contained `report.html`. `view-results.sh` generates and opens it.

## Capabilities

### New Capabilities

- `benchmark-runner`: Single-command reproducible benchmark execution for both generation paths
- `benchmark-viewer`: Static HTML report aggregating results across all registered uc repos

### Modified Capabilities

_(none in this repo — runner lives in openstrux)_

## Impact

- **openstrux-uc-grant-workflow**: New `benchmark.config.json`; removed runner scripts (moved to openstrux)
- **openstrux**: New `benchmarks/runner/`, `benchmarks/viewer/`, `benchmarks/model/`, `scripts/view-results.sh`
- No changes to openstrux-spec or openstrux-core
