const child_process = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const { detectAvailableTools, getInstallInstructions } = require('../utils/toolDetector');
const logger = require('../utils/logger');

// Simple agent runner that supports the file-based completion signaling used
// by the existing codex workflow. Agents should expose a `makeCommand(prompt)`
// function or the runner can be extended to call different agent types.

async function waitForCompletionFile(doneFile, maxWaitMs = 3600000) {
  const checkInterval = 2000;
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = async () => {
      try {
        await fs.access(doneFile);
        try { await fs.unlink(doneFile); } catch (_) {}
        resolve();
      } catch (_) {
        if (Date.now() - start > maxWaitMs) return reject(new Error('timeout'));
        setTimeout(check, checkInterval);
      }
    };
    check();
  });
}

/**
 * Spawn an interactive agent process that signals completion via a done file
 * @param {string} command - The command to execute (e.g., 'codex --yolo "prompt"')
 * @param {string} cwd - Working directory
 * @param {string} doneFile - Path to the done file that signals completion
 * @param {string} agentName - Name of the agent for logging
 * @returns {Promise<boolean>} True if completed successfully, false otherwise
 */
async function spawnAgentWithDoneFile(command, cwd, doneFile, agentName) {
  const logger = require('../utils/logger');
  
  logger.info(`\nRunning ${agentName}...\n`);
  
  const child = child_process.spawn('sh', ['-lc', command], { stdio: 'inherit', cwd });
  
  // Track child exit
  let childExited = false;
  const childExitPromise = new Promise(resolve => {
    child.on('exit', (code, signal) => {
      childExited = true;
      resolve({ done: false, code, signal });
    });
  });
  
  const childErrorPromise = new Promise(resolve => {
    child.on('error', (err) => {
      resolve({ done: false, err });
    });
  });
  
  // Race between done file appearing and child exiting
  const doneOrExit = Promise.race([
    waitForCompletionFile(doneFile, Infinity).then(() => ({ done: true })),
    childExitPromise,
    childErrorPromise
  ]);
  
  const result = await doneOrExit;
  
  if (result && result.done) {
    // Normal completion signalled by the done file
    logger.info('\n✓ Agent completed successfully');
    
    // Kill the child if still running
    if (!childExited) {
      try {
        child.kill('SIGTERM');
      } catch (_) {}
      await new Promise(resolve => setTimeout(resolve, 500));
      if (!childExited) {
        try { child.kill('SIGKILL'); } catch (_) {}
      }
    }
    
    // Wait for exit if not already exited
    if (!childExited) {
      await childExitPromise;
    }
    
    // Clear terminal for next interaction
    process.stdout.write('\x1Bc');
    
    return true;
  }
  
  // If we reach here, the child exited or errored without creating the done file
  if (result && result.err) {
    logger.error(`\n✗ Agent process error:`, result.err && result.err.message ? result.err.message : result.err);
  } else if (result && typeof result.code !== 'undefined') {
    logger.error(`\n✗ Agent exited (code=${result.code}, signal=${result.signal}) without completing the task`);
  } else {
    logger.error(`\n✗ Agent terminated without creating completion file`);
  }
  
  // Ensure child is not left running
  if (!childExited) {
    try { child.kill('SIGTERM'); } catch (_) {}
    await new Promise(resolve => setTimeout(resolve, 500));
    if (!childExited) {
      try { child.kill('SIGKILL'); } catch (_) {}
    }
    await childExitPromise;
  }
  
  return false;
}

async function runCodexCommand(cmd, cwd) {
  return new Promise((resolve, reject) => {
    const child = child_process.spawn('sh', ['-lc', cmd], { stdio: 'inherit', cwd });
    child.on('error', err => reject(err));
    child.on('exit', code => resolve(code));
  });
}

/**
 * Construct GitHub CLI agent command
 * @param {string} promptText - The prompt to pass to the GitHub agent
 * @returns {string} The formatted GitHub CLI command
 */
