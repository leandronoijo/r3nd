const path = require('path');

const { runScaffold } = require('../lib/scaffold');

function register(program) {
  program
    .command('scaffold')
    .description('Scaffold a new project using r3nd overlays')
    .action(async () => {
      try {
        await runScaffold();
      } catch (err) {
        console.error('Scaffolding failed:', err && err.message ? err.message : err);
        process.exit(1);
      }
    });
}

module.exports = { register };
