const path = require('path');
const fs = require('fs').promises;
const YAML = require('yaml');
const logger = require('../utils/logger');

const CONFIG_FILE_NAME = 'r3nd.yaml';

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

    // If changing the spec dir name, attempt to rename the directory in the working tree
    if (key === 'spec-dir-name') {
      const oldName = config['spec-dir-name'] || 'r3nd';
      const newName = value;

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

    config[key] = value;
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
   * Validate a configuration key
   * @param {string} key - Configuration key
   * @returns {boolean} True if key is valid
   */
  static isValidKey(key) {
    const validKeys = ['seed-repo', 'spec-dir-name'];
    return validKeys.includes(key);
  }

  /**
   * Get default configuration values
   * @returns {Object} Default configuration
   */
  static getDefaults() {
    return {
      'seed-repo': 'leandronoijo/r3nd@develop',
      'spec-dir-name': 'r3nd'
    };
  }
}

module.exports = { ConfigManager };
