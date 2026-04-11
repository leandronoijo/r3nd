const path = require('path');
const fs = require('fs').promises;

const { writeBuffer, ensureDir } = require('./fileWriter');
const { resolveTemplate, createGitHubFileReader } = require('../templateResolver');
const { rewriteSpecDirBuffer, rewriteSpecDirContent } = require('../utils/specDirRewrite');
const { askOverwriteFile } = require('../ui/prompts');
const logger = require('../utils/logger');

function matchesPlatformFile(item, sourcePath, extension) {
  const normalizedPrefix = sourcePath.endsWith('/') ? sourcePath : `${sourcePath}/`;
  return item.type === 'blob' && item.path.startsWith(normalizedPrefix) && item.path.endsWith(extension);
}

function listRemoteFiles(tree, prefix, predicate = null) {
  const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
  return tree.filter(item =>
    item.type === 'blob' &&
    item.path.startsWith(normalizedPrefix) &&
    (!predicate || predicate(item.path))
  );
}

function createSpecDirAliases(remotePath, seedSpecDirName, specDirName) {
  if (!remotePath.startsWith(`${seedSpecDirName}/`)) {
    return [];
  }

  const relativePath = remotePath.substring(seedSpecDirName.length + 1);
  const aliases = new Set([
    `${seedSpecDirName}/${relativePath}`,
    `${specDirName}/${relativePath}`,
    `rnd/${relativePath}`,
    `r3nd/${relativePath}`
  ]);

  return Array.from(aliases);
}

