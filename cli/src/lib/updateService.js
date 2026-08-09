const path = require('path');
const fs = require('fs').promises;

const { GitHubClient } = require('./github/githubClient');
const { askUpdateOptions, askSeedRepo } = require('./ui/prompts');
const { ConfigManager } = require('./config/configManager');
const {
  copyAgentPersonas,
  copyBuildPlans,
  copyTaskSkills,
  copyTemplates,
  syncPlatformAsset
} = require('./fs/seedCopier');
const {
  fetchSeedSpecDirName,
  createEffectiveSeedView,
  applySelectedOverlays
} = require('./overlays/overlaySeedService');
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
  const selectedOverlays = await configManager.getOverlays();
  const effectiveSeed = createEffectiveSeedView(tree, githubClient, seedSpecDirName, selectedOverlays);
  const materializedOverlaySubdirs = ['agents', 'build_plans'];

  await copyAgentPersonas(cwd, effectiveSeed.tree, effectiveSeed.githubClient, specDirName, seedSpecDirName, { overwriteExisting: true });
  await copyBuildPlans(cwd, effectiveSeed.tree, effectiveSeed.githubClient, specDirName, seedSpecDirName, { overwriteExisting: true });

  if (selectedOptions.includes('templates')) {
    await copyTemplates(cwd, effectiveSeed.tree, effectiveSeed.githubClient, specDirName, seedSpecDirName, { overwriteExisting: true });
    materializedOverlaySubdirs.push('templates');
  }

  if (selectedOptions.includes('skills')) {
    await copyTaskSkills(cwd, effectiveSeed.tree, effectiveSeed.githubClient, specDirName, seedSpecDirName, { overwriteExisting: true });
    materializedOverlaySubdirs.push('skills');
  }

  for (const assetKey of selectedPlatformAssets) {
    const asset = getPlatformAsset(assetKey);
    if (!asset) {
      continue;
    }
    await syncPlatformAsset(cwd, effectiveSeed.tree, effectiveSeed.githubClient, asset, specDirName, seedSpecDirName, { overwriteExisting: true });
  }

  await applySelectedOverlays(cwd, effectiveSeed.tree, effectiveSeed.githubClient, specDirName, seedSpecDirName, selectedOverlays, {
    overwriteExisting: true,
    skipSpecSubdirs: materializedOverlaySubdirs
  });

  logger.info('\nUpdate complete.');
}

module.exports = { runUpdate };
