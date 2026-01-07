const { inferSpecDirBase } = require('./specDirInference');

describe('specDirInference', () => {
  describe('inferSpecDirBase', () => {
    it('should infer spec dir base from nested file path', () => {
      expect(inferSpecDirBase('workspaces/disputes/sdlc/tech_specs/file.md', 'sdlc'))
        .toBe('workspaces/disputes');
    });

    it('should infer spec dir base from deeper nested path', () => {
      expect(inferSpecDirBase('apps/my-app/rnd/build_plans/plan.md', 'rnd'))
        .toBe('apps/my-app');
    });

    it('should return empty string when spec dir is at root level', () => {
      expect(inferSpecDirBase('sdlc/tech_specs/file.md', 'sdlc'))
        .toBe('');
    });

    it('should return empty string when spec dir is at root level (r3nd)', () => {
      expect(inferSpecDirBase('r3nd/product_specs/spec.md', 'r3nd'))
        .toBe('');
    });

    it('should return empty string when file path is null', () => {
      expect(inferSpecDirBase(null, 'sdlc'))
        .toBe('');
    });

    it('should return empty string when spec dir name is null', () => {
      expect(inferSpecDirBase('workspaces/disputes/sdlc/tech_specs/file.md', null))
        .toBe('');
    });

    it('should return empty string when spec dir not found in path', () => {
      expect(inferSpecDirBase('file.md', 'sdlc'))
        .toBe('');
    });

    it('should handle Windows-style paths', () => {
      expect(inferSpecDirBase('workspaces\\disputes\\sdlc\\tech_specs\\file.md', 'sdlc'))
        .toBe('workspaces/disputes');
    });

    it('should handle single-level base path', () => {
      expect(inferSpecDirBase('workspace/rnd/tech_specs/file.md', 'rnd'))
        .toBe('workspace');
    });
  });
});
