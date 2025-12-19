const path = require('path');
const fs = require('fs').promises;
const { runCodexCommand, runPlansSequential } = require('./llm/agentRunner');
const { writeBuffer, ensureDir } = require('./fs/fileWriter');
const { buildOverviewPrompt, buildAppPrompt } = require('./analyse/prompts');
const { confirmRunNow } = require('./ui/prompts');
const YAML = require('yaml');

async function parseAppsFromInstructions(content) {
  // Try JSON fenced block first
  const jsonMatch = content.match(/```json\s*([\s\S]*?)```/i);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (Array.isArray(parsed.apps)) return parsed.apps;
    } catch (e) {
      // fall through
    }
  }

  // Try YAML fenced block using yaml parser
  const yamlMatch = content.match(/```(?:yaml|yml)\s*([\s\S]*?)```/i);
  if (yamlMatch) {
    try {
      const parsed = YAML.parse(yamlMatch[1]);
      if (parsed && Array.isArray(parsed.apps)) return parsed.apps.map(a => ({ name: a.name || a.app || 'unknown', path: a.path || '.', purpose: a.purpose || '', stack: a.stack || '' }));
      // If top-level is an object with app entries, try to normalize
      if (parsed && parsed.apps) {
        return parsed.apps.map(a => ({ name: a.name || a.app || 'unknown', path: a.path || '.', purpose: a.purpose || '', stack: a.stack || '' }));
      }
    } catch (e) {
      // fall through to empty
    }
  }

  return [];
}

async function runAnalyse({ agent = 'codex', nonInteractive = false, destRoot = process.cwd() } = {}) {
  // Phase 1: build overview prompt
  const overviewPrompt = buildOverviewPrompt(destRoot);

  // If agent is 'generate', write the prompt to a file and exit
  const instructionsDir = path.join(destRoot, '.github', 'instructions');
  await ensureDir(instructionsDir);
  const projectInstructionsPath = path.join(instructionsDir, 'project.instructions.md');

  if (agent === 'generate') {
    const content = `<!-- GENERATED PROMPT -->\n\n${overviewPrompt}\n`;
    await writeBuffer(destRoot, path.relative(destRoot, projectInstructionsPath), Buffer.from(content));
    console.log(`Generated prompt written to ${projectInstructionsPath}`);
    return;
  }

  // For codex/gemini/github: run the agent and require a .done file for each step
  if (!nonInteractive) {
    const proceed = await confirmRunNow(nonInteractive);
    if (!proceed) {
      console.log('Aborted by user');
      return;
    }
  }

  try {
    // Phase 1: require the agent to write project.instructions.md and create a .done file
    const projectPlanPath = 'rnd/build_plans/project-overview.md';
    function makeOverviewPlanPrompt(planPath) {
      const planName = path.basename(planPath, '.md');
      const doneFile = `${planName}.done`;
      return `${overviewPrompt}\n\nIMPORTANT: Save the project-level instructions to ${path.relative(destRoot, projectInstructionsPath)}. When you have completely finished creating this file, create a file named ${doneFile} in the current directory to signal completion.`;
    }

    function makeCmdForPrompt(promptText) {
      if (agent === 'gemini') return `gemini --yolo -i "${promptText.replace(/"/g, '\\"')}"`;
      if (agent === 'github') return `echo "GitHub agent not supported in local runner"`;
      return `codex --yolo '${promptText.replace(/'/g, "'\\''")}'`;
    }

    const timeoutMs = parseInt(process.env.R3ND_AGENT_TIMEOUT || '3600000', 10);
    await runPlansSequential([projectPlanPath], { cwd: destRoot, makePrompt: async (p) => makeOverviewPlanPrompt(p), makeCommand: (prompt) => makeCmdForPrompt(prompt), timeoutMs });

    // After agent signals completion, read project.instructions.md (or write placeholder)
    let fileContent = '';
    try {
      fileContent = await fs.readFile(projectInstructionsPath, 'utf8');
    } catch (e) {
      console.warn('Agent completed but did not produce project.instructions.md. Writing prompt as placeholder.');
      await writeBuffer(destRoot, path.relative(destRoot, projectInstructionsPath), Buffer.from(overviewPrompt), { overwrite: true });
      fileContent = overviewPrompt;
    }

    // Parse apps list
    const apps = await parseAppsFromInstructions(fileContent);
    if (!apps || apps.length === 0) {
      console.log('No apps detected in project.instructions.md. Nothing to generate.');
      return;
    }

    // Phase 2: create per-app plans and require .done files for each
    const appPlans = apps.map(a => `rnd/build_plans/${a.name}.md`);

    await runPlansSequential(appPlans, {
      cwd: destRoot,
      makePrompt: async (planPath) => {
        const idx = appPlans.indexOf(planPath);
        const app = apps[idx];
        const planName = path.basename(planPath, '.md');
        const doneFile = `${planName}.done`;
        const prompt = buildAppPrompt(app);
        return `${prompt}\n\nIMPORTANT: Save the instructions to ${path.relative(destRoot, path.join(instructionsDir, `${app.name}.instructions.md`))}. When you have completely finished creating this file, create a file named ${doneFile} in the current directory to signal completion.`;
      },
      makeCommand: (prompt) => makeCmdForPrompt(prompt),
      timeoutMs
    });

    // Ensure any missing per-app files get placeholder content
    for (const app of apps) {
      const targetPath = path.join(instructionsDir, `${app.name}.instructions.md`);
      try {
        await fs.access(targetPath);
        console.log(`Agent produced ${targetPath}`);
      } catch (_) {
        const appPrompt = buildAppPrompt(app);
        await writeBuffer(destRoot, path.relative(destRoot, targetPath), Buffer.from(appPrompt), { overwrite: true });
        console.log(`Wrote placeholder instructions to ${targetPath}`);
      }
    }
  } catch (err) {
    console.error('Agent run failed:', err && err.message ? err.message : err);
    throw err;
  }
}

module.exports = { runAnalyse, parseAppsFromInstructions };
