# Openstrux Path

Generate the backend using the Openstrux language: write `.strux` source files that define the domain model and data flows, compile to TypeScript via `strux build`, then fill any gaps the toolchain doesn't cover with hand-written TypeScript.

**You MUST write `.strux` files first.** This is the openstrux benchmark path — skipping straight to TypeScript defeats the purpose. The `.strux` files are a first-class deliverable.

## Step 1 — Learn the language

The Openstrux language reference is bundled locally in `openstrux-lang/`. Read in this order:

1. **`openstrux-lang/syntax-reference.md`** — compact, self-sufficient reference. Covers type forms, panel structure, shorthand rules, rod taxonomy, expressions, decorators, context inheritance. **Read this first — it is included in the prompt.**
2. **`openstrux-lang/examples/`** — concrete `.strux` files that parse and typecheck cleanly. Study these before writing your own:
   - `p0-domain-model.strux` — types + panel for a grant-workflow domain (closest to your task)
   - `v003-panel-shorthand.strux` — shorthand syntax (no `@rod`, no `cfg./arg.` prefix)
   - `v020-validate-schema-ref.strux` — validate rod with SchemaRef to a declared `@type`
   - `v020-write-data-target.strux` — write-data with DataTarget
   - `v010-context-named-source.strux` — named `@source` resolution from context
3. **Deep specs** — load only when syntax-reference and examples are insufficient:
   - `openstrux-lang/grammar.md` — full EBNF
   - `openstrux-lang/type-system.md` — union/record/enum, type paths, narrowing
   - `openstrux-lang/panel-shorthand.md` — shorthand derivation rules
   - `openstrux-lang/config-inheritance.md` — context cascade semantics
   - `openstrux-lang/semantics.md` — evaluation model
   - `openstrux-lang/access-context.strux` — AccessContext type definitions

## Step 2 — Bootstrap

Verify the toolchain is available and the project config is correct:

```bash
npx strux --version                        # must print a version — do not continue without this
cat strux.config.yaml                      # verify source globs and output dir
```

Check `strux.config.yaml` — verify source globs include `pipelines/**/*.strux` and `openspec/specs/**/*.strux`, and output dir is `.openstrux/build`.

**The strux CLI is required.** `strux build` generates the TypeScript scaffolds that you will fill in — you must run it before writing any implementation code. If `npx strux` is not found, the setup has failed; stop and report the error.

## Step 3 — Write `.strux` source files

Read the functional specs (`openspec/specs/domain-model.md`, `openspec/specs/workflow-states.md`, `openspec/specs/access-policies.md`, `openspec/specs/mvp-profile.md`) and express them as `.strux`:

- **`strux.context`** (project root) — project-wide `@context`: controller, DPO, common policies, named `@source`/`@target` for PostgreSQL
- **`pipelines/strux.context`** — domain-level overrides: narrower access scope, domain-specific sources/targets
- **`openspec/specs/p0-domain-model.strux`** — `@type` definitions for all P0-P2 entities from `openspec/specs/domain-model.md`
- **`pipelines/intake/p1-intake.strux`** — intake pipeline panel (receive → validate → write, with identity separation and blinded packet generation)
- **`pipelines/eligibility/p2-eligibility.strux`** — eligibility pipeline panel (guard → evaluate → write, with status transition and audit)

Use shorthand syntax. Leverage context cascade: panels should declare only the delta from context. Prefer named references (`@source`, `@target`) over inline config.

## Step 4 — Build

Run `strux build` to compile your `.strux` source into TypeScript scaffolds:

```bash
npx strux build --explain
```

`--explain` shows what each panel compiles to. Verify zero error diagnostics. If errors occur, fix the `.strux` source and rebuild until the build is clean.

The generated output in `.openstrux/build/` is the contract that the rest of the implementation must satisfy. **Do not write any TypeScript implementation until `strux build` succeeds.**

## Step 5 — Fill gaps

After `strux build` succeeds, implement the stubs that the build output does not cover. Read the generated files in `.openstrux/build/` first — they define the exact types, interfaces, and function signatures you must implement:

- **Prisma schema** (`prisma/schema.prisma`) — the `.strux` types inform but don't generate the Prisma schema
- **Zod schemas** (`src/domain/schemas/index.ts`)
- **Policy functions** (`src/policies/index.ts`) — `evaluateEligibility`, `createBlindedPacket`, `isValidTransition`, `getNextStatus`
- **Service layer** (`src/server/services/submissionService.ts`, `eligibilityService.ts`)
- **DAL** (`src/lib/dal.ts`) — `verifySession`
- **Route handlers** (`src/app/api/intake/route.ts`, `src/app/api/eligibility/route.ts`)
- **Prisma client** (`src/lib/prisma.ts`)
- **Seed** (`prisma/seeds/seed.ts`)

The `.strux` source defines the domain model and data flows; the TypeScript gap-fills implement the contract stubs that tests import from.

## Output

Both `.strux` source files and TypeScript gap-fills are deliverables:

```
strux.context              # project-wide context
pipelines/**/*.strux       # pipeline panels
openspec/specs/*.strux     # type definitions
src/**/*.ts                # gap-fill implementations
prisma/schema.prisma       # database schema
prisma/seeds/seed.ts       # seed script
```

## Gap log

Log anything you couldn't express in `.strux` or couldn't find in the language docs (in addition to the standard gap log format from `shared/generate.md`):
```
## Gaps
- [GAP-NNN] <functional gap> — <workaround used>
- [DOC-NNN] <missing from language docs> — <where you looked>
```

These gaps feed back into the Openstrux spec improvement cycle.
