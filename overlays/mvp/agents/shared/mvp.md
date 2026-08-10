# MVP Mode

Use this policy for every workflow in this overlay. Its goal is the smallest production-shaped system that can deliver and operate real user value safely.

## Priorities

1. Deliver a focused vertical slice that users can run and the team can deploy.
2. Preserve correctness, data, access boundaries, and existing external contracts.
3. Add only the delivery and operational baseline needed to support this slice in production.
4. Keep decisions reversible and defer scale, platform machinery, and polish until evidence requires them.

## Engineering Rules

- Prefer the existing stack, its standard tooling, and the repository's simplest established patterns.
- Prefer one deployable, one datastore, synchronous calls, and framework-native features when they are enough.
- For commodity capabilities such as persistence, schema migrations, validation, authentication, serialization, HTTP clients, logging, retries, scheduling, cryptography, and date/time handling, use the repository's established package or a mature ecosystem-standard package instead of building a custom mechanism. Adding one focused dependency is usually simpler and safer than owning a bespoke subsystem.
- If the repository has no established choice, inspect its manifests and lockfiles, then select the smallest well-maintained package that fits the current stack, production constraints, and requirement. Prefer framework-maintained or widely adopted open-source options with clear documentation and an active maintenance history.
- Write custom code for product-specific behavior and thin integration glue. Build a commodity mechanism only when a concrete constraint rules out suitable packages; record the constraint, the options considered, and the operational, maintenance, and testing burden accepted.
- For new relational persistence, use a stack-appropriate ORM and its supported migration tooling. Do not create a migration runner or make raw-query persistence the default. Use focused raw SQL only when the ORM cannot express or execute a required query adequately, and document and test that exception.
- Do not introduce Kubernetes, Argo, Kafka, a service mesh, a monorepo orchestrator, or similar platform machinery unless requested or required by a demonstrated constraint.
- Keep modules small and define explicit contracts at real boundaries: public APIs, persistence, events, files, external services, authentication, and tenant ownership.
- Use additive changes for contracts that may already have consumers. When a breaking API, schema, event, or configuration change is necessary, include the smallest migration or compatibility window and a safe rollback path.
- Make reversible, low-risk decisions directly and record the assumption briefly. Ask when a missing decision can change behavior, data ownership, a public contract, security posture, tenancy, or technology.

## Minimum Production Baseline

Apply each concern only where it is relevant. Record `Not applicable` with one short reason instead of generating unused boilerplate.

- **CI:** Reuse the current pipeline. If none exists, add one minimal workflow that installs from the lockfile and runs the repository's applicable lint, type, unit/boundary-test, build, and container-build checks. Keep required checks deterministic and free of production secrets.
- **Runtime:** Provide or preserve a production Dockerfile for a deployed service. Prefer a small build context, locked dependencies, a non-root runtime where the stack supports it, explicit configuration, graceful shutdown, and health/readiness behavior. Add Compose only for dependencies needed to run or verify the system locally.
- **Security:** Validate untrusted input at the boundary, enforce authentication and authorization where protected data or actions exist, preserve tenant isolation, keep secrets out of code/images/logs, and avoid exposing sensitive error details. Use the repository's existing security controls before adding new ones.
- **Compatibility and data:** Identify existing consumers and stored data before changing public contracts or schemas. Prefer additive migrations and tolerant readers. Use expand/migrate/contract only when independent deployments or zero-downtime operation make it necessary.
- **Operability:** Use the existing logging and telemetry stack. Add structured logs for important lifecycle and failure events, propagate a request/correlation id in request-based services when practical, and expose health/readiness signals. Add metrics only for a concrete operational question; do not create a telemetry platform for an MVP.
- **Identity and tenancy:** Decide explicitly whether the slice is public, authenticated, or tenant-scoped. Reuse existing identity and tenant context. Never trust a client-supplied tenant id without authorization against the authenticated principal.

## Testing Rules

- Reuse the established test frameworks and commands; do not add a second tool for preference.
- Add focused unit tests for new behavior through public interfaces, including the most important failure or authorization case.
- Add one focused boundary, contract, or integration test only when a production risk such as persistence, migrations, auth/tenant isolation, an external dependency, or compatibility cannot be proven credibly with unit tests. Do not build a broad integration suite by default.
- Ensure required automated checks are executed by CI. Keep slow or environment-heavy suites out of the required path unless they are stable and protect a critical flow.
- At the owning full-control or `implement-feature` boundary, ask whether the user wants AI-run manual QA, reusable E2E test code, both, or neither. Ask once; delegated implementation and QA skills must not repeat the choice.
- When reusable E2E is selected, cover the primary flow and only directly relevant security, tenant, or compatibility edges.
- Prefer targeted local checks plus the same commands CI will run. Do not silently expand scope to unrelated repository failures.

## Retry And Help Rules

- Automatically fix issues that block the requested behavior, required checks, production runtime, or selected QA path.
- Treat a security, tenant-isolation, data-loss, or required-compatibility gap in changed code as blocking.
- For unrelated failures, optional hardening, cleanup, platform improvements, or speculative scale work, stop and ask whether to expand scope.
- Make at most two attempts at the same failing command, hypothesis, setup path, or fix loop. If the second attempt fails, ask for help with both attempts, the smallest useful error excerpt, and the exact decision or information needed.

## Completion Standard

The work is complete when the requested slice works, focused automated checks pass, required CI coverage is present, the production runtime builds and starts when applicable, and the spec's relevant security, compatibility, identity/tenancy, and operability decisions are implemented. Complete the user-selected QA paths and report intentionally deferred production work without turning it into hidden scope.
