const path = require('path');
const fs = require('fs').promises;

/**
 * Template resolver for composing agent files from platform-agnostic personas
 * and platform-specific wrappers.
 * 
 * Supports simple {{file-path}} placeholder syntax without nesting.
 */

/**
 * Parse a template file and extract placeholder references
 * @param {string} content - Template file content
 * @returns {Array<string>} Array of file paths referenced in {{...}} placeholders
 */
function parseTemplate(content) {
  const placeholderRegex = /\{\{([^}]+)\}\}/g;
  const placeholders = [];
  let match;
  
  while ((match = placeholderRegex.exec(content)) !== null) {
    const placeholder = match[1].trim();
    placeholders.push(placeholder);
  }
  
  return placeholders;
}

/**
 * Resolve template by replacing {{file-path}} placeholders with actual file content
 * @param {string} templateContent - Template file content with {{...}} placeholders
 * @param {Function} fileReader - Async function(filePath) => string to read referenced files
 * @returns {Promise<string>} Resolved content with placeholders replaced
 */
async function resolveTemplate(templateContent, fileReader) {
  if (typeof fileReader !== 'function') {
    throw new Error('fileReader must be a function that accepts a file path and returns content');
  }
  
  const placeholders = parseTemplate(templateContent);
  
  if (placeholders.length === 0) {
    return templateContent;
  }
  
  // Build a map of placeholder => content
  const resolutions = new Map();
  
  for (const placeholder of placeholders) {
    if (!resolutions.has(placeholder)) {
      try {
        const content = await fileReader(placeholder);
        resolutions.set(placeholder, content);
      } catch (err) {
        throw new Error(`Failed to resolve placeholder {{${placeholder}}}: ${err.message}`);
      }
    }
  }
  
  // Replace all placeholders with their resolved content
  let resolved = templateContent;
  for (const [placeholder, content] of resolutions.entries()) {
    const regex = new RegExp(`\\{\\{\\s*${escapeRegExp(placeholder)}\\s*\\}\\}`, 'g');
    resolved = resolved.replace(regex, content);
  }
  
  return resolved;
}

/**
 * Create a file reader function for local filesystem
 * @param {string} basePath - Base directory path for resolving relative paths
 * @returns {Function} File reader function compatible with resolveTemplate
 */
function createLocalFileReader(basePath) {
  return async (filePath) => {
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(basePath, filePath);
    const content = await fs.readFile(absolutePath, 'utf-8');
    return content;
  };
}

/**
 * Create a file reader function for GitHub-fetched content
 * @param {Map<string, Buffer>} fileCache - Map of path => Buffer content
 * @returns {Function} File reader function compatible with resolveTemplate
 */
function createGitHubFileReader(fileCache) {
  return async (filePath) => {
    if (!fileCache.has(filePath)) {
      throw new Error(`File not found in cache: ${filePath}`);
    }
    const buffer = fileCache.get(filePath);
    return buffer.toString('utf-8');
  };
}

/**
 * Escape special regex characters in a string
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  parseTemplate,
  resolveTemplate,
  createLocalFileReader,
  createGitHubFileReader,
};
