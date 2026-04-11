# AI-Driven R&D Pipeline – Seed Repository
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE.md)

This repository is a `starter template` for teams who want to automate their product → architecture → planning → development lifecycle using **AI Agents** (GitHub Copilot, OpenAI Codex, Google Gemini, or any AI assistant).

It provides:

- A fully structured, opinionated directory layout  
- Seven AI personas (Product Manager, Architect, Team Lead, Developer, QA Team Lead, E2E Engineer, Retro)  
- A CLI that runs agents with **multiple AI backends** (Codex CLI, Claude Code, Gemini CLI, GitHub CLI, or prompt generation)
- **VS Code, Cursor, Codex, and Claude integrations** (chat modes and generated skills)
- A chained workflow pipeline producing product specs → tech specs → build plans → test cases → code → E2E → retro  
- Human-controlled PR gates at every stage  
- Stack overlays for common frameworks (FastAPI, NestJS, Rails, Angular, Vue)
- Strict separation between R&D artifacts, documentation, and actual application code  

This repo serves as a `seed`: clone it, customize it, and apply your own technology stack through the `rnd/instructions` files.

---

## 🚀 What This Repo Provides

### 1. Agnostic AI Agent Support

The r3nd CLI supports **multiple AI backends** — use whatever works best for you:

| Agent | Command | Description |
|-------|---------|-------------|
| **Codex CLI** | `codex` | OpenAI's local coding agent |
| **Claude Code** | `claude` | Anthropic's local coding agent |
| **Gemini CLI** | `gemini` | Google's Gemini AI agent |
| **GitHub CLI** | `gh` | GitHub Copilot via GitHub CLI |
| **VS Code** | `integrated` | Built-in chat modes and agent workflows |
| **Cursor** | `integrated` | Native AI assistant with persona support |
| **Generate** | `generate` | Generate prompts to copy/paste into any AI |

The CLI automatically detects which tools are installed and shows only available options.

r3nd includes ready-to-run generated skill outputs:
- Cursor skills in `.cursor/skills/<task>/SKILL.md`
- Claude skills in `.claude/skills/<task>/SKILL.md`
- Codex skills in `.codex/skills/<task>/SKILL.md`
- VS Code chat modes in `.github/chatmodes/`

### 2. Out-of-the-box personas
Shared persona fragments live in `rnd/agents/` and are composed into task skills:

- `product-manager.agent.md` / `product-manager.md`
- `architect.agent.md` / `architect.md`
- `team-lead.agent.md` / `team-lead.md`
- `developer.agent.md` / `developer.md`
- `qa-team-lead.agent.md` / `qa-team-lead.md`
- `e2e-engineer.agent.md` / `e2e-engineer.md`
- `retro.agent.md` / `retro.md`

Each persona has a strict role and writes only to their designated output paths.

### 3. End-to-end multi-stage workflow

**Tech-agnostic pipeline** that works with any AI backend (CLI tools, VS Code, Cursor, Claude, Codex skills, or manual prompt usage):

1. 02-product-spec-ready → Creates tech spec issue after product specs change  
2. 03-tech-spec-ready → Creates build plan issue after tech specs change  
3. 04-build-plan-ready → Creates development + test-cases issues after build plans change  
4. 05-development-ready → Creates E2E testing issue after code changes  
5. 06-retro-ready → Creates retro issue after PR approval  

**Automation options:**
- **GitHub Workflows** (`.github/workflows/`): Fully automated pipeline with PR triggers
- **CLI agents** (`r3nd agents`): Manual execution with any AI backend
- **Manual process**: Copy personas and templates to any AI assistant

Each stage opens a PR.  
A human must approve before the next stage runs.

### 4. Clear R&D artifact structure
By default, located under `rnd/` (configurable via `r3nd.yaml`):

- `product_specs/`
- `tech_specs/`
- `build_plans/`
- `test_cases/`
- `e2e-results/`
- `retros/`
- `agent_summaries/`
- `templates/`
- `skills/`

This ensures complete traceability from idea → architecture → plan → code.

**Multi-Directory Support:** The CLI supports multiple spec directories anywhere in your repository tree. Perfect for monorepos or multi-service architectures:

```
project/
├── rnd/                     # Root-level specs (shared/platform)
│   ├── product_specs/
│   └── build_plans/
├── apps/
│   ├── backend/
│   │   └── rnd/            # Backend-specific specs
│   └── frontend/
│       └── rnd/            # Frontend-specific specs
└── services/
    └── auth/
        └── rnd/            # Service-specific specs
```

### 5. Repo-wide & path-specific instruction files

Primary, agnostic instructions live under the `rnd/` directory so they apply regardless of which AI tooling you use:

- `rnd/instructions/*.instructions.md` — project- and path-specific rules (preferred location)
- `rnd/templates/` contains canonical document templates
- `rnd/skills/` contains local task skills used by CLI agent runs
- In the seed repo itself, `rnd/vendor/skills/` and `rnd/agents/` remain internal composition sources and are not copied into downstream repos

