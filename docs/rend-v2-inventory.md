# R3nd inventory for Rend v2

This is a baseline of the current seed repository, intended to inform v2 discovery and design. It inventories shipped assets and observable CLI wiring, then separates the underlying principles from implementation choices. It is not a v2 specification or a promise that every current behavior should survive. Paths below refer to this repository; generated projects normally use `r3nd/` where this seed uses `rnd/`.

## Product model

R3nd is a forkable, spec-driven software delivery operating model for humans and coding agents. Its central claim is that team knowledge and delivery decisions should be durable, reviewable repository assets instead of ephemeral chat context. The CLI installs, composes, updates and launches those assets; teams are expected to adapt the Markdown to their own standards. See [README](../README.md) and [concepts](concepts.md).

The model has five main building blocks:

| Building block | Purpose | Current form |
| --- | --- | --- |
| Skills | Executable procedures: inputs, phases, rules, gates, outputs and completion conditions | `rnd/skills/*/SKILL.md` |
| Agents | Bounded responsibilities and behavioral profiles composed into skills; not roleplay for its own sake | `rnd/agents/*.md` and shared fragments |
| Templates | Contracts for predictable artifacts consumed by people and later workflows | `rnd/templates/` |
| Overlays | Ordered adaptations for a stack or delivery mindset | `overlays/` |
| Vendors | Execution/distribution targets; repository assets remain the authority | `rnd/vendor/skills/`, generated platform directories, CLI runners |

The source assets are instructions to an LLM, not deterministic enforcement. Their presence is evidence of intended behavior, not proof every coding agent follows it. CLI behavior below is grounded in registered commands and services; this inventory does not represent an end-to-end runtime audit.

## Philosophy and invariants to consider for v2

1. **Repository as shared memory.** Specs, plans, local instructions, QA evidence and learning records persist across sessions and can travel through normal Git workflows. Context is scoped to repository, app or module rather than packed into one universal prompt.
2. **Explicit handoffs and traceability.** Product intent becomes technical design, actionable plans, implementation and verification artifacts. Templates and links make the chain inspectable, and planning is grounded in the actual codebase.
3. **Humans own consequential decisions.** Review and approval boundaries vary by workflow. Agents can make routine decisions, but surface ambiguity, material assumptions, design changes and blockers. The current quick-feature and bugfix workflows explicitly gate implementation on plan approval.
4. **Right-sized process.** Full-control, semi-control, quick feature and bugfix paths provide different amounts of ceremony. Prototyping and MVP overlays further change acceptable engineering and QA scope.
5. **Roles and workflow are separable.** Narrow agent profiles define responsibilities; skills compose them into procedures. Delegation and phase tracking make ownership and handoffs explicit.
6. **Verification is part of delivery.** Tasks have definitions of done and focused checks; E2E and live manual QA can provide evidence, not merely declarations of success. The mindset overlays allow a user-selected QA path.
7. **Adaptable, vendor-independent practice.** Canonical assets are composed with vendor-specific instructions and stack/mindset overlays. A custom seed can encode a team's practices and outlive a particular assistant.
8. **Learn from actual work.** Capture significant corrections, failures, decisions and recovery as they occur, then review evidence across time and propose specific, reviewable process changes. Preserve uncertainty and source evidence.
9. **Small, understandable changes.** Prefer existing patterns, explicit boundaries, testable tasks and restrained infrastructure. Mindset policies favor mature libraries for commodity problems and escalation for meaningful uncertainty.
10. **Parallel work with isolation.** Durable plans enable independent work; Git worktrees and dependency-aware coordination provide isolation and handoff mechanisms.

These are inferred from the current assets, especially [README](../README.md), [workflows](workflows.md), [learning journal](../rnd/agents/shared/learning-journal.md), and the [MVP](../overlays/mvp/agents/shared/mvp.md) and [prototyping](../overlays/prototyping/agents/shared/prototyping.md) policies. They are candidates for discussion, not established v2 requirements.

## Delivery workflows

