/**
 * Infer spec directory base from a file path
 * E.g., "workspaces/disputes/sdlc/tech_specs/file.md" with specDirName="sdlc" 
 *       returns "workspaces/disputes"
 * @param {string} filePath - The file path provided by user
 * @param {string} specDirName - The spec directory name from config
 * @returns {string} The inferred spec directory base, or empty string if not found
 */
function inferSpecDirBase(filePath, specDirName) {
  if (!filePath || !specDirName) {
    return '';
  }
  
  // Normalize the path and split into parts
  const normalizedPath = filePath.replace(/\\/g, '/');
  const parts = normalizedPath.split('/');
  
  // Find the index of the spec directory name in the path
  const specDirIndex = parts.indexOf(specDirName);
  
  if (specDirIndex <= 0) {
    // Not found or at the root level
    return '';
  }
  
  // Return the path up to (but not including) the spec directory
  return parts.slice(0, specDirIndex).join('/');
}

module.exports = {
  inferSpecDirBase
};
