const { buildOverviewPrompt, buildAppPrompt } = require('./analyse/prompts');
const { parseAppsFromInstructions } = require('./analyse');

describe('analyse prompts and parsing', () => {
  test('overview prompt contains JSON block instruction', () => {
    const p = buildOverviewPrompt();
    // Verify the prompt contains the JSON code fence marker
    expect(p).toMatch(/```json/i);
    // Verify the prompt mentions the "apps" key that will be in the JSON
    expect(p).toMatch(/apps/i);
  });

  test('app prompt mentions applyTo path and sections', () => {
    const p = buildAppPrompt({ name: 'foo', path: 'src/foo' });
    // Verify the prompt uses the camelCase "applyTo" field
    expect(p).toMatch(/applyTo/i);
    // Verify the prompt includes the "Tech stack" section requirement
    expect(p).toMatch(/Tech stack/i);
  });

  test('parseAppsFromInstructions parses JSON block', async () => {
    const md = 'Some intro\n```json\n{"apps":[{"name":"api","path":"src/backend","purpose":"api","stack":"fastapi"}]}\n```\nRest';
    const apps = await parseAppsFromInstructions(md);
    expect(Array.isArray(apps)).toBe(true);
    expect(apps[0].name).toBe('api');
  });
});
