# Build Plan — `<feature-id>-T<n>`

- **Source:** `<tech-spec-path>`
- **Task:** `T<n> — <title>`
- **Outcome:** <working result this plan delivers>
- **Status:** Draft | Approved | In Progress | Complete

## Scope

- **In:** <required behavior and touched area>
- **Out:** <explicitly deferred work>
- **Depends on:** None | `<task or existing contract>`

## Contracts And Non-Obvious Details

- **Consumes:** <input/API/type/state, or None>
- **Exposes:** <output/API/type/state, or None>
- **Algorithm/state rule:** <only details needed to avoid incompatible implementations>
- **Runtime/config:** <only required container, service, variable, or migration details>

## Implementation

- [ ] `<path>` — <create/change and the essential requirement>
- [ ] `<path>` — <create/change and the essential requirement>
- [ ] Wire the changed pieces through `<boundary>`.

## Tests

- [ ] Unit: <happy path behavior>
- [ ] Unit: <most obvious relevant edge case, if any>
- **Optional QA candidate:** <primary flow suitable for reusable E2E code and/or AI-run manual QA>
- Integration tests are not part of this plan.

## Done When

- [ ] Required behavior is demonstrable.
- [ ] Focused unit tests pass.
- [ ] Minimal containerized runtime starts when runtime files are in scope.

After the final implementation plan, the owning workflow asks whether to run AI manual QA, write reusable E2E test code, do both, or do neither.

## Blocking Questions

- None | <decision required before implementation can continue>
