export const config = {
  tests: './*_test.js',
  output: './output.js',
  helpers: {
    CustomHelper: {
      require: './helper.js',
    },
  },
  bootstrap: null,
  mocha: {},
  name: 'retryHooks',
};
