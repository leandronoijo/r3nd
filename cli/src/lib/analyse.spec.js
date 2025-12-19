const { buildOverviewPrompt, buildAppPrompt } = require('./analyse/prompts');
const { parseAppsFromInstructions } = require('./analyse');

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

  test('parseAppsFromInstructions parses JSON block', async () => {
    const md = 'Some intro\n```json\n{"apps":[{"name":"api","path":"src/backend","purpose":"api","stack":"fastapi"}]}\n```\nRest';
    const apps = await parseAppsFromInstructions(md);
    expect(Array.isArray(apps)).toBe(true);
    expect(apps[0].name).toBe('api');
  });
});
