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

  const { backend } = await prompt([
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

  const { frontend } = await prompt([
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

  const cwd = process.cwd();

  // Build list of path prefixes to copy
  const prefixes = [
    '.github/',
    'rnd/',
    '.gitignore',
    'README.md',
    `overlays/backend/${backend}/`,
    `overlays/frontend/${frontend}/`
  ];

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
    console.warn('No files matched the requested prefixes. Aborting.');
    process.exit(1);
  }

  console.log(`Found ${toCopy.length} files to copy. Starting download...`);

  for (const remotePath of toCopy) {
    const mapped = mapDestination(remotePath, backend, frontend);
    await writeFileFromUrl(remotePath, cwd, mapped || undefined);
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
    const plans = [
      'rnd/build_plans/scaffold-backend-bootstrap-build-plan.md',
      'rnd/build_plans/scaffold-frontend-bootstrap-build-plan.md',
      'rnd/build_plans/scaffold-backend-complete-build-plan.md',
      'rnd/build_plans/scaffold-frontend-complete-build-plan.md',
      'rnd/build_plans/scaffold-infra-build-plan.md'
    ];

    function makePrompt(planPath) {
      return `using the .github/agents/developer.agent.md as instructions please implement the following building plan to its completion:\n\n1. ${planPath}\n`;
    }

    function makeCodexCommand(promptText) {
      return `codex -a on-failure -s workspace-write sandbox_permissions="require_escalated" exec --skip-git-repo-check "${promptText.replace(/\"/g, '\\\"')}"`;
    }

    console.log('\nLocal codex CLI commands (will be run in orchestrated groups):');
    plans.forEach((p, i) => console.log(`${i + 1}. ${p}`));

    const { runNow } = await prompt([
      { type: 'confirm', name: 'runNow', message: 'Run these commands now with the local codex CLI (orchestrated)?', default: false }
    ]);

    if (!runNow) {
      console.log('Okay — when ready you can run these commands locally in this order:');
      plans.forEach((p, i) => {
        console.log(`\n--- Prompt ${i + 1} (${p}) ---\n`);
        console.log(makePrompt(p));
      });
      console.log('\nOrchestrated execution order: run 1 & 2 in parallel, then 3 & 4 in parallel, then 5.');
      return;
    }

    console.log('Running codex CLI in orchestrated groups:');

    // Groups: [1,2], [3,4], [5]
    const groups = [[0, 1], [2, 3], [4]];

    async function runGroup(group) {
      // Start all commands in the group in parallel
      const proms = group.map(idx => {
        const p = plans[idx];
        const promptText = makePrompt(p);
        const cmd = makeCodexCommand(promptText);
        console.log(`\nStarting codex for: ${p}`);
        const child = child_process.spawn('sh', ['-lc', cmd], { stdio: 'inherit' });
        return new Promise((resolve, reject) => {
          child.on('close', code => {
            if (code === 0) {
              console.log(`codex finished: ${p}`);
              resolve();
            } else {
              reject(new Error(`codex exited with code ${code} for ${p}`));
            }
          });
          child.on('error', err => reject(err));
        });
      });
      // Wait for all to finish
      await Promise.all(proms);
    }

    try {
      for (const g of groups) {
        await runGroup(g);
      }
      console.log('All codex groups completed successfully.');
    } catch (err) {
      console.error('An error occurred while running codex groups:', err.message);
    }

  } else if (llmChoice === 'github') {
    console.log('GitHub coding agent integration is not implemented yet.');

  } else if (llmChoice === 'generate') {
    // Produce separate prompts for each plan and output them in order
    const plans = [
      'rnd/build_plans/scaffold-backend-bootstrap-build-plan.md',
      'rnd/build_plans/scaffold-frontend-bootstrap-build-plan.md',
      'rnd/build_plans/scaffold-backend-complete-build-plan.md',
      'rnd/build_plans/scaffold-frontend-complete-build-plan.md',
      'rnd/build_plans/scaffold-infra-build-plan.md'
    ];

    function makePrompt(planPath) {
      return `using the .github/agents/developer.agent.md as instructions please implement the following building plan to its completion:\n\n1. ${planPath}\n`;
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
