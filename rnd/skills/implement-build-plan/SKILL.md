---
name: implement-build-plan
description: Implement features and tests based on a build plan; follow repository standards and keep diffs small and test-driven.
---

# implement-build-plan

Implement features and tests based on a build plan; follow repository standards and keep diffs small and test-driven.

{{rnd/agents/developer.md}}
{{rnd/agents/shared/command-hygiene.md}}

## Task-Specific Instructions

- Inspect touched code, tests, and instruction files before editing.
- Keep implementation and verification close together so the repository is left in a tested state.
- Follow the build plan exactly and update task checkboxes only after the task is complete.
- Append clarifications to the build plan if reality diverges from the original plan; do not rewrite history.

## Inputs

| Input | Location | Purpose |
|-------|----------|---------|
| Build Plan | `rnd/build_plans/<feature-id>-build-plan.md` | Source of truth for the task |
| Backend Rules | the backend guidance in the applicable `AGENTS.md` / `CLAUDE.md` | Backend conventions and code patterns |
| Frontend Rules | the frontend guidance in the applicable `AGENTS.md` / `CLAUDE.md` | Frontend conventions and code patterns |
| Existing Code | Current codebase | Context and integration points |
| Existing Tests | Current codebase test locations | Test patterns and coverage expectations |
| Golden References | As specified in the build plan | Canonical examples to copy |

## Outputs

- Code changes in the current codebase.
- Test files in the current codebase test locations.
- Checkbox updates in `rnd/build_plans/<feature-id>-build-plan.md`.
- Append-only clarifications in the build plan if needed.

## Hard Rules

### Frontend

- Follow the frontend-specific instructions for framework, UI library, state management, and test conventions.
- Keep changes small and component-focused.
- Rely on the repository's golden references.

### Backend

- Follow backend-specific instructions for module patterns, DTOs, schema rules, and service/controller hygiene.
- Do not guess; rely on the instruction file and goldens.

### General

| Rule | Enforcement | Why |
|------|-------------|-----|
| No new frameworks or libraries that were not explicitly approved | Only use packages already present in the project's dependency manifest. | Dependency control |
| Prefer CLI tools over manual file editing | Use framework generators and package manager commands when available. | Consistency and correctness |
| Validate package installations immediately | After adding a package, run install, build, and test. | Catch dependency issues early |
| Validate Docker artifacts after creation | Build and run containers, then verify endpoints respond. | Avoid broken runtime artifacts |
| No files over 400 lines | Split large files into smaller modules. | Maintainability |
| No unused imports | Remove them before finishing. | Clean code |
| No commented-out code | Delete it. | Code hygiene |
| Lint and format must pass | Use the repository's scripts before marking done. | Consistency |
| No `any` types | Use explicit types or interfaces. | Type safety |
| Async/await over `.then` | Keep async code consistent. | Readability |
| Single responsibility | One function should do one thing. | Testability |
| Validate external I/O and user input types | Check shapes, sanitize inputs, and test malformed cases. | Prevent runtime and security issues |
| Build and runtime packaging validation | Verify artifacts, entry points, manifests, and outDir paths. | Prevent packaging and runtime failures |
| Runtime environment configuration | Separate build-time and runtime env concerns; use browser-accessible host URLs. | Avoid rebuilds for config changes and network issues |

## Workflow

### Before Starting

1. Read the entire build plan.
2. Read the relevant instruction files.
3. Identify golden references to copy.
4. Check task dependencies before editing.

### For Each Task

1. Read the task carefully.
2. Find the golden reference.
3. Prefer CLI tools and generators when available.
4. Implement the code.
5. Write the test alongside the code.
6. Validate package additions if any were introduced.
7. Validate Docker artifacts if any were changed.
8. Run lint and tests.
9. Mark the task complete in the build plan.
10. Move to the next task only after the current one is complete.

### After All Tasks

1. Run the full test suite.
2. Check for unused imports.
3. Verify acceptance criteria.
4. Update the build plan with any append-only clarifications.
5. Validate build and runtime artifacts.

## Code Patterns to Follow

### Golden References

- Use the repository's example modules, services, controllers, DTOs, schemas, components, stores, and tests as the canonical patterns.
- Use repo/app/module-scoped `AGENTS.md` / `CLAUDE.md` files to locate the correct references for the stack in play.
- Do not invent new patterns when a repository example already exists.

## File I/O and Scope

| Access | Locations | Purpose |
|--------|-----------|---------|
| Read | `rnd/build_plans/` | Task source of truth |
| Read | Current codebase | Implementation context |
| Read | repo/app/module-scoped `AGENTS.md` / `CLAUDE.md` files | Stack rules and patterns |
| Write | Current codebase application code locations | Implementation code |
| Write | Current codebase test locations | Test code |
| Write | `rnd/build_plans/` | Checkbox updates and clarifications |

### Never Modify

- Documentation directories in the current codebase.
- `rnd/product_specs/`.
- `rnd/tech_specs/`.
- `.github/workflows/`.
- repo/app/module-scoped `AGENTS.md` / `CLAUDE.md` files.

## Common Mistakes to Avoid

### Frontend Mistakes

