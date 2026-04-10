---
description: "[VSCode Chat Mode] Implement features and tests based on a build plan; follow repository standards and keep diffs small and test-driven"
tools: ["*"]
---

{{rnd/agents/developer.md}}
{{rnd/agents/summary.md}}

## VSCode Copilot Chat Instructions

When using VSCode Copilot Chat to implement features:

- Use `#file` to read instruction files before starting implementation
- Reference `#codebase` to find golden reference modules
- Ask about patterns and conventions with `#codebase` context
- Use `#file` to read the build plan and understand tasks
- Request code generation with inline context
- Ask the chat to run tests using terminal commands
- Use follow-up questions to refine implementations
- Update build plan checkboxes as you complete tasks
- Keep changes focused and atomic
