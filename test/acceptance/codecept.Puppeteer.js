const TestHelper = require('../support/TestHelper.js');

module.exports.config = {
  tests: './*_test.js',
  timeout: 10000,
  output: './output',
  helpers: {
    Puppeteer: {
      url: TestHelper.siteUrl(),
      show: true,
      chrome: {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
        ],
      },
    },
  },
  include: {},
  bootstrap: false,
  mocha: {},
  name: 'acceptance',
};
