// Mock inquirer to avoid ESM import issues
jest.mock('./ui/prompts', () => ({
  askInitOptions: jest.fn().mockResolvedValue(['github', 'cursor', 'vscode'])
}));

const { parseAgentFile, generateCursorRule, generateVSCodeInstructions } = require('./initService');

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

  describe('generateCursorRule', () => {
    it('should generate valid .mdc format', () => {
      const agent = {
        name: 'developer',
        description: 'Implement features and tests.',
        tools: ['*'],
        content: '# Developer Agent\n\nThis is the content.'
      };

      const result = generateCursorRule(agent);

      expect(result).toContain('---');
      expect(result).toContain('description: "Implement features and tests."');
      expect(result).toContain('globs: ["**/*"]');
      expect(result).toContain('alwaysApply: false');
      expect(result).toContain('# developer');
      expect(result).toContain('# Developer Agent');
    });

    it('should include agent content in the rule', () => {
      const agent = {
        name: 'architect',
        description: 'Convert specs to designs.',
        tools: ['*'],
        content: '## Purpose\n\nCreate technical specifications.'
      };

      const result = generateCursorRule(agent);

      expect(result).toContain('## Purpose');
      expect(result).toContain('Create technical specifications.');
    });
  });

  describe('generateVSCodeInstructions', () => {
    it('should generate combined instructions for multiple agents', () => {
      const agents = [
        {
          name: 'developer',
          description: 'Implement features.',
          content: 'Developer content here.'
        },
        {
          name: 'architect',
          description: 'Create designs.',
          content: 'Architect content here.'
        }
      ];

      const result = generateVSCodeInstructions(agents);

      expect(result).toContain('# Copilot Custom Instructions');
      expect(result).toContain('## developer');
      expect(result).toContain('**Description:** Implement features.');
      expect(result).toContain('Developer content here.');
      expect(result).toContain('## architect');
      expect(result).toContain('**Description:** Create designs.');
      expect(result).toContain('Architect content here.');
    });

    it('should handle empty agents array', () => {
      const result = generateVSCodeInstructions([]);

      expect(result).toContain('# Copilot Custom Instructions');
      // Should not throw, should just be the header
    });

    it('should include horizontal rules between agents', () => {
      const agents = [
        { name: 'agent1', description: 'Desc 1', content: 'Content 1' },
        { name: 'agent2', description: 'Desc 2', content: 'Content 2' }
      ];

      const result = generateVSCodeInstructions(agents);

      // Should have separators between agents
      expect(result.split('---').length).toBeGreaterThan(1);
    });
  });
});
