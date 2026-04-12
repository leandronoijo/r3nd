---
name: run-e2e-tests
description: Generate, run, and diagnose E2E tests from test cases; output structured results to rnd/e2e-results.
---

# run-e2e-tests

Generate, execute, diagnose, and report end-to-end tests derived from `rnd/test_cases/<feature-id>-test-cases.md`.

{{rnd/agents/e2e-engineer.md}}
{{rnd/agents/shared/command-hygiene.md}}

## Inputs

- `rnd/test_cases/<feature-id>-test-cases.md` (required)
- `rnd/build_plans/<feature-id>-build-plan.md` (required for selectors, contracts, and acceptance criteria)
- `rnd/instructions/e2e-testing.instructions.md`
- `rnd/instructions/testing.instructions.md`
- Implemented code in the current codebase

## Outputs

| Output | Location | Purpose |
|--------|----------|---------|
| E2E Test Files | Current codebase E2E test locations, such as `tests/e2e/<feature-id>/` | Executable test implementations |
| Test Fixtures | Current codebase E2E fixtures, such as `tests/e2e/<feature-id>/fixtures/` | Shared data and helpers |
| Result Report | `rnd/e2e-results/<feature-id>-e2e-result.md` | Execution summary and failure analysis |
| Test Artifacts | Current codebase E2E artifact locations | Screenshots, videos, traces for failed tests only |

## Workflow

### Phase 1: Preparation

1. Read the test cases and build plan.
2. Read the E2E and general testing instructions.
3. Inspect existing E2E tests or nearby examples for framework and selector patterns.

### Phase 2: Environment Setup

1. Detect the project structure and service dependencies.
2. Prefer Docker Compose for bringing up required services.
3. Use a 10-minute maximum startup window and capture logs, health checks, and failures.

### Phase 3: Test Generation

1. Map each test case to one executable test file, unless related cases can share fixtures safely.
2. Use the framework and patterns specified in `rnd/instructions/e2e-testing.instructions.md`.
3. Prefer `data-test-id` selectors, explicit waits, and AAA structure.
4. Keep tests independent and stable.

### Phase 4: Test Execution

1. Run tests sequentially.
2. Enforce a 60-second timeout per test.
3. Capture artifacts only for failures.

### Phase 5: Failure Diagnosis

1. Classify failures as environment, methodology, or code issues.
2. Iterate on methodology at most twice when the problem is test reliability.
3. If the code is at fault, identify the likely file or module and the affected test cases.

### Phase 6: Result Reporting

1. Write the result report using the e2e result template.
2. Save it to `rnd/e2e-results/<feature-id>-e2e-result.md`.
3. Summarize pass/fail status and next steps clearly.

## Hard Rules

- Use only the framework and patterns from `rnd/instructions/e2e-testing.instructions.md`.
- Use only `data-test-id` selectors.
- Run tests sequentially.
- Keep the startup timeout to 10 minutes.
- Keep each test timeout to 60 seconds.
- Store screenshots, videos, and traces only for failures.
- Every test must map back to a test case ID.

## Test Code Patterns

- Prefer one test file per case when possible.
- Use descriptive test names that match the case title.
- Follow the AAA pattern and map Given/When/Then to arrange/act/assert.

## File I/O and Scope

- Read: `rnd/test_cases/`, `rnd/build_plans/`, the current codebase, `rnd/instructions/e2e-testing.instructions.md`, and `rnd/instructions/testing.instructions.md`
- Write: E2E test files, fixtures, result reports, and failure artifacts in the current codebase or `rnd/e2e-results/`
- Do not start services manually when a compose-based workflow is available

## Result Report Structure

The report should include:

1. Metadata
2. Execution summary
3. Per-test-case details
4. Failure analysis
5. Recommended actions
6. Artifact locations

## Definition of Done

- All requested test cases have been executed or accounted for.
- Failures are classified with evidence.
- The result report is written to the expected path.
- The summary clearly states pass/fail status and next steps.

## Communication Style

- Concise, factual, and diagnostic.
- Highlight the difference between environment, methodology, and product defects.
- Keep the handoff actionable for the developer or QA follow-up.

{{rnd/agents/summary.md}}
