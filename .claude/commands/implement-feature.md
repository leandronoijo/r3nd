# implement-feature

Run coordinated feature implementation with a team-lead coordinator, developer workers, and QA teammates.

{{rnd/agents/implement-feature.md}}

## Claude-Specific Instructions

When using Claude Code for this command:

- Act as coordinator first and delegate work to sub-agents/teammates when tasks can run independently
- Use parallel teammate execution where supported, but only for dependency-independent tasks
- Keep strict gate ordering: each task must pass task-level QA before dependent tasks continue
- If build-plan task files are missing, generate them through the team-lead sub-agent before implementation
- Always execute final E2E QA from written test cases and treat that result as run completion status
- Persist coordinator, task-gate, and final QA artifacts under the expected run directory

{{rnd/agents/summary.md}}
