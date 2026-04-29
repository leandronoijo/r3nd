const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { execFileSync, spawnSync } = require('child_process');

jest.mock('./ui/prompts', () => ({
  askWorktreeIDE: jest.fn().mockResolvedValue('cursor'),
  confirmWorktreeCopyWarning: jest.fn().mockResolvedValue(true),
  askWorktreeCleanSelection: jest.fn().mockResolvedValue([]),
  askWorktreeSelection: jest.fn(),
  askWorktreeBranchName: jest.fn(),
  NEW_WORKTREE_OPTION_VALUE: '__new_worktree__'
}));

const { ConfigManager } = require('./config/configManager');
const {
  runWorktree,
  runWorktreeList,
  runWorktreeCreate,
  runWorktreeClean,
  getRepoScopeName,
  tokenizeCommand
} = require('./worktreeService');

function runGit(repoDir, args, options = {}) {
  return execFileSync('git', args, {
    cwd: repoDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options
  });
}

function runGitStatus(repoDir, args) {
  return spawnSync('git', args, {
    cwd: repoDir,
    encoding: 'utf8'
  });
}

async function createRepoFixture() {
  const repoDir = await fs.mkdtemp(path.join(os.tmpdir(), 'r3nd-worktree-test-'));
  runGit(repoDir, ['init']);
  runGit(repoDir, ['config', 'user.name', 'Test User']);
  runGit(repoDir, ['config', 'user.email', 'test@example.com']);
  runGit(repoDir, ['checkout', '-b', 'develop']);

  await fs.mkdir(path.join(repoDir, 'r3nd'), { recursive: true });
  await fs.mkdir(path.join(repoDir, 'nested', 'r3nd'), { recursive: true });
  await fs.mkdir(path.join(repoDir, 'apps', 'api'), { recursive: true });

  await fs.writeFile(path.join(repoDir, '.gitignore'), '.env*\n*.secret\n.claude/\n.codex/\n.cursor/\n');
  await fs.writeFile(path.join(repoDir, 'README.md'), '# Test Repo\n');
  await fs.writeFile(path.join(repoDir, 'r3nd', 'tracked.md'), 'tracked root spec\n');
  await fs.writeFile(path.join(repoDir, 'nested', 'r3nd', 'spec.md'), 'tracked nested spec\n');
  await fs.writeFile(path.join(repoDir, 'nested', 'r3nd', 'local.secret'), 'top-secret\n');
  await fs.writeFile(path.join(repoDir, '.env'), 'ROOT_SECRET=1\n');
  await fs.writeFile(path.join(repoDir, 'apps', 'api', '.env'), 'API_SECRET=1\n');

  runGit(repoDir, ['add', '.']);
  runGit(repoDir, ['commit', '-m', 'initial commit']);

  await fs.mkdir(path.join(repoDir, '.claude'), { recursive: true });
  await fs.mkdir(path.join(repoDir, '.codex', 'skills'), { recursive: true });
  await fs.mkdir(path.join(repoDir, '.cursor'), { recursive: true });
  await fs.writeFile(path.join(repoDir, '.claude', 'local.md'), 'claude local\n');
  await fs.writeFile(path.join(repoDir, '.codex', 'skills', 'custom.md'), 'codex local\n');
  await fs.writeFile(path.join(repoDir, '.cursor', 'rules.json'), '{"ok":true}\n');

  return repoDir;
}

async function getWorktreeScopeRoot(repoDir) {
  const commonDir = runGit(repoDir, ['rev-parse', '--git-common-dir']).trim();
  const absoluteCommonDir = path.resolve(repoDir, commonDir);
  return path.join(os.homedir(), '.r3nd', 'worktrees', getRepoScopeName(repoDir, absoluteCommonDir));
}

