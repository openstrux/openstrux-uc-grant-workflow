# Retention Policies

## Overview

Personal data has explicit retention handling. This is a P6 concern — the policies are defined here for completeness but enforcement is deferred.

## Data categories and retention

| Category | Examples | Retention rule | Anonymisation |
|---|---|---|---|
| Identity data | ApplicantIdentity (legal name, email, country) | Until purpose fulfilled + legal hold period | Irreversible anonymisation after retention expires |
| Proposal data | ProposalVersion content, tags, budget | Duration of call + appeals period | May retain anonymised aggregates |
| Review data | Scorecards, reviewer comments, CoI declarations | Duration of call + audit period | Delete after retention expires |
| Audit events | All AuditEvent records | Longest of any data category + audit extension | Never anonymised (but personal refs anonymised) |

## Deletion workflow (P6)

1. Retention rule triggers (time-based or manual)
2. System marks data for deletion
3. Deletion executes (hard delete or anonymisation per category)
4. `retention_event` recorded with proof hash
5. Audit event logged

## Current status

Retention policies are documented but not enforced in v0.6.0 (P0-P2 only). The backend generation prompts should stub retention tables as empty but present.
