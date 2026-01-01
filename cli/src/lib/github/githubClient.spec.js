const { GitHubClient } = require('./githubClient');
const { ConfigManager } = require('../config/configManager');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

describe('GitHubClient', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'r3nd-github-test-'));
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  describe('constructor with explicit values', () => {
    it('should use provided owner, repo, and branch', () => {
      const client = new GitHubClient({
        owner: 'test-owner',
        repo: 'test-repo',
        branch: 'test-branch'
      });

      expect(client.owner).toBe('test-owner');
      expect(client.repo).toBe('test-repo');
      expect(client.branch).toBe('test-branch');
    });

    it('should use defaults when no values provided', () => {
      const client = new GitHubClient();

      expect(client.owner).toBe('leandronoijo');
      expect(client.repo).toBe('r3nd');
      expect(client.branch).toBe('develop');
    });
  });

  describe('initialization with config', () => {
    it('should load config and update values before API calls', async () => {
      // Create config file
      const configManager = new ConfigManager(tempDir);
      await configManager.set('seed-repo', 'custom-owner/custom-repo@custom-branch');

      // Create client with cwd pointing to config directory
      const client = new GitHubClient({ cwd: tempDir });

      // Initially has default values
      expect(client.owner).toBe('leandronoijo');
      expect(client.repo).toBe('r3nd');
      expect(client.branch).toBe('develop');

      // After initialization (triggered by _ensureInitialized)
      await client._ensureInitialized();

      // Should have updated values from config
      expect(client.owner).toBe('custom-owner');
      expect(client.repo).toBe('custom-repo');
      expect(client.branch).toBe('custom-branch');
      expect(client.apiTreeUrl).toContain('custom-owner/custom-repo');
      expect(client.apiTreeUrl).toContain('custom-branch');
    });

    it('should use defaults when no config file exists', async () => {
      const client = new GitHubClient({ cwd: tempDir });

      await client._ensureInitialized();

      expect(client.owner).toBe('leandronoijo');
      expect(client.repo).toBe('r3nd');
      expect(client.branch).toBe('develop');
    });

    it('should handle config with default branch', async () => {
      const configManager = new ConfigManager(tempDir);
      await configManager.set('seed-repo', 'custom-owner/custom-repo');

      const client = new GitHubClient({ cwd: tempDir });
      await client._ensureInitialized();

      expect(client.owner).toBe('custom-owner');
      expect(client.repo).toBe('custom-repo');
      expect(client.branch).toBe('develop'); // default branch
    });

    it('should only initialize once', async () => {
      const configManager = new ConfigManager(tempDir);
      await configManager.set('seed-repo', 'owner1/repo1@branch1');

      const client = new GitHubClient({ cwd: tempDir });

      await client._ensureInitialized();
      const firstOwner = client.owner;

      // Update config (should not affect already-initialized client)
      await configManager.set('seed-repo', 'owner2/repo2@branch2');

      await client._ensureInitialized();
      expect(client.owner).toBe(firstOwner); // Should still be owner1
    });
  });

  describe('URL construction', () => {
    it('should construct correct API tree URL', () => {
      const client = new GitHubClient({
        owner: 'test-owner',
        repo: 'test-repo',
        branch: 'main'
      });

      expect(client.apiTreeUrl).toBe(
        'https://api.github.com/repos/test-owner/test-repo/git/trees/main?recursive=1'
      );
    });

    it('should construct correct raw base URL', () => {
      const client = new GitHubClient({
        owner: 'test-owner',
        repo: 'test-repo',
        branch: 'main'
      });

      expect(client.rawBase).toBe(
        'https://raw.githubusercontent.com/test-owner/test-repo/main/'
      );
    });
  });
});
