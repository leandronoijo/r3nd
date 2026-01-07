# retro

Review PR discussions to identify improvements to agents, templates, or instructions; write a retro report to rnd/retros.

{{rnd/agents/retro.md}}

## Cursor-Specific Instructions

When using Cursor to create retro reports:

- **First, read all files in `rnd/agent_summaries/`** to understand what happened during the development process
- Use Cmd+K to query PR discussions and review threads
- Reference `.github/templates/retro.md` while structuring the report
- Search for agent profiles, templates, and instruction files with Cmd+P
- Use Cursor composer to map issues to process artifacts
- Leverage codebase context to understand improvement areas
- Apply the retro report directly to `rnd/retros/`
- Include specific file paths and evidence links

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
