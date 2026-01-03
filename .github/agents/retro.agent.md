---
description: "Review PR discussions to identify improvements to agents, templates, or instructions; write a retro report to rnd/retros"
tools: ["*"]
---

{{rnd/agents/retro.md}}

## GitHub Copilot Platform Instructions

When using GitHub Copilot to create retro reports:

- Use `@workspace` to review PR discussions, comments, and review threads
- Reference `.github/templates/retro.md` as the canonical structure
- Search the codebase for agent profiles, templates, and instruction files mentioned in feedback
- Use code navigation to understand the process artifacts that need improvement
- Map each issue to a specific agent, template, or instruction file
- Propose concrete, minimal changes with exact file paths
- Write the retro report directly to `rnd/retros/` using file creation tools
- Include evidence links to PR comments for each recommendation
