const path = require('path');
const fs = require('fs').promises;
const { execSync } = require('child_process');

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
  const metadata = {};
  let inFrontmatter = false;
  let frontmatterEnd = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true;
      } else {
        frontmatterEnd = i + 1;
        break;
      }
    } else if (inFrontmatter) {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        let value = match[2].trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        // Parse array-like values
        if (value.startsWith('[') && value.endsWith(']')) {
          value = value.slice(1, -1).split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        }
        metadata[match[1]] = value;
      }
    }
  }
  
  const bodyContent = lines.slice(frontmatterEnd).join('\n').trim();
  
  return {
    name: metadata.name || 'unknown',
    description: metadata.description || '',
    tools: metadata.tools || ['*'],
    content: bodyContent
  };
}

/**
 * Generate Cursor rule file content from agent data
 * @param {Object} agent - Parsed agent object
 * @returns {string} Cursor rule file content in .mdc format
 */
function generateCursorRule(agent) {
  const tools = Array.isArray(agent.tools) ? agent.tools : [agent.tools];
  const toolsStr = tools.map(t => `"${t}"`).join(', ');
  
  return `---
description: "${agent.description}"
globs: ["**/*"]
alwaysApply: false
---

# ${agent.name}

${agent.content}
`;
}

/**
 * Generate VSCode copilot-instructions.md content from all agents
 * @param {Object[]} agents - Array of parsed agent objects
 * @returns {string} Combined copilot instructions content
 */
function generateVSCodeInstructions(agents) {
  let content = `# Copilot Custom Instructions

This file contains combined instructions from all r3nd agents. These instructions help GitHub Copilot understand the project conventions and provide better assistance.

`;

  for (const agent of agents) {
    content += `## ${agent.name}

**Description:** ${agent.description}

${agent.content}

---

`;
  }

  return content;
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
    await createCursorRules(cwd, agents);
  }

  if (selectedOptions.includes('vscode')) {
    await createVSCodeInstructions(cwd, agents);
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
 * Create Cursor rule files for each agent
 */
async function createCursorRules(cwd, agents) {
  logger.info('\n📝 Creating Cursor rules...');
  
  const cursorRulesDir = path.join(cwd, '.cursor', 'rules');
  await ensureDir(cursorRulesDir);

  for (const agent of agents) {
    try {
      const ruleContent = generateCursorRule(agent);
      const rulePath = path.join('.cursor', 'rules', `${agent.name}.mdc`);
      await writeBuffer(cwd, rulePath, Buffer.from(ruleContent, 'utf-8'), { overwrite: true });
      logger.info(`  Created: ${rulePath}`);
    } catch (err) {
      logger.error(`  Failed to create rule for ${agent.name}:`, err && err.message ? err.message : err);
    }
  }
}

/**
 * Create VSCode copilot-instructions.md with all agents
 */
async function createVSCodeInstructions(cwd, agents) {
  logger.info('\n📄 Creating VSCode Copilot instructions...');
  
  const vscodeDir = path.join(cwd, '.vscode');
  await ensureDir(vscodeDir);

  const content = generateVSCodeInstructions(agents);
  const instructionsPath = path.join('.vscode', 'copilot-instructions.md');
  
  try {
    await writeBuffer(cwd, instructionsPath, Buffer.from(content, 'utf-8'), { overwrite: true });
    logger.info(`  Created: ${instructionsPath}`);
  } catch (err) {
    logger.error(`  Failed to create ${instructionsPath}:`, err && err.message ? err.message : err);
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

module.exports = { runInit, parseAgentFile, generateCursorRule, generateVSCodeInstructions };
