const path = require('path');
const fs = require('fs').promises;
const os = require('os');

jest.mock('../fs/seedCopier', () => {
  const path = require('path');
  const fs = require('fs').promises;

  async function fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async function writeWithOverwritePrompt(cwd, relativePath, buffer, { overwriteExisting = false } = {}) {
    const absolutePath = path.join(cwd, relativePath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    if (!overwriteExisting) {
      try {
        await fs.access(absolutePath);
        return false;
      } catch (err) {
        if (!err || err.code !== 'ENOENT') {
          throw err;
        }
      }
    }
    await fs.writeFile(absolutePath, buffer);
    return true;
  }

  return { fileExists, writeWithOverwritePrompt };
});

const {
  discoverAvailableOverlays,
  applySelectedOverlays,
  getOverlayDestinationForPath
} = require('./overlaySeedService');

describe('overlaySeedService', () => {
  describe('discoverAvailableOverlays', () => {
    it('returns unique top-level overlay names in sorted order', () => {
      const tree = [
        { type: 'blob', path: 'overlays/vue/templates/app.md' },
        { type: 'blob', path: 'overlays/api/skills/test/SKILL.md' },
        { type: 'blob', path: 'overlays/vue/instructions/src/frontend/readme.md' },
        { type: 'blob', path: 'rnd/templates/base.md' }
      ];

      expect(discoverAvailableOverlays(tree)).toEqual(['api', 'vue']);
    });
  });

  describe('getOverlayDestinationForPath', () => {
    it('maps instructions into the repository root', () => {
      expect(
        getOverlayDestinationForPath('overlays/api/instructions/src/backend/README.md', 'api', 'r3nd')
      ).toBe(path.join('src', 'backend', 'README.md'));
    });

    it('maps overlay templates into the spec directory', () => {
      expect(
        getOverlayDestinationForPath('overlays/api/templates/feature.md', 'api', 'r3nd')
      ).toBe(path.join('r3nd', 'templates', 'feature.md'));
    });
  });

  describe('applySelectedOverlays', () => {
    let tempDir;

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'r3nd-overlay-test-'));
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('applies overlays in order and lets later overlays win', async () => {
      const files = new Map([
        ['rnd/templates/base.md', Buffer.from('base template\n')],
        ['overlays/one/templates/shared.md', Buffer.from('{{r3nd/templates/base.md}}overlay one\n')],
        ['overlays/two/templates/shared.md', Buffer.from('overlay two\n')],
        ['overlays/one/instructions/docs/guide.md', Buffer.from('# Guide\n')]
      ]);

      const tree = Array.from(files.keys()).map(filePath => ({ type: 'blob', path: filePath }));
      const githubClient = {
        fetchRaw: jest.fn(async (remotePath) => {
          if (!files.has(remotePath)) {
            throw new Error(`Missing file: ${remotePath}`);
          }
          return files.get(remotePath);
        })
      };

      await applySelectedOverlays(tempDir, tree, githubClient, 'r3nd', 'rnd', ['one', 'two'], {
        overwriteExisting: true
      });

      await expect(fs.readFile(path.join(tempDir, 'r3nd', 'templates', 'shared.md'), 'utf-8'))
        .resolves.toBe('overlay two\n');
      await expect(fs.readFile(path.join(tempDir, 'docs', 'guide.md'), 'utf-8'))
        .resolves.toBe('# Guide\n');
    });
  });
});
