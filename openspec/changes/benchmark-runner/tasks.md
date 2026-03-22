## Benchmark Runner Tasks

### R0 — Use-case repo config

- [x] R0.1 Write `benchmark.config.json` — paths, specs, tasks, testUnit, testIntegration

### R1 — `generate-api.ts` (in `openstrux/benchmarks/runner/`)

- [x] R1.1 Write `generate-api.ts` — reads `benchmark.config.json`, assembles prompts + specs, calls Anthropic API via native `fetch` (Node >= 24, no SDK), streams response
- [x] R1.2 Implement fenced-block parser — extracts `// path` first-line comments, writes files at in-tree paths in the worktree
- [x] R1.3 Accept CLI args: `--path <direct|openstrux>`, `--model <model-id>`, `--worktree <dir>`, `--result-dir <dir>`
- [x] R1.4 Extract `## Gaps` section → `gaps.json` in result dir

### R2 — `run-benchmark.sh` (in `openstrux/benchmarks/runner/`)

- [x] R2.1 Write `run-benchmark.sh` — `--uc <repo>` arg, worktree create → generate → test → save-result → worktree remove
- [x] R2.2 Add `--with-db` flag — Docker Postgres lifecycle, `prisma migrate deploy`, integration tests, container teardown
- [x] R2.3 Capture `pnpm test:unit --reporter=json` output, pass to `save-result.sh`
- [x] R2.4 Exit non-zero if generation produces zero files or unit tests all fail

### R3 — `save-result.sh` (in `openstrux/benchmarks/runner/`)

- [x] R3.1 Replace interactive prompts with CLI args: `--path`, `--llm`, `--worktree`, `--result-dir`, `--test-results-json`, `--note`
- [x] R3.2 Detect generated files via `git diff --name-only HEAD` + `git ls-files --others` in worktree
- [x] R3.3 Copy detected files to `output/<path>/` in uc repo
- [x] R3.4 Auto-populate all `benchmark.json` fields; include `gaps` array if `gaps.json` exists

### R4 — Viewer (in `openstrux/benchmarks/viewer/`)

- [x] R4.1 Write `generate-report.ts` — reads `viewer.config.json`, aggregates results from all uc repos, generates self-contained `report.html`
- [x] R4.2 Write `benchmarks/viewer.config.json` — registers grant-workflow uc repo
- [x] R4.3 Write `openstrux/scripts/view-results.sh` — runs generator, opens report in browser

### R5 — Verification

- [ ] R5.1 Run `run-benchmark.sh --uc ../openstrux-uc-grant-workflow --path direct` — confirm `results/<slug>/` created
- [ ] R5.2 Confirm `output/direct/` contains all generated files as reference copy
- [ ] R5.3 Run `scripts/view-results.sh` in openstrux — confirm `report.html` opens with results table
- [ ] R5.4 Run `run-benchmark.sh ... --path openstrux` after strux build is ready
