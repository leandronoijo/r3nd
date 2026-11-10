const { runGenerateSeed } = require('../lib/generateSeedService');

function register(program) {
  program
    .command('generate-seed')
    .description('Generate a new r3nd seed repository in the current directory')
    .option('-y, --yes', 'Non-interactive mode')
    .option('--remote <url>', 'Git remote URL for the new seed repo')
    .action(async (options) => {
      try {
        await runGenerateSeed({ nonInteractive: options.yes, remote: options.remote });
      } catch (err) {
        console.error('generate-seed failed:', err && err.message ? err.message : err);
        process.exit(1);
      }
    });
}

module.exports = { register };
