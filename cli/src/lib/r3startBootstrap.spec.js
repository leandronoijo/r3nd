jest.mock('child_process', () => ({ execFile: jest.fn() }));
jest.mock('./ui/prompts', () => ({ askOverwriteFile: jest.fn() }));
jest.mock('./utils/logger', () => ({ info: jest.fn() }));

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const { askOverwriteFile } = require('./ui/prompts');
const { bootstrapR3start } = require('./r3startBootstrap');

describe('r3start bootstrap', () => {
  let destination;
  let checkout;

  beforeEach(async () => {
    jest.clearAllMocks();
    destination = await fs.mkdtemp(path.join(os.tmpdir(), 'r3nd-bootstrap-test-'));
    askOverwriteFile.mockImplementation(async (_, nonInteractive) => !nonInteractive);
    execFile.mockImplementation((command, args, callback) => {
      checkout = args[args.length - 1];
      (async () => {
        await fs.mkdir(path.join(checkout, '.git'), { recursive: true });
        await fs.mkdir(path.join(checkout, 'apps'), { recursive: true });
        await fs.writeFile(path.join(checkout, '.git', 'config'), 'starter remote');
        await fs.writeFile(path.join(checkout, '.gitignore'), 'node_modules');
        await fs.writeFile(path.join(checkout, 'package.json'), '{"name":"starter"}');
        await fs.writeFile(path.join(checkout, 'apps', 'start.sh'), '#!/bin/sh\n', { mode: 0o755 });
      })().then(() => callback(null, '', ''), callback);
    });
  });

  afterEach(async () => {
    await fs.rm(destination, { recursive: true, force: true });
  });

  test('copies starter code and dotfiles without Git metadata, preserves executable modes, and cleans up', async () => {
    await bootstrapR3start(destination);
    expect(execFile).toHaveBeenCalledWith('git', [
      'clone', '--depth', '1', 'https://github.com/leandronoijo/r3start.git', checkout
    ], expect.any(Function));
    expect(await fs.readFile(path.join(destination, 'package.json'), 'utf8')).toContain('starter');
    expect(await fs.readFile(path.join(destination, '.gitignore'), 'utf8')).toBe('node_modules');
    expect((await fs.stat(path.join(destination, 'apps', 'start.sh'))).mode & 0o777).toBe(0o755);
    await expect(fs.access(path.join(destination, '.git'))).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(fs.access(path.dirname(checkout))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  test.each([true, false])('handles existing files with nonInteractive=%s and keeps existing Git metadata', async nonInteractive => {
    await fs.writeFile(path.join(destination, 'package.json'), 'existing');
    await fs.mkdir(path.join(destination, '.git'));
    await fs.writeFile(path.join(destination, '.git', 'config'), 'my remote');
    await bootstrapR3start(destination, { nonInteractive });
    expect(askOverwriteFile).toHaveBeenCalledWith('package.json', nonInteractive);
    expect(await fs.readFile(path.join(destination, 'package.json'), 'utf8')).toBe(
      nonInteractive ? 'existing' : '{"name":"starter"}'
    );
    expect(await fs.readFile(path.join(destination, '.git', 'config'), 'utf8')).toBe('my remote');
  });

  test('does not follow destination directory symlinks', async () => {
    const outside = path.join(destination, 'outside');
    await fs.mkdir(outside);
    await fs.symlink(outside, path.join(destination, 'apps'));
    await bootstrapR3start(destination);
    expect(await fs.readdir(outside)).toEqual([]);
  });

  test('cleans up and propagates clone failures', async () => {
    execFile.mockImplementationOnce((command, args, callback) => {
      checkout = args[args.length - 1];
      callback(new Error('clone failed'));
    });
    await expect(bootstrapR3start(destination)).rejects.toThrow('clone failed');
    expect(await fs.readdir(destination)).toEqual([]);
    await expect(fs.access(path.dirname(checkout))).rejects.toMatchObject({ code: 'ENOENT' });
  });
});
