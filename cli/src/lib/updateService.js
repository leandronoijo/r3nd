const path = require('path');
const fs = require('fs').promises;

const { GitHubClient } = require('./github/githubClient');
const { askUpdateOptions, askSeedRepo } = require('./ui/prompts');
const { ConfigManager } = require('./config/configManager');
const {
  copyAgentPersonas,
  copyTaskSkills,
  copyVendorSkillAddons,
  copyTemplates,
  syncPlatformAsset
} = require('./fs/seedCopier');
const { fetchSeedSpecDirName } = require('./overlays/overlaySeedService');
const {
  getPlatformAsset,
  normalizePlatformAssetSelection
} = require('./platformAssetRegistry');
const logger = require('./utils/logger');

async function runUpdate(opts = {}, deps = {}) {
  const cwd = opts.cwd || process.cwd();
  const nonInteractive = !!opts.nonInteractive;

  const configManager = new ConfigManager(cwd);

  let seedRepo = await configManager.get('seed-repo');
  if (!seedRepo) {
    logger.info('No seed repository configured.');
    seedRepo = await askSeedRepo(null, nonInteractive);
    await configManager.set('seed-repo', seedRepo);
    logger.info(`✓ Configured seed-repo: ${seedRepo}\n`);
  }

  const specDirName = await configManager.getSpecDirName();
  const githubClient = deps.githubClient || new GitHubClient({ cwd });

  const isGitRepo = await fs.access(path.join(cwd, '.git')).then(() => true).catch(() => false);
  if (!isGitRepo) {
    logger.warn('Current directory is not a git repository.');
  }

  logger.info('r3nd — Update components from seed repository\n');
  const selectedOptions = await askUpdateOptions(nonInteractive);

  if (selectedOptions.length === 0) {
    logger.warn('No options selected. Nothing to update.');
    return;
  }

  logger.info(`\nSelected: ${selectedOptions.join(', ')}\n`);

  logger.info('Fetching file list from GitHub (seed repo)...');
  const tree = await githubClient.getTree();
  const seedSpecDirName = await fetchSeedSpecDirName(githubClient);
  const selectedPlatformAssets = normalizePlatformAssetSelection(selectedOptions);

  if (selectedOptions.includes('templates')) {
    await copyTemplates(cwd, tree, githubClient, specDirName, seedSpecDirName, { overwriteExisting: true });
  }

  if (selectedOptions.includes('skills')) {
    await copyTaskSkills(cwd, tree, githubClient, specDirName, seedSpecDirName, { overwriteExisting: true });
    await copyVendorSkillAddons(cwd, tree, githubClient, specDirName, seedSpecDirName, { overwriteExisting: true });
    await copyAgentPersonas(cwd, tree, githubClient, specDirName, seedSpecDirName, { overwriteExisting: true });
  }

  for (const assetKey of selectedPlatformAssets) {
    const asset = getPlatformAsset(assetKey);
    if (!asset) {
      continue;
    }
    await syncPlatformAsset(cwd, tree, githubClient, asset, specDirName, seedSpecDirName, { overwriteExisting: true });
  }

  logger.info('\nUpdate complete.');
}

module.exports = { runUpdate };
