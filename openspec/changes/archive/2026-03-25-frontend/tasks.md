## Frontend Tasks

### App structure

- [x] F0.1 Create `src/app/layout.tsx` — root layout with global CSS import and nav structure
- [x] F0.2 Create `src/styles/globals.css` — CSS variables, base reset, shared component classes (`.btn`, `.card`, `.field`, `.badge`, `.actions-row`, `.link-back`, `.error`, `.hint`, `.empty-state`)

### Home page

- [x] F1.1 Create `src/app/page.tsx` — home page with links to `/submit` and `/admin` and a phases overview

### Proposal intake

- [x] F2.1 Create `src/app/submit/page.tsx` — client component with form: call selection, applicant alias, title, abstract, budget (kEUR), budget usage, tasks breakdown
- [x] F2.2 Form POSTs to `/api/intake` and redirects to `/admin/proposals/<submissionId>` on success; displays inline error on failure

### Admin dashboard

- [x] F3.1 Create `src/app/admin/page.tsx` — server component calling `listSubmissions()`; table with ID, alias, status badge, date, action links; empty-state for no submissions

### Proposal detail

- [x] F4.1 Create `src/app/admin/proposals/[id]/page.tsx` — server component calling `getSubmission(id)`; shows title, status, abstract, budget, budget usage, tasks breakdown; calls `notFound()` if submission is null
- [x] F4.2 Link to `/admin/proposals/<id>/eligibility` from proposal detail actions

### Eligibility check

- [x] F5.1 Create `src/app/admin/proposals/[id]/eligibility/page.tsx` — client component with form: submitted-in-English, aligned-with-call, primary-objective-is-RD, meets-European-dimension, requested budget (kEUR), first-time-applicant
- [x] F5.2 Form POSTs to `/api/eligibility` and redirects to `/admin/proposals/<id>` on success; displays inline error on failure

### Service stubs

- [x] F6.1 Create `src/server/services/submissionService.ts` — typed stubs: `listSubmissions()`, `getSubmission(id)`, `submitProposal(input)`; types exported for backend consumption
- [x] F6.2 Create `src/server/services/eligibilityService.ts` — typed stub: `runEligibilityCheck(input)`