function escapeForDoubleQuotes(value) {
  return value.replace(/"/g, '\\"');
}

function makeGitHubCommand(promptText, options = {}) {
  // Escape double quotes in the prompt text
  const escapedPrompt = escapeForDoubleQuotes(promptText);
  const baseBranch = options.baseBranch ? ` --base "${escapeForDoubleQuotes(options.baseBranch)}"` : '';
  return `gh agent-task create "${escapedPrompt}"${baseBranch}`;
}

function slugifyFeature(input) {
  const normalized = String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || 'agent';
}

async function runGit(args, cwd) {
  return new Promise((resolve, reject) => {
    const child = child_process.spawn('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', data => { stdout += data.toString(); });
    child.stderr.on('data', data => { stderr += data.toString(); });
    child.on('error', err => reject(err));
    child.on('exit', code => resolve({ code, stdout, stderr }));
  });
}

async function ensureGitBaseBranch(cwd, featureLabel, taskName) {
  const status = await runGit(['status', '--porcelain'], cwd);
  if (status.code !== 0) {
    throw new Error(status.stderr || 'Failed to read git status');
  }

  const currentBranchResult = await runGit(['rev-parse', '--abbrev-ref', 'HEAD'], cwd);
  const currentBranch = currentBranchResult.stdout.trim();
  if (currentBranchResult.code !== 0 || !currentBranch || currentBranch === 'HEAD') {
    throw new Error('GitHub agent requires a checked-out branch (not detached HEAD).');
  }

  if (!status.stdout.trim()) {
    return currentBranch;
  }

  const safeSlug = slugifyFeature(featureLabel || taskName);
  let branchName = `st/${safeSlug}`;

  const branchExists = await runGit(['show-ref', '--verify', '--quiet', `refs/heads/${branchName}`], cwd);
  if (branchExists.code === 0) {
    const suffix = Date.now().toString(36);
    branchName = `st/${safeSlug}-${suffix}`;
  }

  logger.info(`\nLocal changes detected. Creating snapshot branch ${branchName}...`);

  const checkout = await runGit(['checkout', '-b', branchName], cwd);
  if (checkout.code !== 0) {
    throw new Error(checkout.stderr || `Failed to create branch ${branchName}`);
  }

  const addAll = await runGit(['add', '-A'], cwd);
  if (addAll.code !== 0) {
    throw new Error(addAll.stderr || 'Failed to stage changes');
  }

  const commitMessage = `chore: agent snapshot (${safeSlug})`;
  const commit = await runGit(['commit', '-m', commitMessage], cwd);
  if (commit.code !== 0) {
    throw new Error(commit.stderr || 'Failed to commit changes');
  }

  const push = await runGit(['push', '-u', 'origin', branchName], cwd);
  if (push.code !== 0) {
    const err = new Error(push.stderr || 'Failed to push snapshot branch to origin');
    err.code = 'GITHUB_BRANCH_PUSH_FAILED';
    err.branch = branchName;
    throw err;
  }

  return branchName;
}

/**
 * Run GitHub CLI agent command with centralized error handling
 * @param {string} promptText - The prompt to pass to the GitHub agent
 * @param {string} cwd - Working directory
 * @param {string} taskName - Optional name for logging (e.g., 'Build plan creation')
 * @param {Object} options - Additional options
 * @param {string} options.baseBranch - Explicit base branch
 * @param {string} options.featureLabel - Feature label for snapshot branch slug
 * @returns {Promise<string>} The agent session URL
 * @throws {Error} If agent fails with exit code 1 (repo/permissions) or other errors
 */
async function runGitHubAgent(promptText, cwd, taskName = 'Task', options = {}) {
  const resolvedBase = options.baseBranch || await ensureGitBaseBranch(cwd, options.featureLabel, taskName);
  const cmd = makeGitHubCommand(promptText, { baseBranch: resolvedBase });
  
  const result = await new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    const childProcess = child_process.spawn('sh', ['-lc', cmd], { cwd, stdio: ['inherit', 'pipe', 'pipe'] });
    
    childProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      process.stdout.write(data);
    });
    
    childProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });
    
    childProcess.on('error', (err) => reject(err));
    childProcess.on('exit', (code) => resolve({ code, stdout, stderr }));
  });
  
  if (result.code === 1) {
    console.error(`✗ GitHub agent failed: A repository is required, or the repository doesn't have permissions to run agents.`);
    console.error(`  Please ensure you're in a GitHub repository and have the necessary permissions.`);
    throw new Error('GitHub agent requires repository with proper permissions');
  } else if (result.code !== 0) {
    console.error(`✗ GitHub agent exited with code ${result.code}`);
    throw new Error(`GitHub agent exited with code ${result.code}`);
  }
  
  // Extract URL from stdout (it's the last non-empty line)
  const url = result.stdout.trim().split('\n').filter(line => line.trim()).pop() || '';
  
  console.log(`✓ ${taskName} created`);
  if (url) {
    console.log(`\n🔗 Agent session: ${url}`);
  }
  
  return url;
}

