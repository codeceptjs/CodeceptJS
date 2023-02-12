exports.config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
    CustomHelper: {
      require: './customHelper.js',
    },
  },
  timeout: [
    {
      grep: 'no timeout',
      Scenario: 0.3,
    },
  ],
  name: 'steps',
};
