const inquirer = require('inquirer');
const { detectAvailableTools } = require('../utils/toolDetector');
const {
  getDefaultPlatformAssetKeys,
  getPlatformAssetPromptChoices
} = require('../platformAssetRegistry');
const prompt = inquirer.createPromptModule();

/**
 * Build agent choices based on available tools
 * @param {Object} options - Configuration options
 * @param {Object} options.labels - Custom labels for each agent
 * @param {Array} options.extraChoices - Additional choices to append
 * @returns {Array} Array of choice objects for inquirer
 */
function buildAgentChoices({ labels = {}, extraChoices = [] } = {}) {
  const availableTools = detectAvailableTools();
  const choices = [];
  
  const defaultLabels = {
    codex: 'Use local codex CLI (run now)',
    claude: 'Use Claude Code CLI (run now)',
    gemini: 'Use Gemini CLI (run now)',
    github: 'Use GitHub agent via gh CLI',
  };
  
  const finalLabels = { ...defaultLabels, ...labels };
  
  // Add available agent options
  if (availableTools.codex) {
    choices.push({ name: finalLabels.codex, value: 'codex' });
  }
  if (availableTools.claude) {
    choices.push({ name: finalLabels.claude, value: 'claude' });
  }
  if (availableTools.gemini) {
    choices.push({ name: finalLabels.gemini, value: 'gemini' });
  }
  if (availableTools.github) {
    choices.push({ name: finalLabels.github, value: 'github' });
  }
  
  // Add extra choices
  choices.push(...extraChoices);
  
  // Show helpful message if no agents available
  if (!availableTools.hasAnyAgent) {
    console.log('\nℹ️  No LLM agents detected. Install codex, claude, gemini, or gh CLI to use agents.');
  }
  
  return choices;
}

async function chooseBackend(nonInteractive = false) {
  if (nonInteractive) return 'nestjs';
  const res = await prompt([{ type: 'list', name: 'backend', message: 'Choose a backend', choices: [ { name: 'NestJS + Mongo', value: 'nestjs' }, { name: 'FastAPI + Mongo', value: 'fast-api' }, { name: 'Ruby on Rails + Postgres', value: 'ruby-on-rails' } ] }]);
  return res.backend;
}

async function chooseFrontend(nonInteractive = false) {
  if (nonInteractive) return 'vue';
  const res = await prompt([{ type: 'list', name: 'frontend', message: 'Choose a frontend', choices: [ { name: 'Vue', value: 'vue' }, { name: 'Angular', value: 'angular' } ] }]);
  return res.frontend;
}

async function askLLMChoice(nonInteractive = false) {
  if (nonInteractive) return 'naa';
  
  const choices = buildAgentChoices({
    extraChoices: [
      { name: 'Generate a prompt to copy & paste', value: 'generate' },
      { name: "Naa (do nothing)", value: 'naa' },
    ],
  });
  
  const res = await prompt([{ 
    type: 'list', 
    name: 'llmChoice', 
    message: 'Would you like an LLM agent to create a minimal new app with the scaffolding build plans?', 
    choices 
  }]);
  return res.llmChoice;
}

async function confirmRunNow(nonInteractive = false) {
  if (nonInteractive) return false;
  const res = await prompt([{ type: 'confirm', name: 'runNow', message: 'Run these commands now with the selected agent (one by one)?', default: false }]);
  return res.runNow;
}

async function confirmSavePrompts(nonInteractive = false) {
  if (nonInteractive) return true;
  const res = await prompt([{ type: 'confirm', name: 'saveToFile', message: 'Save these prompts to `rnd/llm_create_prompts.txt`?', default: true }]);
  return res.saveToFile;
}

async function askRemoteOrigin(nonInteractive = false) {
  if (nonInteractive) return '';
  const res = await prompt([{ type: 'input', name: 'remoteOrigin', message: 'Enter a remote origin URL (leave empty to skip):', default: '' }]);
  return res.remoteOrigin.trim();
}

async function askBugDescription(nonInteractive = false) {
  if (nonInteractive) throw new Error('Bugfix command requires interactive mode');
  const res = await prompt([{ type: 'input', name: 'description', message: 'Describe the problem you want to fix (a few sentences):', validate: (input) => input.trim().length > 0 || 'Please provide a description' }]);
  return res.description.trim();
}

/**
 * Prompt user for a feature description
 * @param {boolean} nonInteractive - If true, throws error (requires interactive input)
 * @returns {Promise<string>} Feature description text
 */
async function askFeatureDescription(nonInteractive = false) {
  if (nonInteractive) throw new Error('Product spec generation requires interactive mode to provide feature description');
  const res = await prompt([{ 
    type: 'input', 
    name: 'description', 
    message: 'Describe the feature you want to build (be as detailed as possible):', 
    validate: (input) => input.trim().length > 10 || 'Please provide a detailed description (at least 10 characters)' 
  }]);
  return res.description.trim();
}

