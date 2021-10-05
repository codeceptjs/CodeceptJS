exports.config = {
  tests: './*_test.js',
  output: './output',
  stepTimeout: 500,
  stepTimeoutOverride: [
    {
      pattern: 'wait.*',
      timeout: 0,
    },
  ],
  helpers: {
    CustomHelper: {
      require: './customHelper.js',
    },
  },
  plugins: {
  },
  name: 'steps',
};