| Mistake | Correct Approach |
|---------|------------------|
| Using unauthorized frontend patterns | Follow the frontend instruction file. |
| Importing unauthorized UI libraries | Use only approved libraries. |
| Forgetting `data-test-id` | Add stable selectors to interactive elements. |
| Inline fetch in components | Use the prescribed store or composable pattern. |
| Large monolithic components | Split them. |
| Options API usage | Use the repository's preferred component style. |
| Direct store mutation | Use store actions. |
| Missing `:key` in `v-for` | Add stable unique keys. |
| Hardcoded strings | Use constants or i18n where the repo expects it. |
| Global CSS | Follow the repository's scoped styling conventions. |
| Not validating I/O response types | Check response shape and content type before parsing. |

### Dependency and Build Mistakes

| Mistake | Correct Approach |
|---------|------------------|
| Adding packages without validating | Run install, build, and test immediately. |
| Creating Dockerfiles without testing | Build and run containers, then verify endpoints. |
| Ignoring peer dependency warnings | Resolve version conflicts instead of suppressing them. |

### Backend Mistakes

| Mistake | Correct Approach |
|---------|------------------|
| Logic in controllers | Move logic to services. |
| Skipping DTO validation | Follow backend DTO and validation patterns. |
| Raw DB queries | Follow backend data access and repository conventions. |
| Missing DI registration | Register providers per backend conventions. |
| Circular module imports | Prefer refactoring over `forwardRef`. |
| Adding schema fields without DTO updates | Keep schema and DTO synchronized. |
| Large services | Split into focused services. |
| Hardcoded config | Use the repository's config pattern. |
| Swallowing errors | Use the repository's error handling conventions. |
| Using `any` | Define explicit interfaces. |
| Not validating external data | Validate and sanitize incoming data, DB records, and file contents. |

### Testing Mistakes

| Mistake | Correct Approach |
|---------|------------------|
| Skipping tests | Every new file needs a test. |
| CSS selectors in E2E | Use `data-test-id` only. |
| No explicit waits | Use explicit waits where required. |
| Testing implementation details | Test behavior. |
| Non-deterministic data | Use fixtures. |
| Missing error path tests | Cover both success and failure. |
| Missing malformed I/O tests | Exercise invalid input, non-JSON responses, and bad records. |

## Self-Verification Checklist

### For every file created or modified

- File is under 400 lines.
- No `any` types are used.
- No unused imports remain.
- No commented-out code remains.
- Naming conventions are followed.
- A corresponding test file exists.
- I/O validation is present where applicable.

### When packages are added

- Package install command was run.
- Peer dependency conflicts were checked and resolved.
- Build command passed.
- Test command passed.
- Dependency resolutions are documented in the build plan if relevant.

### When Docker files are created or modified

- Docker image build succeeded.
- Containers started successfully.
- Service endpoints responded correctly.
- Commands and results are documented in the build plan.

### For backend code

- Services are registered per backend conventions.
- Controllers only call service methods.
- DTOs are validated per backend instructions.
- Schema and DTO fields match.
- Errors follow backend conventions.
- External I/O is validated and tested.
- Config values are not hardcoded.
- Build artifacts and runtime smoke tests pass.

### For frontend code

- Components follow frontend instructions.
- Only allowed UI libraries are used.
- Interactive elements have `data-test-id`.
- State changes follow the prescribed patterns.
- No inline fetch calls.
- Styling follows repository conventions.
- Runtime packaging and environment config are correct.

### For tests

- Tests cover success and error paths.
- No real network calls are used unless required.
- E2E uses only `data-test-id` selectors.
- Explicit waits are added where needed.
- Test names describe the scenario.

## Golden References

| Type | Location | Use For |
|------|----------|---------|
| Backend Module | Example backend module in the current codebase | Module structure and DI patterns |
| Backend Service | Example backend service in the current codebase | Service methods and error handling |
| Backend Controller | Example backend controller in the current codebase | Route handlers and DTO usage |
| Backend DTO | Example backend DTOs in the current codebase | Validation decorators |
| Backend Schema | Example backend schemas in the current codebase | Data model definition patterns |
| Frontend Component | Example frontend component in the current codebase | Component structure |
| Frontend Store | Example frontend store in the current codebase | State management patterns |
| Backend Tests | Example backend tests in the current codebase | Backend test patterns |
| Frontend Tests | Example frontend tests in the current codebase | Frontend test patterns |
| E2E Tests | Example E2E tests in the current codebase | Selector and test flow patterns |

## When Things Don't Match the Plan

1. If the file path in the plan does not exist, create the parent directories and document the discrepancy in the build plan.
2. If the interface or type does not match, append a clarification to the build plan and proceed with the correct type.
3. If a dependency task is not complete, stop and do not proceed out of order.
4. If the golden reference does not exist, use the instruction files and document the fallback.
5. If a required library is missing from the manifest, stop and record the need in the build plan rather than guessing.

## Communication Style

- Be concise, technical, and traceable.
- Use commit-style summaries when helpful.
- Document deviations as append-only clarifications.
- Keep the repository in a tested state before moving on.

{{rnd/agents/summary.md}}

## Definition of Done for Each Task

- Code matches the task details.
- Test file exists and covers success and error paths.
- Package, build, and test validation pass if dependencies changed.
- Docker validation passes if container files changed.
- Lint passes with no warnings.
- Type check passes with no errors.
- Acceptance criteria are met.
- The build plan checkbox is marked complete.
