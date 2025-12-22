# r3nd CLI


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
    - `-a, --agent <agent>`: Agent to use (`codex|gemini|github|generate`). Default: `codex`.
    - `-n, --non-interactive`: Run without interactive prompts.
  - Example:

    ```bash
    node src/index.js analyse --non-interactive --agent codex
    ```

- `bugfix`: Create and execute a bugfix plan using r3nd agents.
  - Example:

    ```bash
    node src/index.js bugfix
    ```

Installation:

- Install locally for development:

  ```bash
  cd cli
  npm install
  ```

- Install globally from the seed repository (as requested):

  ```bash
  sudo npm install -g git+https://github.com/leandronoijo/r3nd.git#0
  ```

  After global install you can run the CLI as `r3nd` from your shell.

---

This CLI is intended to be used as a scaffolder and helper for generating project overlays and instructions using the r3nd overlays and optional LLM-driven plans.