| Path | Entry and sequence | Control and outcome |
| --- | --- | --- |
| Full control | Product spec → tech spec → build plan → implementation → test cases / E2E / manual QA → period retro | Human review between stages; durable artifacts and evidence throughout. |
| Semi-control | Tech spec → `implement-feature` assures plans, orders dependencies, implements and gates tasks → selected final QA | Human approves technical direction and reviews outcome; coordinator handles more of the sequence. |
| Small feature | `quick-feature`: investigate → eligibility gate → one plan → approval → implementation → QA | Restricted scope; escalate when the quick-path limits are exceeded. |
| Bugfix | `bugfix`: reproduce → investigate intent/history → plan and approval → smallest safe repair → verification → documentation follow-up | Focus on the actual defect, preserve behavior and show evidence of recovery. |
| Context analysis | Analyze repository, app or module → generate scoped `AGENTS.md` and `CLAUDE.md` | Repository-grounded instructions and app metadata for future work. |
| Continuous learning | Capture incidents during work → review a time window → propose exact process edits | Evidence is retained; recommendations are not automatically applied. |

See [workflow guide](workflows.md). Workflow descriptions describe the shipped contracts; actual approval and QA requirements depend on the selected skill and overlay.

## Canonical skill inventory

All 15 source skills are under [rnd/skills](../rnd/skills). The CLI registry exposes 11; direct-use skills can be installed as vendor skills even without a matching `r3nd agents` subcommand.

| Skill | Input → responsibility / output | CLI agent subcommand |
| --- | --- | --- |
| `create-product-spec` | Feature description → concise product scope, goals and requirements using product template | Yes |
| `create-tech-spec` | Product spec or direct requirements → repo-grounded design, decisions and task breakdown; checks assumptions and local instructions | Yes |
| `create-build-plan` | Tech spec or concrete problem → small traceable implementation and test tasks, dependencies, rollout and done criteria | Yes |
| `implement-build-plan` | One plan → implementation, task progress and verification following local standards | Yes |
| `implement-feature` | Tech spec or feature directory → assure plans, coordinate dependency-aware tasks and task QA, then final QA and fix loop; records run artifacts | Yes |
| `quick-feature` | Small request → investigate and check eligibility, write one plan, obtain approval, implement and verify | No |
| `bugfix` | Defect → reproduce, investigate, plan and obtain approval, fix, verify and follow up on docs | No |
| `create-test-cases` | Build plan → focused sanity cases for user and component flows | Yes |
| `run-e2e-tests` | Test cases → generate and execute reusable E2E tests, diagnose failures and report results | Yes |
| `run-manual-qa-tests` | Written cases or inline reproduction → exercise live system and record structured results and evidence | No |
| `manual-qa-report-to-html` | Manual QA Markdown → standalone HTML evidence report with proof links | No |
| `create-retro-report` | Period and optional scope → evidence-backed patterns and precise proposed process edits, with coverage metadata | Yes |
| `analyze-repo-context` | Repo root → repo-level instructions and machine-readable app metadata | Yes |
| `analyze-app-context` | App root → app-level instructions | Yes |
| `analyze-module-context` | Module path → module-level instructions | Yes |

The registry is [agentRegistry.js](../cli/src/lib/agents/agentRegistry.js); direct skill contents determine their full contracts. The CLI's file-based selection and its prompts do not necessarily expose every input mode described by the corresponding skill.

## Agent and shared instruction inventory

| Asset | Responsibility |
| --- | --- |
| `product-manager` | Product intent and requirements |
| `architect` | Technical design and system boundaries |
| `team-lead` | Planning and coordination |
| `developer` | Implementation and focused verification |
| `implement-feature` | Feature coordination and delivery |
| `qa-team-lead` | QA planning and coordination |
| `e2e-engineer` | Reusable end-to-end testing and diagnosis |
| `manual-qa-tester` | Live manual execution and evidence |
| `retro` | Evidence-based process analysis and recommendations |
| `summary` | Completion reporting fragment |
| `shared/command-hygiene` | Shared safe command execution practices |
| `shared/learning-journal` | Shared capture and evidence rules |

These are source profiles/fragments in [rnd/agents](../rnd/agents); they do not by themselves imply that separate processes or subagents always run. Testing and E2E guidance also exists in [rnd/instructions](../rnd/instructions).

## Artifacts and knowledge

