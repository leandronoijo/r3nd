const child_process = require('child_process');
const path = require('path');
const fs = require('fs').promises;

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

async function runCodexCommand(cmd, cwd) {
  return new Promise((resolve, reject) => {
    const child = child_process.spawn('sh', ['-lc', cmd], { stdio: 'inherit', cwd });
    child.on('error', err => reject(err));
    child.on('exit', code => resolve(code));
  });
}

async function runPlansSequential(plans, { cwd = process.cwd(), makePrompt, makeCommand, timeoutMs = 3600000 } = {}) {
  for (const planPath of plans) {
    const prompt = await makePrompt(planPath);
    const cmd = makeCommand(prompt);
    // Start agent process and wait for completion file
    const planName = path.basename(planPath, '.md');
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

module.exports = { runPlansSequential, runCodexCommand, waitForCompletionFile };