/**
 * Validate that the required agent tool is available before running
 * @param {string} agentType - The agent type (codex, claude, gemini, github)
 * @throws {Error} If agent tool is not available
 */
function validateAgentAvailability(agentType) {
  const availableTools = detectAvailableTools();
  
  if (agentType === 'codex' && !availableTools.codex) {
    throw new Error(`Codex CLI not found. ${getInstallInstructions('codex')}`);
  }
  if (agentType === 'claude' && !availableTools.claude) {
    throw new Error(`Claude Code CLI not found. ${getInstallInstructions('claude')}`);
  }
  if (agentType === 'gemini' && !availableTools.gemini) {
    throw new Error(`Gemini CLI not found. ${getInstallInstructions('gemini')}`);
  }
  if (agentType === 'github' && !availableTools.github) {
    throw new Error(`GitHub CLI not found. ${getInstallInstructions('github')}`);
  }
}

async function runPlansSequential(plans, { cwd = process.cwd(), makePrompt, makeCommand, timeoutMs = 3600000, agentType = 'codex' } = {}) {
  // Validate agent availability before starting
  if (agentType !== 'generate') {
    validateAgentAvailability(agentType);
  }
  
  for (const planPath of plans) {
    const prompt = await makePrompt(planPath);
    const cmd = makeCommand(prompt);
    const planName = path.basename(planPath, '.md');
    
    // GitHub agent doesn't need done file - it exits when complete
    if (agentType === 'github') {
      try {
        const url = await runGitHubAgent(prompt, cwd, `Plan: ${planName}`, { featureLabel: planName });
      } catch (err) {
        throw err; // Stop on GitHub agent failure
      }
      continue;
    }
    
    // For local interactive agents (codex/claude/gemini): wait for completion file
    const doneFile = path.join(cwd, `${planName}.done`);
    // Spawn the agent interactively.
    const child = child_process.spawn('sh', ['-lc', cmd], { stdio: 'inherit', cwd });

    // Track child exit to avoid race conditions
    let childExited = false;
    const childExitPromise = new Promise(resolve => {
      child.on('exit', (code, signal) => {
        childExited = true;
        resolve({ done: false, code, signal });
      });
    });
    const childErrorPromise = new Promise(resolve => {
      child.on('error', (err) => {
        resolve({ done: false, err });
      });
    });

    // Create a promise that resolves when either the done file appears OR the child exits/errors.
    const doneOrExit = Promise.race([
      waitForCompletionFile(doneFile, timeoutMs).then(() => ({ done: true })),
      childExitPromise,
      childErrorPromise
    ]);

    const result = await doneOrExit;

    if (result && result.done) {
      // Normal completion signalled by the presence of the done file.
      // Kill the child if it's still running
      if (!childExited) {
        try {
          child.kill('SIGTERM');
        } catch (_) {}
        await new Promise(resolve => setTimeout(resolve, 500));
        if (!childExited) {
          try { child.kill('SIGKILL'); } catch (_) {}
        }
      }
      // Wait for exit if not already exited
      if (!childExited) {
        await childExitPromise;
      }
      
      // Clear terminal for next interaction
      process.stdout.write('\x1Bc');
      
      console.log(`✓ Plan completed: ${planName}`);
      continue; // proceed to next plan
    }

    // If we reach here the child exited or errored without creating the done file.
    if (result && result.err) {
      console.error(`✗ Agent process error for ${planName}:`, result.err && result.err.message ? result.err.message : result.err);
    } else if (result && typeof result.code !== 'undefined') {
      console.error(`✗ Agent exited (code=${result.code}, signal=${result.signal}) without completing plan: ${planName}`);
    } else {
      console.error(`✗ Agent terminated without creating completion file for: ${planName}`);
    }

    // Ensure child is not left running (shouldn't be necessary but safety check)
    if (!childExited) {
      try { child.kill('SIGTERM'); } catch (_) {}
      await new Promise(resolve => setTimeout(resolve, 500));
      if (!childExited) {
        try { child.kill('SIGKILL'); } catch (_) {}
      }
      // Wait for exit
      await childExitPromise;
    }
    // Continue to the next plan rather than throwing, honoring the "kill and continue" behaviour.
    console.log(`→ Continuing to next plan...`);
  }
}

module.exports = { 
  runPlansSequential, 
  runCodexCommand, 
  waitForCompletionFile, 
  spawnAgentWithDoneFile,
  validateAgentAvailability, 
  makeGitHubCommand, 
  runGitHubAgent 
};
