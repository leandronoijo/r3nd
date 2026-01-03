const path = require('path');
const fs = require('fs').promises;
const { execSync } = require('child_process');
const YAML = require('yaml');

const { GitHubClient } = require('./github/githubClient');
const { writeBuffer, ensureDir } = require('./fs/fileWriter');
const { askInitOptions, askSeedRepo, askSpecDirName } = require('./ui/prompts');
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
  
  // Check if seed-repo is configured, prompt if not
  let seedRepo = await configManager.get('seed-repo');
  if (!seedRepo) {
    logger.info('No seed repository configured.');
    seedRepo = await askSeedRepo(null, nonInteractive);
    await configManager.set('seed-repo', seedRepo);
    logger.info(`✓ Configured seed-repo: ${seedRepo}\n`);
  }

  // Check if spec-dir-name is configured, prompt if not
  let specDirName = await configManager.get('spec-dir-name');
  if (!specDirName) {
    logger.info('No spec directory name configured.');
    specDirName = await askSpecDirName(null, nonInteractive);
    await configManager.set('spec-dir-name', specDirName);
    logger.info(`✓ Configured spec-dir-name: ${specDirName}\n`);
  } else {
    // Even if configured, ask the user to confirm or change it during init
    const confirmedSpecDirName = await askSpecDirName(specDirName, nonInteractive);
    if (confirmedSpecDirName !== specDirName) {
      await configManager.set('spec-dir-name', confirmedSpecDirName);
      specDirName = confirmedSpecDirName;
      logger.info(`✓ Updated spec-dir-name: ${specDirName}\n`);
    }
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
        const rewritten = rewriteSpecDirBuffer(buffer, remotePath, ['rnd', 'r3nd'], specDirName);
        await writeBuffer(cwd, remotePath, rewritten.buffer, { overwrite: true });
        logger.info(`Copied: ${remotePath}`);
      } catch (err) {
        logger.error(`Failed to copy ${remotePath}:`, err && err.message ? err.message : err);
      }
    }
  }

  // Copy platform-agnostic agent personas from seed repo
  await copyAgentPersonas(cwd, tree, githubClient, specDirName, seedSpecDirName);

  // Process selected options (these are optional)
  if (selectedOptions.includes('github')) {
    await copyGitHubWorkflows(cwd, tree, githubClient, specDirName, seedSpecDirName);
    // Compose GitHub Copilot agent files from wrappers + personas
  await composeAgentFiles(cwd, tree, githubClient, '.github/agents', '.agent.md', specDirName, seedSpecDirName);
  }

  if (selectedOptions.includes('cursor')) {
    // Compose Cursor command files from wrappers + personas
  await composeAgentFiles(cwd, tree, githubClient, '.cursor/commands', '.md', specDirName, seedSpecDirName);
  }

  if (selectedOptions.includes('vscode')) {
    // Compose VSCode chat mode files from wrappers + personas
  await composeAgentFiles(cwd, tree, githubClient, '.github/chatmodes', '.chatmode.md', specDirName, seedSpecDirName);
  }

  // Also copy templates if any option was selected
  await copyTemplates(cwd, tree, githubClient, specDirName);

  logger.info('\nInit complete.');
}

/**
 * Copy GitHub workflow files
 */
async function copyGitHubWorkflows(cwd, tree, githubClient, specDirName, seedSpecDirName) {
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
      // Rewrite spec directory references
      const rewritten = rewriteSpecDirBuffer(buffer, file.path, ['rnd', 'r3nd'], specDirName);
      await writeBuffer(cwd, file.path, rewritten.buffer, { overwrite: true });
      logger.info(`  Copied: ${file.path}`);
    } catch (err) {
      logger.error(`  Failed to copy ${file.path}:`, err && err.message ? err.message : err);
    }
  }
}

/**
 * Copy platform-agnostic agent persona files from seed repo
 * @param {string} cwd - Current working directory
 * @param {Array} tree - GitHub tree
 * @param {GitHubClient} githubClient - GitHub client instance
 * @param {string} specDirName - Target spec directory name (e.g., 'r3nd', 'rnd')
 * @param {string} seedSpecDirName - Seed repo's spec directory name (e.g., 'r3nd', 'rnd')
 */
async function copyAgentPersonas(cwd, tree, githubClient, specDirName, seedSpecDirName) {
  logger.info('\n🤖 Copying agent personas...');
  
  // Read from seed repo's configured spec directory
  const seedAgentsPath = `${seedSpecDirName}/agents/`;
  const agentFiles = tree.filter(item => 
    item.type === 'blob' && item.path.startsWith(seedAgentsPath) && item.path.endsWith('.md')
  );

  if (agentFiles.length === 0) {
    logger.warn('No agent persona files found in seed repo.');
    return;
  }

  for (const file of agentFiles) {
    try {
      const buffer = await githubClient.fetchRaw(file.path);
      // Map from seed repo path to local path
      const relativePath = file.path.substring(seedAgentsPath.length);
      const localPath = `${specDirName}/agents/${relativePath}`;

      // Rewrite any spec-dir references from the seed repo to the local spec dir
      const rewritten = rewriteSpecDirBuffer(buffer, file.path, [seedSpecDirName], specDirName);
      await writeBuffer(cwd, localPath, rewritten.buffer, { overwrite: true });
      logger.info(`  Copied: ${localPath}`);
    } catch (err) {
      logger.error(`  Failed to copy ${file.path}:`, err && err.message ? err.message : err);
    }
  }
}

/**
 * Compose agent files from platform-specific wrappers and agent personas from seed repo
 * @param {string} cwd - Current working directory
 * @param {Array} tree - GitHub tree
 * @param {GitHubClient} githubClient - GitHub client instance
 * @param {string} wrapperDir - Directory containing wrapper templates (e.g., '.github/agents')
 * @param {string} extension - File extension to filter (e.g., '.agent.md')
 * @param {string} specDirName - Spec directory name for local references (e.g., 'r3nd', 'rnd')
 * @param {string} seedSpecDirName - Seed repo's spec directory name (e.g., 'r3nd', 'rnd')
 */
async function composeAgentFiles(cwd, tree, githubClient, wrapperDir, extension, specDirName, seedSpecDirName) {
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
