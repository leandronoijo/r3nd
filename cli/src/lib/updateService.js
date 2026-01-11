const path = require('path');
const fs = require('fs').promises;
const YAML = require('yaml');

const { GitHubClient } = require('./github/githubClient');
const { writeBuffer, ensureDir } = require('./fs/fileWriter');
const { askUpdateOptions, askSeedRepo, askSpecDirName } = require('./ui/prompts');
const { resolveTemplate, createGitHubFileReader } = require('./templateResolver');
const { ConfigManager } = require('./config/configManager');
const { rewriteSpecDirBuffer, rewriteSpecDirContent } = require('./utils/specDirRewrite');
const { copyInstructionsToGitHub } = require('./fs/seedCopier');
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

  // Get spec directory name from config (defaults to 'r3nd')
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

  // Fetch seed repo's spec-dir-name configuration
  let seedSpecDirName = 'rnd'; // default for backwards compatibility
  try {
    const configBuffer = await githubClient.fetchRaw('r3nd.yaml');
    const configContent = configBuffer.toString('utf-8');
    const seedConfig = YAML.parse(configContent) || {};
    seedSpecDirName = seedConfig['spec-dir-name'] || 'rnd';
  } catch (err) {
    // If r3nd.yaml doesn't exist in seed repo, use default 'rnd'
    logger.debug('No r3nd.yaml in seed repo, using default "rnd"');
  }

  // Process selected options
  if (selectedOptions.includes('templates')) {
    await updateTemplates(cwd, tree, githubClient, specDirName, seedSpecDirName);
  }

  if (selectedOptions.includes('agents')) {
    await updateAgentPersonas(cwd, tree, githubClient, specDirName, seedSpecDirName);
  }

  if (selectedOptions.includes('github')) {
    await updateGitHubWorkflows(cwd, tree, githubClient, specDirName, seedSpecDirName);
    // Also update composed GitHub Copilot agent files
    await updateComposedAgents(cwd, tree, githubClient, '.github/agents', '.agent.md', specDirName, seedSpecDirName);
  }

  if (selectedOptions.includes('cursor')) {
    await updateComposedAgents(cwd, tree, githubClient, '.cursor/commands', '.md', specDirName, seedSpecDirName);
  }

  if (selectedOptions.includes('vscode')) {
    await updateComposedAgents(cwd, tree, githubClient, '.github/chatmodes', '.chatmode.md', specDirName, seedSpecDirName);
  }

  // If GitHub or VSCode is selected, copy instructions from spec-dir to .github/instructions
  if (selectedOptions.includes('github') || selectedOptions.includes('vscode')) {
    await copyInstructionsToGitHub(cwd, specDirName, { nonInteractive });
  }

  logger.info('\nUpdate complete.');
}

/**
 * Update template files
 */
async function updateTemplates(cwd, tree, githubClient, specDirName, seedSpecDirName = 'rnd') {
  logger.info('\n📋 Updating templates...');
  
  const seedTemplatesPath = `${seedSpecDirName}/templates/`;
  const templateFiles = tree.filter(item => 
    item.type === 'blob' && item.path.startsWith(seedTemplatesPath)
  );

  if (templateFiles.length === 0) {
    logger.info('  No template files found.');
    return;
  }

  for (const file of templateFiles) {
    try {
      const buffer = await githubClient.fetchRaw(file.path);
      // Map from seed repo path to local path
      const relativePath = file.path.substring(seedTemplatesPath.length);
      const localPath = `${specDirName}/templates/${relativePath}`;
      
      const rewritten = rewriteSpecDirBuffer(buffer, file.path, ['rnd', 'r3nd', seedSpecDirName], specDirName);
      await writeBuffer(cwd, localPath, rewritten.buffer, { overwrite: true });
      logger.info(`  Updated: ${localPath}`);
    } catch (err) {
      logger.error(`  Failed to update ${file.path}:`, err && err.message ? err.message : err);
    }
  }
}

