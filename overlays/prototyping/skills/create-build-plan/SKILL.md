---
name: create-build-plan
description: Turn a prototype tech-spec task or concrete problem into the shortest executable plan that preserves contracts.
---

# Create Build Plan — Prototyping

Create a compact build plan containing only the details needed for implementation tasks to produce a compatible result.

{{rnd/agents/shared/prototyping.md}}
{{rnd/agents/shared/command-hygiene.md}}

## Inputs

- A tech spec under `rnd/tech_specs/`, or a concrete bug/problem statement
- Relevant existing code and scoped instructions
- `rnd/templates/build_plan.md`

## Outputs

- For a tech spec, one `rnd/build_plans/<feature-id>-T<n>-build-plan.md` per task in its task breakdown
- For a focused bug or standalone problem, one short build plan

Do not split work merely to create more plans. If the tech spec defines one vertical slice, create one plan.

## Required Content

- Outcome, in-scope behavior, and explicit deferrals
- Dependencies plus contracts consumed and exposed
- Exact established packages and framework features selected by the tech spec, with custom code limited to product behavior and thin integration glue
- Algorithms, state rules, schema details, or runtime configuration only when non-obvious
- A short ordered checklist naming likely files or components
- Focused unit tests and the primary flow that could be used for optional reusable E2E code or AI-run manual QA
- Blocking questions only

## Workflow

1. Read the source and the compact build-plan template.
2. Inspect only the affected code and one useful existing reference pattern.
3. Preserve task ids and real dependency order from the tech spec.
4. Name shared types, endpoint shapes, state transitions, and ownership at boundaries so separately implemented tasks remain compatible.
5. Carry the tech spec's package/tool choices into the plan; do not replace them with custom mechanisms. Name dependency installation, configuration, generated migrations, and integration glue in the implementation checklist when applicable.
6. When planning directly from a problem statement, inspect manifests and lockfiles and choose an established or mature package for commodity capabilities. A focused dependency addition is preferable to a bespoke subsystem and does not require a question unless it creates a material tradeoff.
7. For relational persistence, plan changes through the selected ORM and migration tooling. Raw SQL is allowed only for a focused, documented ORM limitation; never plan a custom migration runner.
8. Plan happy-path unit coverage and the most obvious relevant edge. Identify the primary flow as an optional post-implementation QA candidate, but do not create test cases or E2E work unless the user later selects reusable E2E.
9. Explicitly exclude integration tests.
10. Write the plan without estimates, exhaustive file inventories, generic guardrails, production rollout sections, or repeated spec prose.

If an ambiguity changes behavior or a contract, ask the user. Otherwise choose the simplest reversible implementation and note it briefly.
