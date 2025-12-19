const path = require('path');
const fs = require('fs').promises;
const { execSync } = require('child_process');

const { GitHubClient } = require('./github/githubClient');
const { writeBuffer } = require('./fs/fileWriter');
const logger = require('./utils/logger');

async function runInit(opts = {}, deps = {}) {
  const cwd = opts.cwd || process.cwd();
  const githubClient = deps.githubClient || new GitHubClient({});

  // Ensure git repo
  const isGitRepo = await fs.access(path.join(cwd, '.git')).then(() => true).catch(() => false);
  if (!isGitRepo) {
    logger.info('Initializing git repository...');
    execSync('git init', { cwd });
  } else {
    logger.info('Git repository already initialized.');
  }

  // Determine which files to copy from seed (only these prefixes)
  const prefixes = ['.github/agents/', '.github/templates/', '.github/workflows/'];
  const singleFiles = ['.gitignore'];

  logger.info('Fetching file list from GitHub (seed repo)...');
  const tree = await githubClient.getTree();

  const toCopy = tree.filter(item => {
    if (item.type !== 'blob') return false;
    const p = item.path;
    if (singleFiles.includes(p)) return true;
    return prefixes.some(pref => p.startsWith(pref));
  }).map(i => i.path);

  if (toCopy.length === 0) {
    logger.warn('No matching seed files found to copy.');
    return;
  }

  logger.info(`Found ${toCopy.length} files to copy. Downloading...`);
  for (const remotePath of toCopy) {
    try {
      const buffer = await githubClient.fetchRaw(remotePath);
      await writeBuffer(cwd, remotePath, buffer, { overwrite: true });
      logger.info(`Copied: ${remotePath}`);
    } catch (err) {
      logger.error(`Failed to copy ${remotePath}:`, err && err.message ? err.message : err);
    }
  }

  logger.info('Init complete.');
}

module.exports = { runInit };
