# create-retro-report

Review PR discussions to identify improvements to agents, templates, or instructions; write a retro report to rnd/retros.

{{rnd/agents/retro.md}}
{{rnd/agents/summary.md}}

## Cursor-Specific Instructions

When using Cursor to create retro reports:

- **First, read all files in `rnd/agent_summaries/`** to understand what happened during the development process
- Use Cmd+K to query PR discussions and review threads
- Reference `rnd/templates/retro.md` while structuring the report
- Search for agent profiles, templates, and instruction files with Cmd+P
- Use Cursor composer to map issues to process artifacts
- Leverage codebase context to understand improvement areas
- Apply the retro report directly to `rnd/retros/`
- Include specific file paths and evidence links

After the user confirms the retro report is satisfactory, do not create an agent summary log. The retro workflow is the consumer of the shared summaries, not a producer of another one. After completion, delete files in `rnd/agent_summaries/` to clean up for the next cycle.
