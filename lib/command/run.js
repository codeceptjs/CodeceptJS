const mkdirp = require('mkdirp');
const path = require('path');

const { getConfig, getTestRoot } = require('./utils');
const printError = require('./utils').printError;
const createOutputDir = require('./utils').createOutputDir;
const Config = require('../config');
const Codecept = require('../codecept');

module.exports = function (test, options) {
  // registering options globally to use in config
  // Backward compatibility for --profile
  process.profile = options.profile;
  process.env.profile = options.profile;
  const configFile = options.config;
  let codecept;

  let config = getConfig(configFile);
  if (options.override) {
    config = Config.append(JSON.parse(options.override));
  }
  const testRoot = getTestRoot(configFile);
  createOutputDir(config, testRoot);

  try {
    codecept = new Codecept(config, options);
    codecept.init(testRoot);

    codecept.runBootstrap((err) => {
      if (err) throw new Error(`Error while running bootstrap file :${err}`);

      codecept.loadTests();
      codecept.run(test);
    });
  } catch (err) {
    printError(err);
    process.exit(1);
  }
};
