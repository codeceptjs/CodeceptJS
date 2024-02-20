export const config = {
  tests: '../../workers/negative_results/*.js',
  timeout: 10000,
  output: './output.js',
  helpers: {
    FileSystem: {},
  },
  include: {},
  mocha: {},
  name: 'sandbox',
};
