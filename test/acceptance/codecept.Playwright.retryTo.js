import TestHelper from '../support/TestHelper.js';

export const config = {
  tests: './*_test.js',
  timeout: 10,
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
