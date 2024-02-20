export const config = {
  tests: './*_test.js',
  output: './output.js',
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
