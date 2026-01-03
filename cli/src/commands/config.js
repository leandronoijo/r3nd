const { ConfigManager } = require('../lib/config/configManager');
const { rewriteSpecDirInRepo } = require('../lib/utils/specDirRewrite');
const logger = require('../lib/utils/logger');

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
          logger.info(`Valid keys: seed-repo, spec-dir-name`);
          process.exit(1);
        }

        const value = await configManager.get(key);
        if (value !== undefined) {
          console.log(`${key}: ${value}`);
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
          logger.info(`Valid keys: seed-repo, spec-dir-name`);
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
        await configManager.set(key, value);
        logger.info(`✓ Set ${key} = ${value}`);

        if (key === 'spec-dir-name' && previousSpecDirName && previousSpecDirName !== value) {
          const fromNames = ['rnd', previousSpecDirName];
          const result = await rewriteSpecDirInRepo(process.cwd(), fromNames, value);
          logger.info(`✓ Updated ${result.updated} markdown file(s) (scanned ${result.scanned}).`);
        }
      } catch (err) {
        logger.error('Failed to set config:', err && err.message ? err.message : err);
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
            console.log(`  ${key}: ${value} (default)`);
          }
        } else {
          logger.info('Configuration values:');
          for (const [key, value] of Object.entries(allConfig)) {
            console.log(`  ${key}: ${value}`);
          }
          
          // Show defaults for missing keys
          const missingKeys = Object.keys(defaults).filter(k => !(k in allConfig));
          if (missingKeys.length > 0) {
            logger.info('\nDefault values (not set):');
            for (const key of missingKeys) {
              console.log(`  ${key}: ${defaults[key]} (default)`);
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
