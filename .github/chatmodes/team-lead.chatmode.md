---
description: "[VSCode Chat Mode] Turn a technical spec into a concrete implementation and test plan formed of small, traceable tasks"
tools: ["*"]
---

{{rnd/agents/team-lead.md}}
{{rnd/agents/summary.md}}

## VSCode Copilot Chat Instructions

When using VSCode Copilot Chat to create build plans:

- Use `#codebase` to find golden reference modules
- Reference `#file:rnd/templates/build_plan.md` for structure
- Use `#file` to read relevant instruction files
- Ask about file paths and module boundaries with `#codebase`
- Request detailed task breakdowns with acceptance criteria
- Ask the chat to create the build plan in `rnd/build_plans/`
- Use iterative refinement to ensure tasks are atomic
