exports.config = {
  tests: './invalid_require_test.js',
  timeout: 10000,
  output: './output',
  helpers: {
    FileSystem: {},
  },
  include: {},
  bootstrap: async (done) => {
    console.log('I am bootstrap');
    done();
  },
  teardown: (done) => {
    console.log('I am teardown');
    done();
  },
  mocha: {},
  name: 'sandbox',
};
