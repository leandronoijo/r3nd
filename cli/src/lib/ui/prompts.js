const inquirer = require('inquirer');
const { detectAvailableTools } = require('../utils/toolDetector');
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
    gemini: 'Use Gemini CLI (run now)',
    github: 'Use GitHub coding agent',
  };
  
  const finalLabels = { ...defaultLabels, ...labels };
  
  // Add available agent options
  if (availableTools.codex) {
    choices.push({ name: finalLabels.codex, value: 'codex' });
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
    console.log('\nℹ️  No LLM agents detected. Install codex, gemini, or gh CLI to use agents.');
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

async function askBugfixLLMChoice(nonInteractive = false) {
  if (nonInteractive) return 'naa';
  
  const choices = buildAgentChoices({
    labels: {
      codex: 'Use local codex CLI',
      gemini: 'Use Gemini CLI',
      github: 'Use GitHub coding agent',
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
      gemini: 'Gemini CLI',
      github: 'GitHub coding agent',
    },
    extraChoices: [
      { name: 'Generate prompts only (no agent)', value: 'generate' },
    ],
  });
  
  // If the default agent is not available, use the first available or 'generate'
  let effectiveDefault = defaultAgent;
  if (defaultAgent !== 'generate' && !availableTools[defaultAgent]) {
    effectiveDefault = availableTools.codex ? 'codex' : availableTools.gemini ? 'gemini' : availableTools.github ? 'github' : 'generate';
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

module.exports = { chooseBackend, chooseFrontend, askLLMChoice, confirmRunNow, confirmSavePrompts, askRemoteOrigin, askBugDescription, askBugfixLLMChoice, confirmBuildPlan, askAnalyseAgent };
