const path = require('path');
const fs = require('fs').promises;

const { GitHubClient } = require('./github/githubClient');
const { writeBuffer, ensureDir } = require('./fs/fileWriter');
const { askUpdateOptions, askSeedRepo } = require('./ui/prompts');
const { resolveTemplate, createGitHubFileReader } = require('./templateResolver');
const { ConfigManager } = require('./config/configManager');
const { rewriteSpecDirBuffer, rewriteSpecDirContent } = require('./utils/specDirRewrite');
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

  const specDirName = await configManager.getSpecDirName();

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
    await updateTemplates(cwd, tree, githubClient, specDirName);
  }

  if (selectedOptions.includes('agents')) {
    await updateAgentPersonas(cwd, tree, githubClient, specDirName);
  }

  if (selectedOptions.includes('github')) {
    await updateGitHubWorkflows(cwd, tree, githubClient);
    // Also update composed GitHub Copilot agent files
    await updateComposedAgents(cwd, tree, githubClient, '.github/agents', '.agent.md', specDirName);
  }

  if (selectedOptions.includes('cursor')) {
    await updateComposedAgents(cwd, tree, githubClient, '.cursor/commands', '.md', specDirName);
  }

  if (selectedOptions.includes('vscode')) {
    await updateComposedAgents(cwd, tree, githubClient, '.github/chatmodes', '.chatmode.md', specDirName);
  }

  logger.info('\nUpdate complete.');
}

/**
 * Update template files
 */
async function updateTemplates(cwd, tree, githubClient, specDirName) {
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
      const rewritten = rewriteSpecDirBuffer(buffer, file.path, ['rnd'], specDirName);
      await writeBuffer(cwd, file.path, rewritten.buffer, { overwrite: true });
      logger.info(`  Updated: ${file.path}`);
    } catch (err) {
      logger.error(`  Failed to update ${file.path}:`, err && err.message ? err.message : err);
    }
  }
}

/**
 * Update agent persona files from rnd/agents
 */
async function updateAgentPersonas(cwd, tree, githubClient, specDirName) {
  logger.info('\n🤖 Updating agent personas...');
  
  const agentFiles = tree.filter(item => 
    item.type === 'blob' && item.path.startsWith('rnd/agents/') && item.path.endsWith('.md')
  );

  if (agentFiles.length === 0) {
    logger.warn('  No agent persona files found in seed repo.');
    return;
  }

  for (const file of agentFiles) {
    try {
      const buffer = await githubClient.fetchRaw(file.path);
      const rewritten = rewriteSpecDirBuffer(buffer, file.path, ['rnd'], specDirName);
      await writeBuffer(cwd, file.path, rewritten.buffer, { overwrite: true });
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
 * Update composed agent files from wrappers + personas
 * @param {string} cwd - Current working directory
 * @param {Array} tree - GitHub tree
 * @param {GitHubClient} githubClient - GitHub client instance
 * @param {string} wrapperDir - Directory containing wrapper templates
 * @param {string} extension - File extension to filter
 */
async function updateComposedAgents(cwd, tree, githubClient, wrapperDir, extension, specDirName) {
  const platformName = wrapperDir === '.github/agents' ? 'GitHub Copilot' : 
                       wrapperDir === '.cursor/commands' ? 'Cursor' : 'VSCode';
  logger.info(`\n📝 Updating ${platformName} agent files...`);
  
  // Check if the platform directory exists locally
  const dirExists = await fs.access(path.join(cwd, wrapperDir)).then(() => true).catch(() => false);
  if (!dirExists) {
    logger.info(`  ${wrapperDir} directory does not exist locally, skipping.`);
    return;
  }
  
  // Find wrapper templates
  const wrapperFiles = tree.filter(item => 
    item.type === 'blob' && 
    item.path.startsWith(wrapperDir + '/') && 
    item.path.endsWith(extension)
  );

  if (wrapperFiles.length === 0) {
    logger.warn(`  No wrapper templates found in ${wrapperDir}`);
    return;
  }

  // Build file cache for template resolution
  const fileCache = new Map();
  
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
      logger.info(`  Updated: ${file.path}`);
    } catch (err) {
      logger.error(`  Failed to update ${file.path}:`, err && err.message ? err.message : err);
    }
  }
}

module.exports = { runUpdate };
