exports.config = {
  tests: '{./workers/base_test.workers.js,./workers/test_grep.workers.js}',
  timeout: 10000,
  output: './output',
  helpers: {
    FileSystem: {},
    Workers: {
      require: './workers_helper',
    },
  },
  include: {},
  bootstrap: (done) => {
    process.stdout.write('bootstrap b1+');
    setTimeout(() => {
      process.stdout.write('b2');
      done();
    }, 1000);
  },
  mocha: {},
  name: 'sandbox',
};
