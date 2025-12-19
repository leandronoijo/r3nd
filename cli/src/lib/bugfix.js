const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');

const { askBugDescription, askBugfixLLMChoice, confirmBuildPlan } = require('./ui/prompts');
const { ensureDir } = require('./fs/fileWriter');
const logger = require('./utils/logger');

async function runBugfix(opts = {}) {
  const cwd = opts.cwd || process.cwd();
  const nonInteractive = !!opts.nonInteractive;

  logger.info('r3nd — bugfix workflow');

  // Check if we're in a project root directory
  const githubDirExists = await fs.access(path.join(cwd, '.github')).then(() => true).catch(() => false);
  const rndDirExists = await fs.access(path.join(cwd, 'rnd')).then(() => true).catch(() => false);
  const srcDirExists = await fs.access(path.join(cwd, 'src')).then(() => true).catch(() => false);

  if (!githubDirExists || !rndDirExists || !srcDirExists) {
    logger.error('Error: Not in a project root directory. Required directories (.github/, rnd/, src/) not found.');
    logger.error('Please run this command from the root of your r3nd project.');
    process.exit(1);
  }

  // Step 1: Get problem description from user
  const problemDescription = await askBugDescription(nonInteractive);
  
  // Step 2: Ask which LLM to use
  const llmChoice = await askBugfixLLMChoice(nonInteractive);
  
  if (llmChoice === 'naa') {
    logger.info('Bugfix workflow cancelled.');
    return;
  }

  if (llmChoice === 'github') {
    logger.info('GitHub coding agent is not yet implemented. Please choose another option.');
    return;
  }

  // Generate a timestamp-based build plan name with date and time
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '-').substring(0, 19);
  const planName = `bugfix-${timestamp}`;
  const planPath = `rnd/build_plans/${planName}.md`;
  const fullPlanPath = path.join(cwd, planPath);

  // Ensure the build_plans directory exists
  await ensureDir(path.dirname(fullPlanPath));

  // Step 3: Create prompts based on LLM choice
  const planPrompt = `using the instructions in .github/agents/team-lead.agent.md please create a build plan to fix the following problem: ${problemDescription}`;
  const implementPrompt = `using the instructions in .github/agents/developer.agent.md implement the following plan to completion: ${planPath}`;

  if (llmChoice === 'codex') {
    // Run codex for build plan creation
    logger.info('\n=== STEP 1: Creating Build Plan ===');
    logger.info('Running codex to create build plan...\n');

    const planDoneFile = `${planName}-plan.done`;
    const planPromptWithDone = `${planPrompt}\n\nIMPORTANT: Save the build plan to ${planPath}. When you have completely finished creating this build plan, create a file named ${planDoneFile} in the current directory to signal completion.`;
    
    const codexPlanCommand = ['codex', '--yolo', planPromptWithDone];
    
    try {
      const childProcess = spawn(codexPlanCommand[0], codexPlanCommand.slice(1), { cwd, stdio: 'inherit' });
      
      // Wait for the .done file
      logger.info(`\nWaiting for build plan creation to complete (looking for ${planDoneFile})...`);
      const maxWait = opts.agentTimeout || 3600000; // 1 hour default
      const startTime = Date.now();
      let found = false;
      
      while (Date.now() - startTime < maxWait) {
        const exists = await fs.access(path.join(cwd, planDoneFile)).then(() => true).catch(() => false);
        if (exists) {
          found = true;
          logger.info('✓ Build plan creation completed');
          // Kill the child process
          childProcess.kill('SIGTERM');
          // Clean up the .done file
          await fs.unlink(path.join(cwd, planDoneFile)).catch(() => {});
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      if (!found) {
        childProcess.kill('SIGTERM');
        throw new Error('Timeout waiting for build plan creation to complete');
      }
    } catch (err) {
      logger.error('Failed to create build plan:', err && err.message ? err.message : err);
      return;
    }

    // Clear the terminal before prompting user
    process.stdout.write('\x1Bc');

    // Step 4: Wait for user approval
    logger.info(`\nPlease review the build plan at: ${planPath}`);
    const approved = await confirmBuildPlan(nonInteractive);
    
    if (!approved) {
      logger.info('Build plan not approved. Bugfix workflow cancelled.');
      return;
    }

    // Step 5: Run implementation
    logger.info('\n=== STEP 2: Implementing Build Plan ===');
    logger.info('Running codex to implement the build plan...\n');

    const implDoneFile = `${planName}-impl.done`;
    const implPromptWithDone = `${implementPrompt}\n\nIMPORTANT: When you have completely finished implementing this build plan, create a file named ${implDoneFile} in the current directory to signal completion.`;
    
    const codexImplCommand = ['codex', '--yolo', implPromptWithDone];
    
    try {
      const childProcess = spawn(codexImplCommand[0], codexImplCommand.slice(1), { cwd, stdio: 'inherit' });
      
      // Wait for the .done file
      logger.info(`\nWaiting for implementation to complete (looking for ${implDoneFile})...`);
      const maxWait = opts.agentTimeout || 3600000;
      const startTime = Date.now();
      let found = false;
      
      while (Date.now() - startTime < maxWait) {
        const exists = await fs.access(path.join(cwd, implDoneFile)).then(() => true).catch(() => false);
        if (exists) {
          found = true;
          logger.info('✓ Implementation completed');
          // Kill the child process
          childProcess.kill('SIGTERM');
          // Clean up the .done file
          await fs.unlink(path.join(cwd, implDoneFile)).catch(() => {});
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      if (!found) {
        childProcess.kill('SIGTERM');
        throw new Error('Timeout waiting for implementation to complete');
      }

      logger.info('\n✓ Bugfix workflow completed successfully!');
    } catch (err) {
      logger.error('Failed to implement build plan:', err && err.message ? err.message : err);
    }

  } else if (llmChoice === 'gemini') {
    // Run gemini for build plan creation
    logger.info('\n=== STEP 1: Creating Build Plan ===');
    logger.info('Running Gemini to create build plan...\n');

    const planDoneFile = `${planName}-plan.done`;
    const planPromptWithDone = `${planPrompt}\n\nIMPORTANT: Save the build plan to ${planPath}. When you have completely finished creating this build plan, create a file named ${planDoneFile} in the current directory to signal completion.`;
    
    const geminiPlanCommand = ['gemini', '--yolo', '-i', planPromptWithDone];
    
    try {
      const childProcess = spawn(geminiPlanCommand[0], geminiPlanCommand.slice(1), { cwd, stdio: 'inherit' });
      
      // Wait for the .done file
      logger.info(`\nWaiting for build plan creation to complete (looking for ${planDoneFile})...`);
      const maxWait = opts.agentTimeout || 3600000; // 1 hour default
      const startTime = Date.now();
      let found = false;
      
      while (Date.now() - startTime < maxWait) {
        const exists = await fs.access(path.join(cwd, planDoneFile)).then(() => true).catch(() => false);
        if (exists) {
          found = true;
          logger.info('✓ Build plan creation completed');
          // Kill the child process
          childProcess.kill('SIGTERM');
          // Clean up the .done file
          await fs.unlink(path.join(cwd, planDoneFile)).catch(() => {});
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      if (!found) {
        childProcess.kill('SIGTERM');
        throw new Error('Timeout waiting for build plan creation to complete');
      }
    } catch (err) {
      logger.error('Failed to create build plan:', err && err.message ? err.message : err);
      return;
    }

    // Clear the terminal before prompting user
    process.stdout.write('\x1Bc');

    // Step 4: Wait for user approval
    logger.info(`\nPlease review the build plan at: ${planPath}`);
    const approved = await confirmBuildPlan(nonInteractive);
    
    if (!approved) {
      logger.info('Build plan not approved. Bugfix workflow cancelled.');
      return;
    }

    // Step 5: Run implementation
    logger.info('\n=== STEP 2: Implementing Build Plan ===');
    logger.info('Running Gemini to implement the build plan...\n');

    const implDoneFile = `${planName}-impl.done`;
    const implPromptWithDone = `${implementPrompt}\n\nIMPORTANT: Do NOT start any server or docker foreground processes that require manual termination. If you need to start servers or services, always run them in detached/background mode. When you have completely finished implementing this build plan, create a file named ${implDoneFile} in the current directory to signal completion.`;
    
    const geminiImplCommand = ['gemini', '--yolo', '-i', implPromptWithDone];
    
    try {
      const childProcess = spawn(geminiImplCommand[0], geminiImplCommand.slice(1), { cwd, stdio: 'inherit' });
      
      // Wait for the .done file
      logger.info(`\nWaiting for implementation to complete (looking for ${implDoneFile})...`);
      const maxWait = opts.agentTimeout || 3600000;
      const startTime = Date.now();
      let found = false;
      
      while (Date.now() - startTime < maxWait) {
        const exists = await fs.access(path.join(cwd, implDoneFile)).then(() => true).catch(() => false);
        if (exists) {
          found = true;
          logger.info('✓ Implementation completed');
          // Kill the child process
          childProcess.kill('SIGTERM');
          // Clean up the .done file
          await fs.unlink(path.join(cwd, implDoneFile)).catch(() => {});
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      if (!found) {
        childProcess.kill('SIGTERM');
        throw new Error('Timeout waiting for implementation to complete');
      }

      logger.info('\n✓ Bugfix workflow completed successfully!');
    } catch (err) {
      logger.error('Failed to implement build plan:', err && err.message ? err.message : err);
    }

  } else if (llmChoice === 'generate') {
    // Generate copy-paste prompts
    logger.info('\n=== BUGFIX WORKFLOW PROMPTS ===\n');
    
    logger.info('--- STEP 1: Create Build Plan ---');
    logger.info('Copy and paste this prompt to your LLM agent:\n');
    logger.info(planPrompt);
    logger.info(`\n(Save the resulting build plan to: ${planPath})`);
    
    logger.info('\n--- STEP 2: Implement Build Plan ---');
    logger.info('After reviewing and approving the build plan, copy and paste this prompt:\n');
    logger.info(implementPrompt);
    
    logger.info('\n--- END PROMPTS ---\n');

    // Optionally save to file
    const saveContent = `=== BUGFIX WORKFLOW PROMPTS ===\n\nProblem Description:\n${problemDescription}\n\n--- STEP 1: Create Build Plan ---\n${planPrompt}\n\n(Save the resulting build plan to: ${planPath})\n\n--- STEP 2: Implement Build Plan ---\n(After reviewing and approving the build plan from Step 1)\n${implementPrompt}\n`;
    
    try {
      const savePath = path.join(cwd, 'rnd', 'bugfix_prompts.txt');
      await ensureDir(path.dirname(savePath));
      await fs.writeFile(savePath, saveContent, 'utf8');
      logger.info(`Prompts saved to: ${savePath}`);
    } catch (err) {
      logger.error('Failed to save prompts file:', err && err.message ? err.message : err);
    }
  }
}

module.exports = { runBugfix };
