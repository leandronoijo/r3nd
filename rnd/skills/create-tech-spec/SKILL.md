---
name: create-tech-spec
description: Convert product specs into a repo-grounded technical specification / high-level design.
---

# create-tech-spec

Convert product specs into a repo-grounded technical specification / high-level design.

{{rnd/agents/architect.md}}
{{rnd/agents/shared/command-hygiene.md}}

## Purpose

Turn either a product spec or direct requirements into a deterministic technical specification that is grounded in the current repository and precise enough for downstream planning.

## Inputs

The skill supports two input modes. Use exactly one per invocation.

### Mode 1 - Product Spec Input

- `rnd/product_specs/YYYY-MM-DD-<feature-id>/YYYY-MM-DD-product-spec-<feature-id>.md`

### Mode 2 - Direct Requirements Input

- Free-form textual requirements describing the feature when no product spec exists.

### Both Modes Also Use

- Repository sources across the current codebase for context.
- `rnd/instructions/` for stack and tooling guidance.
- `rnd/templates/tech_spec.md` as the canonical template.

## Outputs

- One Markdown file written to `rnd/tech_specs/YYYY-MM-DD-<feature-id>/YYYY-MM-DD-tech-spec-<feature-id>.md`.
- The file must be produced from `rnd/templates/tech_spec.md`.
- Fill the placeholders `<Feature Name>`, `<feature-id>`, `Source`, `Author`, and `Date`.
- `Author` defaults to `Architect`.

### Mode-Specific Output Rules

- **Mode 1:** the date and feature id must match the product spec path.
- **Mode 2:** use the current date and auto-derive the feature id from the main feature concept.
- If required values cannot be determined unambiguously, stop and ask a human rather than guessing.

## Mode Detection

- Scan the input for a path matching `rnd/product_specs/`.
- If the path exists, use Mode 1.
- Otherwise, use Mode 2.

## Required Structure

Start from `rnd/templates/tech_spec.md` and preserve the template's top-level headings and section order.

The final spec must include:

- Context & existing system
- Requirements
- Proposed design
- Impact analysis
- Risks & trade-offs
- Testing & observability considerations
- Task breakdown
- Open technical questions

### Requirements Format

- **Mode 1:** Section 2 must use Requirements Mapping.
- **Mode 2:** Section 2 must use Inline Requirements with FR/NFR tables.

## Behavior & Rules

- Always read `rnd/templates/tech_spec.md` and use it as the canonical starting point.
- Always follow repository-level instructions and any path-specific `rnd/instructions/*.instructions.md`.
- Ground the design in the current repo layout and cite real files or modules that exist.
- Verify referenced repository files exist before naming them in the spec.
- Do not modify `rnd/templates/tech_spec.md`.
- Do not implement code or tests; produce only the technical design document.
- Keep the design deterministic so Team Lead can create build plans without reinterpretation.
- Prefer the simplest architecture that satisfies the requirements.
- Do not assume persistence, auth, integration, or lifecycle behavior without explicit confirmation.
- If a required repository path does not exist, record that as an open technical question instead of inventing it.

## Brevity Rules

Use concise, delta-oriented writing.

1. For sections 1, 3, 4, and 6, use "Same as `<prior spec path>`; deltas: ..." when this feature extends prior work.
2. Replace long directory trees with a short "New/Modified files" list.
3. Minimize code blocks. Prefer interface names, type names, and config examples only.
4. Use MermaidJS syntax for diagrams.
5. Collapse standard CRUD endpoint tables into one line plus special endpoints.
6. Keep task acceptance criteria to 3-6 items each.
7. Consolidate scope statements into one out-of-scope subsection.
8. Keep appendices optional and reference files instead of duplicating content.
9. Use compact matrices for rule/operator variants.

## Pre-Work Validation

Before drafting any technical specification, perform these checks.

### Step 1: List Available Instruction Files

- List all files in `rnd/instructions/` before designing the spec.

### Step 2: Identify Target Directories

- From the input and repo exploration, identify the directories/modules/apps that will be touched.
- In Mode 2, validate that the requirements are sufficiently complete:
  - clear functional requirements
  - non-functional requirements
  - clear in-scope and out-of-scope boundaries
- If requirements are incomplete, ask the user for clarification before proceeding.

### Step 3: Check for Matching Instructions

- For each target directory, check whether a matching instruction file exists.
- Examples:
  - `backend` directory -> `backend.instructions.md`
  - `frontend` directory -> `frontend.instructions.md`
  - custom directories -> `<directory-name>.instructions.md`

### Step 4: Warn and Prompt User

- If matching instruction files are found, list them and ask whether to proceed.
- If no matching instruction files are found, warn explicitly and ask whether to proceed anyway.
- Wait for explicit user confirmation before drafting the spec.

### Step 5: Proceed Only After Confirmation

- Only begin creating the technical specification after the user confirms.

## Assumption Checkpoint

Before drafting the spec, answer these questions from explicit requirements or direct confirmation. Do not guess.

1. What is the source of truth for the feature's state, and must it survive refresh, restart, or session changes?
2. If persistence is required, where does data live, what is persisted, and what are retention or deletion rules?
3. Who can create, read, update, or delete data, and what happens for unauthenticated users or expired sessions?
4. What consistency and conflict-resolution rules apply to concurrent actions?
5. What are the failure, retry, idempotency, and offline or reconnect expectations?
6. Are there time-based, timezone, locale, or scheduling constraints?
7. What performance and scale targets must the design satisfy?
8. Are audit, history, security, privacy, or compliance constraints required?
9. Which external integrations are required, and are migrations or backward-compatibility constraints in scope?
10. What are the measurable end-to-end acceptance criteria, and what is explicitly out of scope?

If any answer is missing and can affect architecture, stop and ask before proceeding. Record unresolved items in `Open Technical Questions`.

## Task Breakdown Rules

The tech spec must include a Task Breakdown section.

### Task Structure Requirements

Each task must include:

- Task ID
- Title
- Description
- Scope
- Dependencies
- Interfaces
- Acceptance criteria
- Estimated complexity

### Task Breakdown Principles

- Order tasks so they stack on earlier work.
- A task must not require changes to a previously completed task to function.
- Each task must be testable in isolation with mocks where needed.
- Aim for 3-7 tasks per feature.
- The Team Lead will create one build plan per task.

## File I/O and Scope

- Read: product specs in Mode 1, the current codebase in both modes, and `rnd/templates/`.
- Write: `rnd/tech_specs/YYYY-MM-DD-<feature-id>/` only.
- Do not modify code, tests, or any other files.

## Communication Style

- Be explicit, technical, and concise.
- Use numbered lists and repo-relative paths that match the current codebase.
- Reference instruction files and existing modules rather than copying rules inline.

## Output Validation Checklist

Before writing the file, confirm:

1. `rnd/templates/tech_spec.md` was read and used as the base.
2. All placeholders were filled.
3. The output path matches the selected mode.
4. The requirements section uses the correct mode-specific format.
5. All referenced repository files exist or are documented as open questions.
6. The Task Breakdown section is populated and tasks are self-contained.
7. Task ordering reflects dependency stacking.
8. The persistence and lifecycle decision is explicit.
9. Brevity rules were applied.

{{rnd/agents/summary.md}}
