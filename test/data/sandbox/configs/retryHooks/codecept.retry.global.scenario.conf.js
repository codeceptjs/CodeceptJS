exports.config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
    CustomHelper: {
      require: './helper.js',
    },
  },
  retry: {
    Scenario: 3,
  },
  bootstrap: null,
  mocha: {},
  name: 'retryHooks',
};
