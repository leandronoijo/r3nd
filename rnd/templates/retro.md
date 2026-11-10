---
schema_version: 1
period_start: "<UTC ISO 8601 inclusive start>"
period_end: "<UTC ISO 8601 exclusive end>"
display_timezone: "<IANA timezone or UTC>"
spec_roots: []
filters: {}
generated_at: "<observed UTC ISO 8601>"
coverage: partial
reviewed_event_ids: []
context_event_ids: []
late_discovered_event_ids: []
evidence_gaps: []
unreviewed_records: []
supersedes_report: null
---

# Retro for <period in display timezone>

## 1. Period and coverage

State the exact UTC `[start, end)` boundaries, local display period, repository/spec roots, filters, and available revision. Explain defaults, partial coverage, late-discovered evidence, and any uncertainty. Complete means all discoverable eligible records were assessed, not that every interaction was captured.

| Evidence | Count and scope |
|---|---|
| In-window events / independent incidents | <counts; distinguish retries and coordinator copies> |
| Tasks, runs, and skills represented | <coverage, including unfinished work> |
| Outside-window context / late discoveries | <separate counts and source links> |
| Legacy summaries / accessible PR discussions | <supplementary coverage> |
| Unreviewed records / evidence gaps | <counts, paths, and reasons; mark partial where needed> |

## 2. Patterns across work

For each observed pattern, preserve incident provenance rather than assuming all tasks share a cause.

| Pattern and observed impact | Independent incidents and evidence | Known outcome / counterexamples | Root-cause hypothesis and confidence |
|---|---|---|---|
| <pattern> | <task/run and source links> | <recovery, unresolved result, effective guidance> | <hypothesis, confidence and reason> |

## 3. What worked

Record effective guidance, successful recovery, and practices worth preserving with supporting source links. State if no such evidence is available.

## 4. Prioritized improvements

### Skill updates

| Priority | Responsible skill or overlay | Proposed change | Evidence |
|---|---|---|---|
| <priority> | <exact path> | <minimal change> | <source links> |

### Agent, template, and instruction updates

| Priority | Asset type and exact path | Proposed change | Evidence |
|---|---|---|---|
| <priority> | <agent/template/scoped instruction> | <minimal change> | <source links> |

### Exact proposed edits

Repeat this block only for supported proposals:

- **File and location:** <exact path/section>
- **Observed problem and outcome:** <facts, source links, independent incident count>
- **Hypothesis and confidence:** <cause hypothesis, reason, counterevidence>
- **Before:** <exact current excerpt>
- **After:** <small proposed replacement/addition>
- **Why this could help:** <connection to observed problem>
- **Verify:** <concrete future scenario and observable expected result>

These are proposals; this report does not apply them.

## 5. Comparison with earlier periods

Link earlier reports and describe recurring or changed patterns with coverage differences. Distinguish already-reviewed incidents from new ones. Do not claim a failure-rate improvement without a comparable denominator. Use “Not enough comparable evidence” when appropriate.

## 6. Decisions and unresolved questions

- [ ] <review or apply a specific supported proposal in a separate task>
- <evidence gap or open question, if any>

## 7. No updates recommended

When applicable, explain whether there were no observed problems, effective existing guidance, or insufficient evidence. Never fill the report with speculative recommendations to avoid an empty result.
