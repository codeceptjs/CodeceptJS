exports.config = {
  tests: './grep_test.js',
  timeout: 10000,
  output: './output',
  helpers: {
    FakeDriver: {
      require: '../fake_driver',
      browser: 'dummy',
      windowSize: 'maximize',
    },
  },
  include: {},
  bootstrap: false,
  mocha: {},
  name: 'sandbox',
};
