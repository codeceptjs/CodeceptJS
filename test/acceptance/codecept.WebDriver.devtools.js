const TestHelper = require('../support/TestHelper');

module.exports.config = {
  tests: './*_test.js',
  timeout: 10000,
  output: './output',
  helpers: {
    WebDriver: {
      url: TestHelper.siteUrl(),
      browser: 'chrome',
      devToolsProtocol: true,
    },
    ScreenshotSessionHelper: {
      require: '../support/ScreenshotSessionHelper.js',
      outputPath: './output',
    },
    Expect: {},
  },
  include: {},
  bootstrap: async () => new Promise(done => {
    setTimeout(done, 5000);
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
};
