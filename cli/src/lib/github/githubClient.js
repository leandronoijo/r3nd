const axios = require('axios');

class GitHubClient {
  constructor({ owner, repo, branch } = {}) {
    this.owner = owner || 'leandronoijo';
    this.repo = repo || 'r3nd';
    this.branch = branch || 'develop';
    this.apiTreeUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/git/trees/${this.branch}?recursive=1`;
    this.rawBase = `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}/`;
  }

  async getTree() {
    const res = await axios.get(this.apiTreeUrl, { headers: { Accept: 'application/vnd.github.v3+json' } });
    return res.data.tree || [];
  }

  async fetchRaw(remotePath) {
    const url = this.rawBase + remotePath;
    const resp = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(resp.data);
  }
}

module.exports = { GitHubClient };
