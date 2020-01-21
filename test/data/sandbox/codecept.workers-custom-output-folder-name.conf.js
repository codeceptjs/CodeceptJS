const currentTimestamp = Math.floor(Date.now() / 1000);

exports.config = {
  tests: './workers/*.js',
  timeout: 10000,
  output: `./customOutput_${currentTimestamp}`,
  helpers: {
    FileSystem: {},
    Workers: {
      require: './workers_helper',
    },
  },
  include: {},
  bootstrap: {},
  mocha: {},
  name: 'sandbox',
};
