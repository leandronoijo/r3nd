const PLATFORM_ASSETS = [
  {
    key: 'github-skills',
    label: 'GitHub Skills',
    assetType: 'generated-skill',
    vendor: 'github',
    outputPath: '.github/skills',
    mirrorInstructionsToRnd: false,
    initAction: 'Create .github/skills for each task',
    updateAction: 'Update .github/skills for each task'
  },
  {
    key: 'github-workflows',
    label: 'GitHub Workflows',
    assetType: 'workflow',
    sourcePath: '.github/workflows',
    fileExtension: '.yml',
    compose: false,
    mirrorInstructionsToRnd: false,
    initAction: 'Copy .github/workflows',
    updateAction: 'Update .github/workflows'
  },
  {
    key: 'cursor',
    label: 'Cursor Skills',
    assetType: 'generated-skill',
    vendor: 'cursor',
    outputPath: '.cursor/skills',
    mirrorInstructionsToRnd: false,
    initAction: 'Create .cursor/skills for each task',
    updateAction: 'Update .cursor/skills for each task',
    legacyPathForTask: (taskName) => `.cursor/commands/${taskName}.md`
  },
  {
    key: 'codex',
    label: 'Codex Skills',
    assetType: 'generated-skill',
    vendor: 'codex',
    outputPath: '.codex/skills',
    mirrorInstructionsToRnd: false,
    initAction: 'Create .codex/skills for each task',
    updateAction: 'Update .codex/skills for each task'
  },
  {
    key: 'claude',
    label: 'Claude Skills',
    assetType: 'generated-skill',
    vendor: 'claude',
    outputPath: '.claude/skills',
    mirrorInstructionsToRnd: false,
    initAction: 'Create .claude/skills for each task',
    updateAction: 'Update .claude/skills for each task',
    legacyPathForTask: (taskName) => `.claude/commands/${taskName}.md`
  }
];

const LEGACY_PLATFORM_ASSET_ALIASES = {
  github: ['github-skills', 'github-workflows']
};

function getPlatformAssets() {
  return PLATFORM_ASSETS.map(asset => ({ ...asset }));
}

function getPlatformAsset(key) {
  return PLATFORM_ASSETS.find(asset => asset.key === key);
}

function getDefaultPlatformAssetKeys() {
  return PLATFORM_ASSETS.map(asset => asset.key);
}

function normalizePlatformAssetSelection(selectedKeys = []) {
  const expanded = new Set();

  for (const key of selectedKeys) {
    if (LEGACY_PLATFORM_ASSET_ALIASES[key]) {
      for (const aliasKey of LEGACY_PLATFORM_ASSET_ALIASES[key]) {
        expanded.add(aliasKey);
      }
      continue;
    }

    if (getPlatformAsset(key)) {
      expanded.add(key);
    }
  }

  return PLATFORM_ASSETS
    .map(asset => asset.key)
    .filter(key => expanded.has(key));
}

function shouldMirrorInstructionsToRnd(selectedKeys = []) {
  const normalizedKeys = normalizePlatformAssetSelection(selectedKeys);
  return normalizedKeys.some(key => getPlatformAsset(key)?.mirrorInstructionsToRnd);
}

function getPlatformAssetPromptChoices(mode = 'init') {
  const actionKey = mode === 'update' ? 'updateAction' : 'initAction';

  return PLATFORM_ASSETS.map(asset => ({
    name: `${asset.label} -> ${asset[actionKey]}`,
    value: asset.key,
    checked: true
  }));
}

module.exports = {
  getPlatformAssets,
  getPlatformAsset,
  getDefaultPlatformAssetKeys,
  normalizePlatformAssetSelection,
  shouldMirrorInstructionsToRnd,
  getPlatformAssetPromptChoices
};