async function askBugfixLLMChoice(nonInteractive = false) {
  if (nonInteractive) return 'naa';
  
  const choices = buildAgentChoices({
    labels: {
      codex: 'Use local codex CLI',
      claude: 'Use Claude Code CLI',
      gemini: 'Use Gemini CLI',
      github: 'Use GitHub agent via gh CLI',
    },
    extraChoices: [
      { name: 'Generate prompts to copy & paste', value: 'generate' },
      { name: "Cancel", value: 'naa' },
    ],
  });
  
  const res = await prompt([{ 
    type: 'list', 
    name: 'llmChoice', 
    message: 'Which agent would you like to use for the bugfix workflow?', 
    choices 
  }]);
  return res.llmChoice;
}

async function confirmBuildPlan(nonInteractive = false) {
  if (nonInteractive) return true;
  const res = await prompt([{ type: 'confirm', name: 'approve', message: 'Have you reviewed and approved the build plan? Ready to proceed with implementation?', default: false }]);
  return res.approve;
}

async function askAnalyseAgent(defaultAgent = 'codex', nonInteractive = false) {
  if (nonInteractive) return defaultAgent;
  
  const availableTools = detectAvailableTools();
  const choices = buildAgentChoices({
    labels: {
      codex: 'Local codex CLI',
      claude: 'Claude Code CLI',
      gemini: 'Gemini CLI',
      github: 'GitHub agent via gh CLI',
    },
    extraChoices: [],
  });
  
  // If the default agent is not available, use the first available installed agent.
  let effectiveDefault = defaultAgent;
  if (!availableTools[defaultAgent]) {
    effectiveDefault = availableTools.codex
      ? 'codex'
      : availableTools.claude
        ? 'claude'
        : availableTools.gemini
          ? 'gemini'
          : availableTools.github
            ? 'github'
            : defaultAgent;
  }
  
  const res = await prompt([{ 
    type: 'list', 
    name: 'agent', 
    message: 'Which agent would you like to use for analysis?', 
    choices, 
    default: effectiveDefault 
  }]);
  return res.agent;
}

/**
 * Prompt user to select a file from a list
 * @param {Array<string>} files - Array of file paths
 * @param {string} message - Prompt message
 * @param {boolean} nonInteractive - If true, returns first file or null
 * @returns {Promise<string|null>} Selected file path or null if none available
 */
async function chooseFile(files, message = 'Select a file:', nonInteractive = false) {
  if (!files || files.length === 0) {
    return null;
  }
  
  if (nonInteractive) {
    return files[0];
  }
  
  const choices = files.map(file => ({
    name: file,
    value: file
  }));
  
  const res = await prompt([{
    type: 'list',
    name: 'selectedFile',
    message,
    choices,
    pageSize: 15 // Show 15 items at a time for better scrolling UX
  }]);
  
  return res.selectedFile;
}

/**
 * Prompt user to select which components to initialize
 * @param {boolean} nonInteractive - If true, returns default selections
 * @returns {Promise<string[]>} Array of selected option values
 */
async function askInitOptions(nonInteractive = false) {
  const defaultOptions = getDefaultPlatformAssetKeys();
  if (nonInteractive) return defaultOptions;

  const choices = getPlatformAssetPromptChoices('init');
  
  const res = await prompt([{
    type: 'checkbox',
    name: 'initOptions',
    message: 'Select which components to initialize:',
    choices,
  }]);
  
  return res.initOptions;
}

/**
 * Prompt user to select which components to update
 * @param {boolean} nonInteractive - If true, returns default selections
 * @returns {Promise<string[]>} Array of selected option values
 */
async function askUpdateOptions(nonInteractive = false) {
  const defaultOptions = ['templates', 'skills', ...getDefaultPlatformAssetKeys()];
  if (nonInteractive) return defaultOptions;

  const choices = [
    { name: 'Templates → Update spec-dir-name/templates/', value: 'templates', checked: true },
    { name: 'Skills → Update spec-dir-name/skills/ (fully composed task skills)', value: 'skills', checked: true },
    ...getPlatformAssetPromptChoices('update'),
  ];
  
  const res = await prompt([{
    type: 'checkbox',
    name: 'updateOptions',
    message: 'Select which components to update:',
    choices,
  }]);
  
  return res.updateOptions;
}

/**
 * Prompt user for seed repository configuration
 * @param {string} currentValue - Current seed-repo value if any
 * @param {boolean} nonInteractive - If true, returns default value
 * @returns {Promise<string>} Seed repository in format owner/repo[@branch]
 */
async function askSeedRepo(currentValue = null, nonInteractive = false) {
  const defaultValue = currentValue || 'leandronoijo/r3nd@develop';
  
  if (nonInteractive) return defaultValue;
  
  const res = await prompt([{
    type: 'input',
    name: 'seedRepo',
    message: 'Enter seed repository (format: owner/repo[@branch]):',
    default: defaultValue,
    validate: (input) => {
      const trimmed = input.trim();
      if (!trimmed) return 'Seed repository is required';
      
      // Basic validation - will be validated more thoroughly by ConfigManager
      const hasSlash = trimmed.includes('/');
      if (!hasSlash) return 'Invalid format. Expected: owner/repo[@branch]';
      
      return true;
    }
  }]);
  
  return res.seedRepo.trim();
}

