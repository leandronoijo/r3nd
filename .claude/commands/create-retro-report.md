# create-retro-report

Review PR discussions to identify improvements to agents, templates, or instructions; write a retro report to rnd/retros.

{{rnd/agents/retro.md}}
{{rnd/agents/summary.md}}

## Claude-Specific Instructions

When using Claude Code for this command:

- Start in the repository root and read any referenced instructions/templates before writing output.
- Keep edits focused on the files required for this command and avoid unrelated modifications.
- Verify output formatting, file path targets, and completion criteria before finalizing.
- Summarize results and call out blockers or assumptions that require user confirmation.

After the user confirms the retro report is satisfactory, do not create an agent summary log. The retro workflow is the consumer of the shared summaries, not a producer of another one. After completion, delete files in `rnd/agent_summaries/` to clean up for the next cycle.
