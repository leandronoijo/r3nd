---
name: run-manual-qa-tests
description: Execute live manual QA from written cases or an inline repro case, capture verifiable artifacts, and write a structured result report.
---

# run-manual-qa-tests

Execute live manual QA from written cases or an inline repro case, capture verifiable artifacts, and write a structured result report.

{{rnd/agents/manual-qa-tester.md}}
{{rnd/agents/shared/command-hygiene.md}}

## Cost Profile

Unless strictly required for correctness, safety, or tool compatibility, run this skill on the cheapest available model tier for the current platform.

Examples by platform:

- Codex: use the cheapest Codex/GPT tier first (for example, `gpt-5.4-mini`); only escalate if required.
- Claude: use Haiku-class first; only escalate if required.
- Copilot: use `GPT-5 mini` (the unlimited tier) first; only escalate if required.
- Gemini: use the fast tier first (not Pro); only escalate if required.
- Cursor: use Claude Haiku first; only escalate if required.

## Purpose

Validate real feature behavior against a running environment. Use written test cases when they exist, or a focused inline reproduction case when an orchestrator needs bug reproduction or post-fix verification.

This skill is the final evidence gate for live verification. Unit tests, integration tests, and static inspection can inform setup, but they do not count as acceptance evidence.

## Inputs

- `rnd/test_cases/<feature-id>-test-cases.md` when available
- Inline custom repro case from a parent skill when no saved test-case file exists
- Relevant build plans under `rnd/build_plans/`
- Optional product spec and tech spec under `rnd/product_specs/` and `rnd/tech_specs/`
- Relevant `AGENTS.md` / `CLAUDE.md` files
- `rnd/templates/manual-qa-result.md`
- Current codebase, runtime scripts, test accounts, and observable side-effect tooling

## Outputs

- Result report: `rnd/manual-qa-results/<feature-id>-manual-qa-result.md`
- Artifacts directory: `rnd/manual-qa-results/<feature-id>/artifacts/`

## Hard Rules

1. Execute the written cases or inline repro case against a live environment.
2. For every executed case, capture at least one fresh raw artifact from the current run.
3. No case may be marked `PASSED` without at least one valid raw artifact path and hash.
4. Do not treat unit tests, integration tests, or code inspection as acceptance evidence.
5. Read the relevant repo instructions before bringing up the environment.
6. If a required case is failed, blocked, missing artifacts, or has unverifiable artifacts, the overall verdict is `REJECTED`.

## Workflow

### 1. Context and Scope

1. Read the written test cases or the inline repro case.
2. Read only the relevant build plans, specs, and repo/app/module-scoped `AGENTS.md` / `CLAUDE.md` files.
3. Open `rnd/templates/manual-qa-result.md` and use it as the report structure.
4. Identify the minimum observable artifacts needed for each case.

### 2. Environment Bring-Up

1. Follow the repository instructions for startup, ports, accounts, and seed data.
2. Start the required services and confirm health before executing cases.
3. If bring-up fails, stop, capture evidence, and mark the run `REJECTED`.

### 3. Live Test Execution

1. Prepare the required data, accounts, auth state, or fixtures.
2. Execute each case through the real system using browser automation, `curl`, CLI tools, logs, or DB queries as appropriate.
3. Capture artifacts under `rnd/manual-qa-results/<feature-id>/artifacts/`.
4. Mark each case `PASSED`, `FAILED`, or `BLOCKED` based on observed behavior and evidence.

## Evidence Policy (Strict and Cheap)

For each executed case, create `artifacts/<case-id>.evidence.txt` containing:

- case id and timestamp
- exact command(s) or action(s) executed
- expected behavior
- observed behavior
- verdict rationale
- list of raw artifact files for that case

Then compute and store SHA-256 hashes for every raw artifact referenced by that case.

Accepted raw artifact types (prefer text-first):

- saved API request/response transcripts
- CLI output files
- filtered logs
- DB query plus returned rows
- browser assertion dumps (URL, title, key DOM text, accessible labels, status indicators)

Screenshot policy:

- `FAILED` or `BLOCKED` case: at least one screenshot is required.
- `PASSED` case: screenshot is optional.
- Do not capture step-by-step screenshot sequences unless explicitly requested.

If an artifact is missing, unreadable, or hash generation fails, mark the case `BLOCKED`.

### 4. Focused Reproduction Mode

When a parent skill sends a single inline reproduction case:

1. Execute only that case unless told otherwise.
2. Preserve the same setup and steps for post-fix verification.
3. Report whether the bug was `REPRODUCED`, `NOT REPRODUCED`, or `BLOCKED`.
4. Still write a normal manual QA result with artifacts and hashes.

### 5. Result Reporting

1. Write the final report to `rnd/manual-qa-results/<feature-id>-manual-qa-result.md`.
2. For each case, include: `case_id`, `steps_executed`, `expected`, `observed`, `artifact_paths`, `artifact_hashes`, and `verdict`.
3. Include per-case artifact references and a clear overall verdict.
4. Separate environment blockers, methodology problems, and product defects in the summary when relevant.
5. Do not paste large raw outputs into the report; store full outputs in artifact files and summarize briefly.

## Evidence Sources

- Browser interactions and assertion dumps
- Saved API responses or request/response transcripts
- CLI output
- Database query results
- Relevant logs or file side effects from the current run
- Screenshots (required for failed/blocked cases)

## File I/O and Scope

- Read: `rnd/test_cases/`, relevant files under `rnd/build_plans/`, `rnd/product_specs/`, `rnd/tech_specs/`, repo/app/module-scoped `AGENTS.md` / `CLAUDE.md` files, `rnd/templates/manual-qa-result.md`, and the current codebase
- Write: `rnd/manual-qa-results/` only
- Do not approve behavior without fresh artifacts and hashes from the current run

## Communication Style

- Be concise, factual, and evidence-first.
- State what was executed, what was observed, and what artifacts prove it.
- If blocked, say exactly what failed and what follow-up is required.

{{rnd/agents/summary.md}}
