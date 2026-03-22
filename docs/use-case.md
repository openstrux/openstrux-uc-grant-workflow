# Use Case

## Grant Review Workflow

This system implements a privacy-first review workflow inspired by EU open-source grant programmes with public submission and blinded review processes.

## Objective

Demonstrate that a compact structured source can generate a secure backend, lightweight predefined UI, strong access controls, blinded review workflow, auditability, and benchmarkable implementation outputs — with low token cost and fast execution.

The system does not replace reviewers or automate grant decisions. It supports the human review process with correct-by-construction access controls and auditable workflow transitions.

## Actors

- **Applicant**: creates and submits proposals, responds to clarification requests, resubmits revised versions
- **Review administrator**: manages call configuration, proposal intake state, reviewer assignment, identity-controlled operations
- **Reviewer**: accesses blinded review packets, acknowledges confidentiality and conflict rules, enters manual scores/comments
- **Independent validator**: validates shortlisted proposals on eligibility and process grounds (P5+)
- **System auditor**: reads audit trails and retention/deletion evidence without modifying business data (P6+)

## Design principles

1. Structure first, code second — generated code is a derived artifact
2. Trust built in, not bolted on — access, audit, and retention encoded by design
3. Human judgment remains human — the workflow supports reviewers, does not replace them
4. Simplicity first — explicit typed inputs and deterministic rules over hidden heuristics
5. Benchmarkability first — same prompts, same repo, same validation, both paths
