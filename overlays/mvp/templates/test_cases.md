# E2E Test Cases — <Feature Name>

- **Feature ID:** `<feature-id>`
- **Tech Spec:** `<tech-spec-path>`
- **Build Plan(s):** `<build-plan-paths>`
- **Date:** `<yyyy-mm-dd>`

Keep the suite small. Start with the primary production flow and add only directly relevant security, tenant, compatibility, or recovery edges. Usually 1–8 cases are enough.

## `<feature-id>-TC-01` — <primary happy path>

- **Given:** <minimal production-like precondition>
- **When:** <user/API/CLI action>
- **Then:** <observable result>
- **Setup:** <fixture, account, tenant, or container requirement, if any>

## `<feature-id>-TC-02` — <critical boundary case, only if applicable>

- **Given:** <unauthorized, cross-tenant, legacy-consumer, or failure precondition>
- **When:** <action>
- **Then:** <safe observable result and preserved contract>
- **Setup:** <fixture or None>

## Notes

- Map every case to a requirement or production-baseline decision.
- Omit low-value permutations and speculative scale cases.
- Prefer stable existing selectors, fixtures, accounts, and runtime commands.
- Do not duplicate focused unit or boundary tests unless the end-to-end behavior carries distinct risk.
