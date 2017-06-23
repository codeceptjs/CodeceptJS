'use strict';

let getParamNames = require('./utils').getParamNames;
let fsPath = require('path');
let fileExists = require('./utils').fileExists;

module.exports = function (hook, done, stage) {
  stage = stage || 'bootstrap';
  if (typeof hook === 'string' && fileExists(fsPath.join(codecept_dir, hook))) {
    var callable = require(fsPath.join(codecept_dir, hook));
    if (typeof callable === 'function') {
      callSync(callable, done);
      return;
    }
    if (typeof callable === 'object' && callable[stage]) {
      callSync(callable[stage], done);
      return;
    }
  } else if (typeof hook === 'function') {
    callSync(hook, done);
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
    if (done) done();
  }
}

function isAsync(fn) {
  let params = getParamNames(fn);
  return params && params.length;
}
