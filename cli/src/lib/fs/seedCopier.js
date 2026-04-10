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

async function buildAgentFileCache(tree, githubClient, specDirName, seedSpecDirName) {
  const fileCache = new Map();
  const seedAgentsPath = `${seedSpecDirName}/agents/`;
  const personaFiles = tree.filter(item =>
    item.type === 'blob' && item.path.startsWith(seedAgentsPath) && item.path.endsWith('.md')
  );

  for (const file of personaFiles) {
    try {
      const buffer = await githubClient.fetchRaw(file.path);
      fileCache.set(file.path, buffer);

      const relativePath = file.path.substring(seedAgentsPath.length);
      const localPath = `${specDirName}/agents/${relativePath}`;
      fileCache.set(localPath, buffer);
    } catch (err) {
      logger.error(`  Failed to cache ${file.path}:`, err && err.message ? err.message : err);
    }
  }

  return fileCache;
}

/**
 * Check if a file exists at the given path
 * @param {string} filePath - Absolute path to check
 * @returns {Promise<boolean>} True if file exists
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Write a buffer to a file, prompting user if file exists and overwrite is needed
 * @param {string} cwd - Current working directory
 * @param {string} relativePath - Relative path for the file
 * @param {Buffer} buffer - Content to write
 * @param {Object} options - Options
 * @param {boolean} options.nonInteractive - If true, skip files that exist
 * @returns {Promise<boolean>} True if file was written, false if skipped
 */
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

/**
 * Copy platform-agnostic agent persona files from seed repo
 * @param {string} cwd - Current working directory
 * @param {Array} tree - GitHub tree
 * @param {Object} githubClient - GitHub client instance
 * @param {string} specDirName - Target spec directory name (e.g., 'r3nd', 'rnd')
 * @param {string} seedSpecDirName - Seed repo's spec directory name (e.g., 'r3nd', 'rnd')
 * @param {Object} options - Options
 * @param {boolean} options.nonInteractive - If true, skip files that exist
 */
async function copyAgentPersonas(cwd, tree, githubClient, specDirName, seedSpecDirName, { nonInteractive = false, overwriteExisting = false } = {}) {
  logger.info('\n🤖 Copying agent personas...');
  
  // Read from seed repo's configured spec directory
  const seedAgentsPath = `${seedSpecDirName}/agents/`;
  const agentFiles = tree.filter(item => 
    item.type === 'blob' && item.path.startsWith(seedAgentsPath) && item.path.endsWith('.md')
  );

  if (agentFiles.length === 0) {
    logger.warn('No agent persona files found in seed repo.');
    return;
  }

  for (const file of agentFiles) {
    try {
      const buffer = await githubClient.fetchRaw(file.path);
      // Map from seed repo path to local path
      const relativePath = file.path.substring(seedAgentsPath.length);
      const localPath = `${specDirName}/agents/${relativePath}`;

      // Rewrite any spec-dir references from the seed repo to the local spec dir
      const rewritten = rewriteSpecDirBuffer(buffer, file.path, [seedSpecDirName], specDirName);
      const written = await writeWithOverwritePrompt(cwd, localPath, rewritten.buffer, { nonInteractive, overwriteExisting });
      if (written) {
        logger.info(`  Copied: ${localPath}`);
      }
    } catch (err) {
      logger.error(`  Failed to copy ${file.path}:`, err && err.message ? err.message : err);
    }
  }
}

/**
 * Copy GitHub workflow files
 * @param {string} cwd - Current working directory
 * @param {Array} tree - GitHub tree
 * @param {Object} githubClient - GitHub client instance
 * @param {string} specDirName - Spec directory name for local references
 * @param {string} seedSpecDirName - Seed repo's spec directory name
 * @param {Object} options - Options
 * @param {boolean} options.nonInteractive - If true, skip files that exist
 */
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
      // Rewrite spec directory references
      const rewritten = rewriteSpecDirBuffer(buffer, file.path, ['rnd', 'r3nd'], specDirName);
      const written = await writeWithOverwritePrompt(cwd, file.path, rewritten.buffer, { nonInteractive, overwriteExisting });
      if (written) {
        logger.info(`  Copied: ${file.path}`);
      }
    } catch (err) {
      logger.error(`  Failed to copy ${file.path}:`, err && err.message ? err.message : err);
    }
  }
}

