exports.config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
    CustomHelper: {
      require: './helper.js',
    },
  },
  bootstrap: null,
  mocha: {},
  name: 'retryHooks',
};
