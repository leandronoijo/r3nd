const fs = require('fs').promises;
const os = require('os');
const path = require('path');

jest.mock('./ui/prompts', () => ({
  askInitOptions: jest.fn().mockResolvedValue(['github', 'github-workflows']),
  askUpdateOptions: jest.fn().mockResolvedValue(['skills', 'templates', 'github', 'github-workflows']),
  askOverlays: jest.fn().mockResolvedValue([]),
  askSpecDirName: jest.fn().mockResolvedValue('specs'),
  askOverwriteFile: jest.fn().mockResolvedValue(true),
  askLLMChoice: jest.fn().mockResolvedValue('naa'),
  askRemoteOrigin: jest.fn().mockResolvedValue('')
}));
jest.mock('./github/githubClient', () => ({ GitHubClient: jest.fn() }));
jest.mock('child_process', () => ({
  ...jest.requireActual('child_process'),
  execSync: jest.fn()
}));

const { GitHubClient } = require('./github/githubClient');
const { runInit } = require('./initService');
const { runUpdate } = require('./updateService');
const { runScaffold } = require('./scaffoldService');
const { runGenerateSeed } = require('./generateSeedService');

const seedFiles = {
  'r3nd.yaml': 'spec-dir-name: rnd\n',
  'rnd/skills/example/SKILL.md': '---\nname: example\ndescription: Example task\n---\n\n# Example task\n',
  'rnd/vendor/skills/github.md': 'GitHub instructions\n',
  'rnd/templates/retro.md': '# Retro template\n',
  '.github/workflows/06-retro-ready.yml': 'name: Seed retro\n',
  '.github/workflows/custom.yaml': 'name: Seed custom workflow\n'
};

describe.each([
  ['init', runInit],
  ['update', runUpdate],
  ['scaffold', runScaffold],
  ['generate-seed', runGenerateSeed]
])('%s workflow distribution', (command, run) => {
  let cwd;
  let githubClient;

  beforeEach(async () => {
    cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'r3nd-no-workflows-'));
    await fs.mkdir(path.join(cwd, '.git'));
    await fs.writeFile(path.join(cwd, 'r3nd.yaml'), 'seed-repo: example/seed@main\nspec-dir-name: specs\n');
    githubClient = {
      getTree: jest.fn().mockResolvedValue(Object.keys(seedFiles).map(filePath => ({ type: 'blob', path: filePath }))),
      fetchRaw: jest.fn(async filePath => {
        if (!(filePath in seedFiles)) throw new Error(`Unexpected fetch: ${filePath}`);
        return Buffer.from(seedFiles[filePath]);
      })
    };
    GitHubClient.mockImplementation(() => githubClient);
  });

  afterEach(async () => {
    await fs.rm(cwd, { recursive: true, force: true });
  });

  it.each([false, true])('leaves workflows untouched when existing workflows are %s', async existing => {
    const workflowDir = path.join(cwd, '.github', 'workflows');
    if (existing) {
      await fs.mkdir(workflowDir, { recursive: true });
      await fs.writeFile(path.join(workflowDir, '06-retro-ready.yml'), 'name: Project retro\n');
      await fs.writeFile(path.join(workflowDir, 'project.yaml'), 'name: Project CI\n');
    }

    await run({ cwd, nonInteractive: true }, { githubClient });

    expect(githubClient.fetchRaw.mock.calls.some(([filePath]) => filePath.startsWith('.github/workflows/'))).toBe(false);
    if (existing) {
      expect((await fs.readdir(workflowDir)).sort()).toEqual(['06-retro-ready.yml', 'project.yaml']);
      expect(await fs.readFile(path.join(workflowDir, '06-retro-ready.yml'), 'utf8')).toBe('name: Project retro\n');
      expect(await fs.readFile(path.join(workflowDir, 'project.yaml'), 'utf8')).toBe('name: Project CI\n');
    } else {
      await expect(fs.access(workflowDir)).rejects.toMatchObject({ code: 'ENOENT' });
    }
    if (command === 'generate-seed') {
      expect(await fs.readFile(path.join(cwd, 'rnd', 'skills', 'example', 'SKILL.md'), 'utf8')).toContain('# Example task');
    } else {
      expect(await fs.readFile(path.join(cwd, '.github', 'skills', 'example', 'SKILL.md'), 'utf8')).toContain('GitHub instructions');
      expect(await fs.readFile(path.join(cwd, 'specs', 'templates', 'retro.md'), 'utf8')).toContain('# Retro template');
    }
  });
});
