const path = require('path');

const { GitHubClient } = require('./github/githubClient');
const { mapDestination } = require('./overlays/overlayRegistry');
const { writeBuffer, ensureDir } = require('./fs/fileWriter');
const { chooseBackend, chooseFrontend, askLLMChoice, confirmRunNow, confirmSavePrompts } = require('./ui/prompts');
const { runPlansSequential, waitForCompletionFile, runCodexCommand } = require('./llm/agentRunner');
const logger = require('./utils/logger');
const fs = require('fs').promises;

async function runScaffold(opts = {}, deps = {}) {
  const cwd = opts.cwd || process.cwd();
  const nonInteractive = !!opts.nonInteractive;
  const githubClient = deps.githubClient || new GitHubClient({});

  logger.info('r3nd — project scaffolder');

  const backendInstructionsExist = await fs.access(path.join(cwd, '.github', 'instructions', 'backend.instructions.md')).then(() => true).catch(() => false);
  const frontendInstructionsExist = await fs.access(path.join(cwd, '.github', 'instructions', 'frontend.instructions.md')).then(() => true).catch(() => false);

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

  const prefixes = [];
  if (!backendInstructionsExist && !frontendInstructionsExist) {
    prefixes.push('.github/', 'rnd/', '.gitignore', 'README.md');
  }
  if (!backendInstructionsExist) prefixes.push(`overlays/backend/${backend}/`);
  if (!frontendInstructionsExist) prefixes.push(`overlays/frontend/${frontend}/`);

  if (backendInstructionsExist && frontendInstructionsExist) {
    logger.info('✓ Resuming from existing setup, skipping file download');
  } else {
    logger.info('Fetching file list from GitHub...');
    const tree = await githubClient.getTree();
    const toCopy = tree.filter(item => {
      if (item.type !== 'blob') return false;
      return prefixes.some(p => (p.endsWith('/') ? item.path.startsWith(p) : item.path === p));
    }).map(i => i.path);

    if (toCopy.length === 0) {
      logger.warn('No files matched the requested prefixes.');
    } else {
      logger.info(`Found ${toCopy.length} files to copy. Starting download...`);
      for (const remotePath of toCopy) {
        const mapped = mapDestination(remotePath, backend, frontend);
        const buffer = await githubClient.fetchRaw(remotePath);
        const rel = mapped || remotePath;
        await writeBuffer(cwd, rel, buffer, { overwrite: true });
        logger.info(`Copied: ${remotePath} -> ${rel}`);
      }
    }

    const rndDirs = ['rnd/build_plans', 'rnd/product_specs', 'rnd/tech_specs'];
    for (const r of rndDirs) {
      await ensureDir(path.join(cwd, r));
      logger.info(`Ensured directory: ${r}`);
    }

    await ensureDir(path.join(cwd, '.github', 'instructions'));
    logger.info('Ensured directory: .github/instructions');
    logger.info('Scaffolding complete.');
  }

  logger.info('Next steps: install dependencies and adapt overlays as needed.');

  const llmChoice = await askLLMChoice(nonInteractive);
  if (llmChoice === 'codex') {
    const allPlans = [
      'rnd/build_plans/scaffold-backend-bootstrap-build-plan.md',
      'rnd/build_plans/scaffold-frontend-bootstrap-build-plan.md',
      'rnd/build_plans/scaffold-backend-complete-build-plan.md',
      'rnd/build_plans/scaffold-frontend-complete-build-plan.md',
      'rnd/build_plans/scaffold-infra-build-plan.md'
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
    function makePrompt(planPath) { const planName = getPlanName(planPath); const doneFile = `${planName}.done`; return `using the .github/agents/developer.agent.md as instructions please implement the following building plan to its completion:\n\n1. ${planPath}\n\nIMPORTANT: When you have completely finished implementing this build plan, create a file named ${doneFile} in the current directory to signal completion.`; }
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
      await runPlansSequential(plans, { cwd, makePrompt: async (p) => makePrompt(p), makeCommand: (prompt) => makeCodexCommand(prompt), timeoutMs: opts.agentTimeout || 3600000 });
      logger.info('All codex plans completed successfully.');
    } catch (err) {
      logger.error('An error occurred while running codex:', err && err.message ? err.message : err);
    }
  } else if (llmChoice === 'gemini') {
    // Gemini: run `gemini --yolo "prompt"` sequentially and wait for process exit.
    const allPlansGem = [
      'rnd/build_plans/scaffold-backend-bootstrap-build-plan.md',
      'rnd/build_plans/scaffold-frontend-bootstrap-build-plan.md',
      'rnd/build_plans/scaffold-backend-complete-build-plan.md',
      'rnd/build_plans/scaffold-frontend-complete-build-plan.md',
      'rnd/build_plans/scaffold-infra-build-plan.md'
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
    return `using the .github/agents/developer.agent.md as instructions please implement the following building plan to its completion:\n\n1. ${planPath}\n\nIMPORTANT: Do NOT start any server or docker foreground processes that require manual termination (like "npm run dev", "docker-compose up" without -d flag, "uvicorn" without --daemon, etc.). If you need to start servers or services, always run them in detached/background mode and output their logs. (e.g., "docker-compose up -d", "npm run dev &", or use process managers like PM2). Only start foreground processes if they naturally exit on their own. IF U START A SERVER FOREGROUND PROCESS THE UNIVERSE WILL END\n\nIMPORTANT: When you have completely finished implementing this build plan, create a file named ${doneFile} in the current directory to signal completion.`;
    }
    function makeGeminiCommand(promptText) { return `gemini --yolo -i "${promptText.replace(/"/g, '\\"')}"`; }

    logger.info('\nRunning Gemini CLI commands (interactive, sequentially):');
    try {
      await runPlansSequential(plansGem, { cwd, makePrompt: async (p) => makeGeminiPrompt(p), makeCommand: (prompt) => makeGeminiCommand(prompt), timeoutMs: opts.agentTimeout || 3600000 });
      logger.info('Gemini plans completed.');
    } catch (err) {
      logger.error('An error occurred while running Gemini plans:', err && err.message ? err.message : err);
    }
  } else if (llmChoice === 'generate') {
    // Produce prompts and optionally save (these prompts are intended for a human
    // operator or external agent and should NOT include the automated .done file
    // completion hack used by the local `codex` flow.)
    const allPlans = [
      'rnd/build_plans/scaffold-backend-bootstrap-build-plan.md',
      'rnd/build_plans/scaffold-frontend-bootstrap-build-plan.md',
      'rnd/build_plans/scaffold-backend-complete-build-plan.md',
      'rnd/build_plans/scaffold-frontend-complete-build-plan.md',
      'rnd/build_plans/scaffold-infra-build-plan.md'
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
      return `using the .github/agents/developer.agent.md as instructions please implement the following building plan to its completion:\n\n1. ${planPath}`;
    }

    logger.info('\n--- COPY & PASTE PROMPTS (in order) ---\n');
    let allPrompts = '';
    plans.forEach((p, i) => { const promptText = makePrompt(p); allPrompts += `--- Prompt ${i + 1}: ${p} ---\n${promptText}\n`; logger.info(`--- Prompt ${i + 1}: ${p} ---\n`); logger.info(promptText); });
    logger.info('\n--- END PROMPTS ---\n');

    const saveToFile = await confirmSavePrompts(nonInteractive);
    if (saveToFile) {
      try {
        const savePath = path.join(process.cwd(), 'rnd', 'llm_create_prompts.txt');
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
