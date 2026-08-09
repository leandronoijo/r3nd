# Build Plan — `<feature-id>-T<n>`

- **Source:** `<tech-spec-path>`
- **Task:** `T<n> — <title>`
- **Outcome:** <working, deployable result this plan delivers>
- **Status:** Draft | Approved | In Progress | Complete

## Scope

- **In:** <required behavior and touched area>
- **Out:** <explicitly deferred work>
- **Depends on:** None | `<task or existing contract>`

## Contracts And Non-Obvious Details

- **Consumes:** <input/API/type/state, or None>
- **Exposes:** <output/API/type/state, or None>
- **Algorithm/state rule:** <only details needed to avoid incompatible implementations>
- **Data/migration rule:** <compatibility and rollback detail, or Not applicable>

## Production Baseline

Use `Not applicable — <reason>` instead of adding unused machinery.

- **CI:** <existing/new checks this task must preserve or add>
- **Runtime/config:** <Dockerfile, Compose dependency, health, config, or secret handling>
- **Security/auth/tenancy:** <validation, authorization, ownership, and isolation work>
- **Compatibility:** <existing consumer/data behavior to preserve and migration path>
- **Operability:** <logs, correlation, health/readiness, or actionable metric>

## Implementation

- [ ] `<path>` — <create/change and the essential requirement>
- [ ] `<path>` — <create/change and the essential requirement>
- [ ] Wire the changed pieces through `<boundary>`.
- [ ] Implement every applicable production-baseline item above.

## Tests And Verification

- [ ] Unit: <happy path behavior>
- [ ] Unit: <important failure, authorization, or tenant edge>
- [ ] Boundary/contract: <highest-risk real boundary, or Not applicable with reason>
- [ ] CI-equivalent checks: <lint/type/test/build/image commands>
- [ ] Runtime smoke: <production container and health/readiness command, or Not applicable>
- **Optional QA candidate:** <primary flow plus critical security/tenant/compatibility edge>

## Done When

- [ ] Required behavior is demonstrable.
- [ ] Focused automated checks pass and are covered by CI.
- [ ] The applicable production image/runtime builds, starts, and reports healthy.
- [ ] Applicable security, compatibility, identity/tenancy, and operability decisions are implemented.

After the final implementation plan, the owning workflow asks whether to run AI manual QA, write reusable E2E test code, do both, or do neither.

## Blocking Questions

- None | <decision required before implementation can continue>
