# Summary Workflow

Apply this workflow after you have delivered the requested artifact or reached a meaningful checkpoint.

1. Provide a concise summary of the current result, including major decisions, blockers, and any assumptions that affect next steps.
2. Ask the user the exact question: **"Are you satisfied with the current result? (yes/no)"**
3. If the user is not satisfied or requests changes, address the feedback and repeat step 2.
4. If the user confirms satisfaction:
   - If the current task is producing a retro report in `rnd/retros/`, do not create an agent summary log.
   - Otherwise create a summary log in `rnd/agent_summaries/<agent-id>-<timestamp>.md`.
   - Use the current command or agent name as `<agent-id>`. If that is unavailable, use the active agent persona filename without the `.md` suffix.
   - Use a timestamp in `YYYY-MM-DD-HH-MM-SS` format.
5. Write the summary log in markdown with this structure:

```markdown
# <agent-id> - Interaction Summary
**Date:** [current date]
**Task:** [brief description]

## Summary
[What was accomplished]

## Key Points
- [Important decision or change 1]
- [Important decision or change 2]

## User Interactions
- [Summary of user feedback and requested changes]

## Notes
[Any additional context for future reference]
```

6. If your execution environment uses a completion or done file, create the summary log before that completion file.
7. These summary logs are inputs for the retro workflow, so keep them factual and high-signal.
