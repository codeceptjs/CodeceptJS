'use strict';

let getParamNames = require('./utils').getParamNames;
let fsPath = require('path');
let fileExists = require('./utils').fileExists;

module.exports = function (hook, config, done) {
  if (typeof config[hook] === 'string' && fileExists(fsPath.join(codecept_dir, config[hook]))) {
    var callable = require(fsPath.join(codecept_dir, config[hook]));
    if (typeof callable === 'function') {
      callSync(callable, done);
      return;
    }
    if (typeof callable === 'object' && callable[hook]) {
      callSync(callable[hook], done);
      return;
    }
  } else if (typeof config[hook] === 'function') {
    callSync(config[hook], done);
    return;
  }
  // if async - call done
  if (done) done();
};

function callSync(callable, done) {
  if (isAsync(callable)) {
    callable(done);
  } else {
    callable();
    done();
  }
}

function isAsync(fn) {
  let params = getParamNames(fn);
  return params && params.length;
}
