const path = require('path');
const fs = require('fs').promises;
const { getAgents, resolveAgentConfig } = require('../lib/agents/agentRegistry');
const { listMarkdownFiles, buildPrompt, buildInteractivePrompt, validateAgentSetup, getFileDisplayName } = require('../lib/agents/agentService');
const { chooseFile, buildAgentChoices, askFeatureDescription } = require('../lib/ui/prompts');
const { runPlansSequential, runGitHubAgent, spawnAgentWithDoneFile } = require('../lib/llm/agentRunner');
const { ensureDir } = require('../lib/fs/fileWriter');
const { ConfigManager } = require('../lib/config/configManager');
const { inferSpecDirBase } = require('../lib/utils/specDirInference');
const logger = require('../lib/utils/logger');
const inquirer = require('inquirer');
const prompt = inquirer.createPromptModule();

/**
 * Register the 'agents' command with dynamic subcommands
 * @param {Object} program - Commander program instance
 */
function register(program) {
  const agentsCommand = program
    .command('agents')
    .description('Run AI agents for specs, plans, and development');

  // Dynamically register subcommands from the agent registry
  const agents = getAgents();
  
  agents.forEach(agent => {
    const cmd = agentsCommand
      .command(agent.name)
      .description(agent.description)
      .option('--agent <type>', 'Agent type to use: codex, claude, gemini, github, or generate')
      .option('--non-interactive', 'Run in non-interactive mode with defaults')
      .option('--spec-dir <path>', 'Directory containing the spec folder (e.g., "apps/my-app" for "apps/my-app/r3nd/"). Defaults to root directory.');
    
    // Add --file option only for file-based agents
    if (!agent.useFreeTextInput) {
      cmd.option('--file <path>', 'Specific file to process (skips selection prompt)');
    } else {
      // Add --input option for free-text agents
      cmd.option('--input <text>', 'Feature description text (skips interactive prompt)');
    }
    
    cmd.action(async (opts) => {
      await runAgentCommand(agent, opts);
    });
  });
}

/**
 * Execute an agent command
 * @param {Object} agentConfig - Agent configuration from registry
 * @param {Object} opts - Command options
 */
async function runAgentCommand(agentConfig, opts = {}) {
  const cwd = process.cwd();
  const nonInteractive = !!opts.nonInteractive;
  const configManager = new ConfigManager(cwd);
  const specDirName = await configManager.getSpecDirName();
  
  // Determine the base directory for specs (e.g., "", "apps/my-app", "workspaces/my-workspace")
  // If --file is provided but --spec-dir is not, infer from the file path
  let specDirBase = opts.specDir || '';
  if (!specDirBase && opts.file) {
    specDirBase = inferSpecDirBase(opts.file, specDirName);
  }
  const fullSpecDir = specDirBase ? path.join(specDirBase, specDirName) : specDirName;
  
  const resolvedAgentConfig = resolveAgentConfig(agentConfig, specDirName, specDirBase);

  logger.info(`\nr3nd agents ${resolvedAgentConfig.name}`);
  logger.info(`Using agent: ${resolvedAgentConfig.agentFile}`);
  if (specDirBase) {
    logger.info(`Spec directory: ${fullSpecDir}`);
  }

  // Validate agent setup
  const validation = await validateAgentSetup(cwd, resolvedAgentConfig);
  
  if (!validation.agentExists) {
    logger.error(`Agent file not found: ${validation.agentPath}`);
    logger.info('Make sure you have run "r3nd scaffold" or "r3nd init" first.');
    process.exit(1);
  }

  // Handle free text input agents (like product-spec)
  if (resolvedAgentConfig.useFreeTextInput) {
    await handleFreeTextAgent(resolvedAgentConfig, opts, cwd, nonInteractive);
    return;
  }

  // Handle file-based agents (tech-spec, build-plan, develop)
  if (!validation.targetDirExists) {
    logger.warn(`Directory not found: ${validation.targetDir}`);
    logger.info('Creating directory...');
    await ensureDir(path.join(cwd, validation.targetDir));
  }

  // List available files
  const files = await listMarkdownFiles(cwd, resolvedAgentConfig.filesDir);
  
  if (files.length === 0) {
    logger.warn(`No markdown files found in ${resolvedAgentConfig.filesDir}`);
    logger.info(`Create a file there first, then run this command again.`);
    process.exit(0);
  }

  // Select a file
  let selectedFile = opts.file;
  
  if (!selectedFile) {
    logger.info(`\nFound ${files.length} file(s) in ${resolvedAgentConfig.filesDir}:`);
    files.forEach(f => logger.info(`  - ${getFileDisplayName(f)}`));
    
    selectedFile = await chooseFile(
      files,
      `Select a file to process:`,
      nonInteractive
    );
  } else {
    // Validate provided file exists
    const fullPath = path.join(cwd, selectedFile);
    const exists = await fs.access(fullPath).then(() => true).catch(() => false);
    
    if (!exists) {
      logger.error(`File not found: ${selectedFile}`);
      process.exit(1);
    }
  }

  if (!selectedFile) {
    logger.error('No file selected.');
    process.exit(1);
  }

  logger.info(`\n✓ Selected: ${selectedFile}`);

  // Select agent tool
  let agentChoice = opts.agent;
  const featureLabel = selectedFile;

  while (true) {
    if (!agentChoice) {
      const choices = buildAgentChoices({
        labels: {
          codex: 'Use local codex CLI (run now)',
          claude: 'Use Claude Code CLI (run now)',
          gemini: 'Use Gemini CLI (run now)',
          github: 'Use GitHub agent via gh CLI',
        },
        extraChoices: [
          { name: 'Generate prompt to copy & paste', value: 'generate' },
          { name: 'Cancel', value: 'cancel' }
        ]
      });

      const res = await prompt([{
        type: 'list',
        name: 'agent',
        message: 'Which tool would you like to use?',
        choices
      }]);

      agentChoice = res.agent;
    }

    if (agentChoice === 'cancel') {
      logger.info('Cancelled.');
      process.exit(0);
    }

    // Execute based on agent choice
    if (agentChoice === 'codex') {
      await runCodexAgent(selectedFile, cwd, resolvedAgentConfig.name, resolvedAgentConfig);
      return;
    } else if (agentChoice === 'claude') {
      await runClaudeAgent(selectedFile, cwd, resolvedAgentConfig.name, resolvedAgentConfig);
      return;
    } else if (agentChoice === 'gemini') {
      await runGeminiAgent(selectedFile, cwd, resolvedAgentConfig.name, resolvedAgentConfig);
      return;
    } else if (agentChoice === 'github') {
      const result = await runGitHubAgentWrapper(selectedFile, cwd, resolvedAgentConfig.name, resolvedAgentConfig, { featureLabel, allowRetry: !nonInteractive });
      if (result && result.retry) {
        if (nonInteractive) {
          process.exit(1);
        }
        agentChoice = undefined;
        continue;
      }
      return;
    } else if (agentChoice === 'generate') {
      await generatePrompt(selectedFile, cwd, resolvedAgentConfig.name, resolvedAgentConfig);
      return;
    } else {
      logger.error(`Unknown agent choice: ${agentChoice}`);
      process.exit(1);
    }
  }
}

