const path = require('path');
const fs = require('fs').promises;
const YAML = require('yaml');
const logger = require('../utils/logger');

const CONFIG_FILE_NAME = 'r3nd.yaml';
const DEFAULT_WORKTREE_COPY_FILES = ['*.env', '**/*.env'];
const DEFAULT_WORKTREE_OPEN_COMMAND = ['code', '{worktreeDir}'];
const VALID_CONFIG_KEYS = ['seed-repo', 'spec-dir-name', 'overlays', 'worktree-copy-files', 'worktree-open-command'];

/**
 * ConfigManager - Manages r3nd.yaml configuration file at repo level
 * 
 * Configuration file schema:
 * {
 *   'seed-repo': 'owner/repo[@branch]'  // GitHub repository for seed files
 * }
 */
class ConfigManager {
  constructor(cwd = process.cwd()) {
    this.cwd = cwd;
    this.configPath = path.join(cwd, CONFIG_FILE_NAME);
    this._cache = null;
  }

  /**
   * Load configuration from r3nd.yaml
   * @returns {Promise<Object>} Configuration object
   */
  async load() {
    if (this._cache) {
      return this._cache;
    }

    try {
      const content = await fs.readFile(this.configPath, 'utf-8');
      this._cache = YAML.parse(content) || {};
      return this._cache;
    } catch (err) {
      if (err.code === 'ENOENT') {
        // Config file doesn't exist, return empty config
        this._cache = {};
        return this._cache;
      }
      throw new Error(`Failed to load config: ${err.message}`);
    }
  }

  /**
   * Save configuration to r3nd.yaml
   * @param {Object} config - Configuration object to save
   */
  async save(config) {
    try {
      const content = YAML.stringify(config);
      await fs.writeFile(this.configPath, content, 'utf-8');
      this._cache = config;
    } catch (err) {
      throw new Error(`Failed to save config: ${err.message}`);
    }
  }

  /**
   * Get a configuration value
   * @param {string} key - Configuration key
   * @returns {Promise<any>} Configuration value or undefined
   */
  async get(key) {
    const config = await this.load();
    return config[key];
  }

  /**
   * Set a configuration value
   * @param {string} key - Configuration key
   * @param {any} value - Configuration value
   */
  async set(key, value) {
    const config = await this.load();
    const normalizedValue = ConfigManager.normalizeValue(key, value);

    // If changing the spec dir name, attempt to rename the directory in the working tree
    if (key === 'spec-dir-name') {
      const oldName = config['spec-dir-name'] || 'r3nd';
      const newName = normalizedValue;

      // Only attempt rename when the name actually changes
      if (oldName !== newName) {
        const oldPath = path.join(this.cwd, oldName);
        const newPath = path.join(this.cwd, newName);

        try {
          const stat = await fs.stat(oldPath);
            if (stat && stat.isDirectory()) {
            // If target exists, throw so consumer can handle
            try {
              await fs.access(newPath);
              throw new Error(`Target directory already exists: ${newName}`);
            } catch (err) {
              if (err && err.code === 'ENOENT') {
                // safe to rename
                await fs.rename(oldPath, newPath);
                logger.info(`✓ Renamed spec directory: ${oldName} -> ${newName}`);
              } else {
                // rethrow unexpected errors
                throw err;
              }
            }
          }
        } catch (err) {
          // If old path doesn't exist, ignore and continue; otherwise rethrow
          if (!(err && err.code === 'ENOENT')) {
            throw new Error(`Failed to rename spec dir: ${err.message}`);
          }
        }
      }
    }

    config[key] = normalizedValue;
    await this.save(config);
  }

  /**
   * Get all configuration values
   * @returns {Promise<Object>} All configuration
   */
  async getAll() {
    return await this.load();
  }

