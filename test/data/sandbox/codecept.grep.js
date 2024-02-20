export const config = {
  tests: './*_test.ddt.js',
  grep: 'accounts1',
  timeout: 10000,
  output: './output.js',
  helpers: {
    FileSystem: {},
  },
  include: {},
  bootstrap: false,
  mocha: {},
  name: 'sandbox',
};
