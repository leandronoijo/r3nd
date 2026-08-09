---
name: create-tech-spec
description: Design the smallest production-shaped vertical slice for an MVP.
---

# Create Tech Spec — MVP

Create a concise technical specification that is simple enough to execute quickly and explicit enough to deploy responsibly.

{{rnd/agents/shared/mvp.md}}
{{rnd/agents/shared/command-hygiene.md}}

## Inputs

- Direct user requirements, issue text, or another supplied description
- Existing repository code and the nearest applicable `AGENTS.md` / `CLAUDE.md`
- Existing CI, container, configuration, identity, tenancy, logging, metrics, and migration patterns
- `rnd/templates/tech_spec.md`
- An existing product spec only when already supplied; it is supporting input, never a prerequisite

## Output

Write one file under `rnd/tech_specs/`, following the repository's naming convention or `YYYY-MM-DD-<feature-id>/YYYY-MM-DD-tech-spec-<feature-id>.md` when none exists.

The tech spec is the first required artifact. Do not create or require a product spec merely for process completeness.

## Required Content

- Brief functional requirements, constraints, out-of-scope items, and reversible assumptions
- Relevant existing application and production-baseline patterns
- One component diagram and explicit contracts at real boundaries
- The minimum CI, production runtime/configuration, security, identity/tenancy, compatibility/data, and operability decisions
- Non-obvious state, migration, failure, release, or rollback behavior
- A small task breakdown that assigns applicable production-baseline work to the vertical slice
- Focused unit intent, one boundary/contract test only where risk warrants it, CI checks, runtime smoke, and optional QA candidates
- Only questions that block a correct or safe design

## Workflow

1. Read the request and compact tech-spec template.
2. Inspect the affected code and one useful existing pattern for each applicable concern. Do not survey the whole platform.
3. Identify deployed consumers, stored data, trust boundaries, and whether the slice is public, authenticated, or tenant-scoped.
4. Reuse the repository's CI, Docker, configuration, security, migration, logging, and telemetry conventions. Add a missing baseline only when this slice needs it to operate safely.
5. Choose the simplest deployable design and record `Not applicable — <reason>` for irrelevant baseline concerns.
6. Prefer additive contracts and migrations. Ask before an avoidable breaking change, unclear data ownership, security decision, tenancy model, or material technology addition.
7. Create tasks only where sequencing, ownership, or contracts benefit from separation.
8. Validate that the tasks collectively deliver the behavior and production baseline, then write the file.

## Exclusions

- No exhaustive architecture survey, compliance program, generic threat model, SRE platform, speculative scaling plan, or broad observability rollout
- No Kubernetes, service mesh, queue, cache, or microservice split without a demonstrated requirement
- No implementation code or extra artifact created only to satisfy process
- No backwards-compatibility layer for a new private interface with no consumers

If research or clarification repeats without progress, follow the two-attempt stop rule and ask the user.
