// Mock inquirer to avoid ESM import issues
jest.mock('./ui/prompts', () => ({
  askUpdateOptions: jest.fn().mockResolvedValue(['templates', 'skills', 'github-skills', 'github-workflows', 'cursor', 'codex', 'claude']),
  askSeedRepo: jest.fn().mockResolvedValue('leandronoijo/r3nd@develop'),
  askSpecDirName: jest.fn().mockResolvedValue('r3nd')
}));

// Mock config manager
jest.mock('./config/configManager', () => ({
  ConfigManager: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue('leandronoijo/r3nd@develop'),
    set: jest.fn().mockResolvedValue(undefined),
    getSpecDirName: jest.fn().mockResolvedValue('r3nd')
  }))
}));

// Mock seed copier
jest.mock('./fs/seedCopier', () => ({
  copyTemplates: jest.fn().mockResolvedValue(undefined),
  copyTaskSkills: jest.fn().mockResolvedValue(undefined),
  syncPlatformAsset: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('./overlays/overlaySeedService', () => ({
  fetchSeedSpecDirName: jest.fn().mockResolvedValue('rnd')
}));

const { runUpdate } = require('./updateService');
const { askUpdateOptions } = require('./ui/prompts');
const { copyTemplates, copyTaskSkills, syncPlatformAsset } = require('./fs/seedCopier');
const logger = require('./utils/logger');

describe('updateService', () => {
  let mockGithubClient;
  let mockFs;
  let originalAccess;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock GitHubClient
    mockGithubClient = {
      getTree: jest.fn().mockResolvedValue([
        { type: 'blob', path: 'rnd/templates/build_plan.md' },
        { type: 'blob', path: '.github/skills/implement-build-plan/SKILL.md' },
        { type: 'blob', path: '.github/workflows/02-product-spec-ready.yml' },
      ]),
      fetchRaw: jest.fn().mockResolvedValue(Buffer.from('mock content'))
    };

    // Mock fs.access for git check
    const fs = require('fs').promises;
    originalAccess = fs.access;
    fs.access = jest.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    // Restore original fs.access
    const fs = require('fs').promises;
    fs.access = originalAccess;
  });

  describe('runUpdate', () => {
    it('should handle non-interactive mode with all options', async () => {
      const opts = { cwd: '/test/dir', nonInteractive: true };
      const deps = { githubClient: mockGithubClient };

      await runUpdate(opts, deps);

      // Verify askUpdateOptions was called with nonInteractive flag
      expect(askUpdateOptions).toHaveBeenCalledWith(true);
      
      expect(mockGithubClient.getTree).toHaveBeenCalled();
      
      expect(copyTemplates).toHaveBeenCalled();
      expect(copyTaskSkills).toHaveBeenCalled();
      expect(syncPlatformAsset).toHaveBeenCalled();
    });

    it('should handle empty selection', async () => {
      askUpdateOptions.mockResolvedValueOnce([]);
      
      const opts = { cwd: '/test/dir', nonInteractive: false };
      const deps = { githubClient: mockGithubClient };

      await runUpdate(opts, deps);

      // Should return early without calling getTree
      expect(mockGithubClient.getTree).not.toHaveBeenCalled();
    });

    it('should handle GitHub option only', async () => {
      askUpdateOptions.mockResolvedValueOnce(['github-skills']);
      
      const opts = { cwd: '/test/dir', nonInteractive: false };
      const deps = { githubClient: mockGithubClient };

      await runUpdate(opts, deps);

      expect(mockGithubClient.getTree).toHaveBeenCalled();
      expect(syncPlatformAsset).toHaveBeenCalledTimes(1);
    });

    it('should warn when not in a git repository', async () => {
      const fs = require('fs').promises;
      fs.access = jest.fn().mockRejectedValue(new Error('Not found'));
      
      const loggerSpy = jest.spyOn(logger, 'warn');
      
      askUpdateOptions.mockResolvedValueOnce(['templates']);
      
      const opts = { cwd: '/test/dir', nonInteractive: false };
      const deps = { githubClient: mockGithubClient };

      await runUpdate(opts, deps);

      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('not a git repository'));
    });
  });
});
