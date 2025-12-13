````instructions
---
title: Testing & Quality Instructions
applyTo: |
  src/**
  tests/**
---

# Testing & Quality Instructions

These rules define **how testing is done** in this repository (unit/integration/E2E), plus the **quality gates** required before a task is considered done.

> **Single source of truth:** Any test framework names, E2E tools, and quality tooling must be defined here.
> Other docs (agents/templates) must **reference this file** instead of re-stating tool choices.

---

## Scope & Expectations

- Every meaningful behavior change must be covered by tests.
- Prefer deterministic tests: no reliance on timing, randomness, or real external networks.
- Always cover both **success** and **error** paths where applicable.

---

## Tooling (Configured Stack)

- **Unit/Integration test runner:** Jest
- **E2E:** Playwright
- **Frontend component testing:** `@vue/test-utils`
- **Frontend store mocking (Pinia):** `createTestingPinia`
- **Backend test harness (Nest):** `Test.createTestingModule` from `@nestjs/testing`

If the stack changes, update this section and adjust the supporting scripts/config accordingly.

### E2E Tool Isolation

All E2E testing tools, configurations, and dependencies **must** be contained within the `tests/e2e/` directory:

- `package.json` for E2E dependencies (Playwright, etc.)
- Config files (e.g., `playwright.config.ts`)
- Fixtures, helpers, and utilities
- **Nothing E2E-related should leak into the repository root**

This keeps the main workspace clean and E2E tooling self-contained.

---

## Test Types

### Unit Tests

- Test a single module/class/function in isolation.
- Mock external dependencies (network, DB, other modules).
- Keep assertions focused on behavior.

### Integration Tests

- Test boundaries across multiple layers (e.g., request → validation → handler/service → persistence abstraction).
- Validate request/response contracts and error handling.

### E2E Tests

- Validate end-user flows across the running application.
- E2E selectors must be **stable** and not tied to layout or styling.

---

## E2E Selector Contract

- Use `data-test-id` selectors **exclusively**.
- Never use CSS class selectors or XPath.
- List all required `data-test-id` values explicitly in build plans (so implementation can’t guess).
- Waits must be explicit (e.g., wait for a response, route change, or element presence) to avoid flakiness.

---

## Frontend Testing Patterns

- Component/unit tests must mount components using `@vue/test-utils`.
- Store tests must mock Pinia using `createTestingPinia`.
- Avoid snapshot tests for dynamic components unless a snapshot is explicitly justified.

---

## Backend Testing Patterns

- Use Nest’s testing utilities (`Test.createTestingModule`) for unit/integration tests.
- Mock external dependencies (other services, persistence models/clients).
- Avoid live databases unless an integration test explicitly requires it.

---

## Test File Conventions

- Follow the repo’s naming conventions for test files.
- Each new production file should have a corresponding test file unless it is purely declarative/configuration.

When in doubt, copy patterns from existing tests in the repo.

---

## Quality Gates (Required Before Completion)

- Lint must pass with no warnings.
- Type-check must pass with no errors.
- All unit/integration tests must pass.
- E2E tests (if affected) must pass.

Use the repository’s scripts (see `package.json`) to run these checks.

---

## Common Mistakes to Avoid

- Flaky waits (implicit timing assumptions).
- Testing implementation details rather than behavior.
- Selectors coupled to styling or DOM structure.
- Missing error-path coverage.
- Introducing new test tools/frameworks without updating this file and the build scaffolding.
````
