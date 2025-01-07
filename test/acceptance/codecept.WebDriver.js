const TestHelper = require('../support/TestHelper')

module.exports.config = {
  tests: './*_test.js',
  timeout: 20,
  output: './output',
  helpers: {
    WebDriver: {
      url: TestHelper.siteUrl(),
      browser: 'chrome',
      host: TestHelper.seleniumHost(),
      port: TestHelper.seleniumPort(),
      // disableScreenshots: true,
      desiredCapabilities: {
        chromeOptions: {
          args: ['--headless', '--disable-gpu', '--window-size=500,700'],
        },
      },
    },
    ScreenshotSessionHelper: {
      require: '../support/ScreenshotSessionHelper.js',
      outputPath: './output',
    },
    Expect: {
      require: '@codeceptjs/expect-helper',
    },
  },
  include: {},
  bootstrap: async () =>
    new Promise(done => {
      setTimeout(done, 5000)
    }), // let's wait for selenium
  mocha: {},
  name: 'acceptance',
  plugins: {
    screenshotOnFail: {
      enabled: true,
    },
  },
  gherkin: {
    features: './gherkin/*.feature',
    steps: ['./gherkin/steps.js'],
  },
}
