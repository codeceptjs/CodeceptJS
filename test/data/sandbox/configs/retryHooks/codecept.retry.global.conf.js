exports.config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
    CustomHelper: {
      require: './helper.js',
    },
  },
  retry: 2,
  bootstrap: null,
  mocha: {},
  name: 'retryHooks',
};
