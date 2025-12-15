const fs = require('fs').promises;
const path = require('path');

async function ensureDir(filePath) {
  await fs.mkdir(filePath, { recursive: true });
}

async function writeBuffer(destRoot, relativePath, buffer, { overwrite = true } = {}) {
  const destPath = path.join(destRoot, relativePath);
  const destDir = path.dirname(destPath);
  await ensureDir(destDir);
  const flags = overwrite ? 'w' : 'wx';
  await fs.writeFile(destPath, buffer, { flag: flags });
}

module.exports = { writeBuffer, ensureDir };
