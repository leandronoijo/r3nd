---
name: run-e2e-tests
description: Write and run a small reusable E2E suite through normal repository tooling without AI.
---

# Run E2E Tests — Prototyping

Write durable test code that proves the primary flow through the real application and can be rerun by developers or CI without AI.

{{rnd/agents/shared/prototyping.md}}
{{rnd/agents/shared/command-hygiene.md}}

Run this skill only when the user selected **reusable E2E test code** or invoked this skill directly. Do not use it for the manual-QA-only path.

## Inputs

- A test-case file under `rnd/test_cases/`
- Relevant tech spec and build plans
- Implemented code, manifests, startup commands, and existing E2E examples

## Outputs

- E2E tests in the repository's existing location
- A short result under `rnd/e2e-results/<feature-id>-e2e-result.md`
- Normal runner artifacts for failures only

The executable test files are the main output. A prose report or one-off AI interaction does not satisfy this skill.

## Workflow

1. Read the selected cases and inspect the repository's existing E2E runner, examples, scripts, and startup path.
2. Reuse the current E2E framework and fixtures. Do not introduce a second runner. For a browser project with no runner, use Playwright unless the user chooses another tool; ask before adding a substantial dependency.
3. Run one representative browser or runtime locally. Cross-browser matrices are out of scope unless requested.
4. Start only required services through the smallest existing Docker Compose setup in detached mode. If none exists, add only the minimal app and dependency services needed by the selected flow.
5. Use deterministic minimal fixtures or seed data. Do not build a large fixture framework for a small prototype.
6. Implement durable E2E test files and wire them into a normal repository command that does not require AI.
7. Prefer stable accessible locators or the repository's existing selector convention. Add `data-test-id` only when a stable locator is otherwise unavailable.
8. Run the primary happy path first, then only the listed obvious edge cases.
9. Keep the result concise: reusable command, cases, status, blocking error, and failure artifact paths. Keep screenshots, traces, videos, and verbose logs for failures only.
10. Do not create or run integration tests as a substitute for E2E coverage.

## Failure Handling

- Classify a failure as environment/test-method or product behavior.
- Repair a blocking environment or test-method problem at most twice.
- Return a blocking product defect to the implementation workflow for a focused fix, subject to the same two-cycle limit.
- After two unsuccessful attempts at the same failure, stop and ask the user with evidence.
- Ask before investigating or fixing anything that does not block the required flow.

## Done

Every selected case exists as reusable test code and is passed, failed with a clear blocking diagnosis, or stopped after the retry limit with a focused request for help. Do not add extra cases merely because the environment is already running.
