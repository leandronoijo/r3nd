jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    writeFile: jest.fn().mockResolvedValue(undefined),
    unlink: jest.fn().mockResolvedValue(undefined),
  }
}));

jest.mock('./ui/prompts', () => ({
  askBugDescription: jest.fn().mockResolvedValue('Fix broken login flow'),
  askBugfixLLMChoice: jest.fn().mockResolvedValue('github'),
  confirmBuildPlan: jest.fn().mockResolvedValue(true)
}));

jest.mock('./config/configManager', () => ({
  ConfigManager: jest.fn().mockImplementation(() => ({
    getSpecDirName: jest.fn().mockResolvedValue('r3nd')
  }))
}));

jest.mock('./fs/treeSearch', () => ({
  findFirstSpecDirectory: jest.fn().mockResolvedValue('r3nd')
}));

jest.mock('./fs/fileWriter', () => ({
  ensureDir: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('./llm/agentRunner', () => ({
  runGitHubAgent: jest.fn().mockResolvedValue('https://github.com/example/task')
}));

const fs = require('fs').promises;
const { runBugfix } = require('./bugfix');
const { runGitHubAgent } = require('./llm/agentRunner');

describe('bugfix', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.access.mockImplementation((targetPath) => {
      if (
        String(targetPath).endsWith('/src') ||
        String(targetPath).endsWith('/r3nd/skills')
      ) {
        return Promise.resolve();
      }
      return Promise.reject(Object.assign(new Error('missing'), { code: 'ENOENT' }));
    });
  });

  it('builds bugfix prompts from task skills instead of internal agent files', async () => {
    await runBugfix({ cwd: '/repo', nonInteractive: false });

    expect(runGitHubAgent).toHaveBeenCalledWith(
      expect.stringContaining('r3nd/skills/create-build-plan/SKILL.md'),
      '/repo',
      'Bugfix task',
      expect.objectContaining({ featureLabel: 'Fix broken login flow' })
    );
    expect(runGitHubAgent).toHaveBeenCalledWith(
      expect.stringContaining('r3nd/skills/implement-build-plan/SKILL.md'),
      '/repo',
      'Bugfix task',
      expect.objectContaining({ featureLabel: 'Fix broken login flow' })
    );
  });
});
