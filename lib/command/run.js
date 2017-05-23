'use strict';
const getConfig = require('./utils').getConfig;
const getTestRoot = require('./utils').getTestRoot;
const deepMerge = require('./utils').deepMerge;
const fileExists = require('../utils').fileExists;
const path = require('path');
const fs = require('fs');
const Config = require('../config');
const Codecept = require('../codecept');
const output = require('../output');

module.exports = function (test, options) {
  // registering options globally to use in config
  process.profile = options.profile;
  let configFile = options.config;
  let codecept, outputDir;

  let testRoot = getTestRoot(configFile);
  let config = getConfig(configFile);
  if (options.override) {
    config = Config.append(JSON.parse(options.override));
  }

  if (!fileExists(outputDir = path.join(testRoot, config.output))) {
    output.print('creating output directory: ' + outputDir);
    fs.mkdirSync(outputDir);
  }

  try {
    codecept = new Codecept(config, options);
    codecept.init(testRoot, function (err) {
      if (err) throw new Error('Error while running bootstrap file :' + err);
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
