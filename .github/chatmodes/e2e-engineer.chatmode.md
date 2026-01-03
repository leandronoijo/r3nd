---
description: "[VSCode Chat Mode] Generate, run, and diagnose E2E tests from test cases; output structured results to rnd/e2e-results"
tools: ["*"]
---

{{rnd/agents/e2e-engineer.md}}

## VSCode Copilot Chat Instructions

When using VSCode Copilot Chat to implement and run E2E tests:

- Use `#file` to read `.github/instructions/e2e-testing.instructions.md`
- Reference `#file` to read test cases and build plans
- Use `#codebase` to find existing E2E test patterns
- Ask about `data-test-id` attributes and API contracts
- Request test file generation in `tests/e2e/<feature-id>/`
- Ask the chat to run tests using terminal commands
- Request result report generation in `rnd/e2e-results/`
- Use follow-up questions to diagnose failures
