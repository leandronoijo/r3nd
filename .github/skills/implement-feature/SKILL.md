---
name: implement-feature
description: Run coordinated feature implementation with a team-lead coordinator, developer workers, and QA teammates.
---

# implement-feature

Run coordinated feature implementation with a team-lead coordinator, developer workers, and QA teammates.

{{rnd/agents/implement-feature.md}}

## GitHub-Specific Instructions

When using GitHub Copilot for this skill:

- Act as the coordinator and delegate to sub-agents or teammates whenever practical.
- Run dependency-independent tasks in parallel only; preserve strict dependency order otherwise.
- Enforce task-level QA gates before unblocking dependents.
- If build-plan task files are missing, generate them before implementation continues.
- Never skip final E2E QA from written test cases.
- Persist required run artifacts after each task and QA cycle before continuing.

{{rnd/agents/summary.md}}
