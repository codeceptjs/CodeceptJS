exports.config = {
  tests: './*_test.ddt.js',
  grep: 'accounts1',
  timeout: 10000,
  output: './output',
  helpers: {
    FileSystem: {},
  },
  include: {},
  bootstrap: false,
  mocha: {},
  name: 'sandbox',
};
