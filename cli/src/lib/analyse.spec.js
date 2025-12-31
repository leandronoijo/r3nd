const { buildOverviewPrompt, buildAppPrompt, buildTargetedAppPrompt } = require('./analyse/prompts');
const { parseAppsFromInstructions, parseAppNameFromMetadata } = require('./analyse');

describe('analyse prompts and parsing', () => {
  test('overview prompt contains JSON block instruction', () => {
    const p = buildOverviewPrompt();
    expect(p).toMatch(/```json[\s\S]*apps[\s\S]*```/i);
  });

  test('app prompt mentions apply-to path and sections', () => {
    const p = buildAppPrompt({ name: 'foo', path: 'src/foo' });
    expect(p).toMatch(/apply-to header/i);
    expect(p).toMatch(/Tech stack/i);
  });

  test('targeted app prompt includes target directory', () => {
    const p = buildTargetedAppPrompt('src/backend');
    expect(p).toContain('src/backend');
    expect(p).toMatch(/Tech stack/i);
    expect(p).toMatch(/applyTo/i);
  });

  test('parseAppsFromInstructions parses JSON block', async () => {
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
