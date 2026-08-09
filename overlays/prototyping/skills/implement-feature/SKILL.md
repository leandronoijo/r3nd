---
name: implement-feature
description: Run the semi-control workflow from an approved short tech spec to a unit-tested prototype with user-selected QA.
---

# Implement Feature — Prototyping Semi-Control

Coordinate an approved tech spec through planning, implementation, and user-selected verification without production-process ceremony.

{{rnd/agents/shared/prototyping.md}}
{{rnd/agents/shared/command-hygiene.md}}

## Input

- An approved tech-spec file or feature directory under `rnd/tech_specs/`
- Relevant repository code and scoped instructions
- Existing build plans and test cases when present

Invoking this skill with an approved tech spec authorizes implementation. Do not add another approval gate for generated build plans unless a blocking choice changes the approved behavior or contracts.

## Minimal Outputs

- Short build plans under `rnd/build_plans/` when missing
- Working code and focused unit tests
- Optional concise cases and reusable E2E test code when selected
- Optional manual-QA result when selected
- One concise `run-summary.md` under `rnd/agent_runs/<feature-id>/` only when the invoking tool requires a run artifact

Do not create dependency-plan JSON, per-phase state bundles, test-case files, QA artifacts, integration-test artifacts, or retros unless the workflow selection requires them.

## Workflow

### 1. Resolve

1. Read the tech spec and inspect only affected code and instructions.
2. Identify tasks and actual dependencies.
3. Ask immediately if a missing decision changes behavior, data, contracts, or technology. Otherwise use and record the simplest reversible assumption.

### 2. Assure Plans

1. Reuse valid existing plans.
2. Generate missing plans with `rnd/skills/create-build-plan/SKILL.md`.
3. Keep the execution order as a short checklist in the session or run summary; do not build a separate coordination system.

### 3. Implement

1. Execute plans with `rnd/skills/implement-build-plan/SKILL.md` in dependency order.
2. Parallelize only truly independent work when it will save time.
3. Keep interfaces consistent with the tech spec and implement focused unit tests alongside code.
4. Do not create integration tests.
5. Tell delegated plan implementers to defer the QA-choice prompt to this coordinator.

### 4. Choose QA

After implementation and unit tests finish, ask exactly:

`Which post-implementation QA do you want: AI-run manual QA, reusable E2E test code, both, or neither?`

Then follow the selected path:

- **AI-run manual QA:** Use `rnd/skills/run-manual-qa-tests/SKILL.md` directly from the tech-spec and build-plan acceptance criteria. Do not create a test-case document.
- **Reusable E2E test code:** Create 1–6 high-value cases with `rnd/skills/create-test-cases/SKILL.md`, then use `rnd/skills/run-e2e-tests/SKILL.md` to write and run durable tests through the repository's normal tooling.
- **Both:** Complete both paths.
- **Neither:** Create no test cases, E2E files, E2E result, or manual-QA result. Report that verification stopped at focused unit tests.

### 5. Finish

Report implemented behavior, assumptions, commands, unit results, selected QA results, skipped QA paths, and non-blocking findings. Leave the repository runnable.

## Fix Loops

- Enter a fix loop only for a blocking implementation, build, unit-test, selected QA, or environment failure.
- Make at most two focused repair-and-verification cycles for the same failure.
- After the second unsuccessful cycle, stop and ask the user with the evidence and exact help needed.
- For a non-blocking issue, ask the user whether to address it instead of starting a fix loop.
