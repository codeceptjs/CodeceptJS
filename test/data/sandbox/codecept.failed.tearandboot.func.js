exports.config = {
  tests: './*_test.js',
  timeout: 10000,
  output: './output',
  helpers: {
    FileSystem: {},
  },
  include: {},
  bootstrap: async () => {
    console.log('I am bootstrap');
    throw new Error('Error from async bootstrap');
  },
  teardown: () => {
    console.log('I am teardown');
  },
  mocha: {},
  name: 'sandbox',
};
