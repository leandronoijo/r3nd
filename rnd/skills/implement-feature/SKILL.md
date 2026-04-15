---
name: implement-feature
description: Coordinate feature delivery with dependency-aware implementation, task-level QA, and final live QA.
---

# implement-feature

Coordinate feature delivery with dependency-aware implementation, task-level QA, and final live QA.

{{rnd/agents/implement-feature.md}}
{{rnd/agents/shared/command-hygiene.md}}

## Purpose

Drive a feature from tech spec to verified implementation by coordinating build-plan generation when needed, dependency-aware task execution, task-level QA gates, written test cases, and final live QA.

## Inputs

- Tech spec: `rnd/tech_specs/.../<date>-tech-spec-<feature-id>.md`
- Feature directory with the matching spec artifacts
- Build plans: one `-T<n>-build-plan.md` file per task
- Optional test cases: `rnd/test_cases/...`
- Current codebase, tests, and relevant `rnd/instructions/` files

## Outputs

- Implemented code and tests in the current codebase
- Run artifacts under `rnd/agent_runs/<feature-id>/implement-feature-<timestamp>/`
- Final completion status based on the final live-QA result

### Minimum Artifact Set

- `dependency-plan.json`
- `execution-plan.json`
- `task-results-*.json`
- `task-qa-*.json`
- `qa-result-cycle-*.json`
- `run-summary.md`

## Non-Negotiable Rules

1. Act as the coordinator first; do not collapse the workflow into a single implementation pass.
2. Never start implementation without task build-plan files.
3. If invoked from a tech spec and task build plans are missing, generate them first through the team-lead workflow.
4. Only run dependency-independent tasks in parallel; preserve strict dependency order otherwise.
5. Every task must pass a task-level QA gate before dependent tasks continue.
6. If written test cases are missing, generate them before the final QA phase.
7. Final live QA from written test cases is always required.
8. Mark the run successful only when the final live-QA status is `PASS`.
9. Keep coordinator state explicit between delegation cycles so task ordering, gate status, and blockers remain visible.
10. Persist coordinator, worker, task-gate, and final QA artifacts after each cycle.

## Delegation Contract

1. Every phase in the checklist must run in a separate teammate or sub-agent context when the environment supports it.
2. Never satisfy a phase by reusing this orchestrator skill as the phase skill. Phase work must use a phase-specific skill when one exists.
3. If no phase-specific skill exists in the current skillset, delegate the phase with the closest distinct agent markdown file as the operating brief.
4. Do not point a phase back to this orchestrator's own agent file as its fallback. If no distinct agent brief exists, say so explicitly.
5. Do not mark a phase complete until it has been executed in its own separate context with either the listed skill or the listed agent brief.
6. Each handoff must include only the phase-local context: current checklist state, exact inputs, required output path, acceptance criteria, blockers, and the relevant skill or agent markdown path.
7. After each phase, persist a compact handoff note in the phase tracker or run artifacts with: completed work, decisions, produced artifacts, open blockers, and next phase.
8. If teammates or sub-agents are unavailable, compact the context yourself between phases before continuing. Never rely on long implicit memory across phases.

## Phase Tracking (Mandatory)

Before starting any work, create a persistent phase checklist using the environment task tracker or `/tmp/implement-feature-<feature-id>-phases.md`.

**Required checklist:**

```md
- [ ] Phase 0: Resolve context (separate context required; no phase skill exists; no distinct agent brief exists)
- [ ] Phase 1: Build-plan assurance (required skill: `create-build-plan`; fallback: `rnd/agents/team-lead.md`)
- [ ] Phase 2: Dependency plan (separate context required; no phase skill exists; no distinct agent brief exists)
- [ ] Phase 3: Execution plan todo (separate context required; no phase skill exists; no distinct agent brief exists)
- [ ] Phase 4: Task execution (required skills: `implement-build-plan` + `run-e2e-tests`; fallbacks: `rnd/agents/developer.md` + `rnd/agents/e2e-engineer.md`)
- [ ] Phase 5: Test cases (required skill: `create-test-cases`; fallback: `rnd/agents/qa-team-lead.md`)
- [ ] Phase 6: Final live QA (required skill: `run-manual-qa-tests`; fallback: `rnd/agents/manual-qa-tester.md`)
- [ ] Phase 7: Fix loop (required skills: `implement-build-plan` + `run-e2e-tests` + `run-manual-qa-tests`; fallbacks: `rnd/agents/developer.md` + `rnd/agents/e2e-engineer.md` + `rnd/agents/manual-qa-tester.md`)
- [ ] Wrap-up: Interaction log written
```

