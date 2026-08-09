const path = require('path');
const fs = require('fs').promises;
const { execSync } = require('child_process');
const YAML = require('yaml');

const { GitHubClient } = require('./github/githubClient');
const { 
  copyAgentPersonas,
  copyBuildPlans,
  copyTaskSkills,
  syncPlatformAsset,
  copyTemplates, 
  copyCommonFiles
} = require('./fs/seedCopier');
const {
  fetchSeedSpecDirName,
  discoverAvailableOverlays,
  createEffectiveSeedView,
  applySelectedOverlays
} = require('./overlays/overlaySeedService');
const { askInitOptions, askOverlays, askSeedRepo, askSpecDirName } = require('./ui/prompts');
const { ConfigManager } = require('./config/configManager');
const {
  getPlatformAsset,
  normalizePlatformAssetSelection
} = require('./platformAssetRegistry');
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
  const selectedOptions = normalizePlatformAssetSelection(await askInitOptions(nonInteractive));

  logger.info(`\nSelected: ${selectedOptions.join(', ') || 'None'}\n`);

  // Fetch file tree from GitHub
  logger.info('Fetching file list from GitHub (seed repo)...');
  const tree = await githubClient.getTree();
  
  // Fetch seed repo's spec-dir-name configuration
  const seedSpecDirName = await fetchSeedSpecDirName(githubClient);
  const availableOverlays = discoverAvailableOverlays(tree);
  const currentOverlays = await configManager.getOverlays();
  const selectedOverlays = await askOverlays(currentOverlays, availableOverlays, nonInteractive);
  await configManager.set('overlays', selectedOverlays);
  const effectiveSeed = createEffectiveSeedView(tree, githubClient, seedSpecDirName, selectedOverlays);

  // Copy common files (gitignore)
  await copyCommonFiles(cwd, tree, githubClient, specDirName, { nonInteractive });

  // Materialize effective shared agents after overlay precedence is resolved
  await copyAgentPersonas(cwd, effectiveSeed.tree, effectiveSeed.githubClient, specDirName, seedSpecDirName, { nonInteractive });

  // Materialize effective canonical task skills as fully composed local files
  await copyTaskSkills(cwd, effectiveSeed.tree, effectiveSeed.githubClient, specDirName, seedSpecDirName, { nonInteractive });

  // Materialize effective build plans
  await copyBuildPlans(cwd, effectiveSeed.tree, effectiveSeed.githubClient, specDirName, seedSpecDirName, { nonInteractive });

  for (const assetKey of selectedOptions) {
    const asset = getPlatformAsset(assetKey);
    if (!asset) {
      continue;
    }
    await syncPlatformAsset(cwd, effectiveSeed.tree, effectiveSeed.githubClient, asset, specDirName, seedSpecDirName, { nonInteractive });
  }

  // Also copy templates if any option was selected
  await copyTemplates(cwd, effectiveSeed.tree, effectiveSeed.githubClient, specDirName, seedSpecDirName, { nonInteractive });

  await applySelectedOverlays(cwd, effectiveSeed.tree, effectiveSeed.githubClient, specDirName, seedSpecDirName, selectedOverlays, {
    nonInteractive,
    overwriteExisting: true,
    skipSpecSubdirs: ['agents', 'skills', 'templates', 'build_plans']
  });

  logger.info('\nInit complete.');
}

module.exports = { runInit, parseAgentFile, migrateLegacyAgent };
