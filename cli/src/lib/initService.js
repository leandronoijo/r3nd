const path = require('path');
const fs = require('fs').promises;
const { execSync } = require('child_process');
const YAML = require('yaml');

const { GitHubClient } = require('./github/githubClient');
const { writeBuffer, ensureDir } = require('./fs/fileWriter');
const { 
  copyAgentPersonas, 
  copyGitHubWorkflows, 
  composeAgentFiles, 
  copyTemplates, 
  copyCommonFiles,
  copyInstructionsToGitHub
} = require('./fs/seedCopier');
const { fetchSeedSpecDirName } = require('./overlays/overlaySeedService');
const { askInitOptions, askSeedRepo, askSpecDirName } = require('./ui/prompts');
const { ConfigManager } = require('./config/configManager');
const { resolveTemplate, createGitHubFileReader } = require('./templateResolver');
const { rewriteSpecDirBuffer, rewriteSpecDirContent } = require('./utils/specDirRewrite');
const logger = require('./utils/logger');

/**
 * Legacy function for backwards compatibility - migrate old agent files
 * @param {string} content - Raw markdown content of agent file
 * @returns {Object} Parsed agent with name, description, tools, and content
 */
function parseAgentFile(content) {
  const lines = content.split('\n');
  let frontmatterStart = -1;
  let frontmatterEnd = -1;
  
  // Find frontmatter boundaries
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      if (frontmatterStart === -1) {
        frontmatterStart = i;
      } else {
        frontmatterEnd = i;
        break;
      }
    }
  }
  
  let metadata = {};
  
  // Parse YAML frontmatter if found
  if (frontmatterStart !== -1 && frontmatterEnd !== -1) {
    const frontmatterContent = lines.slice(frontmatterStart + 1, frontmatterEnd).join('\n');
    try {
      metadata = YAML.parse(frontmatterContent) || {};
    } catch (err) {
      // Fallback to defaults if YAML parsing fails
      metadata = {};
    }
  }
  
  const bodyStartLine = frontmatterEnd !== -1 ? frontmatterEnd + 1 : 0;
  const bodyContent = lines.slice(bodyStartLine).join('\n').trim();
  
  return {
    name: metadata.name || 'unknown',
    description: metadata.description || '',
    tools: metadata.tools || ['*'],
    content: bodyContent
  };
}

/**
 * Migrate legacy agent file to new rnd/agents structure
 * @param {string} content - Legacy agent file content with frontmatter
 * @returns {string} Platform-agnostic agent persona content (without frontmatter)
 */
function migrateLegacyAgent(content) {
  const parsed = parseAgentFile(content);
  return parsed.content;
}

async function runInit(opts = {}, deps = {}) {
  const cwd = opts.cwd || process.cwd();
  const nonInteractive = !!opts.nonInteractive;
  
  // Initialize config manager
  const configManager = new ConfigManager(cwd);
  
  // Check if seed-repo is configured, prompt if not
  let seedRepo = await configManager.get('seed-repo');
  if (!seedRepo) {
    logger.info('No seed repository configured.');
    seedRepo = await askSeedRepo(null, nonInteractive);
    await configManager.set('seed-repo', seedRepo);
    logger.info(`✓ Configured seed-repo: ${seedRepo}\n`);
  }

  // Check if spec-dir-name is configured, prompt if not
  let specDirName = await configManager.get('spec-dir-name');
  if (!specDirName) {
    logger.info('No spec directory name configured.');
    specDirName = await askSpecDirName(null, nonInteractive);
    await configManager.set('spec-dir-name', specDirName);
    logger.info(`✓ Configured spec-dir-name: ${specDirName}\n`);
  } else {
    // Even if configured, ask the user to confirm or change it during init
    const confirmedSpecDirName = await askSpecDirName(specDirName, nonInteractive);
    if (confirmedSpecDirName !== specDirName) {
      await configManager.set('spec-dir-name', confirmedSpecDirName);
      specDirName = confirmedSpecDirName;
      logger.info(`✓ Updated spec-dir-name: ${specDirName}\n`);
    }
  }

  const githubClient = deps.githubClient || new GitHubClient({ cwd });

  // Ensure git repo
  const isGitRepo = await fs.access(path.join(cwd, '.git')).then(() => true).catch(() => false);
  if (!isGitRepo) {
    logger.info('Initializing git repository...');
    execSync('git init', { cwd });
  } else {
    logger.info('Git repository already initialized.');
  }

  // Ask user which components to initialize
  logger.info('r3nd — repository initializer\n');
  const selectedOptions = await askInitOptions(nonInteractive);

  logger.info(`\nSelected: ${selectedOptions.join(', ') || 'None (agents only)'}\n`);

  // Fetch file tree from GitHub
  logger.info('Fetching file list from GitHub (seed repo)...');
  const tree = await githubClient.getTree();
  
  // Fetch seed repo's spec-dir-name configuration
  const seedSpecDirName = await fetchSeedSpecDirName(githubClient);

  // Copy common files (gitignore)
  await copyCommonFiles(cwd, tree, githubClient, specDirName, { nonInteractive });

  // Copy platform-agnostic agent personas from seed repo
  await copyAgentPersonas(cwd, tree, githubClient, specDirName, seedSpecDirName, { nonInteractive });

  // Process selected options (these are optional)
  if (selectedOptions.includes('github')) {
    await copyGitHubWorkflows(cwd, tree, githubClient, specDirName, seedSpecDirName, { nonInteractive });
    // Compose GitHub Copilot agent files from wrappers + personas
    await composeAgentFiles(cwd, tree, githubClient, '.github/agents', '.agent.md', specDirName, seedSpecDirName, { nonInteractive });
  }

  if (selectedOptions.includes('cursor')) {
    // Compose Cursor command files from wrappers + personas
    await composeAgentFiles(cwd, tree, githubClient, '.cursor/commands', '.md', specDirName, seedSpecDirName, { nonInteractive });
  }

  if (selectedOptions.includes('vscode')) {
    // Compose VSCode chat mode files from wrappers + personas
    await composeAgentFiles(cwd, tree, githubClient, '.github/chatmodes', '.chatmode.md', specDirName, seedSpecDirName, { nonInteractive });
  }

  // Also copy templates if any option was selected
  await copyTemplates(cwd, tree, githubClient, specDirName, seedSpecDirName, { nonInteractive });

  // If GitHub or VSCode is selected, copy instructions from spec-dir to .github/instructions
  if (selectedOptions.includes('github') || selectedOptions.includes('vscode')) {
    await copyInstructionsToGitHub(cwd, specDirName, { nonInteractive });
  }

  logger.info('\nInit complete.');
}

module.exports = { runInit, parseAgentFile, migrateLegacyAgent };
