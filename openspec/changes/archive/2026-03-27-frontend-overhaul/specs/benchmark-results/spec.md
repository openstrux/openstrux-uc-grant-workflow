## ADDED Requirements

### Requirement: Benchmark results page renders a comparison table
The application SHALL display `/benchmarks` as a publicly accessible page showing a table of benchmark run results. Each row represents one benchmark run with columns: date, path (`direct` or `openstrux`), tokens used, turns, unit test pass count, unit test total count, and pass rate percentage.

#### Scenario: Results table renders rows for each result directory
- **WHEN** result directories exist under `../openstrux/benchmarks/results/`
- **THEN** each valid result directory appears as a row, sorted by date descending

#### Scenario: Empty state is shown when no results exist
- **WHEN** the results directory is absent or empty
- **THEN** an empty state message "No benchmark results yet" is displayed without error

---

### Requirement: GET /api/benchmarks reads and returns parsed result data
The application SHALL implement `GET /api/benchmarks` as a fully functional route (not a stub). The route SHALL read subdirectories from `path.join(process.cwd(), '..', 'openstrux', 'benchmarks', 'results')`, parse `generation-meta.json` (for tokens, turns, elapsed time) and `test-unit.json` (for test counts) from each, and return an array of `BenchmarkResult` objects sorted by date descending. If the directory does not exist or a subdirectory is malformed, it SHALL be silently skipped.

#### Scenario: Route returns parsed results for valid directories
- **WHEN** `GET /api/benchmarks` is called and valid result directories exist
- **THEN** the response is 200 with an array of `BenchmarkResult` objects

#### Scenario: Route returns empty array when results directory is absent
- **WHEN** the results directory does not exist
- **THEN** the response is 200 with an empty array `[]`

#### Scenario: Malformed result directory is skipped
- **WHEN** a result directory is missing `generation-meta.json` or `test-unit.json`
- **THEN** that directory is omitted from the response; other valid results are returned

---

### Requirement: Benchmark results page shows a path comparison summary
The application SHALL display a summary section above the table that groups results by path (`direct` vs `openstrux`) and shows average tokens, average turns, and average pass rate for each path.

#### Scenario: Summary shows averages for both paths when data is available
- **WHEN** results exist for both `direct` and `openstrux` paths
- **THEN** two summary cards are displayed, one per path, with computed averages
