'use strict';
let getConfig = require('./utils').getConfig;
let getTestRoot = require('./utils').getTestRoot;
let deepMerge = require('./utils').deepMerge;
let Codecept = require('../codecept');
let output = require('../output');

module.exports = function (suite, test, options) {
  // registering options globally to use in config
  process.profile = options.profile;
  let configFile = options.config;
  let codecept;

  let testRoot = getTestRoot(suite);
  let config = getConfig(testRoot, configFile);

  // override config with options
  if (options.override) {
    config = deepMerge(config, JSON.parse(options.override));
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
  }
};
