export const config = {
  tests: './fs_test.js',
  timeout: 10000,
  output: './output.js',
  helpers: {
    FileSystem: {},
  },
  include: {},
  bootstrap: '../../bootstrap.sync.js',
  mocha: {},
  name: 'sandbox',
};
