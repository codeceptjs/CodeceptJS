exports.config = {
  tests: './*_test2.js',
  output: './output',
  helpers: {
    CustomHelper: {
      require: './helper.js',
    },
  },
  bootstrap: null,
  mocha: {},
  name: 'retryHooks',
}
