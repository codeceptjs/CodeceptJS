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
      restart: process.env.BROWSER_RESTART || false,
      browser: process.env.BROWSER || 'chromium',
      ignoreHTTPSErrors: true,
      webkit: {
        ignoreHTTPSErrors: true,
      },
    },
    JSONResponse: {
      requestHelper: 'Playwright',
    },
    ScreenshotSessionHelper: {
      require: '../support/ScreenshotSessionHelper.js',
      outputPath: 'test/acceptance/output',
    },
    Expect: {},
  },
  include: {},
  bootstrap: false,
  mocha: {},
  plugins: {
    screenshotOnFail: {
      enabled: true,
    },
    retryTo: {
      enabled: true,
    },
  },
  name: 'acceptance',
  gherkin: {
    features: './gherkin/*.feature',
    steps: ['./gherkin/steps.js'],
  },
};
