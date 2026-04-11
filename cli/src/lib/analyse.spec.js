// Mock inquirer before imports that rely on prompt module
jest.mock('inquirer', () => ({
  createPromptModule: jest.fn(() => jest.fn().mockResolvedValue({}))
}));

const fs = require('fs').promises;
const os = require('os');
const path = require('path');
const {
  parseAppsFromInstructions,
  detectRequiredAnalysisFiles,
  ensureRequiredScopeFiles
} = require('./analyse');

describe('analyse parsing and output verification', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'r3nd-analyse-'));
  });

  afterEach(async () => {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  test('parseAppsFromInstructions parses YAML block', async () => {
    const md = 'Some intro\n```yaml\napps:\n  - name: api\n    path: src/backend\n    purpose: api\n    stack: fastapi\n```\nRest';
    const apps = await parseAppsFromInstructions(md);
    expect(Array.isArray(apps)).toBe(true);
    expect(apps[0].name).toBe('api');
    expect(apps[0].path).toBe('src/backend');
  });

  test('parseAppsFromInstructions parses applyTo as path', async () => {
    const md = '```yaml\napps:\n  - name: web\n    applyTo: apps/web\n    purpose: web\n    stack: react\n```';
    const apps = await parseAppsFromInstructions(md);
    expect(apps[0].path).toBe('apps/web');
    expect(apps[0].applyTo).toBe('apps/web');
  });

  test('parseAppsFromInstructions parses JSON block for backwards compatibility', async () => {
    const md = 'Some intro\n```json\n{"apps":[{"name":"api","path":"src/backend","purpose":"api","stack":"fastapi"}]}\n```\nRest';
    const apps = await parseAppsFromInstructions(md);
    expect(Array.isArray(apps)).toBe(true);
    expect(apps[0].name).toBe('api');
  });

  test('detectRequiredAnalysisFiles requires CLAUDE only when only .claude exists', async () => {
    await fs.mkdir(path.join(tempDir, '.claude'));
    const result = await detectRequiredAnalysisFiles(tempDir);
    expect(result.requiredFiles).toEqual(['CLAUDE.md']);
  });

  test('detectRequiredAnalysisFiles requires AGENTS for codex/cursor/github vendors', async () => {
    await fs.mkdir(path.join(tempDir, '.codex'));
    const result = await detectRequiredAnalysisFiles(tempDir);
    expect(result.requiredFiles).toEqual(['AGENTS.md']);
  });

  test('detectRequiredAnalysisFiles requires both files when claude and agents vendors coexist', async () => {
    await fs.mkdir(path.join(tempDir, '.claude'));
    await fs.mkdir(path.join(tempDir, '.github'), { recursive: true });
    const result = await detectRequiredAnalysisFiles(tempDir);
    expect(result.requiredFiles).toEqual(['AGENTS.md', 'CLAUDE.md']);
  });

  test('detectRequiredAnalysisFiles defaults to AGENTS when no vendors exist', async () => {
    const result = await detectRequiredAnalysisFiles(tempDir);
    expect(result.requiredFiles).toEqual(['AGENTS.md']);
  });

  test('ensureRequiredScopeFiles copies counterpart when AGENTS is required and missing', async () => {
    const scope = path.join(tempDir, 'apps', 'backend');
    await fs.mkdir(scope, { recursive: true });
    await fs.writeFile(path.join(scope, 'CLAUDE.md'), 'same content', 'utf-8');

    await ensureRequiredScopeFiles(scope, ['AGENTS.md']);

    await expect(fs.readFile(path.join(scope, 'AGENTS.md'), 'utf-8')).resolves.toBe('same content');
  });

  test('ensureRequiredScopeFiles copies counterpart when CLAUDE is required and missing', async () => {
    const scope = path.join(tempDir, 'apps', 'frontend');
    await fs.mkdir(scope, { recursive: true });
    await fs.writeFile(path.join(scope, 'AGENTS.md'), 'shared text', 'utf-8');

    await ensureRequiredScopeFiles(scope, ['CLAUDE.md']);

    await expect(fs.readFile(path.join(scope, 'CLAUDE.md'), 'utf-8')).resolves.toBe('shared text');
  });

  test('ensureRequiredScopeFiles throws when required files are still missing', async () => {
    const scope = path.join(tempDir, 'apps', 'worker');
    await fs.mkdir(scope, { recursive: true });

    await expect(ensureRequiredScopeFiles(scope, ['AGENTS.md', 'CLAUDE.md']))
      .rejects
      .toThrow(/Missing required analysis files/);
  });
});
