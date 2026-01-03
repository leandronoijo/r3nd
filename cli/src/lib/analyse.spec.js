// Mock inquirer before any imports
jest.mock('inquirer', () => ({
  createPromptModule: jest.fn(() => jest.fn().mockResolvedValue({}))
}));

const { buildOverviewPrompt, buildAppPrompt, buildTargetedAppPrompt } = require('./analyse/prompts');
const { parseAppsFromInstructions, parseAppNameFromMetadata } = require('./analyse');

describe('analyse prompts and parsing', () => {
  test('overview prompt contains YAML block instruction', () => {
    const p = buildOverviewPrompt();
    expect(p).toMatch(/YAML/i);
    expect(p).toMatch(/apps:/i);
  });

  test('app prompt mentions applyTo and sections', () => {
    const p = buildAppPrompt({ name: 'foo', path: 'src/foo' });
    expect(p).toMatch(/applyTo/i);
    expect(p).toMatch(/Tech stack/i);
  });

  test('targeted app prompt includes target directory', () => {
    const p = buildTargetedAppPrompt('src/backend');
    expect(p).toContain('src/backend');
    expect(p).toMatch(/Tech stack/i);
    expect(p).toMatch(/applyTo/i);
  });

  test('parseAppsFromInstructions parses YAML block', async () => {
    const md = 'Some intro\n```yaml\napps:\n  - name: api\n    path: src/backend\n    purpose: api\n    stack: fastapi\n```\nRest';
    const apps = await parseAppsFromInstructions(md);
    expect(Array.isArray(apps)).toBe(true);
    expect(apps[0].name).toBe('api');
  });

  test('parseAppsFromInstructions parses JSON block for backwards compatibility', async () => {
    const md = 'Some intro\n```json\n{"apps":[{"name":"api","path":"src/backend","purpose":"api","stack":"fastapi"}]}\n```\nRest';
    const apps = await parseAppsFromInstructions(md);
    expect(Array.isArray(apps)).toBe(true);
    expect(apps[0].name).toBe('api');
  });

  test('parseAppNameFromMetadata extracts name from YAML', async () => {
    const md = 'Some intro\n```yaml\nname: my-app\napplyTo: src/app\n```\nRest of content';
    const name = await parseAppNameFromMetadata(md);
    expect(name).toBe('my-app');
  });

  test('parseAppNameFromMetadata extracts name from JSON', async () => {
    const md = 'Some intro\n```json\n{"name":"api-service","applyTo":"src/backend"}\n```\nRest of content';
    const name = await parseAppNameFromMetadata(md);
    expect(name).toBe('api-service');
  });

  test('parseAppNameFromMetadata returns null if no metadata', async () => {
    const md = 'Just some plain markdown without metadata blocks';
    const name = await parseAppNameFromMetadata(md);
    expect(name).toBeNull();
  });
});
