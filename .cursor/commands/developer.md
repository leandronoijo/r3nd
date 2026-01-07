# developer

Implement features and tests based on a build plan; follow repository standards and keep diffs small and test-driven.

{{rnd/agents/developer.md}}

## Cursor-Specific Instructions

When using Cursor to implement features:

- Read instruction files in `.github/instructions/` before starting (use Cmd+K to query them)
- Use Cursor's inline code suggestions (Tab to accept, Cmd+] for alternatives)
- Leverage Cmd+K in file to ask about specific implementation patterns
- Use composer mode for complex multi-file changes
- Search for golden references with Cmd+P
- Run tests in Cursor's integrated terminal frequently
- Use Cmd+Shift+K for multi-line edits when refactoring
- Update build plan checkboxes as you complete tasks
- Keep changes atomic - one task per commit mindset

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

When the user is satisfied, create a summary log file at `rnd/agent_summaries/developer-<timestamp>.md` with the following structure:

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
