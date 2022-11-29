exports.config = {
  tests: './fs_test.js',
  timeout: 10000,
  output: './output',
  helpers: {
    FileSystem: {},
  },
  include: {},
  bootstrap: '../../bootstrap.sync.js',
  mocha: {},
  name: 'sandbox',
};
