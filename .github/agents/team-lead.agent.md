---
description: "[GitHub Workspace Agent] Turn a technical spec into a concrete implementation and test plan formed of small, traceable tasks"
tools: ["*"]
---

{{rnd/agents/team-lead.md}}
{{rnd/agents/summary.md}}

## GitHub Copilot Platform Instructions

When using GitHub Copilot to create build plans:

- Use `@workspace` to understand current codebase structure and locate integration points
- Search for golden reference modules mentioned in tech specs
- Reference `.github/instructions/` files relevant to the integration points
- Use the template at `rnd/templates/build_plan.md` as the canonical structure
- Leverage code search to verify file paths and existing patterns
- Create detailed, atomic tasks with specific file paths and acceptance criteria
- Write the build plan directly to `rnd/build_plans/` using file creation tools
