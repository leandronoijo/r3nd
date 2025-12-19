const path = require('path');

const { runInit } = require('../lib/init');

function register(program) {
  program
    .command('init')
    .description('Initialize repository and copy r3nd seed GitHub files')
    .action(async () => {
      try {
        await runInit();
      } catch (err) {
        console.error('Init failed:', err && err.message ? err.message : err);
        process.exit(1);
      }
    });
}

module.exports = { register };
