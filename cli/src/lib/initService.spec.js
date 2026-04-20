// Mock inquirer to avoid ESM import issues
jest.mock('./ui/prompts', () => ({
  askOverlays: jest.fn().mockResolvedValue(['api', 'vue']),
  askInitOptions: jest.fn().mockResolvedValue(['github', 'cursor', 'codex', 'claude']),
  askSeedRepo: jest.fn().mockResolvedValue('leandronoijo/r3nd@develop'),
  askSpecDirName: jest.fn().mockResolvedValue('r3nd')
}));

// Mock config manager
jest.mock('./config/configManager', () => ({
  ConfigManager: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue('leandronoijo/r3nd@develop'),
    set: jest.fn().mockResolvedValue(undefined),
    getOverlays: jest.fn().mockResolvedValue([])
  }))
}));

jest.mock('./fs/seedCopier', () => ({
  copyAgentPersonas: jest.fn().mockResolvedValue(undefined),
  copyBuildPlans: jest.fn().mockResolvedValue(undefined),
  copyTaskSkills: jest.fn().mockResolvedValue(undefined),
  syncPlatformAsset: jest.fn().mockResolvedValue(undefined),
  copyTemplates: jest.fn().mockResolvedValue(undefined),
  copyCommonFiles: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('./overlays/overlaySeedService', () => ({
  fetchSeedSpecDirName: jest.fn().mockResolvedValue('rnd'),
  discoverAvailableOverlays: jest.fn().mockReturnValue(['api', 'vue']),
  applySelectedOverlays: jest.fn().mockResolvedValue(undefined)
}));

const { parseAgentFile, migrateLegacyAgent, runInit } = require('./initService');
const { askOverlays } = require('./ui/prompts');
const { applySelectedOverlays } = require('./overlays/overlaySeedService');

describe('initService', () => {
  describe('runInit', () => {
    let originalAccess;

    beforeEach(() => {
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

    it('selects and applies overlays during init', async () => {
      const mockGithubClient = {
        getTree: jest.fn().mockResolvedValue([{ type: 'blob', path: 'rnd/templates/build_plan.md' }])
      };

      await runInit({ cwd: '/test/repo', nonInteractive: false }, { githubClient: mockGithubClient });

      expect(askOverlays).toHaveBeenCalledWith([], ['api', 'vue'], false);
      expect(applySelectedOverlays).toHaveBeenCalledWith(
        '/test/repo',
        expect.any(Array),
        mockGithubClient,
        'r3nd',
        'rnd',
        ['api', 'vue'],
        { nonInteractive: false, overwriteExisting: true }
      );
    });
  });

  describe('parseAgentFile', () => {
    it('should parse agent file with frontmatter correctly', () => {
      const content = `---
name: developer
description: Implement features and tests based on a build plan.
target: github-copilot
tools: ["*"]
---

# Developer Agent

This is the developer agent.
`;

      const result = parseAgentFile(content);

      expect(result.name).toBe('developer');
      expect(result.description).toBe('Implement features and tests based on a build plan.');
      expect(result.tools).toEqual(['*']);
      expect(result.content).toContain('# Developer Agent');
    });

    it('should parse agent file with multiple tools', () => {
      const content = `---
name: architect
description: Convert product specs into technical specifications.
tools: ["read", "write", "analyze"]
---

# Architect Agent
`;

      const result = parseAgentFile(content);

      expect(result.name).toBe('architect');
      expect(result.tools).toEqual(['read', 'write', 'analyze']);
    });

    it('should handle quoted string values', () => {
      const content = `---
name: "my-agent"
description: "A description with special: characters"
tools: ["*"]
---

Content
`;

      const result = parseAgentFile(content);

      expect(result.name).toBe('my-agent');
      expect(result.description).toBe('A description with special: characters');
    });

    it('should return defaults for missing fields', () => {
      const content = `---
---

# Content without metadata
`;

      const result = parseAgentFile(content);

      expect(result.name).toBe('unknown');
      expect(result.description).toBe('');
      expect(result.tools).toEqual(['*']);
    });
  });

  describe('migrateLegacyAgent', () => {
    it('should extract content from legacy agent file', () => {
      const legacyContent = `---
name: developer
description: Implement features and tests based on a build plan.
target: github-copilot
tools: ["*"]
---

# Developer Agent

This is the developer agent.
`;

      const result = migrateLegacyAgent(legacyContent);

      expect(result).toContain('# Developer Agent');
      expect(result).toContain('This is the developer agent.');
      expect(result).not.toContain('---');
      expect(result).not.toContain('name: developer');
    });

    it('should handle agent file without frontmatter', () => {
      const content = '# Developer Agent\n\nContent here.';
      
      const result = migrateLegacyAgent(content);
      
      expect(result).toBe('# Developer Agent\n\nContent here.');
    });
  });

  // Legacy function tests removed - generateCursorCommand and generateVSCodeChatMode
  // are now internal functions only used during migration. The new template-based
  // composition approach (via templateResolver) replaces these functions.
});
