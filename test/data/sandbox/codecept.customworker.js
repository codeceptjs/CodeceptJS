exports.config = {
  tests: './custom-worker/*.js',
  timeout: 10000,
  output: './output',
  helpers: {
    FileSystem: {},
    Workers: {
      require: './workers_helper',
    },
  },
  include: {},
  bootstrap: async () => {
    process.stdout.write('bootstrap b1+');
    return new Promise(done => {
      setTimeout(() => {
        process.stdout.write('b2');
        done();
      }, 100);
    });
  },
  mocha: {},
  name: 'sandbox',
};
