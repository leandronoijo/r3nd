const path = require('path');
const YAML = require('yaml');

const { resolveTemplate, createGitHubFileReader } = require('../templateResolver');
const { writeWithOverwritePrompt, fileExists } = require('../fs/seedCopier');
const { ensureDir } = require('../fs/fileWriter');
const { rewriteSpecDirBuffer, rewriteSpecDirContent } = require('../utils/specDirRewrite');
const logger = require('../utils/logger');

const OVERLAY_SPEC_SUBDIR_DESTINATIONS = {
  agents: 'agents',
  skills: 'skills',
  templates: 'templates',
  build_plans: 'build_plans'
};

function listRemoteFiles(tree, prefix) {
  const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
  return tree.filter(item => item.type === 'blob' && item.path.startsWith(normalizedPrefix));
}

function createSpecDirAliases(remotePath, seedSpecDirName, specDirName) {
  if (!remotePath.startsWith(`${seedSpecDirName}/`)) {
    return [remotePath];
  }

  const relativePath = remotePath.substring(seedSpecDirName.length + 1);
  return Array.from(new Set([
    remotePath,
    `${specDirName}/${relativePath}`,
    `rnd/${relativePath}`,
    `r3nd/${relativePath}`
  ]));
}

function getOverlayDestinationForPath(remotePath, overlayName, specDirName) {
  const overlayRoot = `overlays/${overlayName}/`;
  if (!remotePath.startsWith(overlayRoot)) {
    return null;
  }

  const relativePath = remotePath.slice(overlayRoot.length);
  const segments = relativePath.split('/');
  const topLevelDir = segments[0];
  const nestedPath = segments.slice(1).join('/');

  if (!nestedPath) {
    return null;
  }

  if (OVERLAY_SPEC_SUBDIR_DESTINATIONS[topLevelDir]) {
    return path.join(specDirName, OVERLAY_SPEC_SUBDIR_DESTINATIONS[topLevelDir], nestedPath);
  }

  if (topLevelDir === 'instructions') {
    if (!nestedPath.endsWith('.md')) {
      return null;
    }
    return nestedPath;
  }

  return null;
}

function createOverlayAliases(remotePath, overlayName, specDirName) {
  const destination = getOverlayDestinationForPath(remotePath, overlayName, specDirName);
  if (!destination) {
    return [remotePath];
  }

  const aliases = new Set([remotePath, destination]);
  const normalized = destination.split(path.sep).join('/');

  if (normalized.startsWith(`${specDirName}/`)) {
    const relativePath = normalized.substring(specDirName.length + 1);
    aliases.add(`rnd/${relativePath}`);
    aliases.add(`r3nd/${relativePath}`);
  }

  return Array.from(aliases);
}

async function fetchSeedSpecDirName(githubClient) {
  try {
    const configBuffer = await githubClient.fetchRaw('r3nd.yaml');
    const configContent = configBuffer.toString('utf-8');
    const seedConfig = YAML.parse(configContent) || {};
    return seedConfig['spec-dir-name'] || 'rnd';
  } catch (err) {
    logger.debug('No r3nd.yaml in seed repo, using default "rnd"');
    return 'rnd';
  }
}

function discoverAvailableOverlays(tree) {
  const overlays = new Set();

  for (const item of tree || []) {
    if (item.type !== 'blob' || !item.path.startsWith('overlays/')) {
      continue;
    }

    const [, overlayName] = item.path.split('/');
    if (overlayName) {
      overlays.add(overlayName);
    }
  }

  return Array.from(overlays).sort();
}

async function buildBaseTemplateCache(tree, githubClient, specDirName, seedSpecDirName) {
  const fileCache = new Map();
  const seedFiles = listRemoteFiles(tree, `${seedSpecDirName}/`);

  for (const file of seedFiles) {
    try {
      const buffer = await githubClient.fetchRaw(file.path);
      for (const aliasPath of createSpecDirAliases(file.path, seedSpecDirName, specDirName)) {
        fileCache.set(aliasPath, buffer);
      }
    } catch (err) {
      logger.error(`  Failed to cache ${file.path}:`, err && err.message ? err.message : err);
    }
  }

  return fileCache;
}

async function buildOverlayBuffers(tree, githubClient, overlayName) {
  const overlayFiles = listRemoteFiles(tree, `overlays/${overlayName}/`);
  const buffers = new Map();

  for (const file of overlayFiles) {
    try {
      buffers.set(file.path, await githubClient.fetchRaw(file.path));
    } catch (err) {
      logger.error(`  Failed to fetch ${file.path}:`, err && err.message ? err.message : err);
    }
  }

  return { overlayFiles, buffers };
}

