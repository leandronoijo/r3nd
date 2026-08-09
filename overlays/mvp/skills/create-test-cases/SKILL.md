---
name: create-test-cases
description: Create a small MVP E2E set for the primary flow and critical production boundaries.
---

# Create Test Cases — MVP

Describe only the end-to-end behavior needed to prove the MVP's value and its directly relevant production boundaries.

{{rnd/agents/shared/mvp.md}}
{{rnd/agents/shared/command-hygiene.md}}

Run this skill only when the user selects **reusable E2E test code** or invokes it directly. AI-run manual QA alone does not require a test-case document.

## Inputs

- Relevant tech spec and build plans
- Implemented code and production-baseline decisions when available
- `rnd/templates/test_cases.md`

## Output

Write one concise file under `rnd/test_cases/` using the template. Usually create 1–8 cases; exceed that only when the user explicitly needs broader coverage.

## Selection Rules

1. Always include the primary happy path that demonstrates user value through the deployed boundary.
2. Add only directly relevant high-risk cases: denied access, cross-tenant isolation, a legacy contract, migration behavior, safe dependency failure, or recovery/readiness.
3. Do not repeat unit or boundary tests unless the full-system behavior carries a distinct risk.
4. Prefer observable outcomes and safe external errors over internal calls or implementation details.
5. Keep setup minimal and production-like. Reuse existing accounts, tenant fixtures, selectors, images, and Compose services.
6. Map every case to one requirement or production-baseline decision without copying source prose.
7. If expected security, tenancy, data, or compatibility behavior is ambiguous, ask instead of inventing it.

Do not add exhaustive permission matrices, browser matrices, load tests, or speculative failure permutations by default.
