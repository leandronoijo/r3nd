# AI-Driven R&D Pipeline – Seed Repository
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE.md)

This repository is a `starter template` for teams who want to automate their product → architecture → planning → development lifecycle using **GitHub Copilot Agents** and **GitHub Actions**.

It provides:

- A fully structured, opinionated directory layout  
- Seven Copilot personas (Product Manager, Architect, Team Lead, Developer, QA Team Lead, E2E Engineer, Retro)  
- A chained workflow pipeline producing product specs → tech specs → build plans → test cases → code → E2E → retro  
- Human-controlled PR gates at every stage  
- Strict separation between R&D artifacts, documentation, and actual application code  

This repo serves as a `seed`: clone it, customize it, and apply your own technology stack through the `.github/instructions` files.

---

## 🚀 What This Repo Provides

### 1. Out-of-the-box personas
Located in `.github/agents/`:

- `product-manager.agent.md`
- `architect.agent.md`
- `team-lead.agent.md`
- `developer.agent.md`
- `qa-team-lead.agent.md`
- `e2e-engineer.agent.md`
- `retro.agent.md`

Each persona has a strict role and writes only to their designated output paths.

### 2. End-to-end multi-stage workflow
Located in `.github/workflows/`:

1. 02-product-spec-ready → Creates tech spec issue after product specs change  
2. 03-tech-spec-ready → Creates build plan issue after tech specs change  
3. 04-build-plan-ready → Creates development + test-cases issues after build plans change  
4. 05-development-ready → Creates E2E testing issue after code changes  
5. 06-retro-ready → Creates retro issue after PR approval  

Each stage opens a PR.  
A human must approve before the next stage runs.
Each workflow also supports manual runs with explicit inputs (branch + file/PR number).

Manual run inputs:

| Workflow | Inputs |
|----------|--------|
| `02-product-spec-ready` | `branch`, `file` (product spec path) |
| `03-tech-spec-ready` | `branch`, `file` (tech spec path) |
| `04-build-plan-ready` | `branch`, `file` (build plan path) |
| `05-development-ready` | `branch`, `src_file`, `feature_name` (optional) |
| `06-retro-ready` | `pr_number` |

### 3. Clear R&D artifact structure
By default, located under `r3nd/` (configurable via `r3nd.yaml`):

- `product_specs/`
- `tech_specs/`
- `build_plans/`
- `test_cases/`
- `e2e-results/`
- `retros/`
- `history/`

This ensures complete traceability from idea → architecture → plan → code.

**Multi-Directory Support:** The CLI supports multiple spec directories anywhere in your repository tree. Perfect for monorepos or multi-service architectures:

```
project/
├── r3nd/                    # Root-level specs (shared/platform)
│   ├── product_specs/
│   └── build_plans/
├── apps/
│   ├── backend/
│   │   └── r3nd/           # Backend-specific specs
│   └── frontend/
│       └── r3nd/           # Frontend-specific specs
└── services/
    └── auth/
        └── r3nd/           # Service-specific specs
```

Configure the directory name in `r3nd.yaml`:

```yaml
# Specification Directory Name
# Default: r3nd (supports legacy 'rnd' for backward compatibility)
spec-dir-name: r3nd
```

### 4. Real application structure
Located under:

- `src/` → application code  
- `tests/` → project tests  

The Developer persona modifies only these directories.

### 5. Repo-wide & path-specific Copilot rules
- `.github/copilot-instructions.md`  
- `.github/instructions/*.instructions.md`  

This is where you define stack-specific rules (Node.js, Python, Go, AWS, React, etc.) without touching personas.

---

## 📦 How the Pipeline Works

GitHub Issue  
→ Product Spec (Product Manager)  
→ PR #1 (human review)  
→ 03-tech-spec-ready (Architect)  
→ PR #2 (human review)  
→ 04-build-plan-ready (Team Lead)  
→ PR #3 (human review)  
→ Development + Test Cases (Developer + Test Engineer)  
→ PR #4 (human review)  
→ 05-development-ready (E2E Engineer)  
→ PR #5 (human review)  
→ 06-retro-ready (Retro)  
→ Retro complete

Every stage consumes the previous artifact and produces the next.  
No stage runs automatically without human approval.

---

## 🧱 How to Use This Seed Repo

### 1. Clone this repository
git clone <this-seed-repo-url>

### 2. Customize your stack rules
Update files under:

- `.github/copilot-instructions.md`
- `.github/instructions/*.instructions.md`

Here you define:

- Coding standards  
- Tech stack and libraries  
- Architectural patterns  
- Testing conventions  
- Folder-specific behaviors  

### 3. Install your real application code
Place your service, project, or monorepo under:

src/  
tests/

### 4. Start a feature
Create a GitHub Issue describing a new feature in 1–2 paragraphs.  
This automatically triggers the Product Manager workflow.

### 5. Review each PR

- Product Spec → human review  
- Tech Spec → human review  
- Build Plan → human review  
- Developer Code → human review  
- E2E Results → human review  
- Retro → human review  

After merging Developer’s PR, your feature is fully implemented.

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
All tech constraints live in your `.github/instructions` files.

---

## 📁 Repo Structure

