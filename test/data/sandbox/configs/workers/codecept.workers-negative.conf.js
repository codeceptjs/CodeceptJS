exports.config = {
  tests: '../../workers/negative_results/*.js',
  timeout: 10000,
  output: './output',
  helpers: {
    FileSystem: {},
  },
  include: {},
  mocha: {},
  name: 'sandbox',
};
