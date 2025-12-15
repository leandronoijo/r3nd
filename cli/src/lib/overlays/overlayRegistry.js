const path = require('path');

// Simple overlay registry: for now it uses the same mapping rules as before.
// Later this can read overlay manifests (overlay.json) from the repo.

function mapDestination(remotePath, backend, frontend) {
  const backendInstrPrefix = `overlays/backend/${backend}/instructions/`;
  const frontendInstrPrefix = `overlays/frontend/${frontend}/instructions/`;
  if (remotePath.startsWith(backendInstrPrefix)) {
    return path.join('.github', 'instructions', remotePath.slice(backendInstrPrefix.length));
  }
  if (remotePath.startsWith(frontendInstrPrefix)) {
    return path.join('.github', 'instructions', remotePath.slice(frontendInstrPrefix.length));
  }

  const backendBuildPrefix = `overlays/backend/${backend}/build_plans/`;
  const frontendBuildPrefix = `overlays/frontend/${frontend}/build_plans/`;
  if (remotePath.startsWith(backendBuildPrefix)) {
    return path.join('rnd', 'build_plans', remotePath.slice(backendBuildPrefix.length));
  }
  if (remotePath.startsWith(frontendBuildPrefix)) {
    return path.join('rnd', 'build_plans', remotePath.slice(frontendBuildPrefix.length));
  }

  return null;
}

module.exports = { mapDestination };
