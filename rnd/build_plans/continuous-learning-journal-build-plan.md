# Build Plan: Continuous Learning Journal

> **Source:** User request for continuous learning through r3nd skills, with retros organized by time period
>
> **Created:** 2026-09-30
>
> **Updated:** 2026-10-04
>
> **Status:** Implemented; behavioral pilot limitations documented
>
> **Scope:** Implementation and validation record; see `docs/continuous-learning-validation.md`

Make learning part of using an r3nd skill in Codex, Claude, Cursor, or another coding agent. The active skill instructs the agent to save relevant evidence with its ordinary file tools while work is happening. The retro skill reviews evidence from a time window across tasks and sessions, identifies recurring patterns, and recommends specific improvements to skills, agents, templates, and instructions.

The user continues invoking their existing skills. No journal command, separate logging skill invocation, installed r3nd CLI, or background process is required for capture or retro.

## Task Reference

- **Feature ID:** `continuous-learning-journal`
- **Description:** Replace satisfaction-gated summaries as the primary learning input with durable records captured at meaningful moments.
- **Source format:** This plan translates the agreed problem statement directly; there is no preceding technical spec. T1–T6 are implementation work packages.
- **Dependencies:** Existing shared instruction fragments, skill composition, templates, overlays, and retro workflow.
- **Exposes:** A portable file contract, shared capture instructions, and evidence-backed retros for a defined time period.
- **Acceptance:** Corrections from several tasks are captured while work happens, survive interrupted sessions, and support a period retro that identifies shared patterns without requiring completed tasks, PRs, or satisfaction prompts.

## 0. Pre-Implementation Checklist

- [ ] Read applicable repository instructions at implementation time.
- [ ] Inspect `rnd/agents/summary.md`, `rnd/skills/create-retro-report/SKILL.md`, and `rnd/templates/retro.md`.
- [ ] Inspect the shared fragment includes and existing phase/handoff tracking in canonical skills.
- [ ] Inspect MVP and prototyping skill replacements; capture must survive overlay selection.
- [ ] Inspect skill/template distribution in `cli/src/lib/fs/seedCopier.js` and `cli/src/lib/overlays/overlaySeedService.js`.
- [ ] Inspect duplicated summary/deletion instructions in `cli/src/lib/agents/agentRegistry.js` so existing launchers do not contradict the revised skills.
- [ ] Inspect `.github/workflows/06-retro-ready.yml` to replace its PR-scoped retro contract with period input.
- [ ] Use existing Markdown, JSON, and Jest conventions. No new dependency is planned.

### Current constraints observed in the repository

| Current behavior | Consequence | Required change |
|---|---|---|
| Summary is saved only after explicit satisfaction | Unfinished sessions may leave no durable evidence | Capture independently of completion |
| Summaries contain broad narrative sections | Original corrections and attempted actions can disappear | Preserve relevant excerpts, actions, and outcomes |
| Retro reads all summaries and later deletes them | The review period is unclear; recurrence history disappears | Select evidence by time window and retain history |
| Retro primarily expects PR discussion | Learning is tied to delivery units instead of patterns over time | Review a time window across tasks, sessions, skills, and PRs |
| Improvement targets omit explicit skill updates | The responsible workflow may be missed | Treat skills as first-class targets |
| Overlay skills replace base skills | Base-only edits leave capture gaps | Include capture in overlay replacements |

## 1. Implementation Overview

Implement the feature primarily in repository Markdown: a shared capture fragment, two record templates, updates to existing skills, and a revised retro contract. Agents create and inspect files with the capabilities already available in their coding tool. r3nd's existing distribution code only needs to deliver the revised assets correctly.

### User experience

1. Invoke an existing r3nd skill normally, for example `implement-build-plan`.
2. If the user corrects the approach or a meaningful failure occurs, the agent saves a compact event before continuing. No separate logging request is needed.
3. At handoffs and completion, the agent records unresolved issues or verified recovery and passes record paths with the existing task context.
4. Invoke `create-retro-report` with a period, such as “today”, “last week”, or “since the last retro”. It reviews evidence across work performed during that period and proposes concrete edits.

