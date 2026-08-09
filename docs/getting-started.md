# Getting Started

r3nd is a spec-driven SDLC framework. The repository is the source of truth: skills, templates, instructions, specs, plans, and QA artifacts live in version control instead of chat history.

This page covers the fastest path to a usable setup based on the current CLI behavior.

## What You Install

The project has two layers:

- The framework seed repository, which stores canonical source content under `rnd/`
- The CLI, which copies that seed content into your configured spec directory, canonically `r3nd/`

That distinction matters:

- In this seed repository: source files live under `rnd/`
- In a generated or initialized project: the CLI writes to `r3nd/` by default

You can change the generated directory name through `r3nd.yaml` with `spec-dir-name`, but `r3nd/` is the documented default.

## Prerequisites

- Node.js `>=16`
- Git

Most users should treat the generated skills as the primary interface. That is the recommended model:

- use the r3nd CLI to initialize or scaffold the repo
- let it generate repo-native skills and templates
- run those skills from your preferred coding agent inside the project

You only need an agent backend installed if you want the CLI itself to execute agents through commands like:

- `r3nd agents ...`
- `r3nd analyse`

Supported direct-execution backends are:

- `codex`
- `claude`
- `gemini`
- `gh` for GitHub-backed execution

If you do not want the CLI to run agents directly, no agent backend is required.

## Install The CLI

Global install from GitHub:

```bash
npm install -g git+https://github.com/leandronoijo/r3nd.git#0.3
```

Local development install:

```bash
cd cli
npm install
```

After a global install, use `r3nd` from your shell.

## Choose `init` Or `scaffold`

The CLI has two setup paths.

### `r3nd init`

Use `init` when you want to add the framework to an existing repository with the smallest seed footprint.

Current behavior from the CLI implementation:

- initializes Git if `.git/` is missing
- prompts for `seed-repo`
- prompts for `spec-dir-name`
- lets you choose platform asset families
- fetches the seed tree from GitHub
- resolves selected overlays over the base seed in precedence order
- materializes common files, effective task skills, agent personas, templates, build plans, and selected vendor assets
- writes configuration to `r3nd.yaml`

Command:

```bash
r3nd init
```

Non-interactive mode:

```bash
r3nd init -y
```

### `r3nd scaffold`

Use `scaffold` when starting a new project and you want the fuller bootstrap path.

Current behavior from the CLI implementation:

- initializes Git if needed
- can add `origin` during setup
- materializes the same effective seed content as `init`
- also copies testing instructions
- ensures spec directories exist
- materializes root-scoped overlay instructions
- can optionally run scaffold build plans through a supported agent backend

Command:

```bash
r3nd scaffold
```

Non-interactive mode:

```bash
r3nd scaffold -y
```

Current overlay examples referenced by the docs and CLI flow:

- `angular`
- `fast-api`
- `nestjs`
- `ruby-on-rails`
- `vue`

## Configure The Repository

Repo-level configuration lives in `r3nd.yaml`.

Current supported keys:

- `seed-repo`
- `spec-dir-name`
- `overlays`
- `worktree-copy-files`
- `worktree-open-command`

The current CLI defaults are:

```yaml
seed-repo: leandronoijo/r3nd@develop
spec-dir-name: r3nd
overlays: []
worktree-copy-files:
  - "*.env"
  - "**/*.env"
worktree-open-command:
  - code
  - "{worktreeDir}"
```

## What Gets Generated

The CLI resolves task instructions from your configured spec directory:

- `r3nd/skills/`
- `r3nd/templates/`
- `r3nd/build_plans/`
- `r3nd/product_specs/`
- `r3nd/tech_specs/`
- `r3nd/test_cases/`
- `r3nd/e2e-results/`
- `r3nd/retros/`
- `r3nd/agent_summaries/`
- `r3nd/agent_runs/`
- `r3nd/instructions/`

The exact files depend on the selected command and overlays.

## Customize The Generated Framework

You do not need to fork or clone the seed repository to use r3nd.

The normal usage path is:

1. run `r3nd init` or `r3nd scaffold` in your own repository
2. let the CLI generate the framework files there
3. adapt those generated files to match your team

The generated framework is not meant to stay generic. Real adoption means changing the durable workflow files, especially:

- `r3nd/templates/*`
- `r3nd/skills/*`
- `overlays/*`
- generated `AGENTS.md` and `CLAUDE.md`

In this repository itself, the source versions of those assets still live under `rnd/`.

Forking or cloning the seed repository is only necessary if you want to maintain your own variant of the seed itself.

It is also the recommended path for teams that treat prompts, skills, agents, and templates as controlled engineering assets. In that model:

