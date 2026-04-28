---
name: manual-qa-report-to-html
description: Convert a manual QA Markdown result into a standalone HTML evidence report with clickable proof links for JSON, images, and code snippets.
---

# manual-qa-report-to-html

Convert a manual QA Markdown result into a standalone HTML evidence report with clickable proof links for JSON, images, and code snippets.

{{rnd/agents/manual-qa-tester.md}}
{{rnd/agents/shared/command-hygiene.md}}

## Purpose

Turn a completed manual QA result into a shareable, reviewer-friendly HTML artifact that makes evidence quick to inspect.

## Inputs

- Source report: `rnd/manual-qa-results/<feature-id>-manual-qa-result.md` (required)
- Evidence artifacts referenced by the report, usually under `rnd/manual-qa-results/<feature-id>/artifacts/`
- Optional additional proof files (JSON, screenshots, logs, text/code snippets)

## Outputs

- HTML report: `rnd/manual-qa-results/<feature-id>-manual-qa-result.html`

## Hard Rules

1. The HTML must be generated from an existing manual QA Markdown result.
2. Keep the original verdict and case statuses unchanged.
3. Every artifact path referenced in the Markdown must be represented in HTML as a clickable link.
4. JSON artifacts must include both a link and an in-page formatted preview.
5. Image artifacts must include both a link and an in-page image preview.
6. Code/text artifacts must include both a link and an in-page code block preview.
7. If any referenced artifact path is missing, keep it in the report and mark it clearly as missing.
8. Do not write outside `rnd/manual-qa-results/`.

## Workflow

### 1. Discover Report and Feature ID

1. Locate the source file `rnd/manual-qa-results/<feature-id>-manual-qa-result.md`.
2. Derive `<feature-id>` from the file name and preserve it in output naming.

### 2. Parse Sections and Evidence

1. Read metadata, summary, per-case sections, blockers, and decision text.
2. Extract all artifact paths listed in per-case artifact bullets.
3. Classify artifact types by extension:
   - JSON: `.json`
   - Image: `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`
   - Code/Text: `.txt`, `.log`, `.md`, `.js`, `.ts`, `.tsx`, `.jsx`, `.py`, `.go`, `.java`, `.rb`, `.rs`, `.sh`, `.sql`, `.yaml`, `.yml`, `.toml`, `.xml`, `.html`, `.css`

### 3. Generate the HTML Report

1. Create a single standalone HTML file at `rnd/manual-qa-results/<feature-id>-manual-qa-result.html`.
2. Preserve report structure with clear sections:
   - Title and metadata
   - Execution summary
   - Per-case results
   - Artifact evidence blocks
   - Warnings/blockers
   - Approval decision
3. For each artifact:
   - Add a clickable relative link to the original file.
   - Render an in-page preview based on type.
   - Mark missing files with a visible warning label.
4. Use readable styling with:
   - fixed-width font for evidence snippets
   - colored status chips for PASSED/FAILED/BLOCKED
   - clear callout for APPROVED/REJECTED

### 4. Validate and Finalize

1. Confirm every artifact from the Markdown appears in the HTML.
2. Confirm links resolve relative to the HTML file location.
3. Confirm verdict and case statuses exactly match the Markdown report.

## Suggested HTML Behaviors

- Use `<details>` blocks per artifact for compact browsing.
- Escape code/text previews safely.
- Pretty-print JSON with indentation.
- Add an artifact table of contents at the top for quick jumps.

## File I/O and Scope

- Read: `rnd/manual-qa-results/` and referenced artifact files
- Write: `rnd/manual-qa-results/<feature-id>-manual-qa-result.html` only

## Communication Style

- Evidence-first and concise.
- Highlight missing artifacts explicitly.
- Keep output deterministic and reviewer-friendly.

{{rnd/agents/summary.md}}
