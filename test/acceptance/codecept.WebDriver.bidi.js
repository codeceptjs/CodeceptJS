const TestHelper = require('../support/TestHelper')

module.exports.config = {
  tests: './webdriver_bidi_test.js',
  timeout: 30,
  output: './output',
  helpers: {
    WebDriver: {
      url: TestHelper.siteUrl(),
      browser: 'chrome',
      host: TestHelper.seleniumHost(),
      port: TestHelper.seleniumPort(),
      bidiProtocol: true, // Enable BiDi protocol
      desiredCapabilities: {
        chromeOptions: {
          args: ['--headless', '--disable-gpu', '--window-size=500,700', '--no-sandbox', '--disable-dev-shm-usage'],
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
  name: 'webdriver-bidi-acceptance',
  plugins: {
    screenshotOnFail: {
      enabled: true,
    },
  },
}
