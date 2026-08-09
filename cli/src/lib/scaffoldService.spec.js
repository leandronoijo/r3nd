jest.mock('./ui/prompts', () => ({
  askOverlays: jest.fn().mockResolvedValue(['api', 'vue']),
  askLLMChoice: jest.fn().mockResolvedValue('naa'),
  confirmRunNow: jest.fn().mockResolvedValue(false),
  confirmSavePrompts: jest.fn().mockResolvedValue(true),
  askRemoteOrigin: jest.fn().mockResolvedValue(''),
  askSeedRepo: jest.fn().mockResolvedValue('leandronoijo/r3nd@develop'),
  askInitOptions: jest.fn().mockResolvedValue(['github-skills', 'cursor'])
}));

jest.mock('./config/configManager', () => ({
  ConfigManager: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue('leandronoijo/r3nd@develop'),
    set: jest.fn().mockResolvedValue(undefined),
    getSpecDirName: jest.fn().mockResolvedValue('r3nd'),
    getOverlays: jest.fn().mockResolvedValue([])
  }))
}));

jest.mock('./fs/seedCopier', () => ({
  copyAgentPersonas: jest.fn().mockResolvedValue(undefined),
  copyBuildPlans: jest.fn().mockResolvedValue(undefined),
  copyTaskSkills: jest.fn().mockResolvedValue(undefined),
  syncPlatformAsset: jest.fn().mockResolvedValue(undefined),
  copyTemplates: jest.fn().mockResolvedValue(undefined),
  copyCommonFiles: jest.fn().mockResolvedValue(undefined),
  copyTestingInstructions: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('./overlays/overlaySeedService', () => ({
  fetchSeedSpecDirName: jest.fn().mockResolvedValue('rnd'),
  discoverAvailableOverlays: jest.fn().mockReturnValue(['api', 'vue']),
  createEffectiveSeedView: jest.fn((tree, githubClient) => ({ tree, githubClient })),
  applySelectedOverlays: jest.fn().mockResolvedValue(undefined),
  ensureMandatorySeedFiles: jest.fn().mockResolvedValue(undefined),
  ensureSpecDirectories: jest.fn().mockResolvedValue(undefined)
}));

const { runScaffold } = require('./scaffoldService');
const { askInitOptions, askOverlays } = require('./ui/prompts');
const { copyTaskSkills, syncPlatformAsset } = require('./fs/seedCopier');

describe('scaffoldService', () => {
  let mockGithubClient;
  let originalAccess;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGithubClient = {
      getTree: jest.fn().mockResolvedValue([{ type: 'blob', path: 'rnd/skills/create-tech-spec/SKILL.md' }])
    };

    const fs = require('fs').promises;
    originalAccess = fs.access;
    fs.access = jest.fn((targetPath) => {
      if (String(targetPath).includes('.git')) return Promise.resolve();
      return Promise.reject(Object.assign(new Error('missing'), { code: 'ENOENT' }));
    });
  });

  afterEach(() => {
    const fs = require('fs').promises;
    fs.access = originalAccess;
  });

  it('refreshes canonical skills and selected generated assets even when resuming from an existing setup', async () => {
    await runScaffold({ cwd: '/test/repo', nonInteractive: false }, { githubClient: mockGithubClient });

    expect(askInitOptions).toHaveBeenCalledWith(false);
    expect(askOverlays).toHaveBeenCalledWith([], ['api', 'vue'], false);
    expect(copyTaskSkills).toHaveBeenCalled();
    expect(syncPlatformAsset).toHaveBeenCalledTimes(2);
  });
});
