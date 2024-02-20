export const config = {
  tests: './*_test.js',
  output: './output.js',
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
