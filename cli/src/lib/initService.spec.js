// Mock inquirer to avoid ESM import issues
jest.mock('./ui/prompts', () => ({
  askInitOptions: jest.fn().mockResolvedValue(['github', 'cursor', 'vscode']),
  askSeedRepo: jest.fn().mockResolvedValue('leandronoijo/r3nd@develop'),
  askSpecDirName: jest.fn().mockResolvedValue('r3nd')
}));

// Mock config manager
jest.mock('./config/configManager', () => ({
  ConfigManager: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue('leandronoijo/r3nd@develop'),
    set: jest.fn().mockResolvedValue(undefined)
  }))
}));

const { parseAgentFile, migrateLegacyAgent } = require('./initService');

describe('initService', () => {
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
