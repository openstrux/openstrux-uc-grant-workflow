## ADDED Requirements

### Requirement: Landing page renders an EU grant portal hero section
The application SHALL display a hero section at the top of `/` with a headline communicating privacy-first open-source grant funding, a short tagline, an EU-style badge or emblem, a primary CTA button linking to `/submit`, and a secondary link to `/login` labelled for reviewers and administrators.

#### Scenario: Hero CTA links to submit page
- **WHEN** a visitor clicks the "Submit your proposal" button in the hero
- **THEN** they are navigated to `/submit`

#### Scenario: Login link is visible for returning users
- **WHEN** a visitor views the hero section
- **THEN** a "Reviewer / Admin login" link is visible and navigates to `/login`

---

### Requirement: Landing page features section explains the offering
The application SHALL display a features section with at least three cards communicating: open call access, privacy-first blinded review, and a fair transparent process.

#### Scenario: Feature cards render with icons
- **WHEN** the features section is rendered
- **THEN** three or more feature cards are displayed, each with a lucide icon, heading, and description

---

### Requirement: Landing page shows a process timeline
The application SHALL display a horizontal four-step process timeline: Submit → Eligibility Check → Blinded Review → Decision.

#### Scenario: Timeline renders four labelled steps
- **WHEN** the process section is rendered
- **THEN** four numbered or icon-labelled steps are displayed in sequence

---

### Requirement: Landing page includes a privacy statement accordion
The application SHALL include a collapsible privacy statement section that explains how applicant identity is stored separately and never shared with reviewers.

#### Scenario: Privacy accordion is collapsed by default
- **WHEN** the landing page first loads
- **THEN** the privacy statement body is collapsed; only the toggle trigger is visible

#### Scenario: Privacy accordion expands on click
- **WHEN** a visitor clicks the privacy statement trigger
- **THEN** the body text expands with a smooth transition

---

### Requirement: Landing page includes an Openstrux benchmark demo section
The application SHALL display a second section, visually separated from the grant portal section, explaining that this application is a benchmark comparing Openstrux-guided AI generation against direct AI generation. This section SHALL include: a short explanation paragraph, three to four cards presenting key Openstrux manifesto points, and a "View benchmark results" button linking to `/benchmarks`.

#### Scenario: Section separator is visually distinct
- **WHEN** the page is rendered
- **THEN** a horizontal rule or gradient divider with an "About this demo" label separates the two sections

#### Scenario: Benchmark results button links to /benchmarks
- **WHEN** a visitor clicks "View benchmark results"
- **THEN** they are navigated to `/benchmarks`

#### Scenario: Manifesto cards display key Openstrux points
- **WHEN** the benchmark demo section is rendered
- **THEN** at least three cards are shown, each summarising a distinct Openstrux manifesto principle
