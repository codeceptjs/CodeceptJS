export const config = {
  tests: './fs_test.js',
  timeout: 10000,
  output: './output.js',
  helpers: {
    FileSystem: {},
  },
  include: {},
  bootstrap: '../../hooks.js',
  teardown: '../../hooks.js',
  mocha: {},
  name: 'sandbox',
};
