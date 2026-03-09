# create-tech-spec

Convert product specs into a repo-grounded technical specification / high-level design.

{{rnd/agents/architect.md}}

## Claude-Specific Instructions

When using Claude Code for this command:

- Start in the repository root and read any referenced instructions/templates before writing output.
- Keep edits focused on the files required for this command and avoid unrelated modifications.
- Verify output formatting, file path targets, and completion criteria before finalizing.
- Summarize results and call out blockers or assumptions that require user confirmation.

## Satisfaction Loop and Interaction Logging

After completing the technical specification:

1. Provide a summary highlighting the key technical decisions and architecture.
2. Ask if there are any technical aspects that need further elaboration or alternative approaches to consider.
3. After each of your responses, explicitly ask the user: **"Are you satisfied with this technical specification? (yes/no)"**
4. If the user responds "yes" or confirms satisfaction:
   - Create an agent summary log (see below)
5. If the user has follow-up questions or requests changes, address them and repeat step 3.
6. Continue this iterative process until the user is satisfied with the technical specification.

### Agent Summary Log

When the user is satisfied, create a summary log file at `rnd/agent_summaries/architect-<timestamp>.md` (where `<timestamp>` is in `YYYY-MM-DD-HH-MM-SS` format, e.g., `2026-01-07-14-30-45`) with the following structure:

```markdown
# architect - Interaction Summary
**Date:** [current date]
**Task:** [brief description of the tech spec]

## Summary
[What was accomplished]

## Key Points
- [Important technical decision 1]
- [Important technical decision 2]

## User Interactions
- [Summary of user feedback and changes requested]

## Notes
[Any additional context for future reference]
```

This summary will be used by the retro agent to understand the development process and suggest improvements to agents, templates, or instructions.
