export const config = {
  tests: './invalid_require.test.js',
  timeout: 10000,
  output: './output.js',
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
