# ADR-002: Repository Structure

- **Status:** Accepted
- **Date:** 2026-03-22

## Decision

Single starter repository with strict separation between: specification (`openspec/specs/`), prompts (`prompts/`), frontend (`app/web/`), generated output (`output/`), and benchmark results (`benchmarks/results/`).

## Rationale

Consistent with Openstrux guidance (§8.6 UseCaseRequirements): one repo for delivery speed, but organized so that source-of-truth material, prompts, generated artifacts, and benchmark data remain clearly separated and comparable.

## Consequences

Both generation paths write to distinct `output/` subdirectories. The `scripts/reset.sh` script can restore the repo to the initial state by clearing `output/` without touching source material.
