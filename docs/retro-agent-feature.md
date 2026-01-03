# Retro Agent and Interaction Logging Feature

## Overview

The r3nd CLI now includes a retro agent feature with automatic interaction logging. This allows teams to review PR discussions and identify improvements to agents, templates, and instructions while keeping a log of all agent interactions.

## Features

### 1. Retro Agent Command

Run the retro agent to analyze PR discussions and create improvement recommendations:

```bash
r3nd agents retro --input "PR #123"
```

The retro agent will:
- Review all PR comments, review threads, and discussions
- Identify process gaps and improvement opportunities
- Map issues to specific agent profiles, templates, or instructions
- Generate a retro report in `rnd/retros/pr-<number>-retro.md`
- Automatically clear all interaction logs after completion

### 2. Automatic Interaction Logging

When enabled, all agent interactions are automatically logged to `r3nd/agent_summaries/` with timestamps. Each log includes:
- Agent name
- Tool used (codex, gemini, github)
- Input/prompt
- Completion status
- Timestamp

Example log file: `rnd/agent_summaries/product-spec-2026-01-03-20-15-30.md`

### 3. Configurable Settings

Configure the feature via `r3nd.yaml`:

```yaml
# Enable/disable the retro agent (default: true)
retro-agent-enabled: true

# Enable/disable interaction logging (default: true)
log-agent-interactions: true
```

## Usage Examples

### Run Retro Agent (Interactive)

```bash
r3nd agents retro
# You'll be prompted for PR number/URL and agent choice
```

### Run Retro Agent (Non-Interactive)

```bash
# With GitHub Copilot agent
r3nd agents retro --input "PR #123" --agent github

# With local Codex
r3nd agents retro --input "https://github.com/org/repo/pull/456" --agent codex

# Generate prompt only
r3nd agents retro --input "PR #789" --agent generate
```

### View Configuration

```bash
r3nd config list
```

### Change Configuration

```bash
# Disable interaction logging
r3nd config set log-agent-interactions false

# Disable retro agent
r3nd config set retro-agent-enabled false
```

## Workflow Integration

The retro agent fits into the r3nd pipeline after code review:

1. **Development** → Code changes are made
2. **PR Review** → Team reviews and discusses changes
3. **Retro Agent** → Analyzes discussion and creates improvement report
4. **Process Updates** → Team applies recommendations to agents/templates

## Log Management

### Automatic Cleanup

- Logs are automatically deleted when the retro agent completes
- This prevents log accumulation while preserving history in retro reports

### Manual Management

View current logs:
```bash
ls rnd/agent_summaries/
```

Manually clear logs (if needed):
```bash
rm rnd/agent_summaries/*.md
```

## Benefits

1. **Continuous Improvement**: Identify and fix process gaps systematically
2. **Audit Trail**: Track all agent interactions with timestamps
3. **Team Learning**: Share insights from retros across the team
4. **Quality Control**: Ensure agents follow best practices consistently

## Troubleshooting

### Logs Not Being Created

Check if logging is enabled:
```bash
r3nd config get log-agent-interactions
```

If false, enable it:
```bash
r3nd config set log-agent-interactions true
```

### Retro Command Not Available

Check if retro agent is enabled:
```bash
r3nd config get retro-agent-enabled
```

If false, enable it:
```bash
r3nd config set retro-agent-enabled true
```

### Log Directory Missing

The directory is created automatically when the first log is written. No action needed.

## Technical Details

### Log Location

Logs are stored in: `<spec-dir-name>/agent_summaries/`

Default: `rnd/agent_summaries/` (or `r3nd/agent_summaries/` if using new naming)

### Log Format

Each log file contains:
- Markdown-formatted header with agent name
- ISO timestamp
- Interaction content (input/output summary)

### Configuration Storage

Settings are stored in `r3nd.yaml` at the repository root.

## See Also

- [r3nd CLI Documentation](../cli/README.md)
- [Agent Profiles](../.github/agents/)
- [Retro Template](../.github/templates/retro.md)
