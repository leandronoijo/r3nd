const axios = require('axios');
const inquirer = require('inquirer');
const prompt = inquirer.createPromptModule();
const fs = require('fs').promises;
const path = require('path');
const util = require('util');
const child_process = require('child_process');
const exec = util.promisify(child_process.exec);

const OWNER = 'leandronoijo';
const REPO = 'r3nd';
const BRANCH = 'develop';
const API_TREE_URL = `https://api.github.com/repos/${OWNER}/${REPO}/git/trees/${BRANCH}?recursive=1`;
const RAW_BASE = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/`;

async function ensureDir(filePath) {
  await fs.mkdir(filePath, { recursive: true });
}

async function writeFileFromUrl(remotePath, destRoot, destRelOverride) {
  const url = RAW_BASE + remotePath;
  const relative = destRelOverride || remotePath;
  const destPath = path.join(destRoot, relative);
  const destDir = path.dirname(destPath);
  await ensureDir(destDir);
  try {
    const resp = await axios.get(url, { responseType: 'arraybuffer' });
    await fs.writeFile(destPath, Buffer.from(resp.data));
    console.log(`Copied: ${remotePath} -> ${relative}`);
  } catch (err) {
    console.error(`Failed to fetch ${url}: ${err.message}`);
  }
}

function mapDestination(remotePath, backend, frontend) {
  // Map overlay instructions -> .github/instructions
  const backendInstrPrefix = `overlays/backend/${backend}/instructions/`;
  const frontendInstrPrefix = `overlays/frontend/${frontend}/instructions/`;
  if (remotePath.startsWith(backendInstrPrefix)) {
    return path.join('.github', 'instructions', remotePath.slice(backendInstrPrefix.length));
  }
  if (remotePath.startsWith(frontendInstrPrefix)) {
    return path.join('.github', 'instructions', remotePath.slice(frontendInstrPrefix.length));
  }

  // Map overlay build_plans -> rnd/build_plans
  const backendBuildPrefix = `overlays/backend/${backend}/build_plans/`;
  const frontendBuildPrefix = `overlays/frontend/${frontend}/build_plans/`;
  if (remotePath.startsWith(backendBuildPrefix)) {
    return path.join('rnd', 'build_plans', remotePath.slice(backendBuildPrefix.length));
  }
  if (remotePath.startsWith(frontendBuildPrefix)) {
    return path.join('rnd', 'build_plans', remotePath.slice(frontendBuildPrefix.length));
  }

  // Default: keep original path
  return null;
}

async function main() {
  console.log('r3nd — project scaffolder');

  const cwd = process.cwd();

  // Check for existing instructions to detect resume scenario
  const backendInstructionsExist = await fs.access(path.join(cwd, '.github', 'instructions', 'backend.instructions.md')).then(() => true).catch(() => false);
  const frontendInstructionsExist = await fs.access(path.join(cwd, '.github', 'instructions', 'frontend.instructions.md')).then(() => true).catch(() => false);

  let backend, frontend;

  if (backendInstructionsExist) {
    console.log('✓ Backend instructions already exist, skipping backend selection');
    // Try to detect backend type from existing files (default to nestjs if cannot detect)
    backend = 'nestjs'; // Could be enhanced to actually detect from files
  } else {
    const response = await prompt([
      {
        type: 'list',
        name: 'backend',
        message: 'Choose a backend',
        choices: [
          { name: 'NestJS + Mongo', value: 'nestjs' },
          { name: 'FastAPI + Mongo', value: 'fast-api' },
          { name: 'Ruby on Rails + Postgres', value: 'ruby-on-rails' }
        ]
      }
    ]);
    backend = response.backend;
  }

  if (frontendInstructionsExist) {
    console.log('✓ Frontend instructions already exist, skipping frontend selection');
    // Try to detect frontend type from existing files (default to vue if cannot detect)
    frontend = 'vue'; // Could be enhanced to actually detect from files
  } else {
    const response = await prompt([
      {
        type: 'list',
        name: 'frontend',
        message: 'Choose a frontend',
        choices: [
          { name: 'Vue', value: 'vue' },
          { name: 'Angular', value: 'angular' }
        ]
      }
    ]);
    frontend = response.frontend;
  }

  // Build list of path prefixes to copy
  const prefixes = [];
  
  // Always include base files if not resuming
  if (!backendInstructionsExist && !frontendInstructionsExist) {
    prefixes.push('.github/', 'rnd/', '.gitignore', 'README.md');
  }
  
  // Only include backend overlay if backend instructions don't exist
  if (!backendInstructionsExist) {
    prefixes.push(`overlays/backend/${backend}/`);
  }
  
  // Only include frontend overlay if frontend instructions don't exist
  if (!frontendInstructionsExist) {
    prefixes.push(`overlays/frontend/${frontend}/`);
  }

  // If both exist, we're in full resume mode - skip file copying
  if (backendInstructionsExist && frontendInstructionsExist) {
    console.log('✓ Resuming from existing setup, skipping file download');
  } else {
    console.log('Fetching file list from GitHub...');
    let tree;
    try {
      const res = await axios.get(API_TREE_URL, { headers: { Accept: 'application/vnd.github.v3+json' } });
      tree = res.data.tree;
    } catch (err) {
      console.error('Failed to fetch repository tree from GitHub API:', err.message);
      process.exit(1);
    }

    const toCopy = tree.filter(item => {
      if (item.type !== 'blob') return false;
      return prefixes.some(p => {
        if (p.endsWith('/')) return item.path.startsWith(p);
        return item.path === p;
      });
    }).map(item => item.path);

    if (toCopy.length === 0) {
      console.warn('No files matched the requested prefixes.');
    } else {
      console.log(`Found ${toCopy.length} files to copy. Starting download...`);

      for (const remotePath of toCopy) {
        const mapped = mapDestination(remotePath, backend, frontend);
        await writeFileFromUrl(remotePath, cwd, mapped || undefined);
      }
    }

    // Ensure rnd subdirectories exist
    const rndDirs = ['rnd/build_plans', 'rnd/product_specs', 'rnd/tech_specs'];
    for (const r of rndDirs) {
      const full = path.join(cwd, r);
      await ensureDir(full);
      console.log(`Ensured directory: ${r}`);
    }

    // Ensure .github/instructions exists when overlays included instructions
    await ensureDir(path.join(cwd, '.github', 'instructions'));
    console.log('Ensured directory: .github/instructions');

    console.log('Scaffolding complete.');
  }
  console.log('Next steps: install dependencies and adapt overlays as needed.');

  // Ask the user if they'd like an LLM agent to create a minimal new app
  const { llmChoice } = await prompt([
    {
      type: 'list',
      name: 'llmChoice',
      message: 'Would you like an LLM agent to create a minimal new app with the scaffolding build plans?',
      choices: [
        { name: 'Use local codex CLI (run now)', value: 'codex' },
        { name: 'Use GitHub coding agent (future implementation)', value: 'github' },
        { name: 'Generate a prompt to copy & paste', value: 'generate' },
        { name: "Naa (do nothing)", value: 'naa' }
      ]
    }
  ]);

  if (llmChoice === 'codex') {
    // Define the ordered plan files (separate prompts)
    const allPlans = [
      'rnd/build_plans/scaffold-backend-bootstrap-build-plan.md',
      'rnd/build_plans/scaffold-frontend-bootstrap-build-plan.md',
      'rnd/build_plans/scaffold-backend-complete-build-plan.md',
      'rnd/build_plans/scaffold-frontend-complete-build-plan.md',
      'rnd/build_plans/scaffold-infra-build-plan.md'
    ];

    // Check what already exists to determine which plans to skip
    const backendDirExists = await fs.access(path.join(cwd, 'src', 'backend')).then(() => true).catch(() => false);
    const frontendDirExists = await fs.access(path.join(cwd, 'src', 'frontend')).then(() => true).catch(() => false);
    const dockerComposeExists = await fs.access(path.join(cwd, 'docker-compose.yml')).then(() => true).catch(() => false);

    // Filter plans based on what exists
    const plans = [];
    
    if (!backendDirExists) {
      plans.push(allPlans[0]); // scaffold-backend-bootstrap
      plans.push(allPlans[2]); // scaffold-backend-complete
    } else {
      console.log('✓ Backend directory (src/backend) already exists, skipping backend scaffolding');
    }

    if (!frontendDirExists) {
      plans.push(allPlans[1]); // scaffold-frontend-bootstrap
      plans.push(allPlans[3]); // scaffold-frontend-complete
    } else {
      console.log('✓ Frontend directory (src/frontend) already exists, skipping frontend scaffolding');
    }

    if (!dockerComposeExists) {
      plans.push(allPlans[4]); // scaffold-infra
    } else {
      console.log('✓ docker-compose.yml already exists, skipping infrastructure scaffolding');
    }

    if (plans.length === 0) {
      console.log('\n✓ All scaffolding appears to be complete. Nothing to do!');
      return;
    }

    function getPlanName(planPath) {
      return path.basename(planPath, '.md');
    }

    function makePrompt(planPath) {
      const planName = getPlanName(planPath);
      const doneFile = `${planName}.done`;
      return `using the .github/agents/developer.agent.md as instructions please implement the following building plan to its completion:\n\n1. ${planPath}\n\nIMPORTANT: When you have completely finished implementing this build plan, create a file named ${doneFile} in the current directory to signal completion.`;
    }

    function makeCodexCommand(promptText) {
      return `codex --yolo '${promptText.replace(/\"/g, '\\\"')}'`;
    }

    console.log('\nLocal codex CLI commands (will be run sequentially):');
    plans.forEach((p, i) => console.log(`${i + 1}. ${p}`));

    const { runNow } = await prompt([
      { type: 'confirm', name: 'runNow', message: 'Run these commands now with the local codex CLI (one by one)?', default: false }
    ]);

    if (!runNow) {
      console.log('Okay — when ready you can run these commands locally in this order:');
      plans.forEach((p, i) => {
        console.log(`\n--- Prompt ${i + 1} ---\n`);
        console.log(makePrompt(p));
      });
      console.log('\nExecution order: plans will run sequentially (one after another).');
      return;
    }

    console.log('Running codex CLI sequentially:');

    // Helper function to wait for completion file
    async function waitForCompletion(planPath, maxWaitMs = 3600000) {
      const planName = getPlanName(planPath);
      const doneFile = path.join(cwd, `${planName}.done`);
      const checkInterval = 2000; // Check every 2 seconds
      const startTime = Date.now();

      return new Promise((resolve, reject) => {
        const checkFile = async () => {
          try {
            await fs.access(doneFile);
            console.log(`✓ Completion file found for: ${planPath}`);
            // Clean up the done file
            try {
              await fs.unlink(doneFile);
            } catch (err) {
              console.warn(`Warning: Could not delete ${doneFile}`);
            }
            resolve();
          } catch (err) {
            // File doesn't exist yet
            if (Date.now() - startTime > maxWaitMs) {
              reject(new Error(`Timeout waiting for completion file: ${doneFile}`));
            } else {
              setTimeout(checkFile, checkInterval);
            }
          }
        };
        checkFile();
      });
    }

    async function runPlan(planPath) {
      const promptText = makePrompt(planPath);
      const cmd = makeCodexCommand(promptText);
      console.log(`\nStarting codex for: ${planPath}`);
      
      const child = child_process.spawn('sh', ['-lc', cmd], { 
        stdio: 'inherit',
        cwd: cwd
      });
      
      // Wait for the completion file
      await waitForCompletion(planPath);
      
      console.log(`Killing codex process for: ${planPath}`);
      child.kill('SIGTERM');
      
      // Give it a moment to terminate gracefully
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!child.killed) {
        child.kill('SIGKILL');
      }
      
      console.log(`✓ Completed: ${planPath}\n`);
    }

    try {
      for (let i = 0; i < plans.length; i++) {
        console.log(`\n[${i + 1}/${plans.length}] Processing plan...`);
        await runPlan(plans[i]);
      }
      console.log('All codex plans completed successfully.');
    } catch (err) {
      console.error('An error occurred while running codex:', err.message);
    }

  } else if (llmChoice === 'github') {
    console.log('GitHub coding agent integration is not implemented yet.');

  } else if (llmChoice === 'generate') {
    // Produce separate prompts for each plan and output them in order
    const allPlans = [
      'rnd/build_plans/scaffold-backend-bootstrap-build-plan.md',
      'rnd/build_plans/scaffold-frontend-bootstrap-build-plan.md',
      'rnd/build_plans/scaffold-backend-complete-build-plan.md',
      'rnd/build_plans/scaffold-frontend-complete-build-plan.md',
      'rnd/build_plans/scaffold-infra-build-plan.md'
    ];

    // Check what already exists to determine which plans to skip
    const backendDirExists = await fs.access(path.join(cwd, 'src', 'backend')).then(() => true).catch(() => false);
    const frontendDirExists = await fs.access(path.join(cwd, 'src', 'frontend')).then(() => true).catch(() => false);
    const dockerComposeExists = await fs.access(path.join(cwd, 'docker-compose.yml')).then(() => true).catch(() => false);

    // Filter plans based on what exists
    const plans = [];
    
    if (!backendDirExists) {
      plans.push(allPlans[0]); // scaffold-backend-bootstrap
      plans.push(allPlans[2]); // scaffold-backend-complete
    } else {
      console.log('✓ Backend directory (src/backend) already exists, skipping backend scaffolding');
    }

    if (!frontendDirExists) {
      plans.push(allPlans[1]); // scaffold-frontend-bootstrap
      plans.push(allPlans[3]); // scaffold-frontend-complete
    } else {
      console.log('✓ Frontend directory (src/frontend) already exists, skipping frontend scaffolding');
    }

    if (!dockerComposeExists) {
      plans.push(allPlans[4]); // scaffold-infra
    } else {
      console.log('✓ docker-compose.yml already exists, skipping infrastructure scaffolding');
    }

    if (plans.length === 0) {
      console.log('\n✓ All scaffolding appears to be complete. Nothing to generate!');
      return;
    }

    function getPlanName(planPath) {
      return path.basename(planPath, '.md');
    }

    function makePrompt(planPath) {
      const planName = getPlanName(planPath);
      const doneFile = `${planName}.done`;
      return `using the .github/agents/developer.agent.md as instructions please implement the following building plan to its completion:\n\n1. ${planPath}\n\nIMPORTANT: When you have completely finished implementing this build plan, create a file named '${doneFile}' in the current directory to signal completion.`;
    }

    console.log('\n--- COPY & PASTE PROMPTS (in order) ---\n');
    let allPrompts = '';
    plans.forEach((p, i) => {
      const promptText = makePrompt(p);
      allPrompts += `--- Prompt ${i + 1}: ${p} ---\n${promptText}\n`;
      console.log(`--- Prompt ${i + 1}: ${p} ---\n`);
      console.log(promptText);
    });
    console.log('\n--- END PROMPTS ---\n');

    const { saveToFile } = await prompt([
      { type: 'confirm', name: 'saveToFile', message: 'Save these prompts to `rnd/llm_create_prompts.txt`?', default: true }
    ]);

    if (saveToFile) {
      try {
        const savePath = path.join(process.cwd(), 'rnd', 'llm_create_prompts.txt');
        await ensureDir(path.dirname(savePath));
        await fs.writeFile(savePath, allPrompts, 'utf8');
        console.log(`Saved prompts to ${savePath}`);
      } catch (err) {
        console.error('Failed to save prompts file:', err.message);
      }
    }

  } else {
    console.log('Okay — no LLM action selected.');
  }
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
