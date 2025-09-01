exports.config = {
  tests: './*_test.js',
  timeout: 10000,
  output: './_output',
  helpers: {
    FileSystem: {},
  },
  include: {},
  bootstrap: false,
  mocha: {},
  name: 'failed-tests',
};
