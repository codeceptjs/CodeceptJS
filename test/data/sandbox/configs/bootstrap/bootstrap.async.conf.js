exports.config = {
  tests: './fs_test.js',
  timeout: 10000,
  output: './output',
  helpers: {
    FileSystem: {},
  },
  include: {},
  bootstrap: async () => {
    console.log('I am 0 bootstrap');
    await new Promise(done => {
      setTimeout(() => {
        console.log('I am bootstrap');
        done();
      }, 100);
    });
  },
  teardown: async () => {
    console.log('I am 0 teardown');
    await new Promise(done => {
      setTimeout(() => {
        console.log('I am teardown');
        done();
      }, 100);
    });
  },
  mocha: {},
  name: 'sandbox',
};
