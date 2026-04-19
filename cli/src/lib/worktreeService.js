const crypto = require('crypto');
const os = require('os');
const path = require('path');
const fs = require('fs').promises;
const { execFile, spawn } = require('child_process');

const fg = require('fast-glob');

const { ConfigManager } = require('./config/configManager');
const {
  askWorktreeIDE,
  confirmWorktreeCopyWarning,
  askWorktreeCleanSelection,
  askWorktreeSelection,
  askWorktreeBranchName,
  NEW_WORKTREE_OPTION_VALUE
} = require('./ui/prompts');
const { findSpecDirectories } = require('./fs/treeSearch');
const logger = require('./utils/logger');

const IDE_PRESETS = {
  vscode: ['code', '{worktreeDir}'],
  cursor: ['cursor', '{worktreeDir}'],
  neovim: ['nvim', '{worktreeDir}']
};
const WORKTREE_VENDOR_DIRS = ['.claude', '.codex', '.github', '.cursor'];
let cachedFakerInstance = null;

function sanitizeBranchName(name) {
  const sanitized = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  return sanitized || 'worktree';
}

function buildGeneratedBranchName(fakerInstance) {
  return sanitizeBranchName(
    `${fakerInstance.animal.type()}-on-a-${fakerInstance.vehicle.color()}-${fakerInstance.vehicle.vehicle()}`
  );
}

async function getFakerInstance(deps = {}) {
  if (deps.fakerInstance) {
    return deps.fakerInstance;
  }

  if (!cachedFakerInstance) {
    const fakerModule = await import('@faker-js/faker');
    cachedFakerInstance = fakerModule.faker;
  }

  return cachedFakerInstance;
}

function parseGitWorktreeList(output) {
  const items = [];
  let current = null;

  for (const rawLine of String(output || '').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    if (line.startsWith('worktree ')) {
      current = { path: line.slice('worktree '.length) };
      items.push(current);
      continue;
    }

    if (!current) {
      continue;
    }

    if (line.startsWith('branch ')) {
      current.branch = line.slice('branch '.length);
      continue;
    }

    if (line.startsWith('HEAD ')) {
      current.head = line.slice('HEAD '.length);
      continue;
    }

    if (line === 'bare') {
      current.bare = true;
      continue;
    }

    if (line === 'detached') {
      current.detached = true;
    }
  }

  return items;
}

function tokenizeCommand(command) {
  const tokens = [];
  const source = String(command || '').trim();
  if (!source) {
    return tokens;
  }

  const pattern = /"([^"]*)"|'([^']*)'|[^\s]+/g;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    tokens.push(match[1] || match[2] || match[0]);
  }

  return tokens;
}

function getRepoScopeName(repoRoot, gitCommonDir) {
  const repoSlug = sanitizeBranchName(path.basename(repoRoot));
  const hash = crypto.createHash('sha1').update(gitCommonDir).digest('hex').slice(0, 8);
  return `${repoSlug}-${hash}`;
}

function normalizePathForCompare(targetPath) {
  const resolved = path.resolve(targetPath);
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}

function isPathInside(parentPath, childPath) {
  const parent = normalizePathForCompare(parentPath);
  const child = normalizePathForCompare(childPath);
  return child === parent || child.startsWith(`${parent}${path.sep}`);
}

function pathExists(targetPath) {
  return fs.access(targetPath).then(() => true).catch(() => false);
}

