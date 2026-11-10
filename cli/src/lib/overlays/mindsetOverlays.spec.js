const fs = require('fs');
const path = require('path');

const { parseTemplate } = require('../templateResolver');

const REPO_ROOT = path.resolve(__dirname, '../../../..');
const EXPECTED_OVERRIDES = [
  'skills/bugfix/SKILL.md',
  'skills/create-build-plan/SKILL.md',
  'skills/create-tech-spec/SKILL.md',
  'skills/create-test-cases/SKILL.md',
  'skills/implement-build-plan/SKILL.md',
  'skills/implement-feature/SKILL.md',
  'skills/run-e2e-tests/SKILL.md',
  'skills/run-manual-qa-tests/SKILL.md',
  'templates/build_plan.md',
  'templates/tech_spec.md',
  'templates/test_cases.md'
];

function resolvePlaceholderPath(overlayRoot, placeholder) {
  const basePath = path.join(REPO_ROOT, placeholder);
  if (fs.existsSync(basePath)) {
    return basePath;
  }

  if (placeholder.startsWith('rnd/')) {
    const overlayPath = path.join(overlayRoot, placeholder.slice('rnd/'.length));
    if (fs.existsSync(overlayPath)) {
      return overlayPath;
    }
  }

  return null;
}

describe.each([
  ['prototyping', 'prototyping'],
  ['mvp', 'mvp']
])('%s mindset overlay', (overlayName, sharedPolicyName) => {
  const overlayRoot = path.join(REPO_ROOT, 'overlays', overlayName);
  const expectedFiles = [
    `agents/shared/${sharedPolicyName}.md`,
    ...EXPECTED_OVERRIDES
  ];

  it('provides the complete compact-workflow override set', () => {
    for (const relativePath of expectedFiles) {
      expect(fs.existsSync(path.join(overlayRoot, relativePath))).toBe(true);
    }
  });

  it('has no unresolved template references', () => {
    for (const relativePath of expectedFiles) {
      const filePath = path.join(overlayRoot, relativePath);
      const content = fs.readFileSync(filePath, 'utf-8');

      for (const placeholder of parseTemplate(content)) {
        expect(resolvePlaceholderPath(overlayRoot, placeholder)).not.toBeNull();
      }
    }
  });

  it('prefers established packages over custom commodity infrastructure', () => {
    const policy = fs.readFileSync(
      path.join(overlayRoot, `agents/shared/${sharedPolicyName}.md`),
      'utf-8'
    );
    const techSpecSkill = fs.readFileSync(
      path.join(overlayRoot, 'skills/create-tech-spec/SKILL.md'),
      'utf-8'
    );
    const techSpecTemplate = fs.readFileSync(
      path.join(overlayRoot, 'templates/tech_spec.md'),
      'utf-8'
    );
    const buildPlanSkill = fs.readFileSync(
      path.join(overlayRoot, 'skills/create-build-plan/SKILL.md'),
      'utf-8'
    );
    const implementationSkill = fs.readFileSync(
      path.join(overlayRoot, 'skills/implement-build-plan/SKILL.md'),
      'utf-8'
    );

    expect(policy).toContain('commodity capabilities');
    expect(policy).toContain('mature ecosystem-standard package');
    expect(policy).toContain('stack-appropriate ORM');
    expect(policy).toContain('Do not create a migration runner');
    expect(techSpecSkill).toContain('manifests and lockfiles');
    expect(techSpecSkill).toContain('Do not choose custom infrastructure merely to avoid adding a dependency');
    expect(techSpecTemplate).toContain('## 3. Reuse And Dependency Decisions');
    expect(techSpecTemplate).toContain('| Relational data and migrations |');
    expect(buildPlanSkill).toContain("Carry the tech spec's package/tool choices into the plan");
    expect(implementationSkill).toContain('Do not replace them with hand-built equivalents');
  });
});

describe('mvp production baseline', () => {
  it('keeps every minimum production concern explicit in the shared policy and tech spec', () => {
    const policy = fs.readFileSync(
      path.join(REPO_ROOT, 'overlays/mvp/agents/shared/mvp.md'),
      'utf-8'
    );
    const techSpec = fs.readFileSync(
      path.join(REPO_ROOT, 'overlays/mvp/templates/tech_spec.md'),
      'utf-8'
    );

    for (const [policyConcern, specConcern] of [
      ['CI', 'CI'],
      ['Runtime', 'Runtime and config'],
      ['Security', 'Security'],
      ['Compatibility and data', 'Compatibility and data'],
      ['Operability', 'Operability'],
      ['Identity and tenancy', 'Identity and tenancy']
    ]) {
      expect(policy).toContain(`**${policyConcern}:**`);
      expect(techSpec).toContain(`| ${specConcern} |`);
    }
  });
});