Native transcript ingestion, live observers, replay evaluation, automatic skill modification, and a journal CLI are outside this implementation. Capture remains `agent_reported`: instructions can improve timing and specificity, but cannot guarantee an agent records every interaction or writes before abrupt termination. The validation pilot must measure actual compliance.

### Storage and identity

```text
<spec-root>/learning/
  runs/<run-id>/
    run.json
    events/<event-id>.json
<spec-root>/retros/
  <start-utc>--<end-utc>-retro.md
```

- Use the spec root associated with the invoked skill/artifact. Honor `spec-dir-name` in `r3nd.yaml`, custom/nested roots, and the existing `r3nd`/`rnd` fallback. Resolve from the repository context, not just the shell's working directory. Ask only if genuinely ambiguous roots remain after inspection.
- Reuse an existing feature/task ID and artifact path when available. Otherwise derive a short task label and pair it with a unique run ID; a repeated label alone does not prove two runs are related.
- Give each session/worker its own run directory and unique event names. Generate IDs using available tools, check for collisions, and never overwrite an existing unrelated record. Preserve task ID, parent run, and resume links through handoffs.
- Start the run lazily at the first meaningful event or checkpoint. A task with no significant event needs at most one closing checkpoint; do not create an empty bundle for every invoked helper skill.
- Write complete records in one file operation where supported, then read back to confirm valid content. Tool-dependent writes are not a universal atomicity guarantee; retro must recognize incomplete records and report the gap.
- Keep records append-only during normal work. Record recovery, later PR associations, and corrections as new linked events. A run without a closing outcome remains unknown, not automatically failed or abandoned.
- Keep evidence across retros. Sharing uses normal Git workflows; there is no automatic commit/upload or cross-worktree store. Deliberate removal of sensitive content remains possible.

### Retros belong to time periods

The primary unit of review is a time window within the selected repository/spec roots. Task, run, skill, and PR IDs remain provenance and optional drill-down filters. Multiple unrelated tasks in the same window are expected input: compare their patterns without pretending they share a single causal chain.

- Accept a named period, explicit dates/times, or “since the last retro”. Resolve calendar phrases in the user's known timezone, write the timezone and exact boundaries into the report, and use UTC for stored comparisons. If no timezone is available, state the UTC assumption. Use a half-open interval `[start, end)` so adjacent periods do not double-count boundary events.
- Proposed default when no period is supplied: from the end of the last complete, unfiltered retro for the same repository/spec-root scope to the invocation time. For the first retro, use the preceding seven days and state the range. A partial report or a filtered drill-down does not advance this default. Explicit historical or overlapping periods remain valid.
- Select individual events by `captured_at`, not by the run's start/end or the task/PR completion date. This makes an unfinished task eligible and brings newly recorded evidence into the next period even if its original incident occurred earlier. Store `occurred_at` separately when known; label delayed capture.
- Discover run/event metadata across the selected roots before selecting records. A run started before the window may contain events inside it. Use linked events outside the window to explain an incident, labeled as context and excluded from the period's new-event counts.
- Freeze the report's end time at invocation. Analyze all discoverable in-window evidence in bounded batches; batching limits working context, not the report's period coverage. If some records remain unreviewed, mark coverage partial and list the outstanding scope.
- Check for previously unreviewed records introduced by later Git merges with older capture timestamps. Include these as explicitly labeled late-discovered evidence, not newly occurring incidents. Unknown/malformed timestamps belong in an evidence-gap list until resolved, never silently outside the window.
- Persist period boundaries, timezone, selected roots, optional filters, reviewed event IDs, late-discovered/context IDs, and coverage status in the report. Re-running the same period updates its report or produces an explicitly linked revision; it must not create competing completion markers or delete sources. Keep old PR-named reports as historical artifacts without inferring time coverage from their filenames.

