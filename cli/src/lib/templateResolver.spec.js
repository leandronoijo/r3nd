const { 
  parseTemplate, 
  resolveTemplate, 
  createLocalFileReader,
  createGitHubFileReader 
} = require('./templateResolver');

describe('templateResolver', () => {
  describe('parseTemplate', () => {
    it('should extract single placeholder', () => {
      const content = 'Hello {{world}}!';
      const placeholders = parseTemplate(content);
      expect(placeholders).toEqual(['world']);
    });

    it('should extract multiple placeholders', () => {
      const content = 'Skill: {{rnd/skills/implement-build-plan/SKILL.md}}\n\nVendor: {{rnd/vendor/skills/github.md}}';
      const placeholders = parseTemplate(content);
      expect(placeholders).toEqual(['rnd/skills/implement-build-plan/SKILL.md', 'rnd/vendor/skills/github.md']);
    });

    it('should handle placeholders with whitespace', () => {
      const content = 'Content: {{ rnd/skills/implement-build-plan/SKILL.md }}';
      const placeholders = parseTemplate(content);
      expect(placeholders).toEqual(['rnd/skills/implement-build-plan/SKILL.md']);
    });

    it('should return empty array when no placeholders', () => {
      const content = 'No placeholders here';
      const placeholders = parseTemplate(content);
      expect(placeholders).toEqual([]);
    });

    it('should handle duplicate placeholders', () => {
      const content = '{{file.md}} and {{file.md}} again';
      const placeholders = parseTemplate(content);
      expect(placeholders).toEqual(['file.md', 'file.md']);
    });

    it('should handle empty placeholder', () => {
      const content = 'Empty: {{}}';
      const placeholders = parseTemplate(content);
      // Empty placeholders are valid but will be trimmed to empty string
      expect(placeholders).toEqual([]);
    });

    it('should handle multiline content with placeholders', () => {
      const content = `---
description: "Developer agent"
---

{{rnd/skills/implement-build-plan/SKILL.md}}

Platform-specific instructions here.
`;
      const placeholders = parseTemplate(content);
      expect(placeholders).toEqual(['rnd/skills/implement-build-plan/SKILL.md']);
    });
  });

  describe('resolveTemplate', () => {
    it('should resolve single placeholder', async () => {
      const template = 'Hello {{name}}!';
      const fileReader = async (path) => {
        if (path === 'name') return 'World';
        throw new Error('File not found');
      };

      const resolved = await resolveTemplate(template, fileReader);
      expect(resolved).toBe('Hello World!');
    });

    it('should resolve multiple placeholders', async () => {
      const template = '{{greeting}} {{name}}!';
      const fileReader = async (path) => {
        if (path === 'greeting') return 'Hello';
        if (path === 'name') return 'World';
        throw new Error('File not found');
      };

      const resolved = await resolveTemplate(template, fileReader);
      expect(resolved).toBe('Hello World!');
    });

    it('should resolve duplicate placeholders only once', async () => {
      const template = '{{word}} and {{word}}';
      let callCount = 0;
      const fileReader = async (path) => {
        if (path === 'word') {
          callCount++;
          return 'test';
        }
        throw new Error('File not found');
      };

      const resolved = await resolveTemplate(template, fileReader);
      expect(resolved).toBe('test and test');
      expect(callCount).toBe(1); // Should only call fileReader once
    });

    it('should handle placeholders with whitespace', async () => {
      const template = 'Content: {{ file }}';
      const fileReader = async (path) => {
        if (path === 'file') return 'resolved';
        throw new Error('File not found');
      };

      const resolved = await resolveTemplate(template, fileReader);
      expect(resolved).toBe('Content: resolved');
    });

    it('should return unchanged content when no placeholders', async () => {
      const template = 'No placeholders here';
      const fileReader = async () => {
        throw new Error('Should not be called');
      };

      const resolved = await resolveTemplate(template, fileReader);
      expect(resolved).toBe('No placeholders here');
    });

    it('should throw error when fileReader fails', async () => {
      const template = 'Hello {{missing}}!';
      const fileReader = async (path) => {
        throw new Error(`File not found: ${path}`);
      };

      await expect(resolveTemplate(template, fileReader))
        .rejects
        .toThrow('Failed to resolve placeholder {{missing}}');
    });

    it('should throw error when fileReader is not a function', async () => {
      const template = 'Hello {{name}}!';
      
      await expect(resolveTemplate(template, null))
        .rejects
        .toThrow('fileReader must be a function');
    });

    it('should resolve real-world agent template', async () => {
      const template = `---
description: "Implement features based on build plans"
tools: ["*"]
---

{{rnd/skills/implement-build-plan/SKILL.md}}
`;
      
      const fileReader = async (path) => {
        if (path === 'rnd/skills/implement-build-plan/SKILL.md') {
          return `# implement-build-plan

{{rnd/agents/developer.md}}
{{rnd/vendor/skills/github.md}}`;
        }
        if (path === 'rnd/agents/developer.md') {
          return `# Developer Agent

You are a developer responsible for implementing features according to build plans.`;
        }
        if (path === 'rnd/vendor/skills/github.md') {
          return `## GitHub-Specific Instructions

- Use GitHub Copilot tools effectively
- Follow repository conventions`;
        }
        throw new Error('File not found');
      };

      const resolved = await resolveTemplate(template, fileReader);
      
      expect(resolved).toContain('description: "Implement features based on build plans"');
      expect(resolved).toContain('# Developer Agent');
      expect(resolved).toContain('GitHub-Specific Instructions');
      expect(resolved).not.toContain('{{rnd/skills/implement-build-plan/SKILL.md}}');
    });

    it('should handle path-like placeholders correctly', async () => {
      const template = '{{rnd/skills/create-build-plan/SKILL.md}}';
      const fileReader = async (path) => {
        if (path === 'rnd/skills/create-build-plan/SKILL.md') return 'Build Plan Skill';
        throw new Error('File not found');
      };

      const resolved = await resolveTemplate(template, fileReader);
      expect(resolved).toBe('Build Plan Skill');
    });

    it('should resolve nested placeholders recursively', async () => {
      const template = '{{rnd/skills/create-tech-spec/SKILL.md}}';
      const fileReader = async (path) => {
        if (path === 'rnd/skills/create-tech-spec/SKILL.md') {
          return '# create-tech-spec\n\n{{rnd/agents/architect.md}}\n\n{{rnd/vendor/skills/codex.md}}';
        }
        if (path === 'rnd/agents/architect.md') {
          return '# Architect Agent';
        }
        if (path === 'rnd/vendor/skills/codex.md') {
          return '## Codex-Specific Instructions';
        }
        throw new Error('File not found');
      };

      const resolved = await resolveTemplate(template, fileReader);
      expect(resolved).toContain('# create-tech-spec');
      expect(resolved).toContain('# Architect Agent');
      expect(resolved).toContain('## Codex-Specific Instructions');
    });

    it('should detect circular references', async () => {
      const template = '{{a.md}}';
      const fileReader = async (path) => {
        if (path === 'a.md') return '{{b.md}}';
        if (path === 'b.md') return '{{a.md}}';
        throw new Error('File not found');
      };

      await expect(resolveTemplate(template, fileReader))
        .rejects
        .toThrow('Circular template reference detected');
    });

    it('should handle special regex characters in placeholders', async () => {
      const template = '{{file.with.dots.md}}';
      const fileReader = async (path) => {
        if (path === 'file.with.dots.md') return 'content';
        throw new Error('File not found');
      };

      const resolved = await resolveTemplate(template, fileReader);
      expect(resolved).toBe('content');
    });
  });

  describe('createGitHubFileReader', () => {
    it('should read file from cache', async () => {
      const fileCache = new Map();
      fileCache.set('test.md', Buffer.from('Test content', 'utf-8'));
      
      const fileReader = createGitHubFileReader(fileCache);
      const content = await fileReader('test.md');
      
      expect(content).toBe('Test content');
    });

    it('should throw error when file not in cache', async () => {
      const fileCache = new Map();
      
      const fileReader = createGitHubFileReader(fileCache);
      
      await expect(fileReader('missing.md'))
        .rejects
        .toThrow('File not found in cache: missing.md');
    });

    it('should handle multiple files in cache', async () => {
      const fileCache = new Map();
      fileCache.set('file1.md', Buffer.from('Content 1', 'utf-8'));
      fileCache.set('file2.md', Buffer.from('Content 2', 'utf-8'));
      
      const fileReader = createGitHubFileReader(fileCache);
      
      expect(await fileReader('file1.md')).toBe('Content 1');
      expect(await fileReader('file2.md')).toBe('Content 2');
    });

    it('should handle UTF-8 content correctly', async () => {
      const fileCache = new Map();
      fileCache.set('unicode.md', Buffer.from('Hello 世界 🚀', 'utf-8'));
      
      const fileReader = createGitHubFileReader(fileCache);
      const content = await fileReader('unicode.md');
      
      expect(content).toBe('Hello 世界 🚀');
    });
  });

  describe('createLocalFileReader', () => {
    // Note: createLocalFileReader creates a function that uses fs.readFile
    // We test that it returns the correct type without actually reading files
    it('should return a function', () => {
      const fileReader = createLocalFileReader('/base/path');
      expect(typeof fileReader).toBe('function');
    });

    // Skip the async test as it would try to actually read from filesystem
    it.skip('should be async', () => {
      const fileReader = createLocalFileReader('/base/path');
      const result = fileReader('test.md');
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('integration test', () => {
    it('should compose a complete agent file from wrapper and persona', async () => {
      // Simulate GitHub file cache
      const fileCache = new Map();
      
      fileCache.set('rnd/skills/implement-build-plan/SKILL.md', Buffer.from(`# implement-build-plan

{{rnd/agents/developer.md}}

{{rnd/vendor/skills/github.md}}`, 'utf-8'));

      // Add persona file
      fileCache.set('rnd/agents/developer.md', Buffer.from(`# Developer Agent

You are responsible for implementing features based on build plans.`, 'utf-8'));

      fileCache.set('rnd/vendor/skills/github.md', Buffer.from(`## GitHub Copilot Platform Instructions

When using GitHub Copilot:
- Utilize the full suite of Copilot tools
- Reference instruction files before making changes
- Run tests frequently to validate changes`, 'utf-8'));
      
      // Create wrapper template
      const wrapperTemplate = `---
description: "Implement features and tests based on a build plan"
tools: ["*"]
---

{{rnd/skills/implement-build-plan/SKILL.md}}
`;

      const fileReader = createGitHubFileReader(fileCache);
      const composed = await resolveTemplate(wrapperTemplate, fileReader);
      
      // Verify composition
      expect(composed).toContain('description: "Implement features and tests based on a build plan"');
      expect(composed).toContain('# Developer Agent');
      expect(composed).toContain('## GitHub Copilot Platform Instructions');
      expect(composed).not.toContain('{{rnd/skills/implement-build-plan/SKILL.md}}');
    });
  });
});
