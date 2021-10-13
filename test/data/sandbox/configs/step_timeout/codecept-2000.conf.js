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
      timeout: 1.5,
      noTimeoutSteps: [
        'wait*',
      ],
    },
  },
  name: 'steps',
};