| Artifact | Purpose / location under the selected spec root |
| --- | --- |
| Product specs, tech specs, build plans | Intent, design and implementation contract: `product_specs/`, `tech_specs/`, `build_plans/` |
| Test cases and E2E results | Expected scenarios and execution outcomes: `test_cases/`, `e2e-results/` |
| Manual QA result and evidence; optional HTML | Results and proof of live checks; paths follow the skill and template |
| Feature coordination artifacts | Phase/task coordination and gate evidence under `agent_runs/` |
| Learning runs and events | Structured evidence in `learning/runs/<run-id>/run.json` and `events/` |
| Retros | Period-scoped report with coverage, patterns and proposed edits under `retros/` |
| Legacy agent summaries | Retained historical evidence under `agent_summaries/` |
| Scoped context | `AGENTS.md` / `CLAUDE.md` at repository, app and module levels |

The nine templates are `product_spec.md`, `tech_spec.md`, `build_plan.md`, `test_cases.md`, `e2e-result.md`, `manual-qa-result.md`, `retro.md`, `learning-run.json` and `learning-event.json` ([source](../rnd/templates)). They encode handoff shapes, not merely formatting. Custom and nested spec roots are supported; `spec-dir-name` defaults to `r3nd`.

### Learning details

Capture starts lazily and records meaningful moments, not every command. Corrections and failed checks are recorded before the next attempt; recovery is linked rather than replacing history. Quotes, paraphrases, facts and hypotheses are distinguished; sensitive or unrelated material is omitted. Separate workers and resumed sessions get linked runs. Retros resolve a timezone-aware `[start, end)` period, select events by capture time, report gaps and incomplete coverage, and propose exact changes without applying them. Local evidence is not automatically uploaded or collected from other worktrees. These are agent-reported records, so capture can be incomplete. See [continuous learning](continuous-learning.md) and [validation](continuous-learning-validation.md).

## CLI inventory

The executable is defined by [CLI entry point](../cli/src/index.js), which discovers command modules. See [CLI README](../cli/README.md) and individual commands for detail.

| Command | Capability and key behavior |
| --- | --- |
| `init [-y] [--r3start]` | Initialize Git if necessary and install selected seed assets. Optional r3start bootstrap copies starter code without its Git history/remotes; existing files have overwrite handling. |
| `scaffold [-y]` | Discover/select ordered overlays, compose an effective seed and materialize canonical and vendor assets; supports scaffold plans and agent execution. |
| `update [-y]` | Refresh selected seed components from the configured seed, including generated skills, workflows and templates. Consumer evidence is intended to be preserved. |
| `generate-seed [-y] [--remote URL]` | Generate a new seed repository in the current directory, optionally configuring a remote. |
| `analyse [-a AGENT] [-n]` | Analyze repo and app scopes using an available agent and generate scoped context files. Individual analysis skills also support module scope. |
| `agents <task>` | Launch registered task skills with `--agent`, `--non-interactive`, `--spec-dir`, and `--file` or `--input` according to task. Selects inputs, builds prompts and invokes a backend or generates a prompt. Can infer a nested spec root from a file path. |
| `tools` | Detect and display locally available AI execution tools. |
| `config list/get/set/overlays` | Inspect/change YAML configuration and interactively select/reorder overlays. Changing the spec directory name also rewrites supported repository references. |
| `worktree [branch]`, `--branch`, `--list`, `--no-command`, `clean` | Create/open/list repo-scoped Git worktrees under `~/.r3nd/worktrees/`; copy spec directories, present vendor directories and configured files; invoke a configurable argv-style open command. Cleanup removes clean managed worktrees and keeps branches. |

Configuration in [r3nd.yaml.example](../r3nd.yaml.example): `seed-repo` (`owner/repo@branch`, default `leandronoijo/r3nd@develop`), `spec-dir-name` (default `r3nd`), ordered `overlays`, `worktree-copy-files` (default root/nested `.env` patterns), and `worktree-open-command` (default VS Code with `{worktreeDir}`). File-copy patterns may include secrets. The CLI supports interactive and selected non-interactive flows, but non-interactive flags do not imply every task/backend combination is unattended.

### Execution and distribution targets

