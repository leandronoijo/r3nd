# Workflows

r3nd supports multiple ways of working, but they all use the same underlying model: explicit artifacts, repo-defined skills, and approval boundaries that stay visible.

This page maps the workflows described in the root README to the actual skills and CLI commands in the current codebase.

## Workflow Selection

Use the workflow that matches the size and uncertainty of the work:

- full control: important, ambiguous, architectural, or high-risk work
- semi-control: clear feature work where you still want structure
- small feature: tightly bounded change that should stay small
- bugfix: focused defect resolution

The important distinction is not speed. It is how much artifact structure and how many approval gates the change needs.

## 1. Full Control Workflow

Use this when the change needs explicit handoffs and human review between stages.

### Purpose

- maximize traceability
- keep architecture review explicit
- prevent implementation from improvising from chat context

### Main Skills

- `create-product-spec`
- `create-tech-spec`
- `create-build-plan`
- `implement-build-plan`
- `create-test-cases`
- `run-e2e-tests`
- `run-manual-qa-tests`
- `create-retro-report`

### Artifact Flow

1. `product_specs/`
2. `tech_specs/`
3. `build_plans/`
4. code and tests in the app
5. `test_cases/`
6. `e2e-results/`
7. `manual-qa-results/`
8. `retros/`

### Approval Boundaries

- after product spec
- after tech spec
- after build plan
- after implementation and QA evidence
- after retro, if you use retro-driven process improvement

### CLI Example

```bash
r3nd agents create-product-spec --input "Build user authentication"
r3nd agents create-tech-spec --file r3nd/product_specs/<feature>.md --agent codex
r3nd agents create-build-plan --file r3nd/tech_specs/<feature>.md --agent codex
r3nd agents implement-build-plan --file r3nd/build_plans/<feature>-T1-build-plan.md --agent codex
r3nd agents create-test-cases --file r3nd/build_plans/<feature>-T1-build-plan.md --agent codex
r3nd agents run-e2e-tests --file r3nd/test_cases/<feature>.md --agent codex
r3nd agents create-retro-report --input "<pr-url-or-number>" --agent github
```

### Notes From The Current Skills

- `create-tech-spec` is grounded in the existing repo and instruction files
- `create-build-plan` creates one build plan per task from the tech spec
- `implement-build-plan` treats the build plan as the source of truth and updates task checkboxes
- `run-e2e-tests` writes result reports to `e2e-results/`
- `run-manual-qa-tests` is the live-evidence gate and writes into `manual-qa-results/`

## 2. Semi-Control Workflow

Use this when the product direction is already clear and you want fewer handoffs without dropping artifact discipline.

### Purpose

- move faster than the full chain
- keep technical direction explicit
- still verify work through structured implementation and QA

### Main Skills

- `create-tech-spec`
- `implement-feature`

### How It Works

`implement-feature` is the orchestrated path. In the current registry and skill set, it:

- starts from a tech spec or feature directory
- enforces build-plan assurance
- runs dependency-aware implementation
- writes required run artifacts under `agent_runs/`
- requires final E2E QA

### Approval Boundaries

- after the tech spec
- after the feature implementation and QA evidence

### CLI Example

```bash
r3nd agents create-tech-spec --file r3nd/product_specs/<feature>.md --agent codex
r3nd agents implement-feature --file r3nd/tech_specs/<feature>.md --agent codex
```

### When To Prefer It

- product intent is already agreed
- architecture still matters
- you want the LLM to manage task sequencing without manually invoking every stage

## 3. Small Feature Workflow

Use this for very small, local changes that should not expand into a multi-artifact delivery chain.

### Main Skill

- `quick-feature`

### What Makes It Different

The `quick-feature` skill is stricter than the README summary implies. It is not just a shorthand implementation path. The skill defines a phase-based workflow with:

1. investigation
2. eligibility gate
3. one single `T1` build plan
4. explicit user approval before coding
5. implementation
6. QA

### Hard Limits In The Skill

The quick path is meant to stay narrow. The skill rejects work that is:

- architectural
- ambiguous
- broad enough to need multiple task tracks
- likely to require a larger workflow

The plan is required to stay as exactly one build plan:

- `rnd/build_plans/<feature-id>-T1-build-plan.md`

### Approval Boundary

The skill explicitly requires this question before implementation:

`Do you approve this build plan and want me to implement it now? (yes/no)`

### Practical Meaning

Use this path when the correct change is small enough that a full product-spec and tech-spec chain would mostly add ceremony, but you still want:

- an explicit plan
- a stop/go approval point
- implementation discipline
- live verification

## 4. Bugfix Workflow

Use this for focused defect repair where understanding the failure is more important than producing a new design artifact chain.

### Main Skill

- `bugfix`

### Required Phases In The Skill

The current `bugfix` skill defines these phases:

1. reproduction gate
2. investigation
3. plan review
4. implementation
5. verification
6. documentation follow-up

### What The Skill Enforces

- reproduce the bug before editing whenever possible
- inspect current code and relevant history
- separate intended behavior from regression
- present a minimal fix proposal before coding
- rerun the repro path after the fix

This is materially more disciplined than “just patch the bug.”

### Approval Boundary

- after diagnosis and minimal fix proposal
- after verification evidence

### Practical Meaning

Use this workflow when the core question is:

“What is the smallest safe change that restores intended behavior?”

Do not use it for redesigns disguised as bug reports.

## Analysis Workflow

There is also a context-generation workflow that supports the other delivery paths.

### Skills

- `analyze-repo-context`
- `analyze-app-context`
- `analyze-module-context`

### CLI Paths

High-level:

```bash
r3nd analyse --agent codex
```

Direct:

```bash
r3nd agents analyze-repo-context --input . --agent codex
r3nd agents analyze-app-context --input apps/backend --agent codex
r3nd agents analyze-module-context --input apps/backend/src/modules/auth --agent claude
```

### Purpose

- generate repo-scoped operating context
- keep context files close to the code they govern
- support large repos without relying on one global prompt file

This workflow usually happens before or alongside feature work, not after delivery starts.

## Choosing The Right Approval Model

A simple rule set:

- if product behavior is unclear: use full control
- if product behavior is clear but technical shape matters: use semi-control
- if the change is truly small and local: use small feature
- if the problem is broken existing behavior: use bugfix

The mistake to avoid is using the fastest-looking workflow for work that is actually ambiguous or structural. That just moves design cost into implementation and QA.

## Output Directories By Workflow

Common directories used by the current workflows:

- `product_specs/`
- `tech_specs/`
- `build_plans/`
- `test_cases/`
- `e2e-results/`
- `manual-qa-results/`
- `retros/`
- `agent_summaries/`
- `agent_runs/`

Not every workflow uses every directory:

- full control uses most of them
- semi-control usually starts at `tech_specs/`
- small feature may only require one build plan plus QA artifacts
- bugfix may not require a new spec, but still expects repro and verification evidence

## Monorepo Note

All of these workflows can run against a scoped spec directory with `--spec-dir`.

Example:

```bash
r3nd agents create-product-spec --spec-dir apps/backend --input "Add OAuth2" --agent github
```

That writes artifacts under `apps/backend/r3nd/` when `spec-dir-name` is left at the default.
