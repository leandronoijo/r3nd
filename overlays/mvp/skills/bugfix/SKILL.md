---
name: bugfix
description: Reproduce and minimally fix an MVP defect while protecting production contracts and safety boundaries.
---

# Bugfix — MVP

Restore the requested behavior with the smallest production-safe change and focused regression evidence.

{{rnd/agents/shared/mvp.md}}
{{rnd/agents/shared/command-hygiene.md}}

## Workflow

### 1. Reproduce

1. Turn the report into one concise repro: precondition, action, expected result, and observed result.
2. Use the shortest local path that represents the deployed boundary. Prefer the production container/runtime when the defect depends on packaging or configuration.
3. Make at most one focused setup or methodology correction. If the second attempt still cannot reproduce, ask for the missing data or environment detail.

### 2. Diagnose

1. Inspect the failing path, nearby tests, CI/runtime behavior, and relevant scoped instructions.
2. Read matching specs or plans when they clarify intent. Inspect git history only when current code and tests do not.
3. Identify affected public consumers, stored data, authorization or tenant boundaries, and operational signals.
4. Find the narrowest change that restores intended behavior without weakening security, losing data, or breaking an existing contract.

### 3. Plan

State the cause, intended change, compatibility/migration implications, files affected, and verification in a few bullets. Create a durable build plan only when the CLI requires it or the fix needs a multi-step handoff.

If the request already authorized a fix, proceed unless the diagnosis reveals a material behavior, data ownership, public-contract, security/tenancy, or technology choice.

### 4. Implement

1. Apply the smallest clear change in the existing architecture.
2. Preserve public and stored-data compatibility or implement the smallest explicit migration/backout path.
3. Keep authorization, tenant ownership, secret handling, and safe errors at least as strong as before.
4. Add a focused unit regression test and one boundary/contract regression only when the defect crossed a real production boundary.
5. Ensure new regression commands are already covered by CI; update the narrow CI path if they are not.
6. Avoid unrelated cleanup, dependency upgrades, new infrastructure, or observability work.

### 5. Verify

1. Re-run the original repro against the applicable production-like runtime.
2. Run focused regression checks and the relevant CI-equivalent build/image command.
3. Verify any affected compatibility, data, authorization, tenant-isolation, health, or logging behavior.
4. Automatically fix only blocking issues. Use at most two repair-and-verification cycles for the same failure, then ask for help with evidence.
5. Ask before expanding into non-blocking warnings or adjacent defects.

## Output

Report the cause, minimal fix, compatibility/security impact, commands and results, and intentional follow-up debt. Do not add a broad readiness review or documentation bundle unless requested.
