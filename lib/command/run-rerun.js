const {
  getConfig, printError, getTestRoot, createOutputDir,
} = require('./utils');
const Config = require('../config');
const Codecept = require('../rerun');

module.exports = async function (test, options) {
  // registering options globally to use in config
  process.profile = options.profile;
  process.env.profile = options.profile;
  const configFile = options.config;

  let config = getConfig(configFile);
  if (options.override) {
    config = Config.append(JSON.parse(options.override));
  }
  const testRoot = getTestRoot(configFile);
  createOutputDir(config, testRoot);

  const codecept = new Codecept(config, options);
  codecept.init(testRoot);

  try {
    await codecept.bootstrap();
    codecept.loadTests();
    await codecept.run(test);
  } catch (err) {
    printError(err);
    process.exitCode = 1;
  } finally {
    await codecept.teardown();
  }
};
