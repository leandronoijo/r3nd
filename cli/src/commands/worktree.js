const { runWorktree, runWorktreeCreate, runWorktreeList, runWorktreeClean } = require('../lib/worktreeService');

function register(program) {
  const worktree = program
    .command('worktree [branch]')
    .description('Create and clean repo-scoped git worktrees under ~/.r3nd/worktrees');

  worktree
    .option('-l, --list', 'List all worktrees for the current repository')
    .option('-nc, --no-command', 'Return the worktree directory and skip the open command')
    .option('-br, --branch <name>', 'Branch name for the new worktree')
    .action(async (branchArg, options) => {
      try {
        if (options.list) {
          const output = await runWorktreeList();
          if (output) {
            console.log(output);
          }
          return;
        }

        const branch = options.branch || branchArg;
        // Commander sets options.command=false for --no-command (negation flag), not options.noCommand
        const noCommand = !options.command;
        const result = branch
          ? await runWorktreeCreate({ branch, noCommand })
          : await runWorktree({ noCommand });

        if (noCommand && result && result.path) {
          console.log(result.path);
          return;
        }
      } catch (err) {
        console.error('Worktree command failed:', err && err.message ? err.message : err);
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
