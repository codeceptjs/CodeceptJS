'use strict';

let urils = require('../utils')
let getConfig = require('./utils').getConfig;
let getTestRoot = require('./utils').getTestRoot;
let Codecept = require('../codecept');
let container = require('../container');
let methodsOfObject = require('../utils').methodsOfObject;
let getParamNames = require('../utils').getParamNames;
let output = require('../output');

module.exports = function (path) {
  let testsPath = getTestRoot(path);
  let config = getConfig(testsPath);
  let codecept = new Codecept(config, {});
  codecept.init(testsPath);
  output.print('List of test actions: -- ');
  let helpers = container.helpers();
  for (let name in helpers) {
    let helper = helpers[name];
    methodsOfObject(helper).forEach((action) => {
      let params = getParamNames(helper[action]);
      if (params) params = params.join(', ');
      output.print(` ${output.colors.grey(name)} I.${output.colors.bold(action)}(${params})`);
    });
  }
  output.print('PS: Actions are retrieved from enabled helpers. ')
  output.print('Implement custom actions in your helper classes.');
};