  /**
   * Check if configuration file exists
   * @returns {Promise<boolean>} True if config file exists
   */
  async exists() {
    try {
      await fs.access(this.configPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear the in-memory cache
   */
  clearCache() {
    this._cache = null;
  }

  /**
   * Parse seed-repo value into owner, repo, and branch
   * @param {string} seedRepo - Format: owner/repo[@branch]
   * @returns {Object} { owner, repo, branch }
   */
  static parseSeedRepo(seedRepo) {
    if (!seedRepo || typeof seedRepo !== 'string') {
      return null;
    }

    // Format: owner/repo[@branch]
    const branchMatch = seedRepo.match(/^([^@]+)@(.+)$/);
    let repoPath, branch;
    
    if (branchMatch) {
      repoPath = branchMatch[1];
      branch = branchMatch[2];
    } else {
      repoPath = seedRepo;
      branch = 'develop'; // default branch
    }

    const parts = repoPath.split('/');
    if (parts.length !== 2) {
      return null;
    }

    return {
      owner: parts[0],
      repo: parts[1],
      branch: branch
    };
  }

  /**
   * Get the spec directory name from configuration
   * @returns {Promise<string>} Spec directory name (defaults to 'r3nd')
   */
  async getSpecDirName() {
    const config = await this.load();
    return config['spec-dir-name'] || 'r3nd';
  }

  /**
   * Get normalized overlays in precedence order
   * @returns {Promise<string[]>} Ordered overlay names
   */
  async getOverlays() {
    const config = await this.load();
    return ConfigManager.normalizeOverlays(config.overlays);
  }

  /**
   * Get normalized worktree copy file patterns
   * @returns {Promise<string[]>} Array of glob patterns
   */
  async getWorktreeCopyFiles() {
    const config = await this.load();
    return ConfigManager.normalizeWorktreeCopyFiles(config['worktree-copy-files']);
  }

  /**
   * Get normalized worktree open command
   * @returns {Promise<string[]|string>} Array or string command
   */
  async getWorktreeOpenCommand() {
    const config = await this.load();
    return ConfigManager.normalizeWorktreeOpenCommand(config['worktree-open-command']);
  }

  /**
   * Validate a configuration key
   * @param {string} key - Configuration key
   * @returns {boolean} True if key is valid
   */
  static isValidKey(key) {
    return VALID_CONFIG_KEYS.includes(key);
  }

  /**
   * Get default configuration values
   * @returns {Object} Default configuration
   */
  static getDefaults() {
    return {
      'seed-repo': 'leandronoijo/r3nd@develop',
      'spec-dir-name': 'r3nd',
      overlays: [],
      'worktree-copy-files': [...DEFAULT_WORKTREE_COPY_FILES],
      'worktree-open-command': [...DEFAULT_WORKTREE_OPEN_COMMAND]
    };
  }

  /**
   * Normalize a config value by key
   * @param {string} key
   * @param {any} value
   * @returns {any}
   */
  static normalizeValue(key, value) {
    if (key === 'overlays') {
      return ConfigManager.normalizeOverlays(value);
    }
    if (key === 'worktree-copy-files') {
      return ConfigManager.normalizeWorktreeCopyFiles(value);
    }
    if (key === 'worktree-open-command') {
      return ConfigManager.normalizeWorktreeOpenCommand(value);
    }
    return value;
  }

  /**
   * Normalize worktree copy file patterns to a string array
   * @param {any} value
   * @returns {string[]}
   */
  static normalizeWorktreeCopyFiles(value) {
    const input = value == null ? DEFAULT_WORKTREE_COPY_FILES : value;
    const patterns = Array.isArray(input) ? input : [input];
    const normalized = patterns
      .map(pattern => (typeof pattern === 'string' ? pattern.trim() : ''))
      .filter(Boolean);

    if (normalized.length === 0) {
      throw new Error('worktree-copy-files must contain at least one glob pattern');
    }

    return normalized;
  }

  /**
   * Normalize overlays to a unique ordered string array
   * @param {any} value
   * @returns {string[]}
   */
  static normalizeOverlays(value) {
    if (value == null) {
      return [];
    }

    if (typeof value === 'string') {
      const normalized = value.trim();
      return normalized ? [normalized] : [];
    }

    if (!Array.isArray(value)) {
      throw new Error('overlays must be a string or an array of strings');
    }

    const seen = new Set();
    const normalized = [];

    for (const item of value) {
      if (typeof item !== 'string') {
        continue;
      }
      const overlay = item.trim();
      if (!overlay || seen.has(overlay)) {
        continue;
      }
      seen.add(overlay);
      normalized.push(overlay);
    }

    return normalized;
  }

  /**
   * Normalize worktree open command to string or string array
   * @param {any} value
   * @returns {string[]|string}
   */
  static normalizeWorktreeOpenCommand(value) {
    const input = value == null ? DEFAULT_WORKTREE_OPEN_COMMAND : value;

    if (typeof input === 'string') {
      const normalized = input.trim();
      if (!normalized) {
        throw new Error('worktree-open-command must not be empty');
      }
      return normalized;
    }

    if (!Array.isArray(input)) {
      throw new Error('worktree-open-command must be a string or an array of strings');
    }

    const normalized = input
      .map(token => (typeof token === 'string' ? token.trim() : ''))
      .filter(Boolean);

    if (normalized.length === 0) {
      throw new Error('worktree-open-command must contain at least one command token');
    }

    return normalized;
  }
}

module.exports = {
  ConfigManager,
  DEFAULT_WORKTREE_COPY_FILES,
  DEFAULT_WORKTREE_OPEN_COMMAND,
  VALID_CONFIG_KEYS
};
