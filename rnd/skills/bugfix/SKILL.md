---
name: bugfix
description: Reproduce a bug locally, trace intent and history, propose the smallest safe fix, then implement and verify the repair.
---

# bugfix

Reproduce the bug first, inspect the code's intent and history, propose the smallest defensible fix before coding, then implement, verify, and optionally follow up with docs.

{{rnd/agents/developer.md}}
{{rnd/agents/e2e-engineer.md}}
{{rnd/agents/shared/command-hygiene.md}}

## Purpose

Restore broken behavior with the narrowest safe change. Start with local reproduction, trace the execution path and commit history, separate intended behavior from the regression, present a minimal fix proposal to the user, and only then implement and verify the approved repair.

This workflow is for regressions, not redesigns. The job is to understand why the current code exists, confirm the failure path, and apply the smallest change that restores the intended behavior.

## Core Philosophy

1. **Reproduce before investigating** - Do not trust the report until you have a local repro or have explicitly documented why repro was not possible.
2. **Investigate before editing** - Trace the relevant path, then check history and nearby docs before proposing code changes.
3. **History matters** - Use `git log`, `git blame`, and relevant diffs to understand why the broken behavior was introduced.
4. **Minimal fix wins** - Prefer the smallest change that restores correctness without redesigning the feature.
5. **Plan before implementation** - Show the diagnosis and proposed fix to the user before coding.
6. **Verify after implementation** - Re-run the same repro path and targeted checks after the fix lands.
7. **Developer standards still apply** - Once implementation starts, follow `rnd/agents/developer.md` and the applicable `AGENTS.md` / `CLAUDE.md` files.

Ask yourself before changing code: *Do I understand the failure, the original intent, and the narrowest safe fix?*

## Delegation Contract

1. Every phase in the checklist must run in a separate teammate or sub-agent context when the environment supports it.
2. Never satisfy a phase by reusing this orchestrator skill as the phase skill. Phase work must use a phase-specific skill when one exists.
3. If no phase-specific skill exists in the current skillset, delegate the phase with the closest agent markdown file as the operating brief.
4. Do not mark a phase complete until it has been executed in its own separate context with either the listed skill or the listed agent brief.
5. Each handoff must be phase-local: reproduction case, current findings, relevant files, acceptance criteria, blockers, expected output path, and the relevant skill or agent markdown path.
6. After each phase, write a compact phase summary to the tracking file so the next phase can start from artifacts rather than conversation memory.
7. If teammates or sub-agents are unavailable, compact the context yourself between phases before proceeding.

## Phase Tracking (Mandatory)

Before starting any work, create a persistent phase checklist using the environment's task/todo tool or by writing a tracking file to `/tmp/bugfix-<bug-id>-phases.md`.

**Required checklist:**

```md
- [ ] Phase 1: Reproduction gate (required skill: `run-manual-qa-tests`; fallback: `rnd/agents/manual-qa-tester.md`)
- [ ] Phase 2: Investigation (separate context required; no phase skill exists; use `rnd/agents/developer.md`)
- [ ] Phase 3: Plan review (separate context required; no phase skill exists; use `rnd/agents/developer.md`)
- [ ] Phase 4: Implementation (required skill: `implement-build-plan` when a relevant plan exists; otherwise no phase skill exists, use `rnd/agents/developer.md`)
- [ ] Phase 5: Verification (required skill: `run-manual-qa-tests`; fallback: `rnd/agents/manual-qa-tester.md`)
- [ ] Phase 6: Documentation follow-up (separate context required; no phase skill exists; use `rnd/agents/developer.md`)
- [ ] Wrap-up: Interaction log written
```

**Rules:**
- Mark a phase complete only after it is fully done.
- Mark a phase complete only after the required skill or documented fallback agent markdown has been used for that phase in a separate context.
- Re-read the checklist after each phase before continuing.
- If context is compressed or lost, re-read the tracking file before proceeding.
- Never skip a phase. If one is not applicable, mark it done with a note and move on.

---

## Required Workflow

### Phase 1: Reproduction Gate

