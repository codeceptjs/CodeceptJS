const TestHelper = require('../support/TestHelper');

module.exports.config = {
  tests: './*_test.js',
  timeout: 10000,
  output: './output',
  helpers: {
    WebDriver: {
      url: TestHelper.siteUrl(),
      browser: 'chrome',
      host: TestHelper.seleniumHost(),
      port: TestHelper.seleniumPort(),
      // disableScreenshots: true,
      // desiredCapabilities: {
      //   chromeOptions: {
      //     args: ['--headless', '--disable-gpu', '--window-size=1280,1024'],
      //   },
      // },
    },
    MockRequest: {},
    ScreenshotSessionHelper: {
      require: '../support/ScreenshotSessionHelper.js',
      outputPath: './output',
    },
  },
  include: {},
  bootstrap: done => setTimeout(done, 5000), // let's wait for selenium
  mocha: {},
  name: 'acceptance',
  gherkin: {
    features: './gherkin/*.feature',
    steps: ['./gherkin/steps.js'],
  },
};
