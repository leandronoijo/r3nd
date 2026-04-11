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
  - `.cursor/commands/**`
  - `.claude/commands/**`
  - `.codex/skills/**`
  - `rnd/templates/**`
  - `rnd/instructions/e2e-testing.instructions.md`
  - `.gitignore`
  - (GitHub workflows and GitHub skills are managed as separate generated asset families)

  Example:

  - From the project root: `node src/index.js init`
  - If installed globally: `r3nd init` (see installation section)

- `scaffold`: Full project scaffolding (existing behaviour) — prompts for backend/frontend overlays and copies matching overlays and rnd build plans. Ensures the retro skill/template/workflow are present even when resuming from an existing setup.

- `analyse`: Analyse the repository and generate `project.instructions.md` and per-app instruction files using an LLM agent.
  - Options:
    - `-a, --agent <agent>`: Agent to use (`codex|claude|gemini|github|generate`). `github` runs the remote GitHub agent via `gh agent-task`. Default: `codex` (or first available agent).
    - `-n, --non-interactive`: Run without interactive prompts.
    - `-d, --dir <directory>`: Target a specific app/service directory instead of the whole project. Generates instructions for just that directory.
  - **Note**: Only agents installed on your system will be available as options.
  - Examples:

    ```bash
    # Analyse entire project
    node src/index.js analyse --non-interactive --agent codex
    
    # Analyse a specific directory
    node src/index.js analyse --dir src/backend --agent codex
    r3nd analyse --dir cli/src --agent generate --non-interactive
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
  - **Note**: Only agents installed on your system will be available as options.
  - **Spec Directory Option**: Use `--spec-dir <path>` to specify where spec files should be saved (e.g., `apps/my-app`, `services/auth`). Files will be saved in `<spec-dir>/<spec-dir-name>/` where `spec-dir-name` comes from your r3nd.yaml config (defaults to `r3nd`).
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
    ```

- `tools`: Show which AI tools are available on your system.
  - Example:

    ```bash
    r3nd tools
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

This CLI is intended to be used as a scaffolder and helper for generating project overlays and instructions using the r3nd overlays and optional LLM-driven plans.
