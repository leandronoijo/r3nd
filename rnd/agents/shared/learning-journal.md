## Learning Journal

Capture significant evidence during this skill using your ordinary file tools. No r3nd executable or separate logging command is needed. These small records are an explicit exception to this skill's artifact/write-scope limits, including MVP/prototyping limits. Do not add planning, approval, or QA steps for capture. Honor a user's request to skip capture. `create-retro-report` only reads evidence and does not journal its own report generation.

### Resolve and start lazily

1. Resolve the repository and the spec root associated with the active skill or input artifact. Honor `spec-dir-name` in `r3nd.yaml` and nested/custom spec roots. If no explicit root is available, find `r3nd/` or `rnd/`, preferring `r3nd/` at the same scope. Do not let the shell's subdirectory select an unrelated root; ask only if ambiguity remains after inspection.
2. At the first significant event, use `rnd/templates/learning-run.json` and `rnd/templates/learning-event.json` from that resolved root. Replace every example value with observed facts. Reuse the feature/task ID when available; otherwise choose a short task label. A matching label alone is not a link between sessions.
3. Generate a unique run ID with available tools (UUID preferred), check the destination is unused, and create `rnd/learning/runs/<run-id>/run.json`. Use unique event filenames under its `events/` directory. Paths here use `rnd` as the active spec root, not necessarily a folder literally named `rnd`.
4. Reuse this run for helper skills in the same session; record the responsible skill in event `process_assets`. A resumed session or separate worker gets a new run with `resumes_run_id` or `parent_run_id`. Pass task ID, spec root, run path, and unresolved event paths through existing handoffs/trackers. Coordinators reference worker events instead of copying them as new incidents.

### Write at meaningful moments

| Kind | Capture | Timing |
|---|---|---|
| `user_correction` | Original request, attempted approach, correction excerpt, affected artifact | Before acting on the correction |
| `verification_failure` | Check/command, expected and observed result, concise output | Before the next repair attempt |
| `retry` | Prior failure reference, attempt number, changed approach | At the retry boundary |
| `decision` | Material scope/approach decision, reason and affected contract | When decided |
| `recovery` | Related failures, changed action, confirming check | After verification |
| `checkpoint` / `outcome` | Artifacts, unresolved events, observed result | Before handoff, planned compaction or completion |
| `context_link` / `record_correction` | Later PR/artifact association or correction of a prior record | When new context becomes available |

Use one complete JSON write per event where supported, then read back to confirm parsing and content. Ensure version 1, identity matching the run, `kind`, `captured_at`, `phase`, factual `observation`, and `evidence` are present. Recovery/retry must reference their failure; link another run with both ID and repo-relative event path. A later correction uses `supersedes_event_id` and the source path. Never overwrite an unrelated file. If a write fails, report the capture gap briefly and continue the primary task where possible; never claim evidence was saved without read-back.

Aim for 150–400 words per significant event, up to three short excerpts; checkpoints can be shorter. Log meaningful failures/repeated attempts, not every tool call or routine successful check. A quiet task needs at most one closing checkpoint, not an empty bundle for every helper. Do not delay an event until satisfaction or completion.

### Keep evidence trustworthy

- Obtain capture time from an available clock/tool and store UTC ISO 8601. Keep `occurred_at` separately when known; do not backdate delayed capture. If time cannot be observed, use `unknown` and flag that the event needs period assignment. Do not reuse the templates' example timestamps.
- Preserve relevant user wording when available; mark `fidelity` as `verbatim`, `paraphrase`, or `redacted`. Source references may be null when the tool exposes no message URL. Never invent quotes, hidden reasoning, model IDs, fingerprints, or inaccessible sources.
- Separate observation/expected/actual from optional `hypothesis`. Link existing specs, diffs, and QA artifacts rather than copying large outputs. Omit credentials and unrelated personal content; mark omitted context.
- Record the actual generated/overlaid skill and known process assets. Branch/commit, vendor/model, and hashes are optional observed context, not identity. File paths are repository-relative.
- Outcomes are `resolved`, `unresolved`, `blocked`, `completed`, `cancelled`, or `unknown`. A successful recovery needs verification evidence. Missing completion means unknown, not abandoned or failed.
- Preserve evidence across sessions and retros. Recovery and updated associations are new linked events. Do not auto-delete records or legacy `rnd/agent_summaries/`, commit/upload them automatically, or infer that another worktree's local evidence is available.

Capture is agent-reported and tool-dependent: read-back does not guarantee atomic writes or complete interaction capture. Unexpected compaction/termination may lose unsaved context. Keep the latest run/event paths in existing handoff notes so later work can recover what was saved.
