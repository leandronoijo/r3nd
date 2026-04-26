---
name: create-test-cases
description: Produce E2E sanity test cases (English) for features and save them under rnd/test_cases/.
---

# create-test-cases

Produce clear, actionable end-to-end sanity test cases for a feature and write them to `rnd/test_cases/<feature-id>-test-cases.md`.

{{rnd/agents/qa-team-lead.md}}
{{rnd/agents/shared/command-hygiene.md}}

## Inputs

- `rnd/product_specs/<feature-id>-product-spec.md` (required)
- `rnd/tech_specs/<feature-id>-tech-spec.md` (required if present)
- `rnd/build_plans/<feature-id>-build-plan.md` (recommended)
- Repository sources for touched modules, guided by repo/app/module-scoped `AGENTS.md` / `CLAUDE.md` files

## Outputs

- One Markdown file: `rnd/test_cases/<feature-id>-test-cases.md`
- Maximum 20 cases, with sanity-level coverage prioritized

## Required Structure for the Output File

- Always open `rnd/templates/test_cases.md` first and use it as the canonical starting point.
- Preserve the template's header block and per-case fields.
- Include the header fields for feature name, feature id, product spec, tech spec, build plan, author, date, and test count.
- Use the numbered per-case structure from the template without reordering or renaming fields.

## Behavior & Rules

1. Use `rnd/templates/test_cases.md` as the source of truth for structure and formatting.
2. Write all cases in clear, idiomatic English.
3. Keep the set to 20 cases or fewer, prioritizing the highest-value sanity checks.
4. Ground each case in the product spec, tech spec, or build plan, or note if a referenced file is missing.
5. Keep cases deterministic and self-contained.
6. Prefer Given/When/Then for steps so cases are easy to automate.
7. Focus on observable end-to-end behavior and touched integration points.
8. When describing UI-driven tests, prefer `data-test-id` selectors, explicit waits, and stable interactions.

## Service Orchestration

- When describing or executing E2E validation, use Docker Compose to bring up required services.
- Do not instruct developers or CI to start services manually with ad hoc process commands.
- Prefer `docker compose up --build` or `docker-compose up --build`, and document any specific compose files or service names required.

## File I/O and Scope

- Read: `rnd/product_specs/`, `rnd/tech_specs/`, `rnd/build_plans/`, the current codebase, and repo/app/module-scoped `AGENTS.md` / `CLAUDE.md` files
- Write: `rnd/test_cases/<feature-id>-test-cases.md` only
- If the product spec is missing or ambiguous, stop and ask for clarification rather than guessing the feature id

## Validation Checklist

1. Confirm the product spec exists and the feature id is consistent with it.
2. Read the build plan and tech spec if present.
3. Identify the touched modules and behaviors that need sanity coverage.
4. Ensure every test case includes title, objective, preconditions, steps, expected result, priority, scope, related artifacts, and notes.
5. Keep the file name and feature id aligned with the product spec.

## Communication Style

- Concise, actionable, and test-oriented.
- Map each case back to a specific requirement or build-plan task when possible.
- Keep the output compact and easy to convert into automation.

{{rnd/agents/summary.md}}