- **CLI runners:** local Codex, Claude and Gemini; remote GitHub through `gh agent-task`; and prompt generation as a fallback. Tool detection filters interactive choices. Availability and authentication are separate concerns.
- **Generated skill targets:** GitHub, Cursor, Codex, Claude, Gemini and Antigravity, each with vendor-specific composition instructions; GitHub workflows are a separate asset family. See [platform registry](../cli/src/lib/platformAssetRegistry.js) and [vendor fragments](../rnd/vendor/skills).
- **Composition:** canonical skills, role/shared fragments and vendor instructions are assembled into target-specific skills; ordered overlay assets can replace earlier matching files. Seed customization and asset generation are part of the product, not just installation mechanics.
- **GitHub automation:** product-spec, tech-spec, build-plan and development-ready workflows create downstream Copilot work on relevant merges; the period retro workflow is manually dispatched and deduplicates scoped windows. These workflows use GitHub-specific permissions/configuration and see committed repository state. A separate Pages workflow deploys the project site. See [.github/workflows](../.github/workflows).

Vendor support for generated files is broader than the CLI's execution backends; do not treat these two lists as interchangeable. The README's vendor list and older CLI documentation are not exhaustive descriptions of the current registry.

## Overlay inventory

| Overlay | Contents and intent |
| --- | --- |
| `angular` | Frontend instructions and bootstrap/complete scaffold plans |
| `vue` | Frontend instructions and bootstrap/complete and additional frontend scaffold plan |
| `nestjs` | Backend and infrastructure instructions; backend scaffold plans |
| `fast-api` | Backend and infrastructure instructions; backend bootstrap/complete plans |
| `ruby-on-rails` | Backend and infrastructure instructions; backend bootstrap/complete plans |
| `mvp` | Replacement delivery/QA skills and templates plus shared policy for a minimal production-shaped slice: relevant security, data, compatibility, CI, runtime and operability baseline |
| `prototyping` | Replacement delivery/QA skills and templates plus shared policy for a demonstrable slice with minimal infrastructure and focused tests |

Both mindset overlays prioritize simple established tooling, mature packages for commodity capabilities, explicit boundaries, focused tests, user-selected QA at the owning boundary and a two-attempt limit on the same failing path. MVP allows focused integration/boundary tests for production risk; prototyping explicitly excludes integration tests and defers production machinery. Later selected overlays take precedence for colliding files, making order consequential. See [overlays](../overlays) and [configuration](../r3nd.yaml.example).

## V2 design questions exposed by this inventory

These are decisions to make, not recommendations already approved:

1. Which principles above are non-negotiable even if specs, agents, file formats or CLI commands change?
2. What is the smallest durable unit of work and what traceability must exist from intent to change to verification?
3. Where should a human approve, where can an agent decide, and how should user instructions override default gates?
4. Should workflow selection and rigor be explicit modes, adaptive to risk, or both? How are QA choices and completion evidence represented?
5. Which role boundaries require actual independent agents, and which are simply perspectives or responsibilities in one agent?
6. What is the canonical source of truth when installed vendor copies, team customizations, overlays and seed updates diverge? How are conflicts, versioning and migrations handled?
7. Which backends need execution adapters versus generated native skills? What portability is realistically testable?
8. How should evidence be captured, redacted, shared across worktrees and retained without excessive noise? What does incomplete coverage mean?
9. Which CLI capabilities remain first-class, become integrations, or disappear in a different v2 product? How are custom/nested roots and existing artifacts migrated?
10. How will v2 distinguish an instruction being present from a workflow actually being followed and verified?

## Sources and limits

Primary sources: [README](../README.md), [concepts](concepts.md), [workflows](workflows.md), [CLI README](../cli/README.md), [CLI commands](../cli/src/commands), [agent registry](../cli/src/lib/agents/agentRegistry.js), [platform assets](../cli/src/lib/platformAssetRegistry.js), [skills](../rnd/skills), [agents](../rnd/agents), [templates](../rnd/templates), [overlays](../overlays), [GitHub workflows](../.github/workflows), and [continuous learning](continuous-learning.md). This is a source inventory of the checked-out version; it does not validate every branch of every command or guarantee external vendor integrations remain current. Some README examples and legacy code may describe older behavior, so the registry and individual implementation/skill files are the authority for detailed follow-up.