/**
 * Handle agents that use free text input instead of file selection
 * @param {Object} agentConfig - Agent configuration
 * @param {Object} opts - Command options
 * @param {string} cwd - Current working directory
 * @param {boolean} nonInteractive - Non-interactive mode flag
 */
async function handleFreeTextAgent(agentConfig, opts, cwd, nonInteractive) {
  // Get feature description from user or options
  let userInput = opts.input;
  
  if (!userInput) {
    logger.info('\nThis agent requires a feature description as input.');
    userInput = await askFeatureDescription(nonInteractive);
  }

  logger.info(`\n✓ Feature description received (${userInput.length} characters)`);

  // Select agent tool
  let agentChoice = opts.agent;
  const featureLabel = userInput;

  while (true) {
    if (!agentChoice) {
      const choices = buildAgentChoices({
        labels: {
          codex: 'Use local codex CLI (run now)',
          claude: 'Use Claude Code CLI (run now)',
          gemini: 'Use Gemini CLI (run now)',
          github: 'Use GitHub agent via gh CLI',
        },
        extraChoices: [
          { name: 'Generate prompt to copy & paste', value: 'generate' },
          { name: 'Cancel', value: 'cancel' }
        ]
      });

      const res = await prompt([{
        type: 'list',
        name: 'agent',
        message: 'Which tool would you like to use?',
        choices
      }]);

      agentChoice = res.agent;
    }

    if (agentChoice === 'cancel') {
      logger.info('Cancelled.');
      process.exit(0);
    }

    // Execute based on agent choice
    if (agentChoice === 'codex') {
      await runCodexAgent(userInput, cwd, agentConfig.name, agentConfig);
      return;
    } else if (agentChoice === 'claude') {
      await runClaudeAgent(userInput, cwd, agentConfig.name, agentConfig);
      return;
    } else if (agentChoice === 'gemini') {
      await runGeminiAgent(userInput, cwd, agentConfig.name, agentConfig);
      return;
    } else if (agentChoice === 'github') {
      const result = await runGitHubAgentWrapper(userInput, cwd, agentConfig.name, agentConfig, { featureLabel, allowRetry: !nonInteractive });
      if (result && result.retry) {
        if (nonInteractive) {
          process.exit(1);
        }
        agentChoice = undefined;
        continue;
      }
      return;
    } else if (agentChoice === 'generate') {
      await generatePrompt(userInput, cwd, agentConfig.name, agentConfig);
      return;
    } else {
      logger.error(`Unknown agent choice: ${agentChoice}`);
      process.exit(1);
    }
  }
}

/**
 * Run codex agent
 */