No schedule is implied by a time-based retro. Users can invoke the skill at any cadence; automatic scheduling is a separate decision.

### Capture triggers

| Trigger | Evidence | Timing |
|---|---|---|
| User correction or rejected approach | Relevant original request, attempted action, correction excerpt, affected artifact | Before acting on the correction |
| Meaningful verification failure or blocker | Check/command identity, expected and actual result, concise output | Before the next repair attempt |
| Repeated failed approach | Related failure ID, new attempt, what changed | At the retry boundary |
| Material decision or scope change | Decision, reason, affected artifact/contract | When the decision is made |
| Verified recovery | Related failure IDs, changed action, confirming check | After verification |
| Handoff, planned compaction, or completion | Relevant record paths, artifacts, unresolved issues, observed outcome | Before yielding context or signaling completion |

Do not log routine tool calls or every successful check. Preserve successful recovery and effective existing guidance as counterevidence. Planned handoffs are capture opportunities; unexpected tool-managed compaction cannot be assumed to offer a hook.

## 2. Implementation Steps

### T1 Define portable record templates

- **Files:** Create `rnd/templates/learning-run.json` and `rnd/templates/learning-event.json`.
- **Action:** Define schema version 1 using Section 4. Supply syntactically valid examples with concise explanatory guidance in the shared fragment added by T2. Keep required fields few enough for agents to fill consistently.
- **Dependencies:** None.
- **Golden reference:** Existing artifact templates and template distribution.
- **Acceptance:** Examples parse as JSON; a reviewer can identify the task, source skill, observation, evidence, and related outcome without the original conversation. Unknown provenance is explicitly unknown.
- **Effort:** Small.

### T2 Embed capture in existing skills

- **Files:** Create `rnd/agents/shared/learning-journal.md`; update `rnd/agents/summary.md`; update canonical `rnd/skills/*/SKILL.md` and `overlays/{mvp,prototyping}/skills/*/SKILL.md` as applicable. Re-inventory the current 15 canonical and 16 overlay skills before editing.
- **Action:** Include the shared capture fragment once near the operating instructions of each delivery/analysis skill. The retro skill is a reader and does not capture its own report generation. Keep the fragment concise: root resolution, triggers, template paths, write/read-back, evidence quality, and handoff rules.
- Instruct the active coding agent to write records directly using its normal file tools. There is no preference for or fallback to a journal command.
- Preserve exact user wording when available; distinguish verbatim excerpts from paraphrases. Include enough original request and attempted behavior to explain why a correction mattered. Reference existing specs, diffs, and QA artifacts rather than duplicating their full content.
- Pass task/run paths and unresolved event IDs in existing handoffs and trackers. A resumed session starts a linked run after inspecting the handed-off evidence. Workers write their own events; coordinators reference worker records rather than copying them as new incidents.
- Replace satisfaction-gated summary logging with timely capture and a short completion summary linking to the relevant run when useful. Do not add a satisfaction question for journaling. Leave unrelated approval/QA choices intact.
- Make compact learning records an explicit part of MVP/prototyping workflows without adding planning or QA ceremony. If the user disables capture for the task, honor it; repository owners can customize the shared fragment. A new configuration subsystem is unnecessary for v1.
- Report a failed write briefly and continue the primary task where possible. Do not claim a record exists until read-back confirms it.
- **Dependencies:** T1.
- **Acceptance:** Direct skill use captures a scripted correction before the next action; a failure/recovery pair is linked; handoff preserves record paths; overlays participate; no r3nd executable is invoked or required.
- **Effort:** Medium.

### T3 Teach the retro skill to analyze a period across work

