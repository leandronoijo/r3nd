# r3nd CLI

## Supported CLI Tools

The r3nd CLI integrates with several external tools to provide AI-powered code generation and scaffolding. **The CLI will automatically detect which tools are installed on your system and only show you the options you can actually use.**

### Available Agents

| Tool | Command | Description | Installation |
|------|---------|-------------|--------------|
| **Codex CLI** | `codex` | Local AI coding agent for code generation and modifications | `npm install -g @modelcontextprotocol/codex` |
| **Gemini CLI** | `gemini` | Google's Gemini AI agent for interactive code assistance | Follow instructions at [Google Generative AI](https://github.com/google/generative-ai) |
| **GitHub CLI** | `gh` | GitHub's official CLI with Copilot integration | Visit [cli.github.com](https://cli.github.com/) or install via package manager:<br/>• Ubuntu/Debian: `sudo apt install gh`<br/>• macOS: `brew install gh`<br/>• Other: See [installation guide](https://github.com/cli/cli#installation) |

### How Tool Detection Works

When you run any r3nd command that offers agent options (`scaffold`, `analyse`, `bugfix`), the CLI will:

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
  - `.github/agents/**`
  - `.github/templates/**`
  - `.github/workflows/**`
  - `.github/instructions/e2e-testing.instructions.md`
  - `.gitignore`
  - (Includes the retro agent/template/workflow via the `.github` folders)

  Example:

  - From the project root: `node src/index.js init`
  - If installed globally: `r3nd init` (see installation section)

- `scaffold`: Full project scaffolding (existing behaviour) — prompts for backend/frontend overlays and copies matching overlays and rnd build plans. Ensures the retro agent/template/workflow are present even when resuming from an existing setup.

- `analyse`: Analyse the repository and generate `project.instructions.md` and per-app instruction files using an LLM agent.
  - Options:
    - `-a, --agent <agent>`: Agent to use (`codex|gemini|github|generate`). Default: `codex` (or first available agent).
    - `-n, --non-interactive`: Run without interactive prompts.
  - **Note**: Only agents installed on your system will be available as options.
  - Example:

    ```bash
    node src/index.js analyse --non-interactive --agent codex
    ```

- `bugfix`: Create and execute a bugfix plan using r3nd agents.
  - **Note**: Only agents installed on your system will be available as options.
  - Example:

    ```bash
    node src/index.js bugfix
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
  sudo npm install -g git+https://github.com/leandronoijo/r3nd.git#0
  ```

  After global install you can run the CLI as `r3nd` from your shell.

### CLI Tool Installation (Optional)

To use AI agents with r3nd, install one or more of the following tools. **You don't need all of them** — install only what you want to use:

**Codex CLI:**
```bash
npm install -g @modelcontextprotocol/codex
```

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
which gemini   # Check if gemini is installed
which gh       # Check if GitHub CLI is installed
```

The r3nd CLI will automatically detect available tools and adjust its options accordingly.

---

This CLI is intended to be used as a scaffolder and helper for generating project overlays and instructions using the r3nd overlays and optional LLM-driven plans.
