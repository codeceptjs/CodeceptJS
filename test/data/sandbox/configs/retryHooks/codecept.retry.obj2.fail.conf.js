exports.config = {
  tests: './*_spec.js',
  output: './output',
  helpers: {
    CustomHelper: {
      require: './helper.js',
    },
  },
  retry: [
    {
      grep: 'no timeout',
      BeforeSuite: 3,
      Before: 3,
    },
  ],
  bootstrap: null,
  mocha: {},
  name: 'retryHooks',
};
