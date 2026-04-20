const YAML = require('yaml');

const { ConfigManager, VALID_CONFIG_KEYS } = require('../lib/config/configManager');
const { GitHubClient } = require('../lib/github/githubClient');
const { discoverAvailableOverlays } = require('../lib/overlays/overlaySeedService');
const { askOverlays, askSeedRepo } = require('../lib/ui/prompts');
const { rewriteSpecDirInRepo } = require('../lib/utils/specDirRewrite');
const logger = require('../lib/utils/logger');

function parseConfigValue(key, value) {
  if (key !== 'overlays' && key !== 'worktree-copy-files' && key !== 'worktree-open-command') {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }

  try {
    return YAML.parse(trimmed);
  } catch {
    return value;
  }
}

function formatConfigValue(value) {
  if (Array.isArray(value) || (value && typeof value === 'object')) {
    return YAML.stringify(value).trimEnd();
  }
  return String(value);
}

function register(program) {
  const config = program
    .command('config')
    .description('Manage r3nd configuration');

  config
    .command('get <key>')
    .description('Get a configuration value')
    .action(async (key) => {
      try {
        const configManager = new ConfigManager();
        
        if (!ConfigManager.isValidKey(key)) {
          logger.error(`Invalid config key: ${key}`);
          logger.info(`Valid keys: ${VALID_CONFIG_KEYS.join(', ')}`);
          process.exit(1);
        }

        const value = await configManager.get(key);
        if (value !== undefined) {
          const formatted = formatConfigValue(value);
          if (formatted.includes('\n')) {
            console.log(`${key}:`);
            console.log(formatted);
          } else {
            console.log(`${key}: ${formatted}`);
          }
        } else {
          logger.warn(`No value set for '${key}'`);
          const defaults = ConfigManager.getDefaults();
          if (defaults[key]) {
            logger.info(`Default value: ${defaults[key]}`);
          }
        }
      } catch (err) {
        logger.error('Failed to get config:', err && err.message ? err.message : err);
        process.exit(1);
      }
    });

  config
    .command('set <key> <value>')
    .description('Set a configuration value')
    .action(async (key, value) => {
      try {
        const configManager = new ConfigManager();
        
        if (!ConfigManager.isValidKey(key)) {
          logger.error(`Invalid config key: ${key}`);
          logger.info(`Valid keys: ${VALID_CONFIG_KEYS.join(', ')}`);
          process.exit(1);
        }

        // Validate seed-repo format
        if (key === 'seed-repo') {
          const parsed = ConfigManager.parseSeedRepo(value);
          if (!parsed) {
            logger.error(`Invalid seed-repo format: ${value}`);
            logger.info(`Expected format: owner/repo[@branch]`);
            logger.info(`Example: leandronoijo/r3nd@develop`);
            process.exit(1);
          }
        }

        const previousSpecDirName = key === 'spec-dir-name' ? await configManager.getSpecDirName() : null;
        const parsedValue = parseConfigValue(key, value);
        await configManager.set(key, parsedValue);

        const savedValue = await configManager.get(key);
        const formatted = formatConfigValue(savedValue);
        if (formatted.includes('\n')) {
          logger.info(`✓ Set ${key}:`);
          console.log(formatted);
        } else {
          logger.info(`✓ Set ${key} = ${formatted}`);
        }

        if (key === 'spec-dir-name' && previousSpecDirName && previousSpecDirName !== value) {
          const fromNames = ['rnd', 'r3nd', previousSpecDirName];
          const result = await rewriteSpecDirInRepo(process.cwd(), fromNames, value);
          logger.info(`✓ Updated ${result.updated} rewritable file(s) (scanned ${result.scanned}).`);
        }
      } catch (err) {
        logger.error('Failed to set config:', err && err.message ? err.message : err);
        process.exit(1);
      }
    });

  config
    .command('overlays')
    .description('Interactively configure overlays from the seed repository')
    .action(async () => {
      try {
        const configManager = new ConfigManager();
        let seedRepo = await configManager.get('seed-repo');

        if (!seedRepo) {
          logger.info('No seed repository configured.');
          seedRepo = await askSeedRepo(null, false);
          await configManager.set('seed-repo', seedRepo);
          logger.info(`✓ Configured seed-repo: ${seedRepo}\n`);
        }

        const githubClient = new GitHubClient();
        logger.info('Fetching file list from GitHub (seed repo)...');
        const tree = await githubClient.getTree();
        const availableOverlays = discoverAvailableOverlays(tree);
        const currentOverlays = await configManager.getOverlays();
        const selectedOverlays = await askOverlays(currentOverlays, availableOverlays, false);

        await configManager.set('overlays', selectedOverlays);

        if (selectedOverlays.length === 0) {
          logger.info('✓ Cleared overlays.');
          return;
        }

        logger.info(`✓ Set overlays = ${selectedOverlays.join(', ')}`);
      } catch (err) {
        logger.error('Failed to configure overlays:', err && err.message ? err.message : err);
        process.exit(1);
      }
    });

  config
    .command('list')
    .description('List all configuration values')
    .action(async () => {
      try {
        const configManager = new ConfigManager();
        const allConfig = await configManager.getAll();
        const defaults = ConfigManager.getDefaults();

        if (Object.keys(allConfig).length === 0) {
          logger.info('No configuration values set.');
          logger.info('\nDefault values:');
          for (const [key, value] of Object.entries(defaults)) {
            const formatted = formatConfigValue(value);
            if (formatted.includes('\n')) {
              console.log(`  ${key}:`);
              console.log(formatted);
              console.log('  (default)');
            } else {
              console.log(`  ${key}: ${formatted} (default)`);
            }
          }
        } else {
          logger.info('Configuration values:');
          for (const [key, value] of Object.entries(allConfig)) {
            const formatted = formatConfigValue(value);
            if (formatted.includes('\n')) {
              console.log(`  ${key}:`);
              console.log(formatted);
            } else {
              console.log(`  ${key}: ${formatted}`);
            }
          }
          
          // Show defaults for missing keys
          const missingKeys = Object.keys(defaults).filter(k => !(k in allConfig));
          if (missingKeys.length > 0) {
            logger.info('\nDefault values (not set):');
            for (const key of missingKeys) {
              const formatted = formatConfigValue(defaults[key]);
              if (formatted.includes('\n')) {
                console.log(`  ${key}:`);
                console.log(formatted);
                console.log('  (default)');
              } else {
                console.log(`  ${key}: ${formatted} (default)`);
              }
            }
          }
        }
      } catch (err) {
        logger.error('Failed to list config:', err && err.message ? err.message : err);
        process.exit(1);
      }
    });
}

module.exports = { register };
