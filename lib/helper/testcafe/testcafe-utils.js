const fs = require('fs');
const path = require('path');

const createTestFile = () => {
  // TODO Generate unique test files (concurrent test runs)
  const TESTFILE = path.join(__dirname, '_test.js');

  fs.writeFileSync(
    TESTFILE,
    'import testControllerHolder from "./testControllerHolder.js";\n\n' +
    'fixture("fixture")\n' +
    'test\n' +
    '("test", testControllerHolder.capture)',
  );

  return TESTFILE;
};

// TODO Better error mapping (actual, expected)
const mapError = (testcafeError) => {
  // console.log('TODO map error better', JSON.stringify(testcafeError, null, 2));
  throw new Error(testcafeError.errMsg);
};

const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
const ARGUMENT_NAMES = /([^\s,]+)/g;
const getParamNames = (func) => {
  let fnStr = func.toString().replace(STRIP_COMMENTS, '');

  const arrowIndex = fnStr.indexOf('=>');
  if (arrowIndex >= 0) {
    fnStr = fnStr.slice(0, arrowIndex);
  }

  const params = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')'));
  let result = params.match(ARGUMENT_NAMES);
  if (result === null) {
    result = [];
  }

  const fnWithoutParams = func.toString().replace(params, '()');
  // console.log(fnWithoutParams);

  return {
    paramNames: result,
    // eslint-disable-next-line no-new-func
    // eslint-disable-next-line no-eval
    fnWithoutParams: eval(fnWithoutParams),
  };
};

const createDependencies = (paramNames, args) => {
  return paramNames.reduce((res, paramName, i) => {
    res[paramName] = args[i];
    return res;
  }, {});
};

module.exports = {
  createTestFile,
  mapError,
  getParamNames,
  createDependencies,
};
