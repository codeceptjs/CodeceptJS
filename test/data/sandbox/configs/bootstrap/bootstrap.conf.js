exports.config = {
  tests: './fs_test.js',
  timeout: 10000,
  output: './output',
  helpers: {
    FileSystem: {},
  },
  include: {},
  bootstrap: () => console.log('I am bootstrap'),
  teardown: () => console.log('I am teardown'),
  mocha: {},
  name: 'sandbox',
};