async function applyOverlay(cwd, tree, githubClient, specDirName, seedSpecDirName, overlayName, baseTemplateCache, { nonInteractive = false, overwriteExisting = true } = {}) {
  logger.info(`\n📦 Applying overlay: ${overlayName}`);

  const { overlayFiles, buffers } = await buildOverlayBuffers(tree, githubClient, overlayName);
  if (overlayFiles.length === 0) {
    logger.warn(`  No files found for overlay "${overlayName}".`);
    return;
  }

  const templateCache = new Map(baseTemplateCache);
  for (const file of overlayFiles) {
    const buffer = buffers.get(file.path);
    if (!buffer) {
      continue;
    }
    for (const alias of createOverlayAliases(file.path, overlayName, specDirName)) {
      templateCache.set(alias, buffer);
    }
  }

  const fileReader = createGitHubFileReader(templateCache);

  for (const file of overlayFiles) {
    const destPath = getOverlayDestinationForPath(file.path, overlayName, specDirName);

    if (!destPath) {
      logger.warn(`  Skipped unsupported overlay file: ${file.path}`);
      continue;
    }

    const buffer = buffers.get(file.path);
    if (!buffer) {
      continue;
    }

    try {
      const templateContent = buffer.toString('utf-8');
      const resolvedContent = await resolveTemplate(templateContent, fileReader);
      const rewritten = rewriteSpecDirContent(resolvedContent, ['rnd', 'r3nd', seedSpecDirName], specDirName);
      const written = await writeWithOverwritePrompt(
        cwd,
        destPath,
        Buffer.from(rewritten.content, 'utf-8'),
        { nonInteractive, overwriteExisting }
      );

      if (written) {
        logger.info(`  Copied: ${file.path} -> ${destPath}`);
      }
    } catch (err) {
      logger.error(`  Failed to copy ${file.path}:`, err && err.message ? err.message : err);
    }
  }
}

async function applySelectedOverlays(cwd, tree, githubClient, specDirName, seedSpecDirName, overlays, options = {}) {
  const selectedOverlays = Array.isArray(overlays) ? overlays.filter(Boolean) : [];
  if (selectedOverlays.length === 0) {
    logger.info('\n📦 No overlays selected.');
    return;
  }

  const baseTemplateCache = await buildBaseTemplateCache(tree, githubClient, specDirName, seedSpecDirName);
  for (const overlayName of selectedOverlays) {
    await applyOverlay(cwd, tree, githubClient, specDirName, seedSpecDirName, overlayName, baseTemplateCache, options);
  }
}

async function ensureMandatorySeedFiles(cwd, githubClient, specDirName, seedSpecDirName, files, { nonInteractive = false } = {}) {
  const missing = [];

  for (const remotePath of files) {
    const rel = remotePath.startsWith(`${seedSpecDirName}/`)
      ? path.join(specDirName, remotePath.slice(seedSpecDirName.length + 1))
      : remotePath;
    const exists = await fileExists(path.join(cwd, rel));
    if (!exists) {
      missing.push({ remotePath, rel });
    }
  }

  if (missing.length === 0) return;

  logger.info(`\n📋 Fetching ${missing.length} mandatory file(s) from GitHub...`);

  for (const item of missing) {
    try {
      const buffer = await githubClient.fetchRaw(item.remotePath);
      const rewritten = rewriteSpecDirBuffer(buffer, item.rel, ['rnd', 'r3nd', seedSpecDirName], specDirName);
      const written = await writeWithOverwritePrompt(cwd, item.rel, rewritten.buffer, { nonInteractive });
      if (written) {
        logger.info(`  Copied: ${item.remotePath} -> ${item.rel}`);
      }
    } catch (err) {
      logger.error(`  Failed to copy ${item.remotePath}:`, err && err.message ? err.message : err);
    }
  }
}

async function ensureSpecDirectories(cwd, specDirName, { createRndInstructions = false } = {}) {
  const specDirs = [
    `${specDirName}/agents`,
    `${specDirName}/build_plans`,
    `${specDirName}/product_specs`,
    `${specDirName}/tech_specs`,
    `${specDirName}/instructions`,
    `${specDirName}/skills`,
    `${specDirName}/templates`,
    `${specDirName}/agent_runs`,
    `${specDirName}/agent_summaries`
  ];

  for (const r of specDirs) {
    await ensureDir(path.join(cwd, r));
    logger.info(`Ensured directory: ${r}`);
  }

  if (createRndInstructions) {
    await ensureDir(path.join(cwd, 'rnd', 'instructions'));
    logger.info('Ensured directory: rnd/instructions');
  }
}

module.exports = {
  fetchSeedSpecDirName,
  discoverAvailableOverlays,
  applySelectedOverlays,
  ensureMandatorySeedFiles,
  ensureSpecDirectories,
  getOverlayDestinationForPath
};
