// Mock inquirer transitively used by prompts module.
jest.mock('inquirer', () => ({
  createPromptModule: jest.fn(() => jest.fn().mockResolvedValue({}))
}));

jest.mock('./llm/agentRunner', () => ({
  runPlansSequential: jest.fn(),
  makeGitHubCommand: jest.fn((prompt) => `gh agent-task create "${prompt}"`)
}));

jest.mock('./ui/prompts', () => ({
  confirmRunNow: jest.fn().mockResolvedValue(true),
  askSelectApps: jest.fn((apps, nonInteractive) => (nonInteractive ? apps : apps.slice(0, 1)))
}));

jest.mock('./config/configManager', () => ({
  ConfigManager: jest.fn().mockImplementation(() => ({
    getSpecDirName: jest.fn().mockResolvedValue('r3nd')
  }))
}));

jest.mock('./fs/treeSearch', () => ({
  findFirstSpecDirectory: jest.fn().mockResolvedValue('r3nd')
}));

const fs = require('fs').promises;
const os = require('os');
const path = require('path');
const { runPlansSequential } = require('./llm/agentRunner');
const { runAnalyse } = require('./analyse');

describe('runAnalyse flow orchestration', () => {
  let tempDir;

  beforeEach(async () => {
    jest.clearAllMocks();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'r3nd-analyse-flow-'));
    await fs.mkdir(path.join(tempDir, 'r3nd', 'skills', 'analyze-repo-context'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'r3nd', 'skills', 'analyze-app-context'), { recursive: true });
    await fs.writeFile(path.join(tempDir, 'r3nd', 'skills', 'analyze-repo-context', 'SKILL.md'), '# repo skill', 'utf-8');
    await fs.writeFile(path.join(tempDir, 'r3nd', 'skills', 'analyze-app-context', 'SKILL.md'), '# app skill', 'utf-8');
  });

  afterEach(async () => {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  test('runs level-1 then level-2 analysis for selected apps', async () => {
    await fs.mkdir(path.join(tempDir, 'apps', 'api'), { recursive: true });

    runPlansSequential.mockImplementation(async (_plans, { makePrompt }) => {
      const prompt = await makePrompt('dummy');
      if (prompt.includes('analyze this repository path')) {
        await fs.writeFile(path.join(tempDir, 'AGENTS.md'), '```yaml\napps:\n  - name: api\n    path: apps/api\n    purpose: API\n    stack: node\n```', 'utf-8');
        return;
      }

      const match = prompt.match(/analyze this application path:\n\n([^\n]+)/i);
      if (match) {
        const appPath = match[1].trim();
        await fs.writeFile(path.join(tempDir, appPath, 'AGENTS.md'), '# App instructions', 'utf-8');
      }
    });

    await runAnalyse({ agent: 'codex', nonInteractive: true, destRoot: tempDir });

    expect(runPlansSequential).toHaveBeenCalledTimes(2);
    await expect(fs.readFile(path.join(tempDir, 'AGENTS.md'), 'utf-8')).resolves.toContain('apps:');
    await expect(fs.readFile(path.join(tempDir, 'apps', 'api', 'AGENTS.md'), 'utf-8')).resolves.toContain('App instructions');
  });

  test('stops after level-1 when no apps are found', async () => {
    runPlansSequential.mockImplementation(async (_plans, { makePrompt }) => {
      const prompt = await makePrompt('dummy');
      if (prompt.includes('analyze this repository path')) {
        await fs.writeFile(path.join(tempDir, 'AGENTS.md'), '# No apps listed', 'utf-8');
      }
    });

    await runAnalyse({ agent: 'codex', nonInteractive: true, destRoot: tempDir });
    expect(runPlansSequential).toHaveBeenCalledTimes(1);
  });

  test('non-interactive mode analyzes all parsed apps by default', async () => {
    await fs.mkdir(path.join(tempDir, 'apps', 'api'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'apps', 'web'), { recursive: true });

    runPlansSequential.mockImplementation(async (_plans, { makePrompt }) => {
      const prompt = await makePrompt('dummy');
      if (prompt.includes('analyze this repository path')) {
        await fs.writeFile(path.join(tempDir, 'AGENTS.md'), '```yaml\napps:\n  - name: api\n    path: apps/api\n    purpose: API\n    stack: node\n  - name: web\n    path: apps/web\n    purpose: Web\n    stack: react\n```', 'utf-8');
        return;
      }

      const match = prompt.match(/analyze this application path:\n\n([^\n]+)/i);
      if (match) {
        const appPath = match[1].trim();
        await fs.writeFile(path.join(tempDir, appPath, 'AGENTS.md'), `# ${appPath}`, 'utf-8');
      }
    });

    await runAnalyse({ agent: 'codex', nonInteractive: true, destRoot: tempDir });

    expect(runPlansSequential).toHaveBeenCalledTimes(3);
    await expect(fs.readFile(path.join(tempDir, 'apps', 'api', 'AGENTS.md'), 'utf-8')).resolves.toContain('apps/api');
    await expect(fs.readFile(path.join(tempDir, 'apps', 'web', 'AGENTS.md'), 'utf-8')).resolves.toContain('apps/web');
  });
});
