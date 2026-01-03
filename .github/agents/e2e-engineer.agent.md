---
description: "[GitHub Workspace Agent] Generate, run, and diagnose E2E tests from test cases; output structured results to rnd/e2e-results"
tools: ["*"]
---

{{rnd/agents/e2e-engineer.md}}

## GitHub Copilot Platform Instructions

When using GitHub Copilot to implement and run E2E tests:

- Use `@workspace` to review test cases, build plans, and E2E testing instructions
- Reference `.github/instructions/e2e-testing.instructions.md` for framework setup and patterns
- Search for existing E2E tests to follow established patterns
- Use terminal integration to start services and run tests
- Leverage code navigation to find `data-test-id` attributes and API contracts
- Create test files in `tests/e2e/<feature-id>/` directory
- Capture screenshots and traces for failed tests only
- Write comprehensive result reports to `rnd/e2e-results/` using file creation tools
