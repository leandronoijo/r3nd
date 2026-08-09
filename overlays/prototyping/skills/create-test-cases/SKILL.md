---
name: create-test-cases
description: Create a very small E2E case set centered on the prototype's primary flow.
---

# Create Test Cases — Prototyping

Describe only the E2E behavior needed to show the result works and catch the most obvious breakage.

{{rnd/agents/shared/prototyping.md}}
{{rnd/agents/shared/command-hygiene.md}}

Run this skill only when the user selected **reusable E2E test code** or invoked this skill directly. AI-run manual QA alone does not need a test-case document.

## Inputs

- Relevant tech spec and build plans
- Implemented code when available
- `rnd/templates/test_cases.md`

A product spec is not required. The tech spec contains the brief requirements for this workflow.

## Output

Write one concise file under `rnd/test_cases/` using the template. Usually create 1–6 cases; exceed that only when the user explicitly needs broader coverage.

## Selection Rules

1. Always include the primary happy path that demonstrates the feature's value.
2. Add only obvious, high-value edge cases directly implied by the requirement, such as required validation, empty state, not found, or one critical external failure.
3. Prefer observable outcomes over internal calls or data-layer details.
4. Keep setup minimal and deterministic.
5. Reuse existing selectors, fixtures, accounts, and container setup.
6. Do not specify integration tests or exhaustive permutations.
7. If an expected behavior is ambiguous and changes the outcome, ask the user instead of inventing it.

Map every case to a requirement or build-plan outcome, but keep traceability to one short reference rather than repeating the source documents.
