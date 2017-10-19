const TestHelper = require('/test/support/TestHelper');

module.exports.config = {
  tests: "./*_test.js",
  timeout: 10000,
  output: "./output",
  helpers: {
    WebDriverIO: {
      url: TestHelper.siteUrl(),
      browser: "chrome",
      host: TestHelper.seleniumHost(),
      port: TestHelper.seleniumPort()
    }

  },
  include: {},
  bootstrap: false,
  mocha: {},
  name: "acceptance"
}
