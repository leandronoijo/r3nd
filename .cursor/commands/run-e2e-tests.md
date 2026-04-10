# run-e2e-tests

Generate, run, and diagnose E2E tests from test cases; output structured results to rnd/e2e-results.

{{rnd/agents/e2e-engineer.md}}
{{rnd/agents/shared/command-hygiene.md}}

## Cursor-Specific Instructions

When using Cursor to implement and run E2E tests:

- Read `rnd/instructions/e2e-testing.instructions.md` and nearby tests before generating new coverage.
- Use Cursor's terminal integration to start services, run tests, and capture failures.
- Search for existing E2E tests with Cmd+P to follow established patterns.
- Use Composer to generate or refine test files in the appropriate E2E directory.
- Use Cmd+K to inspect selectors and `data-test-id` usage in the codebase.
- Use Apply to write the result report under `rnd/e2e-results/`.

{{rnd/agents/summary.md}}
