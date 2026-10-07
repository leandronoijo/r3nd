---
name: create-retro-report
description: Review a time period across recorded interactions and delivery work; propose evidence-backed improvements to skills, agents, templates, and instructions.
---

# create-retro-report

Review “today”, “last week”, an explicit date/time range, or “since the last retro” across tasks and sessions. The period owns the report; a task, run, or PR is evidence context or an optional filter.

{{rnd/agents/retro.md}}
{{rnd/agents/shared/command-hygiene.md}}

## Inputs and output

- Period and timezone, optional repository/spec-root selection and filters.
- Journal: `rnd/learning/runs/*/run.json` and `events/*.json`.
- Earlier reports: `rnd/retros/`; legacy summaries: `rnd/agent_summaries/`.
- Relevant specs, plans, QA artifacts, diffs, and accessible PR discussions.
- Process assets: `rnd/skills/`, `rnd/agents/`, `rnd/templates/`, and applicable `AGENTS.md` / `CLAUDE.md`.
- Output: `rnd/retros/<start-utc>--<end-utc>-retro.md` using `rnd/templates/retro.md`. Use filesystem-safe UTC stamps such as `2026-09-27T210000.000Z--2026-10-04T210000.000Z-retro.md` (normalize to UTC ISO with three fractional digits, remove colons only).

Use normal coding-agent search/read/write tools; no installed r3nd executable, logging command, or PR is required. This skill only reads the journal; do not include delivery capture instructions or journal its own generation.

## 1. Resolve scope and period

1. Resolve repository/spec roots using explicit input and `spec-dir-name` in `r3nd.yaml`. Discover matching nested roots for a repository-wide review; otherwise use the root associated with the invoked skill or explicit artifact. Without configuration, discover `r3nd`/`rnd`, preferring `r3nd` at the same scope. Exclude `.git`, dependency/build output, and unrelated repositories/worktrees. Record the sorted repository-relative roots in the report; ask only when scope is still genuinely ambiguous.
2. Freeze invocation time as the review end for open-ended periods. Observe time with available tools; do not invent it. Resolve calendar phrases in the user's known timezone, otherwise disclose UTC. “Today” means local midnight to invocation; “last week” means the previous Monday through this Monday. Date-only ranges cover whole local days: an inclusive final date becomes the following midnight. Store precise UTC `[start, end)` boundaries and display timezone. Reject reversed/empty/future-ended windows; clarify ambiguous wording or unavailable time only when necessary.
3. For “since the last retro” or no supplied period, inspect earlier report metadata for the same repository/roots, no filters, `coverage: complete`, and valid nonfuture boundaries. Use the latest qualifying end to invocation; if none exists, use the preceding seven elapsed days and state that assumption. Ignore reports superseded by an authoritative revision; contradictory revision chains are a coverage gap. Partial, filtered, PR-named legacy, and invalid reports never advance this default. If the last end equals invocation, report no new interval instead of inventing one.
4. Task/run/PR input alone does not own a retro. Apply the default period and state the reference as an optional filter when explicitly requested; ask if intent remains ambiguous. Store filters in metadata; a filtered report cannot advance repository-wide coverage.

## 2. Discover and inspect evidence

1. Inventory run metadata and event paths across selected roots, then inspect event `captured_at` regardless of when the run/task began or ended. Include unfinished work. Select `start <= captured_at < end`. Check version 1, required fields, matching identities, evidence fidelity, and event links before relying on a record. Unknown/malformed timestamps, incomplete JSON, inaccessible sources, and missing parents are evidence gaps, never silently excluded.
2. Also compare discoverable event IDs against all prior reports for this scope to find previously unreviewed evidence with older capture timestamps (for example records arriving through a Git merge). Treat those as late-discovered evidence, label the original time, and keep them separate from this period's new incidents. On a first retro, older records outside the requested window are historical backlog/context, not newly occurring events; state their existence and review when relevant without silently broadening the requested period. Do not pre-review records captured after the frozen end.
3. Follow explicit failure/retry/recovery, resume, superseding-record, artifact, and PR links. Out-of-window records explain context and belong in `context_event_ids`, not new-period counts. Delayed capture uses `captured_at` for membership and `occurred_at` for explanation. A later recovery may update the interpretation of a previously reviewed failure. Never infer identity or causality from a similar branch, label, or timestamp alone.
4. Read up to 30 events per batch, aiming for about 20,000 characters of excerpts in working context. Maintain an evidence/findings index with inspected IDs and pending paths between batches. Continue through all eligible discoverable evidence; batch size limits context, not period coverage. Inspect a representative source for each proposed pattern and counterevidence, not just summaries.
5. Read relevant legacy summaries and PR discussion as supplementary evidence. Use explicit dates where trustworthy; if timezone/day boundaries are uncertain, label the uncertainty. Do not use local file modification time as historical truth, invent missing quotations, or require human comments to justify a review. State which revision is available; remote automation sees committed evidence only.

## 3. Find patterns and propose improvements

- Group independent incidents by responsible process asset and failure mechanism while preserving each task's provenance. Retries and worker/coordinator duplicates are one incident, not independent recurrence.
- Distinguish missing guidance, ignored guidance, conflicting guidance, missing context, environment failures, and local preference changes. Inspect the actual skill/overlay/instruction before recommending more rules. Preserve successes and counterexamples.
- Prioritize proposals by demonstrated impact, recurrence, and evidence quality. For each, include source links, known outcome, root-cause hypothesis, confidence with its reason, responsible file, exact minimal before/after edit, why it may help, and a concrete verification scenario. Do not apply the edit.
- Map feedback to the workflow that produced it: product spec → `create-product-spec` plus product-manager/template; tech spec → `create-tech-spec` plus architect/template; build plan → `create-build-plan` plus team-lead/template; implementation/QA → actual skill plus relevant agent and scoped instructions. Improve the selected overlay when it owns the effective behavior; do not assume the canonical skill was executed. State uncertain mappings.
- Compare earlier periods only with explicit coverage differences. Do not claim a reduction in failure rates without a comparable denominator. If evidence is insufficient, state the gap or `No updates recommended` rather than inventing findings.

## 4. Write and preserve the period report

1. Fill every section and YAML metadata field in `rnd/templates/retro.md`. Record boundaries, timezone, roots, filters, inspected IDs, out-of-window context, late-discovered IDs, gaps, and pending paths. `reviewed_event_ids` means inspected in-window events; other IDs remain in their separate lists. Store repository-relative source paths; render Markdown links relative to the report file and verify they resolve, with commit-pinned URLs when available.
2. Set `coverage: complete` only after assessing all discoverable eligible evidence with no unresolved scope/time gaps or pending records. Complete describes the review, not completeness of real interaction capture. An interrupted, sampled, or uncertain-membership review is `partial` and cannot advance the next default window. A fully inspected empty period can be complete with `No updates recommended`.
3. Re-running the same boundaries/roots/filters updates the same report or an explicitly linked revision, incorporating later context and preserving prior links/decisions. If a period filename already belongs to different roots or filters, use a stable scope/filter suffix and record it; never overwrite an unrelated report. Only the current authoritative revision is a completion marker.
4. Read back the report to check metadata, evidence links, proposed edits, and coverage. Preserve all journal records, legacy summaries, and old PR reports. Do not delete sources, change product code/tests, apply proposed process edits, create a capture log, or add a schedule.

{{rnd/agents/summary.md}}
