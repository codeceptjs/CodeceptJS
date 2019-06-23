exports.config = {
  tests: './fs_test.js',
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
  mocha: {},
  name: 'sandbox',
};
