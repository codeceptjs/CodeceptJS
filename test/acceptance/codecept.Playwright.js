const TestHelper = require('../support/TestHelper');

module.exports.config = {
  tests: './*_test.js',
  timeout: 10000,
  output: './output',
  grep: '@Playwright',
  helpers: {
    Playwright: {
      url: TestHelper.siteUrl(),
      show: false,
      browser: process.env.BROWSER || 'chromium',
    },
    DigestHelper: {
      require: '../support/DigestHelper.js',
      outputPath: process.env.OUTPUT_PATH,
    },
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