Required skill: `run-manual-qa-tests`
Fallback teammate brief: `rnd/agents/manual-qa-tester.md`

1. Collect the exact reproduction details from the user when they are missing.
2. Convert the report into a concise reproduction case with preconditions, steps, expected broken behavior, and observability points.
3. Run the reproduction case locally before editing code.
4. If the bug reproduces, treat that path as the source of truth.
5. If the bug does not reproduce, clearly say what was attempted, what remains uncertain, and ask whether to continue anyway.

### Phase 2: Investigation

Separate context required.
No phase-specific skill exists.
Use agent brief: `rnd/agents/developer.md`

6. Inspect the failing path, nearby tests, and any matching `AGENTS.md` / `CLAUDE.md` files before editing.
7. Use commit history to identify the likely change that introduced the regression and the intent behind it.
8. If `rnd/tech_specs/` or `rnd/build_plans/` contain relevant context, read the matching files and separate intended behavior from accidental behavior.
9. Keep the investigation narrow: focus on the smallest set of files that plausibly owns the bug.

### Phase 3: Plan Review

Separate context required.
No phase-specific skill exists.
Use agent brief: `rnd/agents/developer.md`

10. Present the diagnosis, repro evidence, and a minimal fix proposal to the user before coding.
11. Call out risks, tradeoffs, and anything intentionally left unchanged.
12. Do not implement until the user has approved the proposed fix or the conversation makes that approval explicit.

### Phase 4: Implementation

When a relevant build plan exists:
- Required skill: `implement-build-plan`
- Fallback teammate brief: `rnd/agents/developer.md`

When no relevant build plan exists:
- No phase-specific skill exists.
- Use agent brief: `rnd/agents/developer.md`

13. Apply the approved fix with the smallest possible diff.
14. Add or update tests that capture the regression.
15. Keep implementation and verification close together.
16. Follow repository conventions and golden references instead of inventing new patterns.

### Phase 5: Verification

Required skill: `run-manual-qa-tests`
Fallback teammate brief: `rnd/agents/manual-qa-tester.md`

17. Re-run the original reproduction path after the fix.
18. Run the most relevant automated checks for the touched area.
19. Report whether the original bug still reproduces and whether the checks passed.

### Phase 6: Documentation Follow-up

Separate context required.
No phase-specific skill exists.
Use agent brief: `rnd/agents/developer.md`

20. Offer a concise docs, spec, or build-plan follow-up only if the fix changes durable project intent.
21. Keep docs updates optional unless the user asks for them.

---

## Inputs

| Input | Location | Purpose |
|-------|----------|---------|
| Bug report | User prompt, issue link, stack trace, or observed failure | Starting point for reproduction |
| Codebase | Current repository | Failure path and integration points |
| Git history | Current repository history | Intent behind the regression |
| Repo instructions | applicable `AGENTS.md` / `CLAUDE.md` files | Stack-specific conventions and test rules |
| Specs and plans | `rnd/tech_specs/` and `rnd/build_plans/` when present | Intended behavior and scope boundaries |

## Outputs

- A custom reproduction case derived from the report
- A clear diagnosis of where the bug occurs
- A minimal fix proposal shown to the user before coding
- Code and test changes in the current codebase after approval
- Post-fix verification evidence showing the bug no longer reproduces
- Optional live verification report under `rnd/manual-qa-results/`
- Optional documentation follow-up if the change affects durable intent

---

## Communication Style

- Be concise, factual, and specific.
- Separate observed facts from inference.
- State blockers directly when repro or verification is incomplete.
- Keep the scope on the bug, not on a broader cleanup.

## Direct-Use Rules

When this skill is used directly in an editor or coding session:

1. Investigate before proposing a fix.
2. Reproduce locally before editing whenever possible.
3. Present the diagnosis and minimal fix proposal before implementation.
4. Keep the fix minimal and test-backed.
5. Re-run the same repro and targeted checks after the fix.
6. Offer docs follow-up only if the fix changes the lasting intent.

{{rnd/agents/summary.md}}
