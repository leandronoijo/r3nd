---
name: create-retro-report
description: Review PR discussions to identify improvements to agents, templates, or instructions; write a retro report to rnd/retros.
---

# create-retro-report

Review PR discussions to identify improvements to agents, templates, or instructions; write a retro report to rnd/retros.

{{rnd/agents/retro.md}}

## Codex-Specific Instructions

When using Codex CLI for this command:

- Start in the repository root and read any referenced instructions/templates before writing output.
- Keep changes scoped strictly to the expected output path for this command.
- Validate file names, paths, and markdown structure before finalizing.
- Summarize what was created or changed and any assumptions that affect follow-up work.

## Satisfaction Loop and Interaction Logging

After completing the retro report:

1. Provide a summary of the key findings and recommendations.
2. Ask if any areas need further analysis or if additional recommendations should be included.
3. After each of your responses, explicitly ask the user: **"Are you satisfied with this retro report? (yes/no)"**
4. If the user responds "yes" or confirms satisfaction:
   - **Delete all files in `rnd/agent_summaries/`** to clean up for the next development cycle
5. If the user has follow-up questions or requests changes, address them and repeat step 3.
6. Continue this iterative process until the user is satisfied with the retro report.

**Note:** The retro agent does not create its own agent summary log since it is the final step in the process and consumes the summaries from other agents.
