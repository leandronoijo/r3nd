const { findSpecDirectories, findFirstSpecDirectory, shouldIgnoreDir, DEFAULT_IGNORE_PATTERNS } = require('./treeSearch');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

describe('treeSearch', () => {
  let tempDir;

  beforeEach(async () => {
    // Create a temporary directory for each test
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'r3nd-tree-test-'));
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  describe('shouldIgnoreDir', () => {
    it('should ignore exact matches', () => {
      expect(shouldIgnoreDir('node_modules', DEFAULT_IGNORE_PATTERNS)).toBe(true);
      expect(shouldIgnoreDir('dist', DEFAULT_IGNORE_PATTERNS)).toBe(true);
      expect(shouldIgnoreDir('.git', DEFAULT_IGNORE_PATTERNS)).toBe(true);
    });

    it('should not ignore non-matching directories', () => {
      expect(shouldIgnoreDir('src', DEFAULT_IGNORE_PATTERNS)).toBe(false);
      expect(shouldIgnoreDir('r3nd', DEFAULT_IGNORE_PATTERNS)).toBe(false);
      expect(shouldIgnoreDir('apps', DEFAULT_IGNORE_PATTERNS)).toBe(false);
    });

    it('should support simple wildcard patterns', () => {
      const patterns = ['test-*', '*.tmp'];
      expect(shouldIgnoreDir('test-123', patterns)).toBe(true);
      expect(shouldIgnoreDir('data.tmp', patterns)).toBe(true);
      expect(shouldIgnoreDir('src', patterns)).toBe(false);
    });
  });

  describe('findSpecDirectories', () => {
    it('should find single directory at root level', async () => {
      await fs.mkdir(path.join(tempDir, 'r3nd'));
      
      const results = await findSpecDirectories(tempDir, 'r3nd');
      expect(results).toEqual(['r3nd']);
    });

    it('should find multiple directories at different levels', async () => {
      // Create directory structure
      await fs.mkdir(path.join(tempDir, 'r3nd'));
      await fs.mkdir(path.join(tempDir, 'apps'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'apps', 'backend'));
      await fs.mkdir(path.join(tempDir, 'apps', 'backend', 'r3nd'));
      await fs.mkdir(path.join(tempDir, 'services'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'services', 'auth', 'r3nd'), { recursive: true });
      
      const results = await findSpecDirectories(tempDir, 'r3nd');
      expect(results).toContain('r3nd');
      expect(results).toContain(path.join('apps', 'backend', 'r3nd'));
      expect(results).toContain(path.join('services', 'auth', 'r3nd'));
      expect(results.length).toBe(3);
    });

    it('should ignore directories in ignore patterns', async () => {
      await fs.mkdir(path.join(tempDir, 'r3nd'));
      await fs.mkdir(path.join(tempDir, 'node_modules', 'package', 'r3nd'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'dist', 'r3nd'), { recursive: true });
      
      const results = await findSpecDirectories(tempDir, 'r3nd');
      expect(results).toEqual(['r3nd']);
    });

    it('should return empty array when no matches found', async () => {
      await fs.mkdir(path.join(tempDir, 'src'));
      await fs.mkdir(path.join(tempDir, 'docs'));
      
      const results = await findSpecDirectories(tempDir, 'r3nd');
      expect(results).toEqual([]);
    });

    it('should respect custom ignore patterns', async () => {
      await fs.mkdir(path.join(tempDir, 'r3nd'));
      await fs.mkdir(path.join(tempDir, 'custom', 'r3nd'), { recursive: true });
      
      const results = await findSpecDirectories(tempDir, 'r3nd', {
        ignorePatterns: ['custom']
      });
      
      expect(results).toEqual(['r3nd']);
    });

    it('should respect maxDepth option', async () => {
      await fs.mkdir(path.join(tempDir, 'r3nd'));
      await fs.mkdir(path.join(tempDir, 'level1', 'level2', 'level3', 'r3nd'), { recursive: true });
      
      const results = await findSpecDirectories(tempDir, 'r3nd', {
        maxDepth: 2
      });
      
      expect(results).toEqual(['r3nd']);
    });

    it('should handle empty directory', async () => {
      const results = await findSpecDirectories(tempDir, 'r3nd');
      expect(results).toEqual([]);
    });

    it('should not descend into matching directories', async () => {
      // Create r3nd/nested/r3nd structure
      await fs.mkdir(path.join(tempDir, 'r3nd', 'nested', 'r3nd'), { recursive: true });
      
      const results = await findSpecDirectories(tempDir, 'r3nd');
      // Should only find the top-level r3nd, not descend into it
      expect(results).toEqual(['r3nd']);
    });
  });

  describe('findFirstSpecDirectory', () => {
    it('should return first matching directory', async () => {
      await fs.mkdir(path.join(tempDir, 'apps', 'backend', 'r3nd'), { recursive: true });
      
      const result = await findFirstSpecDirectory(tempDir, 'r3nd');
      expect(result).toBe(path.join('apps', 'backend', 'r3nd'));
    });

    it('should prefer root-level directory', async () => {
      await fs.mkdir(path.join(tempDir, 'r3nd'));
      await fs.mkdir(path.join(tempDir, 'apps', 'backend', 'r3nd'), { recursive: true });
      
      const result = await findFirstSpecDirectory(tempDir, 'r3nd');
      expect(result).toBe('r3nd');
    });

    it('should return null when no match found', async () => {
      await fs.mkdir(path.join(tempDir, 'src'));
      
      const result = await findFirstSpecDirectory(tempDir, 'r3nd');
      expect(result).toBeNull();
    });

    it('should respect maxDepth option', async () => {
      await fs.mkdir(path.join(tempDir, 'level1', 'level2', 'level3', 'r3nd'), { recursive: true });
      
      const result = await findFirstSpecDirectory(tempDir, 'r3nd', {
        maxDepth: 1
      });
      
      expect(result).toBeNull();
    });
  });
});
