# ADR-004: Authentication and Authorization

- **Status:** Accepted
- **Date:** 2026-03-22

## Decision

For P0-P2 the application uses role-based middleware that resolves the caller's role from a JWT claim or a dev-mode header. No external identity provider is required during the benchmark. Full IdP integration (Keycloak or equivalent) is deferred to P3+.

## Rationale

The benchmark measures generation quality, not deployment. The access policy module (`packages/policies/access/`) enforces fine-grained, purpose-bound access rules regardless of how the role is resolved. Testing against real infrastructure can be added later without changing the policy layer.

## Consequences

All generated backends must implement `server/auth/` middleware that resolves a principal with a role. Policy rules are isolated in `packages/policies/access/`. The middleware must support a dev-mode bypass (e.g., `X-Role` header) for testing.
