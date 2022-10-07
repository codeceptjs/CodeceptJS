const { getConfig, getTestRoot } = require('./utils');
const { printError, createOutputDir } = require('./utils');
const Config = require('../config');
const Codecept = require('../rerun');

module.exports = async function (test, options) {
  // registering options globally to use in config
  // Backward compatibility for --profile
  process.profile = options.profile;
  process.env.profile = options.profile;
  const configFile = options.config;

  let config = getConfig(configFile);
  if (options.override) {
    config = Config.append(JSON.parse(options.override));
  }
  const testRoot = getTestRoot(configFile);
  createOutputDir(config, testRoot);

  function processError(err) {
    printError(err);
    process.exit(1);
  }
  const codecept = new Codecept(config, options);

  try {
    codecept.init(testRoot);

    await codecept.bootstrap();
    codecept.loadTests(test);
    await codecept.run();
  } catch (err) {
    printError(err);
    process.exitCode = 1;
  } finally {
    await codecept.teardown();
  }
};