function getDisplayBranchName(worktree) {
  return worktree.branch ? worktree.branch.replace(/^refs\/heads\//, '') : '(detached)';
}

function createExecFileRunner(execFileImpl = execFile) {
  return (file, args, options = {}) => new Promise((resolve, reject) => {
    execFileImpl(file, args, options, (error, stdout = '', stderr = '') => {
      if (error && typeof error.code !== 'number') {
        reject(error);
        return;
      }

      resolve({
        code: error ? error.code : 0,
        stdout,
        stderr
      });
    });
  });
}

async function runGit(cwd, args, deps = {}, options = {}) {
  const runner = deps.execFileRunner || createExecFileRunner(deps.execFileImpl);
  const result = await runner('git', args, { cwd });

  if (!options.allowFailure && result.code !== 0) {
    throw new Error(result.stderr.trim() || `git ${args.join(' ')} failed`);
  }

  return result;
}

function createSpawnRunner(spawnImpl = spawn) {
  return (command, args, options = {}) => new Promise((resolve, reject) => {
    const child = spawnImpl(command, args, options);
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

async function copyRecursive(sourcePath, destinationPath) {
  const stat = await fs.lstat(sourcePath);

  if (stat.isDirectory()) {
    await fs.mkdir(destinationPath, { recursive: true });
    const entries = await fs.readdir(sourcePath);
    for (const entry of entries) {
      await copyRecursive(path.join(sourcePath, entry), path.join(destinationPath, entry));
    }
    return;
  }

  if (stat.isSymbolicLink()) {
    await fs.mkdir(path.dirname(destinationPath), { recursive: true });
    const linkTarget = await fs.readlink(sourcePath);
    await fs.rm(destinationPath, { force: true });
    await fs.symlink(linkTarget, destinationPath);
    return;
  }

  await fs.mkdir(path.dirname(destinationPath), { recursive: true });
  await fs.copyFile(sourcePath, destinationPath);
}

async function ensureWorktreeConfig(configManager, deps = {}, options = {}) {
  const defaults = ConfigManager.getDefaults();
  const configExists = await configManager.exists();
  const currentConfig = await configManager.load();
  const nextConfig = configExists ? { ...currentConfig } : { ...defaults, 'worktree-open-command': null };
  let changed = !configExists;
  const copyFilesInitialized = !currentConfig['worktree-copy-files'];

  if (!nextConfig['worktree-copy-files']) {
    nextConfig['worktree-copy-files'] = [...defaults['worktree-copy-files']];
    changed = true;
  }

  if (!nextConfig['worktree-open-command']) {
    const selectedIde = await (deps.askWorktreeIDE || askWorktreeIDE)(options.nonInteractive);
    nextConfig['worktree-open-command'] = [...(IDE_PRESETS[selectedIde] || IDE_PRESETS.vscode)];
    changed = true;
  }

  if (changed) {
    await configManager.save(nextConfig);
  }

  return {
    config: nextConfig,
    changed,
    copyFilesInitialized
  };
}

function replaceWorktreeTokens(value, worktreeDir) {
  return value.replace(/\{worktreeDir\}/g, worktreeDir);
}

async function openWorktree(worktreeDir, openCommand, deps = {}) {
  const commandTokens = Array.isArray(openCommand)
    ? openCommand
    : tokenizeCommand(openCommand);
  const resolvedTokens = commandTokens.map(token => replaceWorktreeTokens(token, worktreeDir));

  if (resolvedTokens.length === 0) {
    return;
  }

  const spawnRunner = deps.spawnRunner || createSpawnRunner(deps.spawnImpl);
  await spawnRunner(resolvedTokens[0], resolvedTokens.slice(1), {
    cwd: worktreeDir,
    stdio: 'inherit'
  });
}

async function copyManagedFiles(repoRoot, worktreePath, specDirName, copyPatterns) {
  const specDirectories = await findSpecDirectories(repoRoot, specDirName, {
    ignorePatterns: ['.git']
  });
  const vendorDirectories = [];

  for (const relativeSpecDir of specDirectories) {
    await copyRecursive(
      path.join(repoRoot, relativeSpecDir),
      path.join(worktreePath, relativeSpecDir)
    );
  }

  const extraFiles = await fg(copyPatterns, {
    cwd: repoRoot,
    dot: true,
    onlyFiles: true,
    unique: true,
    ignore: ['.git/**']
  });

  for (const relativeFile of extraFiles) {
    await copyRecursive(
      path.join(repoRoot, relativeFile),
      path.join(worktreePath, relativeFile)
    );
  }

  for (const vendorDir of WORKTREE_VENDOR_DIRS) {
    const sourcePath = path.join(repoRoot, vendorDir);
    if (!await pathExists(sourcePath)) {
      continue;
    }

    vendorDirectories.push(vendorDir);
    await copyRecursive(
      sourcePath,
      path.join(worktreePath, vendorDir)
    );
  }

  return {
    specDirectories,
    extraFiles,
    vendorDirectories
  };
}

async function resolveBranchPlan(repoRoot, worktreeScopeRoot, requestedBranch, worktrees, deps = {}) {
  if (requestedBranch) {
    const branchName = sanitizeBranchName(requestedBranch);
    const branchRef = `refs/heads/${branchName}`;
    const branchInUse = worktrees.find(worktree => worktree.branch === branchRef);
    if (branchInUse) {
      throw new Error(`Branch "${branchName}" is already checked out in worktree ${branchInUse.path}`);
    }

    const targetPath = path.join(worktreeScopeRoot, branchName);
    if (await pathExists(targetPath)) {
      throw new Error(`Target worktree path already exists: ${targetPath}`);
    }

    const branchLookup = await runGit(repoRoot, ['show-ref', '--verify', '--quiet', branchRef], deps, { allowFailure: true });
    return {
      branchName,
      targetPath,
      branchExists: branchLookup.code === 0
    };
  }

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const branchName = buildGeneratedBranchName(await getFakerInstance(deps));
    const branchRef = `refs/heads/${branchName}`;
    const targetPath = path.join(worktreeScopeRoot, branchName);
    const branchInUse = worktrees.find(worktree => worktree.branch === branchRef);

    if (branchInUse || await pathExists(targetPath)) {
      continue;
    }

    const branchLookup = await runGit(repoRoot, ['show-ref', '--verify', '--quiet', branchRef], deps, { allowFailure: true });
    if (branchLookup.code === 0) {
      continue;
    }

    return {
      branchName,
      targetPath,
      branchExists: false
    };
  }

  throw new Error('Failed to generate a unique branch name for the new worktree');
}

async function getRepoContext(cwd, deps = {}) {
  const topLevel = await runGit(cwd, ['rev-parse', '--show-toplevel'], deps);
  const commonDirResult = await runGit(cwd, ['rev-parse', '--git-common-dir'], deps);
  const repoRoot = topLevel.stdout.trim();
  const gitCommonDir = path.resolve(repoRoot, commonDirResult.stdout.trim());
  const scopeName = getRepoScopeName(repoRoot, gitCommonDir);
  const worktreeScopeRoot = path.join(os.homedir(), '.r3nd', 'worktrees', scopeName);
  const worktreeList = await runGit(repoRoot, ['worktree', 'list', '--porcelain'], deps);

  return {
    repoRoot,
    gitCommonDir,
    scopeName,
    worktreeScopeRoot,
    worktrees: parseGitWorktreeList(worktreeList.stdout)
  };
}

async function runWorktreeCreate(opts = {}, deps = {}) {
  const cwd = opts.cwd || process.cwd();
  const nonInteractive = !!opts.nonInteractive;
  const configManager = deps.configManager || new ConfigManager(cwd);
  const configured = await ensureWorktreeConfig(configManager, deps, { nonInteractive });
  const copyPatterns = await configManager.getWorktreeCopyFiles();
  const openCommand = await configManager.getWorktreeOpenCommand();

  if (configured.copyFilesInitialized) {
    const confirmed = await (deps.confirmWorktreeCopyWarning || confirmWorktreeCopyWarning)(copyPatterns, nonInteractive);
    if (!confirmed) {
      logger.info('Worktree creation cancelled.');
      return null;
    }
  }

  const { repoRoot, worktreeScopeRoot, worktrees } = await getRepoContext(cwd, deps);
  await fs.mkdir(worktreeScopeRoot, { recursive: true });

  const branchPlan = await resolveBranchPlan(repoRoot, worktreeScopeRoot, opts.branch, worktrees, deps);
  const gitArgs = branchPlan.branchExists
    ? ['worktree', 'add', branchPlan.targetPath, branchPlan.branchName]
    : ['worktree', 'add', '-b', branchPlan.branchName, branchPlan.targetPath];

  await runGit(repoRoot, gitArgs, deps);

  const specDirName = await configManager.getSpecDirName();
  const copied = await copyManagedFiles(repoRoot, branchPlan.targetPath, specDirName, copyPatterns);

  try {
    await openWorktree(branchPlan.targetPath, openCommand, deps);
  } catch (err) {
    logger.warn(`Worktree created at ${branchPlan.targetPath}, but failed to launch the open command: ${err.message}`);
  }

  logger.info(`✓ Created worktree ${branchPlan.branchName} at ${branchPlan.targetPath}`);
  if (configured.changed) {
    logger.info('✓ Saved worktree settings to r3nd.yaml');
  }

  return {
    branch: branchPlan.branchName,
    path: branchPlan.targetPath,
    copied
  };
}

async function runWorktree(opts = {}, deps = {}) {
  const cwd = opts.cwd || process.cwd();
  const nonInteractive = !!opts.nonInteractive;

  if (opts.branch || nonInteractive) {
    return runWorktreeCreate(opts, deps);
  }

  const configManager = deps.configManager || new ConfigManager(cwd);
  const openCommand = await configManager.getWorktreeOpenCommand();
  const { repoRoot, worktrees } = await getRepoContext(cwd, deps);
  const selectableWorktrees = worktrees.map(worktree => ({
    path: worktree.path,
    branch: getDisplayBranchName(worktree),
    current: normalizePathForCompare(worktree.path) === normalizePathForCompare(repoRoot)
  }));

  const selectedPath = await (deps.askWorktreeSelection || askWorktreeSelection)(selectableWorktrees, nonInteractive);
  if (selectedPath === NEW_WORKTREE_OPTION_VALUE) {
    const branchName = await (deps.askWorktreeBranchName || askWorktreeBranchName)(nonInteractive);
    return runWorktreeCreate({
      ...opts,
      cwd,
      branch: branchName || undefined
    }, deps);
  }

  await openWorktree(selectedPath, openCommand, deps);
  logger.info(`✓ Opened worktree ${selectedPath}`);

  return {
    path: selectedPath
  };
}

async function runWorktreeClean(opts = {}, deps = {}) {
  const cwd = opts.cwd || process.cwd();
  const nonInteractive = !!opts.nonInteractive;
  const { repoRoot, worktreeScopeRoot, worktrees } = await getRepoContext(cwd, deps);
  const candidateWorktrees = worktrees.filter(worktree => isPathInside(worktreeScopeRoot, worktree.path));
  const cleanWorktrees = [];

  for (const worktree of candidateWorktrees) {
    if (normalizePathForCompare(worktree.path) === normalizePathForCompare(repoRoot)) {
      continue;
    }

    const status = await runGit(worktree.path, ['status', '--porcelain'], deps);
    if (status.stdout.trim()) {
      continue;
    }

    cleanWorktrees.push({
      path: worktree.path,
      branch: getDisplayBranchName(worktree)
    });
  }

  if (cleanWorktrees.length === 0) {
    logger.info('No clean worktrees available to delete.');
    return [];
  }

  logger.warn('Ignored-file changes do not block cleanup. Use this command carefully if your worktrees contain ignored secrets or local notes.');
  const selectedPaths = await (deps.askWorktreeCleanSelection || askWorktreeCleanSelection)(cleanWorktrees, nonInteractive);
  if (!selectedPaths || selectedPaths.length === 0) {
    logger.info('No worktrees selected. Nothing to clean.');
    return [];
  }

  for (const selectedPath of selectedPaths) {
    await runGit(repoRoot, ['worktree', 'remove', selectedPath], deps);
    logger.info(`✓ Removed worktree ${selectedPath}`);
  }

  await runGit(repoRoot, ['worktree', 'prune'], deps);
  return selectedPaths;
}

module.exports = {
  IDE_PRESETS,
  sanitizeBranchName,
  buildGeneratedBranchName,
  parseGitWorktreeList,
  tokenizeCommand,
  getRepoScopeName,
  WORKTREE_VENDOR_DIRS,
  runWorktree,
  runWorktreeCreate,
  runWorktreeClean
};
