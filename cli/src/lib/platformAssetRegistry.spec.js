const {
  getPlatformAssets,
  getPlatformAsset,
  getDefaultPlatformAssetKeys,
  normalizePlatformAssetSelection,
  shouldMirrorInstructionsToRnd,
  getPlatformAssetPromptChoices
} = require('./platformAssetRegistry');

describe('platformAssetRegistry', () => {
  it('returns all configured platform assets', () => {
    const assets = getPlatformAssets();
    expect(Array.isArray(assets)).toBe(true);
    expect(assets.map(asset => asset.key)).toEqual([
      'github-skills',
      'github-workflows',
      'cursor',
      'codex',
      'claude'
    ]);
  });

  it('returns a platform asset by key', () => {
    expect(getPlatformAsset('github-skills')).toMatchObject({
      key: 'github-skills',
      assetType: 'generated-skill',
      outputPath: '.github/skills'
    });
  });

  it('returns default platform asset keys in registry order', () => {
    expect(getDefaultPlatformAssetKeys()).toEqual([
      'github-skills',
      'github-workflows',
      'cursor',
      'codex',
      'claude'
    ]);
  });

  it('normalizes legacy github selection into the split asset keys', () => {
    expect(normalizePlatformAssetSelection(['github'])).toEqual([
      'github-skills',
      'github-workflows'
    ]);
  });

  it('preserves explicit split selections without duplication', () => {
    expect(normalizePlatformAssetSelection(['github', 'github-skills', 'cursor'])).toEqual([
      'github-skills',
      'github-workflows',
      'cursor'
    ]);
  });

  it('reports whether any selected assets require rnd instruction mirroring', () => {
    expect(shouldMirrorInstructionsToRnd(['github-skills', 'cursor'])).toBe(false);
  });

  it('builds init and update prompt choices from the registry', () => {
    expect(getPlatformAssetPromptChoices('init').map(choice => choice.value)).toEqual(getDefaultPlatformAssetKeys());
    expect(getPlatformAssetPromptChoices('update').map(choice => choice.value)).toEqual(getDefaultPlatformAssetKeys());
  });
});
