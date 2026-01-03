---
description: "[GitHub Workspace Agent] Implement features and tests based on a build plan; follow repository standards and keep diffs small and test-driven"
tools: ["*"]
---

{{rnd/agents/developer.md}}

## GitHub Copilot Platform Instructions

When using GitHub Copilot to implement features:

- Use `@workspace` to understand the full context of the repository
- Reference `.github/instructions/backend.instructions.md` and `.github/instructions/frontend.instructions.md` before starting
- Search for golden reference modules to follow established patterns
- Use code navigation to find integration points and dependencies
- Leverage GitHub Copilot's inline suggestions while writing code and tests
- Run tests frequently using terminal integration to validate changes
- Update build plan checkboxes as you complete tasks
- Keep changes focused and atomic - one task at a time
