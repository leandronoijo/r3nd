const fs = require('fs').promises;
const os = require('os');
const path = require('path');

jest.mock('../ui/prompts', () => ({
  askOverwriteFile: jest.fn().mockResolvedValue(true)
}));

const { copyTaskSkills, syncPlatformAsset } = require('./seedCopier');

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
});
