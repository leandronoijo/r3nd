const { InteractionLogger } = require('./interactionLogger');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

describe('InteractionLogger', () => {
  let tempDir;
  let logger;

  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'interaction-logger-test-'));
    logger = new InteractionLogger(tempDir);
    
    // Create r3nd.yaml in temp dir to set spec-dir-name
    const configPath = path.join(tempDir, 'r3nd.yaml');
    await fs.writeFile(configPath, 'spec-dir-name: r3nd\nlog-agent-interactions: true\n', 'utf-8');
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  describe('isEnabled', () => {
    it('should return true when logging is enabled', async () => {
      const enabled = await logger.isEnabled();
      expect(enabled).toBe(true);
    });

    it('should return false when logging is disabled', async () => {
      const configPath = path.join(tempDir, 'r3nd.yaml');
      await fs.writeFile(configPath, 'spec-dir-name: r3nd\nlog-agent-interactions: false\n', 'utf-8');
      logger.configManager.clearCache();
      
      const enabled = await logger.isEnabled();
      expect(enabled).toBe(false);
    });
  });

  describe('getLogDir', () => {
    it('should return correct log directory path', async () => {
      const logDir = await logger.getLogDir();
      expect(logDir).toBe(path.join(tempDir, 'r3nd', 'agent_summaries'));
    });
  });

  describe('log', () => {
    it('should create a log file with correct content', async () => {
      const logPath = await logger.log('test-agent', 'Test content');
      
      expect(logPath).toBeTruthy();
      expect(logPath).toContain('test-agent');
      expect(logPath).toContain('.md');
      
      const content = await fs.readFile(logPath, 'utf-8');
      expect(content).toContain('# Agent Interaction Log: test-agent');
      expect(content).toContain('Test content');
      expect(content).toContain('**Timestamp:**');
    });

    it('should return null when logging is disabled', async () => {
      const configPath = path.join(tempDir, 'r3nd.yaml');
      await fs.writeFile(configPath, 'spec-dir-name: r3nd\nlog-agent-interactions: false\n', 'utf-8');
      logger.configManager.clearCache();
      
      const logPath = await logger.log('test-agent', 'Test content');
      expect(logPath).toBeNull();
    });
  });

  describe('listLogs', () => {
    it('should return empty array when no logs exist', async () => {
      const logs = await logger.listLogs();
      expect(logs).toEqual([]);
    });

    it('should list all log files', async () => {
      await logger.log('agent1', 'Content 1');
      await logger.log('agent2', 'Content 2');
      
      const logs = await logger.listLogs();
      expect(logs.length).toBe(2);
      expect(logs.every(log => log.endsWith('.md'))).toBe(true);
    });
  });

  describe('clearLogs', () => {
    it('should delete all log files', async () => {
      await logger.log('agent1', 'Content 1');
      await logger.log('agent2', 'Content 2');
      
      const cleared = await logger.clearLogs();
      expect(cleared).toBe(2);
      
      const logs = await logger.listLogs();
      expect(logs.length).toBe(0);
    });

    it('should return 0 when no logs exist', async () => {
      const cleared = await logger.clearLogs();
      expect(cleared).toBe(0);
    });
  });

  describe('generateFilename', () => {
    it('should generate filename with timestamp', () => {
      const filename = logger.generateFilename('test-agent');
      expect(filename).toContain('test-agent');
      expect(filename).toContain('.md');
      expect(filename).toMatch(/test-agent-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.md/);
    });
  });
});
