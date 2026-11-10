const path = require('path');

// Simple overlay registry: for now it uses the same mapping rules as before.
// Later this can read overlay manifests (overlay.json) from the repo.

/**
 * Map remote overlay path to local destination
 * @param {string} remotePath - Path in the seed repository
 * @param {string} backend - Backend framework name
 * @param {string} frontend - Frontend framework name
 * @param {string} specDirName - Configured spec directory name (defaults to 'r3nd')
 * @returns {string|null} Local destination path or null if no mapping
 */
function mapDestination(remotePath, backend, frontend, specDirName = 'r3nd') {
  const backendInstrPrefix = `overlays/backend/${backend}/instructions/`;
  const frontendInstrPrefix = `overlays/frontend/${frontend}/instructions/`;
  if (remotePath.startsWith(backendInstrPrefix)) {
    return path.join(specDirName, 'instructions', remotePath.slice(backendInstrPrefix.length));
  }
  if (remotePath.startsWith(frontendInstrPrefix)) {
    return path.join(specDirName, 'instructions', remotePath.slice(frontendInstrPrefix.length));
  }

  const backendBuildPrefix = `overlays/backend/${backend}/build_plans/`;
  const frontendBuildPrefix = `overlays/frontend/${frontend}/build_plans/`;
  if (remotePath.startsWith(backendBuildPrefix)) {
    return path.join(specDirName, 'build_plans', remotePath.slice(backendBuildPrefix.length));
  }
  if (remotePath.startsWith(frontendBuildPrefix)) {
    return path.join(specDirName, 'build_plans', remotePath.slice(frontendBuildPrefix.length));
  }

  return null;
}

module.exports = { mapDestination };
