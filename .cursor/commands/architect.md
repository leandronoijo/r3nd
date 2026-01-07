# architect

Convert product specs into a repo-grounded technical specification / high-level design.

{{rnd/agents/architect.md}}

## Cursor-Specific Instructions

When using Cursor to create technical specifications:

- Use Cursor's codebase awareness to analyze existing structure
- Search codebase with Cmd+P to find similar modules and patterns
- Reference `.github/instructions/` files by opening them in adjacent tabs
- Use Cmd+K to query about integration points and module boundaries
- Open `.github/templates/tech_spec.md` as a reference while writing
- Use Cursor composer to structure the tech spec interactively
- Apply changes directly to `rnd/tech_specs/` directory

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

When the user is satisfied, create a summary log file at `rnd/agent_summaries/architect-<timestamp>.md` with the following structure:

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
