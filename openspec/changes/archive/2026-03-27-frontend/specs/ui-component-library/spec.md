## ADDED Requirements

### Requirement: UI primitive components are available from src/components/ui/
The application SHALL provide the following primitive components, each accepting standard HTML attributes in addition to their own props:

- `Button` — variants: `primary` (default), `secondary`, `ghost`, `danger`; sizes: `sm`, `md` (default), `lg`; accepts `isLoading` (shows Spinner, disables interaction)
- `Badge` — variants mapped from `ProposalStatus` plus semantic variants (`success`, `warning`, `danger`, `info`)
- `Card` — surface container with optional `header` and `footer` render props
- `DataTable` — generic table with typed columns, row data, empty-state slot, and optional row action callbacks
- `Modal` — HeadlessUI `Dialog` wrapper with `Transition`; props: `open`, `onClose`, `title`, `children`
- `Select` — HeadlessUI `Listbox` wrapper; props: `value`, `onChange`, `options: { value, label }[]`
- `FormField` — composes `label`, `input`/`textarea`/`select`, `hint`, and `error` message; prop: `as?: 'input' | 'textarea' | 'select'`
- `Spinner` — animated loading indicator; sizes: `sm`, `md`, `lg`

#### Scenario: Button renders correct variant class
- **WHEN** `<Button variant="danger">Delete</Button>` is rendered
- **THEN** the button has the danger colour styling and is accessible via keyboard

#### Scenario: Button isLoading disables interaction
- **WHEN** `<Button isLoading>Submit</Button>` is rendered
- **THEN** the button is disabled and renders a Spinner alongside the label

#### Scenario: DataTable shows empty state when data is empty
- **WHEN** `<DataTable columns={cols} rows={[]} emptyState={<p>No proposals</p>} />` is rendered
- **THEN** the table body is replaced by the empty state element

#### Scenario: Modal opens and closes via HeadlessUI Transition
- **WHEN** `open` prop transitions from false to true
- **THEN** the dialog appears with a fade + scale animation; focus is trapped inside

#### Scenario: FormField displays validation error
- **WHEN** `<FormField error="Required" />` is rendered
- **THEN** an error message is displayed below the input in the danger colour

---

### Requirement: Layout components provide consistent page shells
The application SHALL provide layout components:

- `AppShell` — authenticated shell with a sidebar (role-aware nav links + logout), topbar (page title + user chip), and main content area
- `PublicNav` — public site navigation bar with logo/site name and contextual links
- `DashboardHeader` — page section header with `title`, `subtitle`, and optional `intro` paragraph
- `SectionSeparator` — visual divider with an optional centred label, used between landing page sections

#### Scenario: AppShell renders correct nav links for role
- **WHEN** `<AppShell role="reviewer">` is rendered
- **THEN** the sidebar contains only the reviewer-relevant nav links and a logout button

#### Scenario: AppShell active link is visually distinguished
- **WHEN** the current pathname matches a sidebar nav link
- **THEN** that link has the active indicator style (indigo left border + background)

---

### Requirement: Proposal domain components encapsulate shared presentation logic
The application SHALL provide:

- `ProposalTable` — renders a `DataTable` with proposal-specific columns (alias, title, `StatusBadge`, submitted date, actions); role-aware column set (admin sees identity columns; reviewer/validator see blinded columns)
- `StatusBadge` — maps `ProposalStatus` enum values to `Badge` with consistent colour coding

#### Scenario: StatusBadge maps under_review to animated badge
- **WHEN** `<StatusBadge status="under_review" />` is rendered
- **THEN** the badge displays "Under Review" with a pulse dot animation

#### Scenario: ProposalTable hides identity columns for reviewer role
- **WHEN** `<ProposalTable role="reviewer" rows={blindedRows} />` is rendered
- **THEN** the alias / identity columns are absent from the rendered table
