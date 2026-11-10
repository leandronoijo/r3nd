const path = require('path');
const fs = require('fs').promises;

/**
 * Default ignore patterns (similar to .gitignore)
 */
const DEFAULT_IGNORE_PATTERNS = [
  'node_modules',
  'dist',
  'build',
  '.git',
  '.next',
  '.nuxt',
  'coverage',
  '.nyc_output',
  'out',
  '.cache',
  'tmp',
  'temp',
  '.venv',
  'venv',
  '__pycache__',
  '.pytest_cache',
  'target', // Rust/Java
  'bin',    // Compiled binaries
  'obj'     // .NET
];

/**
 * Check if a directory should be ignored based on ignore patterns
 * @param {string} dirName - Directory name to check
 * @param {string[]} ignorePatterns - Patterns to ignore
 * @returns {boolean} True if directory should be ignored
 */
function shouldIgnoreDir(dirName, ignorePatterns) {
  return ignorePatterns.some(pattern => {
    // Simple pattern matching - can be enhanced with glob support if needed
    if (pattern.includes('*')) {
      // Convert simple glob to regex
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return regex.test(dirName);
    }
    return dirName === pattern;
  });
}

/**
 * Recursively find all directories matching the target name
 * @param {string} rootDir - Root directory to start search from
 * @param {string} targetDirName - Name of directory to search for
 * @param {object} options - Search options
 * @param {string[]} options.ignorePatterns - Patterns to ignore (defaults to DEFAULT_IGNORE_PATTERNS)
 * @param {number} options.maxDepth - Maximum depth to search (defaults to unlimited)
 * @param {string} options._currentPath - Internal: current relative path from root
 * @param {number} options._currentDepth - Internal: current search depth
 * @returns {Promise<string[]>} Array of relative paths to matching directories
 */
async function findSpecDirectories(rootDir, targetDirName, options = {}) {
  const {
    ignorePatterns = DEFAULT_IGNORE_PATTERNS,
    maxDepth = Infinity,
    _currentPath = '',
    _currentDepth = 0
  } = options;

  // Check if we've exceeded max depth
  if (_currentDepth > maxDepth) {
    return [];
  }

  const results = [];
  const currentFullPath = path.join(rootDir, _currentPath);

  try {
    const entries = await fs.readdir(currentFullPath, { withFileTypes: true });

    for (const entry of entries) {
      // Only process directories
      if (!entry.isDirectory()) {
        continue;
      }

      const entryName = entry.name;
      const entryRelPath = _currentPath ? path.join(_currentPath, entryName) : entryName;

      // Check if this directory should be ignored
      if (shouldIgnoreDir(entryName, ignorePatterns)) {
        continue;
      }

      // If this directory matches our target name, add it to results
      if (entryName === targetDirName) {
        results.push(entryRelPath);
        // Don't descend into matching directories - we found what we're looking for
        continue;
      }

      // Recursively search this directory
      const subResults = await findSpecDirectories(rootDir, targetDirName, {
        ...options,
        _currentPath: entryRelPath,
        _currentDepth: _currentDepth + 1
      });

      results.push(...subResults);
    }
  } catch (err) {
    // If we can't read a directory (permissions, etc), skip it silently
    if (err.code !== 'EACCES' && err.code !== 'ENOENT') {
      throw err;
    }
  }

  return results;
}

/**
 * Find a single spec directory (searches for first match only)
 * Useful for backward compatibility where only one spec dir is expected
 * @param {string} rootDir - Root directory to start search from
 * @param {string} targetDirName - Name of directory to search for
 * @param {object} options - Search options (same as findSpecDirectories)
 * @returns {Promise<string|null>} Relative path to first matching directory, or null if not found
 */
async function findFirstSpecDirectory(rootDir, targetDirName, options = {}) {
  const results = await findSpecDirectories(rootDir, targetDirName, {
    ...options,
    maxDepth: options.maxDepth || 10 // Limit depth for single search
  });
  
  // Prefer root-level directory if multiple matches found
  const rootMatch = results.find(p => !p.includes(path.sep));
  return rootMatch || results[0] || null;
}

module.exports = {
  findSpecDirectories,
  findFirstSpecDirectory,
  DEFAULT_IGNORE_PATTERNS,
  shouldIgnoreDir
};