- **Files:** Update `rnd/skills/create-retro-report/SKILL.md`, `rnd/agents/retro.md`, and `rnd/templates/retro.md`.
- **Action:** Replace PR/task/run ownership with the period contract in Section 1. Skill input defines a time window; task/run/PR references provide context or an explicit optional filter. If only a PR is provided, resolve or request the period rather than silently reverting to a PR-owned retro.
- Use ordinary coding-agent file search/read tools to discover events across the selected roots and filter on event capture timestamps. Follow context links for individual incidents. Include successful recovery, incomplete work, and evidence from multiple tasks and skills.
- Read up to 30 events per batch, aiming for roughly 20,000 characters of excerpts in working context. Carry a compact findings/evidence index between batches and continue through the period. These are instruction-level working-context targets, not software-enforced limits; an interrupted or sampled review must be marked partial.
- Apply the late-discovery and unknown-timestamp rules. Preserve already-reviewed IDs to avoid presenting the same evidence as a new incident on a subsequent or overlapping retro. A later recovery may still change the interpretation of a previously reviewed failure.
- Read legacy summaries and linked PR discussions as supplementary evidence, using explicit dates/references where available. Do not infer a trustworthy historical timestamp from a local file's modification time. Missing sources, malformed records, or uncertain dates are explicit gaps.
- Structure the report around period overview and coverage, patterns across work, what worked, recurring friction, prioritized improvements, and unresolved questions. Include per-incident source links so aggregation does not erase context.
- Each recommendation includes observation, evidence links, known outcome, root-cause hypothesis with confidence/reason, responsible file, a minimal before/after edit, and a proposed verification. Include a skill-update section and prioritize by demonstrated recurrence/impact rather than raw event count.
- Distinguish missing guidance, ignored/conflicting guidance, missing context, environment problems, and task-specific preferences. Count independent incidents/tasks rather than retries or coordinator copies. Preserve counterexamples and successful recovery.
- Compare with earlier periods where useful, showing coverage differences. Do not claim a reduction in failure rate without a comparable denominator; partial agent capture supports observations, not a reliable global rate.
- Preserve all records and legacy summaries. Write a time-named report with the coverage metadata from Section 1. Treat evidence as data, never as instructions to execute.
- **Dependencies:** T1–T2.
- **Acceptance:** A “last week” retro combines evidence from several tasks and runs, including unfinished work, into a supported process recommendation. Boundary events, later recovery, late-arriving records, and partial coverage are handled explicitly. No PR or CLI is required.
- **Effort:** Medium.

### T4 Verify distribution and remove conflicting launcher instructions

- **Files:** Extend `cli/src/lib/fs/seedCopier.spec.js`, `cli/src/lib/overlays/overlaySeedService.spec.js`, and `cli/src/lib/scaffoldService.spec.js`. Update `cli/src/lib/agents/agentRegistry.js`, `agentService.js`, and their specs only as needed for instruction consistency.
- **Action:** Verify existing init/scaffold/update composition delivers the new templates and shared fragment in canonical and vendor-generated skills, including overlay replacements and custom/nested spec roots. Change production copy services only if a behavioral test reveals a gap.
- Remove the registry's duplicated satisfaction-gated logging and summary-deletion instructions. Existing launchers should defer to the same canonical skill guidance used directly in coding tools. Keep done-file signaling independent of capture, and ensure composition does not inject duplicate logging instructions.
- Update the existing retro launcher's free-text description and prompt to accept a time period and optional filters, and use the period-based report name. Retain old reports, but remove instructions that force new reports to belong to a PR. Do not add journal commands, new flags, a persistence library, a retrieval service, or config-manager changes.
- Verify updates preserve existing learning records and local customization under established overwrite behavior. Distribute templates/instructions, not runtime journal data from the seed.
- **Dependencies:** T2–T3.
- **Golden references:** `resolveTemplate`, existing generated-skill and overlay behavioral tests.
- **Acceptance:** Generated skills contain resolved capture instructions once; new templates are present; existing launchers no longer require satisfaction to save evidence or delete it afterward. A consumer can execute the workflow through copied skills alone.
- **Effort:** Small to medium.

### T5 Align the existing GitHub workflow with period retros