**Rules:**

- Mark a phase complete only after it is fully done.
- Mark a phase complete only after the required skill or documented fallback agent markdown has been used for that phase in a separate context.
- Re-read the checklist after each phase before continuing.
- If context is compressed or lost, re-read the tracking file before proceeding.
- Never skip a phase. If one is not applicable, mark it done with a note and move on.

## Workflow

### 1. Resolve Context

Separate context required.
No phase-specific skill exists.
No distinct agent brief exists.

1. Resolve the feature id and locate the tech spec.
2. Locate the feature build plans and any existing test-case files.
3. Read the current codebase and relevant `rnd/instructions/` files before scheduling work.

### 2. Build-Plan Assurance

When plans are missing:
- Required skill: `create-build-plan`
- Fallback teammate brief: `rnd/agents/team-lead.md`

When plans already exist:
- Separate context required.
- No phase-specific skill exists.
- No distinct agent brief exists.

If task build-plan files are missing:

1. Delegate to the team-lead workflow.
2. Generate one build plan per task from the tech spec task breakdown.
3. Preserve task ids and dependency ordering exactly.
4. Continue only after the required task files exist.

### 3. Dependency Planning

Separate context required.
No phase-specific skill exists.
No distinct agent brief exists.

1. Parse the task breakdown and dependencies from the tech spec.
2. Build a dependency graph for the available build-plan tasks.
3. Validate the graph before scheduling any work.

### 4. Execution Todo

Separate context required.
No phase-specific skill exists.
No distinct agent brief exists.

Create a coordinator todo list with per-task gates:

- `[ ] Tn implement`
- `[ ] Tn task-qa-gate`

Do not begin dependent work until the corresponding `Tn task-qa-gate` item is `PASS`.

### 5. Task Execution

Required skills: `implement-build-plan` for implementation, then `run-e2e-tests` for the task gate
Fallback teammate briefs: `rnd/agents/developer.md`, then `rnd/agents/e2e-engineer.md`

For each dependency-ready task:

1. Delegate implementation to a developer worker.
2. Run a task-level QA gate against that task's acceptance criteria.
3. Record task and QA artifacts for the cycle.
4. If the task gate fails, stop forward scheduling and enter the fix loop.

### 6. Test Cases

Required skill: `create-test-cases`
Fallback teammate brief: `rnd/agents/qa-team-lead.md`

If no written test-case file exists:

1. Delegate test-case generation to the QA team-lead workflow.
2. Save the result under `rnd/test_cases/`.

### 7. Final Live QA

Required skill: `run-manual-qa-tests`
Fallback teammate brief: `rnd/agents/manual-qa-tester.md`

1. Run live manual QA against the written test cases.
2. Record the result artifact from `rnd/manual-qa-results/`.
3. Do not skip this step even if all task gates passed.

### 8. Fix Loop

Required skill sequence: `implement-build-plan` -> `run-e2e-tests` -> `run-manual-qa-tests`
Fallback teammate briefs: `rnd/agents/developer.md` -> `rnd/agents/e2e-engineer.md` -> `rnd/agents/manual-qa-tester.md`

On task-gate or final live-QA failure:

1. Create a focused fix assignment for the impacted scope.
2. Re-run the affected implementation task(s) and task gates.
3. Re-run final live QA when the impacted scope is stable.
4. Repeat until the final QA status is `PASS` or a hard blocker is identified.

## Task-Specific Instructions

- Use delegated teammates or sub-agents when the environment supports them.
- Keep coordinator state explicit between delegation cycles so task ordering and QA status remain visible.
- Keep outputs concise and factual.

## File I/O and Scope

- Read `rnd/tech_specs/`, `rnd/build_plans/`, `rnd/test_cases/`, the current codebase, and `rnd/instructions/`.
- Write implementation artifacts only under `rnd/agent_runs/<feature-id>/implement-feature-<timestamp>/`.
- Use `rnd/manual-qa-results/` for the final live-QA report and artifacts.
- Do not skip build-plan generation, task QA, or final live QA.

## Communication Style

- Be direct about task status, blockers, and gate results.
- Report progress after each major phase.
- If the run fails at any phase, say so directly with the reason and evidence.

{{rnd/agents/summary.md}}
