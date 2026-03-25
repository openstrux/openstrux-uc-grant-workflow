# Technical Requirements

Summary of technical requirements relevant to this starter repository. The authoritative source is `openstrux/docs/use-cases/grant-workflow/UseCaseRequirements.md` §8.

## Stack (§8.1)

- TypeScript, Next.js 16, Prisma 6, PostgreSQL 15

## Repository strategy (§8.6)

Single starter repo with clear separation: specs, prompts, generated output, benchmark assets, application code. Two execution paths against the same initialized target.

## Code organization (§8.9)

- Business policies outside UI components
- Eligibility, access, retention, workflow rules as isolated reusable modules
- Traceability between specs/prompts and generated output
- Generated artifacts separable from handwritten source

## Configuration (§8.10)

The system must support configuration for: active call, enabled eligibility checks, reviewer policy text version, CoI form version, retention durations, blinded packet field exclusions, feature flags by phase, benchmark run identifiers.

## Testing (§8.11)

- Unit tests for policy modules
- Integration tests for DB + service interactions
- E2e tests for main workflow slices
- Fixture-based conformance tests for valid/invalid policy cases
- Golden tests for blinded packet generation and workflow state transitions

## Local development (§8.12)

- Local dev: `podman compose up` for PostgreSQL, then `pnpm dev`
- Secrets externalized from source control via `.env`

## Comparison-readiness (§8.13)

Both generation paths must preserve: prompts used, source specs used, generated files, validation results, token counts, execution time, repair/no-repair status, final scorecard entry.
