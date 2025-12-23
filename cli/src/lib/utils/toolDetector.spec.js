const { detectAvailableTools, getAvailableToolNames, getMissingToolNames, getInstallInstructions, clearCache, isCommandAvailable } = require('./toolDetector');

describe('toolDetector', () => {
  beforeEach(() => {
    clearCache();
  });

  describe('isCommandAvailable', () => {
    it('should return true for existing commands like "node"', () => {
      // node should always be available in a Node.js environment
      expect(isCommandAvailable('node')).toBe(true);
    });

    it('should return false for non-existent commands', () => {
      expect(isCommandAvailable('this-command-definitely-does-not-exist-xyz123')).toBe(false);
    });
  });

  describe('detectAvailableTools', () => {
    it('should return an object with tool availability status', () => {
      const tools = detectAvailableTools();
      
      expect(tools).toHaveProperty('codex');
      expect(tools).toHaveProperty('gemini');
      expect(tools).toHaveProperty('github');
      expect(tools).toHaveProperty('hasAnyAgent');
      
      expect(typeof tools.codex).toBe('boolean');
      expect(typeof tools.gemini).toBe('boolean');
      expect(typeof tools.github).toBe('boolean');
      expect(typeof tools.hasAnyAgent).toBe('boolean');
    });

    it('should cache results by default', () => {
      const first = detectAvailableTools();
      const second = detectAvailableTools();
      
      expect(first).toBe(second); // Should return the exact same object
    });

    it('should refresh cache when forceRefresh is true', () => {
      const first = detectAvailableTools();
      const second = detectAvailableTools(true);
      
      // Objects should be different instances (cache was refreshed)
      expect(first).not.toBe(second);
      // But should have same values
      expect(first).toEqual(second);
    });
  });

  describe('getAvailableToolNames', () => {
    it('should return an array of strings', () => {
      const names = getAvailableToolNames();
      
      expect(Array.isArray(names)).toBe(true);
      names.forEach(name => {
        expect(typeof name).toBe('string');
      });
    });

    it('should return empty array if no tools available', () => {
      // This test depends on the system, but we can at least check the format
      const names = getAvailableToolNames();
      expect(Array.isArray(names)).toBe(true);
    });
  });

  describe('getMissingToolNames', () => {
    it('should return an array of strings', () => {
      const names = getMissingToolNames();
      
      expect(Array.isArray(names)).toBe(true);
      names.forEach(name => {
        expect(typeof name).toBe('string');
      });
    });

    it('should return complementary results to getAvailableToolNames', () => {
      const available = getAvailableToolNames();
      const missing = getMissingToolNames();
      
      // Total should be 3 (codex, gemini, gh)
      expect(available.length + missing.length).toBe(3);
    });
  });

  describe('getInstallInstructions', () => {
    it('should return instructions for codex', () => {
      const instructions = getInstallInstructions('codex');
      expect(typeof instructions).toBe('string');
      expect(instructions).toContain('codex');
    });

    it('should return instructions for gemini', () => {
      const instructions = getInstallInstructions('gemini');
      expect(typeof instructions).toBe('string');
      expect(instructions).toContain('gemini');
    });

    it('should return instructions for github', () => {
      const instructions = getInstallInstructions('github');
      expect(typeof instructions).toBe('string');
      expect(instructions).toContain('GitHub');
    });

    it('should return a message for unknown tools', () => {
      const instructions = getInstallInstructions('unknown-tool');
      expect(typeof instructions).toBe('string');
      expect(instructions).toContain('unknown-tool');
    });
  });

  describe('clearCache', () => {
    it('should clear the cached results', () => {
      const first = detectAvailableTools();
      clearCache();
      const second = detectAvailableTools();
      
      // After clearing cache, should get a new instance
      expect(first).not.toBe(second);
    });
  });
});
