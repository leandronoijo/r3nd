const { execSync } = require('child_process');

/**
 * Tool detector utility to check availability of CLI tools.
 * Caches results for performance across multiple checks.
 */

let cachedResults = null;

/**
 * Check if a command is available in the system PATH
 * @param {string} command - Command name to check
 * @returns {boolean} - True if command is available
 */
function isCommandAvailable(command) {
  try {
    // Use 'which' on Unix-like systems to check if command exists
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Detect which CLI tools are available on the system
 * @param {boolean} forceRefresh - Force re-detection instead of using cache
 * @returns {Object} Object with tool availability status
 */
function detectAvailableTools(forceRefresh = false) {
  if (cachedResults && !forceRefresh) {
    return cachedResults;
  }

  const tools = {
    codex: isCommandAvailable('codex'),
    gemini: isCommandAvailable('gemini'),
    github: isCommandAvailable('gh'),
  };

  // Calculate if any agent is available
  tools.hasAnyAgent = tools.codex || tools.gemini || tools.github;

  cachedResults = tools;
  return tools;
}

/**
 * Get a human-readable list of available tools
 * @returns {string[]} Array of available tool names
 */
function getAvailableToolNames() {
  const tools = detectAvailableTools();
  const available = [];
  
  if (tools.codex) available.push('codex');
  if (tools.gemini) available.push('gemini');
  if (tools.github) available.push('gh (GitHub CLI)');
  
  return available;
}

/**
 * Get a human-readable list of missing tools
 * @returns {string[]} Array of missing tool names
 */
function getMissingToolNames() {
  const tools = detectAvailableTools();
  const missing = [];
  
  if (!tools.codex) missing.push('codex');
  if (!tools.gemini) missing.push('gemini');
  if (!tools.github) missing.push('gh (GitHub CLI)');
  
  return missing;
}

/**
 * Get installation instructions for a specific tool
 * @param {string} toolName - Name of the tool
 * @returns {string} Installation instructions
 */
function getInstallInstructions(toolName) {
  const instructions = {
    codex: 'Install codex CLI: npm install -g @modelcontextprotocol/codex',
    gemini: 'Install gemini CLI: Follow instructions at https://github.com/google/generative-ai',
    github: 'Install GitHub CLI: https://cli.github.com/ or use package manager (e.g., sudo apt install gh, brew install gh)',
  };
  
  return instructions[toolName] || `Installation instructions not available for ${toolName}`;
}

/**
 * Clear the cached tool detection results
 */
function clearCache() {
  cachedResults = null;
}

module.exports = {
  detectAvailableTools,
  getAvailableToolNames,
  getMissingToolNames,
  getInstallInstructions,
  isCommandAvailable,
  clearCache,
};
