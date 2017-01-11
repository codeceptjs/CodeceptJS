'use strict';

let getConfig = require('./utils').getConfig;
let getTestRoot = require('./utils').getTestRoot;
let recorder = require('../recorder');
let Codecept = require('../codecept');
let event = require('../event');
let output = require('../output');

module.exports = function (path, options) {

  process.profile = options.profile;

  let testsPath = getTestRoot(path);
  let config = getConfig(testsPath);
  let codecept = new Codecept(config, options);
  codecept.init(testsPath, function (err) {
    if (err) {
      output.error('Error while running bootstrap file :' + err);
      return;
    }

    if (options.verbose) output.level(3);

    output.print("String interactive shell for current suite...");
    recorder.start();
    event.emit(event.suite.before, {});
    event.emit(event.test.before);
    require('../pause')();
    recorder.add(() => event.emit(event.test.after));
    recorder.add(() => event.emit(event.suite.after, {}));
    recorder.add(() => codecept.teardown());
  });
};
