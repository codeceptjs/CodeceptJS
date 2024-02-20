export const config = {
  tests: './*_spec.js',
  output: './output.js',
  helpers: {
    CustomHelper: {
      require: './helper.js',
    },
  },
  retry: {
    BeforeSuite: 3,
    Before: 3,
  },
  bootstrap: null,
  mocha: {},
  name: 'retryHooks',
};
