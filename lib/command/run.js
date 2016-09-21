'use strict';
let getConfig = require('./utils').getConfig;
let getTestRoot = require('./utils').getTestRoot;
let Codecept = require('../codecept');
let output = require('../output');

module.exports = function (suite, test, options) {
  // registering options globally to use in config
  process.profile = options.profile;

  let testRoot = getTestRoot(suite);
  let config = getConfig(testRoot);
  try {
    let codecept = new Codecept(config, options);
    codecept.init(testRoot);
    codecept.loadTests();
    codecept.run(test);
  } catch (err) {
    output.print('');
    output.error(err.message);
    output.print('');
    output.print(output.colors.grey(err.stack.replace(err.message, '')));
  }
};
