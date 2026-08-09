---
name: run-manual-qa-tests
description: Have the AI exercise selected acceptance criteria against the live prototype and report concise evidence.
---

# Run Manual QA — Prototyping

Use AI-driven interaction with the running system to check that the requested result works now. This is a live verification run, not reusable automated test code.

{{rnd/agents/shared/prototyping.md}}
{{rnd/agents/shared/command-hygiene.md}}

## When To Run

Run this skill only after the owning full-control or `implement-feature` workflow asks which post-implementation QA the user wants and the user selects **AI-run manual QA** or **both**.

Do not require or create a file under `rnd/test_cases/`. Read the primary acceptance criteria directly from the tech spec and completed build plans. If the user supplied a focused inline scenario, use that instead.

## Difference From Reusable E2E

- Manual QA is performed by the AI through browser interaction, `curl`, CLI commands, logs, or another live interface.
- It proves the current environment behaved correctly during this run.
- It does not create a durable test suite and cannot be rerun later without another operator or AI session.
- `run-e2e-tests` instead writes executable test files that developers and CI can rerun without AI.

## Inputs

- Relevant tech spec and completed build plans, or one inline reproduction/acceptance scenario
- Current codebase and minimal runtime instructions
- Existing test accounts or fixtures when available

## Outputs

- A concise report at `rnd/manual-qa-results/<feature-id>-manual-qa-result.md`
- Failure artifacts only when they materially help diagnosis

Do not create per-step evidence files, hashes, screenshot sequences, or a large audit bundle unless the user explicitly requests auditable evidence.

## Workflow

1. Extract the primary happy path and only the most obvious relevant edge case from the acceptance criteria.
2. Start the smallest required environment, preferring existing Docker Compose services in detached mode.
3. Exercise the live system through its real user, API, or CLI boundary.
4. Record the exact action or command, expected result, observed result, and pass/fail status.
5. Capture a screenshot, trace, response transcript, or focused log only for a failure or when it makes the result materially clearer.
6. Write the short result report and summarize the verdict.

## Failure Handling

- Correct a blocking environment or QA-method problem at most twice.
- Return a blocking product failure to the implementation workflow for a focused fix, still subject to the shared two-cycle limit.
- After the second unsuccessful attempt at the same failure, stop and ask the user with the evidence collected.
- Ask before investigating warnings, adjacent defects, or other findings that do not block the selected acceptance flow.

## Result Format

```markdown
# Manual QA Result — <feature-id>

- **Environment:** <how it was run>
- **Verdict:** PASS | FAIL | BLOCKED

## Checks

- `<check>` — PASS | FAIL | BLOCKED
  - Action: `<command or interaction>`
  - Expected: <result>
  - Observed: <result>
  - Artifact: <path or None>

## Blocking Issue

None | <concise failure and next decision needed>
```
