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
      browser: ['chromium', 'webkit', 'firefox', 'electron'].includes(process.env.BROWSER) ? process.env.BROWSER : 'chromium',
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
    Expect: {
      require: '@codeceptjs/expect-helper',
    },
  },
  include: {},
  bootstrap: installCodeceptjs,
  mocha: {},
  plugins: {
    coverage: {
      enabled: true,
      debug: true,
      name: 'CodeceptJS Coverage Report',
      sourceFilter: '**/src/**',
      sourcePath: {
        'todomvc-react/': '',
        'todomvc.com/examples/react/': '',
      },
      outputDir: 'output/coverage',
    },
  },
  name: 'acceptance',
  gherkin: {
    features: './gherkin/*.feature',
    steps: ['./gherkin/steps.js'],
  },
}
