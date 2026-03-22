# ADR-001: Technology Stack

- **Status:** Accepted
- **Date:** 2026-03-22

## Decision

TypeScript + Next.js + Prisma + PostgreSQL for the MVP. Authentication is deferred to P3+ (JWT-based middleware is stubbed but no external IdP is required for P0-P2).

## Rationale

- All open-source, self-hostable, no proprietary SaaS runtime dependencies.
- Next.js provides both lightweight UI and server-side API routes in one process.
- Prisma enforces the data model and handles migrations.
- PostgreSQL runs locally via Podman compose for integration tests.

## Consequences

Generated backends (both paths) must target this stack.
