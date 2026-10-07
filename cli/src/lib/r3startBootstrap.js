const fs = require('fs').promises;
const { constants } = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { askOverwriteFile } = require('./ui/prompts');
const logger = require('./utils/logger');

const runGit = promisify(execFile);
const R3START_REPO = 'https://github.com/leandronoijo/r3start.git';

async function copyStarter(source, destination, relativePath, nonInteractive) {
  for (const entry of await fs.readdir(source, { withFileTypes: true })) {
    if (entry.name === '.git') continue;
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    const label = path.join(relativePath, entry.name);
    const existing = await fs.lstat(to).catch(err => {
      if (err.code === 'ENOENT') return null;
      throw err;
    });

    // Never follow a destination symlink or replace a directory with a file.
    if (existing && (existing.isSymbolicLink() || existing.isDirectory() !== entry.isDirectory())) {
      logger.info(`  Skipped: ${label} (path conflict)`);
      continue;
    }
    if (entry.isDirectory()) {
      await fs.mkdir(to, { recursive: true });
      await copyStarter(from, to, label, nonInteractive);
      continue;
    }
    if (existing && !(await askOverwriteFile(label, nonInteractive))) {
      logger.info(`  Skipped: ${label}`);
      continue;
    }
    if (entry.isSymbolicLink()) {
      if (existing) await fs.unlink(to);
      await fs.symlink(await fs.readlink(from), to);
    } else {
      await fs.copyFile(from, to, existing ? 0 : constants.COPYFILE_EXCL);
      await fs.chmod(to, (await fs.stat(from)).mode & 0o777);
    }
    logger.info(`  Copied: ${label}`);
  }
}

async function bootstrapR3start(cwd, { nonInteractive = false } = {}) {
  const temporaryDir = await fs.mkdtemp(path.join(os.tmpdir(), 'r3nd-r3start-'));
  const checkout = path.join(temporaryDir, 'checkout');
  try {
    logger.info('Bootstrapping repo using r3start...');
    await runGit('git', ['clone', '--depth', '1', R3START_REPO, checkout]);
    await copyStarter(checkout, cwd, '', nonInteractive);
  } finally {
    await fs.rm(temporaryDir, { recursive: true, force: true });
  }
}

module.exports = { bootstrapR3start };
