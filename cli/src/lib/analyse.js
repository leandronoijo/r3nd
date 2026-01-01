const path = require('path');
const fs = require('fs').promises;
const { runCodexCommand, runPlansSequential, makeGitHubCommand } = require('./llm/agentRunner');
const { writeBuffer, ensureDir } = require('./fs/fileWriter');
const { buildOverviewPrompt, buildAppPrompt, buildTargetedAppPrompt } = require('./analyse/prompts');
const { confirmRunNow } = require('./ui/prompts');
const { ConfigManager } = require('./config/configManager');
const { findFirstSpecDirectory } = require('./fs/treeSearch');
const YAML = require('yaml');

async function parseAppsFromInstructions(content) {
  // Try JSON fenced block first
  const jsonMatch = content.match(/```json\s*([\s\S]*?)```/i);
  if (jsonMatch) {
    try {
      const raw = jsonMatch[1].trim();
      const parsed = JSON.parse(raw);
      // If the JSON block is directly an array of apps
      if (Array.isArray(parsed)) return parsed.map(a => ({ name: a.name || a.app || 'unknown', path: a.path || '.', purpose: a.purpose || '', stack: a.stack || '' }));
      // If it's an object with `apps` property
      if (Array.isArray(parsed.apps)) return parsed.apps.map(a => ({ name: a.name || a.app || 'unknown', path: a.path || '.', purpose: a.purpose || '', stack: a.stack || '' }));
    } catch (e) {
      console.warn('Failed to parse JSON fenced block for apps:', e && e.message ? e.message : e);
      // fall through to other parsers
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

async function parseAppNameFromMetadata(content) {
  // Try YAML fenced block first
  const yamlMatch = content.match(/```(?:yaml|yml)\s*([\s\S]*?)```/i);
  if (yamlMatch) {
    try {
      const parsed = YAML.parse(yamlMatch[1]);
      if (parsed && parsed.name) return parsed.name;
    } catch (e) {
      // fall through to JSON
    }
  }

  // Try JSON fenced block
  const jsonMatch = content.match(/```json\s*([\s\S]*?)```/i);
  if (jsonMatch) {
    try {
      const raw = jsonMatch[1].trim();
      const parsed = JSON.parse(raw);
      if (parsed && parsed.name) return parsed.name;
    } catch (e) {
      // fall through
    }
  }

  return null;
}

async function runAnalyse({ agent = 'codex', nonInteractive = false, destRoot = process.cwd(), targetDir = null } = {}) {
  const instructionsDir = path.join(destRoot, '.github', 'instructions');
  await ensureDir(instructionsDir);

  // Get configured spec directory name
  const configManager = new ConfigManager(destRoot);
  const specDirName = await configManager.getSpecDirName();
  
  // Find spec directory
  const specDir = await findFirstSpecDirectory(destRoot, specDirName);
  if (!specDir) {
    throw new Error(`No ${specDirName} directory found in repository`);
  }

  // If targetDir is specified, run targeted app analysis
  if (targetDir) {
    return runTargetedAnalyse({ agent, nonInteractive, destRoot, targetDir, instructionsDir, specDir });
  }

  // Original full-project analysis flow
  // Phase 1: build overview prompt
  const overviewPrompt = buildOverviewPrompt(destRoot);

  // If agent is 'generate', write the prompt to a file and exit
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
    const projectPlanPath = path.join(specDir, 'build_plans', 'project-overview.md');
    function makeOverviewPlanPrompt(planPath) {
      const planName = path.basename(planPath, '.md');
      if (agent === 'github') {
        return `${overviewPrompt}\n\nIMPORTANT: Save the project-level instructions to ${path.relative(destRoot, projectInstructionsPath)}.`;
      }
      const doneFile = `${planName}.done`;
      return `${overviewPrompt}\n\nIMPORTANT: Save the project-level instructions to ${path.relative(destRoot, projectInstructionsPath)}. When you have completely finished creating this file, create a file named ${doneFile} in the current directory to signal completion.`;
    }

    function makeCmdForPrompt(promptText) {
      if (agent === 'gemini') return `gemini --yolo -i "${promptText.replace(/"/g, '\\"')}"`;
      if (agent === 'github') return makeGitHubCommand(promptText);
      return `codex --yolo '${promptText.replace(/'/g, "'\\''")}'`;
    }

    const timeoutMs = parseInt(process.env.R3ND_AGENT_TIMEOUT || '3600000', 10);
    await runPlansSequential([projectPlanPath], { cwd: destRoot, makePrompt: async (p) => makeOverviewPlanPrompt(p), makeCommand: (prompt) => makeCmdForPrompt(prompt), timeoutMs, agentType: agent });

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
    const appPlans = apps.map(a => path.join(specDir, 'build_plans', `${a.name}.md`));

    await runPlansSequential(appPlans, {
      cwd: destRoot,
      makePrompt: async (planPath) => {
        const idx = appPlans.indexOf(planPath);
        const app = apps[idx];
        const planName = path.basename(planPath, '.md');
        const prompt = buildAppPrompt(app);
        if (agent === 'github') {
          return `${prompt}\n\nIMPORTANT: Save the instructions to ${path.relative(destRoot, path.join(instructionsDir, `${app.name}.instructions.md`))}.`;
        }
        const doneFile = `${planName}.done`;
        return `${prompt}\n\nIMPORTANT: Save the instructions to ${path.relative(destRoot, path.join(instructionsDir, `${app.name}.instructions.md`))}. When you have completely finished creating this file, create a file named ${doneFile} in the current directory to signal completion.`;
      },
      makeCommand: (prompt) => makeCmdForPrompt(prompt),
      timeoutMs,
      agentType: agent
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

async function runTargetedAnalyse({ agent, nonInteractive, destRoot, targetDir, instructionsDir, specDir }) {
  // Normalize targetDir to be relative to destRoot
  const normalizedDir = path.isAbsolute(targetDir) 
    ? path.relative(destRoot, targetDir) 
    : targetDir;

  console.log(`Analysing specific directory: ${normalizedDir}`);

  const targetedPrompt = buildTargetedAppPrompt(normalizedDir);

  if (agent === 'generate') {
    // Generate a placeholder filename based on the directory
    const dirName = path.basename(normalizedDir) || 'app';
    const outputPath = path.join(instructionsDir, `${dirName}.instructions.md`);
    const content = `<!-- GENERATED PROMPT -->\n\n${targetedPrompt}\n`;
    await writeBuffer(destRoot, path.relative(destRoot, outputPath), Buffer.from(content));
    console.log(`Generated prompt written to ${outputPath}`);
    return;
  }

  if (!nonInteractive) {
    const proceed = await confirmRunNow(nonInteractive);
    if (!proceed) {
      console.log('Aborted by user');
      return;
    }
  }

  try {
    const dirName = path.basename(normalizedDir) || 'app';
    const appPlanPath = path.join(specDir, 'build_plans', `${dirName}.md`);

    function makeTargetedPlanPrompt(planPath) {
      const planName = path.basename(planPath, '.md');
      const outputPath = path.join(instructionsDir, `${dirName}.instructions.md`);
      if (agent === 'github') {
        return `${targetedPrompt}\n\nIMPORTANT: Save the instructions to ${path.relative(destRoot, outputPath)}.`;
      }
      const doneFile = `${planName}.done`;
      return `${targetedPrompt}\n\nIMPORTANT: Save the instructions to ${path.relative(destRoot, outputPath)}. When you have completely finished creating this file, create a file named ${doneFile} in the current directory to signal completion.`;
    }

    function makeCmdForPrompt(promptText) {
      if (agent === 'gemini') return `gemini --yolo -i "${promptText.replace(/"/g, '\\"')}"`;
      if (agent === 'github') return makeGitHubCommand(promptText);
      return `codex --yolo '${promptText.replace(/'/g, "'\\''")}'`;
    }

    const timeoutMs = parseInt(process.env.R3ND_AGENT_TIMEOUT || '3600000', 10);
    await runPlansSequential([appPlanPath], { 
      cwd: destRoot, 
      makePrompt: async (p) => makeTargetedPlanPrompt(p), 
      makeCommand: (prompt) => makeCmdForPrompt(prompt), 
      timeoutMs, 
      agentType: agent 
    });

    // Try to read the generated file to extract the app name
    const outputPath = path.join(instructionsDir, `${dirName}.instructions.md`);
    let fileContent = '';
    try {
      fileContent = await fs.readFile(outputPath, 'utf8');
      
      // Try to parse the app name from the metadata
      const parsedName = await parseAppNameFromMetadata(fileContent);
      if (parsedName && parsedName !== dirName) {
        // Rename the file to match the parsed app name
        const newOutputPath = path.join(instructionsDir, `${parsedName}.instructions.md`);
        await fs.rename(outputPath, newOutputPath);
        console.log(`Agent produced ${newOutputPath}`);
      } else {
        console.log(`Agent produced ${outputPath}`);
      }
    } catch (e) {
      console.warn('Agent completed but did not produce the instruction file. Writing prompt as placeholder.');
      await writeBuffer(destRoot, path.relative(destRoot, outputPath), Buffer.from(targetedPrompt), { overwrite: true });
      console.log(`Wrote placeholder instructions to ${outputPath}`);
    }
  } catch (err) {
    console.error('Agent run failed:', err && err.message ? err.message : err);
    throw err;
  }
}

module.exports = { runAnalyse, parseAppsFromInstructions, parseAppNameFromMetadata };
