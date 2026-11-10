jest.mock('inquirer', () => ({
  createPromptModule: jest.fn(() => jest.fn().mockResolvedValue({}))
}));

const { Command } = require('commander');
const { register } = require('./agents');

describe('agents command registration', () => {
  test('registers analysis subcommands from agent registry', () => {
    const program = new Command();
    register(program);

    const agentsRoot = program.commands.find(cmd => cmd.name() === 'agents');
    expect(agentsRoot).toBeDefined();

    const names = agentsRoot.commands.map(cmd => cmd.name());
    expect(names).toContain('analyze-repo-context');
    expect(names).toContain('analyze-app-context');
    expect(names).toContain('analyze-module-context');
  });
});
