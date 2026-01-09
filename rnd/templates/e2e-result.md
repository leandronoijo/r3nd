---
Template: E2E Test Execution Result
---

<!--
Canonical template for E2E test execution results. E2E Engineer agent uses this as the source-of-truth
when producing `rnd/e2e-results/<feature-id>-e2e-result.md` files.

Rules:
- Include all sections: Metadata, Execution Summary, Per-Test Results, Failure Analysis, Recommended Actions, Appendix
- Categorize failures: Environment, Methodology, or Code
- Provide actionable next steps
- Artifacts retained only for failed tests
-->

# E2E Test Execution Result — <Feature Name>

---

## Metadata

- **Feature ID:** `<feature-id>`
- **Test Cases Source:** `rnd/test_cases/<feature-id>-test-cases.md`
- **Build Plan:** `rnd/build_plans/<feature-id>-build-plan.md`
- **Execution Timestamp:** `YYYY-MM-DDTHH:MM:SSZ` (ISO 8601)
- **Executed By:** E2E Engineer Agent
- **Framework:** Playwright v<version> (or framework name/version used)
- **Environment:**
  - OS: `<operating system>`
  - Node: `<node version>`
  - Browser: `<browser name and version>`
  - Frontend URL: `<frontend base URL>`
  - Backend URL: `<backend API base URL>`

---

## Execution Summary

- **Total Tests:** N
- **Passed:** N
- **Failed:** N
- **Skipped:** N
- **Total Duration:** `Xm Ys`
- **Overall Status:** `PASSED` / `FAILED`

**Quick Status:**
```
✅ Passed: N
❌ Failed: N
⏭️  Skipped: N
```

---

## Per-Test-Case Results

### Test Case ID: `<feature-id>-TC-01`

- **Title:** <Test case title>
- **Status:** `PASSED` / `FAILED` / `SKIPPED`
- **Duration:** `Xs`
- **Test File:** `tests/e2e/<feature-id>/<feature-id>-TC-01.spec.ts`

**Output:**
```
<stdout/stderr output from test execution>
```

**Error Message:** (if failed)
```
<error message and stack trace>
```

**Artifacts:** (if failed)
- Screenshot: `tests/e2e/<feature-id>/artifacts/TC-01-failure.png`
- Video: `tests/e2e/<feature-id>/artifacts/TC-01-video.webm`
- Trace: `tests/e2e/<feature-id>/artifacts/TC-01-trace.zip`
- Console Logs: `tests/e2e/<feature-id>/artifacts/TC-01-console.log`

---

### Test Case ID: `<feature-id>-TC-02`

<repeat for each test case>

---

## Failure Analysis

### Summary

- **Environment Issues:** N
- **Methodology Issues:** N
- **Code Bugs:** N

---

### A. Environment Issues

**Description:**
Service startup failures, connection errors, or infrastructure problems that prevented tests from running against a working environment.

**Affected Test Cases:**
- `<feature-id>-TC-XX`: <Brief description of failure>

**Details:**

#### Service Startup Status

| Service | Status | URL | Notes |
|---------|--------|-----|-------|
| Backend | ✅ Started / ❌ Failed | `http://localhost:3000` | <Startup logs summary> |
| Frontend | ✅ Started / ❌ Failed | `http://localhost:4173` | <Startup logs summary> |
| Database | ✅ Started / ❌ Failed | `mongodb://localhost:27017` | <Startup logs summary> |

**Error Messages:**
```
<Exact error messages from service startup or connection attempts>
```

**Environment State:**
- Ports in use: `<port numbers>`
- Processes running: `<process list>`
- Environment variables: `<relevant env vars set/missing>`

**Troubleshooting Steps Attempted:**
1. <Step 1 description and result>
2. <Step 2 description and result>
3. <Step 3 description and result>

**Recommended Actions:**
- [ ] Verify all required services are installed
- [ ] Check for port conflicts (e.g., `lsof -i :3000`)
- [ ] Ensure environment variables are set (see `.env.example`)
- [ ] Review service logs in Appendix for detailed errors
- [ ] Run services manually: `<exact commands to start services>`

---

### B. Methodology Issues

**Description:**
Test implementation problems such as timing issues, missing waits, or selector problems that do not reflect actual code bugs.

**Affected Test Cases:**
- `<feature-id>-TC-XX`: <Brief description of issue>

**Details:**

#### Iteration History

**Test Case: `<feature-id>-TC-XX`**

