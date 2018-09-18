const getParamNames = require('./utils').getParamNames;
const fsPath = require('path');
const fileExists = require('./utils').fileExists;

module.exports = function (hook, done, stage) {
  stage = stage || 'bootstrap';
  if (typeof hook === 'string') {
    const pluginFile = fsPath.join(global.codecept_dir, hook);
    if (!fileExists(pluginFile)) {
      throw new Error(`Hook ${pluginFile} doesn't exist`);
    }
    const callable = require(pluginFile);
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

function loadCustomHook(module) {
  try {
    if (module.startsWith('.')) {
      module = fsPath.resolve(global.codecept_dir, module); // custom plugin
    }
    return require(module);
  } catch (err) {
    throw new Error(`Could not load hook from module '${module}':\n${err.message}`);
  }
}

function callSync(callable, done) {
  if (isAsync(callable)) {
    callable(done);
  } else {
    callable();
    if (done) done();
  }
}

function isAsync(fn) {
  const params = getParamNames(fn);
  return params && params.length;
}
