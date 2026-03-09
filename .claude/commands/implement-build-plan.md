# implement-build-plan

Implement features and tests based on a build plan; follow repository standards and keep diffs small and test-driven.

{{rnd/agents/developer.md}}

## Claude-Specific Instructions

When using Claude Code for this command:

- Start in the repository root and read any referenced instructions/templates before writing output.
- Keep edits focused on the files required for this command and avoid unrelated modifications.
- Verify output formatting, file path targets, and completion criteria before finalizing.
- Summarize results and call out blockers or assumptions that require user confirmation.

## Satisfaction Loop and Interaction Logging

After implementing each major task or checkpoint:

1. Provide a summary of what was completed and any issues encountered.
2. Ask if there are any concerns about the implementation or if testing reveals problems.
3. After each of your responses, explicitly ask the user: **"Are you satisfied with the current implementation progress? (yes/no)"**
4. If the user responds "yes" or confirms the implementation is complete and satisfactory:
   - Create an agent summary log (see below)
5. If the user has concerns, requests changes, or identifies bugs, address them and repeat step 3.
6. Continue this iterative process until the user is satisfied with the complete implementation.

### Agent Summary Log

When the user is satisfied, create a summary log file at `rnd/agent_summaries/developer-<timestamp>.md` (where `<timestamp>` is in `YYYY-MM-DD-HH-MM-SS` format, e.g., `2026-01-07-14-30-45`) with the following structure:

```markdown
# developer - Interaction Summary
**Date:** [current date]
**Task:** [brief description of the implementation]

## Summary
[What was accomplished]

## Key Points
- [Important implementation decision 1]
- [Important implementation decision 2]

## User Interactions
- [Summary of user feedback and changes requested]

## Notes
[Any additional context for future reference]
```

This summary will be used by the retro agent to understand the development process and suggest improvements to agents, templates, or instructions.