- **Files:** Update `.github/workflows/06-retro-ready.yml`; add a behavioral test alongside existing CLI tests, for example `cli/src/lib/agents/retroWorkflow.spec.js`.
- **Action:** Replace the PR-number-required dispatch contract with period start/end, timezone, and repository/spec-root scope. Remove the PR-approval trigger for automatic PR-owned retros. Keep manual dispatch as an optional way to request the same period review; do not add a recurring schedule in this implementation.
- Generate a time-named task describing the exact window and available repository revision. Deduplicate by normalized period and scope rather than PR number. Do not require human PR comments or changed journal files in one particular PR to qualify.
- State that the workflow sees only committed evidence available at its selected revision. PR discussion can supplement the evidence, but a particular PR no longer defines the report. Keep current task assignment behavior; do not upload local-only records or execute untrusted branch code.
- **Dependencies:** T3–T4.
- **Acceptance:** Mocked workflow-script tests cover valid/invalid boundaries, timezone input, identical-window duplicates, different periods, selected spec roots, and a period with no evidence. No real issue creation or automatic scheduling is needed for verification.
- **Effort:** Small.

### T6 Document and pilot direct skill use

- **Files:** Update `README.md`, `docs/concepts.md`, `docs/workflows.md`, `docs/getting-started.md`, and the existing compatibility description in `cli/README.md`.
- **Action:** Document the ordinary coding-agent flow, capture triggers, evidence locations, handoff/resume, retained history, and period-based local retro invocation. Include an example where corrections from different tasks in the same week lead to one supported skill edit. Explain that no separate user command is needed to record events.
- Pilot actual generated skills in available coding tools, including an overlay, several tasks in one period, and an interrupted/resumed task crossing a period boundary. Compare recorded evidence with the visible interactions, then compare a journal-backed retro with the legacy-summary version. Record what was actually tested and where access was unavailable.
- **Dependencies:** T2–T4; include T5 coverage before completing the release.
- **Acceptance:** Complete the scenarios in Section 5 and record observed capture gaps, overhead, and human judgments of recommendation usefulness. Fix weak capture guidance based on this evidence.
- **Effort:** Medium.

## 3. File and Module Changes

| Area | Action | Purpose |
|---|---|---|
| `rnd/templates/learning-{run,event}.json` | Create | Small portable record contract |
| `rnd/agents/shared/learning-journal.md` | Create | Capture instructions for the active coding agent |
| `rnd/agents/summary.md` | Modify | Remove satisfaction-gated logging |
| Canonical skills and MVP/prototyping replacements | Modify | Capture at meaningful moments and pass evidence at handoffs |
| Retro skill, agent, and template | Modify | Review evidence by period across tasks and propose supported edits |
| Existing seed/overlay/scaffold tests | Extend | Verify the assets users actually install |
| Existing agent registry/service and tests | Align where needed | Eliminate instructions conflicting with direct skill use |
| Existing GitHub retro workflow and behavioral test | Modify/create test | Request period retros through optional manual dispatch |
| Repository docs and CLI compatibility docs | Modify | Explain skill-based usage and limitations |

## 4. Record Contract

Keep JSON to support future adapters, but make the first version practical to write and inspect with normal agent tools. There is no new runtime schema validator or storage engine. Templates, capture instructions, read-back, and retro checks define the contract.

### Run metadata

Required: `schema_version: 1`, unique `run_id`, `task_id`, short `task_description`, `spec_root`, `skill_path`, `started_at` (UTC or explicit unknown), and `capture_mode: agent_reported`.

Optional: primary artifact path, `parent_run_id`, `resumes_run_id`, observed vendor/model, branch/commit, skill/instruction hashes when easily available. Record the actual generated or overlaid skill used and its canonical source when known. Do not invent fingerprints or imply that all loaded instructions were observable. Full instruction snapshots for replay are deferred.

### Event fields