describe('worktreeService', () => {
  let repoDir;
  let worktreeScopeRoot;

  const deps = {
    askWorktreeIDE: jest.fn().mockResolvedValue('cursor'),
    confirmWorktreeCopyWarning: jest.fn().mockResolvedValue(true),
    askWorktreeCleanSelection: jest.fn(),
    askWorktreeSelection: jest.fn(),
    askWorktreeBranchName: jest.fn(),
    spawnRunner: jest.fn().mockResolvedValue(undefined)
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    repoDir = await createRepoFixture();
    worktreeScopeRoot = await getWorktreeScopeRoot(repoDir);
  });

  afterEach(async () => {
    await fs.rm(repoDir, { recursive: true, force: true });
    await fs.rm(worktreeScopeRoot, { recursive: true, force: true });
  });

  it('creates a worktree, saves missing config, and copies managed files', async () => {
    const result = await runWorktreeCreate({ cwd: repoDir, branch: 'Feature Branch' }, deps);

    expect(result.branch).toBe('feature-branch');
    expect(result.path).toBe(path.join(worktreeScopeRoot, 'feature-branch'));
    await expect(fs.readFile(path.join(result.path, '.env'), 'utf8')).resolves.toContain('ROOT_SECRET=1');
    await expect(fs.readFile(path.join(result.path, 'apps', 'api', '.env'), 'utf8')).resolves.toContain('API_SECRET=1');
    await expect(fs.readFile(path.join(result.path, 'nested', 'r3nd', 'local.secret'), 'utf8')).resolves.toContain('top-secret');
    await expect(fs.readFile(path.join(result.path, 'nested', 'r3nd', 'spec.md'), 'utf8')).resolves.toContain('tracked nested spec');
    await expect(fs.readFile(path.join(result.path, '.claude', 'local.md'), 'utf8')).resolves.toContain('claude local');
    await expect(fs.readFile(path.join(result.path, '.codex', 'skills', 'custom.md'), 'utf8')).resolves.toContain('codex local');
    await expect(fs.readFile(path.join(result.path, '.cursor', 'rules.json'), 'utf8')).resolves.toContain('"ok":true');
    expect(result.copied.vendorDirectories).toEqual(expect.arrayContaining(['.claude', '.codex', '.cursor']));

    const config = await new ConfigManager(repoDir).getAll();
    expect(config['worktree-copy-files']).toEqual(['*.env', '**/*.env']);
    expect(config['worktree-open-command']).toEqual(['cursor', '{worktreeDir}']);
    expect(deps.askWorktreeIDE).toHaveBeenCalled();
    expect(deps.spawnRunner).toHaveBeenCalled();
  });

  it('creates a worktree without launching the open command when noCommand is true', async () => {
    const result = await runWorktreeCreate({ cwd: repoDir, branch: 'no-open-branch', noCommand: true }, deps);

    expect(result.path).toBe(path.join(worktreeScopeRoot, 'no-open-branch'));
    await expect(fs.access(result.path)).resolves.toBeUndefined();
    expect(deps.spawnRunner).not.toHaveBeenCalled();
  });

  it('rejects creating a second worktree for a branch already checked out elsewhere', async () => {
    await runWorktreeCreate({ cwd: repoDir, branch: 'dupe-branch' }, deps);

    await expect(
      runWorktreeCreate({ cwd: repoDir, branch: 'dupe-branch' }, deps)
    ).rejects.toThrow('already checked out');
  });

  it('warns about copied file globs only when they are first initialized', async () => {
    await runWorktreeCreate({ cwd: repoDir, branch: 'first-branch' }, deps);
    expect(deps.confirmWorktreeCopyWarning).toHaveBeenCalledTimes(1);

    await runWorktreeCreate({ cwd: repoDir, branch: 'second-branch' }, deps);
    expect(deps.confirmWorktreeCopyWarning).toHaveBeenCalledTimes(1);
  });

  it('opens a selected existing worktree when run without a branch', async () => {
    const existingWorktree = await runWorktreeCreate({ cwd: repoDir, branch: 'existing-branch' }, deps);

    deps.spawnRunner.mockClear();
    deps.askWorktreeSelection.mockResolvedValueOnce(existingWorktree.path);

    const result = await runWorktree({ cwd: repoDir }, deps);

    expect(result).toEqual({ path: existingWorktree.path });
    expect(deps.askWorktreeSelection).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        path: repoDir,
        branch: 'develop',
        current: true
      }),
      expect.objectContaining({
        path: existingWorktree.path,
        branch: 'existing-branch',
        current: false
      })
    ]), false);
    expect(deps.askWorktreeBranchName).not.toHaveBeenCalled();
    expect(deps.spawnRunner).toHaveBeenCalledWith('cursor', [existingWorktree.path], expect.objectContaining({
      cwd: existingWorktree.path,
      stdio: 'inherit'
    }));
  });

  it('returns selected existing worktree path without opening when noCommand is true', async () => {
    const existingWorktree = await runWorktreeCreate({ cwd: repoDir, branch: 'existing-branch-no-open' }, deps);

    deps.spawnRunner.mockClear();
    deps.askWorktreeSelection.mockResolvedValueOnce(existingWorktree.path);

    const result = await runWorktree({ cwd: repoDir, noCommand: true }, deps);

    expect(result).toEqual({ path: existingWorktree.path });
    expect(deps.spawnRunner).not.toHaveBeenCalled();
  });

  it('creates a new worktree from the chooser and auto-generates the branch name when left blank', async () => {
    deps.askWorktreeSelection.mockResolvedValueOnce('__new_worktree__');
    deps.askWorktreeBranchName.mockResolvedValueOnce('');

    const result = await runWorktree({ cwd: repoDir }, {
      ...deps,
      fakerInstance: {
        animal: { type: () => 'Otter' },
        vehicle: {
          color: () => 'Blue',
          vehicle: () => 'Bike'
        }
      }
    });

    expect(result.branch).toBe('otter-on-a-blue-bike');
    expect(result.path).toBe(path.join(worktreeScopeRoot, 'otter-on-a-blue-bike'));
    expect(deps.askWorktreeBranchName).toHaveBeenCalledWith(false);
    await expect(fs.access(result.path)).resolves.toBeUndefined();
  });

  it('cleans only worktrees with empty plain porcelain status and keeps their branches', async () => {
    const cleanWorktree = await runWorktreeCreate({ cwd: repoDir, branch: 'clean-branch' }, deps);
    const dirtyWorktree = await runWorktreeCreate({ cwd: repoDir, branch: 'dirty-branch' }, deps);
    await fs.writeFile(path.join(dirtyWorktree.path, 'notes.txt'), 'dirty\n');

    deps.askWorktreeCleanSelection.mockResolvedValueOnce([cleanWorktree.path]);

    const removed = await runWorktreeClean({ cwd: repoDir }, deps);

    expect(removed).toEqual([cleanWorktree.path]);
    await expect(fs.access(cleanWorktree.path)).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(fs.access(dirtyWorktree.path)).resolves.toBeUndefined();

    const cleanBranchStatus = runGitStatus(repoDir, ['show-ref', '--verify', '--quiet', 'refs/heads/clean-branch']);
    expect(cleanBranchStatus.status).toBe(0);

    expect(deps.askWorktreeCleanSelection).toHaveBeenCalledWith([
      {
        path: cleanWorktree.path,
        branch: 'clean-branch'
      }
    ], false);
  });

  it('tokenizes string open commands with quoted arguments', () => {
    expect(tokenizeCommand('code "{worktreeDir}" --reuse-window')).toEqual([
      'code',
      '{worktreeDir}',
      '--reuse-window'
    ]);
  });

  it('returns all worktrees in git worktree list format', async () => {
    const linkedWorktree = await runWorktreeCreate({ cwd: repoDir, branch: 'list-branch', noCommand: true }, deps);
    const output = await runWorktreeList({ cwd: repoDir }, deps);

    expect(output).toContain(repoDir);
    expect(output).toContain(linkedWorktree.path);
    expect(output).toContain('[develop]');
    expect(output).toContain('[list-branch]');
  });

  it('creates a new worktree under the correct scope when called from inside a linked worktree', async () => {
    const firstWorktree = await runWorktreeCreate({ cwd: repoDir, branch: 'first-linked-branch' }, deps);
    const firstWorktreeDir = firstWorktree.path;

    deps.spawnRunner.mockClear();
    const secondWorktree = await runWorktreeCreate({ cwd: firstWorktreeDir, branch: 'second-linked-branch' }, deps);

    expect(secondWorktree.path).toBe(path.join(worktreeScopeRoot, 'second-linked-branch'));
    await expect(fs.access(secondWorktree.path)).resolves.toBeUndefined();
  });

  it('lists the current linked worktree as current when run from inside it', async () => {
    const linkedWorktree = await runWorktreeCreate({ cwd: repoDir, branch: 'nav-branch' }, deps);
    const linkedWorktreeDir = linkedWorktree.path;

    deps.askWorktreeSelection.mockResolvedValueOnce(linkedWorktreeDir);
    await runWorktree({ cwd: linkedWorktreeDir }, deps);

    const selectionCall = deps.askWorktreeSelection.mock.calls[0][0];
    const currentEntry = selectionCall.find(w => w.current);
    expect(currentEntry).toBeDefined();
    expect(currentEntry.path).toBe(linkedWorktreeDir);
  });
});
