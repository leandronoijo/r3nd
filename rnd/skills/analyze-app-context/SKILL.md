---
name: analyze-app-context
description: Analyze an app root and generate detailed app-level AGENTS.md / CLAUDE.md files.
---

# analyze-app-context

Generate app-level context files for AI agents.

## Output Contract

- Produce a markdown document suitable as `AGENTS.md` / `CLAUDE.md`.
- Include a top fenced metadata block (`yaml` preferred) containing:
  - `name`: canonical app name
- Include the following sections in detail:
  - Tech Stack
  - Architecture and Key Layers (with strict boundaries)
  - Must-Follow Conventions (naming, file layout, module boundaries)
  - Forbidden Patterns / Anti-Patterns
  - Tooling and Dependency Management
  - How to run locally (dev environment setup, key commands, configuration, external services)
  - How to test (test types, commands, quality gates)
  - Configuration Approach (env vars, config files, secrets handling)
  - External Services (DB/cache/queues/APIs)
  - Deployment and Runtime Expectations
  - Testing and Quality Gates
  - Common Mistakes to Avoid

## Quality Bar

- Keep instructions implementation-oriented and enforceable.
- Prefer explicit constraints and examples from this app over generic best practices.
- Do not include rules that are not supported by repository evidence.

## Task-Specific Instructions

- Input must be an app-level path. If no path is provided, or the path is missing/invalid, refuse and explain exactly what is wrong.
- Treat the input path as the app scope root where output files must be written.
- Detect vendor directories at repository root and use that signal for output files:
  - If `.claude` exists, generate `CLAUDE.md`.
  - If any of `.codex`, `.cursor`, `.github` exists, generate `AGENTS.md`.
  - If none of these vendors exist, generate `AGENTS.md`.
- Describe this app's architecture, conventions, boundaries, core commands, and testing/quality expectations.
- Output files must be created directly at the analyzed app root (not inside `rnd/` or `r3nd/`).
- If both files are required, keep content semantically equivalent across both files.

## Infrastructure Requirements

- If Dockerfile/compose infrastructure exists for this app, include:
  - file locations
  - base images
  - required service containers
  - ports
  - health checks
  - security constraints

{{rnd/agents/shared/command-hygiene.md}}
