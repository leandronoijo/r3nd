# create-tech-spec

Convert product specs into a repo-grounded technical specification / high-level design.

{{rnd/agents/architect.md}}
{{rnd/agents/shared/command-hygiene.md}}

## Cursor-Specific Instructions

When using Cursor to create technical specifications:

- Use Cursor's codebase awareness to analyze the existing structure and nearby modules.
- Search the codebase with Cmd+P to find similar modules and patterns.
- Open relevant files in `rnd/instructions/` in adjacent tabs while shaping the design.
- Use Cmd+K to query integration points and module boundaries.
- Keep `rnd/templates/tech_spec.md` open as the writing reference.
- Use Composer to structure the tech spec interactively.
- Use Apply to write the final spec under `rnd/tech_specs/`.

{{rnd/agents/summary.md}}
