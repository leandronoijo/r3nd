const { runBugfix } = require('../lib/bugfix');

function register(program) {
  program
    .command('bugfix')
    .description('Create and execute a bugfix plan using r3nd agents')
    .action(async () => {
      try {
        await runBugfix();
      } catch (err) {
        console.error('Bugfix workflow failed:', err && err.message ? err.message : err);
        process.exit(1);
      }
    });
}

module.exports = { register };
