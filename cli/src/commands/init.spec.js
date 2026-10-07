jest.mock('../lib/init', () => ({ runInit: jest.fn().mockResolvedValue(undefined) }));

const { Command } = require('commander');
const { register } = require('./init');
const { runInit } = require('../lib/init');

test('init passes the r3start flag and non-interactive option', async () => {
  const program = new Command();
  register(program);
  await program.parseAsync(['node', 'test', 'init', '--r3start', '--yes']);
  expect(runInit).toHaveBeenCalledWith({ nonInteractive: true, r3start: true });
});
