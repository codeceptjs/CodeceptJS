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

module.exports = {
  createTestFile,
  mapError,
};
