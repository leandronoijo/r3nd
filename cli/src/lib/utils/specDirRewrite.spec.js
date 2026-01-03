const fs = require('fs').promises;
const os = require('os');
const path = require('path');

const {
  rewriteSpecDirContent,
  rewriteSpecDirBuffer,
  rewriteSpecDirInRepo
} = require('./specDirRewrite');

describe('specDirRewrite', () => {
  it('rewrites content using multiple source names', () => {
    const input = 'Use rnd/product_specs and r3nd/tech_specs for docs.';
    const result = rewriteSpecDirContent(input, ['rnd', 'r3nd'], 'specs');

    expect(result.changed).toBe(true);
    expect(result.content).toBe('Use specs/product_specs and specs/tech_specs for docs.');
  });

  it('only rewrites markdown buffers', () => {
    const buffer = Buffer.from('rnd/build_plans/test.md', 'utf-8');
    const mdResult = rewriteSpecDirBuffer(buffer, 'notes.md', ['rnd'], 'r3nd');
    const txtResult = rewriteSpecDirBuffer(buffer, 'notes.txt', ['rnd'], 'r3nd');

    expect(mdResult.changed).toBe(true);
    expect(mdResult.buffer.toString('utf-8')).toBe('r3nd/build_plans/test.md');
    expect(txtResult.changed).toBe(false);
    expect(txtResult.buffer.toString('utf-8')).toBe('rnd/build_plans/test.md');
  });

  it('rewrites markdown files in a repo tree', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'r3nd-rewrite-'));
    const mdPath = path.join(tempDir, 'doc.md');
    const txtPath = path.join(tempDir, 'doc.txt');

    await fs.writeFile(mdPath, 'rnd/one r3nd/two', 'utf-8');
    await fs.writeFile(txtPath, 'rnd/one', 'utf-8');

    const result = await rewriteSpecDirInRepo(tempDir, ['rnd', 'r3nd'], 'specs');
    const updated = await fs.readFile(mdPath, 'utf-8');
    const untouched = await fs.readFile(txtPath, 'utf-8');

    expect(result.scanned).toBe(1);
    expect(result.updated).toBe(1);
    expect(updated).toBe('specs/one specs/two');
    expect(untouched).toBe('rnd/one');
  });
});
