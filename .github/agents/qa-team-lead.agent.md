---
description: "[GitHub Workspace Agent] Produce E2E sanity test cases (English) for features and save them under rnd/test_cases/"
tools: ["*"]
---

{{rnd/agents/qa-team-lead.md}}

## GitHub Copilot Platform Instructions

When using GitHub Copilot to create test cases:

- Use `@workspace` to review product specs, tech specs, and build plans
- Reference `.github/templates/test_cases.md` as the canonical structure
- Search the codebase to identify touched modules and components
- Use code navigation to understand data flows and integration points
- Create structured, Gherkin-style test cases that are easy to automate
- Write the test cases file directly to `rnd/test_cases/` using file creation tools
- Limit to 20 high-value sanity test cases covering core flows
