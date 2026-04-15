---
name: run-manual-qa-tests
description: Execute live manual QA from written cases or an inline repro case, capture artifacts, and write a structured result report.
---

# run-manual-qa-tests

Execute live manual QA from written cases or an inline repro case, capture artifacts, and write a structured result report.

{{rnd/agents/manual-qa-tester.md}}
{{rnd/agents/shared/command-hygiene.md}}

## Purpose

Validate real feature behavior against a running environment. Use written test cases when they exist, or a focused inline reproduction case when an orchestrator needs bug reproduction or post-fix verification.

This skill is the final evidence gate for live verification. Unit tests, integration tests, and static inspection can inform setup, but they do not count as acceptance evidence.

## Inputs

- `rnd/test_cases/<feature-id>-test-cases.md` when available
- Inline custom repro case from a parent skill when no saved test-case file exists
- Relevant build plans under `rnd/build_plans/`
- Optional product spec and tech spec under `rnd/product_specs/` and `rnd/tech_specs/`
- Relevant `rnd/instructions/*.instructions.md` files
- `rnd/templates/manual-qa-result.md`
- Current codebase, runtime scripts, test accounts, and observable side-effect tooling

## Outputs

- Result report: `rnd/manual-qa-results/<feature-id>-manual-qa-result.md`
- Artifacts directory: `rnd/manual-qa-results/<feature-id>/artifacts/`

## Hard Rules

1. Execute the written cases or inline repro case against a live environment.
2. Capture at least one artifact per executed case from the current run.
3. Do not treat unit tests, integration tests, or code inspection as acceptance evidence.
4. Read the relevant repo instructions before bringing up the environment.
5. If a required case is failed, blocked, or missing evidence, the overall verdict is `REJECTED`.

## Workflow

### 1. Context and Scope

1. Read the written test cases or the inline repro case.
2. Read the relevant build plans, specs, and `rnd/instructions/` files.
3. Open `rnd/templates/manual-qa-result.md` and use it as the report structure.
4. Identify the observable artifacts needed for each case.

### 2. Environment Bring-Up

1. Follow the repository instructions for startup, ports, accounts, and seed data.
2. Start the required services and confirm health before executing cases.
3. If bring-up fails, stop, capture evidence, and mark the run `REJECTED`.

### 3. Live Test Execution

1. Prepare the required data, accounts, auth state, or fixtures.
2. Execute the case through the real system using browser automation, `curl`, CLI tools, logs, or DB queries as appropriate.
3. Capture at least one artifact per case under `rnd/manual-qa-results/<feature-id>/artifacts/`.
4. Mark each case `PASSED`, `FAILED`, or `BLOCKED` based on observed behavior and evidence.

### 4. Focused Reproduction Mode

When a parent skill sends a single inline reproduction case:

1. Execute only that case unless told otherwise.
2. Preserve the same setup and steps for post-fix verification.
3. Report whether the bug was `REPRODUCED`, `NOT REPRODUCED`, or `BLOCKED`.
4. Still write a normal manual QA result with artifacts.

### 5. Result Reporting

1. Write the final report to `rnd/manual-qa-results/<feature-id>-manual-qa-result.md`.
2. Include per-case artifact references and a clear overall verdict.
3. Separate environment blockers, methodology problems, and product defects in the summary when relevant.

## Evidence Sources

- Browser interactions and screenshots
- Saved API responses or request/response transcripts
- CLI output
- Database query results
- Relevant logs or file side effects from the current run

## File I/O and Scope

- Read: `rnd/test_cases/`, `rnd/build_plans/`, `rnd/product_specs/`, `rnd/tech_specs/`, `rnd/instructions/`, `rnd/templates/manual-qa-result.md`, and the current codebase
- Write: `rnd/manual-qa-results/` only
- Do not approve behavior without fresh artifacts from the current run

## Communication Style

- Be concise, factual, and evidence-first.
- State what was executed, what was observed, and what artifacts prove it.
- If blocked, say exactly what failed and what follow-up is required.

{{rnd/agents/summary.md}}
