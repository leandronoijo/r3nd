---
name: implement-feature
description: Run an approved MVP tech spec through planning, production-aware implementation, and selected QA.
---

# Implement Feature — MVP Semi-Control

Coordinate an approved tech spec into the smallest safely deployable feature without production-process ceremony.

{{rnd/agents/shared/mvp.md}}
{{rnd/agents/shared/command-hygiene.md}}

## Input

- An approved tech-spec file or feature directory under `rnd/tech_specs/`
- Relevant code, scoped instructions, CI, runtime, and operational files
- Existing build plans and test cases when present

Invoking this skill with an approved tech spec authorizes implementation. Do not add another approval gate unless a missing choice changes behavior, data ownership, a public contract, security, tenancy, or technology.

## Minimal Outputs

- Compact build plans under `rnd/build_plans/` when missing
- Working code and focused automated tests
- Applicable CI, production runtime, security, compatibility/migration, and operability changes
- Optional concise cases and reusable E2E code and/or a manual-QA result when selected
- One concise `run-summary.md` under `rnd/agent_runs/<feature-id>/` only when the invoking tool requires it

Do not create coordination bundles, broad readiness checklists, generic platform artifacts, retros, or QA artifacts that the selected workflow does not need.

## Workflow

### 1. Resolve

1. Read the tech spec and inspect the affected code and production patterns.
2. Identify tasks, dependencies, public/data boundaries, trust boundaries, and the slice's identity/tenant context.
3. Ask immediately if a missing decision changes behavior or safety. Otherwise use the simplest reversible assumption.

### 2. Assure Plans

1. Reuse valid existing plans.
2. Generate missing plans with `rnd/skills/create-build-plan/SKILL.md`.
3. Confirm the plans collectively own each applicable minimum-production-baseline item. Keep execution order as a short session checklist rather than a new coordination system.

### 3. Implement

1. Execute plans with `rnd/skills/implement-build-plan/SKILL.md` in dependency order.
2. Parallelize only truly independent work when it materially saves time.
3. Keep contracts, migrations, authorization/tenant rules, and operational signals consistent with the tech spec.
4. Run focused checks as each plan lands, then the complete CI-equivalent command set and production-runtime smoke check.
5. Tell delegated plan implementers to defer the QA-choice prompt to this coordinator.

### 4. Choose QA

After implementation, required automated checks, and runtime smoke finish, ask exactly:

`Which post-implementation QA do you want: AI-run manual QA, reusable E2E test code, both, or neither?`

- **AI-run manual QA:** Use `rnd/skills/run-manual-qa-tests/SKILL.md` directly from acceptance criteria.
- **Reusable E2E test code:** Use `rnd/skills/create-test-cases/SKILL.md`, then `rnd/skills/run-e2e-tests/SKILL.md`.
- **Both:** Complete both paths.
- **Neither:** Create no test-case, E2E, or manual-QA artifact; report the automated verification completed.

### 5. Finish

Report delivered behavior, assumptions, production-baseline decisions, exact validation commands, selected/skipped QA, rollback or migration notes, and intentionally deferred work. Leave the repository runnable.

## Fix Loops

- Enter a fix loop for blocking implementation, required-check, runtime, security/tenancy, data/compatibility, or selected-QA failures.
- Make at most two focused repair-and-verification cycles for the same failure, then ask for help with evidence.
- Ask before investigating non-blocking debt or expanding the platform.
