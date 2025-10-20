exports.config = {
  tests: '{./*does_not_exist_test.js,./*fs_test.glob.js}',
  timeout: 10000,
  output: './output',
  helpers: {
    FileSystem: {},
  },
  include: {},
  bootstrap: false,
  mocha: {},
  name: 'sandbox',
};
