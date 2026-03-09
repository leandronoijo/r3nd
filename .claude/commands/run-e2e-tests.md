# run-e2e-tests

Generate, run, and diagnose E2E tests from test cases; output structured results to rnd/e2e-results.

{{rnd/agents/e2e-engineer.md}}

## Claude-Specific Instructions

When using Claude Code for this command:

- Start in the repository root and read any referenced instructions/templates before writing output.
- Keep edits focused on the files required for this command and avoid unrelated modifications.
- Verify output formatting, file path targets, and completion criteria before finalizing.
- Summarize results and call out blockers or assumptions that require user confirmation.

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

When the user is satisfied, create a summary log file at `rnd/agent_summaries/e2e-engineer-<timestamp>.md` (where `<timestamp>` is in `YYYY-MM-DD-HH-MM-SS` format, e.g., `2026-01-07-14-30-45`) with the following structure:

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