| Field | Requirement |
|---|---|
| `schema_version`, `event_id`, `run_id`, `task_id` | Required identity; match the run metadata |
| `kind` | Correction, failure, retry, decision, recovery, checkpoint, outcome, association, or record correction |
| `captured_at`, `phase` | Capture timestamp in UTC and workflow phase; if time is unavailable, mark unknown and flag for period assignment |
| `occurred_at` | Optional known incident time; distinguish delayed capture from when the event actually happened |
| `observation` | Required factual account of what happened |
| `evidence` | Relevant excerpts with source type/path where available and fidelity: verbatim, paraphrase, or redacted |
| `expected`, `actual`, `action_taken` | As relevant; preserve original request and attempted behavior for corrections |
| `related_event_ids` | Required for recovery/retry; use relative file paths as well when linking another run |
| `artifacts`, `process_assets` | Relevant repo-relative paths; revision/hash when known |
| `outcome` | Verified result or explicitly unresolved/unknown; success needs supporting evidence |
| `associations`, `supersedes_event_id` | Only for later context links or correction of an earlier record |
| `hypothesis`, `category` | Optional interpretation and retrieval label, distinct from observed facts |

Aim for approximately 150–400 words per significant event, with up to three short excerpts. Closing checkpoints can be shorter. Keep enough context to explain the incident; link larger specs, diffs, and check output rather than pasting them. Mark omitted context and avoid credentials or unrelated personal content. These are guidance targets, not enforced byte limits.

### Retro report metadata

Required: `period_start`, `period_end` (UTC), `display_timezone`, `spec_roots`, optional `filters`, `generated_at`, `coverage` (`complete` or `partial`), `reviewed_event_ids`, `context_event_ids`, `late_discovered_event_ids`, and an explicit list of evidence gaps or unreviewed records. “Complete” means all discoverable eligible records were assessed; it does not assert that every real interaction was captured. Only complete, unfiltered reports for matching roots participate in the default next-window calculation.

## 5. Test Strategy

### Automated verification

Extend existing Jest tests for real template/skill composition, overlay replacement, custom roots, retained consumer data, and launcher prompt compatibility. Add JSON parsing and required-field checks for the shipped examples within those tests. Exercise the GitHub workflow script with mocked APIs.

Use the locally installed Jest binary for affected suites, then run the existing suite. The package manifests currently define no lint/type-check scripts; use available project checks rather than inventing gates. Do not create a simulated journal engine solely to test behavior that will actually be performed by a coding agent.

### Behavioral pilot in coding tools

| Scenario | Expected observation |
|---|---|
| Correct an approach during an existing skill | Original request, attempted action, and correction are saved before the next action |
| Fail a check, retry, and recover | Evidence links distinguish the incident, attempts, and verified outcome |
| Interrupt after an event; resume with task context | Existing record survives; resumed work links to it; no invented final status |
| Run two independent tasks/workers in one week | Both contribute to the period retro; provenance remains distinct and duplicate worker reports are not counted as independent failures |
| Use an MVP/prototyping replacement | Capture works without adding full-workflow ceremony |
| Invoke “retro last week” or an explicit date range | Agent reviews the whole period across tasks and skills, including unfinished work, without a PR or CLI |
| Adjacent periods and a run spanning both | Events enter the correct half-open window using capture timestamps; run start does not exclude later events |
| Late capture, late Git merge, and out-of-window recovery | Newly captured evidence and late discoveries are distinguished; linked context is not counted as a new period incident |
| Partial review, filtered review, and overlapping rerun | Coverage is explicit; partial/filtered reports do not advance the default window; repeated evidence is identified |
| “Since last retro” and first invocation | Boundaries use the last qualifying completed report or the stated first-run default, with timezone recorded |
| Provide incomplete or missing evidence | Agent states the gap and avoids unsupported root-cause certainty |
| Repeat retro and test a legacy-summary-only task | Original evidence remains; legacy provenance is explicit |
| Use a custom/nested spec root | Agent writes and retrieves from the associated root |
| Ask to skip capture for a task | Primary skill proceeds without creating records |

