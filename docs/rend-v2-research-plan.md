# r3nd V2 research plan

Define the decisions needed to turn r3nd into a companion CLI and a composable delivery system accessed through one conversational developer. The research is organized into 12 tasks. Each produces a comparable report with at least three materially different approaches, current internet evidence, and a recommendation tested against this repository.

This is the research backlog, not the V2 architecture decision. Candidate approaches below are starting hypotheses; researchers may replace them with better alternatives. Keep each result simple: explain the problem, compare at least three options, give a recommendation, and link the supporting evidence. Use diagrams and concrete examples where they make the explanation clearer.

Baseline: repository commit `5d140ed`, the working-tree [V2 inventory](rend-v2-inventory.md), and [README](../README.md), reviewed on 2026-11-09. The inventory is currently an untracked working-tree file; its contents form part of this baseline.

## Direction already established

These are requirements from the V2 brief. Research should determine how to achieve them rather than reopen them as equally optional alternatives.

1. Separate the CLI repository from the seed/content repository, with clear ownership and distribution contracts.
2. Make the CLI a companion for initialization, worktrees, documentation creation and visualization, and useful deterministic operations. It does not launch or orchestrate agents.
3. Replace long Markdown delivery documents with machine-usable structured artifacts that the CLI can render as attractive HTML using predefined components.
4. Give users one conversational entry point that understands their intended outcome and carries the work through delivery without asking them to select internal workflows.
5. For production systems, completion means verified production delivery. Capture the project's route to production during initialization with minimal questioning and persist it in the repository.
6. Evaluate artifacts and code between phases, including static checks and appropriately calibrated LLM review.
7. Let users choose communication detail and the control they retain. Explore architect and developer/team-lead experiences.
8. Replace ordered overlay replacement with composition of capabilities from multiple plugins.
9. Keep `AGENTS.md` and `CLAUDE.md` concise, with discoverable, scoped supporting instructions.

