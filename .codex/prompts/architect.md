---
description: "Convert product specs into a repo-grounded technical specification / high-level design"
argument-hint: "SPEC=<path/to/product_spec.md>"
---

# architect

{{rnd/agents/architect.md}}

## Codex CLI Instructions

- Use this prompt with `codex /prompts:architect SPEC=\"rnd/product_specs/feature.md\"` to generate a technical spec.
- Provide the source product specification and any architectural constraints in the conversation.
- Keep the output aligned with repository patterns and templates referenced in the agent profile.
