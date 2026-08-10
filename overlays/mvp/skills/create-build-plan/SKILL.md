---
name: create-build-plan
description: Turn an MVP tech-spec task into the shortest production-aware executable plan.
---

# Create Build Plan — MVP

Create a compact plan that delivers one compatible, deployable slice without turning production readiness into a platform project.

{{rnd/agents/shared/mvp.md}}
{{rnd/agents/shared/command-hygiene.md}}

## Inputs

- A tech spec under `rnd/tech_specs/`, or a concrete bug/problem statement
- Relevant code, scoped instructions, CI, Docker/runtime, and operational patterns
- `rnd/templates/build_plan.md`

## Outputs

- For a tech spec, one `rnd/build_plans/<feature-id>-T<n>-build-plan.md` per task that genuinely needs separate execution
- For a concrete bounded problem, one short build plan

Do not split work merely to create more plans. A single vertical slice should normally have one plan.

## Required Content

- Outcome, scope, dependencies, and contracts consumed/exposed
- Exact established packages and framework features selected by the tech spec, with custom code limited to product behavior and thin integration glue
- Non-obvious algorithm, state, schema, migration, release, or rollback rules
- Applicable CI, runtime/config, security/auth/tenancy, compatibility, and operability work
- A short ordered checklist naming likely files or components
- Focused unit checks, a boundary/contract test only for a real production risk, CI-equivalent commands, and a production-runtime smoke check
- The primary flow and directly relevant security, tenant, or compatibility edge for optional QA
- Blocking questions only

## Workflow

1. Read the source and MVP build-plan template.
2. Inspect only the affected code plus established patterns for the applicable production concerns.
3. Preserve task ids and dependency order from the tech spec.
4. Name public contracts, data transitions, authorization/ownership rules, and operational signals precisely enough for separate tasks to remain compatible.
5. Carry the tech spec's package/tool choices into the plan; do not replace them with custom mechanisms. Name dependency installation, configuration, generated migrations, and integration glue in the implementation checklist when applicable.
6. When planning directly from a problem statement, inspect manifests and lockfiles and choose an established or mature package for commodity capabilities. A focused dependency addition is preferable to a bespoke subsystem and does not require a question unless it creates material operational, licensing, security, or lock-in consequences.
7. For relational persistence, plan changes through the selected ORM and migration tooling. Raw SQL is allowed only for a focused, documented ORM limitation; never plan a custom migration runner.
8. Prefer an additive contract or migration. Include expand/migrate/contract only when independent deploys or uptime constraints require it.
9. Reuse existing CI and runtime files. Add the smallest missing check or container change that makes this task safely deployable.
10. Plan focused tests. Do not create a broad integration suite or duplicate behavior already proven cheaply at a lower level.
11. Mark irrelevant baseline concerns `Not applicable — <reason>` and write the plan without estimates, generic guardrails, or repeated spec prose.

Ask when ambiguity changes behavior, data ownership, a public contract, security, tenancy, or technology. Otherwise choose the simplest reversible implementation and note it briefly.