/**
 * Compose platform files from platform-specific wrappers and shared task content from seed repo
 * @param {string} cwd - Current working directory
 * @param {Array} tree - GitHub tree
 * @param {Object} githubClient - GitHub client instance
 * @param {string} wrapperDir - Directory containing wrapper templates (e.g., '.github/skills')
 * @param {string} extension - File extension to filter (e.g., 'SKILL.md')
 * @param {string} specDirName - Spec directory name for local references (e.g., 'r3nd', 'rnd')
 * @param {string} seedSpecDirName - Seed repo's spec directory name (e.g., 'r3nd', 'rnd')
 * @param {Object} options - Options
 * @param {boolean} options.nonInteractive - If true, skip files that exist
 */
async function composeAgentFiles(cwd, tree, githubClient, wrapperDir, extension, specDirName, seedSpecDirName, { nonInteractive = false, overwriteExisting = false } = {}) {
  const platformName = wrapperDir === '.github/skills' ? 'GitHub Copilot' : 
                       wrapperDir === '.cursor/commands' ? 'Cursor' :
                       wrapperDir === '.codex/skills' ? 'Codex' :
                       wrapperDir === '.claude/commands' ? 'Claude' : 'Unknown';
  logger.info(`\n📝 Composing ${platformName} platform files...`);
  
  // Find all wrapper template files
  const wrapperFiles = tree.filter(item => 
    item.type === 'blob' && 
    item.path.startsWith(wrapperDir + '/') && 
    item.path.endsWith(extension)
  );

  if (wrapperFiles.length === 0) {
    logger.warn(`  No wrapper templates found in ${wrapperDir}`);
    return;
  }

  // Build a cache of all files from tree for template resolution
  const fileCache = new Map();
  
  // Fetch all agent files from seed repo's configured spec directory
  const seedAgentsPath = `${seedSpecDirName}/agents/`;
  const personaFiles = tree.filter(item => 
    item.type === 'blob' && item.path.startsWith(seedAgentsPath)
  );
  
  for (const file of personaFiles) {
    try {
      const buffer = await githubClient.fetchRaw(file.path);
      
      // Store in cache with both seed repo path and local path for resolution flexibility
      fileCache.set(file.path, buffer);
      
      // Also map to local path so templates can reference either rnd/agents or specDirName/agents
      const relativePath = file.path.substring(seedAgentsPath.length);
      const localPath = `${specDirName}/agents/${relativePath}`;
      fileCache.set(localPath, buffer);
    } catch (err) {
      logger.error(`  Failed to cache ${file.path}:`, err && err.message ? err.message : err);
    }
  }
  
  const fileReader = createGitHubFileReader(fileCache);
  
  // Ensure output directory exists
  await ensureDir(path.join(cwd, wrapperDir));

  // Process each wrapper template
  for (const file of wrapperFiles) {
    try {
      const wrapperBuffer = await githubClient.fetchRaw(file.path);
      const wrapperContent = wrapperBuffer.toString('utf-8');
      
      // Resolve template placeholders
      const composedContent = await resolveTemplate(wrapperContent, fileReader);
      const rewritten = rewriteSpecDirContent(composedContent, [seedSpecDirName], specDirName);

      // Replace spec directory references from seed repo to local spec directory
      // This handles cases where the seed repo uses a different spec-dir-name (e.g., 'rnd')
      // and the local repo uses a different one (e.g., 'r3nd')
      let finalContent = rewritten.content;
      if (seedSpecDirName !== specDirName) {
        // Replace patterns like "rnd/agents/", "rnd/product_specs/", "rnd/tech_specs/", "rnd/build_plans/"
        const specDirPattern = new RegExp(`\\b${seedSpecDirName}/`, 'g');
        finalContent = finalContent.replace(specDirPattern, `${specDirName}/`);
      }
      
      // Write composed file with overwrite prompt
      const written = await writeWithOverwritePrompt(cwd, file.path, Buffer.from(finalContent, 'utf-8'), { nonInteractive, overwriteExisting });
      if (written) {
        logger.info(`  Composed: ${file.path}`);
      }
    } catch (err) {
      logger.error(`  Failed to compose ${file.path}:`, err && err.message ? err.message : err);
    }
  }
}