**Original Issue:**
```
<Description of original failure: selector not found, timeout, etc.>
```

**Iteration 1 - Add Explicit Waits:**
- **Changes Made:**
  ```typescript
  // Added explicit wait for element visibility
  await page.waitForSelector('[data-test-id="submit-btn"]', { state: 'visible', timeout: 10000 });
  ```
- **Result:** `PASSED` / `FAILED`
- **Error (if failed):**
  ```
  <Error message if iteration 1 failed>
  ```

**Iteration 2 - Simplify Test Steps:**
- **Changes Made:**
  ```typescript
  // Reduced test to minimal reproducible steps
  // Removed complex multi-step setup
  // Focused on core action and assertion
  ```
- **Result:** `PASSED` / `FAILED`
- **Error (if failed):**
  ```
  <Error message if iteration 2 failed>
  ```

**Final Status:** `RESOLVED` / `ESCALATED TO CODE BUG`

**Test Code Diff:**
```diff
<Show before/after diff of test code changes>
```

**Recommended Actions:**
- [x] Updated test with explicit waits (Iteration 1)
- [x] Simplified test steps (Iteration 2)
- [ ] If still failing: Review with developer (see Code Bugs section)

---

### C. Code Bugs

**Description:**
Actual implementation problems where the code does not meet acceptance criteria or produces incorrect behavior.

**Affected Test Cases:**
- `<feature-id>-TC-XX`: <Brief symptom>

**Bug List for Developer Agent:**

---

#### Bug #1: <Short bug title>

- **Test Case ID:** `<feature-id>-TC-XX`
- **Test Case Title:** <Test case title>
- **Severity:** `HIGH` / `MEDIUM` / `LOW`
- **Suspect File(s):** 
  - `src/backend/modules/<module>/<file>.ts`
  - `src/frontend/components/<component>/<file>.vue`
- **Symptom:**
  <Clear description of what went wrong>
  
- **Expected Behavior:** (from test case)
  <What should happen according to test case and build plan>
  
- **Actual Behavior:** (from test output)
  <What actually happened during test execution>
  
- **Error Message:**
  ```
  <Relevant error message from test output>
  ```
  
- **API Response:** (if applicable)
  ```json
  {
    "status": 500,
    "error": "Internal Server Error",
    "message": "<error message>"
  }
  ```
  
- **Build Plan Reference:**
  `rnd/build_plans/<feature-id>-build-plan.md#<section>`
  
- **Acceptance Criteria:**
  <Specific acceptance criterion that failed>
  
- **Steps to Reproduce:**
  1. <Step 1>
  2. <Step 2>
  3. <Step 3>
  4. Observe: <Failure>
  
- **Suggested Fix:**
  <If obvious from error, suggest likely fix location/approach>

---

#### Bug #2: <Short bug title>

<Repeat for each bug>

---

**Summary of Code Bugs:**
- Total bugs identified: N
- High severity: N
- Medium severity: N
- Low severity: N

**Recommended Actions:**
- [ ] Developer agent to review and fix bugs listed above
- [ ] Re-run E2E tests after fixes applied
- [ ] Verify fixes against build plan acceptance criteria

---

## Recommended Actions

### Immediate Next Steps

**If Environment Failures:**
1. Review service startup logs in Appendix
2. Follow troubleshooting steps in Environment Issues section
3. Manually start services and verify connectivity
4. Re-run E2E Engineer agent after environment is stable

**If Methodology Failures:**
1. Review test code changes in Methodology Issues section
2. Updated tests have been saved to `tests/e2e/<feature-id>/`
3. Tests that passed after methodology fixes are marked as RESOLVED
4. Tests that failed after 2 iterations escalated to Code Bugs

**If Code Bugs:**
1. Developer agent to review Bug List in Code Bugs section
2. Fix bugs in order of severity (High → Medium → Low)
3. Verify fixes against build plan acceptance criteria
4. Re-run E2E Engineer agent to validate fixes

### Re-run Command

After addressing issues, re-run tests with:

```bash
# Run all tests for this feature
npx playwright test tests/e2e/<feature-id>/

# Run specific failed test
npx playwright test tests/e2e/<feature-id>/<feature-id>-TC-XX.spec.ts

# Run in headed mode to watch execution
npx playwright test tests/e2e/<feature-id>/ --headed

# Run in debug mode
PWDEBUG=1 npx playwright test tests/e2e/<feature-id>/<feature-id>-TC-XX.spec.ts
```

