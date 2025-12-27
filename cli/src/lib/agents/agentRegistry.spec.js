const { getAgents, getAgent, registerAgent } = require('./agentRegistry');

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

    it('should include tech-spec, build-plan, and develop agents', () => {
      const agents = getAgents();
      const names = agents.map(a => a.name);
      expect(names).toContain('tech-spec');
      expect(names).toContain('build-plan');
      expect(names).toContain('develop');
    });
  });

  describe('getAgent', () => {
    it('should return agent config by name', () => {
      const agent = getAgent('tech-spec');
      expect(agent).toBeDefined();
      expect(agent.name).toBe('tech-spec');
      expect(agent.filesDir).toBe('rnd/product_specs');
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
        agentFile: '.github/agents/test.agent.md',
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
        name: 'tech-spec', // Already exists
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
    it('should generate correct prompt for tech-spec agent', () => {
      const agent = getAgent('tech-spec');
      const prompt = agent.promptTemplate(agent.agentFile, 'rnd/product_specs/feature.md');
      
      expect(prompt).toContain('.github/agents/architect.agent.md');
      expect(prompt).toContain('rnd/product_specs/feature.md');
      expect(prompt).toContain('technical specification');
    });

    it('should generate correct prompt for build-plan agent', () => {
      const agent = getAgent('build-plan');
      const prompt = agent.promptTemplate(agent.agentFile, 'rnd/tech_specs/feature.md');
      
      expect(prompt).toContain('.github/agents/team-lead.agent.md');
      expect(prompt).toContain('rnd/tech_specs/feature.md');
      expect(prompt).toContain('build plan');
    });

    it('should generate correct prompt for develop agent', () => {
      const agent = getAgent('develop');
      const prompt = agent.promptTemplate(agent.agentFile, 'rnd/build_plans/feature.md');
      
      expect(prompt).toContain('.github/agents/developer.agent.md');
      expect(prompt).toContain('rnd/build_plans/feature.md');
      expect(prompt).toContain('implement');
    });
  });
});
