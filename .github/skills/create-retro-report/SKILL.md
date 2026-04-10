---
name: create-retro-report
description: Review PR discussions to identify improvements to agents, templates, or instructions; write a retro report to rnd/retros.
---

# create-retro-report

Review PR discussions to identify improvements to agents, templates, or instructions; write a retro report to rnd/retros.

{{rnd/agents/retro.md}}
{{rnd/agents/summary.md}}

## GitHub-Specific Instructions

When using GitHub Copilot for this skill:

- Start in the repository root and read any referenced instructions and templates before writing output.
- Keep changes scoped strictly to the expected output path for this task.
- Validate file names, paths, and markdown structure before finalizing.
- Summarize what was created or changed and any assumptions that affect follow-up work.

After the user confirms the retro report is satisfactory, do not create an agent summary log. The retro workflow is the consumer of the shared summaries, not a producer of another one. After completion, delete files in `rnd/agent_summaries/` to clean up for the next cycle.
