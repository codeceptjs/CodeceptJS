exports.config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
    CustomHelper: {
      require: './customHelper.js',
    },
  },
  rerun: {
    // how many times all tests in suite must pass
    minSuccess: 3,
    // how many times we can try to rerun all test suite for reaching minSuccess count of passed test suite
    maxReruns: 3,
  },
  bootstrap: null,
  mocha: {},
  name: 'run-rerun',
};
