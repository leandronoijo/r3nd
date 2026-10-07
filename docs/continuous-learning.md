# Continuous Learning

r3nd skills save useful evidence while you work in your coding agent. Retros review a time period across tasks and sessions, so repeated corrections can become specific improvements to your team's skills and instructions.

## Use your existing skills

Invoke `create-tech-spec`, `implement-build-plan`, `bugfix`, or another installed r3nd skill as usual. The active agent records significant corrections, failed verification, material decisions, retries, recovery, and handoffs using its ordinary file tools. Capture is built into canonical skills and the MVP/prototyping replacements. No r3nd executable or separate journal command is needed.

A correction is recorded before the agent acts on it. A failure is recorded before the next repair attempt, and recovery is recorded after verification. The completion summary can link to the run; logging does not wait for a satisfaction question. Existing plan approvals and QA choices still apply.

Capture stays small: roughly 150–400 words and up to three short excerpts for a significant incident, with shorter checkpoints. It does not log every tool call. You can ask the agent to skip capture for a task; teams can customize the shared `agents/shared/learning-journal.md` fragment and regenerate their skills.

## Evidence lives in your repository

```text
r3nd/learning/runs/<run-id>/
  run.json
  events/<event-id>.json
r3nd/retros/<start-utc>--<end-utc>-retro.md
```

These paths use your configured spec root. This seed uses `rnd/`; generated projects usually use `r3nd/`; nested/custom roots work too. The run and event JSON templates live in `templates/learning-run.json` and `templates/learning-event.json`. Replace their example values, including timestamps, rather than treating examples as actual evidence.

Each event preserves the relevant request, attempted behavior, original correction/check result, affected artifacts, and observed outcome. Exact quotations and paraphrases are labeled separately; hypotheses do not replace facts. Existing specs and QA evidence are linked instead of copied into large logs. Credentials and unrelated personal content should be omitted with redaction noted.

Resumed sessions and separate workers receive their own run IDs, linked to earlier/parent runs. Coordinators reference worker events rather than count copied descriptions as additional incidents. An interrupted task remains unknown until a later record supplies an outcome. A recovery or correction adds a linked record rather than erasing the original.

Records remain available across retros. Sharing follows ordinary Git workflows; r3nd does not automatically commit/upload evidence or collect other worktrees' local records. Asset updates preserve consumer evidence, and the skill composer excludes seed runtime records from its cache.

## Review a period in your coding agent

Invoke the installed `create-retro-report` skill with a request such as:

```text
Review today in Asia/Jerusalem.
Review last week across this repository's spec roots.
Create a retro since the last retro.
Review September 28 through October 4, 2026 in Asia/Jerusalem.
```

Retros belong to time windows. Tasks, runs, skills, and PRs supply provenance and optional filters. Unfinished work contributes evidence too. This makes it possible to compare repeated friction across otherwise unrelated tasks.

“Today” starts at local midnight. “Last week” is the previous Monday through this Monday. A date-only inclusive final day ends at the next local midnight. The agent converts boundaries to UTC and uses `[start, end)`, including the start and excluding the end. The report records the timezone and precise boundaries. If timezone is unavailable, the agent states its UTC assumption.

With no period, the default starts at the last complete, unfiltered retro's end for the same spec roots. On first use it covers the preceding seven elapsed days and states that assumption. Filtered or partial reports do not advance this default. No schedule is created; invoke the skill whenever useful.

The agent selects individual events by `captured_at`, even when a run began before the period. `occurred_at` explains delayed capture. Explicitly linked older failures or later-known recovery can provide context without inflating the new-period incident count. Newly discovered older records from Git merges are labeled separately. Unknown times and malformed records are evidence gaps.

The agent processes evidence in batches and writes a report with reviewed event IDs, context IDs, late discoveries, and pending records. If it stops early or cannot determine period membership, coverage is partial. Complete means discoverable eligible evidence was assessed, not that every real interaction was captured. An empty reviewed period can legitimately recommend no updates.

## From two corrections to one proposed edit

Suppose two tasks in the same week changed a schema, but their build plans omitted migration decisions. Both users corrected that omission. The journal preserves each original request, plan excerpt, correction, and eventual recovery.

The weekly retro can inspect the actual `create-build-plan` skill and template, count two independent incidents, and propose one small change:

- **Before:** “List any schema or DTO deltas explicitly.”
- **After:** “List schema/DTO deltas and explicitly decide whether existing data needs a migration or backfill; if neither is needed, explain why.”
- **Verification:** On a future schema-changing task with existing data, check that the plan states the migration/backfill decision before implementation.

This is an illustrative proposal, not an automatically applied change. If that instruction already exists, the retro should investigate whether it was ignored or contradicted rather than blindly add it again. Recoveries, effective guidance, and counterexamples belong in the report alongside failures.

## Report contents

The retro template provides machine-readable period/coverage metadata plus a readable overview, patterns across work, what worked, prioritized skill/agent/template/instruction proposals, exact before/after edits, comparison with earlier periods, and open questions.

Every recommendation links to source evidence and names a responsible process asset, including the effective overlay where appropriate. The retro distinguishes observed facts from cause hypotheses and states confidence with reasons. It proposes edits; applying them is a separate task. Partial capture cannot establish a reliable global failure rate.

Re-running a period updates the same scoped report or a linked revision. If roots/filters differ, a stable scope suffix avoids overwriting another report. Legacy PR reports and `agent_summaries/` remain readable historical evidence; their filenames do not establish period coverage.

## Optional GitHub entry point

The existing `06 — Retro Ready` workflow supports manual dispatch with offset-qualified period start/end, display timezone, and optional comma-separated spec roots. Blank roots discover the configured directory name (or `r3nd`/`rnd` fallback) at the selected revision, including nested roots. It deduplicates tasks by normalized UTC boundaries and scope, then uses the existing Copilot assignment action.

The workflow sees committed evidence at its repository revision, not local-only records. It no longer triggers on PR approval or requires review comments. It creates no recurring schedule. Direct local skill use works independently of GitHub.

The existing launcher can also pass period input, for example `r3nd agents create-retro-report --input "last week in Asia/Jerusalem" --agent codex`; it adds no journal interface.

## Capture limits and validation

Capture is agent-reported. It depends on the coding tool's available context and file operations, and an unexpected termination can lose unsaved evidence. Read-back catches some write errors but does not promise atomicity. Optional source URLs, model identity, hashes, and times must not be invented when unavailable.

Automated tests verify actual skill composition across vendor targets, template distribution, overlay behavior, preservation of consumer evidence, and the period workflow's validation/deduplication. Instruction-following and recommendation usefulness require behavioral checks in the tools teams use. See [validation notes](continuous-learning-validation.md) for the checks performed and remaining limits.
