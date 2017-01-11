'use strict';

let urils = require('../utils');
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
  codecept.init(testsPath, function (err) {
    if (err) {
      output.error('Error while running bootstrap file :' + err);
      return;
    }

    output.print('List of test actions: -- ');
    let helpers = container.helpers();
    let suppportI = container.support('I');
    let actions = [];
    for (let name in helpers) {
      let helper = helpers[name];
      methodsOfObject(helper).forEach((action) => {
        let params = getParamNames(helper[action]);
        if (params) params = params.join(', ');
        actions[action] = 1;
        output.print(` ${output.colors.grey(name)} I.${output.colors.bold(action)}(${params})`);
      });
    }
    for (let name in suppportI) {
      if (actions[name]) {
        continue;
      }
      let actor = suppportI[name];
      let params = getParamNames(actor);
      if (params) params = params.join(', ');
      if (!params) params = '';
      output.print(` I.${output.colors.bold(name)}(${params})`);
    }
    output.print('PS: Actions are retrieved from enabled helpers. ');
    output.print('Implement custom actions in your helper classes.');

    codecept.teardown();
  });
};
