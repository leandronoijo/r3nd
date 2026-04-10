# create-test-cases

Produce E2E sanity test cases (English) for features and save them under rnd/test_cases/.

{{rnd/agents/qa-team-lead.md}}
{{rnd/agents/shared/command-hygiene.md}}

## Cursor-Specific Instructions

When using Cursor to create test cases:

- Use Cmd+K to review product specs, tech specs, and build plans.
- Keep `rnd/templates/test_cases.md` open while structuring the file.
- Search the codebase to identify touched modules and data flows.
- Use Composer to generate structured Gherkin-style test cases.
- Use Apply to write the test-cases file directly to `rnd/test_cases/`.
- Limit the result to 20 high-value sanity test cases.

{{rnd/agents/summary.md}}
