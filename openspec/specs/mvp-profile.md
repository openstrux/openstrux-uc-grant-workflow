# MVP Profile

Defines which features are active for the v0.6.0 demo.

## Active phases

| Phase | Status | Notes |
|---|---|---|
| P0 — Domain model | active | All P0-P2 entities implemented |
| P1 — Intake | active | Submission + blinded packet |
| P2 — Eligibility | active | Boolean/numeric gate |
| P3 — Review | stub | Routes return 501 |
| P4 — Clarification | stub | Routes return 501 |
| P5 — Validation | stub | Routes return 501 |
| P6 — Audit/lifecycle | stub | Routes return 501 |

## Feature flags

```json
{
  "phases": {
    "p0_domain_model": true,
    "p1_intake": true,
    "p2_eligibility": true,
    "p3_review": false,
    "p4_clarification": false,
    "p5_validation": false,
    "p6_audit": false
  }
}
```

## Enabled eligibility checks (default)

All checks active for the demo call:
- `submittedInEnglish`
- `alignedWithCall`
- `primaryObjectiveIsRd`
- `meetsEuropeanDimension`
- `requestedBudgetKEur` (max: 500)
- `firstTimeApplicantInProgramme`

## Default call configuration

```json
{
  "callId": "eu-oss-fund-2026",
  "title": "EU Open Source Fund 2026",
  "maxBudgetKEur": 500,
  "enabledEligibilityChecks": ["submittedInEnglish", "alignedWithCall", "primaryObjectiveIsRd", "meetsEuropeanDimension", "requestedBudgetKEur", "firstTimeApplicantInProgramme"]
}
```
