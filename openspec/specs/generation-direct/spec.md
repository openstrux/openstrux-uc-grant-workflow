# Generation Direct

## Purpose

Defines the approach for implementing all backend contract surfaces as hand-written TypeScript files at their natural in-tree paths, with no intermediate code generation toolchain.

## Requirements

### Requirement: Direct TypeScript generation
The system SHALL implement all contract stubs as hand-written TypeScript at their natural in-tree paths, with no intermediate representation or code generation toolchain.

Required output files:
- `prisma/schema.prisma`
- `prisma/seeds/seed.ts`
- `src/domain/schemas/index.ts`
- `src/policies/index.ts`
- `packages/policies/src/index.ts`
- `src/lib/prisma.ts`
- `src/server/services/submissionService.ts`
- `src/server/services/eligibilityService.ts`
- `src/app/api/intake/route.ts`
- `src/app/api/eligibility/route.ts`

#### Scenario: All contract surfaces implemented
- **WHEN** generation is complete
- **THEN** every file listed above exists and has no `@generated-stub` markers

### Requirement: Dual policy export path
The system SHALL place all policy function implementations in `src/policies/index.ts`. `packages/policies/src/index.ts` MUST be a re-export barrel only, exporting everything from `src/policies/index.ts`.

#### Scenario: Both import paths resolve
- **WHEN** a test imports from `../../src/policies`
- **THEN** it receives the real implementation

#### Scenario: packages barrel re-exports src
- **WHEN** a test imports from `packages/policies/src`
- **THEN** it receives the same functions as `src/policies/index.ts`

### Requirement: Route handlers as full implementations
Each route handler MUST implement the full request pipeline inline: session verification → input validation → service call → response. No intermediate generated layer is used.

#### Scenario: Route rejects unauthenticated request
- **WHEN** a request arrives with no valid session cookie
- **THEN** the handler returns HTTP 401 before any database operation

#### Scenario: Route validates input and calls service
- **WHEN** a request arrives with a valid session and conforming body
- **THEN** the handler validates input with the Zod schema and delegates to the service function

### Requirement: Acceptance criteria
All generated code MUST satisfy:
- `tsc --noEmit` exits 0 at project root
- `pnpm test:unit` passes
- `pnpm test:integration:mock` passes (no DB required)
- `pnpm test:integration` passes (requires `DATABASE_URL`)

#### Scenario: TypeScript compiles cleanly
- **WHEN** `tsc --noEmit` is run at the project root
- **THEN** exit code is 0 and no type errors are reported

#### Scenario: Unit tests pass
- **WHEN** `pnpm test:unit` is run
- **THEN** all tests in `tests/unit/` pass