- your team keeps its own fork of the seed
- `seed-repo` points to that fork
- `r3nd update` pulls framework changes from your fork instead of the public upstream

That gives you change control over updates to skills, agents, templates, and related framework files, instead of taking upstream prompt changes directly.

## Generate Context Files

r3nd supports scoped repository context generation for vendors that consume `AGENTS.md` or `CLAUDE.md`.

There are two supported ways to do this:

1. use the generated analysis skills inside your own coding agent
2. use the CLI to execute analysis directly

The recommended path is still the first one: generate the skills into your repo, then run them from your preferred agent.

### Analysis Via Generated Skills

After `init` or `scaffold`, the analysis skills live in your generated spec directory and can be run from your agent like any other r3nd skill:

- `analyze-repo-context`
- `analyze-app-context`
- `analyze-module-context`

Use them like this:

- `analyze-repo-context`: generate top-level repository context
- `analyze-app-context`: generate context for one app or service
- `analyze-module-context`: generate context for one bounded module or area

This is the recommended path when you want r3nd to provide the workflow, but you want execution to happen inside your normal coding agent session.

### `r3nd analyse`

This is the CLI-driven analysis flow.

Current CLI behavior:

1. finds the first configured spec directory in the repo
2. runs `analyze-repo-context`
3. reads the generated repo output
4. parses app entries from YAML or JSON fenced blocks
5. optionally runs `analyze-app-context` for selected apps
6. ensures the required output files exist at each analyzed scope

Command examples:

```bash
r3nd analyse
r3nd analyse --non-interactive --agent codex
```

Supported agents for `analyse`:

- `codex`
- `claude`
- `gemini`
- `github`

### Analysis Via `r3nd agents`

You can also use the CLI to invoke the analysis skills directly by subcommand when you want a specific scope:

```bash
r3nd agents analyze-repo-context --input . --agent codex
r3nd agents analyze-app-context --input apps/backend --agent codex
r3nd agents analyze-module-context --input apps/backend/src/modules/auth --agent claude
```

Use them like this:

- `analyze-repo-context`: top-level repository map
- `analyze-app-context`: one app or service
- `analyze-module-context`: one bounded area inside an app or service

In short:

- generated skills: recommended when you want to run analysis inside your own agent
- `r3nd analyse`: recommended when you want the CLI to drive the broader repo/app analysis flow
- `r3nd agents analyze-*`: recommended when you want the CLI to run one specific analysis skill directly

## Start A Feature Workflow

All `r3nd agents` subcommands correspond to task skills that the CLI generates into your project.

That means there are two ways to use them:

- run the skill directly inside your chosen coding agent, which is the recommended default
- ask the CLI to execute that same skill through `r3nd agents ...`

In other words, `r3nd agents create-product-spec` is the CLI entry point for the same `create-product-spec` skill that can also be run directly from your agent inside the repo.

For a feature with explicit handoffs:

```bash
r3nd agents create-product-spec --input "Build user auth system"
r3nd agents create-tech-spec --file r3nd/product_specs/<feature>.md --agent codex
r3nd agents create-build-plan --file r3nd/tech_specs/<feature>.md --agent codex
r3nd agents implement-build-plan --file r3nd/build_plans/<plan>.md --agent codex
```

For a faster feature path:

```bash
r3nd agents implement-feature --file r3nd/tech_specs/<feature>.md --agent codex
```

For monorepos or scoped work:

```bash
r3nd agents create-product-spec --spec-dir apps/backend --input "Add OAuth2" --agent github
```

That writes into `apps/backend/r3nd/` by default.

## Inspect Local Tool Availability

Use:

```bash
r3nd tools
```

The CLI detects installed backends and only presents usable options. If none are installed, prompt generation remains available as a fallback.

## Use Worktrees For Parallel Tasks

r3nd can create repo-scoped worktrees under `~/.r3nd/worktrees/`.

```bash
r3nd worktree
r3nd worktree --branch auth-investigation
r3nd worktree clean
```

Current behavior:

- copies directories named as your configured `spec-dir-name`
- copies vendor directories like `.claude`, `.codex`, `.github`, and `.cursor` when present
- copies additional configured files such as `.env`
- opens the worktree with the configured `worktree-open-command`

## Recommended First Run

For an existing repo:

1. Run `r3nd init`
2. Set `seed-repo`, `spec-dir-name`, and overlays
3. Adapt templates and skills
4. Generate repo and app context files
5. Start with a small feature or one well-bounded spec-driven feature

For a new repo:

1. Run `r3nd scaffold`
2. Select overlays and platform assets
3. Review the generated build plans
4. Optionally let the CLI run scaffold implementation through an agent backend
5. Generate context files after the repo shape is stable