Use `.github/` only for Copilot-specific overrides:

- `.github/copilot-instructions.md` — optional, include only if you enable GitHub Copilot and need Copilot-specific behavior
- `rnd/instructions/*.instructions.md` — for path-specific Copilot overrides when required

This is where you define stack-specific rules (Node.js, Python, Go, AWS, React, etc.) without modifying persona profiles. Keep agnostic rules in `rnd/` and add `.github/` files only when you require Copilot-specific customizations.

### 6. VS Code Chat Modes
Located in `.github/chatmodes/`:

Pre-configured chat modes for VS Code/Copilot Chat that activate each persona:
- `product-manager.chatmode.md`
- `architect.chatmode.md`
- `team-lead.chatmode.md`
- `developer.chatmode.md`
- `qa-team-lead.chatmode.md`
- `e2e-engineer.chatmode.md`
- `retro.chatmode.md`

---

## 📦 How the Pipeline Works

GitHub Issue  
→ Product Spec (Product Manager)  
→ PR #1 (human review)  
→ Tech Spec (Architect)  
→ PR #2 (human review)  
→ Build Plan (Team Lead)  
→ PR #3 (human review)  
→ Development + Test Cases (Developer + QA Team Lead)  
→ PR #4 (human review)  
→ E2E Tests (E2E Engineer)  
→ PR #5 (human review)  
→ Retro (Retro)  
→ Retro complete

Every stage consumes the previous artifact and produces the next.  
No stage runs automatically without human approval.

---

## 🧰 CLI Commands

The r3nd CLI (located in `cli/`) provides commands for scaffolding, agent execution, and project management.

### Installation

```bash
# Install globally from GitHub
sudo npm install -g git+https://github.com/leandronoijo/r3nd.git#0.2

# Or run locally
cd cli && npm install
node src/index.js <command>
```

### Core Commands

| Command | Description |
|---------|-------------|
| `init` | Initialize current directory with minimal r3nd seed files |
| `scaffold` | Full interactive scaffolding with backend/frontend overlays (for new projects starting from zero — do not use on repos with existing application code) |
| `update` | Update r3nd components from the seed repository |
| `analyse` | Generate instruction files from existing codebase using AI |
| `bugfix` | Create and execute a bugfix plan using agents |
| `agents` | Run AI agents for specs, plans, and development |
| `tools` | Show available and missing AI agent tools |
| `config` | Manage r3nd.yaml configuration |

### Agent Subcommands (`r3nd agents <subcommand>`)

| Subcommand | Description |
|------------|-------------|
| `create-product-spec` | Generate a product spec from a feature description |
| `create-tech-spec` | Generate a tech spec from a product spec |
| `create-build-plan` | Generate a build plan from a tech spec |
| `implement-build-plan` | Implement a build plan to completion |
| `implement-feature` | Run coordinated feature implementation with teammate agents |
| `create-test-cases` | Generate E2E test cases from a build plan |
| `run-e2e-tests` | Execute E2E tests and generate result reports |
| `create-retro-report` | Review PR discussions and create a retro report |

### Agent Options

```bash
# Select AI backend
--agent <type>     # codex | claude | gemini | github | generate

# Non-interactive mode
--non-interactive

# Specify input file (file-based agents)
--file <path>

# Specify feature description (free-text agents)
--input <text>

# Target specific spec directory (monorepo support)
--spec-dir <path>
```

### Usage Examples

```bash
# Initialize a new project
r3nd init

# Full scaffolding with overlays
r3nd scaffold

# Run the product spec agent
r3nd agents create-product-spec --input "User authentication system" --agent github

# Generate tech spec from product spec
r3nd agents create-tech-spec --file rnd/product_specs/auth.md --agent codex

# Implement a build plan
r3nd agents implement-build-plan --file rnd/build_plans/auth.md --agent gemini

# Implement a feature with coordinator + teammates
r3nd agents implement-feature --file rnd/tech_specs/auth.md --agent codex

# Analyse existing codebase
r3nd analyse --agent codex --non-interactive

# Analyse specific directory
r3nd analyse --dir apps/backend --agent github

# Check which AI tools are installed
r3nd tools

# Update components
r3nd update --yes

# Create a repo-scoped worktree and open it
r3nd worktree

# Create a worktree on a specific branch
r3nd worktree --branch auth-investigation

# New worktrees also copy .claude, .codex, .github, and .cursor when present

# Delete clean r3nd-managed worktrees
r3nd worktree clean
```

### Configuration

The r3nd CLI uses `r3nd.yaml` for configuration:

```bash
# List all configuration values
r3nd config list

# Get/set the seed repository
r3nd config get seed-repo
r3nd config set seed-repo myorganization/custom-r3nd@main

# Inspect worktree-specific settings
r3nd config get worktree-copy-files
r3nd config get worktree-open-command
```

---

## 🧱 How to Use This Seed Repo

### 1. Clone this repository
```bash
git clone https://github.com/leandronoijo/r3nd.git
```

