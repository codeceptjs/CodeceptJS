export const config = {
  tests: './workers-serial/*_test.js',
  timeout: 10000,
  output: './output',
  helpers: {
    FileSystem: {},
  },
  include: {},
  serial: '@serial',
  mocha: {},
  name: 'sandbox',
};
