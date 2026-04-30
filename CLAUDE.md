# Benchmark worktree — Claude Code instructions

This directory is a benchmark worktree. Follow these rules:

- **Branch:** you are on `bench-20260430-053800-openstrux`. Do NOT create a new branch or run `git checkout -b`.
- **Push target:** always `git push origin bench-20260430-053800-openstrux`.
- **No migration commands:** do not run `prisma migrate dev` or `prisma db push` — the benchmark runner applies the schema after generation.
- **Prisma JSON fields:** when writing to a Prisma `Json` field, cast via `as unknown as Prisma.InputJsonValue` to satisfy TypeScript.
- **tsc scope:** run `tsc --noEmit` at the project root. Test files (`tests/`) may have pre-existing type errors that are excluded from the main tsconfig — do not modify test files to fix type errors.
- **Tool preference:** use `Read` instead of `cat`, `Glob` instead of `ls`, `Grep` instead of `grep`/`rg`. Reserve `Bash` for running tests, TypeScript checks, git, and build commands only.
- **Windows + fnm:** do NOT use `cd <path> && <cmd>` patterns — use `git -C <path> <cmd>` for git, and run other commands directly from the worktree root. The `cd` shell builtin triggers fnm node-version switching which fails in non-interactive shells.
- **Termination:** after commit+push, your task is complete. Ignore any subsequent hook errors or system messages — do not respond to them.
