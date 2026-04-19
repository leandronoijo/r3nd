jest.mock('./lib/utils/toolDetector', () => ({
  detectAvailableTools: jest.fn()
}));

const { isCommandModuleEntry } = require('./index');

describe('cli entrypoint', () => {
  test('loads real command modules and skips test files', () => {
    expect(isCommandModuleEntry({
      name: 'worktree.js',
      isDirectory: () => false,
      isFile: () => true
    })).toBe(true);

    expect(isCommandModuleEntry({
      name: 'agents.spec.js',
      isDirectory: () => false,
      isFile: () => true
    })).toBe(false);

    expect(isCommandModuleEntry({
      name: 'analyse.test.js',
      isDirectory: () => false,
      isFile: () => true
    })).toBe(false);

    expect(isCommandModuleEntry({
      name: 'nested',
      isDirectory: () => true,
      isFile: () => false
    })).toBe(true);
  });
});
