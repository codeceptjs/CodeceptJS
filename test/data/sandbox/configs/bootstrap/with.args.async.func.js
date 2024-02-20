export const config = {
  tests: './fs_test.js',
  timeout: 10000,
  output: './output.js',
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
