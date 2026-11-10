// Thin compatibility wrapper — implementation lives in updateService.

const { runUpdate: runUpdateService } = require('./updateService');

async function runUpdate(opts = {}) {
  return runUpdateService(opts);
}

module.exports = { runUpdate };
