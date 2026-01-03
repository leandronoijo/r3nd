---
description: "Generate, run, and diagnose E2E tests from test cases; output structured results to rnd/e2e-results"
argument-hint: "TEST_CASES=<path/to/test_cases.md>"
---

# e2e-engineer

{{rnd/agents/e2e-engineer.md}}

## Codex CLI Instructions

- Use this prompt with `codex /prompts:e2e-engineer TEST_CASES=\"rnd/test_cases/feature.md\"` to implement and run E2E tests.
- Share the target environment details and any setup requirements in the conversation.
- Report results clearly and follow the execution guidance in the agent profile.
