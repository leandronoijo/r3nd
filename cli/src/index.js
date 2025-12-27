#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const { Command } = require('commander');
const { detectAvailableTools } = require('./lib/utils/toolDetector');

const pkg = require('../package.json');

// Guard against unhandled errors on stdio streams (e.g. EIO when a TTY is closed).
// Without these listeners, `process.stdin` errors can become unhandled and crash Node.
process.stdin && process.stdin.on && process.stdin.on('error', (err) => {
  if (err && err.code === 'EIO') {
    console.error('Terminal input closed unexpectedly (EIO). Continuing without interactive prompts.');
    return;
  }
  console.error('stdin error:', err && err.message ? err.message : err);
});
process.stdout && process.stdout.on && process.stdout.on('error', (err) => {
  // EPIPE/EIO can happen if output is closed; avoid crashing the CLI.
  if (err && (err.code === 'EPIPE' || err.code === 'EIO')) {
    // Silently ignore common broken-pipe / closed-tty errors.
    return;
  }
  console.error('stdout error:', err && err.message ? err.message : err);
});

async function main(argv = process.argv) {
  // Pre-detect tools once at startup (caches results for later use)
  detectAvailableTools();
  
  const program = new Command();
  program.name(pkg.name).version(pkg.version).description(pkg.description || 'r3nd CLI');

  // Auto-register command modules from src/commands
  const commandsDir = path.join(__dirname, 'commands');
  if (fs.existsSync(commandsDir)) {
    const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js') || fs.statSync(path.join(commandsDir, f)).isDirectory());
    for (const file of files) {
      const modPath = path.join(commandsDir, file);
      try {
        const mod = require(modPath);
        if (typeof mod.register === 'function') {
          mod.register(program);
        }
      } catch (err) {
        // don't crash on a bad command file - log and continue
        console.error(`Failed to load command ${file}:`, err && err.message ? err.message : err);
      }
    }
  }

  program.parseAsync(argv).catch(err => {
    console.error('CLI error:', err && err.message ? err.message : err);
    process.exit(1);
  });
}

if (require.main === module) {
  main();
}

module.exports = { main };
