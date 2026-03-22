# ADR-003: Identity and Proposal Data Separation

- **Status:** Accepted
- **Date:** 2026-03-22

## Decision

Identity/legal/contact data and evaluable proposal content are separated at the data-model level. Reviewers access only blinded review packets that exclude identity fields by default.

## Rationale

FR-P0-002, FR-P0-004: role-bound visibility rules prevent reviewers accessing identity fields. Blinded packet generation (FR-P1-007, FR-P1-008) strips identity and business-identifying fields.

## Consequences

Prisma schema has separate models for identity records and proposal dossiers. API middleware enforces the boundary.
