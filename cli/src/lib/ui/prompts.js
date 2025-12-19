const inquirer = require('inquirer');
const prompt = inquirer.createPromptModule();

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
  const res = await prompt([{ type: 'list', name: 'llmChoice', message: 'Would you like an LLM agent to create a minimal new app with the scaffolding build plans?', choices: [ { name: 'Use local codex CLI (run now)', value: 'codex' }, { name: 'Use Gemini CLI (run now)', value: 'gemini' }, { name: 'Use GitHub coding agent (future implementation)', value: 'github' }, { name: 'Generate a prompt to copy & paste', value: 'generate' }, { name: "Naa (do nothing)", value: 'naa' } ] }]);
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
  const res = await prompt([{ type: 'list', name: 'llmChoice', message: 'Which agent would you like to use for the bugfix workflow?', choices: [ { name: 'Use local codex CLI', value: 'codex' }, { name: 'Use Gemini CLI', value: 'gemini' }, { name: 'Generate prompts to copy & paste', value: 'generate' }, { name: 'Use GitHub coding agent (future implementation)', value: 'github' }, { name: "Cancel", value: 'naa' } ] }]);
  return res.llmChoice;
}

async function confirmBuildPlan(nonInteractive = false) {
  if (nonInteractive) return true;
  const res = await prompt([{ type: 'confirm', name: 'approve', message: 'Have you reviewed and approved the build plan? Ready to proceed with implementation?', default: false }]);
  return res.approve;
}

module.exports = { chooseBackend, chooseFrontend, askLLMChoice, confirmRunNow, confirmSavePrompts, askRemoteOrigin, askBugDescription, askBugfixLLMChoice, confirmBuildPlan };
