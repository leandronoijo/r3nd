const fs = require('fs').promises;
const path = require('path');

const DEFAULT_IGNORED_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.next',
  '.turbo'
]);

function isMarkdownFile(filePath) {
  return typeof filePath === 'string' && filePath.toLowerCase().endsWith('.md');
}

function normalizeFromNames(fromNames, toName) {
  const unique = new Set();
  for (const name of fromNames || []) {
    if (!name || name === toName) continue;
    unique.add(name);
  }
  return Array.from(unique);
}

function rewriteSpecDirContent(content, fromNames, toName) {
  if (typeof content !== 'string' || !toName) {
    return { content, changed: false };
  }

  const sources = normalizeFromNames(fromNames, toName);
  if (sources.length === 0) {
    return { content, changed: false };
  }

  let updated = content;
  let changed = false;

  for (const name of sources) {
    const needle = `${name}/`;
    if (updated.includes(needle)) {
      updated = updated.split(needle).join(`${toName}/`);
      changed = true;
    }
  }

  return { content: updated, changed };
}

function rewriteSpecDirBuffer(buffer, filePath, fromNames, toName) {
  if (!isMarkdownFile(filePath)) {
    return { buffer, changed: false };
  }

  const content = buffer.toString('utf-8');
  const result = rewriteSpecDirContent(content, fromNames, toName);
  if (!result.changed) {
    return { buffer, changed: false };
  }

  return { buffer: Buffer.from(result.content, 'utf-8'), changed: true };
}

async function rewriteSpecDirInRepo(rootDir, fromNames, toName, options = {}) {
  const sources = normalizeFromNames(fromNames, toName);
  if (sources.length === 0) {
    return { scanned: 0, updated: 0 };
  }

  const ignoreDirs = new Set(options.ignoreDirs || DEFAULT_IGNORED_DIRS);
  let scanned = 0;
  let updated = 0;

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (ignoreDirs.has(entry.name)) {
          continue;
        }
        await walk(fullPath);
        continue;
      }
      if (!entry.isFile() || !isMarkdownFile(entry.name)) {
        continue;
      }

      scanned += 1;
      const content = await fs.readFile(fullPath, 'utf-8');
      const result = rewriteSpecDirContent(content, sources, toName);
      if (result.changed) {
        await fs.writeFile(fullPath, result.content, 'utf-8');
        updated += 1;
      }
    }
  }

  await walk(rootDir);
  return { scanned, updated };
}

module.exports = {
  rewriteSpecDirContent,
  rewriteSpecDirBuffer,
  rewriteSpecDirInRepo,
  isMarkdownFile
};
