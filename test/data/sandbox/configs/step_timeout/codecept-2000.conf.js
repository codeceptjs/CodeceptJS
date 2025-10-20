exports.config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
    CustomHelper: {
      require: './customHelper.js',
    },
  },
  plugins: {
    stepTimeout: {
      enabled: true,
      timeout: 2,
      noTimeoutSteps: [
        'wait*',
      ],
    },
  },
  name: 'steps',
};
