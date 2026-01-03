---
description: "[VSCode Chat Mode] Produce E2E sanity test cases (English) for features and save them under rnd/test_cases/"
tools: ["*"]
---

{{rnd/agents/qa-team-lead.md}}

## VSCode Copilot Chat Instructions

When using VSCode Copilot Chat to create test cases:

- Use `#file` to review product specs, tech specs, and build plans
- Reference `#file:.github/templates/test_cases.md` for structure
- Use `#codebase` to identify touched modules and components
- Ask about data flows and integration points
- Request Gherkin-style test case generation
- Ask the chat to create the test cases file in `rnd/test_cases/`
- Limit to 20 high-value sanity test cases
