const { listMarkdownFiles, buildPrompt, validateAgentSetup, getFileDisplayName } = require('./agentService');
const fs = require('fs').promises;
const path = require('path');

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    readdir: jest.fn(),
    access: jest.fn(),
    stat: jest.fn()
  }
}));

describe('agentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listMarkdownFiles', () => {
    it('should list all markdown files in directory', async () => {
      const mockEntries = [
        { name: 'file1.md', isFile: () => true },
        { name: 'file2.md', isFile: () => true },
        { name: 'readme.txt', isFile: () => true },
        { name: 'subdir', isFile: () => false }
      ];

      fs.readdir.mockResolvedValue(mockEntries);
      fs.stat.mockImplementation(async (filePath) => ({
        birthtime: new Date(filePath.includes('file1.md') ? '2026-01-02T00:00:00Z' : '2026-01-01T00:00:00Z')
      }));

      const result = await listMarkdownFiles('/test/cwd', 'specs');

      expect(result).toEqual([
        'specs/file1.md',
        'specs/file2.md'
      ]);
      expect(fs.readdir).toHaveBeenCalledWith(
        '/test/cwd/specs',
        { withFileTypes: true }
      );
    });

    it('should return empty array if directory does not exist', async () => {
      fs.readdir.mockRejectedValue({ code: 'ENOENT' });

      const result = await listMarkdownFiles('/test/cwd', 'nonexistent');

      expect(result).toEqual([]);
    });

    it('should sort files alphabetically', async () => {
      const mockEntries = [
        { name: 'zebra.md', isFile: () => true },
        { name: 'alpha.md', isFile: () => true },
        { name: 'beta.md', isFile: () => true }
      ];

      fs.readdir.mockResolvedValue(mockEntries);
      fs.stat
        .mockResolvedValueOnce({ birthtime: new Date('2026-01-03T00:00:00Z') }) // zebra
        .mockResolvedValueOnce({ birthtime: new Date('2026-01-01T00:00:00Z') }) // alpha
        .mockResolvedValueOnce({ birthtime: new Date('2026-01-02T00:00:00Z') }); // beta

      const result = await listMarkdownFiles('/test/cwd', 'specs');

      expect(result).toEqual([
        'specs/zebra.md',
        'specs/beta.md',
        'specs/alpha.md'
      ]);
    });

    it('should throw error for non-ENOENT errors', async () => {
      const error = new Error('Permission denied');
      error.code = 'EACCES';
      fs.readdir.mockRejectedValue(error);

      await expect(listMarkdownFiles('/test/cwd', 'specs')).rejects.toThrow('Permission denied');
    });
  });

  describe('buildPrompt', () => {
    it('should build prompt using agent promptTemplate function', () => {
      const agent = {
        name: 'test-agent',
        agentFile: 'specs/agents/test.md',
        promptTemplate: (agentFile, targetFile) => `Process ${targetFile} with ${agentFile}`
      };

      const result = buildPrompt(agent, 'path/to/spec.md');

      expect(result).toBe('Process path/to/spec.md with specs/agents/test.md');
    });

    it('should throw error if promptTemplate is not a function', () => {
      const agent = {
        name: 'invalid',
        promptTemplate: 'not a function'
      };

      expect(() => buildPrompt(agent, 'test.md')).toThrow('promptTemplate must be a function');
    });
  });

  describe('validateAgentSetup', () => {
    it('should return true when both agent file and target dir exist', async () => {
      fs.access.mockResolvedValue(undefined);

      const agent = {
        agentFile: 'specs/agents/test.md',
        filesDir: 'specs'
      };

      const result = await validateAgentSetup('/test/cwd', agent);

      expect(result).toEqual({
        agentExists: true,
        agentPath: 'specs/agents/test.md',
        targetDirExists: true,
        targetDir: 'specs'
      });
    });

    it('should return false when agent file does not exist', async () => {
      fs.access
        .mockRejectedValueOnce(new Error('Not found')) // Agent file
        .mockResolvedValueOnce(undefined); // Target dir

      const agent = {
        agentFile: 'specs/agents/missing.md',
        filesDir: 'specs'
      };

      const result = await validateAgentSetup('/test/cwd', agent);

      expect(result.agentExists).toBe(false);
      expect(result.targetDirExists).toBe(true);
    });

    it('should return false when target directory does not exist', async () => {
      fs.access
        .mockResolvedValueOnce(undefined) // Agent file
        .mockRejectedValueOnce(new Error('Not found')); // Target dir

      const agent = {
        agentFile: 'specs/agents/test.md',
        filesDir: 'specs/missing'
      };

      const result = await validateAgentSetup('/test/cwd', agent);

      expect(result.agentExists).toBe(true);
      expect(result.targetDirExists).toBe(false);
    });
  });

  describe('getFileDisplayName', () => {
    it('should return just the filename from a path', () => {
      expect(getFileDisplayName('rnd/specs/feature.md')).toBe('feature.md');
      expect(getFileDisplayName('path/to/file.md')).toBe('file.md');
      expect(getFileDisplayName('file.md')).toBe('file.md');
    });

    it('should handle paths with different separators', () => {
      expect(getFileDisplayName('rnd/product_specs/auth-feature.md')).toBe('auth-feature.md');
    });
  });
});
