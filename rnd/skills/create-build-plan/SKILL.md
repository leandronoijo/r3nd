---
name: create-build-plan
description: Turn a technical spec or concrete problem statement into a concrete implementation and test plan formed of small, traceable tasks.
---

# create-build-plan

Turn a technical spec or concrete problem statement into a concrete implementation and test plan formed of small, traceable tasks.

{{rnd/agents/team-lead.md}}
{{rnd/agents/shared/command-hygiene.md}}

## Task-Specific Instructions

- Inspect the referenced code, instructions, and nearby implementation patterns before drafting the plan.
- Use `rnd/templates/build_plan.md` as the canonical structure and write the final artifact directly to the expected output path.
- Create one build plan per task in the technical spec task breakdown.
- Keep each plan self-contained, stackable, and explicit about interfaces, dependencies, and verification.

## Inputs

| Input | Location | Purpose |
|-------|----------|---------|
| Technical Spec | `rnd/tech_specs/<feature-id>-tech-spec.md` | Source of truth for the work and task breakdown |
| Existing Code | Current codebase | Integration points and golden references |
| Existing Tests | Current codebase test locations | Test structure and coverage patterns |
| Stack Rules | `rnd/instructions/` | Relevant conventions for the affected areas |
| Architecture Docs | Current codebase documentation | System context and constraints |

## Outputs

- Multiple Markdown files under `rnd/build_plans/`
- One file per task from the tech spec task breakdown
- Naming convention: `rnd/build_plans/<feature-id>-T<n>-build-plan.md`

## Workflow

1. Read the tech spec and identify all tasks in Section 8.
2. For each task, create a separate build plan that covers only that task's scope.
3. Verify each plan depends only on defined interfaces from earlier tasks.
4. Ensure each plan can be implemented, tested, and deployed independently.
5. Keep plans deterministic so Developer agents can execute them without interpretation.

## Required Build Plan Structure

Use `rnd/templates/build_plan.md` exactly and fill in the task-specific placeholders.

### 1. Summary Fields

- `# Build Plan: <feature-id>-T<n>`
- `Task`
- `Tech Spec Task Title`
- `Tech Spec Task Description`

### 2. Pre-Implementation Checklist

- Verify dependencies from previous tasks are complete.
- Identify integration points in the technical spec.
- Read matching instruction files in `rnd/instructions/`.
- Identify golden reference modules to follow.
- Confirm no new dependencies are needed unless justified.
- Review interfaces this task exposes or consumes.

### 3. Implementation Overview

- State the approach in 2-3 sentences.
- List architectural tradeoffs.
- List dependencies on previous tasks.
- List interfaces exposed to future tasks.

### 4. Implementation Steps

- Break work into atomic steps.
- Each step must name exact files, action, details, dependencies, acceptance criteria, and effort.
- Keep each step tied to one logical unit.
- Avoid vague steps or merged responsibilities.

### 5. File/Module-level Changes

- Include every file touched.
- Record the action, rationale, and golden reference for each file.

### 6. Schema & DTO Changes

- List any schema or DTO deltas explicitly.
- Keep schema and DTO fields aligned.
- Include validation decorators or annotations required by backend conventions.
- Include migrations or backfills if data already exists.

### 7. Test Strategy

- Cover unit tests and integration tests.
- Specify exact assertions and mocks.
- Include the module combinations and endpoint contracts that need coverage.

### 8. Deployment & Rollout

- Note feature flags, environment variables, migrations, rollback, and monitoring.

### 9. AI-Agent Guardrails

- Include explicit warnings for Developer agents about frontend and backend conventions, DTO validation, test expectations, import rules, type safety, and file size limits.

### 10. Definition of Done

- All tasks complete.
- All tests pass.
- Lint and type-check pass.
- No new warnings introduced.
- README updated if a new module was created.

## Build Plan Separation

- One tech spec task equals one build plan.
- Later plans may depend on earlier plans only through defined interfaces.
- Do not combine multiple tech spec tasks into one build plan.

## Planning Mindset

- Respect the repository's existing patterns.
- Prefer small, traceable tasks over broad implementation buckets.
- Use explicit file paths and concrete actions.
- Do not guess when the spec is ambiguous; document the question instead.
- Reference instruction files and golden references rather than repeating them.

## Step Granularity

- Each step should map to one file or one logical unit.
- If a step is larger than 100 lines of change, split it.
- Keep the total number of steps per build plan manageable.

## Guardrails

- Do not invent new frameworks or libraries.
- Do not skip tests.
- Do not bury dependency order.
- Do not omit acceptance criteria.
- Do not omit the AI-agent guardrails section.

## File I/O and Scope

- Read `rnd/tech_specs/`, the current codebase, and `rnd/instructions/`.
- Write `rnd/build_plans/` only.

## Communication Style

- Be concise, technical, and traceable.
- Document deviations as append-only clarifications.
- Keep plans easy for another agent to execute without context switching.

{{rnd/agents/summary.md}}
