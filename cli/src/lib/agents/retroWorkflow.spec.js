const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

const workflow = YAML.parse(fs.readFileSync(path.resolve(__dirname, '../../../../.github/workflows/06-retro-ready.yml'), 'utf8'));
const script = workflow.jobs['create-retro-task'].steps.find(step => step.id === 'create-issue').with.script;
const runScript = new (Object.getPrototypeOf(async function () {}).constructor)('github', 'context', 'core', 'require', script);

describe('period retro workflow', () => {
  let github, context, core;
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-04T12:00:00Z'));
    github = {
      rest: {
        issues: { listForRepo: jest.fn(), create: jest.fn().mockResolvedValue({ data: { number: 42 } }) },
        repos: { getContent: jest.fn().mockRejectedValue({ status: 404 }) },
        git: { getTree: jest.fn().mockResolvedValue({ data: { tree: [{ type: 'tree', path: 'rnd' }], truncated: false } }) }
      },
      paginate: jest.fn().mockResolvedValue([])
    };
    context = { repo: { owner: 'team', repo: 'example' }, sha: 'fixed-revision', payload: { inputs: {
      period_start: '2026-09-27T03:00:00+03:00', period_end: '2026-10-04T03:00:00+03:00', timezone: 'Asia/Jerusalem', spec_roots: 'apps/api/specs,specs'
    } } };
    core = { setFailed: jest.fn(), notice: jest.fn(), setOutput: jest.fn() };
  });
  afterEach(() => jest.useRealTimers());
  const run = () => runScript(github, context, core, require);

  it('dispatches only manually, without PR approval or a schedule', () => {
    expect(Object.keys(workflow.on)).toEqual(['workflow_dispatch']);
    expect(workflow.on.workflow_dispatch.inputs.pr_number).toBeUndefined();
  });

  it('creates a normalized period task for nested roots even without evidence or PR discussion', async () => {
    await run();
    expect(core.setFailed).not.toHaveBeenCalled();
    expect(github.rest.issues.create).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Retro: 2026-09-27T00:00:00.000Z to 2026-10-04T00:00:00.000Z (apps/api/specs, specs)',
      body: expect.stringContaining('No updates recommended')
    }));
    const body = github.rest.issues.create.mock.calls[0][0].body;
    expect(body).toContain('fixed-revision');
    expect(body).toContain('apps/api/specs/templates/retro.md');
    expect(body).toContain('coverage');
    expect(core.setOutput).toHaveBeenCalledWith('issue_number', 42);
  });

  it.each([
    { period_start: '2026-10-04', period_end: '2026-10-05T00:00:00Z' },
    { period_start: '2026-09-28T00:00:00Z', period_end: '2026-09-27T00:00:00Z' },
    { period_start: '2026-09-27T00:00:00Z', period_end: '2026-09-27T00:00:00Z' },
    { period_start: '2026-09-27T00:00:00Z', period_end: '2026-10-05T00:00:00Z' },
    { period_start: '2026-02-30T00:00:00Z' },
    { period_start: '2026-09-27T25:00:00Z' },
    { period_start: '2026-09-27T00:00:00+25:00' },
    { timezone: 'Mars/Olympus' },
    { spec_roots: '../specs' },
    { spec_roots: 'apps/api/../../specs' },
    { spec_roots: '/absolute/specs' }
  ])('rejects invalid period/timezone/scope input %j', async overrides => {
    Object.assign(context.payload.inputs, overrides);
    await run();
    expect(core.setFailed).toHaveBeenCalled();
    expect(github.rest.issues.create).not.toHaveBeenCalled();
  });

  it('deduplicates offset-equivalent windows and reordered/duplicated roots', async () => {
    await run();
    const prior = github.rest.issues.create.mock.calls[0][0];
    github.paginate.mockResolvedValue([{ body: prior.body }]);
    github.rest.issues.create.mockClear();
    Object.assign(context.payload.inputs, { period_start: '2026-09-27T00:00:00Z', period_end: '2026-10-04T00:00:00Z', spec_roots: 'specs,apps/api/specs,specs' });
    await run();
    expect(github.rest.issues.create).not.toHaveBeenCalled();
    expect(core.notice).toHaveBeenCalled();
  });

  it('allows different periods and different scopes', async () => {
    await run();
    const prior = github.rest.issues.create.mock.calls[0][0];
    github.paginate.mockResolvedValue([{ body: prior.body }]);
    context.payload.inputs.period_start = '2026-09-28T00:00:00Z';
    await run();
    context.payload.inputs.spec_roots = 'other/specs';
    await run();
    expect(github.rest.issues.create).toHaveBeenCalledTimes(3);
  });

  it('discovers legacy roots and prefers r3nd to rnd at the same scope', async () => {
    context.payload.inputs.spec_roots = '';
    github.rest.git.getTree.mockResolvedValue({ data: { tree: ['rnd', 'r3nd', 'apps/api/rnd'].map(p => ({ type: 'tree', path: p })), truncated: false } });
    await run();
    expect(github.rest.issues.create.mock.calls[0][0].title).toContain('(apps/api/rnd, r3nd)');
  });

  it('discovers a configured directory at the selected revision', async () => {
    context.payload.inputs.spec_roots = '';
    github.rest.repos.getContent.mockResolvedValue({ data: { content: Buffer.from('spec-dir-name: specs\n').toString('base64') } });
    github.rest.git.getTree.mockResolvedValue({ data: { tree: ['rnd', 'specs', 'apps/api/specs'].map(p => ({ type: 'tree', path: p })), truncated: false } });
    await run();
    expect(github.rest.repos.getContent).toHaveBeenCalledWith(expect.objectContaining({ ref: 'fixed-revision' }));
    expect(github.rest.issues.create.mock.calls[0][0].title).toContain('(apps/api/specs, specs)');
  });

  it('requires explicit roots rather than silently trusting truncated discovery', async () => {
    context.payload.inputs.spec_roots = '';
    github.rest.git.getTree.mockResolvedValue({ data: { tree: [], truncated: true } });
    await run();
    expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining('truncated'));
    expect(github.rest.issues.create).not.toHaveBeenCalled();
  });
});
