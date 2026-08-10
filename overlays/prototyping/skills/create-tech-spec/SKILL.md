---
name: create-tech-spec
description: Create the first, brief requirements-and-design document for a prototype.
---

# Create Tech Spec — Prototyping

Create a short technical specification that contains enough requirements and design detail for build plans to fit together.

{{rnd/agents/shared/prototyping.md}}
{{rnd/agents/shared/command-hygiene.md}}

## Inputs

- Direct user requirements, issue text, or another supplied description
- Existing repository code and the nearest applicable `AGENTS.md` / `CLAUDE.md`
- `rnd/templates/tech_spec.md`
- An existing product spec only when the user already supplied one; it is supporting input, never a prerequisite

## Output

Write one file under `rnd/tech_specs/`, following the repository's existing naming convention or `YYYY-MM-DD-<feature-id>/YYYY-MM-DD-tech-spec-<feature-id>.md` when none exists.

The tech spec is the first durable document in this workflow. Do not create or require a product-spec artifact and do not delegate requirements discovery to a Product Manager role.

## Required Content

- Brief functional requirements, essential constraints, out-of-scope items, and assumptions
- A short list of relevant existing files or modules
- Explicit reuse and dependency decisions for substantial commodity capabilities, naming the existing, framework-native, or mature open-source package selected
- For relational persistence, the ORM and its supported migration tool; any focused raw SQL must be an explained exception rather than the default data-access strategy
- One general component diagram
- Real component boundaries and contracts
- Non-obvious algorithm, state, data, failure, or runtime details
- The smallest useful task breakdown
- Focused unit-test intent plus the primary flow that could later be used for reusable E2E code or AI-run manual QA; explicitly state that integration tests are excluded
- Only questions that block a correct design

## Workflow

1. Read the request and `rnd/templates/tech_spec.md`.
2. Inspect only the repository areas needed to ground the design. Read the relevant manifests and lockfiles and find an existing pattern to reuse.
3. For every substantial commodity capability, prefer the repository's established package, then a framework-maintained option, then a mature ecosystem-standard package. Check that the selection supports the current runtime and requirement and does not duplicate an equivalent dependency.
4. Do not choose custom infrastructure merely to avoid adding a dependency. If no suitable package exists, document the concrete constraint, the options ruled out, and the narrow custom-code boundary.
5. For new relational persistence, select a stack-appropriate ORM and its supported migrations. Do not design a custom migration mechanism or a raw-query data layer; allow focused raw SQL only for a documented ORM limitation.
6. Treat a focused, reversible package addition as a normal design decision. Ask only when behavior, data ownership, a public contract, or a material technology tradeoff cannot be decided safely.
7. Use obvious reversible defaults and record them as assumptions.
8. Choose the simplest design that produces a runnable vertical slice and leaves clear boundaries for later production work.
9. Create tasks only when separate sequencing, ownership, or contracts are useful. Do not target an arbitrary task count.
10. Validate that task contracts and dependency choices fit together, then write the file.

## Exclusions

- No exhaustive architecture survey, production-readiness checklist, scaling design, rollout strategy, observability program, or speculative edge-case catalog
- No implementation code
- No integration-test design
- No extra document created only to satisfy process

If research or clarification repeats without progress, follow the two-attempt stop rule and ask the user.
