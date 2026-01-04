const { execSync } = require('child_process');
const axios = require('axios');
const { isCommandAvailable } = require('../utils/toolDetector');
const logger = require('../utils/logger');

/**
 * Check if gh CLI is authenticated
 * @returns {boolean} True if gh is authenticated
 */
function isGhAuthenticated() {
  if (!isCommandAvailable('gh')) {
    return false;
  }
  
  try {
    execSync('gh auth status', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Fetch GitHub API tree using gh CLI
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} branch - Branch name
 * @returns {Promise<Array>} Tree array
 */
async function fetchTreeWithGh(owner, repo, branch) {
  try {
    const apiUrl = `repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
    const output = execSync(`gh api ${apiUrl}`, { 
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large repos
    });
    const data = JSON.parse(output);
    return data.tree || [];
  } catch (error) {
    // Check if it's an authorization error
    if (error.stderr && (error.stderr.includes('401') || error.stderr.includes('403'))) {
      throw new AuthorizationError('Failed to access repository with gh CLI');
    }
    throw error;
  }
}

/**
 * Fetch raw file content using gh CLI
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} branch - Branch name
 * @param {string} remotePath - Path to file in repository
 * @returns {Promise<Buffer>} File content as buffer
 */
async function fetchRawWithGh(owner, repo, branch, remotePath) {
  try {
    const output = execSync(
      `gh api repos/${owner}/${repo}/contents/${remotePath} --jq .content | base64 -d`,
      { 
        encoding: 'buffer',
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      }
    );
    return Buffer.from(output);
  } catch (error) {
    // Check if it's an authorization error
    if (error.stderr && (error.stderr.includes('401') || error.stderr.includes('403'))) {
      throw new AuthorizationError('Failed to access file with gh CLI');
    }
    throw error;
  }
}

/**
 * Fetch GitHub API tree using axios
 * @param {string} apiTreeUrl - Full API URL for tree
 * @returns {Promise<Array>} Tree array
 */
async function fetchTreeWithAxios(apiTreeUrl) {
  try {
    const res = await axios.get(apiTreeUrl, { 
      headers: { Accept: 'application/vnd.github.v3+json' } 
    });
    return res.data.tree || [];
  } catch (error) {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      throw new AuthorizationError('Failed to access repository with axios');
    }
    throw error;
  }
}

/**
 * Fetch raw file content using axios
 * @param {string} url - Full URL to raw file
 * @returns {Promise<Buffer>} File content as buffer
 */
async function fetchRawWithAxios(url) {
  try {
    const resp = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(resp.data);
  } catch (error) {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      throw new AuthorizationError('Failed to access file with axios');
    }
    throw error;
  }
}

/**
 * Custom error class for authorization failures
 */
class AuthorizationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Fetch GitHub tree with authentication strategy:
 * 1. Try gh CLI if available and authenticated
 * 2. Fall back to axios for public repos
 * 3. Exit with error on authorization failures
 * 
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} branch - Branch name
 * @param {string} apiTreeUrl - Full API URL for tree (used by axios fallback)
 * @returns {Promise<Array>} Tree array
 */
async function fetchTreeWithAuth(owner, repo, branch, apiTreeUrl) {
  const ghAvailable = isGhAuthenticated();
  
  if (ghAvailable) {
    logger.debug('Using gh CLI for tree fetch');
    try {
      return await fetchTreeWithGh(owner, repo, branch);
    } catch (error) {
      if (error instanceof AuthorizationError) {
        logger.error('\n❌ Unauthorized: Failed to access private repository.');
        logger.error('Please check your GitHub CLI authentication:');
        logger.error('  gh auth login');
        logger.error('  gh auth status\n');
        process.exit(1);
      }
      // If gh fails for non-auth reasons, fall back to axios
      logger.debug(`gh CLI failed (${error.message}), falling back to axios`);
    }
  }
  
  // Fallback to axios
  logger.debug('Using axios for tree fetch');
  try {
    return await fetchTreeWithAxios(apiTreeUrl);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      logger.error('\n❌ Unauthorized: Failed to access private repository.');
      logger.error('The repository may be private. Please authenticate using GitHub CLI:');
      logger.error('  gh auth login');
      logger.error('  gh auth status\n');
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Fetch raw file with authentication strategy:
 * 1. Try gh CLI if available and authenticated
 * 2. Fall back to axios for public repos
 * 3. Exit with error on authorization failures
 * 
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} branch - Branch name
 * @param {string} remotePath - Path to file in repository
 * @param {string} rawUrl - Full URL to raw file (used by axios fallback)
 * @returns {Promise<Buffer>} File content as buffer
 */
async function fetchRawWithAuth(owner, repo, branch, remotePath, rawUrl) {
  const ghAvailable = isGhAuthenticated();
  
  if (ghAvailable) {
    logger.debug(`Using gh CLI for raw file fetch: ${remotePath}`);
    try {
      return await fetchRawWithGh(owner, repo, branch, remotePath);
    } catch (error) {
      if (error instanceof AuthorizationError) {
        logger.error('\n❌ Unauthorized: Failed to access private repository.');
        logger.error('Please check your GitHub CLI authentication:');
        logger.error('  gh auth login');
        logger.error('  gh auth status\n');
        process.exit(1);
      }
      // If gh fails for non-auth reasons, fall back to axios
      logger.debug(`gh CLI failed for ${remotePath} (${error.message}), falling back to axios`);
    }
  }
  
  // Fallback to axios
  logger.debug(`Using axios for raw file fetch: ${remotePath}`);
  try {
    return await fetchRawWithAxios(rawUrl);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      logger.error('\n❌ Unauthorized: Failed to access private repository.');
      logger.error('The repository may be private. Please authenticate using GitHub CLI:');
      logger.error('  gh auth login');
      logger.error('  gh auth status\n');
      process.exit(1);
    }
    throw error;
  }
}

module.exports = {
  isGhAuthenticated,
  fetchTreeWithAuth,
  fetchRawWithAuth,
  fetchTreeWithGh,
  fetchRawWithGh,
  fetchTreeWithAxios,
  fetchRawWithAxios,
  AuthorizationError,
};
