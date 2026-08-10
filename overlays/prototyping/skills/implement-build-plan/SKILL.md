---
name: implement-build-plan
description: Implement a compact build plan as a working vertical slice with focused unit tests and a user-selected QA handoff.
---

# Implement Build Plan — Prototyping

Deliver the build-plan outcome quickly, correctly, and with enough encapsulation to evolve later.

{{rnd/agents/shared/prototyping.md}}
{{rnd/agents/shared/command-hygiene.md}}

## Inputs

- The selected file under `rnd/build_plans/`
- Relevant code, tests, manifests, and nearest applicable `AGENTS.md` / `CLAUDE.md`
- Existing repository patterns for the touched area

## Outputs

- Working code in the current repository
- Focused unit tests
- Optional reusable E2E test code and/or manual-QA result when selected at the final full-control handoff
- Completed checkboxes and a brief clarification in the build plan only when reality materially differed

## Workflow

1. Read the plan and inspect the affected code plus one established pattern.
2. Confirm required predecessor contracts exist. Ask immediately if a missing contract blocks correct work.
3. Implement the smallest vertical slice that satisfies the plan; keep real boundaries explicit and avoid speculative abstraction.
4. Use the plan's selected packages and framework features for commodity capabilities. Do not replace them with hand-built equivalents to avoid dependency installation or configuration.
5. If the plan omitted a commodity capability, inspect manifests and lockfiles and use an existing or mature ecosystem-standard package. Add a focused, reversible dependency directly; ask only when every suitable choice has a material tradeoff or a non-trivial platform component is required.
6. Use the selected ORM and migration tooling for relational persistence. Do not add a custom migration runner or default to raw queries; keep any raw SQL to a documented and tested ORM limitation.
7. Keep custom code to product behavior and thin integration glue unless the plan explicitly justifies an exception.
8. Add unit tests for the happy path and the most obvious relevant edge case.
9. Do not add integration tests.
10. Run the smallest relevant unit target, then relevant lint/type/build checks already present.
11. Mark completed plan items and report exact commands and results.

## Full-Control QA Handoff

Full control is a user-driven sequence, not a separate orchestration skill. Do not create test cases or E2E files automatically.

When this plan completes the final approved implementation plan, ask exactly:

`Which post-implementation QA do you want: AI-run manual QA, reusable E2E test code, both, or neither?`

- **AI-run manual QA:** Use `rnd/skills/run-manual-qa-tests/SKILL.md` directly from the tech-spec/build-plan acceptance criteria. Do not create a test-case document.
- **Reusable E2E test code:** Use `rnd/skills/create-test-cases/SKILL.md`, then `rnd/skills/run-e2e-tests/SKILL.md`. Commit durable test files runnable through normal repository commands without AI.
- **Both:** Run both paths. The manual-QA run may reuse the same acceptance intent, but it remains a live AI-executed check rather than reusable test code.
- **Neither:** Skip test-case creation, E2E implementation, and manual QA. State clearly that only unit-level automated verification was performed.

If this is not the final plan, defer the QA question. When called by `implement-feature`, also defer it because that coordinator owns the one feature-level QA choice.

## Runtime And Infrastructure

- Reuse an existing Docker/Compose setup when available.
- If runtime setup is missing and needed, add the smallest Dockerfile and Compose definition that starts only required services.
- Keep services detached during verification and capture concise logs on failure.
- Do not add Kubernetes, Argo, Kafka, Nx, Bun, or comparable machinery without an explicit request or demonstrated hard requirement.

## Failure Handling

- Fix a failure automatically only when it blocks the requested behavior, build, focused unit tests, selected QA path, or minimal runtime.
- Attempt the same blocking fix loop at most twice. After the second failed attempt, stop and ask the user with both attempts and the relevant error.
- Ask before spending time on non-blocking warnings, cleanup, optional hardening, unrelated failures, or architectural improvements.
- Do not rewrite large parts of the plan or codebase to resolve a local problem.

## Done

The plan is done when its behavior is demonstrable, focused unit tests pass, any required minimal containerized runtime starts, and the user's selected final QA paths pass. Surface deferred production work without implementing it.