async function syncPlatformAsset(cwd, tree, githubClient, asset, specDirName, seedSpecDirName, { nonInteractive = false, overwriteExisting = false } = {}) {
  const platformName = asset.label || asset.sourcePath;
  logger.info(`\n📝 ${overwriteExisting ? 'Updating' : 'Composing'} ${platformName}...`);

  const platformFiles = tree.filter(item => matchesPlatformFile(item, asset.sourcePath, asset.fileExtension));
  if (platformFiles.length === 0) {
    logger.warn(`  No files found in ${asset.sourcePath}`);
    return;
  }

  await ensureDir(path.join(cwd, asset.sourcePath));

  if (!asset.compose) {
    for (const file of platformFiles) {
      try {
        const buffer = await githubClient.fetchRaw(file.path);
        const rewritten = rewriteSpecDirBuffer(buffer, file.path, ['rnd', 'r3nd', seedSpecDirName], specDirName);
        const written = await writeWithOverwritePrompt(cwd, file.path, rewritten.buffer, { nonInteractive, overwriteExisting });
        if (written) {
          logger.info(`  ${overwriteExisting ? 'Updated' : 'Copied'}: ${file.path}`);
        }
      } catch (err) {
        logger.error(`  Failed to sync ${file.path}:`, err && err.message ? err.message : err);
      }
    }
    return;
  }

  const fileCache = await buildAgentFileCache(tree, githubClient, specDirName, seedSpecDirName);
  const fileReader = createGitHubFileReader(fileCache);

  for (const file of platformFiles) {
    try {
      const wrapperBuffer = await githubClient.fetchRaw(file.path);
      const wrapperContent = wrapperBuffer.toString('utf-8');
      const composedContent = await resolveTemplate(wrapperContent, fileReader);
      const rewritten = rewriteSpecDirContent(composedContent, ['rnd', 'r3nd', seedSpecDirName], specDirName);
      const written = await writeWithOverwritePrompt(
        cwd,
        file.path,
        Buffer.from(rewritten.content, 'utf-8'),
        { nonInteractive, overwriteExisting }
      );
      if (written) {
        logger.info(`  ${overwriteExisting ? 'Updated' : 'Composed'}: ${file.path}`);
      }
    } catch (err) {
      logger.error(`  Failed to sync ${file.path}:`, err && err.message ? err.message : err);
    }
  }
}

/**
 * Copy template files
 * @param {string} cwd - Current working directory
 * @param {Array} tree - GitHub tree
 * @param {Object} githubClient - GitHub client instance
 * @param {string} specDirName - Spec directory name for local references
 * @param {string} seedSpecDirName - Seed repo's spec directory name
 * @param {Object} options - Options
 * @param {boolean} options.nonInteractive - If true, skip files that exist
 */
async function copyTemplates(cwd, tree, githubClient, specDirName, seedSpecDirName, { nonInteractive = false, overwriteExisting = false } = {}) {
  logger.info('\n📋 Copying templates...');
  
  const seedTemplatesPath = `${seedSpecDirName}/templates/`;
  const templateFiles = tree.filter(item => 
    item.type === 'blob' && item.path.startsWith(seedTemplatesPath)
  );

  if (templateFiles.length === 0) {
    logger.info('  No template files found.');
    return;
  }

  for (const file of templateFiles) {
    try {
      const buffer = await githubClient.fetchRaw(file.path);
      // Map from seed repo path to local path
      const relativePath = file.path.substring(seedTemplatesPath.length);
      const localPath = `${specDirName}/templates/${relativePath}`;
      
      const rewritten = rewriteSpecDirBuffer(buffer, file.path, [seedSpecDirName], specDirName);
      const written = await writeWithOverwritePrompt(cwd, localPath, rewritten.buffer, { nonInteractive, overwriteExisting });
      if (written) {
        logger.info(`  Copied: ${localPath}`);
      }
    } catch (err) {
      logger.error(`  Failed to copy ${file.path}:`, err && err.message ? err.message : err);
    }
  }
}

