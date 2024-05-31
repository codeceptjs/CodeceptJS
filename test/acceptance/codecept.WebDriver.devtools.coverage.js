const TestHelper = require('../support/TestHelper');

module.exports.config = {
  tests: './*_test.js',
  timeout: 10000,
  output: './output',
  helpers: {
    WebDriver: {
      url: TestHelper.siteUrl(),
      browser: 'Chromium',
      windowSize: '500x700',
      devtoolsProtocol: true,
      waitForTimeout: 5000,
      capabilities: {
        chromeOptions: {
          args: ['--headless', '--disable-gpu', '--window-size=500,700'],
        },
      },
    },
    ScreenshotSessionHelper: {
      require: '../support/ScreenshotSessionHelper.js',
      outputPath: './output',
    },
    ExpectHelper: {},
  },
  include: {},
  mocha: {},
  name: 'acceptance',
  plugins: {
    screenshotOnFail: {
      enabled: true,
    },
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
  gherkin: {
    features: './gherkin/*.feature',
    steps: ['./gherkin/steps.js'],
  },
};
