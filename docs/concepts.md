# Concepts

r3nd is not just a CLI. The CLI is the operator tool around a repository-native delivery model. The framework works because the durable artifacts, rules, and execution contracts live in the repo.

This page pulls the core concepts out of the root README and tightens them against the current codebase.

## The Core Model

r3nd combines five ideas:

1. Persistent engineering knowledge in the repository
2. Skills that encode repeatable delivery procedures
3. Templates that constrain artifact shape
4. Overlays that adapt the framework to a stack or domain
5. Vendor-agnostic execution across different AI tools

The result is a workflow where a request becomes a series of explicit artifacts instead of an improvised chat thread.

## Repository Memory

The main design claim is simple: delivery context should survive the current assistant session.

That durable context lives in repo artifacts such as:

- product specs
- tech specs
- build plans
- test cases
- E2E results
- manual QA results
- retros
- agent summaries
- task skills
- templates
- stack instructions

In generated projects, those usually live under `r3nd/`.

In this seed repository, the canonical source content is stored under `rnd/`, then copied or composed into the configured spec directory by the CLI.

## Skills

Skills are executable operating procedures. They define how a task is supposed to run, including:

- purpose
- inputs
- outputs
- required files
- workflow phases
- hard rules
- communication constraints

The current seed includes skills for:

- specification work
- implementation work
- QA
- retros
- repo/app/module analysis
- small-feature and bugfix orchestration

Examples from the current seed:

- `create-product-spec`
- `create-tech-spec`
- `create-build-plan`
- `implement-build-plan`
- `implement-feature`
- `create-test-cases`
- `run-e2e-tests`
- `run-manual-qa-tests`
- `create-retro-report`
- `quick-feature`
- `bugfix`

This is why the framework is more durable than prompt snippets. The workflow contract is saved as markdown and versioned with the repo.

## Agents

Agents are role boundaries, not personalities.

The seed uses agent briefs such as:

- product manager
- architect
- team lead
- developer
- QA lead
- E2E engineer
- manual QA tester

Skills compose those roles. For example:

- `create-product-spec` uses the product-manager brief
- `create-tech-spec` uses the architect brief
- `create-build-plan` uses the team-lead brief
- `implement-build-plan` uses the developer brief

This keeps responsibility explicit and reduces silent role drift inside one long conversation.

## Templates

Templates are artifact contracts.

The current seed defines templates for:

- product specs
- tech specs
- build plans
- test cases
- E2E results
- manual QA results
- retros

Templates matter because downstream steps depend on predictable structure. A weak template forces later agents to reinterpret intent. A strong template turns artifacts into stable machine- and human-readable handoff points.

## Artifact Chain

The normal delivery path is an artifact chain:

1. Product intent becomes a product spec
2. Product spec becomes a tech spec
3. Tech spec becomes one or more build plans
4. Build plans drive implementation
5. Implementation drives test cases and QA evidence
6. Delivery produces a retro

The chain exists so implementation is grounded in approved documents instead of whatever the current chat window happens to contain.

## Overlays

Overlays adapt the framework to a real stack without changing the base operating model.

From the current docs and CLI flow, overlays can contribute stack-specific files such as:

- skills
- instructions
- templates
- build plans
- vendor assets

The CLI discovers overlays from the configured seed repository and stores the chosen overlay list in `r3nd.yaml`.

This is how the same framework can target different stacks without cloning the whole process by hand.

## Instructions And Golden References

The seed expects stack-specific rules to live in instruction files under the spec directory. The implementation and QA skills explicitly read those instructions before acting.

Those instructions are used to constrain:

- code patterns
- module structure
- validation rules
- test frameworks
- E2E behavior
- runtime setup

This is a critical point: the framework does not expect the model to invent local conventions. It expects the repo to state them.

## Vendors Are Backends, Not Authority

The framework supports multiple execution backends:

- Codex
- Claude Code
- Gemini
- GitHub-backed agent execution
- prompt generation for manual use

The CLI detects available tools and only offers usable options. The backend changes, but the skill, template, and artifact structure remain repo-defined.

That is the actual meaning of vendor-agnostic here: execution can move, but authority stays in the repository.

## Scoped Context Files

r3nd supports generated context at different levels of a codebase:

- repository
- app
- module

The current analysis flow generates `AGENTS.md` and, when needed, `CLAUDE.md` at those scopes.

This matters in larger repos because one global prompt file is not enough. The framework expects local context near the code that needs it.

## Seed Repo Versus Generated Project

There are two layers to keep straight:

- The seed repository contains the source assets and currently stores them under `rnd/`
- A consumer repository created or initialized with the CLI gets those assets under its configured spec directory, normally `r3nd/`

This repo is therefore both:

- the framework source
- an example of how the source is organized before generation

Confusing those two layers is the main source of documentation drift, so the docs need to keep stating it directly.

## Worktrees And Parallel Delivery

The framework assumes teams will run multiple efforts in parallel. The worktree support exists so parallel work still carries the same repo-native context.

Current worktree behavior copies:

- the configured spec directory
- vendor directories like `.claude`, `.codex`, `.github`, `.cursor`
- additional configured files from `worktree-copy-files`

That keeps the local operating model intact inside each worktree instead of forcing re-setup for every branch.

## What Adoption Really Means

Cloning the repo is not adoption by itself.

Actual adoption means:

1. choosing the spec directory shape
2. selecting overlays
3. rewriting templates and skills to match your standards
4. generating local context files
5. running work through the artifact chain consistently

If a team does not adapt the markdown, it is only trying the default seed, not establishing its own operating model.
