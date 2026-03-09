// Mock inquirer to avoid ESM import issues
jest.mock('./ui/prompts', () => ({
  askUpdateOptions: jest.fn().mockResolvedValue(['templates', 'agents', 'github', 'cursor', 'codex', 'claude', 'vscode']),
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

// Mock initService functions
jest.mock('./initService', () => ({
  parseAgentFile: jest.fn((content) => ({
    name: 'test-agent',
    description: 'Test description',
    tools: ['*'],
    content: 'Test content'
  })),
  generateCursorCommand: jest.fn((agent) => `# ${agent.name}\n\n${agent.content}`),
  generateVSCodeChatMode: jest.fn((agent) => `---\ndescription: "${agent.description}"\n---\n\n${agent.content}`)
}));

// Mock fileWriter
jest.mock('./fs/fileWriter', () => ({
  writeBuffer: jest.fn().mockResolvedValue(undefined),
  ensureDir: jest.fn().mockResolvedValue(undefined)
}));

// Mock seed copier
jest.mock('./fs/seedCopier', () => ({
  copyInstructionsToGitHub: jest.fn().mockResolvedValue(undefined)
}));

const { runUpdate } = require('./updateService');
const { askUpdateOptions } = require('./ui/prompts');
const { writeBuffer } = require('./fs/fileWriter');
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
        { type: 'blob', path: '.github/agents/developer.agent.md' },
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
      
      // Verify GitHubClient methods were called
      expect(mockGithubClient.getTree).toHaveBeenCalled();
      expect(mockGithubClient.fetchRaw).toHaveBeenCalled();
      
      // Verify files were written
      expect(writeBuffer).toHaveBeenCalled();
    });

    it('should handle empty selection', async () => {
      askUpdateOptions.mockResolvedValueOnce([]);
      
      const opts = { cwd: '/test/dir', nonInteractive: false };
      const deps = { githubClient: mockGithubClient };

      await runUpdate(opts, deps);

      // Should return early without calling getTree
      expect(mockGithubClient.getTree).not.toHaveBeenCalled();
      expect(mockGithubClient.fetchRaw).not.toHaveBeenCalled();
    });

    it('should handle GitHub option only', async () => {
      askUpdateOptions.mockResolvedValueOnce(['github']);
      
      const opts = { cwd: '/test/dir', nonInteractive: false };
      const deps = { githubClient: mockGithubClient };

      await runUpdate(opts, deps);

      // Verify tree was fetched
      expect(mockGithubClient.getTree).toHaveBeenCalled();
      expect(mockGithubClient.fetchRaw).toHaveBeenCalled();
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
