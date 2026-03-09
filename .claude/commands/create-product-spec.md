# create-product-spec

Create clear, concise product specifications from short feature descriptions or issue text.

{{rnd/agents/product-manager.md}}

## Claude-Specific Instructions

When using Claude Code for this command:

- Start in the repository root and read any referenced instructions/templates before writing output.
- Keep edits focused on the files required for this command and avoid unrelated modifications.
- Verify output formatting, file path targets, and completion criteria before finalizing.
- Summarize results and call out blockers or assumptions that require user confirmation.

## Satisfaction Loop and Interaction Logging

After completing the product specification:

1. Provide a summary of the document you created.
2. Ask if there are any sections that need clarification or additional detail.
3. After each of your responses, explicitly ask the user: **"Are you satisfied with this product specification? (yes/no)"**
4. If the user responds "yes" or confirms satisfaction:
   - Create an agent summary log (see below)
5. If the user has follow-up questions or requests changes, address them and repeat step 3.
6. Continue this iterative process until the user is satisfied with the product specification.

### Agent Summary Log

When the user is satisfied, create a summary log file at `rnd/agent_summaries/product-manager-<timestamp>.md` (where `<timestamp>` is in `YYYY-MM-DD-HH-MM-SS` format, e.g., `2026-01-07-14-30-45`) with the following structure:

```markdown
# product-manager - Interaction Summary
**Date:** [current date]
**Task:** [brief description of the feature]

## Summary
[What was accomplished]

## Key Points
- [Important decision 1]
- [Important decision 2]

## User Interactions
- [Summary of user feedback and changes requested]

## Notes
[Any additional context for future reference]
```

This summary will be used by the retro agent to understand the development process and suggest improvements to agents, templates, or instructions.
