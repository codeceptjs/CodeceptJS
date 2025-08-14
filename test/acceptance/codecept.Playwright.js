import TestHelper from '../support/TestHelper.js'

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
      customLocatorStrategies: {
        byRole: (selector, root) => {
          return root.querySelector(`[role="${selector}"]`)
        },
        byTestId: (selector, root) => {
          return root.querySelector(`[data-testid="${selector}"]`)
        },
        byDataQa: (selector, root) => {
          return root.querySelectorAll(`[data-qa="${selector}"]`)
        },
        byAriaLabel: (selector, root) => {
          return root.querySelector(`[aria-label="${selector}"]`)
        },
        byPlaceholder: (selector, root) => {
          return root.querySelector(`[placeholder="${selector}"]`)
        },
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
  bootstrap: false,
  mocha: {},
  plugins: {
    screenshotOnFail: {
      enabled: true,
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
