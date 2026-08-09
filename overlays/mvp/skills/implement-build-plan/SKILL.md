---
name: implement-build-plan
description: Implement an MVP plan as a production-shaped vertical slice with focused verification.
---

# Implement Build Plan — MVP

Deliver the plan quickly while preserving the minimum production baseline selected in the tech spec.

{{rnd/agents/shared/mvp.md}}
{{rnd/agents/shared/command-hygiene.md}}

## Inputs

- The selected file under `rnd/build_plans/`
- Relevant code, tests, manifests, CI, runtime files, and scoped `AGENTS.md` / `CLAUDE.md`
- Existing repository patterns for the touched area

## Outputs

- Working code and focused automated tests
- Applicable CI, production runtime/config, security, compatibility/migration, and operability changes
- Optional reusable E2E code and/or manual-QA result when selected at the final handoff
- Completed checkboxes and a brief plan clarification only when implementation materially differs

## Workflow

1. Read the plan and inspect the affected code plus the referenced production patterns.
2. Confirm predecessor contracts and required configuration exist. Ask immediately if a missing contract, security/tenant decision, or migration choice blocks safe work.
3. Implement the smallest vertical slice that satisfies the plan. Avoid speculative abstraction and infrastructure.
4. Preserve existing public behavior and stored data. Use additive changes or the plan's migration/compatibility path.
5. Validate inputs and authorization at real boundaries, enforce tenant ownership where applicable, and keep secrets and sensitive values out of source, images, errors, and logs.
6. Add only useful structured lifecycle/failure logs, health/readiness behavior, correlation, and metrics named by the plan.
7. Reuse or add the minimal production Dockerfile/configuration and CI checks assigned to the task.
8. Add focused unit tests and the planned boundary/contract test when applicable.
9. Run the smallest relevant checks, then the CI-equivalent lint/type/test/build/image commands.
10. Build and start the production runtime in detached mode when applicable, verify health/readiness, and stop only services started by this workflow.
11. Mark completed plan items and report exact commands and results.

## Full-Control QA Handoff

Full control is user-driven. Do not create test cases or E2E files automatically.

When this plan completes the final approved implementation plan, ask exactly:

`Which post-implementation QA do you want: AI-run manual QA, reusable E2E test code, both, or neither?`

- **AI-run manual QA:** Use `rnd/skills/run-manual-qa-tests/SKILL.md` from the acceptance criteria. Do not create a test-case document.
- **Reusable E2E test code:** Use `rnd/skills/create-test-cases/SKILL.md`, then `rnd/skills/run-e2e-tests/SKILL.md`.
- **Both:** Complete both paths.
- **Neither:** Skip both and clearly report the automated verification that was completed.

If this is not the final plan, defer the question. When called by `implement-feature`, defer it because that coordinator owns the single feature-level choice.

## Failure Handling

- Fix blocking implementation, required-check, production-runtime, security/tenancy, data/compatibility, or selected-QA failures.
- Use at most two repair-and-verification cycles for the same failure, then ask for help with evidence.
- Ask before expanding into unrelated failures, optional hardening, cleanup, or platform improvements.

## Done

The plan is done when behavior and applicable production-baseline items work, required checks pass in their CI path, the production runtime smokes successfully when applicable, and selected QA paths pass. Report intentional deferrals plainly.
