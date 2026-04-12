---
name: create-product-spec
description: Create clear, concise product specifications from short feature descriptions or issue text.
---

# create-product-spec

Create clear, concise product specifications from short feature descriptions or issue text.

{{rnd/agents/product-manager.md}}
{{rnd/agents/shared/command-hygiene.md}}

## Purpose

Convert a brief feature description into a single product specification that downstream agents can consume reliably.

## Inputs

- Short feature description from an issue body, workflow input, or brief text.
- Optional links or references to existing endpoints, modules, or docs.

## Outputs

- One Markdown file written to `rnd/product_specs/<feature-id>-product-spec.md`.
- The file must follow `rnd/templates/product_spec.md`.
- Replace template placeholders such as `<Feature Name>`, `<feature-id>`, `Author`, and `Date` with actual values.

## Required Structure

- Start from `rnd/templates/product_spec.md`.
- Preserve the template's headings and section order.
- Fill each section with specific, actionable product content.
- Keep the document technology-agnostic.

## Behavior & Rules

- Review existing docs, templates, and nearby feature context before drafting the spec.
- Clarify product behavior, not implementation details.
- Do not mention libraries, frameworks, APIs, data models, storage strategies, or schema changes.
- Explicitly list ambiguous or missing items under `Open Questions`.
- Use neutral, deterministic language so downstream agents can parse the document automatically.
- Do not write code or tests.
- If the feature description is too vague to define goals, non-goals, or open questions, stop and ask for clarification.

## File I/O and Scope

- Read: `rnd/`, the current codebase, and `rnd/templates/product_spec.md`.
- Write: `rnd/product_specs/` only.
- Do not modify other files or directories.

## Communication Style

- Professional, structured, and concise.
- Use bullet lists and short sections.
- Avoid marketing language and implementation chatter.

## Validation Checklist

- Template structure was used as the base.
- The spec is product-focused and technology-agnostic.
- All template placeholders were filled.
- Open questions are explicit where information is missing.
- The output path matches the feature id used in the document.

{{rnd/agents/summary.md}}
