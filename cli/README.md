# r3nd CLI

## Supported CLI Tools

The r3nd CLI integrates with several external tools to provide AI-powered code generation and scaffolding. **The CLI will automatically detect which tools are installed on your system and only show you the options you can actually use.**

### Available Agents

| Tool | Command | Description | Installation |
|------|---------|-------------|--------------|
| **Codex CLI** | `codex` | Local AI coding agent for code generation and modifications | `npm install -g @modelcontextprotocol/codex` |
| **Claude Code** | `claude` | Anthropic's Claude Code CLI for interactive code assistance | See [Claude Code docs](https://docs.anthropic.com/en/docs/claude-code) |
| **Gemini CLI** | `gemini` | Google's Gemini AI agent for interactive code assistance | Follow instructions at [Google Generative AI](https://github.com/google/generative-ai) |
| **GitHub CLI** | `gh` | GitHub agent runner used for remote `gh agent-task` execution | Visit [cli.github.com](https://cli.github.com/) or install via package manager:<br/>• Ubuntu/Debian: `sudo apt install gh`<br/>• macOS: `brew install gh`<br/>• Other: See [installation guide](https://github.com/cli/cli#installation) |

### How Tool Detection Works

When you run any r3nd command that offers agent options, the CLI will:

1. **Automatically check** which tools are installed on your system
2. **Only display** the agents you can actually use
3. **Show a helpful message** if no agents are detected
4. **Always offer** the "generate prompts" option as a fallback

**Example**: If you only have `codex` installed, you'll only see:
- ✓ Use local codex CLI
- Generate a prompt to copy & paste
- Naa (do nothing)

### No Agents Installed?

If you haven't installed any of the CLI tools yet, you can still use r3nd! Select the **"Generate a prompt to copy & paste"** option to:
- Generate AI prompts for your task
- Save them to files for later use
- Copy and paste them into your preferred AI assistant (ChatGPT, Claude, etc.)

---

## Commands


Commands:

- `init`: Initialize the current directory as a git repository (runs `git init` if `.git` is missing) and copy a minimal set of seed files from the r3nd seed repository. Files copied include:
  - `.github/workflows/**`
  - `.github/skills/**`
  - `.cursor/skills/**`
  - `.claude/skills/**`
  - `.codex/skills/**`
  - `rnd/skills/**`
  - `rnd/templates/**`
  - `rnd/instructions/e2e-testing.instructions.md`
  - `.gitignore`
  - (GitHub workflows and GitHub skills are managed as separate generated asset families)

  Example:

  - From the project root: `node src/index.js init`
  - If installed globally: `r3nd init` (see installation section)

- `scaffold`: Full project scaffolding — prompts for ordered overlays discovered from the seed repo, copies base seed content plus selected overlay files, and keeps the existing scaffold build plan filenames for LLM execution.

- `analyse`: Analyze repository and app scopes and generate `AGENTS.md` / `CLAUDE.md` files using an LLM agent.
  - Options:
    - `-a, --agent <agent>`: Agent to use (`codex|claude|gemini|github`). `github` runs the remote GitHub agent via `gh agent-task`. Default: `codex` (or first available agent).
    - `-n, --non-interactive`: Run without interactive prompts.
  - **Note**: Only agents installed on your system will be available as options.
  - Examples:

    ```bash
    # Analyze entire project (repo-level + selected app-level scopes)
    node src/index.js analyse --non-interactive --agent codex
    ```

- `agents`: Run AI agents for generating specs, plans, and implementing features. See [Agents Command Documentation](docs/agents-command.md) for details.
  - Subcommands:
    - `create-product-spec`: Generate a product specification from a feature description (free text input)
    - `create-tech-spec`: Generate a technical specification from a product spec
    - `create-build-plan`: Generate a build plan from a technical specification
    - `implement-build-plan`: Implement a build plan to completion
    - `implement-feature`: Run coordinated feature implementation with teammate agents
    - `create-test-cases`: Generate E2E test cases from a build plan
    - `run-e2e-tests`: Generate, run, and diagnose E2E tests from test cases
    - `create-retro-report`: Review PR discussions and create a retro report
    - `analyze-repo-context`: Analyze repo root and generate repo-level `AGENTS.md` / `CLAUDE.md`
    - `analyze-app-context`: Analyze app path and generate app-level `AGENTS.md` / `CLAUDE.md`
    - `analyze-module-context`: Analyze module path and generate module-level `AGENTS.md` / `CLAUDE.md`
  - **Note**: Only agents installed on your system will be available as options.
  - **Spec Directory Option**: Use `--spec-dir <path>` to specify where spec files should be saved (e.g., `apps/my-app`, `services/auth`). Files will be saved in `<spec-dir>/<spec-dir-name>/` where `spec-dir-name` comes from your r3nd.yaml config (defaults to `r3nd`).
  - **Instruction Source**: These commands read task instructions from `<spec-dir>/<spec-dir-name>/skills/<task>/SKILL.md`.
  - Examples:

    ```bash
    # Interactive mode (saves to root r3nd/ directory by default)
    r3nd agents create-product-spec
    r3nd agents create-tech-spec
    r3nd agents create-build-plan
    r3nd agents implement-build-plan

    # With options
    r3nd agents create-product-spec --input "Build user auth system" --agent github
    r3nd agents create-tech-spec --file r3nd/product_specs/auth.md --agent github
    r3nd agents implement-build-plan --file r3nd/build_plans/feature.md --agent codex
    r3nd agents implement-feature --file r3nd/tech_specs/feature.md --agent codex

    # Using custom spec directory (saves to apps/backend/r3nd/)
    r3nd agents create-product-spec --spec-dir apps/backend --input "Add OAuth2" --agent github
    r3nd agents create-tech-spec --spec-dir services/auth --file services/auth/r3nd/product_specs/feature.md --agent codex
    
    # Example for monorepo with multiple apps
    r3nd agents create-product-spec --spec-dir apps/mobile --agent github    # → apps/mobile/r3nd/product_specs/
    r3nd agents create-product-spec --spec-dir apps/web --agent github       # → apps/web/r3nd/product_specs/
    r3nd agents create-tech-spec --spec-dir workspaces/shared --agent codex  # → workspaces/shared/r3nd/tech_specs/

    # Context-analysis skills (path provided via --input)
    r3nd agents analyze-repo-context --input . --agent codex
    r3nd agents analyze-app-context --input apps/backend --agent codex
    r3nd agents analyze-module-context --input apps/backend/src/modules/auth --agent claude
    ```

- `tools`: Show which AI tools are available on your system.
  - Example:

    ```bash
    r3nd tools
    ```

- `worktree`: Open an existing repo worktree or create a new repo-scoped git worktree under `~/.r3nd/worktrees/`.
  - Options:
    - `-br, --branch <name>`: Use a specific branch name instead of generating one automatically.
  - Behavior:
    - Without `--branch`, shows all git worktrees for the current repository and lets you choose one to open with the configured `worktree-open-command`.
    - Appends a `New worktree` option to that list.
    - Choosing `New worktree` prompts for a branch name; leaving it empty uses an automatic faker-based branch name.
    - Copies every directory named as your configured `spec-dir-name`.
    - Copies root vendor directories when present: `.claude`, `.codex`, `.github`, and `.cursor`.
    - Copies additional files from `worktree-copy-files` in `r3nd.yaml` (defaults to `*.env` and `**/*.env`).
    - Runs the configured `worktree-open-command` after creation.
  - Example:

    ```bash
    r3nd worktree
    r3nd worktree --branch auth-investigation
    ```

- `worktree clean`: Delete clean r3nd-managed worktrees for the current repository.
  - Behavior:
    - Uses plain `git status --porcelain` to determine if a worktree is clean.
    - Ignored-file changes do not block cleanup.
    - Keeps local branches after removing the worktree directory.
  - Example:

    ```bash
    r3nd worktree clean
    ```

## Installation

### r3nd CLI Installation

- Install locally for development:

  ```bash
  cd cli
  npm install
  ```

- Install globally from the seed repository:

  ```bash
  sudo npm install -g git+https://github.com/leandronoijo/r3nd.git#0.2
  ```

  After global install you can run the CLI as `r3nd` from your shell.

### CLI Tool Installation (Optional)

To use AI agents with r3nd, install one or more of the following tools. **You don't need all of them** — install only what you want to use:

**Codex CLI:**
```bash
npm install -g @modelcontextprotocol/codex
```

**Claude Code CLI:**
See: [https://docs.anthropic.com/en/docs/claude-code](https://docs.anthropic.com/en/docs/claude-code)

**Gemini CLI:**
Follow the installation instructions at [Google Generative AI](https://github.com/google/generative-ai)

**GitHub CLI (with Copilot):**
- **Ubuntu/Debian:** `sudo apt install gh`
- **macOS:** `brew install gh`
- **Windows:** `winget install GitHub.cli` or download from [cli.github.com](https://cli.github.com/)
- **Other systems:** See the [official installation guide](https://github.com/cli/cli#installation)

After installing GitHub CLI, authenticate with: `gh auth login`

### Verifying Installation

You can verify which tools are installed by running:
```bash
which codex    # Check if codex is installed
which claude   # Check if claude is installed
which gemini   # Check if gemini is installed
which gh       # Check if GitHub CLI is installed
```

The r3nd CLI will automatically detect available tools and adjust its options accordingly.

---

This CLI is intended to be used as a scaffolder and helper for generating project overlays and instructions using ordered overlay packs from the seed repo and optional LLM-driven plans.
