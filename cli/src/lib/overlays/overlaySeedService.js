const path = require('path');
const YAML = require('yaml');

const { mapDestination } = require('./overlayRegistry');
const { writeWithOverwritePrompt, fileExists } = require('../fs/seedCopier');
const { ensureDir } = require('../fs/fileWriter');
const { rewriteSpecDirBuffer } = require('../utils/specDirRewrite');
const logger = require('../utils/logger');

/**
 * Fetch the seed repo's spec directory name from its configuration
 * @param {Object} githubClient - GitHub client instance
 * @returns {Promise<string>} Seed repo's spec directory name (defaults to 'rnd')
 */
async function fetchSeedSpecDirName(githubClient) {
  try {
    const configBuffer = await githubClient.fetchRaw('r3nd.yaml');
    const configContent = configBuffer.toString('utf-8');
    const seedConfig = YAML.parse(configContent) || {};
    return seedConfig['spec-dir-name'] || 'rnd';
  } catch (err) {
    // If r3nd.yaml doesn't exist in seed repo, use default 'rnd'
    logger.debug('No r3nd.yaml in seed repo, using default "rnd"');
    return 'rnd';
  }
}

/**
 * Copy overlay-specific files (instructions, build plans) from seed repo
 * @param {string} cwd - Current working directory
 * @param {Array} tree - GitHub tree
 * @param {Object} githubClient - GitHub client instance
 * @param {string} specDirName - Target spec directory name
 * @param {string} seedSpecDirName - Seed repo's spec directory name
 * @param {Object} options - Options
 * @param {string} options.backend - Backend framework name (e.g., 'nestjs', 'fast-api')
 * @param {string} options.frontend - Frontend framework name (e.g., 'vue', 'angular')
 * @param {boolean} options.nonInteractive - If true, skip files that exist
 */
async function copyOverlayFiles(cwd, tree, githubClient, specDirName, seedSpecDirName, { backend, frontend, nonInteractive = false } = {}) {
  logger.info('\n📦 Copying overlay files...');
  
  const prefixes = [];
  if (backend) prefixes.push(`overlays/backend/${backend}/`);
  if (frontend) prefixes.push(`overlays/frontend/${frontend}/`);
  
  if (prefixes.length === 0) {
    logger.info('  No overlays selected.');
    return;
  }
  
  const overlayFiles = tree.filter(item => {
    if (item.type !== 'blob') return false;
    return prefixes.some(p => item.path.startsWith(p));
  });
  
  if (overlayFiles.length === 0) {
    logger.warn('  No overlay files found for selected frameworks.');
    return;
  }
  
  for (const file of overlayFiles) {
    try {
      const mapped = mapDestination(file.path, backend, frontend, specDirName);
      const destPath = mapped || file.path;
      
      const buffer = await githubClient.fetchRaw(file.path);
      const rewritten = rewriteSpecDirBuffer(buffer, destPath, ['rnd', 'r3nd', seedSpecDirName], specDirName);
      
      const written = await writeWithOverwritePrompt(cwd, destPath, rewritten.buffer, { nonInteractive });
      if (written) {
        logger.info(`  Copied: ${file.path} -> ${destPath}`);
      }
    } catch (err) {
      logger.error(`  Failed to copy ${file.path}:`, err && err.message ? err.message : err);
    }
  }
}

/**
 * Ensure mandatory seed files exist, copying them if missing
 * @param {string} cwd - Current working directory
 * @param {Object} githubClient - GitHub client instance
 * @param {string} specDirName - Target spec directory name
 * @param {string} seedSpecDirName - Seed repo's spec directory name
 * @param {Array<string>} files - Remote paths of mandatory files
 * @param {Object} options - Options
 * @param {string} options.backend - Backend framework name
 * @param {string} options.frontend - Frontend framework name
 * @param {boolean} options.nonInteractive - If true, skip files that exist
 */
async function ensureMandatorySeedFiles(cwd, githubClient, specDirName, seedSpecDirName, files, { backend, frontend, nonInteractive = false } = {}) {
  const missing = [];
  
  for (const remotePath of files) {
    const rel = mapDestination(remotePath, backend, frontend, specDirName) || remotePath;
    const exists = await fileExists(path.join(cwd, rel));
    if (!exists) {
      missing.push({ remotePath, rel });
    }
  }
  
  if (missing.length === 0) return;
  
  logger.info(`\n📋 Fetching ${missing.length} mandatory file(s) from GitHub...`);
  
  for (const item of missing) {
    try {
      const buffer = await githubClient.fetchRaw(item.remotePath);
      const rewritten = rewriteSpecDirBuffer(buffer, item.rel, ['rnd', 'r3nd', seedSpecDirName], specDirName);
      const written = await writeWithOverwritePrompt(cwd, item.rel, rewritten.buffer, { nonInteractive });
      if (written) {
        logger.info(`  Copied: ${item.remotePath} -> ${item.rel}`);
      }
    } catch (err) {
      logger.error(`  Failed to copy ${item.remotePath}:`, err && err.message ? err.message : err);
    }
  }
}

/**
 * Ensure spec directories exist
 * @param {string} cwd - Current working directory
 * @param {string} specDirName - Spec directory name
 */
async function ensureSpecDirectories(cwd, specDirName) {
  const specDirs = [
    `${specDirName}/build_plans`,
    `${specDirName}/product_specs`,
    `${specDirName}/tech_specs`
  ];
  
  for (const r of specDirs) {
    await ensureDir(path.join(cwd, r));
    logger.info(`Ensured directory: ${r}`);
  }
  
  await ensureDir(path.join(cwd, '.github', 'instructions'));
  logger.info('Ensured directory: .github/instructions');
}

module.exports = {
  fetchSeedSpecDirName,
  copyOverlayFiles,
  ensureMandatorySeedFiles,
  ensureSpecDirectories,
};
