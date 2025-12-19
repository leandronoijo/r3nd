// Thin compatibility wrapper — implementation lives in initService.

const { runInit: runInitService } = require('./initService');

async function runInit(opts = {}) {
  return runInitService(opts);
}

module.exports = { runInit };
