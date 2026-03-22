# Access Policies

## Principals

- `applicant` — authenticated submitter; access limited to own submissions
- `admin` — review administrator; access to all proposals, identity, and workflow controls
- `reviewer` — assigned reviewer; access only to blinded packets of assigned proposals
- `validator` — independent validator (P5+); access to shortlisted blinded packets
- `auditor` — read-only access to audit logs and retention evidence

## Policies

### POLICY: applicant-own-proposals
- Principal: `applicant`
- Operation: read/write
- Scope: `Submission` where `applicant_alias = caller.identity`
- Excludes: `BlindedPacket`, `EligibilityRecord.failure_reasons` (admin-only)

### POLICY: admin-all
- Principal: `admin`
- Operation: read/write/delete
- Scope: all entities
- Restrictions: deletion only via retention/anonymisation workflow (audit-logged)

### POLICY: reviewer-blinded-assigned
- Principal: `reviewer`
- Operation: read
- Scope: `BlindedPacket` where `submission_id IN reviewer.assigned_proposals`
- Explicitly excludes: `ApplicantIdentity`, `Submission.applicant_alias` field

### POLICY: deny-identity-to-reviewer
- Principal: `reviewer`
- Operation: any
- Resource: `ApplicantIdentity`
- Effect: DENY (hard, logged)

## Pseudonymization rule

All documents presented to reviewers and validators must be pseudonymized. No identity field (legal name, email, country, organisation, applicant alias) may appear in any response, view, or export accessible to the `reviewer` or `validator` principal. The blinded packet is the only reviewer-accessible representation of a proposal. This applies to API responses, UI rendering, and any future export or reporting feature.

## Enforcement points

1. Next.js route middleware — check JWT role, resolve principal
2. Service layer — call policy function before any DB query
3. DB model — separate tables for identity vs. proposal content
4. Blinded packet mapper — strip identity fields at generation time; verified by golden test

## Audit requirements

All access control decisions (allow and deny) are logged as `AuditEvent` with `event_type: "access"`.
