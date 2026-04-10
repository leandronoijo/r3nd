---
description: "[VSCode Chat Mode] Run coordinated feature implementation with a team-lead coordinator, developer workers, and QA teammates"
tools: ["*"]
---

{{rnd/agents/implement-feature.md}}
{{rnd/agents/summary.md}}

## VSCode Copilot Chat Instructions

When using VSCode Copilot Chat for this command:

- Use `#file` and `#codebase` to gather context, then coordinate work as a team-lead flow
- Delegate sub-tasks to teammate agents/chats when possible, especially for independent tasks
- Keep dependency ordering strict and only parallelize dependency-independent work
- Require task QA gate PASS before starting dependent tasks
- Ensure test cases exist before final verification, generating them when missing
- Always run final E2E QA and treat it as the source of truth for run success
- Persist run artifacts and status updates at every coordinator checkpoint
