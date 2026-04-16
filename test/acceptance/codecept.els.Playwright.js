import TestHelper from '../support/TestHelper.js'

export const config = {
  tests: './els_test.js',
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
      waitForTimeout: 5000,
      waitForAction: 500,
      chromium: {
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      },
    },
  },
  include: {},
  bootstrap: false,
  mocha: {},
  plugins: {
    screenshotOnFail: {
      enabled: true,
    },
  },
  name: 'acceptance',
}
