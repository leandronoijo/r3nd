---
name: implement-feature
description: Run coordinated feature implementation with a team-lead coordinator, developer workers, and QA teammates.
---

# implement-feature

Run coordinated feature implementation with a team-lead coordinator, developer workers, and QA teammates.

{{rnd/agents/implement-feature.md}}

## Codex-Specific Instructions

When using Codex CLI for this command:

- Act as the coordinator and delegate to sub-agents/teammates whenever practical
- Use Codex multi-agent capabilities (for example teammate/child-agent patterns) when available
- Run dependency-independent tasks in parallel only; preserve strict dependency order otherwise
- Enforce task-level QA gates before unblocking dependents
- Never skip final E2E QA from written test cases
- Persist required run artifacts after each task and QA cycle before continuing

{{rnd/agents/summary.md}}
