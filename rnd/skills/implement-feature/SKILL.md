---
name: implement-feature
description: Run coordinated feature implementation with a team-lead coordinator, developer workers, and QA teammates.
---

# implement-feature

Run coordinated feature implementation with a team-lead coordinator, developer workers, and QA teammates.

{{rnd/agents/implement-feature.md}}

## Purpose

Drive a feature from technical design to verified implementation by coordinating build-plan generation when needed, dependency-aware task execution, task-level QA gates, and final E2E validation.

## Inputs

- Tech spec path: `rnd/tech_specs/.../<date>-tech-spec-<feature-id>.md`
- Feature directory containing the spec-dir artifacts for the feature
- Build plans: one `-T<n>-build-plan.md` file per task from the tech spec
- Optional test cases: `rnd/test_cases/...`
- The current codebase, tests, and relevant `rnd/instructions/` files

## Outputs

- Implemented code and tests in the current codebase
- Required run artifacts under `rnd/agent_runs/<feature-id>/implement-feature-<timestamp>/`
- Final completion status based on the final E2E QA result

### Minimum Artifact Set

- `dependency-plan.json`
- `execution-plan.json`
- `task-results-*.json`
- `task-qa-*.json`
- `qa-result-cycle-*.json`
- `run-summary.md`

## Non-Negotiable Rules

1. Act as the coordinator first; do not collapse the workflow into a single undifferentiated implementation pass.
2. Never start implementation without task build-plan files.
3. If invoked from a tech spec and task build plans are missing, generate them first via the team lead workflow.
4. Only run dependency-independent tasks in parallel; preserve strict dependency order otherwise.
5. Every task must pass a task-level QA gate before dependent tasks continue.
6. If written test cases are missing, generate them before the final QA phase.
7. Final E2E QA from written test cases is always required.
8. Mark the run successful only when the final E2E QA status is `PASS`.
9. Keep coordinator state explicit between delegation cycles so task ordering, task-gate status, and blockers remain visible.
10. Persist coordinator, worker, task-gate, and final QA artifacts after each cycle.

## Workflow

### 1. Resolve Context

1. Resolve the feature id and locate the tech spec.
2. Locate the feature's build plans and any existing test-case files.
3. Read the current codebase and relevant `rnd/instructions/` files before scheduling work.

### 2. Build-Plan Assurance

If task build-plan files are missing:

1. Delegate to the team lead workflow.
2. Generate one build plan per task from the tech spec task breakdown.
3. Preserve task ids and dependency ordering exactly.
4. Continue only after the required task files exist.

### 3. Dependency Planning

1. Parse the task breakdown and dependencies from the tech spec.
2. Build a dependency graph for the available build-plan tasks.
3. Validate the graph before scheduling any work.

### 4. Execution Todo

Create a coordinator todo list with per-task gates:

- `[ ] Tn implement`
- `[ ] Tn task-qa-gate`

Do not begin dependent work until the corresponding `Tn task-qa-gate` item is `PASS`.

### 5. Task Execution

For each dependency-ready task:

1. Delegate implementation to a developer worker.
2. Run a task-level QA gate against that task's acceptance criteria.
3. Record task and QA artifacts for the cycle.
4. If the task gate fails, stop forward scheduling and enter the fix loop.

### 6. Test Cases

If no written test-case file exists:

1. Delegate test-case generation to the QA team lead workflow.
2. Save the result under `rnd/test_cases/`.

### 7. Final E2E QA

1. Run full E2E verification against the written test cases.
2. Record the result artifact.
3. Do not skip this step even if all task gates passed.

### 8. Fix Loop

On task-gate or final E2E failure:

1. Create a focused fix assignment for the impacted scope.
2. Re-run the affected implementation task(s) and task gates.
3. Re-run final E2E QA when the impacted scope is stable.
4. Repeat until the final QA status is `PASS` or a hard blocker is identified.

## Task-Specific Instructions

- Use delegated teammates or sub-agents when the environment supports them.
- Keep coordinator state explicit between delegation cycles so task ordering and QA status remain visible.

{{rnd/agents/summary.md}}
