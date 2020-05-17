const TestHelper = require('../support/TestHelper');

module.exports.config = {
  tests: './*_test.js',
  timeout: 10000,
  output: './output',
  helpers: {
    Protractor: {
      url: TestHelper.siteUrl(),
      browser: 'chrome',
      restart: true,
      angular: false,
      driver: 'hosted',
      seleniumAddress: TestHelper.seleniumAddress(),
      // capabilities: {
      //   chromeOptions: {
      //     args: ['--headless', '--disable-gpu', '--window-size=1280,1024'],
      //   },
      // },
    },

  },
  include: {},
  bootstrap: async () => new Promise(done => setTimeout(done, 5000)), // let's wait for selenium
  mocha: {},
  name: 'acceptance',
  gherkin: {
    features: './gherkin/*.feature',
    steps: ['./gherkin/steps.js'],
  },

};
