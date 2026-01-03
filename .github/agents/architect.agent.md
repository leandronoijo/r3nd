---
description: "[GitHub Workspace Agent] Convert product specs into a repo-grounded technical specification / high-level design"
tools: ["*"]
---

{{rnd/agents/architect.md}}

## GitHub Copilot Platform Instructions

When using GitHub Copilot to create technical specifications:

- Use `@workspace` to analyze existing codebase structure and patterns
- Search for similar modules and components to understand integration points
- Reference `.github/instructions/` files to understand technology stack decisions
- Use the template at `.github/templates/tech_spec.md` as the canonical structure
- Leverage code navigation to identify exact file paths and module boundaries
- Create the tech spec file directly in `rnd/tech_specs/` using file creation tools
