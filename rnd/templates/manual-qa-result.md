---
Template: Manual QA Result
---

<!--
Canonical template for live manual QA results. Use this when producing
`rnd/manual-qa-results/<feature-id>-manual-qa-result.md`.

Rules:
- Include all sections below.
- Every executed case must reference at least one artifact from the current run.
- Overall verdict must be APPROVED only when all required cases pass with evidence.
-->

# Manual QA Result — <Feature Name>

---

## Metadata

- **Feature ID:** `<feature-id>`
- **Test Cases Source:** `rnd/test_cases/<feature-id>-test-cases.md` or inline reproduction case
- **Build Plans:** `rnd/build_plans/` entries relevant to the feature
- **Execution Timestamp:** `YYYY-MM-DDTHH:MM:SSZ`
- **Executed By:** Manual QA Tester
- **Environment:**
  - Frontend URL: `<url or n/a>`
  - Backend URL: `<url or n/a>`
  - Data/Account Context: `<test account, fixture, seed, or n/a>`

## Environment Bring-Up

- **Startup Commands:**
  ```text
  <exact commands used>
  ```
- **Health Checks:**
  - `<check>`: PASS / FAIL
- **Known Environment Constraints:** `<constraint or none>`

## Execution Summary

- **Total Cases:** N
- **Passed:** N
- **Failed:** N
- **Blocked:** N
- **Overall Verdict:** `APPROVED` / `REJECTED`

## Per-Case Results

### `<feature-id>-TC-01` or `REPRO-01`

- **Title:** <short title>
- **Status:** `PASSED` / `FAILED` / `BLOCKED`
- **Steps Executed:** <brief summary>
- **Observed Result:** <what actually happened>
- **Artifacts:**
  - `<path to screenshot/log/response/query output>`
- **Notes:** <optional>

## Warnings and Blockers

- `<warning or none>`

## Recommended Follow-Up

- `<next action or none>`

## Approval Decision

- **Decision:** `APPROVED` / `REJECTED`
- **Reason:** <one or two sentences tied to the evidence above>
