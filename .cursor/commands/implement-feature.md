# implement-feature

Run coordinated feature implementation with a team-lead coordinator, developer workers, and QA teammates.

{{rnd/agents/implement-feature.md}}
{{rnd/agents/summary.md}}

## Cursor-Specific Instructions

When using Cursor for this command:

- Treat this as a coordinator run and delegate to teammate agents whenever tasks can be split safely
- Use Cursor + external teammates (for example Codex and Claude) for dependency-independent tasks when possible
- Keep dependency-aware scheduling strict: only parallelize tasks that do not depend on each other
- Enforce a task QA gate result before unblocking dependent tasks
- Never skip final E2E QA even when task-level gates pass
- Persist run artifacts and summaries after each coordinator/worker cycle