/**
 * Update agent persona files from seed repo to local repo
 * @param {string} cwd - Current working directory
 * @param {Array} tree - GitHub tree
 * @param {GitHubClient} githubClient - GitHub client instance
 * @param {string} specDirName - Local spec directory name (e.g., 'r3nd', 'rnd')
 * @param {string} seedSpecDirName - Seed repo's spec directory name (e.g., 'r3nd', 'rnd')
 */
async function updateAgentPersonas(cwd, tree, githubClient, specDirName, seedSpecDirName) {
  logger.info('\n🤖 Updating agent personas...');
  
  // Read from seed repo's configured spec directory
  const seedAgentsPath = `${seedSpecDirName}/agents/`;
  const agentFiles = tree.filter(item => 
    item.type === 'blob' && item.path.startsWith(seedAgentsPath) && item.path.endsWith('.md')
  );

  if (agentFiles.length === 0) {
    logger.warn('  No agent persona files found in seed repo.');
    return;
  }

  for (const file of agentFiles) {
        try {
      const buffer = await githubClient.fetchRaw(file.path);
      // Map from seed repo path to local path
      const relativePath = file.path.substring(seedAgentsPath.length);
      const localPath = `${specDirName}/agents/${relativePath}`;

      // Rewrite internal spec-dir references using seed spec dir name
      const rewritten = rewriteSpecDirBuffer(buffer, file.path, ['rnd', 'r3nd', seedSpecDirName], specDirName);
      await writeBuffer(cwd, localPath, rewritten.buffer, { overwrite: true });
      logger.info(`  Updated: ${localPath}`);
    } catch (err) {
      logger.error(`  Failed to update ${file.path}:`, err && err.message ? err.message : err);
    }
  }
}

/**
 * Update GitHub workflow files
 */
async function updateGitHubWorkflows(cwd, tree, githubClient, specDirName, seedSpecDirName) {
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
      // Rewrite spec directory references
      const rewritten = rewriteSpecDirBuffer(buffer, file.path, ['rnd', 'r3nd'], specDirName);
      await writeBuffer(cwd, file.path, rewritten.buffer, { overwrite: true });
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
 * @param {string} specDirName - Local spec directory name (e.g., 'r3nd', 'rnd')
 * @param {string} seedSpecDirName - Seed repo's spec directory name (e.g., 'r3nd', 'rnd')
 */
async function updateComposedAgents(cwd, tree, githubClient, wrapperDir, extension, specDirName, seedSpecDirName) {
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
  
  // Fetch all agent files from seed repo's configured spec directory
  const seedAgentsPath = `${seedSpecDirName}/agents/`;
  const personaFiles = tree.filter(item => 
    item.type === 'blob' && item.path.startsWith(seedAgentsPath)
  );
  
  for (const file of personaFiles) {
    try {
      const buffer = await githubClient.fetchRaw(file.path);
      
      // Store in cache with both seed repo path and local path for resolution flexibility
      fileCache.set(file.path, buffer);
      
      // Also map to local path so templates can reference either rnd/agents or specDirName/agents
      const relativePath = file.path.substring(seedAgentsPath.length);
      const localPath = `${specDirName}/agents/${relativePath}`;
      fileCache.set(localPath, buffer);
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
      const rewritten = rewriteSpecDirContent(composedContent, [seedSpecDirName], specDirName);
      
      // Replace spec directory references from seed repo to local spec directory
      // This handles cases where the seed repo uses a different spec-dir-name (e.g., 'rnd')
      // and the local repo uses a different one (e.g., 'r3nd')
      let finalContent = rewritten.content;
      if (seedSpecDirName !== specDirName) {
        // Replace patterns like "rnd/agents/", "rnd/product_specs/", "rnd/tech_specs/", "rnd/build_plans/"
        const specDirPattern = new RegExp(`\\b${seedSpecDirName}/`, 'g');
        finalContent = finalContent.replace(specDirPattern, `${specDirName}/`);
      }
      
      // Write composed file
      await writeBuffer(cwd, file.path, Buffer.from(finalContent, 'utf-8'), { overwrite: true });
      logger.info(`  Updated: ${file.path}`);
    } catch (err) {
      logger.error(`  Failed to update ${file.path}:`, err && err.message ? err.message : err);
    }
  }
}

module.exports = { runUpdate };
