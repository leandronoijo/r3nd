# implement-feature

Run coordinated feature implementation with a team-lead coordinator, developer workers, and QA teammates.

## Agent Profiles
- `sdlc/agents/team-lead.md` (coordinator)
- `sdlc/agents/developer.md` (worker)
- `sdlc/agents/qa-team-lead.md` (test-case generation when missing)
- `sdlc/agents/e2e-engineer.md` (task-gate QA + final E2E QA)

## Non-Negotiable Rules
1. Never start implementation without build-plan task files.
2. If started from tech spec and build plans are missing, generate them first via team-lead sub-agent.
3. Every task must pass task-level QA gate before dependents are unblocked.
4. Final E2E QA from written test cases is always required.
5. Mark run success only when final E2E QA status is PASS.

## Input Modes
- Feature mode: `--feature-dir sdlc/build_plans/YYYY-MM-DD-<feature-id>/`
- Tech-spec mode: `--tech-spec sdlc/tech_specs/.../<date>-tech-spec-<feature-id>.md`

## Strict Workflow

### 1) Context Resolution
1. Resolve feature id/date from selected input.
2. Load tech spec.
3. Resolve build-plan folder.
4. Load existing test cases if present.

### 2) Build-Plan Assurance (Required)
If build-plan task files `-T<n>.md` are missing:
1. Delegate to team-lead sub-agent.
2. Generate one build-plan task file per Section 8 task.
3. Preserve task IDs exactly.
4. Continue only after files exist.

### 3) Dependency Planning
1. Parse Section 8 task dependencies.
2. Parse dependency graph edges.
3. Build and validate DAG against build-plan tasks.

### 4) Execution Todo (Mandatory)
Create a todo list with per-task gates:
- `[ ] Tn implement`
- `[ ] Tn task-qa-gate`

Example:
- `[ ] T1 implement`
- `[ ] T1 task-qa-gate`
- `[ ] T2 implement`
- `[ ] T2 task-qa-gate`

Gate rule: do not start dependent tasks before the corresponding `Tn task-qa-gate` is PASS.

### 5) Task Execution
For each dependency-ready task:
1. Implement with developer worker agent.
2. Execute task-level QA gate with e2e engineer agent against task acceptance criteria.
3. Record PASS/FAIL artifact for that task gate.
4. If FAIL, stop forward scheduling and enter fix flow.

### 6) Test Cases
If no test-case file exists:
1. Generate with qa-team-lead.
2. Save under `sdlc/test_cases/YYYY-MM-DD-<feature-id>/...`.

### 7) Final E2E QA (Always)
1. Run full E2E verification against written test cases.
2. Write PASS/FAIL result artifact.
3. Never skip this phase even if task gates passed.

### 8) Fix Loop
On final QA FAIL:
1. Coordinator creates fix assignment.
2. Re-run impacted tasks + task gates.
3. Re-run final E2E QA.
4. Repeat until PASS or max cycle limit.

## Codex Notes
- Prefer native multi-agent support when available (`multi_agent` or `child_agents_md`).
- Delegate dependency-independent tasks in parallel only.
- Persist structured artifacts after each worker and QA cycle.

## Required Artifacts
Write under:
- `sdlc/agent_runs/<feature-folder>/implement-feature-<timestamp>/`

At minimum:
- `dependency-plan.json`
- `execution-plan.json`
- `task-results-*.json`
- `task-qa-*.json`
- `qa-result-cycle-*.json`
- `run-summary.md`

## Examples

### Example A - Feature mode
Input:
- `--feature-dir sdlc/build_plans/2026-02-22-todo-app`

Flow:
- load plans -> build DAG -> run task+gate pairs -> run final E2E QA -> PASS/FAIL.

### Example B - Tech-spec mode with missing plans
Input:
- `--tech-spec sdlc/tech_specs/2026-02-22-todo-app/2026-02-22-tech-spec-todo-app.md`

Flow:
- resolve feature folder -> detect missing plans -> generate plans via team-lead -> continue normal runbook.
