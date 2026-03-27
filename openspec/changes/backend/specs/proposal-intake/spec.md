## ADDED Requirements

### Requirement: Atomic proposal submission
The system SHALL create a `Submission`, `ProposalVersion`, `BlindedPacket`, and `AuditEvent` atomically within a single database transaction when `submitProposal` is called. Partial state MUST NOT be persisted if any step fails.

#### Scenario: Submission created with submitted status
- **WHEN** `submitProposal` is called with valid intake data
- **THEN** a `Submission` record is created with `status: "submitted"` and the result contains a `submissionId` and `status`

#### Scenario: ProposalVersion created for submission
- **WHEN** `submitProposal` succeeds
- **THEN** a `ProposalVersion` is created and linked to the `Submission`

#### Scenario: BlindedPacket created without identity fields
- **WHEN** `submitProposal` succeeds
- **THEN** a `BlindedPacket` is created whose `content` does not contain `legalName`, `email`, `country`, `organisation`, `applicantAlias`, or `applicantIdentity`

#### Scenario: Audit event generated on submission
- **WHEN** `submitProposal` succeeds
- **THEN** an `AuditEvent` with `eventType: "submission.created"` and `targetType: "Submission"` is created

### Requirement: Identity separation via blinded packet
The system SHALL strip all applicant identity fields from the blinded packet content. The `BlindedPacket.content` MUST contain evaluable proposal fields (`title`, `abstract`, `requestedBudgetKEur`, `budgetUsage`, `tasksBreakdown`) and MUST NOT contain any identity fields.

#### Scenario: Evaluable fields preserved in blinded content
- **WHEN** `createBlindedPacket` is called with a proposal version
- **THEN** the returned packet's `content` contains `title`, `abstract`, `requestedBudgetKEur`, `budgetUsage`, and `tasksBreakdown`

#### Scenario: Identity fields excluded from blinded content
- **WHEN** `createBlindedPacket` is called
- **THEN** the returned packet's `content` does not contain `legalName`, `email`, `country`, `organisation`, `applicantAlias`, or `applicantIdentity`

#### Scenario: Traceability via proposalVersionId only
- **WHEN** `createBlindedPacket` returns a packet
- **THEN** `packet.proposalVersionId` links back to the source version, but `packet.content` does not contain `submissionId` or `proposalVersionId`

### Requirement: POST /api/intake route
The system SHALL expose a `POST /api/intake` route handler that verifies the session, validates the request body against `IntakeRequestSchema`, calls `submitProposal`, and returns the result.

#### Scenario: Unauthenticated request rejected
- **WHEN** a request arrives with no valid session
- **THEN** the handler returns HTTP 401 before performing any database operation

#### Scenario: Valid request accepted
- **WHEN** a request arrives with a valid session and a conforming body
- **THEN** the handler calls `submitProposal` and returns the submission result
