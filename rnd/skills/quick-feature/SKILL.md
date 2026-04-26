---
name: quick-feature
description: Investigate, gate, plan, implement, and QA a very small feature with explicit approval and tight scope.
---

# quick-feature

Deliver a very small feature safely by investigating first, enforcing a hard eligibility gate, writing exactly one build plan, waiting for explicit approval, then implementing and verifying with automated checks plus live QA.

{{rnd/agents/shared/command-hygiene.md}}

## Purpose

Keep tiny feature work tiny. If the request needs structural refactoring, multi-task planning, schema redesign, or broader coordination, stop and redirect to the standard repo workflow (`create-tech-spec` -> `create-build-plan` -> `implement-feature`).

## Inputs

- User request or feature description
- Current repository code and tests
- repo/app/module-scoped `AGENTS.md` / `CLAUDE.md` files relevant to the touched area
- `rnd/templates/build_plan.md`
- `rnd/templates/test_cases.md` when written checks are needed

## Outputs

- Investigation notes and an eligibility decision in the session
- Exactly one build plan at `rnd/build_plans/<feature-id>-T1-build-plan.md`
- Implemented code and tests in the current codebase
- Automated check results and live QA evidence in the session
- Optional interaction summary in `rnd/agent_summaries/<agent-id>-<timestamp>.md` when the user is satisfied

## Hard Eligibility Limits

Only continue in quick-feature mode if all of the following are true:

1. No structural repository change.
2. No database entity redesign.
3. At most 3 added columns to one existing table.
4. Estimated implementation is no more than 10 edited files.
5. Estimated implementation is no more than 50 lines of code.

If any limit is violated or unclear, stop and redirect to the standard workflow. Do not partially plan or implement out-of-bounds work inside quick-feature.

## Delegation Contract

1. Every phase in the checklist must run in a separate teammate or sub-agent context when the environment supports it.
2. Never satisfy a phase by reusing this orchestrator skill as the phase skill. Phase work must use a phase-specific skill when one exists.
3. If no phase-specific skill exists in the current skillset, delegate the phase with the closest agent markdown file as the operating brief.
4. Do not mark a phase complete until it has been executed in its own separate context with either the listed skill or the listed agent brief.
5. Each handoff must be compact: checklist state, exact scope, output path, acceptance criteria, blockers, and any already-produced artifacts, plus the relevant skill or agent markdown path.
6. After each phase, persist a short context summary to the phase tracker so the next phase can start from artifacts instead of conversation memory.
7. If teammates or sub-agents are unavailable, compact that context yourself before moving to the next phase.

## Phase Tracking (Mandatory)

Before starting any work, create a persistent phase checklist using the environment task tracker or `/tmp/quick-feature-<feature-id>-phases.md`.

**Required checklist:**

```md
- [ ] Phase 1: Investigation (separate context required; no phase skill exists; use `rnd/agents/team-lead.md`)
- [ ] Phase 2: Eligibility gate (separate context required; no phase skill exists; use `rnd/agents/team-lead.md`)
- [ ] Phase 3: Build plan (required skill: `create-build-plan`; fallback: `rnd/agents/team-lead.md`)
- [ ] Phase 4: Implementation (required skill: `implement-build-plan`; fallback: `rnd/agents/developer.md`)
- [ ] Phase 5: QA (required skills: `create-test-cases` when needed, `run-e2e-tests` when needed, `run-manual-qa-tests` as final gate; fallbacks: `rnd/agents/qa-team-lead.md`, `rnd/agents/e2e-engineer.md`, `rnd/agents/manual-qa-tester.md`)
- [ ] Wrap-up: Interaction log written
```

**Rules:**

- Mark a phase complete only after it is fully done.
- Mark a phase complete only after the required skill or documented fallback agent markdown has been used for that phase in a separate context.
- Re-read the checklist after each phase before continuing.
- If context is compressed or lost, re-read the tracking file before proceeding.
- Never skip a phase. If one is not applicable, mark it done with a note and move on.

## Workflow

### 1. Investigation

Separate context required.
No phase-specific skill exists.
Use agent brief: `rnd/agents/team-lead.md`

