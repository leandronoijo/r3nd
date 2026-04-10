const path = require('path');

const { GitHubClient } = require('./github/githubClient');
const { ensureDir } = require('./fs/fileWriter');
const { 
  copyAgentPersonas, 
  copyGitHubWorkflows, 
  composeAgentFiles, 
  copyTemplates, 
  copyCommonFiles,
  copyTestingInstructions,
  copyInstructionsToRnd
} = require('./fs/seedCopier');
const { 
  fetchSeedSpecDirName, 
  copyOverlayFiles, 
  ensureMandatorySeedFiles, 
  ensureSpecDirectories 
} = require('./overlays/overlaySeedService');
const { chooseBackend, chooseFrontend, askLLMChoice, confirmRunNow, confirmSavePrompts, askRemoteOrigin, askSeedRepo, askInitOptions } = require('./ui/prompts');
const { runPlansSequential, waitForCompletionFile, runCodexCommand, makeGitHubCommand } = require('./llm/agentRunner');
const { ConfigManager } = require('./config/configManager');
const logger = require('./utils/logger');
const fs = require('fs').promises;
const { execSync } = require('child_process');

async function runScaffold(opts = {}, deps = {}) {
  const cwd = opts.cwd || process.cwd();
  const nonInteractive = !!opts.nonInteractive;
  
  // Initialize config manager
  const configManager = new ConfigManager(cwd);
  
  // Get configured spec directory name
  const specDirName = await configManager.getSpecDirName();
  
  // Check if seed-repo is configured, prompt if not
  let seedRepo = await configManager.get('seed-repo');
  if (!seedRepo) {
    logger.info('No seed repository configured.');
    seedRepo = await askSeedRepo(null, nonInteractive);
    await configManager.set('seed-repo', seedRepo);
    logger.info(`✓ Configured seed-repo: ${seedRepo}\n`);
  }

  const githubClient = deps.githubClient || new GitHubClient({ cwd });

  // Check if current directory is a git repository, if not, initialize it
  const isGitRepo = await fs.access(path.join(cwd, '.git')).then(() => true).catch(() => false);
  if (!isGitRepo) {
    logger.info('Initializing git repository...');
    execSync('git init', { cwd });

    const remoteOrigin = await askRemoteOrigin(nonInteractive);
    if (remoteOrigin) {
      logger.info('Adding remote origin...');
      execSync(`git remote add origin ${remoteOrigin}`, { cwd });
    }
  }

  logger.info('r3nd — project scaffolder');

  const backendInstructionsExist = await fs.access(path.join(cwd, specDirName, 'instructions', 'backend.instructions.md')).then(() => true).catch(() => false);
  const frontendInstructionsExist = await fs.access(path.join(cwd, specDirName, 'instructions', 'frontend.instructions.md')).then(() => true).catch(() => false);

  let backend = opts.backend;
  let frontend = opts.frontend;

  if (!backend) {
    if (backendInstructionsExist) {
      logger.info('✓ Backend instructions already exist, skipping backend selection');
      backend = 'nestjs';
    } else {
      backend = await chooseBackend(nonInteractive);
    }
  }

  if (!frontend) {
    if (frontendInstructionsExist) {
      logger.info('✓ Frontend instructions already exist, skipping frontend selection');
      frontend = 'vue';
    } else {
      frontend = await chooseFrontend(nonInteractive);
    }
  }

  // Ask user which components to initialize (similar to init command)
  let selectedOptions = [];
  if (!backendInstructionsExist || !frontendInstructionsExist) {
    logger.info('\nr3nd — component initializer\n');
    selectedOptions = await askInitOptions(nonInteractive);
    logger.info(`\nSelected: ${selectedOptions.join(', ') || 'None'}\n`);
  }

  // Mandatory seed files (excluding agents which are handled separately)
  const mandatorySeedFiles = [
    'rnd/templates/retro.md',
    '.github/workflows/06-retro-ready.yml'
  ];

  if (backendInstructionsExist && frontendInstructionsExist) {
    logger.info('✓ Resuming from existing setup, skipping file download');
  } else {
    logger.info('Fetching file list from GitHub...');
    const tree = await githubClient.getTree();

    // Fetch seed repo's spec-dir-name configuration
    const seedSpecDirName = await fetchSeedSpecDirName(githubClient);

    // Copy common files (gitignore)
    await copyCommonFiles(cwd, tree, githubClient, specDirName, { nonInteractive });

    // Copy testing instructions to spec-dir/instructions
    await copyTestingInstructions(cwd, tree, githubClient, specDirName, seedSpecDirName, { nonInteractive });

    // Copy overlay-specific files (instructions, build plans)
    await copyOverlayFiles(cwd, tree, githubClient, specDirName, seedSpecDirName, { 
      backend: !backendInstructionsExist ? backend : null, 
      frontend: !frontendInstructionsExist ? frontend : null, 
      nonInteractive 
    });

    // Copy platform-agnostic agent personas from seed repo
    await copyAgentPersonas(cwd, tree, githubClient, specDirName, seedSpecDirName, { nonInteractive });

    // Process selected options (these are optional)
    if (selectedOptions.includes('github')) {
      await copyGitHubWorkflows(cwd, tree, githubClient, specDirName, seedSpecDirName, { nonInteractive });
      // Compose GitHub Copilot skill files from wrappers + shared task content
      await composeAgentFiles(cwd, tree, githubClient, '.github/skills', 'SKILL.md', specDirName, seedSpecDirName, { nonInteractive });
    }

    if (selectedOptions.includes('cursor')) {
      // Compose Cursor command files from wrappers + personas
      await composeAgentFiles(cwd, tree, githubClient, '.cursor/commands', '.md', specDirName, seedSpecDirName, { nonInteractive });
    }

    if (selectedOptions.includes('codex')) {
      // Compose Codex skill files from wrappers + personas
      await composeAgentFiles(cwd, tree, githubClient, '.codex/skills', 'SKILL.md', specDirName, seedSpecDirName, { nonInteractive });
    }

    if (selectedOptions.includes('claude')) {
      // Compose Claude command files from wrappers + personas
      await composeAgentFiles(cwd, tree, githubClient, '.claude/commands', '.md', specDirName, seedSpecDirName, { nonInteractive });
    }

    // Copy templates
    await copyTemplates(cwd, tree, githubClient, specDirName, seedSpecDirName, { nonInteractive });

    // Ensure spec directories exist (conditionally create rnd/instructions)
    const createRndInstructions = selectedOptions.includes('github');
    await ensureSpecDirectories(cwd, specDirName, { createRndInstructions });

    // If GitHub skills are selected, copy instructions from spec-dir to rnd/instructions
    if (createRndInstructions) {
      await copyInstructionsToRnd(cwd, specDirName, { nonInteractive });
    }

    // Ensure mandatory seed files exist
    await ensureMandatorySeedFiles(cwd, githubClient, specDirName, seedSpecDirName, mandatorySeedFiles, { 
      backend, 
      frontend, 
      nonInteractive 
    });

    logger.info('Scaffolding complete.');
  }

  logger.info('Next steps: install dependencies and adapt overlays as needed.');

  const llmChoice = await askLLMChoice(nonInteractive);
  if (llmChoice === 'codex') {
    const allPlans = [
      `${specDirName}/build_plans/scaffold-backend-bootstrap-build-plan.md`,
      `${specDirName}/build_plans/scaffold-frontend-bootstrap-build-plan.md`,
      `${specDirName}/build_plans/scaffold-backend-complete-build-plan.md`,
      `${specDirName}/build_plans/scaffold-frontend-complete-build-plan.md`,
      `${specDirName}/build_plans/scaffold-infra-build-plan.md`
    ];

    const backendDirExists = await fs.access(path.join(cwd, 'src', 'backend')).then(() => true).catch(() => false);
    const frontendDirExists = await fs.access(path.join(cwd, 'src', 'frontend')).then(() => true).catch(() => false);
    const dockerComposeExists = await fs.access(path.join(cwd, 'docker-compose.yml')).then(() => true).catch(() => false);

    const plans = [];
    if (!backendDirExists) { plans.push(allPlans[0]); plans.push(allPlans[2]); }
    if (!frontendDirExists) { plans.push(allPlans[1]); plans.push(allPlans[3]); }
    if (!dockerComposeExists) { plans.push(allPlans[4]); }

    if (plans.length === 0) { logger.info('\n✓ All scaffolding appears to be complete. Nothing to do!'); return; }

    function getPlanName(planPath) { return path.basename(planPath, '.md'); }
    function makePrompt(planPath) { const planName = getPlanName(planPath); const doneFile = `${planName}.done`; return `using the ${specDirName}/agents/developer.md as instructions please implement the following building plan to its completion:\n\n1. ${planPath}\n\nIMPORTANT: When you have completely finished implementing this build plan, create a file named ${doneFile} in the current directory to signal completion.`; }
    function makeCodexCommand(promptText) { return `codex --yolo '${promptText.replace(/"/g, '\"')}'`; }

    logger.info('\nLocal codex CLI commands (will be run sequentially):');
    plans.forEach((p, i) => logger.info(`${i + 1}. ${p}`));

    const runNow = await confirmRunNow(nonInteractive);
    if (!runNow) {
      logger.info('Okay — when ready you can run these commands locally in this order:');
      plans.forEach((p, i) => { logger.info(`\n--- Prompt ${i + 1} ---\n`); logger.info(makePrompt(p)); });
      return;
    }

    logger.info('Running codex CLI sequentially:');
    try {
      await runPlansSequential(plans, { cwd, makePrompt: async (p) => makePrompt(p), makeCommand: (prompt) => makeCodexCommand(prompt), timeoutMs: opts.agentTimeout || 3600000, agentType: 'codex' });
      logger.info('All codex plans completed successfully.');
    } catch (err) {
      logger.error('An error occurred while running codex:', err && err.message ? err.message : err);
    }
  } else if (llmChoice === 'gemini') {
    // Gemini: run `gemini --yolo "prompt"` sequentially and wait for process exit.
    const allPlansGem = [
      `${specDirName}/build_plans/scaffold-backend-bootstrap-build-plan.md`,
      `${specDirName}/build_plans/scaffold-frontend-bootstrap-build-plan.md`,
      `${specDirName}/build_plans/scaffold-backend-complete-build-plan.md`,
      `${specDirName}/build_plans/scaffold-frontend-complete-build-plan.md`,
      `${specDirName}/build_plans/scaffold-infra-build-plan.md`
    ];

    const backendDirExistsGem = await fs.access(path.join(cwd, 'src', 'backend')).then(() => true).catch(() => false);
    const frontendDirExistsGem = await fs.access(path.join(cwd, 'src', 'frontend')).then(() => true).catch(() => false);
    const dockerComposeExistsGem = await fs.access(path.join(cwd, 'docker-compose.yml')).then(() => true).catch(() => false);

    const plansGem = [];
    if (!backendDirExistsGem) { plansGem.push(allPlansGem[0]); plansGem.push(allPlansGem[2]); }
    if (!frontendDirExistsGem) { plansGem.push(allPlansGem[1]); plansGem.push(allPlansGem[3]); }
    if (!dockerComposeExistsGem) { plansGem.push(allPlansGem[4]); }

    if (plansGem.length === 0) { logger.info('\n✓ All scaffolding appears to be complete. Nothing to do!'); return; }

    function makeGeminiPrompt(planPath) {
      // Instruct Gemini explicitly not to start long-running foreground servers
      // and require a .done file to signal completion (same automation hack as codex).
      const planName = path.basename(planPath, '.md');
      const doneFile = `${planName}.done`;
    return `using the ${specDirName}/agents/developer.md as instructions please implement the following building plan to its completion:\n\n1. ${planPath}\n\nIMPORTANT: Do NOT start any server or docker foreground processes that require manual termination (like "npm run dev", "docker-compose up" without -d flag, "uvicorn" without --daemon, etc.). If you need to start servers or services, always run them in detached/background mode and output their logs. (e.g., "docker-compose up -d", "npm run dev &", or use process managers like PM2). Only start foreground processes if they naturally exit on their own. IF U START A SERVER FOREGROUND PROCESS THE UNIVERSE WILL END\n\nIMPORTANT: When you have completely finished implementing this build plan, create a file named ${doneFile} in the current directory to signal completion.`;
    }
    function makeGeminiCommand(promptText) { return `gemini --yolo -i "${promptText.replace(/"/g, '\\"')}"`; }

    logger.info('\nRunning Gemini CLI commands (interactive, sequentially):');
    try {
      await runPlansSequential(plansGem, { cwd, makePrompt: async (p) => makeGeminiPrompt(p), makeCommand: (prompt) => makeGeminiCommand(prompt), timeoutMs: opts.agentTimeout || 3600000, agentType: 'gemini' });
      logger.info('Gemini plans completed.');
    } catch (err) {
      logger.error('An error occurred while running Gemini plans:', err && err.message ? err.message : err);
    }
  } else if (llmChoice === 'claude') {
    const allPlansClaude = [
      `${specDirName}/build_plans/scaffold-backend-bootstrap-build-plan.md`,
      `${specDirName}/build_plans/scaffold-frontend-bootstrap-build-plan.md`,
      `${specDirName}/build_plans/scaffold-backend-complete-build-plan.md`,
      `${specDirName}/build_plans/scaffold-frontend-complete-build-plan.md`,
      `${specDirName}/build_plans/scaffold-infra-build-plan.md`
    ];

    const backendDirExistsClaude = await fs.access(path.join(cwd, 'src', 'backend')).then(() => true).catch(() => false);
    const frontendDirExistsClaude = await fs.access(path.join(cwd, 'src', 'frontend')).then(() => true).catch(() => false);
    const dockerComposeExistsClaude = await fs.access(path.join(cwd, 'docker-compose.yml')).then(() => true).catch(() => false);

    const plansClaude = [];
    if (!backendDirExistsClaude) { plansClaude.push(allPlansClaude[0]); plansClaude.push(allPlansClaude[2]); }
    if (!frontendDirExistsClaude) { plansClaude.push(allPlansClaude[1]); plansClaude.push(allPlansClaude[3]); }
    if (!dockerComposeExistsClaude) { plansClaude.push(allPlansClaude[4]); }

    if (plansClaude.length === 0) { logger.info('\n✓ All scaffolding appears to be complete. Nothing to do!'); return; }

    function makeClaudePrompt(planPath) {
      const planName = path.basename(planPath, '.md');
      const doneFile = `${planName}.done`;
      return `using the ${specDirName}/agents/developer.md as instructions please implement the following building plan to its completion:\n\n1. ${planPath}\n\nIMPORTANT: When you have completely finished implementing this build plan, create a file named ${doneFile} in the current directory to signal completion.`;
    }
    function makeClaudeCommand(promptText) { return `claude --dangerously-skip-permissions "${promptText.replace(/"/g, '\\"')}"`; }

    logger.info('\nRunning Claude Code CLI commands (interactive, sequentially):');
    try {
      await runPlansSequential(plansClaude, { cwd, makePrompt: async (p) => makeClaudePrompt(p), makeCommand: (prompt) => makeClaudeCommand(prompt), timeoutMs: opts.agentTimeout || 3600000, agentType: 'claude' });
      logger.info('Claude plans completed.');
    } catch (err) {
      logger.error('An error occurred while running Claude plans:', err && err.message ? err.message : err);
    }
  } else if (llmChoice === 'github') {
    // GitHub: send only first prompt, user continues on GitHub
    const allPlansGithub = [
      `${specDirName}/build_plans/scaffold-backend-bootstrap-build-plan.md`,
      `${specDirName}/build_plans/scaffold-frontend-bootstrap-build-plan.md`,
      `${specDirName}/build_plans/scaffold-backend-complete-build-plan.md`,
      `${specDirName}/build_plans/scaffold-frontend-complete-build-plan.md`,
      `${specDirName}/build_plans/scaffold-infra-build-plan.md`
    ];

    const backendDirExistsGithub = await fs.access(path.join(cwd, 'src', 'backend')).then(() => true).catch(() => false);
    const frontendDirExistsGithub = await fs.access(path.join(cwd, 'src', 'frontend')).then(() => true).catch(() => false);
    const dockerComposeExistsGithub = await fs.access(path.join(cwd, 'docker-compose.yml')).then(() => true).catch(() => false);

    const plansGithub = [];
    if (!backendDirExistsGithub) { plansGithub.push(allPlansGithub[0]); plansGithub.push(allPlansGithub[2]); }
    if (!frontendDirExistsGithub) { plansGithub.push(allPlansGithub[1]); plansGithub.push(allPlansGithub[3]); }
    if (!dockerComposeExistsGithub) { plansGithub.push(allPlansGithub[4]); }

    if (plansGithub.length === 0) { logger.info('\n✓ All scaffolding appears to be complete. Nothing to do!'); return; }

    // Create a single comprehensive prompt with all plans
    const allPlansText = plansGithub.map((p, i) => `${i + 1}. ${p}`).join('\n');
    const comprehensivePrompt = `using the ${specDirName}/agents/developer.md as instructions please implement the following building plans to completion (in order):\n\n${allPlansText}`;

    logger.info('\n=== Creating GitHub Agent Task ===');
    logger.info('Sending scaffold plans to GitHub agent...\n');
    
    try {
      const { runGitHubAgent } = require('./llm/agentRunner');
      const url = await runGitHubAgent(comprehensivePrompt, cwd, 'Scaffold task', { featureLabel: 'scaffold' });
      logger.info('\n📋 Next steps:');
      logger.info('  1. Monitor the agent\'s progress at the link above');
      logger.info('  2. The agent will implement all build plans sequentially');
      logger.info(`  3. Review the changes as they are made\n`);
    } catch (err) {
      if (err && err.code === 'GITHUB_BRANCH_PUSH_FAILED') {
        logger.error('GitHub agent run will not work: snapshot branch could not be pushed to origin.');
        logger.info('Use a local CLI tool, or fix your git remote/auth and rerun the command.');
        return;
      }
      if (err.message && err.message.includes('GitHub agent requires repository')) {
        logger.error('GitHub agent failed: Requires a repository with proper permissions.');
      } else {
        logger.error('An error occurred while creating GitHub agent task:', err && err.message ? err.message : err);
      }
    }
  } else if (llmChoice === 'generate') {
    // Produce prompts and optionally save (these prompts are intended for a human
    // operator or external agent and should NOT include the automated .done file
    // completion hack used by the local `codex` flow.)
    const allPlans = [
      `${specDirName}/build_plans/scaffold-backend-bootstrap-build-plan.md`,
      `${specDirName}/build_plans/scaffold-frontend-bootstrap-build-plan.md`,
      `${specDirName}/build_plans/scaffold-backend-complete-build-plan.md`,
      `${specDirName}/build_plans/scaffold-frontend-complete-build-plan.md`,
      `${specDirName}/build_plans/scaffold-infra-build-plan.md`
    ];

    const backendDirExists = await fs.access(path.join(cwd, 'src', 'backend')).then(() => true).catch(() => false);
    const frontendDirExists = await fs.access(path.join(cwd, 'src', 'frontend')).then(() => true).catch(() => false);
    const dockerComposeExists = await fs.access(path.join(cwd, 'docker-compose.yml')).then(() => true).catch(() => false);
    const plans = [];
    if (!backendDirExists) { plans.push(allPlans[0]); plans.push(allPlans[2]); }
    if (!frontendDirExists) { plans.push(allPlans[1]); plans.push(allPlans[3]); }
    if (!dockerComposeExists) { plans.push(allPlans[4]); }
    if (plans.length === 0) { logger.info('\n✓ All scaffolding appears to be complete. Nothing to generate!'); return; }

    function getPlanName(planPath) { return path.basename(planPath, '.md'); }
    // For user-facing prompts we omit the automated completion-file instruction.
    function makePrompt(planPath) {
      return `using the ${specDirName}/agents/developer.md as instructions please implement the following building plan to its completion:\n\n1. ${planPath}`;
    }

    logger.info('\n--- COPY & PASTE PROMPTS (in order) ---\n');
    let allPrompts = '';
    plans.forEach((p, i) => { const promptText = makePrompt(p); allPrompts += `--- Prompt ${i + 1}: ${p} ---\n${promptText}\n`; logger.info(`--- Prompt ${i + 1}: ${p} ---\n`); logger.info(promptText); });
    logger.info('\n--- END PROMPTS ---\n');

    const saveToFile = await confirmSavePrompts(nonInteractive);
    if (saveToFile) {
      try {
        const savePath = path.join(process.cwd(), specDirName, 'llm_create_prompts.txt');
        await ensureDir(path.dirname(savePath));
        await fs.writeFile(savePath, allPrompts, 'utf8');
        logger.info(`Saved prompts to ${savePath}`);
      } catch (err) {
        logger.error('Failed to save prompts file:', err && err.message ? err.message : err);
      }
    }
  } else {
    logger.info('Okay — no LLM action selected.');
  }
}

module.exports = { runScaffold };
