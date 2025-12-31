// Mock inquirer to avoid ESM import issues
jest.mock('./ui/prompts', () => ({
  askInitOptions: jest.fn().mockResolvedValue(['github', 'cursor', 'vscode'])
}));

const { parseAgentFile, generateCursorCommand, generateVSCodeChatMode } = require('./initService');

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

  describe('generateCursorCommand', () => {
    it('should generate valid command format', () => {
      const agent = {
        name: 'developer',
        description: 'Implement features and tests.',
        tools: ['*'],
        content: '# Developer Agent\n\nThis is the content.'
      };

      const result = generateCursorCommand(agent);

      expect(result).toContain('# developer');
      expect(result).toContain('Implement features and tests.');
      expect(result).toContain('# Developer Agent');
      expect(result).toContain('This is the content.');
    });

    it('should include agent content in the command', () => {
      const agent = {
        name: 'architect',
        description: 'Convert specs to designs.',
        tools: ['*'],
        content: '## Purpose\n\nCreate technical specifications.'
      };

      const result = generateCursorCommand(agent);

      expect(result).toContain('## Purpose');
      expect(result).toContain('Create technical specifications.');
    });
  });

  describe('generateVSCodeChatMode', () => {
    it('should generate valid chatmode.md format with YAML frontmatter', () => {
      const agent = {
        name: 'developer',
        description: 'Implement features.',
        tools: ['*'],
        content: 'Developer content here.'
      };

      const result = generateVSCodeChatMode(agent);

      expect(result).toContain('---');
      expect(result).toContain('description: "Implement features."');
      expect(result).toContain('tools: ["*"]');
      expect(result).toContain('Developer content here.');
    });

    it('should handle multiple tools', () => {
      const agent = {
        name: 'architect',
        description: 'Create designs.',
        tools: ['codebase', 'search', 'terminal'],
        content: 'Architect content here.'
      };

      const result = generateVSCodeChatMode(agent);

      expect(result).toContain('tools: ["codebase", "search", "terminal"]');
    });

    it('should include agent content after frontmatter', () => {
      const agent = {
        name: 'team-lead',
        description: 'Lead the team.',
        tools: ['*'],
        content: '## Purpose\n\nLead the team effectively.'
      };

      const result = generateVSCodeChatMode(agent);

      expect(result).toContain('## Purpose');
      expect(result).toContain('Lead the team effectively.');
    });
  });
});
