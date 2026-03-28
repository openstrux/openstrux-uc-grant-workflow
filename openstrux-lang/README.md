# Openstrux Language Reference (injected by benchmark runner)

This directory contains a curated subset of the openstrux-spec repository.
It is the source of truth for the Openstrux language when writing `.strux` files.

## Reading order

1. **`syntax-reference.md`** — self-sufficient compact reference. Start here.
2. **`examples/`** — concrete `.strux` files that parse and typecheck cleanly.
   - `p0-domain-model.strux` — types + panel for a grant-workflow domain (closest to your task)
   - `v003-panel-shorthand.strux` — shorthand syntax demo
   - `v020-validate-schema-ref.strux` — validate rod with SchemaRef
   - `v020-write-data-target.strux` — write-data with DataTarget
   - `v010-context-named-source.strux` — named @source resolution
3. **Deep specs** — load only when syntax-reference is insufficient:
   - `grammar.md` — full EBNF
   - `type-system.md` — union/record/enum, type paths
   - `panel-shorthand.md` — shorthand derivation rules
   - `config-inheritance.md` — context cascade semantics
   - `semantics.md` — evaluation model
   - `access-context.strux` — AccessContext type definitions
