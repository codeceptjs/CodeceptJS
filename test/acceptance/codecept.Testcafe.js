const TestHelper = require('../support/TestHelper');

module.exports.config = {
  tests: './*_test.js',
  timeout: 10000,
  output: './output',
  helpers: {
    Testcafe: {
      url: TestHelper.siteUrl(),
      show: true,
    },
    ExpectHelper: {},
  },
  include: {},
  bootstrap: false,
  mocha: {},
  name: 'acceptance',
  gherkin: {
    features: './gherkin/*.feature',
    steps: ['./gherkin/steps.js'],
  },
};
