badFn();

export const config = {
  tests: '../../**/*.js',
  timeout: 10000,
  output: './output.js',
  helpers: {
    FileSystem: {},
  },
  include: {},
  mocha: {},
  name: 'sandbox',
};
