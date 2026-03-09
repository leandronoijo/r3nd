# implement-feature

Run coordinated feature implementation with a team-lead coordinator, developer workers, and QA teammates.

{{rnd/agents/implement-feature.md}}

## Cursor-Specific Instructions

When using Cursor for this command:

- Treat this as a coordinator run and delegate to teammate agents whenever tasks can be split safely
- Use Cursor + external teammates (for example Codex and Claude) for dependency-independent tasks when possible
- Keep dependency-aware scheduling strict: only parallelize tasks that do not depend on each other
- Enforce a task QA gate result before unblocking dependent tasks
- Never skip final E2E QA even when task-level gates pass
- Persist run artifacts and summaries after each coordinator/worker cycle

## Satisfaction Loop and Interaction Logging

After each major implementation checkpoint:

1. Provide a summary of task progress, gate PASS/FAIL status, and blockers.
2. Ask if there are concerns about coordination, task quality gates, or final E2E validation.
3. After each of your responses, explicitly ask the user: **"Are you satisfied with the current implementation progress? (yes/no)"**
4. If the user responds "yes" or confirms the implementation is complete and satisfactory:
   - Create an agent summary log (see below)
5. If the user has concerns, requests changes, or identifies failures, address them and repeat step 3.
6. Continue this iterative process until the user is satisfied with the complete implementation.

### Agent Summary Log

When the user is satisfied, create a summary log file at `rnd/agent_summaries/implement-feature-<timestamp>.md` (where `<timestamp>` is in `YYYY-MM-DD-HH-MM-SS` format, e.g., `2026-01-07-14-30-45`) with the following structure:

```markdown
# implement-feature - Interaction Summary
**Date:** [current date]
**Task:** [brief description of the coordinated implementation]

## Summary
[What was accomplished]

## Key Points
- [Important coordination decision 1]
- [Important coordination decision 2]

## User Interactions
- [Summary of user feedback and changes requested]

## Notes
[Any additional context for future reference]
```

This summary will be used by the retro agent to understand the development process and suggest improvements to agents, templates, or instructions.
