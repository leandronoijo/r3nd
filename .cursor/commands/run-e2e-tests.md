# run-e2e-tests

Generate, run, and diagnose E2E tests from test cases; output structured results to rnd/e2e-results.

{{rnd/agents/e2e-engineer.md}}
{{rnd/agents/summary.md}}

## Cursor-Specific Instructions

When using Cursor to implement and run E2E tests:

- Read `.github/instructions/e2e-testing.instructions.md` using Cmd+K
- Use Cursor's terminal integration to start services and run tests
- Search for existing E2E tests with Cmd+P to follow patterns
- Use composer mode to generate test files in `tests/e2e/<feature-id>/`
- Leverage inline suggestions for test assertions and selectors
- Run tests in integrated terminal and capture output
- Use Cmd+K to query about `data-test-id` attributes in the codebase
- Write result reports to `rnd/e2e-results/` using Apply
