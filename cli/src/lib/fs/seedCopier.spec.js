const fs = require('fs').promises;
const os = require('os');
const path = require('path');

jest.mock('../ui/prompts', () => ({
  askOverwriteFile: jest.fn().mockResolvedValue(true)
}));

const { copyTaskSkills, copyTemplates, copyAgentPersonas, syncPlatformAsset } = require('./seedCopier');
const { getPlatformAssets } = require('../platformAssetRegistry');
const { createEffectiveSeedView } = require('../overlays/overlaySeedService');

describe('seedCopier', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'r3nd-seed-copier-'));
  });

  afterEach(async () => {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('copies local rnd skills as fully composed files without leaving template placeholders', async () => {
    const tree = [
      { type: 'blob', path: 'rnd/skills/implement-build-plan/SKILL.md' },
      { type: 'blob', path: 'rnd/agents/developer.md' },
      { type: 'blob', path: 'rnd/agents/shared/command-hygiene.md' },
      { type: 'blob', path: 'rnd/agents/summary.md' },
    ];

    const fileMap = new Map([
      ['rnd/skills/implement-build-plan/SKILL.md', Buffer.from(`---
name: implement-build-plan
description: Implement features and tests based on a build plan; follow repository standards and keep diffs small and test-driven.
---

# implement-build-plan

{{rnd/agents/developer.md}}
{{rnd/agents/shared/command-hygiene.md}}
{{rnd/agents/summary.md}}
`)],
      ['rnd/agents/developer.md', Buffer.from('# Developer Agent')],
      ['rnd/agents/shared/command-hygiene.md', Buffer.from('Keep commands focused.')],
      ['rnd/agents/summary.md', Buffer.from('# Summary Workflow')],
    ]);

    const githubClient = {
      fetchRaw: jest.fn(async (filePath) => {
        if (!fileMap.has(filePath)) {
          throw new Error(`Unexpected fetch: ${filePath}`);
        }
        return fileMap.get(filePath);
      })
    };

    await copyTaskSkills(tempDir, tree, githubClient, 'specs', 'rnd', {
      nonInteractive: true,
      overwriteExisting: true
    });

    const localSkill = await fs.readFile(
      path.join(tempDir, 'specs', 'skills', 'implement-build-plan', 'SKILL.md'),
      'utf-8'
    );

    expect(localSkill).toContain('# Developer Agent');
    expect(localSkill).toContain('Keep commands focused.');
    expect(localSkill).toContain('# Summary Workflow');
    expect(localSkill).not.toContain('{{');
  });

  it('generates vendor skill outputs from canonical skills, resolves nested placeholders, rewrites spec-dir paths, and removes legacy outputs', async () => {
    const tree = [
      { type: 'blob', path: 'rnd/skills/create-tech-spec/SKILL.md' },
      { type: 'blob', path: 'rnd/vendor/skills/cursor.md' },
      { type: 'blob', path: 'rnd/agents/architect.md' },
      { type: 'blob', path: 'rnd/agents/summary.md' },
      { type: 'blob', path: 'rnd/agents/shared/command-hygiene.md' },
    ];

    const fileMap = new Map([
      ['rnd/skills/create-tech-spec/SKILL.md', Buffer.from(`---
name: create-tech-spec
description: Convert product specs into a repo-grounded technical specification / high-level design.
---

# create-tech-spec

Use rnd/templates/tech_spec.md as the canonical template.

{{rnd/agents/architect.md}}

{{rnd/agents/summary.md}}
`)],
      ['rnd/vendor/skills/cursor.md', Buffer.from(`## Cursor-Specific Instructions

{{rnd/agents/shared/command-hygiene.md}}
`)],
      ['rnd/agents/architect.md', Buffer.from('# Architect Agent')],
      ['rnd/agents/summary.md', Buffer.from('Summary points for the skill.')],
      ['rnd/agents/shared/command-hygiene.md', Buffer.from('Keep commands focused and minimal.')],
    ]);

    const githubClient = {
      fetchRaw: jest.fn(async (filePath) => {
        if (!fileMap.has(filePath)) {
          throw new Error(`Unexpected fetch: ${filePath}`);
        }
        return fileMap.get(filePath);
      })
    };

    await fs.mkdir(path.join(tempDir, '.cursor', 'commands'), { recursive: true });
    await fs.writeFile(path.join(tempDir, '.cursor', 'commands', 'create-tech-spec.md'), 'legacy');

    await syncPlatformAsset(
      tempDir,
      tree,
      githubClient,
      {
        key: 'cursor',
        label: 'Cursor Skills',
        assetType: 'generated-skill',
        vendor: 'cursor',
        outputPath: '.cursor/skills',
        legacyPathForTask: (taskName) => `.cursor/commands/${taskName}.md`,
      },
      'specs',
      'rnd',
      { nonInteractive: true, overwriteExisting: true }
    );

    const generated = await fs.readFile(path.join(tempDir, '.cursor', 'skills', 'create-tech-spec', 'SKILL.md'), 'utf-8');
    await expect(fs.access(path.join(tempDir, '.cursor', 'commands', 'create-tech-spec.md'))).rejects.toThrow();

    expect(generated).toContain('# create-tech-spec');
    expect(generated).toContain('# Architect Agent');
    expect(generated).toContain('Summary points for the skill.');
    expect(generated).toContain('## Cursor-Specific Instructions');
    expect(generated).toContain('Keep commands focused and minimal.');
    expect(generated).toContain('specs/templates/tech_spec.md');
    expect(githubClient.fetchRaw).toHaveBeenCalledWith('rnd/skills/create-tech-spec/SKILL.md');
  });

  it('generates vendor outputs for new analysis skills', async () => {
    const tree = [
      { type: 'blob', path: 'rnd/skills/analyze-repo-context/SKILL.md' },
      { type: 'blob', path: 'rnd/vendor/skills/codex.md' },
      { type: 'blob', path: 'rnd/agents/architect.md' },
      { type: 'blob', path: 'rnd/agents/summary.md' },
    ];

    const fileMap = new Map([
      ['rnd/skills/analyze-repo-context/SKILL.md', Buffer.from(`---
name: analyze-repo-context
description: Analyze repository context
---

# analyze-repo-context

{{rnd/agents/architect.md}}

{{rnd/agents/summary.md}}
`)],
      ['rnd/vendor/skills/codex.md', Buffer.from('## Codex-Specific Instructions')],
      ['rnd/agents/architect.md', Buffer.from('# Architect Agent')],
      ['rnd/agents/summary.md', Buffer.from('# Summary Workflow')],
    ]);

    const githubClient = {
      fetchRaw: jest.fn(async (filePath) => {
        if (!fileMap.has(filePath)) {
          throw new Error(`Unexpected fetch: ${filePath}`);
        }
        return fileMap.get(filePath);
      })
    };

    await syncPlatformAsset(
      tempDir,
      tree,
      githubClient,
      {
        key: 'codex',
        label: 'Codex Skills',
        assetType: 'generated-skill',
        vendor: 'codex',
        outputPath: '.codex/skills',
      },
      'specs',
      'rnd',
      { nonInteractive: true, overwriteExisting: true }
    );

    const generated = await fs.readFile(path.join(tempDir, '.codex', 'skills', 'analyze-repo-context', 'SKILL.md'), 'utf-8');
    expect(generated).toContain('# analyze-repo-context');
    expect(generated).toContain('# Architect Agent');
    expect(generated).toContain('## Codex-Specific Instructions');
  });

  it('materializes overlaid canonical and vendor skills without fetching the shadowed original', async () => {
    const tree = [
      { type: 'blob', path: 'rnd/skills/create-tech-spec/SKILL.md' },
      { type: 'blob', path: 'rnd/agents/shared/command-hygiene.md' },
      { type: 'blob', path: 'rnd/vendor/skills/codex.md' },
      { type: 'blob', path: 'rnd/vendor/skills/claude.md' },
      { type: 'blob', path: 'overlays/prototyping/skills/create-tech-spec/SKILL.md' },
      { type: 'blob', path: 'overlays/prototyping/agents/shared/prototyping.md' }
    ];
    const fileMap = new Map([
      ['rnd/skills/create-tech-spec/SKILL.md', Buffer.from('# Original Skill')],
      ['rnd/agents/shared/command-hygiene.md', Buffer.from('Keep commands focused.')],
      ['rnd/vendor/skills/codex.md', Buffer.from('## Codex Instructions')],
      ['rnd/vendor/skills/claude.md', Buffer.from('## Claude Instructions')],
      ['overlays/prototyping/skills/create-tech-spec/SKILL.md', Buffer.from(`# Prototype Skill

{{rnd/agents/shared/prototyping.md}}
{{rnd/agents/shared/command-hygiene.md}}
`)],
      ['overlays/prototyping/agents/shared/prototyping.md', Buffer.from('Prototype policy.')]
    ]);
    const githubClient = {
      fetchRaw: jest.fn(async remotePath => {
        if (!fileMap.has(remotePath)) {
          throw new Error(`Unexpected fetch: ${remotePath}`);
        }
        return fileMap.get(remotePath);
      })
    };
    const effectiveSeed = createEffectiveSeedView(tree, githubClient, 'rnd', ['prototyping']);

    await copyTaskSkills(
      tempDir,
      effectiveSeed.tree,
      effectiveSeed.githubClient,
      'r3nd',
      'rnd',
      { nonInteractive: true, overwriteExisting: true }
    );

    for (const vendor of ['codex', 'claude']) {
      await syncPlatformAsset(
        tempDir,
        effectiveSeed.tree,
        effectiveSeed.githubClient,
        {
          key: vendor,
          label: `${vendor} skills`,
          assetType: 'generated-skill',
          vendor,
          outputPath: `.${vendor}/skills`
        },
        'r3nd',
        'rnd',
        { nonInteractive: true, overwriteExisting: true }
      );
    }

    const canonical = await fs.readFile(
      path.join(tempDir, 'r3nd', 'skills', 'create-tech-spec', 'SKILL.md'),
      'utf-8'
    );
    const codex = await fs.readFile(
      path.join(tempDir, '.codex', 'skills', 'create-tech-spec', 'SKILL.md'),
      'utf-8'
    );
    const claude = await fs.readFile(
      path.join(tempDir, '.claude', 'skills', 'create-tech-spec', 'SKILL.md'),
      'utf-8'
    );

    expect(canonical).toContain('# Prototype Skill');
    expect(canonical).toContain('Prototype policy.');
    expect(codex).toContain('# Prototype Skill');
    expect(codex).toContain('## Codex Instructions');
    expect(claude).toContain('# Prototype Skill');
    expect(claude).toContain('## Claude Instructions');
    expect(canonical).not.toContain('# Original Skill');
    expect(codex).not.toContain('# Original Skill');
    expect(claude).not.toContain('# Original Skill');
    expect(githubClient.fetchRaw).not.toHaveBeenCalledWith('rnd/skills/create-tech-spec/SKILL.md');
  });
  describe('learning assets from the actual seed', () => {
    const repoRoot = path.resolve(__dirname, '../../../..');
    let tree, fileMap, githubClient;

    beforeEach(async () => {
      fileMap = new Map();
      async function collect(relativeDir) {
        for (const entry of await fs.readdir(path.join(repoRoot, relativeDir), { withFileTypes: true })) {
          const relativePath = `${relativeDir}/${entry.name}`;
          if (entry.isDirectory()) await collect(relativePath);
          else if (entry.isFile()) fileMap.set(relativePath, await fs.readFile(path.join(repoRoot, relativePath)));
        }
      }
      for (const dir of ['rnd/agents', 'rnd/skills', 'rnd/templates', 'rnd/vendor', 'overlays/mvp/agents', 'overlays/mvp/skills', 'overlays/prototyping/agents', 'overlays/prototyping/skills']) await collect(dir);
      // Runtime records are not distributable assets, even if committed in a seed.
      fileMap.set('rnd/learning/runs/seed/events/private.json', Buffer.from('{"private":"seed evidence"}'));
      tree = [...fileMap.keys()].map(p => ({ type: 'blob', path: p }));
      githubClient = { fetchRaw: jest.fn(async p => {
        if (!fileMap.has(p)) throw new Error(`Unexpected fetch: ${p}`);
        return fileMap.get(p);
      }) };
    });

    it.each([[[]], [['prototyping']], [['mvp']]])('ships capture and period retros across all vendor targets with overlays %j', async overlays => {
      const effective = createEffectiveSeedView(tree, githubClient, 'rnd', overlays);
      const specRoot = 'apps/api/specs';
      await copyAgentPersonas(tempDir, effective.tree, effective.githubClient, specRoot, 'rnd', { overwriteExisting: true });
      await copyTaskSkills(tempDir, effective.tree, effective.githubClient, specRoot, 'rnd', { overwriteExisting: true });
      await copyTemplates(tempDir, effective.tree, effective.githubClient, specRoot, 'rnd', { overwriteExisting: true });
      const assets = getPlatformAssets().filter(asset => asset.assetType === 'generated-skill');
      for (const asset of assets) await syncPlatformAsset(tempDir, effective.tree, effective.githubClient, asset, specRoot, 'rnd', { overwriteExisting: true });
      const skillNames = await fs.readdir(path.join(repoRoot, 'rnd/skills'));
      for (const outputRoot of [specRoot, ...assets.map(asset => asset.outputPath.replace(/\/skills$/, ''))]) {
        for (const skillName of skillNames) {
          const output = path.join(tempDir, outputRoot, 'skills', skillName, 'SKILL.md');
          const content = await fs.readFile(output, 'utf8');
          expect(content).not.toContain('{{');
          expect(content).not.toContain('Are you satisfied with the current result?');
          if (skillName === 'create-retro-report') {
            expect(content).not.toContain('## Learning Journal');
            expect(content).toContain('captured_at');
            expect(content).toContain('coverage: complete');
            expect(content).toContain(`${specRoot}/templates/retro.md`);
          } else {
            expect(content.match(/^## Learning Journal$/gm)).toHaveLength(1);
            expect(content).toContain(`${specRoot}/templates/learning-event.json`);
            expect(content).toContain('Before acting on the correction');
          }
        }
      }
      const run = JSON.parse(await fs.readFile(path.join(tempDir, specRoot, 'templates/learning-run.json'), 'utf8'));
      const event = JSON.parse(await fs.readFile(path.join(tempDir, specRoot, 'templates/learning-event.json'), 'utf8'));
      expect(run).toEqual(expect.objectContaining({ schema_version: 1, capture_mode: 'agent_reported', skill_path: expect.any(String), run_id: event.run_id, task_id: event.task_id }));
      expect(event).toEqual(expect.objectContaining({ schema_version: 1, kind: 'user_correction', evidence: expect.any(Array), captured_at: expect.any(String) }));
      expect(Number.isFinite(Date.parse(event.captured_at))).toBe(true);
      await expect(fs.access(path.join(tempDir, specRoot, 'learning'))).rejects.toThrow();
      expect(githubClient.fetchRaw).not.toHaveBeenCalledWith('rnd/learning/runs/seed/events/private.json');
    });

    it('keeps consumer evidence and customized skills through asset updates', async () => {
      const root = 'specs';
      const recordPath = path.join(tempDir, root, 'learning/runs/local/events/event.json');
      await fs.mkdir(path.dirname(recordPath), { recursive: true });
      await fs.writeFile(recordPath, '{"local":"retained"}');
      const skillPath = path.join(tempDir, root, 'skills/create-build-plan/SKILL.md');
      await fs.mkdir(path.dirname(skillPath), { recursive: true });
      await fs.writeFile(skillPath, 'Customized plan skill');
      const { askOverwriteFile } = require('../ui/prompts');
      askOverwriteFile.mockResolvedValueOnce(false);
      const selectedTree = tree.filter(item => !item.path.startsWith('rnd/skills/') || item.path === 'rnd/skills/create-build-plan/SKILL.md');
      await copyTaskSkills(tempDir, selectedTree, githubClient, root, 'rnd');
      expect(await fs.readFile(skillPath, 'utf8')).toBe('Customized plan skill');
      await copyTaskSkills(tempDir, selectedTree, githubClient, root, 'rnd', { overwriteExisting: true });
      await copyTemplates(tempDir, selectedTree, githubClient, root, 'rnd', { overwriteExisting: true });
      expect(await fs.readFile(recordPath, 'utf8')).toBe('{"local":"retained"}');
      expect(await fs.readFile(skillPath, 'utf8')).toContain('## Learning Journal');
    });
  });

});
