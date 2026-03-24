## Architecture

### Worktree isolation

Each benchmark run creates a git worktree from HEAD:
```
git worktree add ../openstrux-uc-grant-workflow-bench-<path>-<timestamp> HEAD
```
Generation and tests run entirely in the worktree. The main working tree is never touched by generation. After results are copied, the worktree is removed.

### Prompt assembly

`generate-api.ts` concatenates files in this order before sending to the API:
1. `prompts/shared/system.md`
2. `prompts/shared/constraints.md`
3. `specs/domain-model.md`, `specs/workflow-states.md`, `specs/access-policies.md`, `specs/mvp-profile.md`
4. `openspec/changes/backend-generation/tasks.md`
5. `prompts/shared/generate.md`
6. `prompts/<path>/generate.md`
7. `prompts/shared/task-format.md`

The API is called with a sufficient `max_tokens` budget for full backend generation. The response is streamed and accumulated in full before parsing.

### Response parsing

The expected format (per `prompts/shared/task-format.md`) is fenced code blocks with the file path as a comment on the first line:
```typescript
// prisma/schema.prisma
...
```
The parser extracts each fenced block, reads the first-line comment as the target path, and writes the file at that path relative to the worktree root. Existing stubs (route handlers, service placeholders) are overwritten.

### Test execution

Unit tests run in the worktree root via `pnpm test:unit --reporter=json`. The runner captures stdout, parses the vitest JSON report, and extracts `numTotalTests`, `numPassedTests`, `numFailedTests`.

Integration tests (`--with-db`) use an ephemeral local PostgreSQL 18 database. The runner creates a short-lived user and database via `sudo -u postgres psql`, runs `prisma migrate deploy` against it, then runs the integration suite. The user and database are dropped in the cleanup trap regardless of outcome.

### Result archival

`save-result.sh` in non-interactive mode:
1. `git diff --name-only HEAD` in the worktree → list of modified/created files
2. Copy each file to `output/<path>/` mirroring the tree structure
3. `zip output/<path>/ → results/<slug>/generated.zip`
4. Snapshot `prompts/` → `results/<slug>/prompts.zip`
5. Write `results/<slug>/benchmark.json` from CLI args + file stats

### `benchmark.json` schema

All fields auto-populated — no manual input:
```json
{
  "timestamp": "<ISO-8601>",
  "path": "direct | openstrux",
  "promptVersion": "<git hash of prompts/>",
  "llm": "<model id from --model arg>",
  "generatedFileCount": 0,
  "totalLines": 0,
  "testSuites": {
    "unit": { "total": 0, "passed": 0, "failed": 0 },
    "integration": { "total": 0, "passed": 0, "failed": 0 }
  },
  "testResults": "N/M pass",
  "gaps": ["GAP-001: ...", "..."]
}
```
`gaps` is extracted automatically: if the API response contains `GAP-###` entries in a `## Gaps` section, they are parsed and stored.

## Key decisions

**Unit tests only for the core score** — Integration tests require Docker and are opt-in via `--with-db`. The published benchmark score is based on unit tests: they are pure, portable, and cover all key logic (eligibility rules, blinded packet mapper, access policies, transitions). The `testSuites.integration` field records results when available.

**Worktree from HEAD, not a baseline tag** — The runner always operates on the current repo state. Use `scripts/reset.sh` before a run to restore the baseline if needed.

**No prompt modification in the runner** — `generate-api.ts` assembles prompts mechanically without alteration. What the benchmark measures is the quality of generation given the prompts as-written.
