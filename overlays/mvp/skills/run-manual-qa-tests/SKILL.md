---
name: run-manual-qa-tests
description: Exercise selected MVP acceptance criteria against the production-like runtime and report concise evidence.
---

# Run Manual QA — MVP

Use AI-driven interaction with the production-like system to verify selected acceptance behavior now. This is a live check, not reusable automated test code.

{{rnd/agents/shared/mvp.md}}
{{rnd/agents/shared/command-hygiene.md}}

## When To Run

Run only after the owning full-control or `implement-feature` workflow asks which QA the user wants and the user selects **AI-run manual QA** or **both**.

Do not require or create a file under `rnd/test_cases/`. Read acceptance criteria directly from the tech spec and completed build plans, or use a focused inline scenario supplied by the user.

## Inputs

- Relevant tech spec and completed build plans, or one inline acceptance/reproduction scenario
- Production Docker/Compose and runtime/configuration instructions
- Existing test accounts, tenant fixtures, and non-production secrets when needed

## Output

- A concise report at `rnd/manual-qa-results/<feature-id>-manual-qa-result.md`
- Failure artifacts only when they materially help diagnosis

## Workflow

1. Extract the primary happy path and only selected, directly relevant security, tenant, compatibility, or recovery edges.
2. Start the smallest production-like environment in detached mode and confirm health/readiness.
3. Exercise the real user, API, or CLI boundary. Use distinct authorized/unauthorized or tenant identities only when required by the acceptance criteria.
4. Confirm externally visible behavior and, when relevant, the expected safe error, migration result, health signal, or structured log without exposing sensitive values.
5. Record the exact action or command, expected result, observed result, and pass/fail status.
6. Capture a screenshot, response transcript, or focused log for failures or when it materially clarifies the result.
7. Write the concise result and stop only services started by this workflow.

## Failure Handling

- Correct a blocking environment or QA-method problem at most twice.
- Return a product, security/tenant, or compatibility failure for a focused implementation fix under the shared two-cycle limit.
- After two unsuccessful attempts at the same failure, ask for help with evidence.
- Ask before investigating warnings or adjacent issues that do not block the acceptance flow.

## Result Format

```markdown
# Manual QA Result — <feature-id>

- **Environment:** <production-like runtime used>
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
