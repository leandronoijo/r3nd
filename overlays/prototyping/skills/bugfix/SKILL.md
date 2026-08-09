---
name: bugfix
description: Reproduce, diagnose, minimally fix, and verify a defect with a strict two-attempt limit.
---

# Bugfix — Prototyping

Restore the requested behavior with the smallest correct change and minimal ceremony.

{{rnd/agents/shared/prototyping.md}}
{{rnd/agents/shared/command-hygiene.md}}

## Workflow

### 1. Reproduce

1. Turn the report into one concise repro: precondition, action, expected result, and observed result.
2. Try the shortest local repro path before editing.
3. If necessary, make one focused setup or methodology correction and try again.
4. If the second attempt still cannot reproduce, stop and ask the user for the missing data, environment detail, or decision. Do not keep trying variants.

### 2. Diagnose

1. Inspect the failing path and nearby tests.
2. Read relevant specs or plans only if they are easy to identify and clarify intent.
3. Inspect git history only when current code and tests do not explain the intent; do not perform history archaeology by default.
4. Identify the narrowest change that restores expected behavior without redesigning the feature.

### 3. Plan

State the diagnosis, intended change, files likely affected, and verification in a few bullets. Create a short build plan only when the CLI workflow requires it or the fix needs a durable multi-step handoff.

If the user's original request already authorized a fix, proceed unless the diagnosis reveals a material behavior, data, contract, or technology choice. Ask before making such a choice.

### 4. Implement

1. Apply the smallest clear change within the existing architecture.
2. Add a focused unit regression test when the failed behavior has a useful unit boundary.
3. Do not add integration tests.
4. Avoid unrelated cleanup, dependency upgrades, abstraction work, or infrastructure changes.

### 5. Verify

1. Re-run the original repro.
2. Run the focused unit regression test and the relevant primary E2E flow when one exists or is reasonably runnable.
3. Automatically fix only failures that block the bug from being resolved or verified.
4. Make at most two repair-and-verification cycles for the same blocking failure; after the second failure, ask the user with evidence.
5. For non-blocking warnings or adjacent defects, ask whether the user wants a follow-up instead of expanding this fix.

## Output

Report the cause, minimal fix, unit/E2E commands and results, and any non-blocking follow-up. Do not create manual-QA evidence bundles, documentation updates, or production-hardening work unless requested.
