const { isFunction, isAsyncFunction } = require('./utils');
const output = require('./output');

module.exports = async function (hook, stage) {
  if (!hook) return;
  if (!isFunction(hook)) {
    throw new Error('CodeceptJS 3 allows bootstrap/teardown hooks only as async functions. More info: https://bit.ly/codecept3Up');
  }

  if (stage) output.log(`started ${stage} hook`);
  if (isAsyncFunction(hook)) {
    await hook();
  } else {
    hook();
  }
  if (stage) output.log(`finished ${stage} hook`);
};