/**
 * Prompt user for spec directory name configuration
 * @param {string} currentValue - Current spec-dir-name value if any
 * @param {boolean} nonInteractive - If true, returns default value
 * @returns {Promise<string>} Spec directory name (e.g., 'r3nd', 'rnd', 'specs')
 */
async function askSpecDirName(currentValue = null, nonInteractive = false) {
  const defaultValue = currentValue || 'r3nd';
  
  if (nonInteractive) return defaultValue;
  
  const res = await prompt([{
    type: 'input',
    name: 'specDirName',
    message: 'Enter spec directory name (where skills and specs will be stored):',
    default: defaultValue,
    validate: (input) => {
      const trimmed = input.trim();
      if (!trimmed) return 'Spec directory name is required';
      
      // Validate it's a valid directory name (no slashes, no special chars that break paths)
      if (trimmed.includes('/') || trimmed.includes('\\')) {
        return 'Directory name cannot contain slashes';
      }
      
      if (!/^[a-zA-Z0-9_.-]+$/.test(trimmed)) {
        return 'Directory name can only contain letters, numbers, dots, dashes, and underscores';
      }
      
      return true;
    }
  }]);
  
  return res.specDirName.trim();
}

/**
 * Prompt user to select which apps to analyze
 * @param {Array} apps - Array of app objects with name, path, purpose, stack
 * @param {boolean} nonInteractive - If true, returns all apps
 * @returns {Promise<Array>} Array of selected apps
 */
async function askSelectApps(apps, nonInteractive = false) {
  if (nonInteractive || !apps || apps.length === 0) {
    return apps;
  }
  
  const choices = apps.map(app => ({
    name: `${app.name} (${app.path}) - ${app.purpose || 'No description'}`,
    value: app,
    checked: true, // All checked by default
  }));
  
  const res = await prompt([{
    type: 'checkbox',
    name: 'selectedApps',
    message: 'Select which apps/libs to analyze:',
    choices,
    validate: (answer) => {
      if (answer.length === 0) {
        return 'You must choose at least one app to analyze.';
      }
      return true;
    },
  }]);
  
  return res.selectedApps;
}

/**
 * Prompt user whether to overwrite an existing file
 * @param {string} filePath - Path of the file that would be overwritten
 * @param {boolean} nonInteractive - If true, returns false (don't overwrite)
 * @returns {Promise<boolean>} True if user wants to overwrite, false otherwise
 */
async function askOverwriteFile(filePath, nonInteractive = false) {
  if (nonInteractive) return false;
  
  const res = await prompt([{
    type: 'confirm',
    name: 'overwrite',
    message: `File "${filePath}" already exists. Overwrite?`,
    default: false
  }]);
  
  return res.overwrite;
}

async function askWorktreeIDE(nonInteractive = false) {
  if (nonInteractive) return 'vscode';

  const res = await prompt([{
    type: 'list',
    name: 'ide',
    message: 'Choose the default editor to open new worktrees:',
    choices: [
      { name: 'VSCode', value: 'vscode' },
      { name: 'Cursor', value: 'cursor' },
      { name: 'Neovim', value: 'neovim' }
    ],
    default: 'vscode'
  }]);

  return res.ide;
}

async function confirmWorktreeCopyWarning(patterns, nonInteractive = false) {
  if (nonInteractive) return true;

  const formattedPatterns = patterns.map(pattern => `  - ${pattern}`).join('\n');
  const res = await prompt([{
    type: 'confirm',
    name: 'confirmed',
    message: `New worktrees will also copy files matched by these patterns:\n${formattedPatterns}\n\nThese files can include secrets such as .env files. Continue?`,
    default: true
  }]);

  return res.confirmed;
}

async function askWorktreeCleanSelection(worktrees, nonInteractive = false) {
  if (!worktrees || worktrees.length === 0) {
    return [];
  }

  if (nonInteractive) {
    return worktrees.map(worktree => worktree.path);
  }

  const choices = worktrees.map(worktree => ({
    name: `${worktree.branch} — ${worktree.path}`,
    value: worktree.path
  }));

  const res = await prompt([{
    type: 'checkbox',
    name: 'selectedWorktrees',
    message: 'Select clean worktrees to delete:',
    choices,
    pageSize: 15
  }]);

  return res.selectedWorktrees;
}

module.exports = {
  chooseBackend,
  chooseFrontend,
  askLLMChoice,
  confirmRunNow,
  confirmSavePrompts,
  askRemoteOrigin,
  askBugDescription,
  askFeatureDescription,
  askBugfixLLMChoice,
  confirmBuildPlan,
  askAnalyseAgent,
  buildAgentChoices,
  chooseFile,
  askInitOptions,
  askUpdateOptions,
  askSeedRepo,
  askSpecDirName,
  askOverwriteFile,
  askSelectApps,
  askWorktreeIDE,
  confirmWorktreeCopyWarning,
  askWorktreeCleanSelection
};
