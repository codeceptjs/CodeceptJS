exports.config = {
  tests: './*_test.js',
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
