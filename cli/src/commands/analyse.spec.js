jest.mock('../lib/analyse', () => ({
  runAnalyse: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../lib/ui/prompts', () => ({
  askAnalyseAgent: jest.fn(async (agent) => agent || 'codex')
}));

const { Command } = require('commander');
const { register } = require('./analyse');
const { runAnalyse } = require('../lib/analyse');

describe('analyse command registration', () => {
  test('does not register --dir option', () => {
    const program = new Command();
    register(program);

    const analyseCmd = program.commands.find(cmd => cmd.name() === 'analyse');
    expect(analyseCmd).toBeDefined();

    const optionFlags = analyseCmd.options.map(option => option.long);
    expect(optionFlags).not.toContain('--dir');
  });

  test('passes only agent and nonInteractive to runAnalyse', async () => {
    const program = new Command();
    register(program);

    await program.parseAsync(['node', 'test', 'analyse', '--non-interactive', '--agent', 'codex']);

    expect(runAnalyse).toHaveBeenCalledWith({
      agent: 'codex',
      nonInteractive: true
    });
  });
});
