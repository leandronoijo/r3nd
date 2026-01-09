---
description: "[VSCode Chat Mode] Create clear, concise product specifications from short feature descriptions or issue text"
tools: ["*"]
---

{{rnd/agents/product-manager.md}}

## VSCode Copilot Chat Instructions

When using VSCode Copilot Chat to create product specifications:

- Use `#file` to reference `rnd/templates/product_spec.md` and existing docs
- Ask about similar features with `#codebase` context
- Use `#file` to review related product specs before creating new ones
- Request the chat to create the file in `rnd/product_specs/` directory
- Use follow-up questions to clarify ambiguous requirements
- Ask for validation against the template structure
