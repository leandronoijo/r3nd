---
name: run-e2e-tests
description: Write and run a small reusable MVP E2E suite through production-like runtime and normal tooling.
---

# Run E2E Tests — MVP

Write durable tests that protect the selected MVP flows and can be rerun by developers or CI without AI.

{{rnd/agents/shared/mvp.md}}
{{rnd/agents/shared/command-hygiene.md}}

Run this skill only when the user selects **reusable E2E test code** or invokes it directly. Do not use it for the manual-QA-only path.

## Inputs

- A test-case file under `rnd/test_cases/`
- Relevant tech spec and build plans
- Implemented code, CI, production Docker/Compose files, startup commands, and existing E2E examples

## Outputs

- E2E tests in the repository's existing location
- A normal developer command that runs them without AI
- A short result under `rnd/e2e-results/<feature-id>-e2e-result.md`
- Normal runner artifacts for failures only

## Workflow

1. Read the selected cases and inspect the existing E2E runner, fixtures, CI jobs, and production startup path.
2. Reuse the current framework and selector conventions. Do not introduce a second runner. For a browser project with none, use Playwright unless the user chooses another tool; ask before adding a substantial dependency.
3. Prefer the production image/configuration over a development server when it is reasonably runnable. Start only required services in detached mode and verify health/readiness before tests.
4. Use deterministic minimal fixtures. Create separate principals or tenants only when a selected authorization/isolation case requires them.
5. Implement the primary flow first, then only the listed production-boundary cases.
6. Keep secrets out of test source, output, screenshots, and CI. Use the repository's test-secret or environment convention.
7. Wire the suite into a normal command. Add it to required CI only when it is deterministic, affordable, and protects a critical release flow; otherwise document the explicit trigger and reason.
8. Run one representative environment or browser. Cross-browser and scale matrices are out of scope unless requested.
9. Record the reusable command, cases, status, blocking error, runtime used, and failure artifact paths.
10. Stop only services started by this workflow.

## Failure Handling

- Classify failures as environment/test method, product behavior, security/tenant boundary, or compatibility/data behavior.
- Repair a blocking environment or test-method problem at most twice.
- Return a product failure for a focused implementation fix under the same two-cycle limit.
- After two unsuccessful attempts at the same failure, ask for help with evidence.
- Ask before investigating anything that does not block the selected cases.

## Done

Every selected case exists as reusable code and has passed, failed with a focused diagnosis, or stopped at the retry limit. The command is documented, and its CI placement is explicit.
