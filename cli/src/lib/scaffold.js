// Thin compatibility wrapper — the refactored implementation lives in scaffoldService.

const { runScaffold: runScaffoldService } = require('./scaffoldService');

async function runScaffold(opts = {}) {
  return runScaffoldService(opts);
}

module.exports = { runScaffold };