---

## Appendix

### A. Service Startup Logs

#### Backend Service

**Startup Command:**
```bash
<exact command used to start backend>
```

**Output:**
```
<last 100 lines of backend startup logs>
```

**Exit Code:** `<exit code if process terminated>`

---

#### Frontend Service

**Startup Command:**
```bash
<exact command used to start frontend>
```

**Output:**
```
<last 100 lines of frontend startup logs>
```

**Exit Code:** `<exit code if process terminated>`

---

#### Database Service

**Startup Command:**
```bash
<exact command used to start database>
```

**Output:**
```
<last 100 lines of database startup logs>
```

**Exit Code:** `<exit code if process terminated>`

---

### B. Environment Variables

```bash
# Environment variables set during test execution
BASE_URL=<value>
API_BASE_URL=<value>
DATABASE_URL=<value>
NODE_ENV=<value>
<other relevant env vars>
```

---

### C. Framework Configuration

**Playwright Config:** `playwright.config.ts`
```typescript
<relevant configuration settings>
```

---

### D. Test File Locations

Generated test files:
- `tests/e2e/<feature-id>/<feature-id>-TC-01.spec.ts`
- `tests/e2e/<feature-id>/<feature-id>-TC-02.spec.ts`
- `tests/e2e/<feature-id>/fixtures/test-data.ts`

Test artifacts (failed tests only):
- `tests/e2e/<feature-id>/artifacts/`

---

### E. Artifact Retention Policy

Per `.github/instructions/e2e-testing.instructions.md`:
- **Screenshots:** Saved only for failed tests
- **Videos:** Saved only for failed tests (retain-on-failure)
- **Traces:** Saved only on first retry
- **Logs:** Summary for passed tests, full output for failed tests

---

## Notes

<Any additional context, observations, or recommendations>

---

**End of E2E Test Execution Result**

---

## Guidance for E2E Engineer

When generating this report:

1. **Be precise:** Include exact file paths, line numbers, error messages
2. **Be actionable:** Provide clear next steps for each failure category
3. **Be objective:** Report facts, not opinions ("Test failed" not "Test is broken")
4. **Be complete:** Include all sections, even if some are empty (mark as "None")
5. **Be traceable:** Reference test case IDs, build plan sections, and file paths consistently
6. **Categorize correctly:** Use the decision tree from agent instructions to classify failures
7. **Preserve artifacts:** Only save screenshots/videos/traces for failed tests
8. **Document attempts:** Show all troubleshooting and iteration steps taken

---

## Example Sections

### Example: Passed Test

```markdown
### Test Case ID: `orders-v1-TC-01`

- **Title:** Create new order successfully
- **Status:** `PASSED` ✅
- **Duration:** `3.2s`
- **Test File:** `tests/e2e/orders/orders-TC-01.spec.ts`

**Output:**
```
Running test: should create order and show confirmation
✓ User authenticated successfully
✓ Navigated to /orders/new
✓ Filled order form
✓ Clicked submit button
✓ Received 201 response from POST /api/orders
✓ Success toast displayed
✓ Redirected to /orders/123
PASS orders-v1-TC-01 (3.2s)
```

**Artifacts:** None (test passed)
```

### Example: Failed Test (Code Bug)

```markdown
### Test Case ID: `orders-v1-TC-02`

- **Title:** Show error for invalid quantity
- **Status:** `FAILED` ❌
- **Duration:** `15.1s`
- **Test File:** `tests/e2e/orders/orders-TC-02.spec.ts`

**Output:**
```
Running test: should show error for negative quantity
✓ User authenticated successfully
✓ Navigated to /orders/new
✓ Filled product name
✓ Filled quantity with -5
✓ Clicked submit button
✗ Expected error message to be visible
  Error: Timed out waiting for selector '[data-test-id="error-message"]'
```

**Error Message:**
```
Error: locator.waitFor: Timeout 10000ms exceeded.
=========================== logs ===========================
waiting for locator('[data-test-id="error-message"]') to be visible
============================================================

  at tests/e2e/orders/orders-TC-02.spec.ts:23:5
```

**Artifacts:**
- Screenshot: `tests/e2e/orders/artifacts/TC-02-failure.png`
- Video: `tests/e2e/orders/artifacts/TC-02-video.webm`
- Trace: `tests/e2e/orders/artifacts/TC-02-trace.zip`
```

---

Keep results clear, structured, and actionable.