### 2. Initialize or scaffold
```bash
# Minimal setup (agents, templates, workflows)
r3nd init

# Full setup with backend/frontend overlays
r3nd scaffold
```

### 3. Customize your stack rules
Update files under:

- `.github/copilot-instructions.md`
- `rnd/instructions/*.instructions.md`

Here you define:

- Coding standards  
- Tech stack and libraries  
- Architectural patterns  
- Testing conventions  
- Folder-specific behaviors  

### 4. Install your real application code
Place your service, project, or monorepo under:

- `src/` → application code
- `tests/` → project tests

### 5. Start a feature

**Option A: Using the CLI (recommended)**
```bash
r3nd agents create-product-spec --input "Your feature description" --agent github
```

**Option B: Using GitHub Issues**
Create a GitHub Issue describing a new feature in 1–2 paragraphs.  
This automatically triggers the Product Manager workflow.

### 6. Review each PR

- Product Spec → human review  
- Tech Spec → human review  
- Build Plan → human review  
- Developer Code → human review  
- E2E Results → human review  
- Retro → human review  

After merging Developer's PR, your feature is fully implemented.

---

## 🛡 Principles & Guarantees

This template enforces:

### ✔ Human-in-the-loop safety
No code is merged without human review.

### ✔ Deterministic persona behavior
Each persona has a narrow scope and cannot spill into other roles.

### ✔ Traceability
Each feature produces a full chain of artifacts:  
Product Spec → Tech Spec → Build Plan → Code.

### ✔ Technology independence
The template does not assume any specific language or framework.  
All tech constraints live in your `rnd/instructions` files.

---

## 📁 Repo Structure

```
.github/
  agents/                    # GitHub Copilot agent definitions
    product-manager.agent.md
    architect.agent.md
    team-lead.agent.md
    developer.agent.md
    qa-team-lead.agent.md
    e2e-engineer.agent.md
    retro.agent.md
  chatmodes/                 # VS Code Copilot chat modes
    product-manager.chatmode.md
    implement-feature.chatmode.md
    architect.chatmode.md
    ...
  instructions/              # Path-specific coding rules
    e2e-testing.instructions.md
    testing.instructions.md
    ...
  workflows/                 # GitHub Actions workflows
    02-product-spec-ready.yml
    03-tech-spec-ready.yml
    04-build-plan-ready.yml
    05-development-ready.yml
    06-retro-ready.yml
  copilot-instructions.md    # Global Copilot instructions
.cursor/
  commands/                  # Cursor slash-commands
    create-product-spec.md
    implement-feature.md
    ...
.claude/
  commands/                  # Claude command files
    create-product-spec.md
    implement-feature.md
    ...
.codex/
  skills/                    # Codex skills
    create-product-spec/
      SKILL.md
    implement-feature/
      SKILL.md
    ...

cli/                         # r3nd CLI tool
  src/
    commands/                # CLI commands
      agents.js
      analyse.js
      bugfix.js
      config.js
      init.js
      scaffold.js
      tools.js
      update.js
    lib/                     # Core libraries
      agents/
      config/
      fs/
      github/
      llm/
      overlays/
      ui/
      utils/

rnd/                         # R&D artifacts (configurable name)
  agents/                    # Agent profiles for CLI
    product-manager.md
    architect.md
    team-lead.md
    developer.md
    qa-team-lead.md
    e2e-engineer.md
    retro.md
  templates/                 # Output templates
    product_spec.md
    tech_spec.md
    build_plan.md
    test_cases.md
    e2e-result.md
    retro.md
  product_specs/             # Product specifications
  tech_specs/                # Technical specifications
  build_plans/               # Build plans

overlays/                    # Stack-specific templates
  backend/
    fast-api/
    nestjs/
    ruby-on-rails/
  frontend/
    angular/
    vue/

src/                         # Application code
tests/                       # Project tests
docs/                        # Project documentation
r3nd.yaml                    # Configuration file
```

---

## 📘 Documentation

See the `docs/` directory for additional documentation:
- [Authentication Guide](docs/authentication.md)
- [Agent Interaction Logging](docs/agent-interaction-logging.md)
- [Migration Guide](docs/MIGRATION.md)

---

## 👤 For Maintainers

To extend or adapt the system:

- Add new task skills under `rnd/skills/`
- Add or refine shared fragments under `rnd/agents/`
- Add vendor-specific guidance under `rnd/vendor/skills/`
- Add new workflow stages under `.github/workflows`
- Expand repo instructions for new stacks
- Use `rnd/instructions/*.instructions.md` to enforce path-level rules
- Add new overlays under `overlays/backend` or `overlays/frontend`
- Add architecture notes or diagrams under `docs/`

---

## 🧭 Roadmap

Potential future enhancements:

- Automated diff validation (AI allowed to edit only approved files)
- Multi-agent critique loops for higher-quality specs
- Auto-link specs and build plans to PR descriptions
- Diagram generation from tech specs
- Optional CI for running tests after the Developer stage
