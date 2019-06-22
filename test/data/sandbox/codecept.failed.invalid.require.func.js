exports.config = {
  tests: './invalid_require.test.js',
  timeout: 10000,
  output: './output',
  helpers: {
    FileSystem: {},
  },
  include: {},
  bootstrap: async () => {
    console.log('I am bootstrap');
  },
  teardown: async () => {
    console.log('I am teardown');
  },
  mocha: {},
  name: 'sandbox',
};
