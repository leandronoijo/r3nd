# Retro Agent and Interaction Logging

## Overview

The r3nd CLI and Cursor commands now include automatic interaction logging for all agents. Each agent creates a summary log of its interaction with the user before signaling completion, and the retro agent uses these logs to understand the development process.

## How It Works

### 1. Agent Summary Logs

When using CLI tools (codex, gemini) or Cursor commands, each agent automatically creates a summary log in `<spec-dir>/agent_summaries/` before completing. The log includes:
- What was accomplished
- Key decisions or changes made
- User interactions and feedback
- Important notes or context for future reference

**Agents that create logs:**
- `product-manager` / `product-spec` - Product specification creation
- `architect` / `tech-spec` - Technical specification creation
- `team-lead` / `build-plan` - Build plan creation
- `developer` / `develop` - Implementation work
- `qa-team-lead` / `test-cases` - E2E test case creation
- `e2e-engineer` / `e2e-tests` - E2E test execution

**Note:** 
- GitHub Copilot agents don't create summary logs as they already track interactions in the PR itself.
- The `<spec-dir>` is configurable via `r3nd.yaml` (defaults to `rnd` or `r3nd` depending on your configuration).

### 2. Retro Agent

The retro agent reads all summary logs from `<spec-dir>/agent_summaries/` to understand what happened during the development process, then:
1. Reads agent summary logs for context
2. Reviews PR discussion and comments
3. Identifies process improvements
4. Creates a retro report in `<spec-dir>/retros/pr-<number>-retro.md`
5. Cleans up all summary logs after completion

## Usage

### Running Agents via CLI (Automatic Logging)

Just run agents normally - they'll automatically create summary logs:

```bash
# These agents will create summary logs automatically
r3nd agents product-spec --input "User authentication system"
r3nd agents tech-spec --file rnd/product_specs/auth.md
r3nd agents develop --file rnd/build_plans/auth-build-plan.md
```

### Running Agents via Cursor Commands

When using Cursor commands (`.cursor/commands/`), agents will:
1. Complete their primary task
2. Ask the user: "Are you satisfied with [artifact]? (yes/no)"
3. Iterate based on user feedback until satisfied
4. Create a summary log in `rnd/agent_summaries/`

### Running Retro Agent

```bash
# Interactive mode (CLI)
r3nd agents retro

# Direct mode (CLI)
r3nd agents retro --input "PR #123"

# With specific agent (CLI)
r3nd agents retro --input "https://github.com/org/repo/pull/456" --agent codex
```

In Cursor, use the `/retro` command which will:
1. First read all files in `rnd/agent_summaries/`
2. Review PR discussions
3. Create a retro report
4. Clean up agent summaries after user confirms satisfaction

## Workflow Integration

1. **Development** → Agents create summary logs as they work
2. **PR Review** → Team reviews and discusses changes
3. **Retro Agent** → Reads summary logs + PR discussion, creates retro report
4. **Cleanup** → Summary logs are deleted, retro report is preserved
5. **Process Updates** → Team applies recommendations

## Example Agent Summary Log

```markdown
# product-manager - Interaction Summary
**Date:** 2026-01-03
**Task:** Create product specification for user authentication

## Summary
Created a comprehensive product specification for implementing user authentication including email/password login, social OAuth, and password reset functionality.

## Key Points
- Decided on JWT-based authentication over session-based
- Included 2FA as optional feature for security
- Prioritized OAuth providers: Google, GitHub

## User Interactions
- User requested that password reset use magic links instead of temporary passwords
- User asked for clarification on session timeout behavior

## Notes
Updated spec to reflect magic link preference. Session timeout set to 24 hours for "remember me" users.
```

## Benefits

1. **Automatic Context**: Retro agent has full context of development process
2. **No Manual Work**: Developers don't need to manually log anything
3. **Clean Workflow**: Summary logs are cleaned up automatically
4. **Better Retros**: Retro reports are more informed and accurate
5. **Consistent Experience**: Same satisfaction loop mechanism across CLI and Cursor

## Technical Details

### Summary Log Location

Logs are stored in: `<spec-dir>/agent_summaries/<agent-name>-<timestamp>.md`

Example: `rnd/agent_summaries/product-manager-2026-01-03-14-30-45.md`

**Note:** The `<spec-dir>` is determined by the `spec-dir-name` setting in `r3nd.yaml` (defaults to `rnd` or `r3nd`).

### Log Creation

**CLI agents** are instructed (via their `interactiveSuffix`) to:
1. Complete their primary task
2. Confirm user satisfaction
3. Create summary log file
4. Create `.done` file to signal completion

**Cursor commands** are instructed (via their markdown templates) to:
1. Complete their primary task
2. Ask user: "Are you satisfied with [artifact]? (yes/no)"
3. Iterate until satisfied
4. Create summary log file

### Cleanup

The retro agent is instructed to delete all files in `<spec-dir>/agent_summaries/` after the user confirms satisfaction with the retro report, ensuring a clean slate for the next development cycle.

## See Also

- [r3nd CLI Documentation](../cli/README.md)
- [Agent Profiles](../.github/agents/)
- [Cursor Commands](../.cursor/commands/)
- [Retro Template](../.github/templates/retro.md)
