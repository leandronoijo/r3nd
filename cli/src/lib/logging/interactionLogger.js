const path = require('path');
const fs = require('fs').promises;
const { ConfigManager } = require('../config/configManager');

/**
 * InteractionLogger - Logs agent interactions to markdown files
 * 
 * Logs are stored in r3nd/agent_summaries/ with timestamps
 */
class InteractionLogger {
  constructor(cwd = process.cwd()) {
    this.cwd = cwd;
    this.configManager = new ConfigManager(cwd);
  }

  /**
   * Check if interaction logging is enabled
   * @returns {Promise<boolean>} True if logging is enabled
   */
  async isEnabled() {
    const config = await this.configManager.load();
    // Default to true if not set
    return config['log-agent-interactions'] !== false;
  }

  /**
   * Get the log directory path
   * @returns {Promise<string>} Path to log directory
   */
  async getLogDir() {
    const specDirName = await this.configManager.getSpecDirName();
    return path.join(this.cwd, specDirName, 'agent_summaries');
  }

  /**
   * Ensure log directory exists
   * @returns {Promise<void>}
   */
  async ensureLogDir() {
    const logDir = await this.getLogDir();
    await fs.mkdir(logDir, { recursive: true });
  }

  /**
   * Generate a timestamp-based filename
   * @param {string} agentName - Name of the agent
   * @returns {string} Filename with timestamp
   */
  generateFilename(agentName) {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '-').substring(0, 19);
    return `${agentName}-${timestamp}.md`;
  }

  /**
   * Log an agent interaction
   * @param {string} agentName - Name of the agent
   * @param {string} content - Content to log
   * @returns {Promise<string>} Path to the created log file
   */
  async log(agentName, content) {
    const enabled = await this.isEnabled();
    if (!enabled) {
      return null;
    }

    await this.ensureLogDir();
    const logDir = await this.getLogDir();
    const filename = this.generateFilename(agentName);
    const filePath = path.join(logDir, filename);

    const logContent = `# Agent Interaction Log: ${agentName}\n\n**Timestamp:** ${new Date().toISOString()}\n\n---\n\n${content}\n`;
    
    await fs.writeFile(filePath, logContent, 'utf-8');
    return filePath;
  }

  /**
   * List all log files
   * @returns {Promise<Array<string>>} Array of log file paths
   */
  async listLogs() {
    const logDir = await this.getLogDir();
    
    try {
      const files = await fs.readdir(logDir);
      return files
        .filter(file => file.endsWith('.md'))
        .map(file => path.join(logDir, file));
    } catch (err) {
      if (err.code === 'ENOENT') {
        return [];
      }
      throw err;
    }
  }

  /**
   * Clear all log files
   * @returns {Promise<number>} Number of files deleted
   */
  async clearLogs() {
    const logs = await this.listLogs();
    
    for (const logPath of logs) {
      await fs.unlink(logPath);
    }
    
    return logs.length;
  }
}

module.exports = { InteractionLogger };
