'use strict';
let getConfig = require('./utils').getConfig;
let getTestRoot = require('./utils').getTestRoot;
var Codecept = require('../codecept');

module.exports = function (suite, test, options) {
  console.log('CodeceptJS v' + Codecept.version());
  let testRoot = getTestRoot(suite);
  let config = getConfig(testRoot);
  try {    
    let codecept = new Codecept(config, options);
    codecept.init(testRoot);
    codecept.loadTests();  
    codecept.run(test);
  } catch (err) {
    let output = require('../output');
    output.print('');
    output.error(err.message);
    output.print('');
    output.print(output.colors.grey(err.stack.replace(err.message, '')));
  }
};