1. Inspect the codebase before proposing any change.
2. Search for existing modules, routes, components, tests, plans, and instruction files related to the request.
3. Explain what the current code appears to do and why the request fits or conflicts with that intent.
4. Challenge the user on scope, risk, and whether a smaller change would solve the problem.

### 2. Eligibility Gate

Separate context required.
No phase-specific skill exists.
Use agent brief: `rnd/agents/team-lead.md`

1. Classify the request as `ELIGIBLE`, `NOT_ELIGIBLE`, or `AMBIGUOUS`.
2. If the request is not eligible, or if scope is ambiguous, stop and explain why.
3. Only proceed when the work clearly fits the hard limits above.

### 3. Build Plan

Required skill: `create-build-plan`
Fallback teammate brief: `rnd/agents/team-lead.md`

1. Use `rnd/agents/team-lead.md` and `rnd/templates/build_plan.md` to draft exactly one build plan.
2. The plan must be a single `T1` scope and saved to `rnd/build_plans/<feature-id>-T1-build-plan.md`.
3. Replace missing source material with concise Functional Requirements and Non-Functional Requirements derived from the request and investigation.
4. Keep the plan faithful to the repository’s existing patterns and avoid inventing new architecture.
5. Show the saved plan to the user and wait for explicit approval before coding.
6. Ask the standalone approval question exactly: `Do you approve this build plan and want me to implement it now? (yes/no)`
7. Do not treat any other reply as implementation approval.

### 4. Implementation

Required skill: `implement-build-plan`
Fallback teammate brief: `rnd/agents/developer.md`

1. After explicit approval, implement via `rnd/agents/developer.md`.
2. Keep the implementation inside the quick-feature contract.
3. Run the smallest useful automated checks first, then expand only if needed.
4. If a check fails, fix it and rerun the relevant checks before moving on.
5. If the work expands beyond the limits, stop and say it needs the broader workflow.

### 5. QA

Required skills: `create-test-cases` when useful, `run-e2e-tests` for automated flow coverage, then `run-manual-qa-tests` as the final gate
Fallback teammate briefs: `rnd/agents/qa-team-lead.md`, `rnd/agents/e2e-engineer.md`, `rnd/agents/manual-qa-tester.md`

1. Generate concise test cases when written checks are useful, using `rnd/templates/test_cases.md` and `rnd/agents/qa-team-lead.md`.
2. Run targeted E2E coverage when the feature benefits from executable flow validation, following `rnd/agents/e2e-engineer.md` and the repo testing instructions.
3. Bring up the real environment yourself for live verification unless a concrete blocker prevents it.
4. Validate the feature with evidence using the repo’s normal runtime tools, browser automation, `curl`, logs, or CLI access as appropriate.
5. Treat automated tests as preparation only; they do not replace live verification.
6. If QA fails, iterate on implementation and rerun the affected checks until the feature passes or a hard blocker is reached.

## Operating Rules

- Create a persistent phase checklist in a task tracker or in `/tmp/quick-feature-<feature-id>-phases.md` and update it after each phase.
- Re-read the checklist after each phase so progress stays explicit.
- Start the required services, servers, containers, and supporting processes yourself when live verification needs them.
- Do not ask the user to bring up the environment unless you are blocked by missing credentials, missing dependencies, permissions, or a genuinely risky operation.
- Keep the work scoped to the current feature; do not drift into broader cleanup or refactoring.
- Preserve the repository’s conventions and golden references.

## File I/O and Scope

- Read: the current codebase, repo/app/module-scoped `AGENTS.md` / `CLAUDE.md` files, and the repo templates needed for the task.
- Write: `rnd/build_plans/`, current codebase files, `rnd/test_cases/` when needed, `rnd/manual-qa-results/` for final live QA, and `rnd/agent_summaries/` when the user is satisfied.
- Do not modify unrelated files or expand the scope beyond the approved quick feature.

## Communication Style

- Be direct about scope, eligibility, blockers, and verification status.
- Keep the user informed after investigation, after plan approval, after implementation, and after QA.
- Separate facts from assumptions and call out when the request should move to the standard workflow.

{{rnd/agents/summary.md}}