/**
 * Copy common files that are always needed
 * @param {string} cwd - Current working directory
 * @param {Array} tree - GitHub tree
 * @param {Object} githubClient - GitHub client instance
 * @param {string} specDirName - Spec directory name for local references
 * @param {Object} options - Options
 * @param {boolean} options.nonInteractive - If true, skip files that exist
 */
async function copyCommonFiles(cwd, tree, githubClient, specDirName, { nonInteractive = false } = {}) {
  const commonFiles = [
    '.gitignore',
  ];

  for (const remotePath of commonFiles) {
    const exists = tree.some(item => item.path === remotePath && item.type === 'blob');
    if (exists) {
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
}

/**
 * Copy testing instruction files from seed repo to spec-dir/instructions
 * @param {string} cwd - Current working directory
 * @param {Array} tree - GitHub tree
 * @param {Object} githubClient - GitHub client instance
 * @param {string} specDirName - Spec directory name for local references
 * @param {string} seedSpecDirName - Seed repo's spec directory name
 * @param {Object} options - Options
 * @param {boolean} options.nonInteractive - If true, skip files that exist
 */
async function copyTestingInstructions(cwd, tree, githubClient, specDirName, seedSpecDirName, { nonInteractive = false, overwriteExisting = false } = {}) {
  logger.info('\n📋 Copying testing instructions to spec directory...');
  
  const testingFiles = [
    `${seedSpecDirName}/instructions/e2e-testing.instructions.md`,
    `${seedSpecDirName}/instructions/testing.instructions.md`,
  ];

  for (const remotePath of testingFiles) {
    const exists = tree.some(item => item.path === remotePath && item.type === 'blob');
    if (exists) {
      try {
        const buffer = await githubClient.fetchRaw(remotePath);
        const rewritten = rewriteSpecDirBuffer(buffer, remotePath, ['rnd', 'r3nd', seedSpecDirName], specDirName);
        
        // Map to spec directory
        const fileName = path.basename(remotePath);
        const localPath = path.join(specDirName, 'instructions', fileName);
        
        const written = await writeWithOverwritePrompt(cwd, localPath, rewritten.buffer, { nonInteractive, overwriteExisting });
        if (written) {
          logger.info(`  Copied: ${remotePath} -> ${localPath}`);
        }
      } catch (err) {
        logger.error(`  Failed to copy ${remotePath}:`, err && err.message ? err.message : err);
      }
    }
  }
}

/**
 * Copy instructions from spec-dir/instructions to rnd/instructions
 * This keeps a standard, tool-agnostic instruction location.
 * @param {string} cwd - Current working directory
 * @param {string} specDirName - Spec directory name
 * @param {Object} options - Options
 * @param {boolean} options.nonInteractive - If true, skip files that exist
 */
async function copyInstructionsToRnd(cwd, specDirName, { nonInteractive = false, overwriteExisting = false } = {}) {
  logger.info('\n📋 Copying instructions to rnd/instructions...');
  
  const instructionsDir = path.join(cwd, specDirName, 'instructions');
  const targetDir = path.join(cwd, 'rnd', 'instructions');

  // When specDirName is already "rnd", source and destination are identical.
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
  const instructionFiles = files.filter(f => f.endsWith('.instructions.md') || f.endsWith('.md'));
  
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
  copyGitHubWorkflows,
  composeAgentFiles,
  syncPlatformAsset,
  copyTemplates,
  copyCommonFiles,
  copyTestingInstructions,
  copyInstructionsToRnd,
  writeWithOverwritePrompt,
  fileExists,
};
