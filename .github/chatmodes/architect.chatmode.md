---
description: "Convert product specs into a repo-grounded technical specification / high-level design"
tools: ["*"]
---

{{rnd/agents/architect.md}}

## VSCode Copilot Chat Instructions

When using VSCode Copilot Chat to create technical specifications:

- Use `#codebase` to analyze existing structure and patterns
- Reference `#file:.github/templates/tech_spec.md` for the canonical structure
- Use `#file` to read instruction files in `.github/instructions/`
- Ask about integration points with `#codebase` context
- Request symbol searches to verify file paths
- Ask the chat to create the tech spec in `rnd/tech_specs/`
- Use follow-up questions to refine design decisions