```
.github/
  workflows/
    common/
  templates/
  agents/
  instructions/
  copilot-instructions.md
r3nd/           # Configurable via r3nd.yaml (spec-dir-name)
  product_specs/
  tech_specs/
  build_plans/
  test_cases/
  e2e-results/
  retros/
  history/
src/
tests/
docs/
r3nd.yaml       # Configuration file
```

**Note:** The spec directory name (`r3nd/`) is configurable via `r3nd.yaml`. For backward compatibility, the system also supports the legacy `rnd/` directory name.

---

## 📘 Documentation

See the `docs/` directory for optional project documentation that explains the pipeline, personas, and automation architecture — this folder is intentionally extensible and may be empty in the seed repository.

---

## 🧰 CLI

This repository includes a small CLI (located in the `cli/` folder) that helps scaffold and initialize projects from the r3nd seed overlays.

### Configuration

The r3nd CLI uses a configuration file (`r3nd.yaml`) at the repository level to customize its behavior. Configuration values can be managed using the `config` command:

- `config list`: Display all configuration values and defaults
- `config get <key>`: Get a specific configuration value
- `config set <key> <value>`: Set a configuration value

#### Available Configuration Keys

- **`seed-repo`**: The GitHub repository from which r3nd fetches seed files, overlays, agents, workflows, and templates.
  - Format: `owner/repo[@branch]`
  - Default: `leandronoijo/r3nd@develop`
  - Examples:
    - `leandronoijo/r3nd@develop` (use develop branch)
    - `leandronoijo/r3nd@main` (use main branch)
    - `myorganization/custom-r3nd` (use custom fork with default branch)

Configuration examples:

```bash
# List all configuration values
r3nd config list

# Get the current seed repository
r3nd config get seed-repo

# Set a custom seed repository
r3nd config set seed-repo myorganization/custom-r3nd@main

# Use a different branch of the default repo
r3nd config set seed-repo leandronoijo/r3nd@main
```

When running `init`, `scaffold`, or `update` commands, if no seed repository is configured, you will be prompted to enter one. The configuration is saved to `r3nd.yaml` in your repository root.

### Commands

- `scaffold`: interactive scaffolder that copies overlays and rnd build plans into the current working directory (existing behaviour). Ensures the retro agent/template/workflow are present even when resuming.

- `init`: a lightweight initializer that will:
	- run `git init` if the current directory is not already a git repository
	- copy a minimal set of seed files from the r3nd seed repository into the current directory:
		- `.github/agents/**`
		- `rnd/templates/**`
		- `.github/workflows/**`
		- `.github/instructions/e2e-testing.instructions.md`
		- `.gitignore`

- `update`: update r3nd components from the seed repository to get the latest versions:
	- Presents an interactive checklist to select which components to update:
		- Templates (`rnd/templates/`)
		- Agents (`.github/agents/`)
		- GitHub workflows (`.github/workflows/`)
		- Cursor commands (`.cursor/commands/`)
		- VSCode Copilot chat modes (`.github/chatmodes/`)
	- Options:
		- `-y, --yes`: Non-interactive mode, update all components
	- Example (interactive):
		```bash
		r3nd update
		```
	- Example (non-interactive, update all):
		```bash
		r3nd update --yes
		```

- `analyse`: Inspect the current git repository to generate `project.instructions.md` and per-app instruction files using the configured LLM agent. Useful to bootstrap instruction files from an existing codebase.
	- Options:
		- `-a, --agent <agent>`: Agent to use (`codex`, `gemini`, `github`, or `generate`). Default: `codex`.
		- `-n, --non-interactive`: Run without interactive prompts (assume defaults).
		- `-d, --dir <directory>`: Target a specific app/service directory instead of the whole project. Generates instructions for just that directory.
	- Example (non-interactive, use codex):

		```bash
		node cli/src/index.js analyse --non-interactive --agent codex
		```
	
	- Example (analyse a specific directory):

		```bash
		node cli/src/index.js analyse --dir src/backend --agent codex
		r3nd analyse --dir cli/src --agent generate --non-interactive
		```

Usage examples (from the repo root):

```bash
# Run scaffold (interactive)
node cli/src/index.js scaffold

# Initialize current directory with minimal r3nd seed files
node cli/src/index.js init

# Update r3nd components to latest versions
node cli/src/index.js update
```

Installation (global):

You can install the CLI globally from the seed repository as requested:

```bash
sudo npm install -g git+https://github.com/leandronoijo/r3nd.git#0.2.5
```

After global install you can run the CLI as `r3nd` from your shell (e.g. `r3nd init`, `r3nd update`).

## 👤 For Maintainers

To extend or adapt the system:

- Add new personas under `.github/agents`
- Add new workflow stages under `.github/workflows`
- Expand repo instructions for new stacks
- Use `.github/instructions/*.instructions.md` to enforce path-level rules
- Add architecture notes or diagrams under `docs/`

---

## 🧭 Roadmap

Potential future enhancements:

- Automated diff validation (AI allowed to edit only approved files)
- Multi-agent critique loops for higher-quality specs
- Auto-link specs and build plans to PR descriptions
- Diagram generation from tech specs
- Optional CI for running tests after the Developer stage
