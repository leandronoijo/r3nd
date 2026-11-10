const { runInit } = require('../lib/init');

function register(program) {
  program
    .command('init')
    .description('Initialize repository and copy r3nd seed GitHub files')
    .option('-y, --yes', 'Non-interactive mode, select all seed components')
    .option('--r3start', 'Bootstrap repo using r3start before copying r3nd seed files')
    .action(async (options) => {
      try {
        await runInit({ nonInteractive: options.yes, r3start: options.r3start });
      } catch (err) {
        console.error('Init failed:', err && err.message ? err.message : err);
        process.exit(1);
      }
    });
}

module.exports = { register };
