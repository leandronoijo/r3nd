const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');

/**
 * List all markdown files in a directory
 * @param {string} cwd - Current working directory
 * @param {string} dir - Relative directory path to scan
 * @returns {Promise<Array<string>>} Array of relative file paths
 */
async function listMarkdownFiles(cwd, dir) {
  const fullPath = path.join(cwd, dir);
  
  try {
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    const mdFiles = entries
      .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
      .map(entry => path.join(dir, entry.name));
    
    return mdFiles.sort();
  } catch (err) {
    if (err.code === 'ENOENT') {
      logger.warn(`Directory not found: ${dir}`);
      return [];
    }
    throw err;
  }
}

/**
 * Build the prompt text for an agent
 * @param {Object} agent - Agent configuration from registry
 * @param {string} targetFile - The selected file to process
 * @returns {string} Formatted prompt text
 */
function buildPrompt(agent, targetFile) {
  if (typeof agent.promptTemplate !== 'function') {
    throw new Error('Agent promptTemplate must be a function');
  }
  
  return agent.promptTemplate(agent.agentFile, targetFile);
}

/**
 * Build an interactive prompt with completion instructions
 * @param {Object} agent - Agent configuration from registry
 * @param {string} targetFile - The selected file to process or user input
 * @param {string} doneFileName - Name of the done file to create when complete
 * @returns {string} Formatted prompt text with interactive suffix
 */
function buildInteractivePrompt(agent, targetFile, doneFileName) {
  const basePrompt = buildPrompt(agent, targetFile);
  
  if (typeof agent.interactiveSuffix !== 'function') {
    // Fallback: if no interactive suffix defined, use base prompt with generic instructions
    return `${basePrompt}\n\nIMPORTANT: When you have completely finished and the user is satisfied, create a file named "${doneFileName}" in the current directory to signal completion.`;
  }
  
  const suffix = agent.interactiveSuffix(doneFileName);
  return `${basePrompt}${suffix}`;
}

/**
 * Verify that required agent files exist
 * @param {string} cwd - Current working directory
 * @param {Object} agent - Agent configuration
 * @returns {Promise<{agentExists: boolean, targetDir: string}>}
 */
async function validateAgentSetup(cwd, agent) {
  const agentPath = path.join(cwd, agent.agentFile);
  
  const agentExists = await fs.access(agentPath).then(() => true).catch(() => false);
  
  // For agents without filesDir (free text input), skip directory validation
  if (!agent.filesDir) {
    return {
      agentExists,
      agentPath: agent.agentFile,
      targetDirExists: true,
      targetDir: null
    };
  }
  
  const targetDir = path.join(cwd, agent.filesDir);
  const targetDirExists = await fs.access(targetDir).then(() => true).catch(() => false);
  
  return {
    agentExists,
    agentPath: agent.agentFile,
    targetDirExists,
    targetDir: agent.filesDir
  };
}

/**
 * Get a display name for a file (without directory prefix)
 * @param {string} filePath - Full relative file path
 * @returns {string} Just the filename
 */
function getFileDisplayName(filePath) {
  return path.basename(filePath);
}

module.exports = {
  listMarkdownFiles,
  buildPrompt,
  buildInteractivePrompt,
  validateAgentSetup,
  getFileDisplayName
};
