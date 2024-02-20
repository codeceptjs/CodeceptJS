export const config = {
  tests: './*_test.js',
  output: './output.js',
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
