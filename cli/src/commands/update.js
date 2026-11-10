const { runUpdate } = require('../lib/update');

function register(program) {
  program
    .command('update')
    .description('Update r3nd components (workflows, skills, templates) from the seed repository')
    .option('-y, --yes', 'Non-interactive mode, update all components')
    .action(async (options) => {
      try {
        await runUpdate({ nonInteractive: options.yes });
      } catch (err) {
        console.error('Update failed:', err && err.message ? err.message : err);
        process.exit(1);
      }
    });
}

module.exports = { register };
