const { getAgents, getAgent, registerAgent, resolveAgentConfig } = require('./agentRegistry');

describe('agentRegistry', () => {
  describe('getAgents', () => {
    it('should return an array of agent configurations', () => {
      const agents = getAgents();
      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBeGreaterThan(0);
    });

    it('should include required fields in each agent config', () => {
      const agents = getAgents();
      agents.forEach(agent => {
        expect(agent).toHaveProperty('name');
        expect(agent).toHaveProperty('description');
        expect(agent).toHaveProperty('filesDir');
        expect(agent).toHaveProperty('agentFile');
        expect(agent).toHaveProperty('promptTemplate');
        expect(typeof agent.promptTemplate).toBe('function');
      });
    });

    it('should include core planning/implementation and analysis agents', () => {
      const agents = getAgents();
      const names = agents.map(a => a.name);
      expect(names).toContain('create-tech-spec');
      expect(names).toContain('create-build-plan');
      expect(names).toContain('implement-build-plan');
      expect(names).toContain('implement-feature');
      expect(names).toContain('analyze-repo-context');
      expect(names).toContain('analyze-app-context');
      expect(names).toContain('analyze-module-context');
    });
  });

  describe('getAgent', () => {
    it('should return agent config by name', () => {
      const agent = getAgent('create-tech-spec');
      expect(agent).toBeDefined();
      expect(agent.name).toBe('create-tech-spec');
      expect(typeof agent.filesDir).toBe('function');
    });

    it('should return undefined for non-existent agent', () => {
      const agent = getAgent('non-existent');
      expect(agent).toBeUndefined();
    });
  });

  describe('registerAgent', () => {
    // Store original length to restore after tests
    let originalLength;

    beforeEach(() => {
      originalLength = getAgents().length;
    });

    afterEach(() => {
      // Clean up: remove any agents added during tests
      const agents = getAgents();
      while (agents.length > originalLength) {
        agents.pop();
      }
    });

    it('should register a new agent successfully', () => {
      const newAgent = {
        name: 'test-agent',
        description: 'Test agent',
        filesDir: 'test/dir',
        agentFile: 'specs/skills/test-agent/SKILL.md',
        promptTemplate: (agentFile, targetFile) => `Test prompt for ${targetFile}`
      };

      registerAgent(newAgent);
      
      const registered = getAgent('test-agent');
      expect(registered).toBeDefined();
      expect(registered.name).toBe('test-agent');
    });

    it('should throw error if required fields are missing', () => {
      const invalidAgent = {
        name: 'invalid',
        description: 'Missing fields'
        // Missing filesDir, agentFile, promptTemplate
      };

      expect(() => registerAgent(invalidAgent)).toThrow('missing required fields');
    });

    it('should throw error if agent name already exists', () => {
      const duplicateAgent = {
        name: 'create-tech-spec', // Already exists
        description: 'Duplicate',
        filesDir: 'test',
        agentFile: 'test',
        promptTemplate: () => 'test'
      };

      expect(() => registerAgent(duplicateAgent)).toThrow('already registered');
    });

    it('should validate promptTemplate is a function', () => {
      const agent = {
        name: 'invalid-template',
        description: 'Invalid template',
        filesDir: 'test',
        agentFile: 'test',
        promptTemplate: 'not a function' // Invalid
      };

      expect(() => registerAgent(agent)).toThrow('missing required fields');
    });
  });

  describe('promptTemplate functions', () => {
    it('should generate correct prompt for create-tech-spec agent', () => {
      const agent = getAgent('create-tech-spec');
      const resolved = resolveAgentConfig(agent, 'specs');
      const prompt = resolved.promptTemplate(resolved.agentFile, 'specs/product_specs/feature.md', resolved.fullSpecDir);
      
      expect(prompt).toContain('specs/skills/create-tech-spec/SKILL.md');
      expect(prompt).toContain('specs/product_specs/feature.md');
      expect(prompt).toContain('technical specification');
      expect(prompt).toContain('specs/tech_specs/');
    });

    it('should generate correct prompt for create-build-plan agent', () => {
      const agent = getAgent('create-build-plan');
      const resolved = resolveAgentConfig(agent, 'specs');
      const prompt = resolved.promptTemplate(resolved.agentFile, 'specs/tech_specs/feature.md', resolved.fullSpecDir);
      
      expect(prompt).toContain('specs/skills/create-build-plan/SKILL.md');
      expect(prompt).toContain('specs/tech_specs/feature.md');
      expect(prompt).toContain('build plan');
      expect(prompt).toContain('specs/build_plans/');
    });

    it('should generate correct prompt for implement-build-plan agent', () => {
      const agent = getAgent('implement-build-plan');
      const resolved = resolveAgentConfig(agent, 'specs');
      const prompt = resolved.promptTemplate(resolved.agentFile, 'specs/build_plans/feature.md', resolved.fullSpecDir);
      
      expect(prompt).toContain('specs/skills/implement-build-plan/SKILL.md');
      expect(prompt).toContain('specs/build_plans/feature.md');
      expect(prompt).toContain('implement');
    });

    it('should generate correct prompt for implement-feature agent', () => {
      const agent = getAgent('implement-feature');
      const resolved = resolveAgentConfig(agent, 'specs');
      const prompt = resolved.promptTemplate(resolved.agentFile, 'specs/tech_specs/feature.md', resolved.fullSpecDir);
      
      expect(prompt).toContain('specs/skills/implement-feature/SKILL.md');
      expect(prompt).toContain('specs/tech_specs/feature.md');
      expect(prompt).toContain('strict workflow');
      expect(prompt).toContain('specs/agent_runs/');
    });

    it('should use custom spec directory base', () => {
      const agent = getAgent('create-product-spec');
      const resolved = resolveAgentConfig(agent, 'r3nd', 'apps/my-app');
      
      expect(resolved.fullSpecDir).toBe('apps/my-app/r3nd');
      expect(resolved.agentFile).toBe('apps/my-app/r3nd/skills/create-product-spec/SKILL.md');
      
      const prompt = resolved.promptTemplate(resolved.agentFile, 'test input', resolved.fullSpecDir);
      expect(prompt).toContain('apps/my-app/r3nd/product_specs/');
    });

    it('should default to root spec directory when no base provided', () => {
      const agent = getAgent('create-product-spec');
      const resolved = resolveAgentConfig(agent, 'r3nd');
      
      expect(resolved.fullSpecDir).toBe('r3nd');
      expect(resolved.agentFile).toBe('r3nd/skills/create-product-spec/SKILL.md');
      
      const prompt = resolved.promptTemplate(resolved.agentFile, 'test input', resolved.fullSpecDir);
      expect(prompt).toContain('r3nd/product_specs/');
    });

    it('should generate path-validation prompt for analyze-repo-context agent', () => {
      const agent = getAgent('analyze-repo-context');
      const resolved = resolveAgentConfig(agent, 'specs');
      const prompt = resolved.promptTemplate(resolved.agentFile, '.', resolved.fullSpecDir);

      expect(prompt).toContain('specs/skills/analyze-repo-context/SKILL.md');
      expect(prompt).toContain('repository-level scope path');
      expect(prompt).toContain('If it is missing or invalid');
    });

    it('should resolve implement-feature paths with custom spec directory base', () => {
      const agent = getAgent('implement-feature');
      const resolved = resolveAgentConfig(agent, 'r3nd', 'apps/my-app');

      expect(resolved.fullSpecDir).toBe('apps/my-app/r3nd');
      expect(resolved.agentFile).toBe('apps/my-app/r3nd/skills/implement-feature/SKILL.md');
      expect(resolved.filesDir).toBe('apps/my-app/r3nd/tech_specs');

      const prompt = resolved.promptTemplate(
        resolved.agentFile,
        'apps/my-app/r3nd/tech_specs/feature.md',
        resolved.fullSpecDir
      );
      expect(prompt).toContain('apps/my-app/r3nd/agent_runs/');
    });
  });
});
