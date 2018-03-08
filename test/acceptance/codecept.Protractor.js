const TestHelper = require('../support/TestHelper');

module.exports.config = {
  tests: './*_test.js', // TODO Change back to ./*_test.js
  timeout: 10000,
  output: './output',
  helpers: {
    Protractor: {
      url: TestHelper.siteUrl(),
      browser: 'chrome',
      angular: false,
      host: TestHelper.seleniumHost(),
      port: TestHelper.seleniumPort(),
      capabilities: {
        chromeOptions: {
          args: ['--headless', '--disable-gpu', '--window-size=1280,1024'],
        },
      },
    },

  },
  include: {},
  bootstrap: false,
  mocha: {},
  name: 'acceptance',
};
