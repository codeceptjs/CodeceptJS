export const config = {
  tests: './*_test.js',
  output: './output.js',
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