async function buildSkillFileCache(tree, githubClient, specDirName, seedSpecDirName) {
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

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function writeWithOverwritePrompt(cwd, relativePath, buffer, { nonInteractive = false, overwriteExisting = false } = {}) {
  const destPath = path.join(cwd, relativePath);
  const exists = await fileExists(destPath);

  if (exists) {
    if (overwriteExisting) {
      await writeBuffer(cwd, relativePath, buffer, { overwrite: true });
      return true;
    }
    const shouldOverwrite = await askOverwriteFile(relativePath, nonInteractive);
    if (!shouldOverwrite) {
      logger.info(`  Skipped (exists): ${relativePath}`);
      return false;
    }
  }

  await writeBuffer(cwd, relativePath, buffer, { overwrite: true });
  return true;
}

async function copySpecDirectory(cwd, tree, githubClient, remoteBaseDir, localBaseDir, specDirName, seedSpecDirName, logLabel, { nonInteractive = false, overwriteExisting = false } = {}) {
  logger.info(`\n${logLabel}`);

  const files = listRemoteFiles(tree, remoteBaseDir);
  if (files.length === 0) {
    logger.warn(`No files found in ${remoteBaseDir}`);
    return;
  }

  for (const file of files) {
    try {
      const buffer = await githubClient.fetchRaw(file.path);
      const relativePath = file.path.substring(remoteBaseDir.length);
      const localPath = `${localBaseDir}${relativePath}`;
      const rewritten = rewriteSpecDirBuffer(buffer, localPath, ['rnd', 'r3nd', seedSpecDirName], specDirName);
      const written = await writeWithOverwritePrompt(cwd, localPath, rewritten.buffer, { nonInteractive, overwriteExisting });
      if (written) {
        logger.info(`  Copied: ${localPath}`);
      }
    } catch (err) {
      logger.error(`  Failed to copy ${file.path}:`, err && err.message ? err.message : err);
    }
  }
}

async function copyAgentPersonas(cwd, tree, githubClient, specDirName, seedSpecDirName, options = {}) {
  return copySpecDirectory(
    cwd,
    tree,
    githubClient,
    `${seedSpecDirName}/agents/`,
    `${specDirName}/agents/`,
    specDirName,
    seedSpecDirName,
    '🤖 Copying shared agent fragments...',
    options
  );
}

async function copyTaskSkills(cwd, tree, githubClient, specDirName, seedSpecDirName, options = {}) {
  return copySpecDirectory(
    cwd,
    tree,
    githubClient,
    `${seedSpecDirName}/skills/`,
    `${specDirName}/skills/`,
    specDirName,
    seedSpecDirName,
    '🧠 Copying canonical task skills...',
    options
  );
}

async function copyVendorSkillAddons(cwd, tree, githubClient, specDirName, seedSpecDirName, options = {}) {
  return copySpecDirectory(
    cwd,
    tree,
    githubClient,
    `${seedSpecDirName}/vendor/skills/`,
    `${specDirName}/vendor/skills/`,
    specDirName,
    seedSpecDirName,
    '🧩 Copying vendor skill add-ons...',
    options
  );
}

async function copyGitHubWorkflows(cwd, tree, githubClient, specDirName, seedSpecDirName, { nonInteractive = false, overwriteExisting = false } = {}) {
  logger.info('\n📦 Copying GitHub workflows...');

  const workflowFiles = tree.filter(item =>
    item.type === 'blob' && item.path.startsWith('.github/workflows/')
  );

  if (workflowFiles.length === 0) {
    logger.warn('No workflow files found in seed repo.');
    return;
  }

  for (const file of workflowFiles) {
    try {
      const buffer = await githubClient.fetchRaw(file.path);
      const rewritten = rewriteSpecDirBuffer(buffer, file.path, ['rnd', 'r3nd', seedSpecDirName], specDirName);
      const written = await writeWithOverwritePrompt(cwd, file.path, rewritten.buffer, { nonInteractive, overwriteExisting });
      if (written) {
        logger.info(`  Copied: ${file.path}`);
      }
    } catch (err) {
      logger.error(`  Failed to copy ${file.path}:`, err && err.message ? err.message : err);
    }
  }
}

function listCanonicalSkillFiles(tree, seedSpecDirName) {
  return listRemoteFiles(
    tree,
    `${seedSpecDirName}/skills/`,
    filePath => filePath.endsWith('/SKILL.md')
  );
}

function getTaskNameFromSkillPath(filePath, seedSpecDirName) {
  const relativePath = filePath.substring(`${seedSpecDirName}/skills/`.length);
  return relativePath.split('/')[0];
}

async function removeManagedLegacyOutput(cwd, relativePath) {
  const absolutePath = path.join(cwd, relativePath);
  try {
    await fs.unlink(absolutePath);
    logger.info(`  Removed legacy output: ${relativePath}`);
  } catch (err) {
    if (err && err.code !== 'ENOENT') {
      logger.warn(`  Failed to remove legacy output ${relativePath}: ${err.message}`);
    }
  }
}

async function generatePlatformSkillFiles(cwd, tree, githubClient, asset, specDirName, seedSpecDirName, { nonInteractive = false, overwriteExisting = false } = {}) {
  logger.info(`\n📝 ${overwriteExisting ? 'Updating' : 'Generating'} ${asset.label}...`);

  const canonicalSkillFiles = listCanonicalSkillFiles(tree, seedSpecDirName);
  if (canonicalSkillFiles.length === 0) {
    logger.warn(`  No canonical skill files found in ${seedSpecDirName}/skills`);
    return;
  }

  const vendorAddonPath = `${seedSpecDirName}/vendor/skills/${asset.vendor}.md`;
  const vendorAddonExists = tree.some(item => item.type === 'blob' && item.path === vendorAddonPath);
  if (!vendorAddonExists) {
    logger.warn(`  Vendor add-on not found: ${vendorAddonPath}`);
    return;
  }

  const fileCache = await buildSkillFileCache(tree, githubClient, specDirName, seedSpecDirName);
  const fileReader = createGitHubFileReader(fileCache);

  await ensureDir(path.join(cwd, asset.outputPath));

  for (const skillFile of canonicalSkillFiles) {
    try {
      const taskName = getTaskNameFromSkillPath(skillFile.path, seedSpecDirName);
      const canonicalBuffer = await githubClient.fetchRaw(skillFile.path);
      const template = `${canonicalBuffer.toString('utf-8').trimEnd()}\n\n{{${vendorAddonPath}}}\n`;
      const composedContent = await resolveTemplate(template, fileReader);
      const rewritten = rewriteSpecDirContent(composedContent, ['rnd', 'r3nd', seedSpecDirName], specDirName);
      const outputPath = `${asset.outputPath}/${taskName}/SKILL.md`;
      const written = await writeWithOverwritePrompt(
        cwd,
        outputPath,
        Buffer.from(rewritten.content, 'utf-8'),
        { nonInteractive, overwriteExisting }
      );
      if (written) {
        logger.info(`  ${overwriteExisting ? 'Updated' : 'Generated'}: ${outputPath}`);
      }

      if (typeof asset.legacyPathForTask === 'function') {
        await removeManagedLegacyOutput(cwd, asset.legacyPathForTask(taskName));
      }
    } catch (err) {
      logger.error(`  Failed to generate ${asset.label} skill from ${skillFile.path}:`, err && err.message ? err.message : err);
    }
  }
}

async function syncPlatformAsset(cwd, tree, githubClient, asset, specDirName, seedSpecDirName, options = {}) {
  if (!asset) {
    return;
  }

  if (asset.assetType === 'workflow') {
    const platformFiles = tree.filter(item => matchesPlatformFile(item, asset.sourcePath, asset.fileExtension));
    if (platformFiles.length === 0) {
      logger.warn(`  No files found in ${asset.sourcePath}`);
      return;
    }

    await ensureDir(path.join(cwd, asset.sourcePath));

    for (const file of platformFiles) {
      try {
        const buffer = await githubClient.fetchRaw(file.path);
        const rewritten = rewriteSpecDirBuffer(buffer, file.path, ['rnd', 'r3nd', seedSpecDirName], specDirName);
        const written = await writeWithOverwritePrompt(cwd, file.path, rewritten.buffer, options);
        if (written) {
          logger.info(`  ${options.overwriteExisting ? 'Updated' : 'Copied'}: ${file.path}`);
        }
      } catch (err) {
        logger.error(`  Failed to sync ${file.path}:`, err && err.message ? err.message : err);
      }
    }
    return;
  }

  await generatePlatformSkillFiles(cwd, tree, githubClient, asset, specDirName, seedSpecDirName, options);
}

async function copyTemplates(cwd, tree, githubClient, specDirName, seedSpecDirName, { nonInteractive = false, overwriteExisting = false } = {}) {
  logger.info('\n📋 Copying templates...');

  const seedTemplatesPath = `${seedSpecDirName}/templates/`;
  const templateFiles = listRemoteFiles(tree, seedTemplatesPath);

  if (templateFiles.length === 0) {
    logger.info('  No template files found.');
    return;
  }

  for (const file of templateFiles) {
    try {
      const buffer = await githubClient.fetchRaw(file.path);
      const relativePath = file.path.substring(seedTemplatesPath.length);
      const localPath = `${specDirName}/templates/${relativePath}`;
      const rewritten = rewriteSpecDirBuffer(buffer, localPath, ['rnd', 'r3nd', seedSpecDirName], specDirName);
      const written = await writeWithOverwritePrompt(cwd, localPath, rewritten.buffer, { nonInteractive, overwriteExisting });
      if (written) {
        logger.info(`  Copied: ${localPath}`);
      }
    } catch (err) {
      logger.error(`  Failed to copy ${file.path}:`, err && err.message ? err.message : err);
    }
  }
}

async function copyCommonFiles(cwd, tree, githubClient, specDirName, { nonInteractive = false } = {}) {
  const commonFiles = [
    '.gitignore',
  ];

  for (const remotePath of commonFiles) {
    const exists = tree.some(item => item.path === remotePath && item.type === 'blob');
    if (!exists) {
      continue;
    }

    try {
      const buffer = await githubClient.fetchRaw(remotePath);
      const rewritten = rewriteSpecDirBuffer(buffer, remotePath, ['rnd', 'r3nd'], specDirName);
      const written = await writeWithOverwritePrompt(cwd, remotePath, rewritten.buffer, { nonInteractive });
      if (written) {
        logger.info(`Copied: ${remotePath}`);
      }
    } catch (err) {
      logger.error(`Failed to copy ${remotePath}:`, err && err.message ? err.message : err);
    }
  }
}

async function copyTestingInstructions(cwd, tree, githubClient, specDirName, seedSpecDirName, { nonInteractive = false, overwriteExisting = false } = {}) {
  logger.info('\n📋 Copying testing instructions to spec directory...');

  const testingFiles = [
    `${seedSpecDirName}/instructions/e2e-testing.instructions.md`,
    `${seedSpecDirName}/instructions/testing.instructions.md`,
  ];

  for (const remotePath of testingFiles) {
    const exists = tree.some(item => item.path === remotePath && item.type === 'blob');
    if (!exists) {
      continue;
    }

    try {
      const buffer = await githubClient.fetchRaw(remotePath);
      const fileName = path.basename(remotePath);
      const localPath = path.join(specDirName, 'instructions', fileName);
      const rewritten = rewriteSpecDirBuffer(buffer, localPath, ['rnd', 'r3nd', seedSpecDirName], specDirName);
      const written = await writeWithOverwritePrompt(cwd, localPath, rewritten.buffer, { nonInteractive, overwriteExisting });
      if (written) {
        logger.info(`  Copied: ${remotePath} -> ${localPath}`);
      }
    } catch (err) {
      logger.error(`  Failed to copy ${remotePath}:`, err && err.message ? err.message : err);
    }
  }
}

async function copyInstructionsToRnd(cwd, specDirName, { nonInteractive = false, overwriteExisting = false } = {}) {
  logger.info('\n📋 Copying instructions to rnd/instructions...');

  const instructionsDir = path.join(cwd, specDirName, 'instructions');
  const targetDir = path.join(cwd, 'rnd', 'instructions');

  if (path.resolve(instructionsDir) === path.resolve(targetDir)) {
    logger.info('  Source is already rnd/instructions; skipping copy.');
    return;
  }

  try {
    await fs.access(instructionsDir);
  } catch (err) {
    logger.warn('  No instructions directory found in spec directory.');
    return;
  }

  const files = await fs.readdir(instructionsDir);
  const instructionFiles = files.filter(fileName => fileName.endsWith('.instructions.md') || fileName.endsWith('.md'));

  if (instructionFiles.length === 0) {
    logger.warn('  No instruction files found in spec directory.');
    return;
  }

  for (const fileName of instructionFiles) {
    try {
      const sourcePath = path.join(instructionsDir, fileName);
      const buffer = await fs.readFile(sourcePath);
      const destPath = path.join('rnd', 'instructions', fileName);
      const written = await writeWithOverwritePrompt(cwd, destPath, buffer, { nonInteractive, overwriteExisting });
      if (written) {
        logger.info(`  Copied: ${specDirName}/instructions/${fileName} -> ${destPath}`);
      }
    } catch (err) {
      logger.error(`  Failed to copy ${fileName}:`, err && err.message ? err.message : err);
    }
  }
}

module.exports = {
  copyAgentPersonas,
  copyTaskSkills,
  copyVendorSkillAddons,
  copyGitHubWorkflows,
  syncPlatformAsset,
  copyTemplates,
  copyCommonFiles,
  copyTestingInstructions,
  copyInstructionsToRnd,
  writeWithOverwritePrompt,
  fileExists,
};
