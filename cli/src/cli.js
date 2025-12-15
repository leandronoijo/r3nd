// Compatibility wrapper: the real implementation has moved to `src/lib/scaffold.js`.
// This file forwards to the new module so existing installs that require this
// file keep working.

const { runScaffold } = require('./lib/scaffold');

if (require.main === module) {
  runScaffold().catch(err => {
    console.error('Unexpected error:', err && err.message ? err.message : err);
    process.exit(1);
  });
}

module.exports = { runScaffold };
