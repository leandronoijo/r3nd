# Prototyping Mode

Use this policy for every workflow in this overlay. Its goal is a correct, demonstrable result with the least process and infrastructure that can reasonably support it.

## Priorities

1. Deliver a working vertical slice that the user can run and see.
2. Keep behavior correct with small, explicit contracts and well-encapsulated code.
3. Leave boundaries clear enough that the prototype can become a production project later.
4. Defer scale, polish, automation, and operational machinery until they are requested or strictly necessary.

## Engineering Rules

- Prefer the existing stack, its standard tooling, and its simplest established patterns.
- Prefer one service, one datastore, synchronous calls, and framework-native features when they are enough.
- For commodity capabilities such as persistence, schema migrations, validation, authentication, serialization, HTTP clients, logging, retries, scheduling, cryptography, and date/time handling, use the repository's established package or a mature ecosystem-standard package instead of building a custom mechanism. Adding one focused dependency is usually simpler than owning a bespoke subsystem.
- If the repository has no established choice, inspect its manifests and lockfiles, then select the smallest well-maintained package that fits the current stack and requirement. Prefer framework-maintained or widely adopted open-source options with clear documentation and an active maintenance history.
- Write custom code for product-specific behavior and thin integration glue. Build a commodity mechanism only when a concrete constraint rules out suitable packages; record the constraint, the options considered, and the maintenance/testing burden accepted.
- For new relational persistence, use a stack-appropriate ORM and its supported migration tooling. Do not create a migration runner or make raw-query persistence the default. Use focused raw SQL only when the ORM cannot express a required query adequately, and document and test that exception.
- Do not introduce Bun, Nx, Kubernetes, Argo, Kafka, or similar platform machinery unless the user requests it or the requirement cannot reasonably be met without it.
- Keep modules small and responsibilities obvious. Define contracts at real boundaries such as HTTP, persistence, queues, files, or external APIs; do not add abstraction layers for hypothetical reuse.
- Use the simplest containerized runtime that works. Usually this means a small Dockerfile and one Docker Compose file containing only the app and required dependencies.
- Make reversible, low-risk decisions directly and record the assumption briefly. Ask the user when a missing decision can change behavior, data, public contracts, or the chosen technology.

## Testing Rules

- Reuse the repository's established test framework; do not introduce a second framework for style or preference.
- Add focused unit tests for new behavior through public interfaces. Mock or fake databases, HTTP clients, filesystems, clocks, and other collaborators so the tests remain unit tests.
- Cover the happy path and only the most obvious directly relevant edge case. Do not chase numeric coverage targets or test framework/third-party behavior.
- At the owning full-control or `implement-feature` boundary, ask whether the user wants AI-run manual QA, reusable E2E test code, both, or neither. Ask once; delegated implementation and QA skills must not repeat the choice.
- When reusable E2E is selected, add durable test code for the primary user-visible or API flow and only the most obvious high-value edge cases. The tests must run through the repository's normal tooling without AI.
- When manual QA is selected, exercise the running system directly from the acceptance criteria. A saved test-case document is not required.
- Do not create integration tests in prototyping mode. Cover a boundary with a unit test and, when selected, reusable E2E code across the running system.
- Prefer targeted unit, lint, type-check, build, and selected QA commands. Do not turn unrelated failures from broad repository checks into task scope without asking the user.

## Retry And Help Rules

- Automatically fix only issues that block the requested result, required unit tests, selected QA path, build, or runnable environment.
- For warnings, cleanup, optional hardening, flaky non-critical checks, or other non-blocking findings, stop and ask the user whether to spend time on them.
- Make at most two attempts at the same failing command, hypothesis, setup path, or fix loop. If the second attempt fails, stop and ask the user for help.
- When asking for help, include the goal, both attempts, the smallest useful error excerpt, and the exact decision or information needed. Do not continue with variations of the same loop.

## Completion Standard

The work is complete when the requested behavior works, focused unit tests pass, the minimal runtime can be started, and every applicable or user-selected QA path passes. If a full-control or `implement-feature` user selects neither optional QA path, report that the result has unit coverage but was not manually exercised and has no reusable E2E coverage. Report non-blocking debt instead of silently expanding scope.
