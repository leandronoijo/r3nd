const { ConfigManager } = require('../config/configManager');
const { fetchTreeWithAuth, fetchRawWithAuth } = require('./githubAuth');

class GitHubClient {
  constructor({ owner, repo, branch, cwd } = {}) {
    this.cwd = cwd;
    this.owner = owner || 'leandronoijo';
    this.repo = repo || 'r3nd';
    this.branch = branch || 'develop';
    this._initialized = false;
    this._initPromise = null;
    this.apiTreeUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/git/trees/${this.branch}?recursive=1`;
    this.rawBase = `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}/`;
  }

  /**
   * Initialize the client by loading config if needed
   * @private
   */
  async _ensureInitialized() {
    if (this._initialized) {
      return;
    }

    // Prevent multiple concurrent initializations
    if (this._initPromise) {
      await this._initPromise;
      return;
    }

    this._initPromise = (async () => {
      try {
        const configManager = new ConfigManager(this.cwd);
        const seedRepo = await configManager.get('seed-repo');
        
        if (seedRepo) {
          const parsed = ConfigManager.parseSeedRepo(seedRepo);
          if (parsed) {
            this.owner = parsed.owner;
            this.repo = parsed.repo;
            this.branch = parsed.branch;
            this.apiTreeUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/git/trees/${this.branch}?recursive=1`;
            this.rawBase = `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}/`;
          }
        }
        
        this._initialized = true;
      } catch (err) {
        // If config loading fails, just use defaults
        this._initialized = true;
      }
    })();

    await this._initPromise;
  }

  async getTree() {
    await this._ensureInitialized();
    return await fetchTreeWithAuth(this.owner, this.repo, this.branch, this.apiTreeUrl);
  }

  async fetchRaw(remotePath) {
    await this._ensureInitialized();
    const url = this.rawBase + remotePath;
    return await fetchRawWithAuth(this.owner, this.repo, this.branch, remotePath, url);
  }
}

module.exports = { GitHubClient };
