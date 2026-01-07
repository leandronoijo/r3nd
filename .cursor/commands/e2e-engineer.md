# e2e-engineer

Generate, run, and diagnose E2E tests from test cases; output structured results to rnd/e2e-results.

{{rnd/agents/e2e-engineer.md}}

## Cursor-Specific Instructions

When using Cursor to implement and run E2E tests:

- Read `.github/instructions/e2e-testing.instructions.md` using Cmd+K
- Use Cursor's terminal integration to start services and run tests
- Search for existing E2E tests with Cmd+P to follow patterns
- Use composer mode to generate test files in `tests/e2e/<feature-id>/`
- Leverage inline suggestions for test assertions and selectors
- Run tests in integrated terminal and capture output
- Use Cmd+K to query about `data-test-id` attributes in the codebase
- Write result reports to `rnd/e2e-results/` using Apply

## Satisfaction Loop and Interaction Logging

After executing tests and generating the result report:

1. Provide a summary of test outcomes and failure categories.
2. Ask if any failures need deeper investigation or if test methodology needs adjustment.
3. After each of your responses, explicitly ask the user: **"Are you satisfied with the E2E test execution and results? (yes/no)"**
4. If the user responds "yes" or confirms satisfaction:
   - Create an agent summary log (see below)
5. If the user requests re-runs, additional diagnosis, or test updates, address them and repeat step 3.
6. Continue this iterative process until the user is satisfied with the E2E test results.

### Agent Summary Log

When the user is satisfied, create a summary log file at `rnd/agent_summaries/e2e-engineer-<timestamp>.md` with the following structure:

```markdown
# e2e-engineer - Interaction Summary
**Date:** [current date]
**Task:** [brief description of the E2E test execution]

## Summary
[What was accomplished]

## Key Points
- [Important test result 1]
- [Important test result 2]

## User Interactions
- [Summary of user feedback and changes requested]

## Notes
[Any additional context for future reference]
```

This summary will be used by the retro agent to understand the development process and suggest improvements to agents, templates, or instructions.