async function runCodexAgent(targetInput, cwd, agentName, agentConfig) {
  // Generate timestamp-based done file name
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '-').substring(0, 19);
  const doneFileName = `${agentName}-${timestamp}.done`;
  const doneFilePath = path.join(cwd, doneFileName);
  
  // Build interactive prompt with completion instructions
  const interactivePrompt = await buildInteractivePrompt(agentConfig, targetInput, doneFileName, cwd);
  
  // Escape single quotes for shell command
  const escapedPrompt = interactivePrompt.replace(/'/g, "'\\\\''");
  const command = `codex --yolo '${escapedPrompt}'`;
  
  try {
    const success = await spawnAgentWithDoneFile(command, cwd, doneFilePath, 'Codex');
    
    if (success) {
      logger.info('✓ Codex agent completed successfully.');
    } else {
      logger.error('✗ Codex agent did not complete successfully.');
      process.exit(1);
    }
  } catch (err) {
    logger.error('Error running codex:', err.message || err);
    process.exit(1);
  }
}

/**
 * Run Claude agent
 */
async function runClaudeAgent(targetInput, cwd, agentName, agentConfig) {
  // Generate timestamp-based done file name
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '-').substring(0, 19);
  const doneFileName = `${agentName}-${timestamp}.done`;
  const doneFilePath = path.join(cwd, doneFileName);

  // Build interactive prompt with completion instructions
  const interactivePrompt = await buildInteractivePrompt(agentConfig, targetInput, doneFileName, cwd);

  // Escape double quotes for shell command
  const escapedPrompt = interactivePrompt.replace(/"/g, '\\"');
  const command = `claude --dangerously-skip-permissions "${escapedPrompt}"`;

  try {
    const success = await spawnAgentWithDoneFile(command, cwd, doneFilePath, 'Claude');

    if (success) {
      logger.info('✓ Claude agent completed successfully.');
    } else {
      logger.error('✗ Claude agent did not complete successfully.');
      process.exit(1);
    }
  } catch (err) {
    logger.error('Error running Claude:', err.message || err);
    process.exit(1);
  }
}

/**
 * Run Gemini agent
 */
async function runGeminiAgent(targetInput, cwd, agentName, agentConfig) {
  // Generate timestamp-based done file name
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '-').substring(0, 19);
  const doneFileName = `${agentName}-${timestamp}.done`;
  const doneFilePath = path.join(cwd, doneFileName);
  
  // Build interactive prompt with completion instructions
  const interactivePrompt = await buildInteractivePrompt(agentConfig, targetInput, doneFileName, cwd);
  
  // Escape double quotes for shell command
  const escapedPrompt = interactivePrompt.replace(/"/g, '\\"');
  const command = `gemini --yolo -i "${escapedPrompt}"`;
  
  try {
    const success = await spawnAgentWithDoneFile(command, cwd, doneFilePath, 'Gemini');
    
    if (success) {
      logger.info('✓ Gemini agent completed successfully.');
    } else {
      logger.error('✗ Gemini agent did not complete successfully.');
      process.exit(1);
    }
  } catch (err) {
    logger.error('Error running Gemini:', err.message || err);
    process.exit(1);
  }
}

/**
 * Run GitHub agent
 */
async function runGitHubAgentWrapper(targetInput, cwd, agentName, agentConfig, options = {}) {
  logger.info('\nCreating GitHub agent task...');
  
  // Build the prompt for GitHub agent (no interactive suffix needed)
  const promptText = buildPrompt(agentConfig, targetInput);
  
  try {
    const url = await runGitHubAgent(promptText, cwd, `Agent: ${agentName}`, { featureLabel: options.featureLabel });
    logger.info('\n📋 Next steps:');
    logger.info('  1. Monitor the agent\'s progress at the link above');
    logger.info('  2. Review the changes as they are made\n');
    return { ok: true };
  } catch (err) {
    if (err && err.code === 'GITHUB_BRANCH_PUSH_FAILED') {
      logger.error('GitHub agent run will not work: snapshot branch could not be pushed to origin.');
      logger.info('Use a local CLI tool, or fix your git remote/auth and then choose GitHub again.');
      if (!options.allowRetry) {
        process.exit(1);
      }
      return { retry: true };
    }
    if (err.message && err.message.includes('GitHub agent requires repository')) {
      logger.error('GitHub agent failed: Requires a repository with proper permissions.');
    } else {
      logger.error('Error running GitHub agent:', err.message || err);
    }
    process.exit(1);
  }
}

/**
 * Generate and optionally save prompt
 */
async function generatePrompt(targetInput, cwd, agentName, agentConfig) {
  // Build the prompt for display
  const promptText = buildPrompt(agentConfig, targetInput);
  
  logger.info('\n--- COPY & PASTE PROMPT ---\n');
  logger.info(promptText);
  logger.info('\n--- END PROMPT ---\n');

  const res = await prompt([{
    type: 'confirm',
    name: 'save',
    message: 'Save this prompt to a file?',
    default: true
  }]);

  if (res.save) {
    try {
      const savePath = path.join(cwd, 'rnd', `${agentName}-prompt.txt`);
      await ensureDir(path.dirname(savePath));
      await fs.writeFile(savePath, promptText, 'utf8');
      logger.info(`✓ Saved to ${savePath}`);
    } catch (err) {
      logger.error('Failed to save prompt:', err.message || err);
    }
  }
}

module.exports = { register };