Two boundaries need explicit treatment. Communication detail and action authority are different decisions: a high-level user may still require release approval. Also, replacing delivery-document Markdown does not automatically mean replacing vendor-required instruction files. The [Agent Skills specification](https://agentskills.io/specification) currently defines `SKILL.md` with Markdown content and optional supporting resources; research must account for that compatibility boundary.

## Research map

| ID | Research decision | User changes | Output under `docs/research/v2/` |
| --- | --- | --- | --- |
| R01 | Separate repositories and distribute versioned content | 1 | `R01-distribution.md` |
| R02 | Define the companion CLI boundary and command contracts | 2 | `R02-companion-cli.md` |
| R03 | Choose the structured artifact model and authoring format | 3 | `R03-artifacts.md` |
| R04 | Render artifacts as useful component-based HTML | 3, 7 | `R04-document-experience.md` |
| R05 | Design one entry point for understanding and delivering requests | 4 | `R05-entry-point.md` |
| R06 | Capture and follow the route to production | 5 | `R06-production-contract.md` |
| R07 | Design phase evaluations and measure their reliability | 6 | `R07-evaluations.md` |
| R08 | Separate communication preferences from approval controls | 7 | `R08-user-controls.md` |
| R09 | Compose plugins without file replacement | 8 | `R09-composition.md` |
| R10 | Build concise, portable instruction entry points | 9 | `R10-context.md` |
| R11 | Persist task state, evidence, and resumable handoffs | 2, 4, 5, 6 | `R11-state-and-evidence.md` |
| R12 | Migrate existing projects and validate the integrated design | All | `R12-migration.md` |

R03 and R04 are separate because a good data format does not establish a good reading experience. R11 and R12 cover the cross-cutting work needed to make the nine changes function together.

## Common research contract

Every task produces a concise report covering the problem, alternatives, recommendation, evidence, and open questions. Supporting examples, measurements, or prototypes belong in `docs/research/v2/experiments/<ID>/` and are linked from the report. These are future output locations; this planning step does not claim the research is complete.

Each report must:

- Inspect the relevant current implementation and link exact repository locations. Distinguish observed behavior from intended behavior in instructions.
- Compare at least three viable, substantially different approaches to the same decision. Three libraries implementing the same architecture do not count. Include the existing approach as a baseline where useful, but do not count it toward the three if it violates a stated V2 requirement.
- Research the web when executing the task, rather than relying only on this plan's starter links. Record access dates, publication/update dates when available, and exact versions for evaluated tools. Prefer recent operational experience while retaining older standards that remain applicable.
- Use at least five relevant sources across at least three independent publishers or projects. Support each approach with primary documentation, implementation evidence, or original research. Include at least one first-hand deployment report, maintainer discussion, incident, or reproducible implementation example that reveals practical limitations. Mark gaps instead of inventing experience or treating marketing claims as demonstrated outcomes.
- Separate source findings, local measurements, and r3nd-specific inferences. Cite claims next to the claims. Record contrary evidence and the limits of transfer from another product to r3nd.
- Explain the mechanism, a concrete r3nd example, benefits, costs, failure modes, migration impact, and the conditions under which each option wins or loses.
- Apply requirement pass/fail checks before scoring tradeoffs. Compare reliability, user effort, interoperability, Git reviewability, implementation/maintenance cost, runtime/token cost, and reversibility. Justify any task-specific criteria and weights; unmeasured results stay unknown.
- Run a small discriminating experiment for the leading approaches, or label the recommendation provisional and specify the experiment that would resolve it. Record model/tool versions, inputs, repetitions, and measured results. Use the same conditions across alternatives where possible.
- Recommend an approach, state confidence and unresolved questions, and identify evidence that would change the recommendation. A hybrid must explain its extra complexity and failure modes.
- Define the contract passed to dependent tasks: identifiers, fields, interfaces, lifecycle semantics, or UX rules. List assumptions about other reports so they can be reconciled.

Use Markdown for these research reports to fit the repository's existing review process while R03 is unresolved. This is a temporary research format, not the proposed V2 delivery-document format.

## Shared scenarios

Use the applicable scenarios below across reports so results can be compared and combined. These are proposed research fixtures, not claims about existing product behavior.

| Scenario | What it must expose |
| --- | --- |
| S1 Small bug in an existing production service | Minimal questioning, proportionate planning/evals, release evidence, no premature completion after tests pass |
| S2 Ambiguous feature spanning frontend, API, and data | Intent clarification, component/entity views, dependencies, design review, migration and rollout decisions |
| S3 New repository with no deployment process | Initialization that records unknowns, offers concise choices, and distinguishes a production blocker from a completed task |
| S4 Established service with CI and protected releases | Discover existing conventions, confirm inferred release rules, respect approvals, verify post-release health |
| S5 Two concurrent worktrees and a resumed session in another vendor tool | Durable state, isolation, evidence provenance, conflicting changes, correct next action after interruption |
| S6 Mixed plugins with incompatible guidance | Compose frontend, backend, testing, and delivery policies; expose contradictions instead of silently overwriting rules |
| S7 Locally customized V1 project with nested spec roots | Preserve custom content, historical evidence, vendor assets, and links through update/migration and rollback |
| S8 A plausible but incorrect artifact or stale passing check | Catch missing requirements, contradictory design, invalid schema, prompt injection in evaluated content, and evidence tied to an older revision |

## R01 Separate repositories and distribute content

**Decision:** How should an independently released CLI discover, install, customize, pin, and update content from separate repositories?

**Current anchors:** [root package](../package.json), [CLI package](../cli/package.json), [configuration](../cli/src/lib/config/configManager.js), [seed copier](../cli/src/lib/fs/seedCopier.js), [update service](../cli/src/lib/updateService.js), and [seed generation](../cli/src/lib/generateSeedService.js). Both package manifests currently name the CLI `r3nd`; the default seed points back to this repository.

**Compare at least:**

1. A standalone CLI repository and a forkable content repository distributed as pinned Git snapshots.
2. A standalone CLI repository and content repositories published as versioned packages with explicit compatibility manifests and lockfiles.
3. A standalone CLI repository and an upstream content repository connected to projects through Git subtree/submodule workflows, comparing their customization and update costs.

**Investigate:** Ownership of schemas, renderer components, eval definitions, vendor adapters, and plugins; separate release cadences; private/local/offline sources; immutable versions; integrity; local edits versus upstream changes; compatibility failures; and the minimum understandable installation story. Repository separation is fixed; transport and customization are open.

**Experiment and exit:** Install and update a customized sample seed, including a nested spec root and an incompatible version. Demonstrate conflict reporting and rollback without losing local artifacts. Deliver repository boundaries, a release compatibility matrix, and an illustrative install/update contract. Use S7.

**Dependencies:** Begin immediately; reconcile the package boundary with R09 and R10 before finalizing. **Starting evidence:** [npm lockfile contract](https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json/) and [Agent Skills packaging structure](https://agentskills.io/specification).

## R02 Define the companion CLI

**Decision:** Which operations belong in the CLI, and how do humans and coding agents use the same deterministic services without the CLI becoming an agent runner?

**Current anchors:** [commands](../cli/src/commands), [agent runner](../cli/src/lib/llm/agentRunner.js), [analysis](../cli/src/lib/analyse.js), [scaffolding](../cli/src/lib/scaffoldService.js), [worktree service](../cli/src/lib/worktreeService.js), and [GitHub workflows](../.github/workflows). Execution is embedded in analysis and scaffolding as well as the explicit `agents` command.

**Compare at least:**

1. A small command suite with file contracts that agents use through their normal shell and file tools.
2. A shared deterministic library exposed through both CLI commands and an optional tool-protocol adapter.
3. Declarative operation manifests that the CLI validates, previews, and applies, with the coding agent owning planning and execution sequencing.

**Investigate:** Initialization, artifact creation/validation/rendering, worktrees, status, updates, diagnostics, exit codes, machine-readable output, idempotency, dry runs, and interrupted operations. Identify who authors semantic document content and who runs LLM judges. Map every existing command to retain, redesign, replace with skill guidance, or remove. Decide whether current GitHub agent-launching workflows remain optional external integrations or leave the shipped product.

**Experiment and exit:** Walk through init → worktree → artifact validation → HTML preview → delivery-status inspection using proposed interfaces. Demonstrate that no operation launches an LLM or manages agent lifecycles. Deliver a command matrix and the explicit actor boundary between CLI, coding environment, and deployment/CI systems. Use S1 and S5.

**Dependencies:** Draft first as a boundary contract; finalize after R01, R03, R04, R06, R07, R09, and R11. **Starting evidence:** [CLI Guidelines](https://clig.dev/) and [Git worktree reference](https://git-scm.com/docs/git-worktree).

## R03 Choose the artifact model and format

**Decision:** What canonical representation makes intent, design, plans, evaluations, and production evidence easy for agents to query and modify while preserving useful prose and Git diffs?

**Current anchors:** [templates](../rnd/templates), [feature coordinator](../rnd/skills/implement-feature/SKILL.md), and [learning records](../rnd/agents/shared/learning-journal.md). V1 already mixes Markdown documents with JSON coordination and learning artifacts.

**Compare at least:**

1. Typed domain records with explicit fields and links, serialized as JSON or restricted YAML and checked with schemas. JSON versus YAML is a subdecision, not two independent approaches.
2. A typed document tree of predefined blocks, such as entities, decisions, requirements, diagrams, and evidence, with schema-validated properties.
3. A graph of identified entities and relationships, such as JSON-LD records, with document views derived from that graph.

**Investigate:** Required semantics; stable IDs and cross-artifact links; schema evolution; partial edits; unknowns and uncertainty; extensibility; rich text and code; references to large evidence files; token overhead; merge conflicts; and round-trip authoring. Measure whether structure actually improves retrieval, editing, and validation. Keep the current Markdown and a constrained markup format as controls, not automatic substitutes for the requested change.

**Experiment and exit:** Represent the same feature, plan, gate result, and delivery contract in each approach. Ask the same agent to retrieve a requirement, change one acceptance criterion, identify a contradiction, and preserve unrelated content. Record correctness, edit size, tokens, validation failures, and information loss. Deliver sample artifacts, schemas or equivalent constraints, and a migration mapping. Use S2 and S8.

**Dependencies:** Begin immediately; accept field requirements from R06, R07, and R11 before finalization. **Starting evidence:** [JSON Schema modular structure](https://json-schema.org/understanding-json-schema/structuring), [JSON-LD specification](https://www.w3.org/TR/json-ld11/), and [Markdoc's declarative document model](https://markdoc.dev/docs/overview).

## R04 Design the HTML document experience

**Decision:** How should the CLI turn structured artifacts into readable, attractive documents with reusable visual components and reliable links to underlying evidence?

**Current anchors:** [manual QA HTML skill](../rnd/skills/manual-qa-report-to-html/SKILL.md), [manual QA template](../rnd/templates/manual-qa-result.md), and [site](../site). The QA conversion is an existing workflow to inspect, not proof of a general deterministic renderer.

**Compare at least:**

1. Standalone HTML documents generated with a fixed component library and bundled assets.
2. A generated documentation site with cross-document navigation, search, backlinks, and aggregate views.
3. A local interactive viewer that reads artifacts and renders task, architecture, and evidence views on demand, with explicit static export behavior.

**Investigate:** Components for system boundaries, entities, decisions, dependencies, rollout stages, eval results, and evidence; architect versus implementation views; accessibility; offline use; portable exports; long documents; source navigation; freshness indicators; safe rendering of repository content; and renderer/component versioning. Establish the default viewing experience before selecting a frontend framework.

**Experiment and exit:** Render the same representative artifact using each approach. Compare how quickly a reader can find the decision, affected components, failed gate, and production status. Inspect narrow screens, keyboard use, missing evidence, and stale output. Deliver a small component catalog, view examples, and a render/export contract. Use S2 and S8.

**Dependencies:** Prototype with provisional R03 examples and R08 view requirements; finalize after both. **Starting evidence:** [Markdoc rendering model](https://markdoc.dev/docs/overview) and [progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/).

## R05 Design one conversational entry point

**Decision:** How does the developer the user talks to establish intent, select the appropriate internal process, and retain responsibility through production delivery?

**Current anchors:** [workflow guide](workflows.md), [quick feature](../rnd/skills/quick-feature/SKILL.md), [bugfix](../rnd/skills/bugfix/SKILL.md), [feature skill](../rnd/skills/implement-feature/SKILL.md), and [coordinator role](../rnd/agents/implement-feature.md).

**Compare at least:**

1. One coordinator skill with an explicit phase/state model and referenced phase playbooks.
2. A thin intake/router skill that hands off to specialized internal workflows while preserving one user-facing conversation and ownership contract.
3. A goal-driven coordinator that chooses capabilities adaptively against explicit completion conditions and evaluation gates.

**Investigate:** Intent discovery; targeted clarification; inferred versus confirmed acceptance criteria; task sizing; bug/feature/research routing; scope changes; stopping conditions; blockers; resumption; delegation availability; and vendor limitations. Distinguish separate responsibilities from mandatory separate agents. The coding environment hosts this behavior; the CLI must not become its scheduler.

**Experiment and exit:** Replay the same small bug, ambiguous feature, and interrupted delivery through each approach. Measure intent omissions, unnecessary questions, wrong routing, invalid phase transitions, and completion claims without evidence. Deliver conversation examples and a routing/lifecycle contract with explicit recovery paths. Use S1, S2, S3, and S5.

**Dependencies:** Begin discovery now; finalize with R06, R07, R08, R10, and R11. **Starting evidence:** [Agent Skills](https://agentskills.io/specification) and [workflow and agent patterns](https://www.anthropic.com/research/building-effective-agents). The latter is older conceptual guidance; verify current platform mechanics separately.

## R06 Capture the route to production

**Decision:** How can initialization learn and persist enough about delivery to let the entry-point skill finish production work without imposing a long questionnaire?

**Current anchors:** [init service](../cli/src/lib/initService.js), [build-plan template](../rnd/templates/build_plan.md), [MVP policy](../overlays/mvp/agents/shared/mvp.md), and [development workflow](../.github/workflows/05-development-ready.yml). The feature skill's successful final live-QA gate does not by itself establish production deployment.

**Compare at least:**

1. Detect CI/deployment conventions, show an inferred delivery contract, and ask the user to confirm or correct only uncertain fields.
2. Offer a few delivery archetypes, then ask a short set of conditional questions to specialize the chosen route.
3. Import an existing pipeline/runbook as the initial contract and progressively resolve missing information during the first delivery, while persisting unknowns during init.

**Investigate:** Release trigger, environments, approvers, required checks, credentials as references, migrations, feature flags, rollout, rollback, post-deploy observation, multiple services, external release teams, and drift from the real pipeline. Model ready, awaiting approval, deployed, verified, failed, and blocked outcomes. A production goal is not blanket deployment authorization; apply the user's persisted control policy and actual environment permissions.

**Experiment and exit:** Produce concise onboarding transcripts for a mature service and a new repo, plus the resulting persisted contract. Compare question count, completion time, missed release conditions, and incorrectly inferred permissions. Include blocked credentials, external approvals, and failed health checks. Deliver a contract proposal and evidence required to declare production completion. Use S1, S3, and S4.

**Dependencies:** Start immediately; finalize the format with R03, authority with R08, and evidence with R11. **Starting evidence:** [Backstage template parameters](https://backstage.io/docs/features/software-templates/writing-templates/) and [GitHub deployment gates](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments).

## R07 Design evaluations between phases

**Decision:** Which combination of deterministic checks, LLM review, and human calibration catches consequential mistakes at acceptable cost before they propagate?

**Current anchors:** [feature gates](../rnd/skills/implement-feature/SKILL.md), [test-case generation](../rnd/skills/create-test-cases/SKILL.md), [test guidance](../rnd/instructions/testing.instructions.md), [learning validation](continuous-learning-validation.md), and [learning events](../rnd/templates/learning-event.json). Existing gates are a starting point, not evidence that semantic review is reliable.

**Compare at least:**

1. Fixed phase gates: deterministic schema/static/tests first, then a narrowly scoped rubric-based LLM judge for semantic requirements.
2. Independent reviewer or adversarial review loops, with explicit disagreement handling and bounded repair attempts.
3. Risk-adaptive gates that select checks and review depth from change impact, with fixed minimum requirements and human-calibrated thresholds.

**Investigate:** Intent coverage; spec contradictions; design feasibility; plan completeness; code correctness; production readiness; evidence freshness; judge bias and correlated errors; false acceptance/rejection; prompt injection in evaluated content; abstention; reproducibility; cost; and repair limits. Separate per-project delivery gates from regression evals of r3nd skills/plugins themselves. Static correctness and LLM judgments provide different evidence; neither replaces real outcome checks.

**Experiment and exit:** Build a small labeled corpus of good and deliberately flawed specs, plans, code changes, and delivery claims. Include valid-but-wrong artifacts and stale evidence. Repeat judge runs and compare detection, false positives, disagreement, time, and cost against labels reviewed independently of the generator. Report sample-size limitations. Deliver gate rubrics, result shape, versioning, retry/escalation rules, and a regression-suite proposal. Use S8 plus failures drawn from S1–S6.

**Execution boundary:** Deterministic validators may run through the CLI. LLM grading runs in the user's coding environment or separately configured CI/eval tooling; the CLI can validate and display results without launching judges.

**Dependencies:** Start corpus and criteria immediately; finalize with R03, R05, R06, and R11. **Starting evidence:** [Anthropic's agent evaluation experience](https://www.anthropic.com/research/demystifying-evals-for-ai-agents), which discusses multiple grader types and calibration against human judgment. Seek independent implementation evidence as required by the common contract.

## R08 Define communication and control preferences

**Decision:** How can the user choose the detail they see and the decisions they retain without learning a workflow configuration system?

**Current anchors:** [README workflow modes](../README.md), [architect role](../rnd/agents/architect.md), [team-lead role](../rnd/agents/team-lead.md), and [quick-feature approval](../rnd/skills/quick-feature/SKILL.md). Internal role names are not automatically suitable user personas.

**Compare at least:**

1. Architect and developer/team-lead presets, each with a separately visible approval policy and local overrides.
2. Two independent settings: communication detail and delegated authority, with concise defaults and examples.
3. Progressive preferences: start with a minimal setup, offer contextual detail/control choices, and persist only confirmed preferences.

**Investigate:** Components/entities/abstraction layers versus libraries/patterns/interfaces; what must always remain visible; decision notifications; approval scope; preference changes mid-task; per-project versus per-task settings; and explicit user instructions. Do not infer weaker testing, silent releases, or higher authority from a preference for brief communication.

**Experiment and exit:** Present the same design choice, failing eval, and release decision in each experience. Test whether readers understand the choice and what is authorized. Include an architect who wants release approval and a developer who delegates routine implementation. Deliver example conversations, a preference contract, and an action/approval table. Use S2 and S4.

**Dependencies:** Begin immediately; align with R05 and R06 before finalization; supply view requirements to R04. **Starting evidence:** [progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/) and [CLI interaction guidance](https://clig.dev/).

## R09 Replace overlays with composition

**Decision:** What is the unit of reusable capability, and how are compatible pieces selected and combined across plugins without silent replacement?

**Current anchors:** [overlay implementation](../cli/src/lib/overlays/overlaySeedService.js), [fragment resolver](../cli/src/lib/templateResolver.js), [mindset tests](../cli/src/lib/overlays/mindsetOverlays.spec.js), and [overlays](../overlays). V1 already composes referenced fragments, but overlay collisions use later-file precedence; V2 must address both behaviors.

**Compare at least:**

1. A catalog of small capabilities referenced by explicit playbooks and tables of contents, with declared inputs, outputs, and applicability.
2. Typed extension slots for phases, artifact sections, evals, and render components, with explicit compatibility and cardinality rules.
3. A capability dependency graph with `provides`, `requires`, and conflict constraints that resolves a reproducible project composition.

**Investigate:** Namespaces; versioning; multiple providers; conflicting policies; ordered procedures versus unordered constraints; missing dependencies; cycles; local customization; rationale/provenance; vendor adapters; and plugin removal. Include a frontend plugin, a backend plugin, and selected practices from different delivery-policy plugins. Composition must make contradictory production and prototyping requirements visible.

**Experiment and exit:** Compose a mixed stack and cross-plugin QA policy, then introduce duplicate capabilities, contradictory requirements, and a missing dependency. Compare determinism, error clarity, authoring effort, and how much unrelated content must load. Deliver a plugin manifest proposal and composition rules. Use S6 and S7.

**Dependencies:** Begin immediately; settle distribution with R01 and context loading with R10; align artifact extensions with R03. **Starting evidence:** [Agent Skills resource structure](https://agentskills.io/specification), [Backstage action/template composition](https://backstage.io/docs/features/software-templates/writing-templates/), and [modular schema references](https://json-schema.org/understanding-json-schema/structuring).

## R10 Keep instruction entry points small

**Decision:** How can short `AGENTS.md` and `CLAUDE.md` files reliably lead agents to the right instructions at the right time across supported tools?

**Current anchors:** [repo analysis skill](../rnd/skills/analyze-repo-context/SKILL.md), [app analysis](../rnd/skills/analyze-app-context/SKILL.md), [module analysis](../rnd/skills/analyze-module-context/SKILL.md), [platform registry](../cli/src/lib/platformAssetRegistry.js), [vendor fragments](../rnd/vendor/skills), and [template resolver](../cli/src/lib/templateResolver.js). The current resolver expands includes into content; a file split alone may not reduce loaded context.

**Compare at least:**

1. A minimal root index and path/phase-specific playbooks that agents explicitly retrieve as needed.
2. Native scoped rules/imports for each coding tool, generated from a shared canonical instruction catalog.
3. A minimal bootstrap plus a deterministic task-to-context lookup command that returns the relevant instruction bundle and provenance.

**Investigate:** Mandatory always-loaded rules; discovery cues; scope and precedence; context budgets; nested repos/apps; stale links; conflicting rules; vendor portability; and fallback when native routing is unavailable. Verify current supported-tool behavior instead of assuming all tools understand links, imports, or skill discovery the same way. Define what is lost in each fallback.

**Experiment and exit:** Run matched tasks in at least two supported coding environments if available. Measure relevant-instruction retrieval and adherence, irrelevant context loaded, missed constraints, and update drift. Distinguish measured support from documentation-only claims. Deliver example entry files, a supporting tree, size budgets justified by tests, and a vendor capability matrix. Use S2, S5, and S6.

**Dependencies:** Begin vendor reconnaissance immediately; finalize with R05 and R09. **Starting evidence:** [Agent Skills progressive disclosure](https://agentskills.io/specification) and [Claude Code memory and rules](https://code.claude.com/docs/en/memory). Extend to current official documentation for the other tools listed in the local registry.

## R11 Persist state and trustworthy evidence

**Decision:** What durable state lets the entry-point skill resume, explain progress, and verify completion across sessions, worktrees, and tools without a CLI-owned agent runtime?

**Current anchors:** [feature run artifacts](../rnd/skills/implement-feature/SKILL.md), [learning run](../rnd/templates/learning-run.json), [learning event](../rnd/templates/learning-event.json), [learning guidance](continuous-learning.md), and [worktree service](../cli/src/lib/worktreeService.js).

**Compare at least:**

1. Versioned task snapshots with linked immutable evidence and explicit transition checks.
2. Append-only task events with reproducible derived status and document views.
3. Artifact-derived state where completion is computed from versioned artifacts, dependency links, and gate evidence, with a small resumable cursor.

**Investigate:** Task/phase IDs; requirement-to-change-to-evidence traceability; writer identity; artifact/code revisions; agent claims versus tool observations; approvals; freshness; incomplete capture; concurrent writes; worktree merges; recovery; retention; and local sensitive data. Keep the operational task state distinct from the retrospective learning journal while allowing links between them.

**Experiment and exit:** Interrupt a task, change the code after a passing gate, resume from another tool, and merge conflicting worktree progress. Check that obsolete passes and duplicate completion events cannot silently establish success. Deliver a state/evidence contract, transition examples, and explicit persistence guarantees and limitations. Use S5 and S8.

**Dependencies:** Prototype immediately; finalize using R03 artifacts, R05 lifecycle, R06 production states, and R07 gate semantics. **Starting evidence:** [OpenTelemetry trace relationships](https://opentelemetry.io/docs/specs/otel/trace/api/), [append-only log pattern](https://martinfowler.com/articles/patterns-of-distributed-systems/write-ahead-log.html), and [Git worktree semantics](https://git-scm.com/docs/git-worktree). These are design precedents, not proof that r3nd needs a telemetry backend or distributed log.

## R12 Migrate projects and validate the whole system

**Decision:** How can existing users adopt the chosen V2 contracts without losing customized workflows, artifacts, evidence, or the ability to recover?

**Current anchors:** [update service](../cli/src/lib/updateService.js), [spec-root rewriting](../cli/src/lib/utils/specDirRewrite.js), [platform registry](../cli/src/lib/platformAssetRegistry.js), [configuration example](../r3nd.yaml.example), and [V2 inventory](rend-v2-inventory.md).

**Compare at least:**

1. A deliberate project cutover with backup, conversion, verification, and whole-project rollback.
2. Side-by-side V1/V2 operation with read adapters, one canonical writer per artifact, and staged migration by capability.
3. A clean V2 installation with selective legacy import and read-only preservation of historical V1 material.

**Investigate:** Customized seeds; overlay-to-plugin mapping; nested roots; generated vendor copies; renamed/removed commands; old workflow automation; unsupported artifact content; schema and renderer compatibility; evidence integrity; and retirement of compatibility code. Separate mechanical conversion from semantic reinterpretation that needs review.

**Experiment and exit:** Dry-run each strategy on a customized fixture and compare losses, manual work, rollback quality, and mixed-version failure behavior. Then exercise one proposed V2 slice from install through intent, artifact, eval, HTML, and simulated production verification in a sandbox. Prove that a failed gate blocks success and that the CLI does not launch agents. Deliver a migration matrix, rollback plan, release acceptance criteria, and the remaining incompatibilities between research recommendations. Use S1, S4, S7, and S8.

**Dependencies:** Inventory migration hazards now; finalize after R01–R11. **Starting evidence:** [npm reproducible dependency state](https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json/), [schema identity and references](https://json-schema.org/understanding-json-schema/structuring), and [Git worktree operations](https://git-scm.com/docs/git-worktree). Supplement these with first-hand migration experience from comparable tools.

## Sequence and decision gates

Research can overlap; recommendations cannot silently assume incompatible answers. The dependencies above are inputs required for finalization, not instructions to wait before beginning any investigation.

1. **Establish boundaries and success measures.** Start R01 and R02, plus R06, R07, and R08. Record a provisional CLI boundary, the meaning of production completion, independent communication/authority settings, and baseline evaluation cases. This prevents later choices from optimizing only for format or visual polish.
2. **Explore representations and composition.** Investigate R03, R09, R10, and R11 using those provisional contracts. Bring field requirements and failure cases back to the first group. Compare options before selecting formats or plugin machinery.
3. **Test the integrated user experience.** Complete R04 and R05 prototypes using the leading artifact, control, context, and evidence approaches. Measure the same scenarios across alternatives. Finalize mutually dependent reports together where necessary.
4. **Validate adoption and synthesize.** Complete R12, reconcile interfaces, and write the architecture proposal. Keep unresolved assumptions explicit; do not treat twelve independently preferred options as automatically compatible.

At each gate, review whether the evidence supports advancing or whether a focused experiment is still needed. A report passes when its three alternatives are credible, its claims are sourced, its recommendation respects the V2 direction, and its dependent contracts are clear. R07 should inform the research review rubric itself; an LLM can check coverage and contradictions, but it cannot turn unmeasured claims into facts.

The synthesis should produce `docs/rend-v2-architecture-proposal.md` with the chosen contracts, rejected alternatives, explicit unresolved decisions, a coherent end-to-end example, and a phased implementation backlog. That proposal follows this research; implementation is outside this first planning task.
