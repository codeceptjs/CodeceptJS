const getConfig = require('./utils').getConfig;
const getTestRoot = require('./utils').getTestRoot;
const fileExists = require('../utils').fileExists;
const path = require('path');
const mkdirp = require('mkdirp');
const Config = require('../config');
const Codecept = require('../codecept');
const output = require('../output');

module.exports = function (test, options) {
  // registering options globally to use in config
  process.profile = options.profile;
  const configFile = options.config;
  let codecept;
  let outputDir;

  const testRoot = getTestRoot(configFile);
  let config = getConfig(configFile);
  if (options.override) {
    config = Config.append(JSON.parse(options.override));
  }

  if (path.isAbsolute(config.output)) outputDir = config.output;
  else outputDir = path.join(testRoot, config.output);

  if (!fileExists(outputDir)) {
    output.print(`creating output directory: ${outputDir}`);
    mkdirp.sync(outputDir);
  }

  try {
    codecept = new Codecept(config, options);
    codecept.init(testRoot);

    codecept.runBootstrap((err) => {
      if (err) throw new Error(`Error while running bootstrap file :${err}`);

      codecept.loadTests();
      codecept.run(test);
    });
  } catch (err) {
    output.print('');
    output.error(err.message);
    output.print('');
    output.print(output.colors.grey(err.stack.replace(err.message, '')));
    process.exit(1);
  }
};
