const { runWorktreeCreate, runWorktreeClean } = require('../lib/worktreeService');

function register(program) {
  const worktree = program
    .command('worktree')
    .description('Create and clean repo-scoped git worktrees under ~/.r3nd/worktrees');

  worktree
    .option('-br, --branch <name>', 'Branch name for the new worktree')
    .action(async (options) => {
      try {
        await runWorktreeCreate({ branch: options.branch });
      } catch (err) {
        console.error('Worktree creation failed:', err && err.message ? err.message : err);
        process.exit(1);
      }
    });

  worktree
    .command('clean')
    .description('Delete clean r3nd-managed worktrees for the current repository')
    .action(async () => {
      try {
        await runWorktreeClean();
      } catch (err) {
        console.error('Worktree cleanup failed:', err && err.message ? err.message : err);
        process.exit(1);
      }
    });
}

module.exports = { register };
