const path = require('path');
const fs = require('fs').promises;
const { execSync } = require('child_process');

const { GitHubClient } = require('./github/githubClient');
const { writeBuffer } = require('./fs/fileWriter');
const { fetchSeedSpecDirName } = require('./overlays/overlaySeedService');
const { askRemoteOrigin } = require('./ui/prompts');
const { ConfigManager } = require('./config/configManager');
const logger = require('./utils/logger');

const SEED_ROOT_FILES = ['README.md', 'LICENSE.md', '.gitignore', 'r3nd.yaml.example'];

function parseGitHubRemote(remoteUrl) {
  const m = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+?)(?:\.git)?$/);
  return m ? { owner: m[1], repo: m[2] } : null;
}

async function runGenerateSeed(opts = {}) {
  const cwd = opts.cwd || process.cwd();
  const nonInteractive = !!opts.nonInteractive;

  const remoteUrl = opts.remote || await askRemoteOrigin(nonInteractive);

  // Source: upstream seed repo (defaults to leandronoijo/r3nd@develop when no r3nd.yaml in cwd)
  const githubClient = new GitHubClient({ cwd });
  logger.info('Fetching file list from seed repo...');
  const tree = await githubClient.getTree();

  // Discover the spec dir name used by the source seed (e.g. 'r3nd')
  const seedSpecDirName = await fetchSeedSpecDirName(githubClient);

  // Copy overlays, the full spec dir, github workflows, and root files
  const seedPrefixes = ['overlays/', `${seedSpecDirName}/`, '.github/workflows/'];
  const filesToCopy = tree.filter(item => {
    if (item.type !== 'blob') return false;
    return seedPrefixes.some(p => item.path.startsWith(p)) || SEED_ROOT_FILES.includes(item.path);
  });

  logger.info(`Copying ${filesToCopy.length} files...`);
  for (const file of filesToCopy) {
    try {
      const buffer = await githubClient.fetchRaw(file.path);
      await writeBuffer(cwd, file.path, buffer, { overwrite: true });
      logger.info(`  ${file.path}`);
    } catch (err) {
      logger.error(`  Failed: ${file.path}: ${err && err.message ? err.message : err}`);
    }
  }

  // Write r3nd.yaml pointing to the new repo so consumers use this seed
  let seedRepo = `leandronoijo/r3nd@develop`;
  if (remoteUrl) {
    const parsed = parseGitHubRemote(remoteUrl);
    if (parsed) {
      seedRepo = `${parsed.owner}/${parsed.repo}@develop`;
    }
  }

  const configManager = new ConfigManager(cwd);
  await configManager.set('seed-repo', seedRepo);
  await configManager.set('spec-dir-name', seedSpecDirName);
  logger.info('\nCreated r3nd.yaml');

  const isGitRepo = await fs.access(path.join(cwd, '.git')).then(() => true).catch(() => false);
  if (!isGitRepo) {
    execSync('git init', { cwd });
    logger.info('Initialized git repository');
  }

  execSync('git add .', { cwd });
  execSync('git commit -m "chore: initialize r3nd seed"', { cwd });
  logger.info('Created initial commit');

  if (remoteUrl) {
    const parsed = parseGitHubRemote(remoteUrl);
    if (!parsed) {
      logger.warn('Could not parse remote URL as a GitHub URL — skipping push. Add the remote manually.');
    } else {
      try {
        execSync(`git remote add origin ${remoteUrl}`, { cwd });
      } catch {
        execSync(`git remote set-url origin ${remoteUrl}`, { cwd });
      }
      execSync('git push -u origin HEAD', { cwd });
      logger.info(`Pushed to ${remoteUrl}`);
    }
  }

  logger.info('\nSeed repository generated successfully!');
}

module.exports = { runGenerateSeed };
