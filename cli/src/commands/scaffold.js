const path = require('path');

const { runScaffold } = require('../lib/scaffold');

function register(program) {
  program
    .command('scaffold')
    .description('Scaffold a new project using r3nd overlays')
    .option('-y, --yes', 'Non-interactive mode, select all options')
    .action(async (options) => {
      try {
        await runScaffold({ nonInteractive: options.yes });
      } catch (err) {
        console.error('Scaffolding failed:', err && err.message ? err.message : err);
        process.exit(1);
      }
    });
}

module.exports = { register };
