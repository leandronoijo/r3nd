---
name: analyze-module-context
description: Analyze a module path and generate detailed module-level AGENTS.md / CLAUDE.md files.
---

# analyze-module-context

Generate module-level context files for AI agents.

## Output Contract

- Generate module-level `AGENTS.md` / `CLAUDE.md` files **inside each discovered module directory**.
- Every generated module file must start with a fenced `yaml` metadata block containing:
  - `name`: canonical module name
- Every generated module file must include:
  - Module Purpose and Responsibilities
  - Public Interfaces and Contracts
  - Internal Architecture and Boundaries
  - Integration Points and Dependencies
  - Allowed Patterns and Required Conventions
  - Forbidden Patterns / Anti-Patterns
  - Module Commands (if applicable)
  - Module-Specific Testing Requirements
  - Failure Modes and Defensive Rules
  - Common Mistakes to Avoid

## Quality Bar

- Optimize for maintainers working inside this module.
- Be concrete about interfaces, invariants, and boundaries.
- Avoid duplicating broad repo/app rules unless they directly affect this module.

## Task-Specific Instructions

- Input is an app/module scope path to inspect for modules. If no path is provided, or the path is missing/invalid, refuse and explain exactly what is wrong.
- Discover module directories within the given scope and generate files per module.
- Detect vendor directories at repository root and use that signal for output files:
  - If `.claude` exists, generate `CLAUDE.md`.
  - If any of `.codex`, `.cursor`, `.github` exists, generate `AGENTS.md`.
  - If none of these vendors exist, generate `AGENTS.md`.
- Focus on module responsibilities, public interfaces, boundaries, contracts, and module-specific testing rules.
- Write module files inside each module directory, not at the app root.
- Do not write a module-context `AGENTS.md`/`CLAUDE.md` at the app root for this task.
- If both files are required, keep content semantically equivalent across both files.
- If no module directories can be confidently identified, refuse and explain what structure is missing or ambiguous.
{{rnd/agents/shared/command-hygiene.md}}
{{rnd/agents/summary.md}}
