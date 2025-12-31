const path = require('path');
const fs = require('fs').promises;
const { execSync } = require('child_process');
const YAML = require('yaml');

const { GitHubClient } = require('./github/githubClient');
const { writeBuffer, ensureDir } = require('./fs/fileWriter');
const { askInitOptions } = require('./ui/prompts');
const logger = require('./utils/logger');

/**
 * Parse agent markdown file to extract metadata and content
 * @param {string} content - Raw markdown content of agent file
 * @returns {Object} Parsed agent with name, description, tools, and content
 */
function parseAgentFile(content) {
  const lines = content.split('\n');
  let frontmatterStart = -1;
  let frontmatterEnd = -1;
  
  // Find frontmatter boundaries
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      if (frontmatterStart === -1) {
        frontmatterStart = i;
      } else {
        frontmatterEnd = i;
        break;
      }
    }
  }
  
  let metadata = {};
  
  // Parse YAML frontmatter if found
  if (frontmatterStart !== -1 && frontmatterEnd !== -1) {
    const frontmatterContent = lines.slice(frontmatterStart + 1, frontmatterEnd).join('\n');
    try {
      metadata = YAML.parse(frontmatterContent) || {};
    } catch (err) {
      // Fallback to defaults if YAML parsing fails
      metadata = {};
    }
  }
  
  const bodyStartLine = frontmatterEnd !== -1 ? frontmatterEnd + 1 : 0;
  const bodyContent = lines.slice(bodyStartLine).join('\n').trim();
  
  return {
    name: metadata.name || 'unknown',
    description: metadata.description || '',
    tools: metadata.tools || ['*'],
    content: bodyContent
  };
}

/**
 * Generate Cursor command file content from agent data
 * @param {Object} agent - Parsed agent object
 * @returns {string} Cursor command file content in .md format
 */
function generateCursorCommand(agent) {
  return `# ${agent.name}

${agent.description}

${agent.content}
`;
}

/**
 * Generate VSCode chat mode file content from agent data
 * @param {Object} agent - Parsed agent object
 * @returns {string} VSCode chatmode file content in .chatmode.md format
 */
function generateVSCodeChatMode(agent) {
  const tools = Array.isArray(agent.tools) ? agent.tools : (agent.tools ? [agent.tools] : ['*']);
  const toolsStr = tools.map(t => `"${t}"`).join(', ');
  
  return `---
description: "${agent.description}"
tools: [${toolsStr}]
---

${agent.content}
`;
}

async function runInit(opts = {}, deps = {}) {
  const cwd = opts.cwd || process.cwd();
  const nonInteractive = !!opts.nonInteractive;
  const githubClient = deps.githubClient || new GitHubClient({});

  // Ensure git repo
  const isGitRepo = await fs.access(path.join(cwd, '.git')).then(() => true).catch(() => false);
  if (!isGitRepo) {
    logger.info('Initializing git repository...');
    execSync('git init', { cwd });
  } else {
    logger.info('Git repository already initialized.');
  }

  // Ask user which components to initialize
  logger.info('r3nd — repository initializer\n');
  const selectedOptions = await askInitOptions(nonInteractive);
  
  if (selectedOptions.length === 0) {
    logger.warn('No options selected. Nothing to initialize.');
    return;
  }

  logger.info(`\nSelected: ${selectedOptions.join(', ')}\n`);

  // Fetch file tree from GitHub
  logger.info('Fetching file list from GitHub (seed repo)...');
  const tree = await githubClient.getTree();

  // Always copy common files
  const commonFiles = [
    '.gitignore',
    '.github/instructions/e2e-testing.instructions.md',
    '.github/instructions/testing.instructions.md',
  ];

  // Copy common files
  for (const remotePath of commonFiles) {
    const exists = tree.some(item => item.path === remotePath && item.type === 'blob');
    if (exists) {
      try {
        const buffer = await githubClient.fetchRaw(remotePath);
        await writeBuffer(cwd, remotePath, buffer, { overwrite: true });
        logger.info(`Copied: ${remotePath}`);
      } catch (err) {
        logger.error(`Failed to copy ${remotePath}:`, err && err.message ? err.message : err);
      }
    }
  }

  // Process selected options
  if (selectedOptions.includes('github')) {
    await copyGitHubWorkflows(cwd, tree, githubClient);
  }

  // Fetch agents if needed for cursor or vscode
  let agents = [];
  if (selectedOptions.includes('cursor') || selectedOptions.includes('vscode')) {
    agents = await fetchAndParseAgents(tree, githubClient);
  }

  if (selectedOptions.includes('cursor')) {
    await createCursorCommands(cwd, agents);
  }

  if (selectedOptions.includes('vscode')) {
    await createVSCodeChatModes(cwd, agents);
  }

  // Also copy templates if any option was selected
  await copyTemplates(cwd, tree, githubClient);

  logger.info('\nInit complete.');
}

