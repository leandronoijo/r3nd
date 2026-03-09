---
name: create-build-plan
description: Turn a technical spec into a concrete implementation and test plan formed of small, traceable tasks.
---

# create-build-plan

Turn a technical spec into a concrete implementation and test plan formed of small, traceable tasks.

{{rnd/agents/team-lead.md}}

## Codex-Specific Instructions

When using Codex CLI for this command:

- Start in the repository root and read any referenced instructions/templates before writing output.
- Keep changes scoped strictly to the expected output path for this command.
- Validate file names, paths, and markdown structure before finalizing.
- Summarize what was created or changed and any assumptions that affect follow-up work.

## Satisfaction Loop and Interaction Logging

After completing the build plan:

1. Provide a summary of the tasks and estimated complexity.
2. Ask if any tasks need to be broken down further or if dependencies are clear.
3. After each of your responses, explicitly ask the user: **"Are you satisfied with this build plan? (yes/no)"**
4. If the user responds "yes" or confirms satisfaction:
   - Create an agent summary log (see below)
5. If the user has follow-up questions or requests changes, address them and repeat step 3.
6. Continue this iterative process until the user is satisfied with the build plan.

### Agent Summary Log

When the user is satisfied, create a summary log file at `rnd/agent_summaries/team-lead-<timestamp>.md` (where `<timestamp>` is in `YYYY-MM-DD-HH-MM-SS` format, e.g., `2026-01-07-14-30-45`) with the following structure:

```markdown
# team-lead - Interaction Summary
**Date:** [current date]
**Task:** [brief description of the build plan]

## Summary
[What was accomplished]

## Key Points
- [Important planning decision 1]
- [Important planning decision 2]

## User Interactions
- [Summary of user feedback and changes requested]

## Notes
[Any additional context for future reference]
```

This summary will be used by the retro agent to understand the development process and suggest improvements to agents, templates, or instructions.
