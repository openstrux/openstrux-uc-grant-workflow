# Workflow States

## ProposalStatus transitions

```
draft
  └─[submit]──> submitted
                  └─[eligibility check]──> eligible
                  │                        └─[assign reviewer]──> under_review
                  │                                               └─[clarification]──> clarification_requested
                  │                                               │                    └─[applicant responds]──> revised
                  │                                               └─[shortlist]──> validation_pending
                  │                                               │                └─[validate]──> selected | rejected
                  │                                               └─[reject]──> rejected
                  └─[eligibility check]──> eligibility_failed
```

## Access rules per state

| State | Applicant | Reviewer | Admin |
|---|---|---|---|
| draft | read/write | — | read |
| submitted | read | — | read/write |
| eligibility_failed | read | — | read/write |
| eligible | read | — | read/write |
| under_review | read | read (blinded) | read/write |
| clarification_requested | read/write | read | read/write |
| revised | read | read (blinded) | read/write |
| validation_pending | read | read | read/write |
| selected | read | read | read/write |
| rejected | read | — | read |

## Invariants

- Reviewer can never access `applicant_identity` records.
- Reviewer assignment is blocked when `status = eligibility_failed`.
- BlindedPacket is generated automatically on transition to `eligible`.
- All state transitions generate an `AuditEvent`.