/**
 * Copy GitHub workflow files
 */
async function copyGitHubWorkflows(cwd, tree, githubClient) {
  logger.info('\n📦 Copying GitHub workflows...');
  
  const workflowFiles = tree.filter(item => 
    item.type === 'blob' && item.path.startsWith('.github/workflows/')
  );

  if (workflowFiles.length === 0) {
    logger.warn('No workflow files found in seed repo.');
    return;
  }

  for (const file of workflowFiles) {
    try {
      const buffer = await githubClient.fetchRaw(file.path);
      await writeBuffer(cwd, file.path, buffer, { overwrite: true });
      logger.info(`  Copied: ${file.path}`);
    } catch (err) {
      logger.error(`  Failed to copy ${file.path}:`, err && err.message ? err.message : err);
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
      logger.error(`Failed to parse agent ${file.path}:`, err && err.message ? err.message : err);
    }
  }

  return agents;
}

/**
 * Create Cursor command files for each agent
 */
async function createCursorCommands(cwd, agents) {
  logger.info('\n📝 Creating Cursor commands...');
  
  const cursorCommandsDir = path.join(cwd, '.cursor', 'commands');
  await ensureDir(cursorCommandsDir);

  for (const agent of agents) {
    try {
      const commandContent = generateCursorCommand(agent);
      const commandPath = path.join('.cursor', 'commands', `${agent.name}.md`);
      await writeBuffer(cwd, commandPath, Buffer.from(commandContent, 'utf-8'), { overwrite: true });
      logger.info(`  Created: ${commandPath}`);
    } catch (err) {
      logger.error(`  Failed to create command for ${agent.name}:`, err && err.message ? err.message : err);
    }
  }
}

/**
 * Create VSCode chat mode files for each agent (Copilot personas)
 */
async function createVSCodeChatModes(cwd, agents) {
  logger.info('\n📄 Creating VSCode Copilot chat modes...');
  
  const chatModesDir = path.join(cwd, '.github', 'chatmodes');
  await ensureDir(chatModesDir);

  for (const agent of agents) {
    try {
      const chatModeContent = generateVSCodeChatMode(agent);
      const chatModePath = path.join('.github', 'chatmodes', `${agent.name}.chatmode.md`);
      await writeBuffer(cwd, chatModePath, Buffer.from(chatModeContent, 'utf-8'), { overwrite: true });
      logger.info(`  Created: ${chatModePath}`);
    } catch (err) {
      logger.error(`  Failed to create chat mode for ${agent.name}:`, err && err.message ? err.message : err);
    }
  }
}

/**
 * Copy template files
 */
async function copyTemplates(cwd, tree, githubClient) {
  logger.info('\n📋 Copying templates...');
  
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
      logger.info(`  Copied: ${file.path}`);
    } catch (err) {
      logger.error(`  Failed to copy ${file.path}:`, err && err.message ? err.message : err);
    }
  }
}

module.exports = { runInit, parseAgentFile, generateCursorCommand, generateVSCodeChatMode };
