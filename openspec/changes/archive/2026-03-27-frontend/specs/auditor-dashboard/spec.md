## ADDED Requirements

### Requirement: Auditor dashboard is accessible only to authenticated auditors
The application SHALL render `/dashboard/auditor` only for sessions with role `auditor`.

#### Scenario: Auditor session loads audit trail
- **WHEN** a request with role `auditor` reaches `/dashboard/auditor`
- **THEN** the audit events table is rendered

---

### Requirement: Auditor dashboard shows an audit events table
The application SHALL display a `DataTable` of audit events fetched from `GET /api/audit`. Columns SHALL include: timestamp (ISO 8601), event type, actor role, target type, target ID (truncated), and a payload summary.

#### Scenario: Audit events render with timestamp and event type
- **WHEN** audit events are returned from the API
- **THEN** each row displays the ISO timestamp and a human-readable event type label

#### Scenario: Empty state is shown when no audit events exist
- **WHEN** `GET /api/audit` returns an empty array
- **THEN** a "No audit events recorded yet" empty state is displayed

---

### Requirement: Auditor can filter the audit trail
The application SHALL provide a filter bar above the audit table with controls for: event type (multi-select or select) and date range (from/to date inputs). Filtering is applied client-side against the loaded data.

#### Scenario: Event type filter reduces visible rows
- **WHEN** the auditor selects a specific event type in the filter
- **THEN** only rows matching that event type are shown in the table

#### Scenario: Date range filter shows only events within the range
- **WHEN** the auditor sets a from-date and to-date
- **THEN** only events with timestamps within the range are shown
