exports.config = {
  tests: './workers/*.js',
  timeout: 10000,
  output: './thisIsCustomOutputFolderName',
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
