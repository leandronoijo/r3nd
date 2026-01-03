# qa-team-lead

Produce E2E sanity test cases (English) for features and save them under rnd/test_cases/.

{{rnd/agents/qa-team-lead.md}}

## Cursor-Specific Instructions

When using Cursor to create test cases:

- Use Cmd+K to review product specs, tech specs, and build plans
- Reference `.github/templates/test_cases.md` while structuring
- Search the codebase to identify touched modules
- Use Cursor composer to generate structured Gherkin-style test cases
- Leverage codebase context to understand data flows
- Apply the test cases file directly to `rnd/test_cases/`
- Limit to 20 high-value sanity test cases
