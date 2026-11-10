# E2E Test Cases — <Feature Name>

- **Feature ID:** `<feature-id>`
- **Tech Spec:** `<tech-spec-path>`
- **Build Plan(s):** `<build-plan-paths>`
- **Date:** `<yyyy-mm-dd>`

Keep the suite small. Start with the primary happy path and add only the most obvious high-value edge cases. Usually 1–6 cases are enough.

## `<feature-id>-TC-01` — <primary happy path>

- **Given:** <minimal precondition>
- **When:** <user/API/CLI action>
- **Then:** <observable result>
- **Setup:** <fixture, account, or container requirement, if any>

## `<feature-id>-TC-02` — <obvious edge case, only if valuable>

- **Given:** <minimal precondition>
- **When:** <action>
- **Then:** <observable result>
- **Setup:** <fixture or None>

## Notes

- Omit low-value permutations and speculative failure cases.
- These are E2E cases, not integration-test cases.
- Prefer the repository's existing selectors, fixtures, and runner.
