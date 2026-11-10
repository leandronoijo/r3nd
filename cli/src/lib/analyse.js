const path = require('path');
const fs = require('fs').promises;
const { runPlansSequential, makeGitHubCommand } = require('./llm/agentRunner');
const { confirmRunNow, askSelectApps } = require('./ui/prompts');
const { ConfigManager } = require('./config/configManager');
const { findFirstSpecDirectory } = require('./fs/treeSearch');
const YAML = require('yaml');

const YAML_FENCED_BLOCK_REGEX = /```(?:yaml|yml)\s*([\s\S]*?)```/i;
const JSON_FENCED_BLOCK_REGEX = /```json\s*([\s\S]*?)```/i;

const AGENTS_MD = 'AGENTS.md';
const CLAUDE_MD = 'CLAUDE.md';

function normalizeAppEntry(appEntry = {}) {
  return {
    name: appEntry.name || appEntry.app || 'unknown',
    path: appEntry.path || appEntry.applyTo || '.',
    applyTo: appEntry.applyTo || appEntry.path || '.',
    purpose: appEntry.purpose || '',
    stack: appEntry.stack || ''
  };
}

async function parseAppsFromInstructions(content) {
  const yamlMatch = content.match(YAML_FENCED_BLOCK_REGEX);
  if (yamlMatch) {
    try {
      const parsed = YAML.parse(yamlMatch[1]);
      if (parsed && Array.isArray(parsed.apps)) {
        return parsed.apps.map(normalizeAppEntry);
      }
    } catch (err) {
      console.warn('Failed to parse YAML fenced block for apps:', err && err.message ? err.message : err);
    }
  }

  const jsonMatch = content.match(JSON_FENCED_BLOCK_REGEX);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1].trim());
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeAppEntry);
      }
      if (parsed && Array.isArray(parsed.apps)) {
        return parsed.apps.map(normalizeAppEntry);
      }
    } catch (err) {
      console.warn('Failed to parse JSON fenced block for apps:', err && err.message ? err.message : err);
    }
  }

  return [];
}

