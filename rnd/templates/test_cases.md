---
Template: Test Cases (E2E Sanity)
---

<!--
Canonical template for E2E sanity test cases. Agents and humans should use this file as the source-of-truth
when producing `rnd/test_cases/<feature-id>-test-cases.md` files.

Rules:
- Keep <= 20 test cases (sanity scope).
- Use Gherkin (Given/When/Then) for Steps where appropriate to ease automation.
- Each case must include ID, Title, Objective, Preconditions, Steps, Expected Result, Priority, Scope, Related artifacts, and Notes.
-->

# Test Cases — <Feature Name>

- **Feature id:** `<feature-id>`
- **Product Spec:** `rnd/product_specs/<feature-id>-product-spec.md`
- **Tech Spec:** `rnd/tech_specs/<feature-id>-tech-spec.md` (if present)
- **Build Plan:** `rnd/build_plans/<feature-id>-build-plan.md` (if present)
- **Author:** Test Engineer
- **Date:** yyyy-mm-dd (ISO)
- **Test count:** N (<= 20)

---

## Test Cases

Number and list test cases from 1..N (max 20). Use the following per-case template.

### <N>. Test Case ID: `<feature-id>-TC-XX`

- **Title:** Short descriptive title
- **Objective:** One-sentence purpose
- **Preconditions:** System state, required test data, mocks, or accounts
- **Steps (Gherkin preferred):**
```gherkin
Given <precondition>
When <action>
Then <expected outcome>
```
- **Expected Result:** Precise acceptance criteria (what the system must show/do)
- **Priority:** High / Medium / Low
- **Scope:** Functional / Integration / Sanity
- **Related artifacts:** `rnd/product_specs/<feature-id>-product-spec.md#section-heading`
- **Notes:** Any setup/teardown details or known limitations

---

## Guidance

- Language: English.
- Determinism: Avoid randomness, prefer fixtures and mocks. Document which external calls must be mocked in CI.
- Independence: Make each case runnable independently and describe teardown.
- Prioritization: If more than 20 candidate cases exist, pick highest-value sanity checks that verify core flows and touched components.
- Automation: Use `data-test-id` selectors, explicit waits, and avoid fragile UI selectors when describing UI steps.

## Example

### 1. Test Case ID: payments-v2-TC-01

- **Title:** Successful one-time payment via credit card
- **Objective:** Verify a user can complete a one-time payment and receive confirmation.
- **Preconditions:** A test user exists and has a valid test card on the payments sandbox. System is connected to sandbox payment gateway.
- **Steps (Gherkin):**
```gherkin
Given the user is authenticated and on the payment page
When the user fills valid card details and submits
Then the payment completes and a confirmation message is shown
```
- **Expected Result:** Payment is recorded in DB, payment gateway returns success, confirmation email queued.
- **Priority:** High
- **Scope:** E2E / Sanity
- **Related artifacts:** rnd/product_specs/payments-v2-product-spec.md#acceptance-criteria
- **Notes:** Mock external card processor in CI; keep test data disposable.
