const { runAnalyse } = require('../lib/analyse');
const { askAnalyseAgent } = require('../lib/ui/prompts');

function register(program) {
  program
    .command('analyse')
    .description('Analyse the repository and generate project/app instruction files using LLM agents')
    .option('-a, --agent <agent>', 'Agent to use (codex|gemini|github|generate)', 'codex')
    .option('-n, --non-interactive', 'Run without prompting', false)
    .action(async (opts) => {
      try {
        const agent = opts.nonInteractive ? opts.agent : await askAnalyseAgent(opts.agent);
        await runAnalyse({ agent, nonInteractive: !!opts.nonInteractive });
      } catch (err) {
        console.error('Analyse failed:', err && err.message ? err.message : err);
        process.exit(1);
      }
    });
}

module.exports = { register };
