const path = require('path');
const fs = require('fs').promises;
const { execSync } = require('child_process');
const YAML = require('yaml');

const { GitHubClient } = require('./github/githubClient');
const { writeBuffer, ensureDir } = require('./fs/fileWriter');
const { askInitOptions, askSeedRepo } = require('./ui/prompts');
const { ConfigManager } = require('./config/configManager');
const { resolveTemplate, createGitHubFileReader } = require('./templateResolver');
const { rewriteSpecDirBuffer, rewriteSpecDirContent } = require('./utils/specDirRewrite');
const logger = require('./utils/logger');

/**
 * Legacy function for backwards compatibility - migrate old agent files
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
 * Migrate legacy agent file to new rnd/agents structure
 * @param {string} content - Legacy agent file content with frontmatter
 * @returns {string} Platform-agnostic agent persona content (without frontmatter)
 */
function migrateLegacyAgent(content) {
  const parsed = parseAgentFile(content);
  return parsed.content;
}

async function runInit(opts = {}, deps = {}) {
  const cwd = opts.cwd || process.cwd();
  const nonInteractive = !!opts.nonInteractive;
  
  // Initialize config manager
  const configManager = new ConfigManager(cwd);
  const specDirName = await configManager.getSpecDirName();
  
  // Check if seed-repo is configured, prompt if not
  let seedRepo = await configManager.get('seed-repo');
  if (!seedRepo) {
    logger.info('No seed repository configured.');
    seedRepo = await askSeedRepo(null, nonInteractive);
    await configManager.set('seed-repo', seedRepo);
    logger.info(`✓ Configured seed-repo: ${seedRepo}\n`);
  }

  const githubClient = deps.githubClient || new GitHubClient({ cwd });

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

  logger.info(`\nSelected: ${selectedOptions.join(', ') || 'None (agents only)'}\n`);

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
        const rewritten = rewriteSpecDirBuffer(buffer, remotePath, ['rnd'], specDirName);
        await writeBuffer(cwd, remotePath, rewritten.buffer, { overwrite: true });
        logger.info(`Copied: ${remotePath}`);
      } catch (err) {
        logger.error(`Failed to copy ${remotePath}:`, err && err.message ? err.message : err);
      }
    }
  }

  // Copy platform-agnostic agent personas from rnd/agents
  await copyAgentPersonas(cwd, tree, githubClient, specDirName);

  // Process selected options (these are optional)
  if (selectedOptions.includes('github')) {
    await copyGitHubWorkflows(cwd, tree, githubClient);
    // Compose GitHub Copilot agent files from wrappers + personas
    await composeAgentFiles(cwd, tree, githubClient, '.github/agents', '.agent.md', specDirName);
  }

  if (selectedOptions.includes('cursor')) {
    // Compose Cursor command files from wrappers + personas
    await composeAgentFiles(cwd, tree, githubClient, '.cursor/commands', '.md', specDirName);
  }

  if (selectedOptions.includes('vscode')) {
    // Compose VSCode chat mode files from wrappers + personas
    await composeAgentFiles(cwd, tree, githubClient, '.github/chatmodes', '.chatmode.md', specDirName);
  }

  // Also copy templates if any option was selected
  await copyTemplates(cwd, tree, githubClient, specDirName);

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
 * Copy platform-agnostic agent persona files from rnd/agents
 */
async function copyAgentPersonas(cwd, tree, githubClient, specDirName) {
  logger.info('\n🤖 Copying agent personas...');
  
  const agentFiles = tree.filter(item => 
    item.type === 'blob' && item.path.startsWith('rnd/agents/') && item.path.endsWith('.md')
  );

  if (agentFiles.length === 0) {
    logger.warn('No agent persona files found in seed repo.');
    return;
  }

  for (const file of agentFiles) {
    try {
      const buffer = await githubClient.fetchRaw(file.path);
      const rewritten = rewriteSpecDirBuffer(buffer, file.path, ['rnd'], specDirName);
      await writeBuffer(cwd, file.path, rewritten.buffer, { overwrite: true });
      logger.info(`  Copied: ${file.path}`);
    } catch (err) {
      logger.error(`  Failed to copy ${file.path}:`, err && err.message ? err.message : err);
    }
  }
}

/**
 * Compose agent files from platform-specific wrappers and rnd/agents personas
 * @param {string} cwd - Current working directory
 * @param {Array} tree - GitHub tree
 * @param {GitHubClient} githubClient - GitHub client instance
 * @param {string} wrapperDir - Directory containing wrapper templates (e.g., '.github/agents')
 * @param {string} extension - File extension to filter (e.g., '.agent.md')
 */
async function composeAgentFiles(cwd, tree, githubClient, wrapperDir, extension, specDirName) {
  const platformName = wrapperDir === '.github/agents' ? 'GitHub Copilot' : 
                       wrapperDir === '.cursor/commands' ? 'Cursor' : 'VSCode';
  logger.info(`\n📝 Composing ${platformName} agent files...`);
  
  // Find all wrapper template files
  const wrapperFiles = tree.filter(item => 
    item.type === 'blob' && 
    item.path.startsWith(wrapperDir + '/') && 
    item.path.endsWith(extension)
  );

  if (wrapperFiles.length === 0) {
    logger.warn(`  No wrapper templates found in ${wrapperDir}`);
    return;
  }

  // Build a cache of all files from tree for template resolution
  const fileCache = new Map();
  
  // Fetch all rnd/agents files into cache
  const personaFiles = tree.filter(item => 
    item.type === 'blob' && item.path.startsWith('rnd/agents/')
  );
  
  for (const file of personaFiles) {
    try {
      const buffer = await githubClient.fetchRaw(file.path);
      fileCache.set(file.path, buffer);
    } catch (err) {
      logger.error(`  Failed to cache ${file.path}:`, err && err.message ? err.message : err);
    }
  }
  
  const fileReader = createGitHubFileReader(fileCache);
  
  // Ensure output directory exists
  await ensureDir(path.join(cwd, wrapperDir));

  // Process each wrapper template
  for (const file of wrapperFiles) {
    try {
      const wrapperBuffer = await githubClient.fetchRaw(file.path);
      const wrapperContent = wrapperBuffer.toString('utf-8');
      
      // Resolve template placeholders
      const composedContent = await resolveTemplate(wrapperContent, fileReader);
      const rewritten = rewriteSpecDirContent(composedContent, ['rnd'], specDirName);
      
      // Write composed file
      await writeBuffer(cwd, file.path, Buffer.from(rewritten.content, 'utf-8'), { overwrite: true });
      logger.info(`  Composed: ${file.path}`);
    } catch (err) {
      logger.error(`  Failed to compose ${file.path}:`, err && err.message ? err.message : err);
    }
  }
}

/**
 * Copy template files
 */
async function copyTemplates(cwd, tree, githubClient, specDirName) {
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
      const rewritten = rewriteSpecDirBuffer(buffer, file.path, ['rnd'], specDirName);
      await writeBuffer(cwd, file.path, rewritten.buffer, { overwrite: true });
      logger.info(`  Copied: ${file.path}`);
    } catch (err) {
      logger.error(`  Failed to copy ${file.path}:`, err && err.message ? err.message : err);
    }
  }
}

module.exports = { runInit, parseAgentFile, migrateLegacyAgent };
