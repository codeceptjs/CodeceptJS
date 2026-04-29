import TestHelper from '../support/TestHelper.js'
import installCodeceptjs from '../support/install-codeceptjs.js'

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
      waitForTimeout: 5000,
      waitForAction: 500,
      chromium: {
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      },
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
    '@codeceptjs/expect-helper': {},
  },
  include: {},
  bootstrap: installCodeceptjs,
  mocha: {},
  plugins: {
    screenshot: {
      enabled: true,
      on: 'fail',
    },
    retryFailedStep: {
      enabled: true,
    },
  },
  name: 'acceptance',
  gherkin: {
    features: './gherkin/*.feature',
    steps: ['./gherkin/steps.js'],
  },
}
