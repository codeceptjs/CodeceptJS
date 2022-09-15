exports.config = {
  tests: './fs_test.js',
  timeout: 10000,
  output: './output',
  helpers: {
    FileSystem: {},
  },
  include: {},
  bootstrap: '../../hooks.js',
  teardown: '../../hooks.js',
  mocha: {},
  name: 'sandbox',
};
