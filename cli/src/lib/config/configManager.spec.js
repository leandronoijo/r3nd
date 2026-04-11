const { ConfigManager } = require('./configManager');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

describe('ConfigManager', () => {
  let tempDir;
  let configManager;

  beforeEach(async () => {
    // Create a temporary directory for each test
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'r3nd-config-test-'));
    configManager = new ConfigManager(tempDir);
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  describe('load', () => {
    it('should return empty object when config file does not exist', async () => {
      const config = await configManager.load();
      expect(config).toEqual({});
    });

    it('should load existing config file', async () => {
      const testConfig = { 'seed-repo': 'owner/repo@branch' };
      await fs.writeFile(
        path.join(tempDir, 'r3nd.yaml'),
        'seed-repo: owner/repo@branch\n',
        'utf-8'
      );

      const config = await configManager.load();
      expect(config).toEqual(testConfig);
    });

    it('should cache loaded config', async () => {
      const testConfig = { 'seed-repo': 'owner/repo@branch' };
      await fs.writeFile(
        path.join(tempDir, 'r3nd.yaml'),
        'seed-repo: owner/repo@branch\n',
        'utf-8'
      );

      const config1 = await configManager.load();
      const config2 = await configManager.load();
      
      expect(config1).toBe(config2); // Same object reference
    });
  });

  describe('save', () => {
    it('should save config to file', async () => {
      const testConfig = { 'seed-repo': 'owner/repo@branch' };
      await configManager.save(testConfig);

      const content = await fs.readFile(
        path.join(tempDir, 'r3nd.yaml'),
        'utf-8'
      );
      expect(content).toContain('seed-repo: owner/repo@branch');
    });

    it('should update cache after save', async () => {
      const testConfig = { 'seed-repo': 'owner/repo@branch' };
      await configManager.save(testConfig);

      expect(configManager._cache).toEqual(testConfig);
    });
  });

  describe('get', () => {
    it('should return undefined for missing key', async () => {
      const value = await configManager.get('seed-repo');
      expect(value).toBeUndefined();
    });

    it('should return value for existing key', async () => {
      await configManager.save({ 'seed-repo': 'owner/repo@branch' });
      const value = await configManager.get('seed-repo');
      expect(value).toBe('owner/repo@branch');
    });
  });

  describe('set', () => {
    it('should set a new config value', async () => {
      await configManager.set('seed-repo', 'owner/repo@branch');
      
      const value = await configManager.get('seed-repo');
      expect(value).toBe('owner/repo@branch');
    });

    it('should update an existing config value', async () => {
      await configManager.set('seed-repo', 'owner1/repo1@branch1');
      await configManager.set('seed-repo', 'owner2/repo2@branch2');
      
      const value = await configManager.get('seed-repo');
      expect(value).toBe('owner2/repo2@branch2');
    });

    it('should persist changes to file', async () => {
      await configManager.set('seed-repo', 'owner/repo@branch');
      
      // Create new instance to force reload from file
      const newConfigManager = new ConfigManager(tempDir);
      const value = await newConfigManager.get('seed-repo');
      expect(value).toBe('owner/repo@branch');
    });
  });

  describe('getAll', () => {
    it('should return all config values', async () => {
      await configManager.save({ 'seed-repo': 'owner/repo@branch' });
      
      const config = await configManager.getAll();
      expect(config).toEqual({ 'seed-repo': 'owner/repo@branch' });
    });
  });

  describe('exists', () => {
    it('should return false when config file does not exist', async () => {
      const exists = await configManager.exists();
      expect(exists).toBe(false);
    });

    it('should return true when config file exists', async () => {
      await configManager.save({ 'seed-repo': 'owner/repo@branch' });
      
      const exists = await configManager.exists();
      expect(exists).toBe(true);
    });
  });

  describe('clearCache', () => {
    it('should clear the in-memory cache', async () => {
      await configManager.load();
      expect(configManager._cache).not.toBeNull();
      
      configManager.clearCache();
      expect(configManager._cache).toBeNull();
    });
  });

  describe('parseSeedRepo', () => {
    it('should parse owner/repo format with default branch', () => {
      const result = ConfigManager.parseSeedRepo('owner/repo');
      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
        branch: 'develop'
      });
    });

    it('should parse owner/repo@branch format', () => {
      const result = ConfigManager.parseSeedRepo('owner/repo@main');
      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
        branch: 'main'
      });
    });

    it('should return null for invalid format', () => {
      expect(ConfigManager.parseSeedRepo('invalid')).toBeNull();
      expect(ConfigManager.parseSeedRepo('owner/repo/extra')).toBeNull();
      expect(ConfigManager.parseSeedRepo('')).toBeNull();
      expect(ConfigManager.parseSeedRepo(null)).toBeNull();
    });

    it('should handle branches with special characters', () => {
      const result = ConfigManager.parseSeedRepo('owner/repo@feature/branch-name');
      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
        branch: 'feature/branch-name'
      });
    });
  });

  describe('isValidKey', () => {
    it('should return true for valid keys', () => {
      expect(ConfigManager.isValidKey('seed-repo')).toBe(true);
      expect(ConfigManager.isValidKey('spec-dir-name')).toBe(true);
      expect(ConfigManager.isValidKey('worktree-copy-files')).toBe(true);
      expect(ConfigManager.isValidKey('worktree-open-command')).toBe(true);
    });

    it('should return false for invalid keys', () => {
      expect(ConfigManager.isValidKey('invalid-key')).toBe(false);
      expect(ConfigManager.isValidKey('')).toBe(false);
    });
  });

  describe('getDefaults', () => {
    it('should return default configuration', () => {
      const defaults = ConfigManager.getDefaults();
      expect(defaults).toEqual({
        'seed-repo': 'leandronoijo/r3nd@develop',
        'spec-dir-name': 'r3nd',
        'worktree-copy-files': ['*.env', '**/*.env'],
        'worktree-open-command': ['code', '{worktreeDir}']
      });
    });
  });

  describe('getSpecDirName', () => {
    it('should return default value when not configured', async () => {
      const dirName = await configManager.getSpecDirName();
      expect(dirName).toBe('r3nd');
    });

    it('should return configured value', async () => {
      await configManager.set('spec-dir-name', 'specs');
      const dirName = await configManager.getSpecDirName();
      expect(dirName).toBe('specs');
    });

    it('should return default when config file has other values', async () => {
      await configManager.save({ 'seed-repo': 'owner/repo@branch' });
      const dirName = await configManager.getSpecDirName();
      expect(dirName).toBe('r3nd');
    });
  });

  describe('worktree config helpers', () => {
    it('should return default worktree copy patterns when not configured', async () => {
      const patterns = await configManager.getWorktreeCopyFiles();
      expect(patterns).toEqual(['*.env', '**/*.env']);
    });

    it('should normalize a configured string worktree copy pattern into an array', async () => {
      await configManager.set('worktree-copy-files', '*.local');
      const patterns = await configManager.getWorktreeCopyFiles();
      expect(patterns).toEqual(['*.local']);
    });

    it('should return default worktree open command when not configured', async () => {
      const command = await configManager.getWorktreeOpenCommand();
      expect(command).toEqual(['code', '{worktreeDir}']);
    });

    it('should preserve array worktree open command values', async () => {
      await configManager.set('worktree-open-command', ['cursor', '{worktreeDir}']);
      const command = await configManager.getWorktreeOpenCommand();
      expect(command).toEqual(['cursor', '{worktreeDir}']);
    });

    it('should preserve string worktree open command values', async () => {
      await configManager.set('worktree-open-command', 'code {worktreeDir}');
      const command = await configManager.getWorktreeOpenCommand();
      expect(command).toBe('code {worktreeDir}');
    });
  });

  describe('spec-dir rename on set', () => {
    it('should rename existing spec directory when changing spec-dir-name', async () => {
      // Create the default directory 'r3nd'
      const oldDir = path.join(tempDir, 'r3nd');
      await fs.mkdir(oldDir);

      await configManager.set('spec-dir-name', 'specs');

      // Ensure old directory no longer exists and new directory exists
      let existsOld = true;
      try {
        await fs.access(oldDir);
      } catch (err) {
        if (err && err.code === 'ENOENT') existsOld = false;
      }

      const newDir = path.join(tempDir, 'specs');
      let existsNew = false;
      try {
        await fs.access(newDir);
        existsNew = true;
      } catch (err) {
        existsNew = false;
      }

      expect(existsOld).toBe(false);
      expect(existsNew).toBe(true);

      // And config persisted
      const value = await configManager.get('spec-dir-name');
      expect(value).toBe('specs');
    });

    it('should log message when rename succeeds', async () => {
      const oldDir = path.join(tempDir, 'r3nd');
      await fs.mkdir(oldDir);

      // Spy on logger
      const logger = require('../utils/logger');
      const spy = jest.spyOn(logger, 'info').mockImplementation(() => {});

      await configManager.set('spec-dir-name', 'specs');

      expect(spy).toHaveBeenCalledWith(expect.stringContaining('Renamed spec directory'));
      spy.mockRestore();
    });

    it('should throw when target directory already exists', async () => {
      const oldDir = path.join(tempDir, 'r3nd');
      const targetDir = path.join(tempDir, 'specs');
      await fs.mkdir(oldDir);
      await fs.mkdir(targetDir);

      await expect(configManager.set('spec-dir-name', 'specs')).rejects.toThrow('Target directory already exists');

      // original directories remain
      await expect(fs.access(oldDir)).resolves.toBeUndefined();
      await expect(fs.access(targetDir)).resolves.toBeUndefined();
    });

    it('should set value even if old directory does not exist', async () => {
      // Ensure no old directory present
      const oldDir = path.join(tempDir, 'r3nd');
      try {
        await fs.rm(oldDir, { recursive: true, force: true });
      } catch (err) {}

      await expect(configManager.set('spec-dir-name', 'specs')).resolves.toBeUndefined();
      const value = await configManager.get('spec-dir-name');
      expect(value).toBe('specs');
    });
  });
});
