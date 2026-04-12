---
name: create-retro-report
description: Review PR discussions to identify improvements to agents, templates, or instructions; write a retro report to rnd/retros.
---

# create-retro-report

Review PR discussions to identify improvements to agents, templates, or instructions; write a retro report to rnd/retros.

{{rnd/agents/retro.md}}
{{rnd/agents/shared/command-hygiene.md}}

## Purpose

Review PR discussion and identify concrete improvements to this repo's agents, templates, or instructions so the same mistakes do not repeat.

## Inputs

| Input | Location | Purpose |
|-------|----------|---------|
| PR discussion | PR conversation, reviews, and review threads | Source of issues and evidence |
| PR files | PR file list | Map feedback to directories and process assets |
| Agent profiles | `rnd/agents/*.md` | Update guidance for agents |
| Templates | `rnd/templates/*.md` | Update guidance for templates |
| Instructions | `rnd/instructions/*.instructions.md` | Update execution rules |

## Outputs

- Retro report: `rnd/retros/pr-<number>-retro.md`
- Use template: `rnd/templates/retro.md`

### Spec Directory Resolution

- If `r3nd.yaml` contains `spec-dir-name`, use that value as `rnd`.
- Otherwise, look for a directory named `r3nd` or `rnd` and prefer `r3nd` if both exist.

## Directory-to-Process Mapping

Use the file path referenced in a comment to determine which process artifact to improve.

| Commented Path Prefix | Improve |
|-----------------------|---------|
| `rnd/product_specs/` | `product-manager` agent + `rnd/templates/product_spec.md` |
| `rnd/tech_specs/` | `architect` agent + `rnd/templates/tech_spec.md` |
| `rnd/build_plans/` | `team-lead` agent + `rnd/templates/build_plan.md` |
| `rnd/test_cases/` | `qa-team-lead` agent + `rnd/templates/test_cases.md` |
| E2E artifacts in the current codebase or `rnd/e2e-results/` | `e2e-engineer` agent + `rnd/instructions/e2e-testing.instructions.md` + `rnd/templates/e2e-result.md` |
| Backend application code paths in the current codebase | `developer` agent + `rnd/instructions/backend.instructions.md` |
| Frontend application code paths in the current codebase | `developer` agent + `rnd/instructions/frontend.instructions.md` |
| Automated test paths in the current codebase | `developer` agent + `rnd/instructions/testing.instructions.md` |
| `rnd/agents/` | The referenced agent profile |
| `rnd/templates/` | The referenced template |
| `rnd/instructions/` | The referenced instruction file |

If a comment does not reference a file path, use the PR scope and discussion context to choose the most relevant artifact and state the assumption in the retro.

## Workflow

1. Read shared summaries first when `rnd/agent_summaries/` exists.
2. Collect context from the PR description, review comments, review threads, and issue comments.
3. Extract mistakes, confusion, or rework noted by reviewers.
4. Map each issue to the relevant agent, template, or instruction.
5. Propose specific, minimal process updates with file paths.
6. Write the retro with `rnd/templates/retro.md` and include evidence links to the discussion.
7. After user approval, delete files in `rnd/agent_summaries/` so the next cycle starts clean.

## Hard Rules

- Do not change product code or tests.
- Do not propose new tooling or frameworks.
- If no improvements are warranted, state `No updates recommended` and explain why.
- Always include evidence links for each recommendation.
- Do not create a new agent summary log for the retro workflow.

## Task-Specific Instructions

- Gather evidence from PR discussions, review threads, issue comments, and any available workflow logs before drafting the retro.
- Keep evidence links and proposed updates concise and directly tied to repo files.

{{rnd/agents/summary.md}}
