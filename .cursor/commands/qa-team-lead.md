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

## Satisfaction Loop and Interaction Logging

After completing the test cases:

1. Provide a summary of the test coverage and priority distribution.
2. Ask if any critical scenarios are missing or if existing test cases need refinement.
3. After each of your responses, explicitly ask the user: **"Are you satisfied with these test cases? (yes/no)"**
4. If the user responds "yes" or confirms satisfaction:
   - Create an agent summary log (see below)
5. If the user has concerns or requests changes, address them and repeat step 3.
6. Continue this iterative process until the user is satisfied with the test cases.

### Agent Summary Log

When the user is satisfied, create a summary log file at `rnd/agent_summaries/qa-team-lead-<timestamp>.md` with the following structure:

```markdown
# qa-team-lead - Interaction Summary
**Date:** [current date]
**Task:** [brief description of the test cases]

## Summary
[What was accomplished]

## Key Points
- [Important test coverage decision 1]
- [Important test coverage decision 2]

## User Interactions
- [Summary of user feedback and changes requested]

## Notes
[Any additional context for future reference]
```

This summary will be used by the retro agent to understand the development process and suggest improvements to agents, templates, or instructions.