function escapeSingleQuotes(value) {
  return value.replace(/'/g, "'\\''");
}

function escapeDoubleQuotes(value) {
  return value.replace(/"/g, '\\"');
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function detectRequiredAnalysisFiles(repoRoot) {
  const hasClaudeVendor = await exists(path.join(repoRoot, '.claude'));
  const hasAgentsVendor =
    await exists(path.join(repoRoot, '.codex')) ||
    await exists(path.join(repoRoot, '.cursor')) ||
    await exists(path.join(repoRoot, '.github'));

  const requiredFiles = [];
  if (hasAgentsVendor || !hasClaudeVendor) {
    requiredFiles.push(AGENTS_MD);
  }
  if (hasClaudeVendor) {
    requiredFiles.push(CLAUDE_MD);
  }

  return {
    hasClaudeVendor,
    hasAgentsVendor,
    requiredFiles
  };
}

async function ensureRequiredScopeFiles(scopePath, requiredFiles) {
  const agentsPath = path.join(scopePath, AGENTS_MD);
  const claudePath = path.join(scopePath, CLAUDE_MD);
  const agentsExists = await exists(agentsPath);
  const claudeExists = await exists(claudePath);

  if (requiredFiles.includes(AGENTS_MD) && !agentsExists && claudeExists) {
    const source = await fs.readFile(claudePath);
    await fs.writeFile(agentsPath, source);
  }

  if (requiredFiles.includes(CLAUDE_MD) && !claudeExists && agentsExists) {
    const source = await fs.readFile(agentsPath);
    await fs.writeFile(claudePath, source);
  }

  const missing = [];
  for (const requiredFile of requiredFiles) {
    const requiredPath = path.join(scopePath, requiredFile);
    if (!(await exists(requiredPath))) {
      missing.push(requiredFile);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required analysis files in ${scopePath}: ${missing.join(', ')}. ` +
      'Ensure the analysis skill generated the expected files.'
    );
  }
}

async function readAnalysisSource(scopePath, requiredFiles) {
  const orderedCandidates = [AGENTS_MD, CLAUDE_MD, ...requiredFiles.filter(f => f !== AGENTS_MD && f !== CLAUDE_MD)];

  for (const candidate of orderedCandidates) {
    const candidatePath = path.join(scopePath, candidate);
    if (await exists(candidatePath)) {
      return fs.readFile(candidatePath, 'utf8');
    }
  }

  throw new Error(`No analysis output file found in ${scopePath}`);
}

function makeCommandForAgent(agent, promptText) {
  if (agent === 'claude') {
    return `claude --dangerously-skip-permissions \"${escapeDoubleQuotes(promptText)}\"`;
  }
  if (agent === 'gemini') {
    return `gemini --yolo -i \"${escapeDoubleQuotes(promptText)}\"`;
  }
  if (agent === 'github') {
    return makeGitHubCommand(promptText);
  }
  return `codex --yolo '${escapeSingleQuotes(promptText)}'`;
}

function buildSkillExecutionPrompt({ skillPath, scopePath, scopeKind }) {
  return [
    `Using the task skill at ${skillPath} as instructions, analyze this ${scopeKind} path:`,
    '',
    scopePath,
    '',
    'Follow the skill instructions exactly. If the path is invalid or missing, explain the issue and refuse to continue.',
    'When complete, ensure output files are saved at that scope root.'
  ].join('\n');
}

async function runScopeAnalysis({
  agent,
  destRoot,
  specDir,
  skillName,
  scopePath,
  scopeKind
}) {
  const absoluteSkillPath = path.join(destRoot, specDir, 'skills', skillName, 'SKILL.md');
  if (!(await exists(absoluteSkillPath))) {
    throw new Error(`Required skill file not found: ${absoluteSkillPath}`);
  }

  const scopeRelative = path.isAbsolute(scopePath) ? path.relative(destRoot, scopePath) : scopePath;
  const normalizedScope = scopeRelative && scopeRelative !== '' ? scopeRelative : '.';
  const prompt = buildSkillExecutionPrompt({
    skillPath: path.relative(destRoot, absoluteSkillPath),
    scopePath: normalizedScope,
    scopeKind
  });

  const pseudoPlanPath = path.join(specDir, 'build_plans', `${skillName}-${normalizedScope.replace(/[\\/]/g, '-') || 'root'}.md`);
  const timeoutMs = parseInt(process.env.R3ND_AGENT_TIMEOUT || '3600000', 10);

  await runPlansSequential([pseudoPlanPath], {
    cwd: destRoot,
    makePrompt: async () => prompt,
    makeCommand: (builtPrompt) => makeCommandForAgent(agent, builtPrompt),
    timeoutMs,
    agentType: agent
  });
}

async function runAnalyse({ agent = 'codex', nonInteractive = false, destRoot = process.cwd() } = {}) {
  const configManager = new ConfigManager(destRoot);
  const specDirName = await configManager.getSpecDirName();
  const specDir = await findFirstSpecDirectory(destRoot, specDirName);

  if (!specDir) {
    throw new Error(`No ${specDirName} directory found in repository`);
  }

  if (!nonInteractive) {
    const proceed = await confirmRunNow(nonInteractive);
    if (!proceed) {
      console.log('Aborted by user');
      return;
    }
  }

  const vendorRequirements = await detectRequiredAnalysisFiles(destRoot);

  try {
    await runScopeAnalysis({
      agent,
      destRoot,
      specDir,
      skillName: 'analyze-repo-context',
      scopePath: '.',
      scopeKind: 'repository'
    });

    await ensureRequiredScopeFiles(destRoot, vendorRequirements.requiredFiles);

    const repoContent = await readAnalysisSource(destRoot, vendorRequirements.requiredFiles);
    const apps = await parseAppsFromInstructions(repoContent);

    if (!apps || apps.length === 0) {
      console.log('No apps detected in repository analysis output. Nothing else to analyze.');
      return;
    }

    const selectedApps = await askSelectApps(apps, nonInteractive);
    if (!selectedApps || selectedApps.length === 0) {
      console.log('No apps selected for analysis.');
      return;
    }

    console.log(`Selected ${selectedApps.length} app(s) for analysis: ${selectedApps.map(app => app.name).join(', ')}`);

    for (const app of selectedApps) {
      const appScopePath = app.path || app.applyTo || '.';
      await runScopeAnalysis({
        agent,
        destRoot,
        specDir,
        skillName: 'analyze-app-context',
        scopePath: appScopePath,
        scopeKind: 'application'
      });

      const absoluteScopePath = path.resolve(destRoot, appScopePath);
      await ensureRequiredScopeFiles(absoluteScopePath, vendorRequirements.requiredFiles);
    }
  } catch (err) {
    console.error('Analyse failed:', err && err.message ? err.message : err);
    throw err;
  }
}

module.exports = {
  runAnalyse,
  parseAppsFromInstructions,
  detectRequiredAnalysisFiles,
  ensureRequiredScopeFiles
};
