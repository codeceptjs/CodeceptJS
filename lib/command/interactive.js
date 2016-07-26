'use strict';

let getConfig = require('./utils').getConfig;
let getTestRoot = require('./utils').getTestRoot;
let recorder = require('../recorder');
let Codecept = require('../codecept');
let event = require('../event');

module.exports = function (path) {
  let testsPath = getTestRoot(path);
  let config = getConfig(testsPath);
  let codecept = new Codecept(config, {});
  codecept.init(testsPath);

  console.log("String interactive shell for current suite...");

  recorder.start();
  recorder.finishHandler(() => event.emit(event.test.teardown));
  event.emit(event.test.setup);
  require('../pause')();
  recorder.finalize();
};
