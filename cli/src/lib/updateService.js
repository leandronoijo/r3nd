const path = require('path');
const fs = require('fs').promises;

const { GitHubClient } = require('./github/githubClient');
const { writeBuffer, ensureDir } = require('./fs/fileWriter');
const { askUpdateOptions, askSeedRepo } = require('./ui/prompts');
const { parseAgentFile, generateCursorCommand, generateVSCodeChatMode } = require('./initService');
const { ConfigManager } = require('./config/configManager');
const logger = require('./utils/logger');

async function runUpdate(opts = {}, deps = {}) {
  const cwd = opts.cwd || process.cwd();
  const nonInteractive = !!opts.nonInteractive;
  
  // Initialize config manager
  const configManager = new ConfigManager(cwd);
  
  // Check if seed-repo is configured, prompt if not
  let seedRepo = await configManager.get('seed-repo');
  if (!seedRepo) {
    logger.info('No seed repository configured.');
    seedRepo = await askSeedRepo(null, nonInteractive);
    await configManager.set('seed-repo', seedRepo);
    logger.info(`✓ Configured seed-repo: ${seedRepo}\n`);
  }

  const githubClient = deps.githubClient || new GitHubClient({ cwd });

  // Check if directory is a git repository
  const isGitRepo = await fs.access(path.join(cwd, '.git')).then(() => true).catch(() => false);
  if (!isGitRepo) {
    logger.warn('Current directory is not a git repository.');
  }

  // Ask user which components to update
  logger.info('r3nd — Update components from seed repository\n');
  const selectedOptions = await askUpdateOptions(nonInteractive);
  
  if (selectedOptions.length === 0) {
    logger.warn('No options selected. Nothing to update.');
    return;
  }

  logger.info(`\nSelected: ${selectedOptions.join(', ')}\n`);

  // Fetch file tree from GitHub
  logger.info('Fetching file list from GitHub (seed repo)...');
  const tree = await githubClient.getTree();

  // Process selected options
  if (selectedOptions.includes('templates')) {
    await updateTemplates(cwd, tree, githubClient);
  }

  // Fetch agents if needed for cursor, vscode, or agents themselves
  let agents = [];
  if (selectedOptions.includes('agents') || selectedOptions.includes('cursor') || selectedOptions.includes('vscode')) {
    agents = await fetchAndParseAgents(tree, githubClient);
  }

  if (selectedOptions.includes('agents')) {
    await updateAgents(cwd, tree, githubClient);
  }

  if (selectedOptions.includes('github')) {
    await updateGitHubWorkflows(cwd, tree, githubClient);
  }

  if (selectedOptions.includes('cursor')) {
    await updateCursorCommands(cwd, agents);
  }

  if (selectedOptions.includes('vscode')) {
    await updateVSCodeChatModes(cwd, agents);
  }

  logger.info('\nUpdate complete.');
}

/**
 * Update template files
 */
async function updateTemplates(cwd, tree, githubClient) {
  logger.info('\n📋 Updating templates...');
  
  const templateFiles = tree.filter(item => 
    item.type === 'blob' && item.path.startsWith('.github/templates/')
  );

  if (templateFiles.length === 0) {
    logger.info('  No template files found.');
    return;
  }

  for (const file of templateFiles) {
    try {
      const buffer = await githubClient.fetchRaw(file.path);
      await writeBuffer(cwd, file.path, buffer, { overwrite: true });
      logger.info(`  Updated: ${file.path}`);
    } catch (err) {
      logger.error(`  Failed to update ${file.path}:`, err && err.message ? err.message : err);
    }
  }
}

/**
 * Update agent files
 */
async function updateAgents(cwd, tree, githubClient) {
  logger.info('\n🤖 Updating agents...');
  
  const agentFiles = tree.filter(item => 
    item.type === 'blob' && item.path.startsWith('.github/agents/') && item.path.endsWith('.agent.md')
  );

  if (agentFiles.length === 0) {
    logger.warn('  No agent files found in seed repo.');
    return;
  }

  for (const file of agentFiles) {
    try {
      const buffer = await githubClient.fetchRaw(file.path);
      await writeBuffer(cwd, file.path, buffer, { overwrite: true });
      logger.info(`  Updated: ${file.path}`);
    } catch (err) {
      logger.error(`  Failed to update ${file.path}:`, err && err.message ? err.message : err);
    }
  }
}

/**
 * Update GitHub workflow files
 */
async function updateGitHubWorkflows(cwd, tree, githubClient) {
  logger.info('\n📦 Updating GitHub workflows...');
  
  const workflowFiles = tree.filter(item => 
    item.type === 'blob' && item.path.startsWith('.github/workflows/')
  );

  if (workflowFiles.length === 0) {
    logger.warn('  No workflow files found in seed repo.');
    return;
  }

  for (const file of workflowFiles) {
    try {
      const buffer = await githubClient.fetchRaw(file.path);
      await writeBuffer(cwd, file.path, buffer, { overwrite: true });
      logger.info(`  Updated: ${file.path}`);
    } catch (err) {
      logger.error(`  Failed to update ${file.path}:`, err && err.message ? err.message : err);
    }
  }
}

/**
 * Fetch and parse all agent files
 */
async function fetchAndParseAgents(tree, githubClient) {
  const agentFiles = tree.filter(item => 
    item.type === 'blob' && item.path.startsWith('.github/agents/') && item.path.endsWith('.agent.md')
  );

  const agents = [];
  for (const file of agentFiles) {
    try {
      const buffer = await githubClient.fetchRaw(file.path);
      const content = buffer.toString('utf-8');
      const agent = parseAgentFile(content);
      agent.originalPath = file.path;
      agents.push(agent);
    } catch (err) {
      logger.error(`  Failed to parse agent ${file.path}:`, err && err.message ? err.message : err);
    }
  }

  return agents;
}

/**
 * Update Cursor command files for each agent
 */
async function updateCursorCommands(cwd, agents) {
  logger.info('\n📝 Updating Cursor commands...');
  
  const cursorCommandsDir = path.join(cwd, '.cursor', 'commands');
  await ensureDir(cursorCommandsDir);

  for (const agent of agents) {
    try {
      const commandContent = generateCursorCommand(agent);
      const commandPath = path.join('.cursor', 'commands', `${agent.name}.md`);
      await writeBuffer(cwd, commandPath, Buffer.from(commandContent, 'utf-8'), { overwrite: true });
      logger.info(`  Updated: ${commandPath}`);
    } catch (err) {
      logger.error(`  Failed to update command for ${agent.name}:`, err && err.message ? err.message : err);
    }
  }
}

/**
 * Update VSCode chat mode files for each agent (Copilot personas)
 */
async function updateVSCodeChatModes(cwd, agents) {
  logger.info('\n📄 Updating VSCode Copilot chat modes...');
  
  const chatModesDir = path.join(cwd, '.github', 'chatmodes');
  await ensureDir(chatModesDir);

  for (const agent of agents) {
    try {
      const chatModeContent = generateVSCodeChatMode(agent);
      const chatModePath = path.join('.github', 'chatmodes', `${agent.name}.chatmode.md`);
      await writeBuffer(cwd, chatModePath, Buffer.from(chatModeContent, 'utf-8'), { overwrite: true });
      logger.info(`  Updated: ${chatModePath}`);
    } catch (err) {
      logger.error(`  Failed to update chat mode for ${agent.name}:`, err && err.message ? err.message : err);
    }
  }
}

module.exports = { runUpdate };