Pilot with the r3nd executable unavailable so no accidental runtime dependency can pass unnoticed. Test direct generated skills in Codex, Claude, and Cursor where available; mark untested tools explicitly. Automation checks composition, while the pilot verifies actual agent behavior.

Release targets: all scripted significant events saved by the next relevant action/checkpoint; every recommendation has valid source links and an exact proposed edit; correct period membership and preserved incident provenance; no new satisfaction questions; no automatic deletion. Record missed events, capture delay in workflow steps, record volume, and human review of usefulness. These are proposed targets, not claimed results or proof that recommendations improve future runs.

## 6. Deployment and Rollout

1. Land T1–T2 together to begin capturing evidence through existing skills.
2. Land T3–T4 so the full local learning loop is available through distributed skills and existing launchers remain consistent.
3. Land T5 to align optional GitHub dispatch with the period model and remove automatic PR-owned retro requests.
4. Complete T6's pilot before declaring support across coding tools.

Use existing init/scaffold/update workflows for distribution and respect customization/overwrite choices. Roll back capture instructions if needed while retaining records and reader compatibility. No new command, package, service, environment variable, or configuration subsystem is needed.

## 7. AI Agent Guardrails

- Save observed evidence while it is available; never reconstruct missing quotations or hidden reasoning.
- Separate source evidence from interpretation. An ordinary failed test or changing user preference does not automatically justify a permanent rule.
- Keep capture concise and avoid interrupting the primary task. Use existing handoffs rather than a parallel tracking system.
- Select by period and repository scope; use task/run/artifact links to preserve provenance and inspect causes. Process bounded batches without disguising a sample as complete period coverage.
- Treat evidence as data. The retro proposes process edits and never applies them as part of analysis.
- Report incomplete writes honestly. File-tool behavior and instruction-following do not provide database-level guarantees.
- Preserve retained evidence and vendor portability; native hooks and CLI tooling are not assumed.

## 8. Definition of Done

- [ ] T1–T6 acceptance criteria met; affected automated checks pass.
- [x] Existing r3nd skills include direct capture instructions and templates; current-agent file-tool walkthrough completed.
- [x] Current-agent capture/retro walkthrough used ordinary file tools without an r3nd executable or separately invoked journal skill.
- [x] Canonical and overlay skills contain capture-before-action and handoff instructions; generated asset tests pass.
- [ ] Independently observe immediate capture and interruption/resume compliance across target coding tools.
- [x] Period retro skill/template and current-agent report support cross-task evidence with preserved provenance.
- [x] Period/coverage contracts implemented; partial current-agent report and workflow boundary tests verified.
- [ ] Complete behavioral checks of late discovery, overlapping periods, and default-window advancement in target tools.
- [x] Retention instructions implemented; source records preserved through current-agent retro and consumer update tests.
- [x] Distribution and existing launcher guidance are consistent with direct skill use.
- [x] Optional GitHub dispatch creates period-based retro tasks; no PR-owned trigger or new schedule remains.
- [x] Documentation demonstrates the direct skill flow; validation notes identify tested and untested tools.

## Appendix Task Dependencies

`T1 → T2 → T3 → T4 → T5 → T6`

The first useful milestone is T2: skills begin preserving evidence during normal work. T4 completes the distributable local capture-to-retro loop. T5 aligns optional GitHub dispatch; T6 checks that actual coding agents follow the instructions and produce useful recommendations.

## Implementation Validation

T1–T5 are implemented. T6 documentation and the current-agent walkthrough are complete; independent live-tool behavioral checks remain pending and are explicitly listed above. Automated checks passed across all generated vendor targets and both compact overlays. See [validation notes](../../docs/continuous-learning-validation.md) for the exact walkthrough, delayed-capture limitation, and untested scenarios. No live Claude/Cursor compliance or human usefulness evaluation is claimed.
