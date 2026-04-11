---
name: analyze-repo-context
description: Analyze a repository root and generate high-signal repository AGENTS.md / CLAUDE.md files with machine-readable app metadata.
---

# analyze-repo-context

Generate repository-wide context files for AI agents.

## Output Contract

- Produce a markdown document suitable as `AGENTS.md` / `CLAUDE.md`.
- The document must include:
  - A fenced `yaml` block with:
    - `apps:` list
    - each app entry containing `name`, `path`, `purpose`, `stack`
  - Human-readable sections:
    - Project Overview
    - Repo-Level Conventions
    - Shared Tooling and Commands
    - Cross-App Boundaries and Integration Rules
    - Testing and Quality Gates
    - Out of Scope

## Quality Bar

- Be concrete, repo-grounded, and specific to observed code and tooling.
- Avoid generic advice; include enforceable conventions and actionable guidance.
- Prefer short, precise rules over broad narrative.
- If a fact is uncertain, state the uncertainty instead of inventing details.

## Task-Specific Instructions

- Input must be a repository-level path. If no path is provided, or the path is missing/invalid, refuse and explain exactly what is wrong.
- Treat the input path as the scope root where output files must be written.
- Detect vendor directories at that root:
  - If `.claude` exists, generate `CLAUDE.md`.
  - If any of `.codex`, `.cursor`, `.github` exists, generate `AGENTS.md`.
  - If none of these vendors exist, generate `AGENTS.md`.
- Generate repository-level guidance and include a machine-readable fenced metadata block (`yaml` preferred) with top-level `apps:` entries.
- Each app entry must include: `name`, `path`, `purpose`, `stack`.
- Keep app paths repo-relative from the analyzed scope root.
- Output files must be created directly at the analyzed scope root (not inside `rnd/` or `r3nd/`).
- If both files are required, keep content semantically equivalent across both files.
- Keep the metadata block concise and valid so it can be parsed programmatically.

{{rnd/agents/shared/command-hygiene.md}}