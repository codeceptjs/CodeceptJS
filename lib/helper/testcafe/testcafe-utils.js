const { ClientFunction } = require('testcafe');

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { getParamNames } = require('../../utils');

const createTestFile = () => {
  assert(global.output_dir, 'global.output_dir must be set');

  const testFile = path.join(global.output_dir, `${Date.now()}_test.js`);
  const testControllerHolderDir = __dirname.replace(/\\/g, '/');

  fs.writeFileSync(
    testFile,
    `import testControllerHolder from "${testControllerHolderDir}/testControllerHolder.js";\n\n
    fixture("fixture")\n
    test\n
    ("test", testControllerHolder.capture)`,
  );

  return testFile;
};

// TODO Better error mapping (actual, expected)
const mapError = (testcafeError) => {
  // console.log('TODO map error better', JSON.stringify(testcafeError, null, 2));
  if (testcafeError.errMsg) {
    throw new Error(testcafeError.errMsg);
  }
  const errorInfo = `${testcafeError.callsite ? JSON.stringify(testcafeError.callsite) : ''} ${testcafeError.apiFnChain || JSON.stringify(testcafeError)}`;
  throw new Error(`TestCafe Error: ${errorInfo}`);
};

function createClientFunction(func, args) {
  if (!args || !args.length) {
    return ClientFunction(func);
  }
  const paramNames = getParamNames(func);
  const dependencies = {};
  paramNames.forEach((param, i) => dependencies[param] = args[i]);

  return ClientFunction(getFuncBody(func), { dependencies });
}

function getFuncBody(func) {
  let fnStr = func.toString();
  const arrowIndex = fnStr.indexOf('=>');
  if (arrowIndex >= 0) {
    fnStr = fnStr.slice(arrowIndex + 2);
    // eslint-disable-next-line no-new-func
    // eslint-disable-next-line no-eval
    return eval(`() => ${fnStr}`);
  }
  // TODO: support general functions
}

module.exports = {
  createTestFile,
  mapError,
  createClientFunction,
};
